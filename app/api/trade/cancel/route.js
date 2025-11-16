import { getSupabaseClientSafe } from "@/lib/supabase/serverClient";

export async function DELETE(request) {
  try {
    const supabase = getSupabaseClientSafe(true);
    if (!supabase) {
      return Response.json(
        { message: "Serviço temporariamente indisponível" },
        { status: 503 }
      );
    }

    const { userId, listingId } = await request.json();

    if (!userId || !listingId) {
      return Response.json(
        { message: "userId e listingId são obrigatórios" },
        { status: 400 }
      );
    }

    // Verificar se o listing pertence ao usuário
    const { data: listing, error: listingError } = await supabase
      .from('trade_listings')
      .select('*')
      .eq('id', listingId)
      .eq('seller_id', userId)
      .eq('status', 'active')
      .single();

    if (listingError || !listing) {
      return Response.json(
        { message: "Anúncio não encontrado ou você não tem permissão para cancelá-lo" },
        { status: 404 }
      );
    }

    // Cancelar o listing
    console.log("[cancel] Tentando cancelar listing:", listingId, "do seller:", userId);
    const { data: cancelledListing, error: updateError } = await supabase
      .from('trade_listings')
      .update({
        status: 'cancelled'
      })
      .eq('id', listingId)
      .select();

    if (updateError) {
      console.error("[cancel] ERRO ao cancelar listing:", updateError);
      console.error("[cancel] Detalhes do erro:", {
        code: updateError.code,
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint
      });
      return Response.json(
        { message: "Erro ao cancelar anúncio. Possível problema de RLS." },
        { status: 500 }
      );
    }

    if (!cancelledListing || cancelledListing.length === 0) {
      console.error("[cancel] AVISO: UPDATE não afetou nenhuma linha! Possível RLS bloqueando.");
      return Response.json(
        { message: "Anúncio não pôde ser cancelado. Verifique RLS policies." },
        { status: 500 }
      );
    }

    console.log("[cancel] Listing cancelado com sucesso:", cancelledListing);

    return Response.json({
      message: "Anúncio cancelado com sucesso!"
    });

  } catch (error) {
    console.error("Erro no servidor:", error);
    return Response.json(
      { message: "Erro ao processar: " + error.message },
      { status: 500 }
    );
  }
}
