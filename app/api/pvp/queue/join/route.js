import { NextResponse } from 'next/server';
import { getDocument, getDocuments, createDocument, updateDocument, deleteDocument } from '@/lib/firebase/firestore';

export const dynamic = 'force-dynamic';

/**
 * POST /api/pvp/queue/join
 * Adiciona jogador à fila de matchmaking
 */
export async function POST(request) {
  try {
    const { userId, avatarId, nivel, poderTotal, fama } = await request.json();

    if (!userId || !avatarId) {
      return NextResponse.json(
        { error: 'userId e avatarId são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se já está na fila
    const existingQueue = await getDocuments('pvp_matchmaking_queue', {
      where: [['user_id', '==', userId]]
    });

    if (existingQueue && existingQueue.length > 0) {
      // Já está na fila, atualizar timestamp
      await updateDocument('pvp_matchmaking_queue', existingQueue[0].id, {
        updated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 2 * 60 * 1000).toISOString() // +2 minutos
      });

      return NextResponse.json({
        success: true,
        message: 'Você já está na fila',
        queueId: existingQueue[0].id
      });
    }

    // Buscar oponente compatível
    const potentialOpponents = await getDocuments('pvp_matchmaking_queue', {
      where: [
        ['status', '==', 'waiting'],
        ['user_id', '!=', userId]
      ]
    });

    // Filtrar por poder similar (±30%)
    const compatibleOpponents = potentialOpponents?.filter(opp => {
      const powerDiff = Math.abs(opp.poder_total - poderTotal) / poderTotal;
      return powerDiff <= 0.3; // Máximo 30% de diferença
    }) || [];

    if (compatibleOpponents.length > 0) {
      // MATCH ENCONTRADO!
      const opponent = compatibleOpponents[0];

      // Criar sala de batalha
      const matchId = await createDocument('pvp_battle_rooms', {
        player1_user_id: opponent.user_id,
        player2_user_id: userId,
        player1_avatar_id: opponent.avatar_id,
        player2_avatar_id: avatarId,
        player1_ready: false,
        player2_ready: false,
        player1_connected: true,
        player2_connected: true,
        player1_last_action: new Date().toISOString(),
        player2_last_action: new Date().toISOString(),
        status: 'waiting',
        current_turn: 1,
        current_player: 1, // Player 1 começa
        winner_user_id: null,
        battleData: {
          actions: [],
          rounds: []
        },
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString() // +15 minutos
      });

      // Atualizar fila do oponente
      await updateDocument('pvp_matchmaking_queue', opponent.id, {
        status: 'matched',
        match_id: matchId
      });

      // Criar entrada para o jogador atual (já matched)
      const queueId = await createDocument('pvp_matchmaking_queue', {
        user_id: userId,
        avatar_id: avatarId,
        nivel: nivel || 1,
        poder_total: poderTotal || 0,
        fama: fama || 1000,
        status: 'matched',
        match_id: matchId,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 2 * 60 * 1000).toISOString()
      });

      // Buscar dados do oponente
      const opponentStats = await getDocument('player_stats', opponent.user_id);
      const opponentAvatar = await getDocument('avatares', opponent.avatar_id);

      return NextResponse.json({
        success: true,
        matched: true,
        matchId,
        opponent: {
          userId: opponent.user_id,
          nome: opponentStats?.nome_operacao || 'Oponente',
          avatar: opponentAvatar
        }
      });
    }

    // Nenhum oponente encontrado - adicionar à fila
    const queueId = await createDocument('pvp_matchmaking_queue', {
      user_id: userId,
      avatar_id: avatarId,
      nivel: nivel || 1,
      poder_total: poderTotal || 0,
      fama: fama || 1000,
      status: 'waiting',
      match_id: null,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 2 * 60 * 1000).toISOString()
    });

    return NextResponse.json({
      success: true,
      matched: false,
      message: 'Procurando oponente...',
      queueId
    });

  } catch (error) {
    console.error('Erro em /api/pvp/queue/join:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
