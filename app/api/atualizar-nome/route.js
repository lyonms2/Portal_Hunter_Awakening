import { getDocument, updateDocument } from '@/lib/firebase/firestore';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/atualizar-nome
 * Atualiza nome de operação do jogador (hunter name)
 *
 * Body: {
 *   userId: string,
 *   nomeOperacao: string
 * }
 */
export async function PUT(request) {
  console.log("=== ATUALIZAR NOME DE OPERAÇÃO ===");

  try {
    const { userId, nomeOperacao } = await request.json();

    if (!userId) {
      return Response.json(
        { message: "userId é obrigatório" },
        { status: 400 }
      );
    }

    if (!nomeOperacao || nomeOperacao.trim().length === 0) {
      return Response.json(
        { message: "Nome de operação não pode estar vazio" },
        { status: 400 }
      );
    }

    // Validar tamanho (máximo 30 caracteres)
    if (nomeOperacao.length > 30) {
      return Response.json(
        { message: "Nome de operação deve ter no máximo 30 caracteres" },
        { status: 400 }
      );
    }

    // Validar caracteres (apenas letras, números, espaços e alguns especiais)
    const regex = /^[a-zA-Z0-9À-ÿ\s\-_]+$/;
    if (!regex.test(nomeOperacao)) {
      return Response.json(
        { message: "Nome contém caracteres inválidos" },
        { status: 400 }
      );
    }

    console.log(`Atualizando nome para usuário ${userId}: "${nomeOperacao}"`);

    // Verificar se jogador existe no Firestore
    const playerStats = await getDocument('player_stats', userId);

    if (!playerStats) {
      return Response.json(
        { message: "Jogador não encontrado" },
        { status: 404 }
      );
    }

    // Atualizar nome no Firestore
    await updateDocument('player_stats', userId, {
      nome_operacao: nomeOperacao.trim(),
      updated_at: new Date().toISOString()
    });

    // Buscar stats atualizados
    const statsAtualizados = await getDocument('player_stats', userId);

    console.log("✅ Nome atualizado com sucesso:", statsAtualizados.nome_operacao);

    return Response.json({
      success: true,
      message: "Nome de operação atualizado com sucesso!",
      stats: statsAtualizados
    });

  } catch (error) {
    console.error("❌ ERRO:", error);
    return Response.json(
      { message: "Erro ao processar: " + error.message },
      { status: 500 }
    );
  }
}
