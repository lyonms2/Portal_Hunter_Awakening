import { NextResponse } from 'next/server';
import { getDocument, updateDocument } from '@/lib/firebase/firestore';

export const dynamic = 'force-dynamic';

/**
 * GET /api/pvp/battle/room?matchId=xxx&userId=xxx
 * Busca estado atual da sala de batalha
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get('matchId');
    const userId = searchParams.get('userId');

    if (!matchId || !userId) {
      return NextResponse.json(
        { error: 'matchId e userId são obrigatórios' },
        { status: 400 }
      );
    }

    const room = await getDocument('pvp_battle_rooms', matchId);

    if (!room) {
      return NextResponse.json(
        { error: 'Sala não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se o usuário está na sala
    if (room.player1_user_id !== userId && room.player2_user_id !== userId) {
      return NextResponse.json(
        { error: 'Você não está nesta sala' },
        { status: 403 }
      );
    }

    // Determinar qual player é o usuário
    const playerNumber = room.player1_user_id === userId ? 1 : 2;
    const isYourTurn = room.current_player === playerNumber;

    return NextResponse.json({
      success: true,
      room,
      playerNumber,
      isYourTurn,
      player1: {
        userId: room.player1_user_id,
        avatarId: room.player1_avatar_id,
        ready: room.player1_ready,
        connected: room.player1_connected,
        lastAction: room.player1_last_action
      },
      player2: {
        userId: room.player2_user_id,
        avatarId: room.player2_avatar_id,
        ready: room.player2_ready,
        connected: room.player2_connected,
        lastAction: room.player2_last_action
      }
    });

  } catch (error) {
    console.error('Erro em GET /api/pvp/battle/room:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/pvp/battle/room
 * Atualiza estado da sala (ready, disconnect, etc)
 */
export async function POST(request) {
  try {
    const { matchId, userId, action } = await request.json();

    if (!matchId || !userId || !action) {
      return NextResponse.json(
        { error: 'matchId, userId e action são obrigatórios' },
        { status: 400 }
      );
    }

    const room = await getDocument('pvp_battle_rooms', matchId);

    if (!room) {
      return NextResponse.json(
        { error: 'Sala não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se o usuário está na sala
    if (room.player1_user_id !== userId && room.player2_user_id !== userId) {
      return NextResponse.json(
        { error: 'Você não está nesta sala' },
        { status: 403 }
      );
    }

    const isPlayer1 = room.player1_user_id === userId;

    if (action === 'ready') {
      // Marcar como pronto
      const field = isPlayer1 ? 'player1_ready' : 'player2_ready';
      await updateDocument('pvp_battle_rooms', matchId, {
        [field]: true,
        [`${isPlayer1 ? 'player1' : 'player2'}_last_action`]: new Date().toISOString()
      });

      // Verificar se ambos estão prontos
      const updatedRoom = await getDocument('pvp_battle_rooms', matchId);
      if (updatedRoom.player1_ready && updatedRoom.player2_ready) {
        // Ambos prontos - iniciar batalha!
        await updateDocument('pvp_battle_rooms', matchId, {
          status: 'active',
          started_at: new Date().toISOString()
        });

        return NextResponse.json({
          success: true,
          message: 'Batalha iniciada!',
          battleStarted: true
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Você está pronto. Aguardando oponente...',
        battleStarted: false
      });
    }

    if (action === 'disconnect') {
      // Marcar como desconectado
      const field = isPlayer1 ? 'player1_connected' : 'player2_connected';
      const opponentId = isPlayer1 ? room.player2_user_id : room.player1_user_id;

      await updateDocument('pvp_battle_rooms', matchId, {
        [field]: false,
        status: 'cancelled',
        winner_user_id: opponentId, // Oponente ganha por W.O.
        finished_at: new Date().toISOString()
      });

      return NextResponse.json({
        success: true,
        message: 'Desconectado. Oponente venceu por W.O.'
      });
    }

    return NextResponse.json(
      { error: 'Ação inválida' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Erro em POST /api/pvp/battle/room:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
