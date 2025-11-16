import { getSupabaseClientSafe } from "@/lib/supabase/serverClient";

// Forçar rota dinâmica (não pode ser estaticamente renderizada)
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const supabase = getSupabaseClientSafe(true);
    if (!supabase) {
      return Response.json(
        { message: "Serviço temporariamente indisponível" },
        { status: 503 }
      );
    }

    // DEBUG: Verificar se tabela está vazia
    console.log("[listings] ========== INÍCIO DEBUG ==========");
    const { data: allTrade, error: debugError } = await supabase
      .from('trade_listings')
      .select('*')
      .limit(10);

    console.log("[listings] Total de registros em trade_listings:", allTrade?.length || 0);
    console.log("[listings] Registros brutos:", JSON.stringify(allTrade, null, 2));

    // Buscar todos os listings ativos
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
      .eq('status', 'active')
      .eq('listing_type', 'avatar')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("[listings] ERRO ao buscar listings:", error);
      console.error("[listings] Detalhes:", JSON.stringify(error, null, 2));
      return Response.json(
        { message: "Erro ao buscar listings" },
        { status: 500 }
      );
    }

    console.log("[listings] Total de listings ativos (com JOIN):", listings?.length || 0);
    console.log("[listings] Dados completos retornados:", JSON.stringify(listings, null, 2));
    if (listings && listings.length > 0) {
      console.log("[listings] Primeiro listing:", {
        id: listings[0].id,
        seller_id: listings[0].seller_id,
        avatar_id: listings[0].avatar_id,
        tem_avatar_data: !!listings[0].avatares
      });
    }
    console.log("[listings] ========== FIM DEBUG ==========");

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
