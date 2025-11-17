import { getSupabaseClientSafe } from "@/lib/supabase/serverClient";

export async function POST(request) {
  try {
    const supabase = getSupabaseClientSafe(true);
    if (!supabase) {
      return Response.json(
        { message: "Serviço temporariamente indisponível" },
        { status: 503 }
      );
    }

    const { compradorId, avatarId } = await request.json();

    if (!compradorId || !avatarId) {
      return Response.json(
        { message: "Dados incompletos" },
        { status: 400 }
      );
    }

    // Buscar avatar à venda
    const { data: avatar, error: avatarError } = await supabase
      .from('avatares')
      .select('*')
      .eq('id', avatarId)
      .eq('em_venda', true)
      .single();

    if (avatarError || !avatar) {
      return Response.json(
        { message: "Avatar não encontrado ou não está à venda" },
        { status: 404 }
      );
    }

    // Não pode comprar próprio avatar
    if (avatar.user_id === compradorId) {
      return Response.json(
        { message: "Você não pode comprar seu próprio avatar" },
        { status: 400 }
      );
    }

    // Verificar limite de avatares do comprador
    const { data: avataresComprador, error: countError } = await supabase
      .from('avatares')
      .select('id, vivo, marca_morte')
      .eq('user_id', compradorId);

    if (countError) {
      return Response.json(
        { message: "Erro ao verificar limite de avatares" },
        { status: 500 }
      );
    }

    const LIMITE_AVATARES = 15;
    const avataresConta = avataresComprador.filter(av => !(av.marca_morte && !av.vivo)).length;

    if (avataresConta >= LIMITE_AVATARES) {
      return Response.json(
        { message: "Você atingiu o limite de 15 avatares! Libere espaço antes de comprar." },
        { status: 400 }
      );
    }

    // Buscar stats do comprador
    const { data: statsComprador, error: statsCompradorError } = await supabase
      .from('player_stats')
      .select('*')
      .eq('user_id', compradorId)
      .single();

    if (statsCompradorError || !statsComprador) {
      return Response.json(
        { message: "Dados do comprador não encontrados" },
        { status: 404 }
      );
    }

    // Verificar se comprador tem recursos suficientes
    const precoMoedas = avatar.preco_venda || 0;
    const precoFragmentos = avatar.preco_fragmentos || 0;

    if (statsComprador.moedas < precoMoedas) {
      return Response.json(
        { message: `Moedas insuficientes! Necessário: ${precoMoedas}, Você tem: ${statsComprador.moedas}` },
        { status: 400 }
      );
    }

    if (statsComprador.fragmentos < precoFragmentos) {
      return Response.json(
        { message: `Fragmentos insuficientes! Necessário: ${precoFragmentos}, Você tem: ${statsComprador.fragmentos}` },
        { status: 400 }
      );
    }

    // Buscar stats do vendedor
    const { data: statsVendedor, error: statsVendedorError } = await supabase
      .from('player_stats')
      .select('*')
      .eq('user_id', avatar.user_id)
      .single();

    if (statsVendedorError || !statsVendedor) {
      return Response.json(
        { message: "Dados do vendedor não encontrados" },
        { status: 404 }
      );
    }

    // Taxa do mercado (5% para moedas, nenhuma para fragmentos)
    const taxaMoedas = Math.floor(precoMoedas * 0.05);
    const valorVendedorMoedas = precoMoedas - taxaMoedas;
    const valorVendedorFragmentos = precoFragmentos; // Sem taxa para fragmentos

    // Realizar transação
    // 1. Transferir avatar para comprador
    const { error: transferError } = await supabase
      .from('avatares')
      .update({
        user_id: compradorId,
        em_venda: false,
        preco_venda: null,
        preco_fragmentos: null,
        ativo: false,
        vinculo: 0, // Resetar vínculo com novo dono
        exaustao: 0 // Resetar exaustão
      })
      .eq('id', avatarId);

    if (transferError) {
      console.error("Erro ao transferir avatar:", transferError);
      return Response.json(
        { message: "Erro ao transferir avatar" },
        { status: 500 }
      );
    }

    // 2. Deduzir recursos do comprador
    const { error: compradorError } = await supabase
      .from('player_stats')
      .update({
        moedas: statsComprador.moedas - precoMoedas,
        fragmentos: statsComprador.fragmentos - precoFragmentos
      })
      .eq('user_id', compradorId);

    if (compradorError) {
      console.error("Erro ao atualizar recursos do comprador:", compradorError);
      // Reverter transferência
      await supabase
        .from('avatares')
        .update({
          user_id: avatar.user_id,
          em_venda: true,
          preco_venda: precoMoedas,
          preco_fragmentos: precoFragmentos
        })
        .eq('id', avatarId);

      return Response.json(
        { message: "Erro ao processar pagamento" },
        { status: 500 }
      );
    }

    // 3. Adicionar recursos ao vendedor
    const { error: vendedorError } = await supabase
      .from('player_stats')
      .update({
        moedas: statsVendedor.moedas + valorVendedorMoedas,
        fragmentos: statsVendedor.fragmentos + valorVendedorFragmentos
      })
      .eq('user_id', avatar.user_id);

    if (vendedorError) {
      console.error("Erro ao atualizar recursos do vendedor:", vendedorError);
    }

    // Registrar transação no histórico (se existir tabela)
    try {
      await supabase
        .from('mercado_transacoes')
        .insert({
          avatar_id: avatarId,
          vendedor_id: avatar.user_id,
          comprador_id: compradorId,
          preco_moedas: precoMoedas,
          preco_fragmentos: precoFragmentos,
          taxa_moedas: taxaMoedas,
          valor_vendedor_moedas: valorVendedorMoedas,
          valor_vendedor_fragmentos: valorVendedorFragmentos
        });
    } catch (error) {
      console.log("Erro ao registrar transação (ignorado):", error.message);
    }

    return Response.json({
      message: "Avatar comprado com sucesso!",
      avatar: {
        nome: avatar.nome,
        raridade: avatar.raridade,
        elemento: avatar.elemento,
        nivel: avatar.nivel
      },
      preco_moedas: precoMoedas,
      preco_fragmentos: precoFragmentos,
      taxa_moedas: taxaMoedas,
      saldo_moedas_restante: statsComprador.moedas - precoMoedas,
      saldo_fragmentos_restante: statsComprador.fragmentos - precoFragmentos
    });

  } catch (error) {
    console.error("Erro:", error);
    return Response.json(
      { message: "Erro ao processar compra" },
      { status: 500 }
    );
  }
}
