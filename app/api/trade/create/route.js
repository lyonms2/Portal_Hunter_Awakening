import { getSupabaseClientSafe } from "@/lib/supabase/serverClient";

export const dynamic = 'force-dynamic';

/**
 * POST /api/trade/create
 *
 * Cria um novo anúncio de venda
 */
export async function POST(request) {
  try {
    const supabase = getSupabaseClientSafe(true);
    if (!supabase) {
      return Response.json(
        { error: "Serviço indisponível" },
        { status: 503 }
      );
    }

    const { userId, avatarId, priceMoedas, priceFragmentos } = await request.json();

    // Validações
    if (!userId || !avatarId) {
      return Response.json(
        { error: "userId e avatarId são obrigatórios" },
        { status: 400 }
      );
    }

    const moedas = parseInt(priceMoedas) || 0;
    const fragmentos = parseInt(priceFragmentos) || 0;

    if (moedas < 0 || fragmentos < 0) {
      return Response.json(
        { error: "Preços não podem ser negativos" },
        { status: 400 }
      );
    }

    if (moedas === 0 && fragmentos === 0) {
      return Response.json(
        { error: "Defina ao menos um preço (moedas ou fragmentos)" },
        { status: 400 }
      );
    }

    // Verificar se avatar pertence ao usuário
    const { data: avatar, error: avatarError } = await supabase
      .from('avatares')
      .select('id, user_id, nome, vivo, ativo, marca_morte, em_venda')
      .eq('id', avatarId)
      .single();

    if (avatarError || !avatar) {
      return Response.json(
        { error: "Avatar não encontrado" },
        { status: 404 }
      );
    }

    if (avatar.user_id !== userId) {
      return Response.json(
        { error: "Este avatar não pertence a você" },
        { status: 403 }
      );
    }

    // Verificar se avatar está disponível para venda
    if (!avatar.vivo) {
      return Response.json(
        { error: "Avatar morto não pode ser vendido" },
        { status: 400 }
      );
    }

    if (avatar.ativo) {
      return Response.json(
        { error: "Avatar ativo não pode ser vendido. Desative-o primeiro." },
        { status: 400 }
      );
    }

    if (avatar.marca_morte) {
      return Response.json(
        { error: "Avatar com marca da morte não pode ser vendido" },
        { status: 400 }
      );
    }

    if (avatar.em_venda) {
      return Response.json(
        { error: "Este avatar já está à venda" },
        { status: 400 }
      );
    }

    // Buscar nome do vendedor
    const { data: sellerStats } = await supabase
      .from('player_stats')
      .select('nome_operacao')
      .eq('user_id', userId)
      .single();

    const sellerUsername = sellerStats?.nome_operacao || "Caçador Anônimo";

    // Marcar avatar como em_venda
    const { error: updateError } = await supabase
      .from('avatares')
      .update({ em_venda: true })
      .eq('id', avatarId);

    if (updateError) {
      console.error("[trade/create] Erro ao marcar avatar em_venda:", updateError);
      return Response.json(
        { error: "Erro ao marcar avatar para venda" },
        { status: 500 }
      );
    }

    // Criar o listing
    const { data: listing, error: createError } = await supabase
      .from('trade_listings')
      .insert({
        seller_id: userId,
        seller_username: sellerUsername,
        avatar_id: avatarId,
        price_moedas: moedas,
        price_fragmentos: fragmentos,
        status: 'active'
      })
      .select()
      .single();

    if (createError) {
      console.error("[trade/create] Erro ao criar:", createError);
      // Reverter em_venda se falhar
      await supabase
        .from('avatares')
        .update({ em_venda: false })
        .eq('id', avatarId);

      return Response.json(
        { error: "Erro ao criar anúncio" },
        { status: 500 }
      );
    }

    return Response.json({
      message: "Anúncio criado com sucesso!",
      listing: {
        id: listing.id,
        avatar_name: avatar.nome
      }
    });

  } catch (error) {
    console.error("[trade/create] Erro:", error);
    return Response.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
