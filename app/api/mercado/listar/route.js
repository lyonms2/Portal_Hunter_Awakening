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

    // Query base
    let query = supabase
      .from('avatares')
      .select(`
        *,
        vendedor:user_id (
          nome
        )
      `)
      .eq('em_venda', true)
      .eq('vivo', true)
      .eq('marca_morte', false);

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
      return Response.json(
        { message: "Erro ao listar avatares" },
        { status: 500 }
      );
    }

    return Response.json({
      avatares: avatares || [],
      total: avatares?.length || 0
    });

  } catch (error) {
    console.error("Erro:", error);
    return Response.json(
      { message: "Erro ao processar requisição" },
      { status: 500 }
    );
  }
}
