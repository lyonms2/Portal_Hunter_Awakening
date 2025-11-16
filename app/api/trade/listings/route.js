import { getSupabaseClientSafe } from "@/lib/supabase/serverClient";

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const debugInfo = {
    timestamp: new Date().toISOString(),
    step: 'start',
  };

  try {
    const supabase = getSupabaseClientSafe(true);
    if (!supabase) {
      return Response.json({
        listings: [],
        debug: { ...debugInfo, step: 'supabase_client_failed' }
      });
    }

    // BUSCAR LISTINGS
    debugInfo.step = 'fetching_listings';
    const { data: rawListings, error: listingsError } = await supabase
      .from('trade_listings')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    debugInfo.rawCount = rawListings?.length || 0;
    debugInfo.listingsError = listingsError;

    if (listingsError) {
      return Response.json({
        listings: [],
        debug: { ...debugInfo, step: 'listings_query_failed', error: listingsError }
      });
    }

    if (!rawListings || rawListings.length === 0) {
      return Response.json({
        listings: [],
        debug: { ...debugInfo, step: 'no_listings', joinCount: 0, finalCount: 0 }
      });
    }

    // BUSCAR AVATARES MANUALMENTE
    debugInfo.step = 'fetching_avatars';
    const avatarIds = rawListings.map(l => l.avatar_id);
    const { data: avatares, error: avataresError } = await supabase
      .from('avatares')
      .select('*')
      .in('id', avatarIds);

    debugInfo.avatarIds = avatarIds;
    debugInfo.avataresCount = avatares?.length || 0;
    debugInfo.avataresError = avataresError;

    if (avataresError) {
      return Response.json({
        listings: [],
        debug: { ...debugInfo, step: 'avatares_query_failed', error: avataresError }
      });
    }

    // FAZER JOIN MANUAL
    debugInfo.step = 'manual_join';
    const avatarMap = {};
    (avatares || []).forEach(avatar => {
      avatarMap[avatar.id] = avatar;
    });

    const listingsWithAvatars = rawListings
      .map(listing => ({
        ...listing,
        avatar: avatarMap[listing.avatar_id]
      }))
      .filter(listing => listing.avatar); // Só os que tem avatar

    debugInfo.joinCount = rawListings.length;
    debugInfo.missingAvatars = rawListings.filter(l => !avatarMap[l.avatar_id]);
    debugInfo.finalCount = listingsWithAvatars.length;

    // FORMATAR RESPONSE
    const formattedListings = listingsWithAvatars.map(listing => ({
      id: listing.id,
      seller_id: listing.seller_id,
      seller_username: listing.seller_username || "Caçador Anônimo",
      avatar_id: listing.avatar_id,
      price_moedas: listing.price_moedas,
      price_fragmentos: listing.price_fragmentos,
      created_at: listing.created_at,
      avatar: listing.avatar
    }));

    debugInfo.step = 'success';

    return Response.json({
      listings: formattedListings,
      debug: debugInfo
    });

  } catch (error) {
    console.error("[trade/listings] Exception:", error);
    return Response.json({
      listings: [],
      debug: { ...debugInfo, step: 'exception', exception: error.message, stack: error.stack }
    });
  }
}
