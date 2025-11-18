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

    // Buscar dados do avatar para obter preços
    const { data: avatar, error: avatarError } = await supabase
      .from('avatares')
      .select('preco_venda, preco_fragmentos, em_venda')
      .eq('id', avatarId)
      .single();

    if (avatarError || !avatar) {
      return Response.json(
        { message: "Avatar não encontrado" },
        { status: 404 }
      );
    }

    if (!avatar.em_venda) {
      return Response.json(
        { message: "Avatar não está mais à venda" },
        { status: 400 }
      );
    }

    const precoMoedas = avatar.preco_venda || 0;
    const precoFragmentos = avatar.preco_fragmentos || 0;

    // Executar compra usando RPC function atômica
    const { data: resultado, error: rpcError } = await supabase
      .rpc('executar_compra_avatar', {
        p_avatar_id: avatarId,
        p_comprador_id: compradorId,
        p_preco_moedas: precoMoedas,
        p_preco_fragmentos: precoFragmentos
      });

    if (rpcError) {
      console.error("Erro na RPC executar_compra_avatar:", rpcError);

      // Mensagens de erro mais amigáveis
      let mensagemErro = "Erro ao processar compra";

      if (rpcError.message.includes("não encontrado") || rpcError.message.includes("não está à venda")) {
        mensagemErro = "Avatar não encontrado ou não está à venda";
      } else if (rpcError.message.includes("próprio avatar")) {
        mensagemErro = "Você não pode comprar seu próprio avatar";
      } else if (rpcError.message.includes("limite de 15 avatares")) {
        mensagemErro = "Você atingiu o limite de 15 avatares! Libere espaço antes de comprar.";
      } else if (rpcError.message.includes("Moedas insuficientes")) {
        mensagemErro = rpcError.message;
      } else if (rpcError.message.includes("Fragmentos insuficientes")) {
        mensagemErro = rpcError.message;
      } else if (rpcError.message.includes("Preço")) {
        mensagemErro = "Erro de validação de preço. Tente novamente.";
      }

      return Response.json(
        { message: mensagemErro, details: rpcError.message },
        { status: 400 }
      );
    }

    // RPC retorna JSON com os dados da compra
    return Response.json({
      message: "Avatar comprado com sucesso!",
      avatar: resultado.avatar,
      preco_moedas: resultado.preco_moedas,
      preco_fragmentos: resultado.preco_fragmentos,
      taxa_moedas: resultado.taxa_moedas,
      saldo_moedas_restante: resultado.saldo_moedas_restante,
      saldo_fragmentos_restante: resultado.saldo_fragmentos_restante
    });

  } catch (error) {
    console.error("Erro geral:", error);
    return Response.json(
      { message: "Erro ao processar compra", details: error.message },
      { status: 500 }
    );
  }
}
