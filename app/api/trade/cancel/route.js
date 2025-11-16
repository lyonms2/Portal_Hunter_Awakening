import { getSupabaseClientSafe } from "@/lib/supabase/serverClient";

export const dynamic = 'force-dynamic';

/**
 * POST /api/trade/cancel
 *
 * Cancela um anúncio do usuário
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

    const { userId, listingId } = await request.json();

    if (!userId || !listingId) {
      return Response.json(
        { error: "userId e listingId são obrigatórios" },
        { status: 400 }
      );
    }

    // Buscar o listing
    const { data: listing, error: fetchError } = await supabase
      .from('trade_listings')
      .select('id, seller_id, status, avatar_id')
      .eq('id', listingId)
      .single();

    if (fetchError || !listing) {
      return Response.json(
        { error: "Anúncio não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se é o dono
    if (listing.seller_id !== userId) {
      return Response.json(
        { error: "Você não pode cancelar anúncios de outros usuários" },
        { status: 403 }
      );
    }

    // Verificar se já não foi cancelado/vendido
    if (listing.status !== 'active') {
      return Response.json(
        { error: "Este anúncio já não está mais ativo" },
        { status: 400 }
      );
    }

    // Cancelar o listing
    const { error: updateError } = await supabase
      .from('trade_listings')
      .update({ status: 'cancelled' })
      .eq('id', listingId);

    if (updateError) {
      console.error("[trade/cancel] Erro ao cancelar:", updateError);
      return Response.json(
        { error: "Erro ao cancelar anúncio" },
        { status: 500 }
      );
    }

    return Response.json({
      message: "Anúncio cancelado com sucesso!"
    });

  } catch (error) {
    console.error("[trade/cancel] Erro:", error);
    return Response.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
