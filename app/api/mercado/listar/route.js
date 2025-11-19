import { getDocuments, getDocument } from "@/lib/firebase/firestore";

// Força rota dinâmica (necessário para request.url)
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

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
      total: avatarsWithSellers.length
    });

  } catch (error) {
    console.error("Erro ao processar requisição:", error);
    return Response.json(
      { message: "Erro ao processar requisição", error: error.message },
      { status: 500 }
    );
  }
}
