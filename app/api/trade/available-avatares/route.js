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

    // Debug: verificar configuração do Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    console.log(`[available-avatares] 🔧 Supabase URL: ${supabaseUrl?.substring(0, 30)}...`);
    console.log(`[available-avatares] 🔧 Usando Service Role: true`);

    console.log(`[available-avatares] Fazendo query REAL no PostgreSQL para userId=${userId}`);
    console.log(`[available-avatares] Query SQL: SELECT * FROM avatares WHERE user_id = '${userId}' ORDER BY created_at DESC`);

    // PRIMEIRO: Contar quantos avatares existem (sem paginação)
    const { count: totalCount, error: countError } = await supabase
      .from('avatares')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    console.log(`[available-avatares] 📊 COUNT direto do PostgreSQL: ${totalCount} avatares para este user`);
    console.log(`[available-avatares] ⚠️ ATENÇÃO: COUNT diz ${totalCount}, mas vamos ver quantos o SELECT retorna...`);

    // SOLUÇÃO 1: Tentar com range para forçar query nova
    console.log(`[available-avatares] 🔧 Tentando query com LIMIT 1000 para forçar bypass de cache...`);
    const { data: todosAvatares, error: erroTodos } = await supabase
      .from('avatares')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1000);  // Forçar LIMIT pode ajudar

    if (erroTodos) {
      console.error("[available-avatares] Erro ao buscar todos:", erroTodos);
      return Response.json({ error: "Erro ao buscar avatares" }, { status: 500 });
    }

    console.log(`[available-avatares] TOTAL DE AVATARES RETORNADOS: ${todosAvatares?.length || 0}`);
    console.log(`[available-avatares] ⚠️ DISCREPÂNCIA: COUNT=${totalCount} mas SELECT retornou ${todosAvatares?.length || 0}!`);

    console.log("[available-avatares] DADOS CRUS DO POSTGRESQL:");
    todosAvatares?.forEach(av => {
      // Verificar IDs específicos que deveriam existir
      const isBolt = av.id === '1302ca2b-085b-4807-ad29-f8afa71a6aa5';
      const isGloom = av.id === 'e6799829-54fd-4a8a-9504-55853b9a9c80';
      const isRain = av.id === 'dc8647e2-b65c-451f-9aaa-73da69bb6a54';
      const isNox = av.id === '592e14ef-86d9-49c8-aaa2-e5cae553b67c';

      const flag = isBolt ? '⚡BOLT' : isGloom ? '🌑GLOOM' : isRain ? '💧RAIN' : isNox ? '🚨NOX' : '';

      console.log(`  ${flag} - ID=${av.id.substring(0, 8)} | user_id=${av.user_id.substring(0, 8)} | ${av.nome} | ativo=${av.ativo} (${typeof av.ativo}) | created=${av.created_at} | updated=${av.updated_at}`);
    });

    // Verificar quais IDs deveriam existir
    const idsEsperados = {
      '1302ca2b-085b-4807-ad29-f8afa71a6aa5': 'Bolt, o Mascarado',
      'e6799829-54fd-4a8a-9504-55853b9a9c80': 'Gloom, o Inabalável',
      'dc8647e2-b65c-451f-9aaa-73da69bb6a54': 'Rain, o Custódio'
    };

    console.log(`[available-avatares] 🔍 Verificando IDs esperados...`);
    for (const [id, nome] of Object.entries(idsEsperados)) {
      const existe = todosAvatares?.find(av => av.id === id);
      if (existe) {
        console.log(`  ✅ ${nome} ENCONTRADO`);
      } else {
        console.error(`  ❌ ${nome} (${id.substring(0, 8)}) NÃO ENCONTRADO! Deveria existir!`);
      }
    }

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
