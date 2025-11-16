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

    console.log(`[available-avatares] Buscando avatares para user: ${userId}`);

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

    // LOG DETALHADO - ver o que está vindo
    console.log(`[available-avatares] Encontrados ${avatares?.length || 0} avatares`);
    avatares?.forEach(av => {
      console.log(`[available-avatares] Avatar: ${av.nome} | vivo=${av.vivo} ativo=${av.ativo} marca_morte=${av.marca_morte} em_venda=${av.em_venda} | TIPOS: vivo=${typeof av.vivo} ativo=${typeof av.ativo}`);
    });

    return Response.json({
      avatares: avatares || [],
      count: avatares?.length || 0
    });

  } catch (error) {
    console.error("[available-avatares] Exception:", error);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  }
}
