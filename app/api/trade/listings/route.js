import { getSupabaseClientSafe } from "@/lib/supabase/serverClient";

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const debugInfo = {
    timestamp: new Date().toISOString(),
    step: '',
    data: null,
    error: null
  };

  try {
    const supabase = getSupabaseClientSafe(true);
    if (!supabase) {
      return Response.json({
        listings: [],
        debug: { ...debugInfo, step: 'supabase_client_failed' }
      }, { status: 200 }); // Retornar 200 para debug aparecer
    }

    debugInfo.step = 'querying_raw_listings';

    // PRIMEIRO: Buscar listings SEM JOIN para ver se existem
    const { data: rawListings, error: rawError } = await supabase
      .from('trade_listings')
      .select('*')
      .eq('status', 'active');

    console.log('[trade/listings] Raw listings (sem JOIN):', rawListings);
    console.log('[trade/listings] Raw error:', rawError);

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
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    console.log('[trade/listings] Listings com JOIN:', listings);
    console.log('[trade/listings] Join error:', error);

    debugInfo.joinCount = listings?.length || 0;
    debugInfo.joinListings = listings;
    debugInfo.joinError = error;

    // MESMO SE DER ERRO, retornar debug
    if (error) {
      console.error("[trade/listings] Erro ao buscar:", error);
      return Response.json({
        listings: [],
        debug: { ...debugInfo, step: 'join_query_failed', joinError: error }
      }, { status: 200 }); // 200 para debug aparecer
    }

    // Verificar se algum listing não tem avatar
    const listingsWithoutAvatar = (listings || []).filter(l => !l.avatares);
    if (listingsWithoutAvatar.length > 0) {
      console.warn('[trade/listings] Listings SEM avatar:', listingsWithoutAvatar);
      debugInfo.missingAvatars = listingsWithoutAvatar;
    }

    // Formatar response
    const formattedListings = (listings || [])
      .filter(listing => listing.avatares) // Filtrar apenas os que TEM avatar
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
    console.error("[trade/listings] Erro:", error);
    return Response.json({
      listings: [],
      debug: { ...debugInfo, step: 'exception', exception: error.message }
    }, { status: 200 }); // 200 para debug aparecer
  }
}
