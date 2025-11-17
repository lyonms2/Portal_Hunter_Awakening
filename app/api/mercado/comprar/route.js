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

    // Verificar se comprador tem moedas suficientes
    if (statsComprador.moedas < avatar.preco_venda) {
      return Response.json(
        { message: "Moedas insuficientes para comprar este avatar" },
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

    // Taxa do mercado (5%)
    const taxaMercado = Math.floor(avatar.preco_venda * 0.05);
    const valorVendedor = avatar.preco_venda - taxaMercado;

    // Realizar transação
    // 1. Transferir avatar para comprador
    const { error: transferError } = await supabase
      .from('avatares')
      .update({
        user_id: compradorId,
        em_venda: false,
        preco_venda: null,
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

    // 2. Deduzir moedas do comprador
    const { error: compradorError } = await supabase
      .from('player_stats')
      .update({ moedas: statsComprador.moedas - avatar.preco_venda })
      .eq('user_id', compradorId);

    if (compradorError) {
      console.error("Erro ao atualizar moedas do comprador:", compradorError);
      // Reverter transferência
      await supabase
        .from('avatares')
        .update({
          user_id: avatar.user_id,
          em_venda: true,
          preco_venda: avatar.preco_venda
        })
        .eq('id', avatarId);

      return Response.json(
        { message: "Erro ao processar pagamento" },
        { status: 500 }
      );
    }

    // 3. Adicionar moedas ao vendedor
    const { error: vendedorError } = await supabase
      .from('player_stats')
      .update({ moedas: statsVendedor.moedas + valorVendedor })
      .eq('user_id', avatar.user_id);

    if (vendedorError) {
      console.error("Erro ao atualizar moedas do vendedor:", vendedorError);
    }

    // Registrar transação no histórico (se existir tabela)
    try {
      await supabase
        .from('mercado_transacoes')
        .insert({
          avatar_id: avatarId,
          vendedor_id: avatar.user_id,
          comprador_id: compradorId,
          preco: avatar.preco_venda,
          taxa_mercado: taxaMercado,
          valor_vendedor: valorVendedor
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
      preco: avatar.preco_venda,
      taxa: taxaMercado,
      saldo_restante: statsComprador.moedas - avatar.preco_venda
    });

  } catch (error) {
    console.error("Erro:", error);
    return Response.json(
      { message: "Erro ao processar compra" },
      { status: 500 }
    );
  }
}
