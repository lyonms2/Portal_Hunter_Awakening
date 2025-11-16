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
    const { error: updateError } = await supabase
      .from('trade_listings')
      .update({
        status: 'cancelled'
      })
      .eq('id', listingId);

    if (updateError) {
      console.error("Erro ao cancelar listing:", updateError);
      return Response.json(
        { message: "Erro ao cancelar anúncio" },
        { status: 500 }
      );
    }

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
