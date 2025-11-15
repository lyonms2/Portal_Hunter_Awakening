import { NextResponse } from 'next/server';
import { getSupabaseClientSafe } from "@/lib/supabase/serverClient";

export const dynamic = 'force-dynamic';

/**
 * GET /api/pvp/battle/room?matchId=xxx&userId=xxx
 * Busca estado atual da sala de batalha
 */
export async function GET(request) {
  try {
    const supabase = getSupabaseClientSafe(true);
    if (!supabase) {
      return NextResponse.json({ error: 'Serviço temporariamente indisponível' }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get('matchId');
    const userId = searchParams.get('userId');

    if (!matchId || !userId) {
      return NextResponse.json({ error: 'matchId e userId são obrigatórios' }, { status: 400 });
    }

    // Buscar sala de batalha
    const { data: room, error: roomError } = await supabase
      .from('pvp_battle_rooms')
      .select('*')
      .eq('id', matchId)
      .single();

    if (roomError || !room) {
      return NextResponse.json({ error: 'Sala de batalha não encontrada' }, { status: 404 });
    }

    // Verificar se o usuário está nesta sala
    if (room.player1_user_id !== userId && room.player2_user_id !== userId) {
      return NextResponse.json({ error: 'Você não está nesta batalha' }, { status: 403 });
    }

    // Determinar se é player1 ou player2
    const isPlayer1 = room.player1_user_id === userId;
    const playerNumber = isPlayer1 ? 1 : 2;

    // Buscar avatares dos jogadores
    const { data: player1Avatar, error: p1Error } = await supabase
      .from('avatares')
      .select('*')
      .eq('id', room.player1_avatar_id)
      .single();

    const { data: player2Avatar, error: p2Error } = await supabase
      .from('avatares')
      .select('*')
      .eq('id', room.player2_avatar_id)
      .single();

    if (p1Error || p2Error) {
      console.error('Erro ao buscar avatares:', p1Error, p2Error);
    }

    // Atualizar último heartbeat do jogador
    const updateField = isPlayer1 ? 'player1_last_action' : 'player2_last_action';
    await supabase
      .from('pvp_battle_rooms')
      .update({ [updateField]: new Date().toISOString() })
      .eq('id', matchId);

    return NextResponse.json({
      success: true,
      room: {
        id: room.id,
        status: room.status,
        currentTurn: room.current_turn,
        currentPlayer: room.current_player,
        winnerUserId: room.winner_user_id,
        battleData: room.battle_data,
        createdAt: room.created_at,
        startedAt: room.started_at,
        finishedAt: room.finished_at
      },
      playerNumber,
      isYourTurn: room.current_player === playerNumber,
      player1: {
        userId: room.player1_user_id,
        avatarId: room.player1_avatar_id,
        nome: player1Avatar?.nome || 'Jogador 1',
        avatar: player1Avatar,
        ready: room.player1_ready,
        connected: room.player1_connected
      },
      player2: {
        userId: room.player2_user_id,
        avatarId: room.player2_avatar_id,
        nome: player2Avatar?.nome || 'Jogador 2',
        avatar: player2Avatar,
        ready: room.player2_ready,
        connected: room.player2_connected
      }
    });

  } catch (error) {
    console.error('Erro no GET /api/pvp/battle/room:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * POST /api/pvp/battle/room
 * Atualiza estado da sala (marcar como pronto, etc)
 * Body: { matchId, userId, action: 'ready'|'disconnect' }
 */
export async function POST(request) {
  try {
    const supabase = getSupabaseClientSafe(true);
    if (!supabase) {
      return NextResponse.json({ error: 'Serviço temporariamente indisponível' }, { status: 503 });
    }

    const body = await request.json();
    const { matchId, userId, action } = body;

    if (!matchId || !userId || !action) {
      return NextResponse.json({ error: 'matchId, userId e action são obrigatórios' }, { status: 400 });
    }

    // Buscar sala
    const { data: room, error: roomError } = await supabase
      .from('pvp_battle_rooms')
      .select('*')
      .eq('id', matchId)
      .single();

    if (roomError || !room) {
      return NextResponse.json({ error: 'Sala não encontrada' }, { status: 404 });
    }

    const isPlayer1 = room.player1_user_id === userId;

    if (action === 'ready') {
      // Marcar jogador como pronto
      const readyField = isPlayer1 ? 'player1_ready' : 'player2_ready';
      const updates = { [readyField]: true };

      // Se ambos estiverem prontos, iniciar batalha
      const bothReady = isPlayer1 ? (true && room.player2_ready) : (room.player1_ready && true);
      if (bothReady) {
        updates.status = 'active';
        updates.started_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('pvp_battle_rooms')
        .update(updates)
        .eq('id', matchId);

      if (updateError) {
        console.error('Erro ao atualizar sala:', updateError);
        return NextResponse.json({ error: 'Erro ao atualizar sala' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Marcado como pronto',
        battleStarted: bothReady
      });
    }

    if (action === 'disconnect') {
      // Marcar jogador como desconectado
      const connectedField = isPlayer1 ? 'player1_connected' : 'player2_connected';
      const opponentId = isPlayer1 ? room.player2_user_id : room.player1_user_id;

      const { error: updateError } = await supabase
        .from('pvp_battle_rooms')
        .update({
          [connectedField]: false,
          status: 'cancelled',
          winner_user_id: opponentId, // Oponente ganha por W.O.
          finished_at: new Date().toISOString()
        })
        .eq('id', matchId);

      if (updateError) {
        console.error('Erro ao desconectar:', updateError);
        return NextResponse.json({ error: 'Erro ao desconectar' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Desconectado - oponente venceu por W.O.'
      });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });

  } catch (error) {
    console.error('Erro no POST /api/pvp/battle/room:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
