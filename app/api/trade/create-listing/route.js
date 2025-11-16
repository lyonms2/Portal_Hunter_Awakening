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

    const { userId, avatarId, priceMoedas, priceFragmentos } = await request.json();

    // Validações
    if (!userId || !avatarId) {
      return Response.json(
        { message: "userId e avatarId são obrigatórios" },
        { status: 400 }
      );
    }

    if (!priceMoedas && !priceFragmentos) {
      return Response.json(
        { message: "Defina pelo menos um preço (moedas ou fragmentos)" },
        { status: 400 }
      );
    }

    if (priceMoedas < 0 || priceFragmentos < 0) {
      return Response.json(
        { message: "Preço não pode ser negativo" },
        { status: 400 }
      );
    }

    // Verificar se pode vender este avatar (usando a função SQL)
    const { data: canSell, error: canSellError } = await supabase
      .rpc('can_sell_avatar', {
        p_avatar_id: avatarId,
        p_user_id: userId
      });

    if (canSellError) {
      console.error("Erro ao verificar can_sell_avatar:", canSellError);
      return Response.json(
        { message: "Erro ao validar avatar" },
        { status: 500 }
      );
    }

    if (!canSell) {
      return Response.json(
        { message: "Este avatar não pode ser vendido. Certifique-se de que ele está vivo, inativo e não possui marca da morte." },
        { status: 400 }
      );
    }

    // Buscar dados do avatar para o snapshot (não usado ainda, mas preparado)
    const { data: avatar, error: avatarError } = await supabase
      .from('avatares')
      .select('*')
      .eq('id', avatarId)
      .single();

    if (avatarError || !avatar) {
      console.error("Erro ao buscar avatar:", avatarError);
      return Response.json(
        { message: "Avatar não encontrado" },
        { status: 404 }
      );
    }

    // Criar o listing
    const { data: listing, error: listingError } = await supabase
      .from('trade_listings')
      .insert([{
        seller_id: userId,
        listing_type: 'avatar',
        avatar_id: avatarId,
        price_moedas: priceMoedas || 0,
        price_fragmentos: priceFragmentos || 0,
        status: 'active'
      }])
      .select()
      .single();

    if (listingError) {
      console.error("Erro ao criar listing:", listingError);
      return Response.json(
        { message: "Erro ao criar anúncio: " + listingError.message },
        { status: 500 }
      );
    }

    return Response.json({
      message: "Listing criado com sucesso!",
      listing
    });

  } catch (error) {
    console.error("Erro no servidor:", error);
    return Response.json(
      { message: "Erro ao processar: " + error.message },
      { status: 500 }
    );
  }
}
