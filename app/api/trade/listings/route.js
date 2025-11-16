import { getSupabaseClientSafe } from "@/lib/supabase/serverClient";

export const dynamic = 'force-dynamic';

/**
 * GET /api/trade/listings
 *
 * Retorna todos os anúncios ativos do marketplace
 */
export async function GET(request) {
  try {
    const supabase = getSupabaseClientSafe(true);
    if (!supabase) {
      return Response.json(
        { error: "Serviço indisponível" },
        { status: 503 }
      );
    }

    // Buscar listings ativos com dados do avatar
    const { data: listings, error } = await supabase
      .from('trade_listings')
      .select(`
        id,
        seller_id,
        seller_username,
        avatar_id,
        price_moedas,
        price_fragmentos,
        status,
        created_at,
        avatares (
          id,
          nome,
          descricao,
          raridade,
          elemento,
          nivel,
          forca,
          agilidade,
          resistencia,
          foco,
          experiencia,
          vinculo,
          habilidades,
          vivo,
          ativo,
          marca_morte
        )
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("[trade/listings] Erro ao buscar:", error);
      return Response.json(
        { error: "Erro ao carregar anúncios" },
        { status: 500 }
      );
    }

    // Formatar response
    const formattedListings = (listings || []).map(listing => ({
      id: listing.id,
      seller_id: listing.seller_id,
      seller_username: listing.seller_username || "Caçador Anônimo",
      avatar_id: listing.avatar_id,
      price_moedas: listing.price_moedas,
      price_fragmentos: listing.price_fragmentos,
      created_at: listing.created_at,
      avatar: listing.avatares
    }));

    return Response.json({ listings: formattedListings });

  } catch (error) {
    console.error("[trade/listings] Erro:", error);
    return Response.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
