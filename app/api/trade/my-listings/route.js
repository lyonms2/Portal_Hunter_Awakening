import { getSupabaseClientSafe } from "@/lib/supabase/serverClient";

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const debugInfo = {
    timestamp: new Date().toISOString(),
    step: '',
    userId: null,
    data: null,
    error: null
  };

  try {
    const supabase = getSupabaseClientSafe(true);
    if (!supabase) {
      return Response.json({
        error: "Serviço indisponível",
        debug: { ...debugInfo, step: 'supabase_client_failed' }
      }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    debugInfo.userId = userId;

    if (!userId) {
      return Response.json({
        error: "userId é obrigatório",
        debug: { ...debugInfo, step: 'missing_userId' }
      }, { status: 400 });
    }

    debugInfo.step = 'querying_raw_listings';

    // PRIMEIRO: Buscar listings SEM JOIN
    const { data: rawListings, error: rawError } = await supabase
      .from('trade_listings')
      .select('*')
      .eq('seller_id', userId)
      .eq('status', 'active');

    console.log('[trade/my-listings] Raw listings (sem JOIN):', rawListings);
    console.log('[trade/my-listings] Raw error:', rawError);

    debugInfo.rawCount = rawListings?.length || 0;
    debugInfo.rawListings = rawListings;
    debugInfo.rawError = rawError;

    // SEGUNDO: Buscar com JOIN
    debugInfo.step = 'querying_with_join';

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
      .eq('seller_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    console.log('[trade/my-listings] Listings com JOIN:', listings);
    console.log('[trade/my-listings] Join error:', error);

    debugInfo.joinCount = listings?.length || 0;
    debugInfo.joinListings = listings;
    debugInfo.joinError = error;

    if (error) {
      console.error("[trade/my-listings] Erro ao buscar:", error);
      return Response.json({
        error: "Erro ao carregar seus anúncios",
        debug: { ...debugInfo, step: 'join_query_failed' }
      }, { status: 500 });
    }

    // Verificar listings sem avatar
    const listingsWithoutAvatar = (listings || []).filter(l => !l.avatares);
    if (listingsWithoutAvatar.length > 0) {
      console.warn('[trade/my-listings] Listings SEM avatar:', listingsWithoutAvatar);
      debugInfo.missingAvatars = listingsWithoutAvatar;
    }

    // Formatar response
    const formattedListings = (listings || [])
      .filter(listing => listing.avatares)
      .map(listing => ({
        id: listing.id,
        seller_id: listing.seller_id,
        seller_username: listing.seller_username || "Caçador Anônimo",
        avatar_id: listing.avatar_id,
        price_moedas: listing.price_moedas,
        price_fragmentos: listing.price_fragmentos,
        created_at: listing.created_at,
        avatar: listing.avatares
      }));

    debugInfo.step = 'success';
    debugInfo.finalCount = formattedListings.length;

    return Response.json({
      listings: formattedListings,
      debug: debugInfo
    });

  } catch (error) {
    console.error("[trade/my-listings] Erro:", error);
    return Response.json({
      error: "Erro interno do servidor",
      debug: { ...debugInfo, step: 'exception', exception: error.message }
    }, { status: 500 });
  }
}
