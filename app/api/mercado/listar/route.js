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

    // Query base - buscar avatares com JOIN para pegar nome do vendedor
    // REMOVIDO filtro .eq('em_venda', true) do banco - faremos no JavaScript
    let query = supabase
      .from('avatares')
      .select(`
        *,
        vendedor:player_stats!fk_avatares_player_stats(nome_operacao)
      `)
      .eq('vivo', true)
      .or('marca_morte.is.null,marca_morte.eq.false');

    // Excluir avatares do próprio usuário
    if (userId) {
      query = query.neq('user_id', userId);
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

    // Aplicar TODOS os filtros em JavaScript (mais confiável que queries do Supabase)
    let avataresFiltrados = avatares || [];

    // FILTRO PRINCIPAL: Apenas avatares à venda
    avataresFiltrados = avataresFiltrados.filter(avatar => avatar.em_venda === true);

    // Filtro de raridade
    if (raridade && raridade !== 'Todos') {
      avataresFiltrados = avataresFiltrados.filter(avatar => avatar.raridade === raridade);
    }

    // Filtro de elemento
    if (elemento && elemento !== 'Todos') {
      avataresFiltrados = avataresFiltrados.filter(avatar => avatar.elemento === elemento);
    }

    // Filtro de nível mínimo
    if (nivelMin) {
      const nivelMinInt = parseInt(nivelMin);
      avataresFiltrados = avataresFiltrados.filter(avatar => avatar.nivel >= nivelMinInt);
    }

    // Filtro de nível máximo
    if (nivelMax) {
      const nivelMaxInt = parseInt(nivelMax);
      avataresFiltrados = avataresFiltrados.filter(avatar => avatar.nivel <= nivelMaxInt);
    }

    // Filtro de preço mínimo
    if (precoMin) {
      const precoMinInt = parseInt(precoMin);
      avataresFiltrados = avataresFiltrados.filter(avatar => {
        const precoMoedas = avatar.preco_venda || 0;
        const precoFragmentos = avatar.preco_fragmentos || 0;
        // Avatar passa se QUALQUER um dos preços for >= precoMin
        return precoMoedas >= precoMinInt || precoFragmentos >= precoMinInt;
      });
    }

    // Filtro de preço máximo
    if (precoMax) {
      const precoMaxInt = parseInt(precoMax);
      avataresFiltrados = avataresFiltrados.filter(avatar => {
        const precoMoedas = avatar.preco_venda || 0;
        const precoFragmentos = avatar.preco_fragmentos || 0;
        // Avatar passa se AMBOS os preços forem <= precoMax (ou 0)
        return (precoMoedas === 0 || precoMoedas <= precoMaxInt) &&
               (precoFragmentos === 0 || precoFragmentos <= precoMaxInt);
      });
    }

    // Processar dados do vendedor (já vem do JOIN)
    if (avataresFiltrados && avataresFiltrados.length > 0) {
      avataresFiltrados.forEach(avatar => {
        // Normalizar estrutura do vendedor (caso venha como array do Supabase)
        if (Array.isArray(avatar.vendedor) && avatar.vendedor.length > 0) {
          avatar.vendedor = {
            nome_operacao: avatar.vendedor[0].nome_operacao || 'Vendedor Desconhecido'
          };
        } else if (!avatar.vendedor || !avatar.vendedor.nome_operacao) {
          avatar.vendedor = {
            nome_operacao: 'Vendedor Desconhecido'
          };
        }
      });
    }

    return Response.json({
      avatares: avataresFiltrados,
      total: avataresFiltrados.length
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
