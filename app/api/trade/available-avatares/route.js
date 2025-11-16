import { getSupabaseClientSafe } from "@/lib/supabase/serverClient";

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const requestTime = new Date().toISOString();
  console.log(`\n[available-avatares] ====== NOVA REQUISIÇÃO em ${requestTime} ======`);

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return Response.json({ error: "userId obrigatório" }, { status: 400 });
    }

    // CRIAR NOVO CLIENTE A CADA REQUISIÇÃO
    const supabase = getSupabaseClientSafe(true);
    if (!supabase) {
      return Response.json({ error: "Serviço indisponível" }, { status: 503 });
    }

    console.log(`[available-avatares] Fazendo query REAL no PostgreSQL para userId=${userId}`);
    console.log(`[available-avatares] Query SQL: SELECT * FROM avatares WHERE user_id = '${userId}' ORDER BY created_at DESC`);

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

    console.log(`[available-avatares] TOTAL DE AVATARES RETORNADOS: ${todosAvatares?.length || 0}`);
    console.log("[available-avatares] DADOS CRUS DO POSTGRESQL:");
    todosAvatares?.forEach(av => {
      console.log(`  - ID=${av.id.substring(0, 8)} | user_id=${av.user_id.substring(0, 8)} | ${av.nome} | ativo=${av.ativo} (${typeof av.ativo}) | created=${av.created_at} | updated=${av.updated_at}`);
    });

    // VERIFICAÇÃO DE SEGURANÇA: Checar se algum avatar não pertence ao usuário
    const avatarsOutroUsuario = todosAvatares?.filter(av => av.user_id !== userId) || [];
    if (avatarsOutroUsuario.length > 0) {
      console.error(`[available-avatares] 🚨 ALERTA DE SEGURANÇA! ${avatarsOutroUsuario.length} avatares de OUTRO USUÁRIO foram retornados!`);
      avatarsOutroUsuario.forEach(av => {
        console.error(`  🚨 Avatar ${av.nome} pertence ao user ${av.user_id}, NÃO ao ${userId}`);
      });
    }

    // Filtrar manualmente para evitar problema de tipo
    const avataresFiltrados = (todosAvatares || []).filter(av => {
      const ativoValue = av.ativo;
      // Aceitar false como boolean ou string
      const isInativo = ativoValue === false || ativoValue === 'false';

      if (isInativo) {
        console.log(`[available-avatares] ✓ Avatar ${av.nome} incluído (ativo=${av.ativo}, tipo=${typeof av.ativo})`);
      } else {
        console.log(`[available-avatares] ✗ Avatar ${av.nome} excluído (ativo=${av.ativo}, tipo=${typeof av.ativo})`);
      }

      return isInativo;
    });

    console.log(`[available-avatares] Resultado: Total=${todosAvatares?.length || 0} | Filtrados=${avataresFiltrados.length}`);
    console.log(`[available-avatares] ====== FIM REQUISIÇÃO ======\n`);

    return Response.json({
      avatares: avataresFiltrados,
      count: avataresFiltrados.length
    });

  } catch (error) {
    console.error("[available-avatares] Exception:", error);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  }
}
