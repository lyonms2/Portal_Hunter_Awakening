import { getSupabaseClientSafe } from "@/lib/supabase/serverClient";

export const dynamic = 'force-dynamic';

/**
 * POST /api/trade/buy
 *
 * Compra um avatar do marketplace
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

    // 1. Buscar o listing com dados do avatar
    const { data: listing, error: listingError } = await supabase
      .from('trade_listings')
      .select(`
        *,
        avatares (*)
      `)
      .eq('id', listingId)
      .single();

    if (listingError || !listing) {
      return Response.json(
        { error: "Anúncio não encontrado" },
        { status: 404 }
      );
    }

    // Validações
    if (listing.status !== 'active') {
      return Response.json(
        { error: "Este anúncio não está mais disponível" },
        { status: 400 }
      );
    }

    if (listing.seller_id === userId) {
      return Response.json(
        { error: "Você não pode comprar seu próprio anúncio" },
        { status: 400 }
      );
    }

    // 2. Buscar stats do comprador
    const { data: buyerStats, error: buyerError } = await supabase
      .from('player_stats')
      .select('moedas, fragmentos, nome_operacao')
      .eq('user_id', userId)
      .single();

    if (buyerError || !buyerStats) {
      return Response.json(
        { error: "Dados do comprador não encontrados" },
        { status: 404 }
      );
    }

    // 3. Calcular valores (taxa de 5%)
    const feeMoedas = Math.ceil(listing.price_moedas * 0.05);
    const feeFragmentos = Math.ceil(listing.price_fragmentos * 0.05);
    const totalMoedas = listing.price_moedas + feeMoedas;
    const totalFragmentos = listing.price_fragmentos + feeFragmentos;

    // Verificar saldo
    if (buyerStats.moedas < totalMoedas) {
      return Response.json({
        error: `Moedas insuficientes. Você tem ${buyerStats.moedas}, precisa de ${totalMoedas} (inclui taxa de 5%)`
      }, { status: 400 });
    }

    if (buyerStats.fragmentos < totalFragmentos) {
      return Response.json({
        error: `Fragmentos insuficientes. Você tem ${buyerStats.fragmentos}, precisa de ${totalFragmentos} (inclui taxa de 5%)`
      }, { status: 400 });
    }

    // 4. Deduzir do comprador
    const { error: deductError } = await supabase
      .from('player_stats')
      .update({
        moedas: buyerStats.moedas - totalMoedas,
        fragmentos: buyerStats.fragmentos - totalFragmentos
      })
      .eq('user_id', userId);

    if (deductError) {
      console.error("[trade/buy] Erro ao deduzir do comprador:", deductError);
      return Response.json(
        { error: "Erro ao processar pagamento" },
        { status: 500 }
      );
    }

    // 5. Adicionar ao vendedor (preço - taxa)
    const { data: sellerStats } = await supabase
      .from('player_stats')
      .select('moedas, fragmentos')
      .eq('user_id', listing.seller_id)
      .single();

    if (sellerStats) {
      await supabase
        .from('player_stats')
        .update({
          moedas: sellerStats.moedas + (listing.price_moedas - feeMoedas),
          fragmentos: sellerStats.fragmentos + (listing.price_fragmentos - feeFragmentos)
        })
        .eq('user_id', listing.seller_id);
    }

    // 6. Transferir avatar
    const { error: transferError } = await supabase
      .from('avatares')
      .update({
        user_id: userId,
        ativo: false
      })
      .eq('id', listing.avatar_id);

    if (transferError) {
      console.error("[trade/buy] Erro ao transferir avatar:", transferError);

      // Reverter pagamento
      await supabase
        .from('player_stats')
        .update({
          moedas: buyerStats.moedas,
          fragmentos: buyerStats.fragmentos
        })
        .eq('user_id', userId);

      return Response.json(
        { error: "Erro ao transferir avatar" },
        { status: 500 }
      );
    }

    // 7. Marcar listing como vendido
    const { error: updateError } = await supabase
      .from('trade_listings')
      .update({
        status: 'sold',
        sold_at: new Date().toISOString()
      })
      .eq('id', listingId);

    if (updateError) {
      console.error("[trade/buy] Erro ao marcar como vendido:", updateError);
      // Não reverter - a transação já foi completada
    }

    // 8. Criar registro da transação
    await supabase
      .from('trade_transactions')
      .insert({
        listing_id: listingId,
        seller_id: listing.seller_id,
        buyer_id: userId,
        avatar_id: listing.avatar_id,
        avatar_snapshot: listing.avatares,
        price_moedas: listing.price_moedas,
        price_fragmentos: listing.price_fragmentos,
        system_fee_moedas: feeMoedas,
        system_fee_fragmentos: feeFragmentos,
        status: 'completed'
      });

    return Response.json({
      message: "Compra realizada com sucesso!",
      avatar: listing.avatares,
      paid: {
        moedas: totalMoedas,
        fragmentos: totalFragmentos,
        fee: `${feeMoedas} moedas + ${feeFragmentos} fragmentos (5%)`
      }
    });

  } catch (error) {
    console.error("[trade/buy] Erro:", error);
    return Response.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
