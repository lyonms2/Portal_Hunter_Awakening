import { getSupabaseClientSafe } from "@/lib/supabase/serverClient";

export const dynamic = 'force-dynamic';

/**
 * GET /api/trade/available-avatares?userId=xxx
 *
 * Retorna avatares disponíveis para venda
 */
export async function GET(request) {
  try {
    const supabase = getSupabaseClientSafe(true);
    if (!supabase) {
      return Response.json({ error: "Serviço indisponível" }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return Response.json({ error: "userId obrigatório" }, { status: 400 });
    }

    // BUSCAR AVATARES VENDÍVEIS - Regras exatas:
    // - user_id = userId (do usuário)
    // - vivo = true
    // - ativo = false
    // - marca_morte = false
    // - em_venda = false
    const { data: avatares, error } = await supabase
      .from('avatares')
      .select('*')
      .eq('user_id', userId)
      .eq('vivo', true)
      .eq('ativo', false)
      .eq('marca_morte', false)
      .eq('em_venda', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("[available-avatares] Erro:", error);
      return Response.json({ error: "Erro ao buscar avatares" }, { status: 500 });
    }

    console.log(`[available-avatares] User ${userId}: encontrados ${avatares?.length || 0} avatares vendíveis`);

    return Response.json({
      avatares: avatares || [],
      count: avatares?.length || 0
    });

  } catch (error) {
    console.error("[available-avatares] Exception:", error);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  }
}
