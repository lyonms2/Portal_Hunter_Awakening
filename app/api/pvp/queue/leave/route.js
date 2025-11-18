import { NextResponse } from 'next/server';
import { getDocuments, deleteDocument } from '@/lib/firebase/firestore';

export const dynamic = 'force-dynamic';

/**
 * POST /api/pvp/queue/leave
 * Remove jogador da fila de matchmaking
 */
export async function POST(request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar entrada na fila
    const queueEntries = await getDocuments('pvp_matchmaking_queue', {
      where: [['user_id', '==', userId]]
    });

    if (!queueEntries || queueEntries.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Você não estava na fila'
      });
    }

    // Deletar todas as entradas (normalmente só há 1)
    for (const entry of queueEntries) {
      await deleteDocument('pvp_matchmaking_queue', entry.id);
    }

    return NextResponse.json({
      success: true,
      message: 'Removido da fila com sucesso'
    });

  } catch (error) {
    console.error('Erro em /api/pvp/queue/leave:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
