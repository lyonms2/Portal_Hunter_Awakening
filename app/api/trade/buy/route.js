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

    const { userId, listingId } = await request.json();

    if (!userId || !listingId) {
      return Response.json(
        { message: "userId e listingId são obrigatórios" },
        { status: 400 }
      );
    }

    // 1. Buscar o listing
    const { data: listing, error: listingError } = await supabase
      .from('trade_listings')
      .select(`
        *,
        avatares!inner (*)
      `)
      .eq('id', listingId)
      .eq('status', 'active')
      .single();

    if (listingError || !listing) {
      return Response.json(
        { message: "Anúncio não encontrado ou já vendido" },
        { status: 404 }
      );
    }

    // Verificar se não está tentando comprar o próprio anúncio
    if (listing.seller_id === userId) {
      return Response.json(
        { message: "Você não pode comprar seu próprio anúncio" },
        { status: 400 }
      );
    }

    // 2. Buscar stats do comprador
    const { data: buyerStats, error: buyerError } = await supabase
      .from('player_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (buyerError || !buyerStats) {
      return Response.json(
        { message: "Erro ao carregar dados do comprador" },
        { status: 500 }
      );
    }

    // 3. Calcular taxa (5%)
    const feeMoedas = Math.ceil(listing.price_moedas * 0.05);
    const feeFragmentos = Math.ceil(listing.price_fragmentos * 0.05);

    const totalMoedas = listing.price_moedas + feeMoedas;
    const totalFragmentos = listing.price_fragmentos + feeFragmentos;

    // 4. Verificar se comprador tem saldo
    if (buyerStats.moedas < totalMoedas) {
      return Response.json(
        { message: `Moedas insuficientes. Você tem ${buyerStats.moedas}, precisa de ${totalMoedas}` },
        { status: 400 }
      );
    }

    if (buyerStats.fragmentos < totalFragmentos) {
      return Response.json(
        { message: `Fragmentos insuficientes. Você tem ${buyerStats.fragmentos}, precisa de ${totalFragmentos}` },
        { status: 400 }
      );
    }

    // 5. Deduzir do comprador
    const { error: updateBuyerError } = await supabase
      .from('player_stats')
      .update({
        moedas: buyerStats.moedas - totalMoedas,
        fragmentos: buyerStats.fragmentos - totalFragmentos
      })
      .eq('user_id', userId);

    if (updateBuyerError) {
      console.error("Erro ao deduzir do comprador:", updateBuyerError);
      return Response.json(
        { message: "Erro ao processar pagamento" },
        { status: 500 }
      );
    }

    // 6. Buscar stats do vendedor e adicionar moedas (preço - taxa)
    const { data: sellerStats, error: sellerStatsError } = await supabase
      .from('player_stats')
      .select('*')
      .eq('user_id', listing.seller_id)
      .single();

    if (!sellerStatsError && sellerStats) {
      const valorVendedor = listing.price_moedas - feeMoedas;
      const fragVendedor = listing.price_fragmentos - feeFragmentos;

      await supabase
        .from('player_stats')
        .update({
          moedas: sellerStats.moedas + valorVendedor,
          fragmentos: sellerStats.fragmentos + fragVendedor
        })
        .eq('user_id', listing.seller_id);
    }

    // 7. Transferir avatar para o comprador
    const { error: transferError } = await supabase
      .from('avatares')
      .update({
        user_id: userId,
        ativo: false // Garantir que não fique ativo
      })
      .eq('id', listing.avatar_id);

    if (transferError) {
      console.error("Erro ao transferir avatar:", transferError);
      // Reverter a dedução do comprador
      await supabase
        .from('player_stats')
        .update({
          moedas: buyerStats.moedas,
          fragmentos: buyerStats.fragmentos
        })
        .eq('user_id', userId);

      return Response.json(
        { message: "Erro ao transferir avatar" },
        { status: 500 }
      );
    }

    // 8. Marcar listing como vendido
    console.log("[buy] Tentando marcar listing como vendido:", listingId);
    const { data: updatedListing, error: updateListingError } = await supabase
      .from('trade_listings')
      .update({
        status: 'sold',
        sold_at: new Date().toISOString()
      })
      .eq('id', listingId)
      .select();

    if (updateListingError) {
      console.error("[buy] ERRO ao atualizar listing:", updateListingError);
      console.error("[buy] Detalhes do erro:", {
        code: updateListingError.code,
        message: updateListingError.message,
        details: updateListingError.details,
        hint: updateListingError.hint
      });
      return Response.json(
        { message: "Erro ao marcar listing como vendido. Possível problema de RLS." },
        { status: 500 }
      );
    }

    if (!updatedListing || updatedListing.length === 0) {
      console.error("[buy] AVISO: UPDATE não afetou nenhuma linha! Possível RLS bloqueando.");
      return Response.json(
        { message: "Listing não pôde ser atualizado. Verifique RLS policies." },
        { status: 500 }
      );
    }

    console.log("[buy] Listing marcado como vendido com sucesso:", updatedListing);

    // 9. Criar registro de transação
    await supabase
      .from('trade_transactions')
      .insert([{
        listing_id: listingId,
        seller_id: listing.seller_id,
        buyer_id: userId,
        listing_type: 'avatar',
        avatar_id: listing.avatar_id,
        avatar_snapshot: listing.avatares, // Snapshot completo
        price_moedas: listing.price_moedas,
        price_fragmentos: listing.price_fragmentos,
        system_fee_moedas: feeMoedas,
        system_fee_fragmentos: feeFragmentos,
        status: 'completed'
      }]);

    return Response.json({
      message: "Compra realizada com sucesso!",
      avatar: listing.avatares
    });

  } catch (error) {
    console.error("Erro no servidor:", error);
    return Response.json(
      { message: "Erro ao processar: " + error.message },
      { status: 500 }
    );
  }
}
