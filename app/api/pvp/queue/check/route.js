import { NextResponse } from 'next/server';
import { getDocuments, getDocument } from '@/lib/firebase/firestore';

export const dynamic = 'force-dynamic';

/**
 * GET /api/pvp/queue/check?userId=xxx
 * Verifica se encontrou match (polling fallback, preferir Firestore listener)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

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
        matched: false,
        message: 'Você não está na fila'
      });
    }

    const queueEntry = queueEntries[0];

    if (queueEntry.status === 'matched' && queueEntry.match_id) {
      // Match encontrado!
      const room = await getDocument('pvp_battle_rooms', queueEntry.match_id);

      if (!room) {
        return NextResponse.json({
          success: false,
          error: 'Sala não encontrada'
        }, { status: 404 });
      }

      // Determinar quem é o oponente
      const isPlayer1 = room.player1_user_id === userId;
      const opponentId = isPlayer1 ? room.player2_user_id : room.player1_user_id;
      const opponentAvatarId = isPlayer1 ? room.player2_avatar_id : room.player1_avatar_id;

      // Buscar dados do oponente
      const opponentStats = await getDocument('player_stats', opponentId);
      const opponentAvatar = await getDocument('avatares', opponentAvatarId);

      return NextResponse.json({
        success: true,
        matched: true,
        matchId: queueEntry.match_id,
        opponent: {
          userId: opponentId,
          nome: opponentStats?.nome_operacao || 'Oponente',
          avatar: opponentAvatar
        }
      });
    }

    // Ainda esperando
    return NextResponse.json({
      success: true,
      matched: false,
      message: 'Procurando oponente...'
    });

  } catch (error) {
    console.error('Erro em /api/pvp/queue/check:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
