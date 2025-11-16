import { getSupabaseClientSafe } from "@/lib/supabase/serverClient";

export async function GET(request) {
  try {
    const supabase = getSupabaseClientSafe(true);
    if (!supabase) {
      return Response.json(
        { message: "Serviço temporariamente indisponível" },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    console.log("[my-listings] userId recebido:", userId);

    if (!userId) {
      return Response.json(
        { message: "userId é obrigatório" },
        { status: 400 }
      );
    }

    // Buscar listings do usuário
    const { data: listings, error } = await supabase
      .from('trade_listings')
      .select(`
        *,
        avatares!inner (
          id,
          nome,
          descricao,
          raridade,
          elemento,
          nivel,
          experiencia,
          vinculo,
          forca,
          agilidade,
          resistencia,
          foco,
          habilidades,
          vivo,
          ativo,
          marca_morte,
          exaustao,
          hp_atual
        )
      `)
      .eq('seller_id', userId)
      .eq('status', 'active')
      .eq('listing_type', 'avatar')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Erro ao buscar meus listings:", error);
      return Response.json(
        { message: "Erro ao buscar listings" },
        { status: 500 }
      );
    }

    console.log("[my-listings] Listings encontrados:", listings?.length || 0);
    console.log("[my-listings] Primeiro listing (se houver):", listings?.[0]);

    // Formatar dados
    const formattedListings = listings.map(listing => ({
      ...listing,
      avatar_data: listing.avatares
    }));

    return Response.json({
      listings: formattedListings
    });

  } catch (error) {
    console.error("Erro no servidor:", error);
    return Response.json(
      { message: "Erro ao processar: " + error.message },
      { status: 500 }
    );
  }
}
