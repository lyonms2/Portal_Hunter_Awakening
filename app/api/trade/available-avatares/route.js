import { getSupabaseClientSafe } from "@/lib/supabase/serverClient";

export const dynamic = 'force-dynamic';

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

    // BUSCAR TODOS os avatares do usuário primeiro
    const { data: todosAvatares, error: erroTodos } = await supabase
      .from('avatares')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (erroTodos) {
      console.error("[available-avatares] Erro ao buscar todos:", erroTodos);
      return Response.json({ error: "Erro ao buscar avatares" }, { status: 500 });
    }

    console.log("[available-avatares] TODOS avatares do user:", todosAvatares?.map(av => ({
      id: av.id.substring(0, 8),
      nome: av.nome,
      ativo: av.ativo,
      tipo_ativo: typeof av.ativo
    })));

    // Filtrar manualmente para evitar problema de tipo
    const avataresFiltrados = (todosAvatares || []).filter(av => {
      const ativoValue = av.ativo;
      // Aceitar false como boolean ou string
      const isInativo = ativoValue === false || ativoValue === 'false';

      if (isInativo) {
        console.log(`[available-avatares] ✓ Avatar ${av.nome} incluído (ativo=${av.ativo})`);
      } else {
        console.log(`[available-avatares] ✗ Avatar ${av.nome} excluído (ativo=${av.ativo})`);
      }

      return isInativo;
    });

    console.log(`[available-avatares] Total: ${todosAvatares?.length || 0} | Filtrados: ${avataresFiltrados.length}`);

    return Response.json({
      avatares: avataresFiltrados,
      count: avataresFiltrados.length
    });

  } catch (error) {
    console.error("[available-avatares] Exception:", error);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  }
}
