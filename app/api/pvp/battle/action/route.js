import { NextResponse } from 'next/server';
import { getDocument, getDocRef, executeTransaction } from '@/lib/firebase/firestore';
import { arrayUnion, serverTimestamp } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

/**
 * POST /api/pvp/battle/action
 * Envia ação do jogador e atualiza estado da batalha
 * USA TRANSAÇÃO ATÔMICA para garantir consistência!
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

    // TRANSAÇÃO ATÔMICA - Garante consistência total!
    const result = await executeTransaction(async (transaction) => {
      const roomRef = getDocRef('pvp_battle_rooms', matchId);
      const roomDoc = await transaction.get(roomRef);

      if (!roomDoc.exists()) {
        throw new Error('Sala não encontrada');
      }

      const room = { id: roomDoc.id, ...roomDoc.data() };

      // Verificar se usuário está na sala
      if (room.player1_user_id !== userId && room.player2_user_id !== userId) {
        throw new Error('Você não está nesta sala');
      }

      // Verificar se sala está ativa
      if (room.status !== 'active') {
        throw new Error('Batalha não está ativa');
      }

      const isPlayer1 = room.player1_user_id === userId;
      const playerNumber = isPlayer1 ? 1 : 2;

      // Verificar se é o turno do jogador
      if (room.current_player !== playerNumber) {
        throw new Error('Não é seu turno!');
      }

      // Adicionar ação ao histórico
      const actionData = {
        userId,
        playerNumber,
        timestamp: new Date().toISOString(),
        ...action
      };

      const battleData = room.battleData || { actions: [], rounds: [] };
      const updatedActions = [...battleData.actions, actionData];

      // Próximo jogador
      const nextPlayer = playerNumber === 1 ? 2 : 1;
      const newTurn = room.current_turn + 1;

      const updates = {
        battleData: {
          ...battleData,
          actions: updatedActions
        },
        current_turn: newTurn,
        current_player: nextPlayer,
        [`${isPlayer1 ? 'player1' : 'player2'}_last_action`]: new Date().toISOString()
      };

      // Verificar se batalha terminou
      if (action.resultado === 'vitoria') {
        updates.status = 'finished';
        updates.winner_user_id = userId;
        updates.finished_at = new Date().toISOString();
      }

      // Atualizar sala
      transaction.update(roomRef, updates);

      return {
        success: true,
        nextPlayer,
        currentTurn: newTurn,
        battleFinished: action.resultado === 'vitoria',
        winnerId: action.resultado === 'vitoria' ? userId : null
      };
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Erro em POST /api/pvp/battle/action:', error);

    // Erros de validação retornam 400
    if (error.message.includes('turno') || error.message.includes('não está')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
