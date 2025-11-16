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

    // BUSCAR TODOS os avatares do usuário (sem filtros)
    const { data: todosAvatares, error } = await supabase
      .from('avatares')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("[available-avatares] Erro:", error);
      return Response.json({ error: "Erro ao buscar avatares" }, { status: 500 });
    }

    console.log(`[available-avatares] Total de avatares do usuário: ${todosAvatares?.length || 0}`);

    // FILTRAR MANUALMENTE em JavaScript - Regras exatas:
    // - vivo === true
    // - ativo === false
    // - marca_morte === false
    // - em_venda === false
    const avatares = (todosAvatares || []).filter(av => {
      const vendivel = av.vivo === true &&
                      av.ativo === false &&
                      av.marca_morte === false &&
                      av.em_venda === false;

      console.log(`[available-avatares] ${av.nome}: vivo=${av.vivo} ativo=${av.ativo} marca=${av.marca_morte} venda=${av.em_venda} -> ${vendivel ? 'VENDÍVEL' : 'NÃO VENDÍVEL'}`);

      return vendivel;
    });

    console.log(`[available-avatares] Avatares vendíveis (após filtro): ${avatares.length}`);

    return Response.json({
      avatares: avatares || [],
      count: avatares?.length || 0
    });

  } catch (error) {
    console.error("[available-avatares] Exception:", error);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  }
}
