import { getDocuments, getDocument } from "@/lib/firebase/firestore";

// Força rota dinâmica (necessário para request.url)
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Filtros
    const elemento = searchParams.get('elemento');
    const raridade = searchParams.get('raridade');
    const nivelMin = searchParams.get('nivel_min') ? parseInt(searchParams.get('nivel_min')) : null;
    const nivelMax = searchParams.get('nivel_max') ? parseInt(searchParams.get('nivel_max')) : null;
    const precoMin = searchParams.get('preco_min') ? parseInt(searchParams.get('preco_min')) : null;
    const precoMax = searchParams.get('preco_max') ? parseInt(searchParams.get('preco_max')) : null;
    const ordenarPor = searchParams.get('ordenar') || 'recente';

    // Buscar todos os avatares à venda no Firestore
    const constraints = {
      where: [
        ['em_venda', '==', true],
        ['vivo', '==', true]
      ]
    };

    let avatares = await getDocuments('avatares', constraints);

    if (!avatares) {
      avatares = [];
    }

    // Excluir avatares do próprio usuário
    if (userId) {
      avatares = avatares.filter(avatar => avatar.user_id !== userId);
    }

    // Aplicar filtros
    if (elemento) {
      avatares = avatares.filter(avatar => avatar.elemento === elemento);
    }

    if (raridade) {
      avatares = avatares.filter(avatar => avatar.raridade === raridade);
    }

    if (nivelMin !== null) {
      avatares = avatares.filter(avatar => avatar.nivel >= nivelMin);
    }

    if (nivelMax !== null) {
      avatares = avatares.filter(avatar => avatar.nivel <= nivelMax);
    }

    if (precoMin !== null) {
      avatares = avatares.filter(avatar => {
        const preco = avatar.preco_venda || 0;
        return preco >= precoMin;
      });
    }

    if (precoMax !== null) {
      avatares = avatares.filter(avatar => {
        const preco = avatar.preco_venda || 0;
        return preco <= precoMax;
      });
    }

    // Ordenação
    switch (ordenarPor) {
      case 'preco_asc':
        avatares.sort((a, b) => (a.preco_venda || 0) - (b.preco_venda || 0));
        break;
      case 'preco_desc':
        avatares.sort((a, b) => (b.preco_venda || 0) - (a.preco_venda || 0));
        break;
      case 'nivel_asc':
        avatares.sort((a, b) => (a.nivel || 1) - (b.nivel || 1));
        break;
      case 'nivel_desc':
        avatares.sort((a, b) => (b.nivel || 1) - (a.nivel || 1));
        break;
      case 'recente':
      default:
        avatares.sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
          const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
          return dateB - dateA;
        });
        break;
    }

    // Buscar nome dos vendedores
    const avatarsWithSellers = await Promise.all(
      avatares.map(async (avatar) => {
        try {
          const sellerData = await getDocument('player_stats', avatar.user_id);
          return {
            ...avatar,
            vendedor: {
              nome_operacao: sellerData?.nome_operacao || 'Vendedor Desconhecido'
            }
          };
        } catch (error) {
          return {
            ...avatar,
            vendedor: {
              nome_operacao: 'Vendedor Desconhecido'
            }
          };
        }
      })
    );

    return Response.json({
      avatares: avatarsWithSellers,
      total: avatarsWithSellers.length,
      filtros_aplicados: {
        elemento,
        raridade,
        nivel_min: nivelMin,
        nivel_max: nivelMax,
        preco_min: precoMin,
        preco_max: precoMax,
        ordenar: ordenarPor
      }
    });

  } catch (error) {
    console.error("Erro ao processar requisição:", error);
    return Response.json(
      { message: "Erro ao processar requisição", error: error.message },
      { status: 500 }
    );
  }
}
