import { getDocument, createDocument } from "@/lib/firebase/firestore";

export async function POST(request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return Response.json(
        { message: "ID do usuário é obrigatório" },
        { status: 400 }
      );
    }

    console.log("Inicializando jogador:", userId);

    // Verificar se já existe no Firestore
    const existing = await getDocument('player_stats', userId);

    if (existing) {
      console.log("Jogador já existe:", existing);
      return Response.json({
        message: "Jogador já inicializado",
        stats: existing
      });
    }

    console.log("Criando novo jogador...");

    // Criar stats iniciais no Firestore
    const statsData = {
      user_id: userId,
      moedas: 500,
      fragmentos: 0,
      divida: 0,
      ranking: 'F',
      missoes_completadas: 0,
      primeira_invocacao: true
    };

    await createDocument('player_stats', statsData, userId);

    const stats = { id: userId, ...statsData };

    console.log("Jogador criado com sucesso:", stats);

    return Response.json({
      message: "Jogador inicializado com sucesso!",
      stats
    });

  } catch (error) {
    console.error("Erro no servidor:", error);
    return Response.json(
      { message: "Erro ao processar: " + error.message },
      { status: 500 }
    );
  }
}
