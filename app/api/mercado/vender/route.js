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

    const { userId, avatarId, precoMoedas, precoFragmentos } = await request.json();

    if (!userId || !avatarId) {
      return Response.json(
        { message: "Dados incompletos" },
        { status: 400 }
      );
    }

    // Validar que pelo menos um preço foi definido
    if ((!precoMoedas || precoMoedas === 0) && (!precoFragmentos || precoFragmentos === 0)) {
      return Response.json(
        { message: "Defina um preço em moedas e/ou fragmentos" },
        { status: 400 }
      );
    }

    // Validar limites
    if (precoMoedas && (precoMoedas < 0 || precoMoedas > 10000)) {
      return Response.json(
        { message: "Moedas devem estar entre 0 e 10.000" },
        { status: 400 }
      );
    }

    if (precoFragmentos && (precoFragmentos < 0 || precoFragmentos > 500)) {
      return Response.json(
        { message: "Fragmentos devem estar entre 0 e 500" },
        { status: 400 }
      );
    }

    // Buscar avatar
    const { data: avatar, error: avatarError } = await supabase
      .from('avatares')
      .select('*')
      .eq('id', avatarId)
      .eq('user_id', userId)
      .single();

    if (avatarError || !avatar) {
      return Response.json(
        { message: "Avatar não encontrado" },
        { status: 404 }
      );
    }

    // Validações
    if (avatar.ativo) {
      return Response.json(
        { message: "Não é possível vender o avatar ativo" },
        { status: 400 }
      );
    }

    if (!avatar.vivo) {
      return Response.json(
        { message: "Não é possível vender avatares mortos" },
        { status: 400 }
      );
    }

    if (avatar.marca_morte) {
      return Response.json(
        { message: "Não é possível vender avatares com Marca da Morte" },
        { status: 400 }
      );
    }

    if (avatar.em_venda) {
      return Response.json(
        { message: "Este avatar já está à venda" },
        { status: 400 }
      );
    }

    // Colocar à venda
    const { error: updateError } = await supabase
      .from('avatares')
      .update({
        em_venda: true,
        preco_venda: precoMoedas || 0,
        preco_fragmentos: precoFragmentos || 0
      })
      .eq('id', avatarId);

    if (updateError) {
      console.error("Erro ao colocar avatar à venda:", updateError);
      return Response.json(
        { message: "Erro ao colocar avatar à venda" },
        { status: 500 }
      );
    }

    return Response.json({
      message: "Avatar colocado à venda com sucesso!",
      avatar_id: avatarId,
      preco_moedas: precoMoedas || 0,
      preco_fragmentos: precoFragmentos || 0
    });

  } catch (error) {
    console.error("Erro:", error);
    return Response.json(
      { message: "Erro ao processar requisição" },
      { status: 500 }
    );
  }
}

// Cancelar venda
export async function DELETE(request) {
  try {
    const supabase = getSupabaseClientSafe(true);
    if (!supabase) {
      return Response.json(
        { message: "Serviço temporariamente indisponível" },
        { status: 503 }
      );
    }

    const { userId, avatarId } = await request.json();

    if (!userId || !avatarId) {
      return Response.json(
        { message: "Dados incompletos" },
        { status: 400 }
      );
    }

    // Remover da venda
    const { error: updateError } = await supabase
      .from('avatares')
      .update({
        em_venda: false,
        preco_venda: null,
        preco_fragmentos: null
      })
      .eq('id', avatarId)
      .eq('user_id', userId);

    if (updateError) {
      console.error("Erro ao cancelar venda:", updateError);
      return Response.json(
        { message: "Erro ao cancelar venda" },
        { status: 500 }
      );
    }

    return Response.json({
      message: "Venda cancelada com sucesso!"
    });

  } catch (error) {
    console.error("Erro:", error);
    return Response.json(
      { message: "Erro ao processar requisição" },
      { status: 500 }
    );
  }
}
