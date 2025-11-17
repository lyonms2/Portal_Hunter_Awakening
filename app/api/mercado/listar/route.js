import { getSupabaseClientSafe } from "@/lib/supabase/serverClient";

// Força rota dinâmica (necessário para request.url)
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const supabase = getSupabaseClientSafe(true);
    if (!supabase) {
      return Response.json(
        { message: "Serviço temporariamente indisponível" },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const raridade = searchParams.get('raridade');
    const elemento = searchParams.get('elemento');
    const nivelMin = searchParams.get('nivelMin');
    const nivelMax = searchParams.get('nivelMax');
    const precoMin = searchParams.get('precoMin');
    const precoMax = searchParams.get('precoMax');

    // Query base - buscar avatares à venda
    let query = supabase
      .from('avatares')
      .select('*')
      .eq('em_venda', true)
      .eq('vivo', true)
      .or('marca_morte.is.null,marca_morte.eq.false');

    // Excluir avatares do próprio usuário
    if (userId) {
      query = query.neq('user_id', userId);
    }

    // Filtros
    if (raridade && raridade !== 'Todos') {
      query = query.eq('raridade', raridade);
    }

    if (elemento && elemento !== 'Todos') {
      query = query.eq('elemento', elemento);
    }

    if (nivelMin) {
      query = query.gte('nivel', parseInt(nivelMin));
    }

    if (nivelMax) {
      query = query.lte('nivel', parseInt(nivelMax));
    }

    if (precoMin) {
      query = query.gte('preco_venda', parseInt(precoMin));
    }

    if (precoMax) {
      query = query.lte('preco_venda', parseInt(precoMax));
    }

    // Ordenar por criação (mais recentes primeiro)
    query = query.order('created_at', { ascending: false });

    const { data: avatares, error } = await query;

    if (error) {
      console.error("Erro ao listar avatares:", error);
      console.error("Detalhes do erro:", JSON.stringify(error, null, 2));
      return Response.json(
        { message: "Erro ao listar avatares", error: error.message, details: error.details },
        { status: 500 }
      );
    }

    // Enriquecer avatares com dados dos vendedores
    if (avatares && avatares.length > 0) {
      // Buscar user_ids únicos
      const userIds = [...new Set(avatares.map(a => a.user_id).filter(Boolean))];

      if (userIds.length > 0) {
        // Buscar dados dos vendedores
        const { data: vendedores, error: vendedoresError } = await supabase
          .from('player_stats')
          .select('user_id, nome_operacao')
          .in('user_id', userIds);

        if (!vendedoresError && vendedores) {
          // Criar mapa de user_id -> nome_operacao
          const vendedoresMap = new Map(
            vendedores.map(v => [v.user_id, v.nome_operacao])
          );

          // Adicionar nome do vendedor a cada avatar
          avatares.forEach(avatar => {
            avatar.vendedor = {
              nome_operacao: vendedoresMap.get(avatar.user_id) || 'Vendedor Desconhecido'
            };
          });
        }
      }
    }

    return Response.json({
      avatares: avatares || [],
      total: avatares?.length || 0
    });

  } catch (error) {
    console.error("Erro ao processar requisição:", error);
    console.error("Stack trace:", error.stack);
    return Response.json(
      { message: "Erro ao processar requisição", error: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}
