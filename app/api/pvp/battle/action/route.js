import { NextResponse } from 'next/server';
import { getSupabaseClientSafe } from "@/lib/supabase/serverClient";

export const dynamic = 'force-dynamic';

/**
 * POST /api/pvp/battle/action
 * Registra uma ação na batalha
 * Body: { matchId, userId, action: { tipo, alvo, dano, efeitos, etc } }
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
      return NextResponse.json(
        { error: 'matchId, userId e action são obrigatórios' },
        { status: 400 }
      );
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

    // Verificar se a batalha está ativa
    if (room.status !== 'active') {
      return NextResponse.json({ error: 'Batalha não está ativa' }, { status: 400 });
    }

    // Determinar qual jogador está fazendo a ação
    const isPlayer1 = room.player1_user_id === userId;
    const playerNumber = isPlayer1 ? 1 : 2;

    // Verificar se é o turno deste jogador
    if (room.current_player !== playerNumber) {
      return NextResponse.json({ error: 'Não é seu turno!' }, { status: 403 });
    }

    // Adicionar ação ao histórico
    const battleData = room.battle_data || { rounds: [], actions: [], hp: { player1: 100, player2: 100 } };

    // Inicializar HP se não existir
    if (!battleData.hp) {
      battleData.hp = { player1: 100, player2: 100 };
    }

    const actionEntry = {
      player: playerNumber,
      userId: userId,
      turn: room.current_turn,
      action: action,
      timestamp: new Date().toISOString()
    };

    battleData.actions = battleData.actions || [];
    battleData.actions.push(actionEntry);

    // Processar dano se for ataque
    if (action.type === 'attack' && action.damage) {
      const targetPlayer = playerNumber === 1 ? 'player2' : 'player1';
      battleData.hp[targetPlayer] = Math.max(0, battleData.hp[targetPlayer] - action.damage);

      // Verificar se algum jogador foi derrotado
      if (battleData.hp[targetPlayer] <= 0) {
        action.resultado = 'vitoria';
      }
    }

    // Atualizar turno (alternar jogador)
    const nextPlayer = playerNumber === 1 ? 2 : 1;
    let updates = {
      battle_data: battleData,
      current_player: nextPlayer,
      current_turn: room.current_turn + 1
    };

    // Atualizar last_action
    const lastActionField = isPlayer1 ? 'player1_last_action' : 'player2_last_action';
    updates[lastActionField] = new Date().toISOString();

    // Se a ação resultou em vitória, atualizar status
    if (action.resultado === 'vitoria') {
      updates.status = 'finished';
      updates.winner_user_id = userId;
      updates.finished_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from('pvp_battle_rooms')
      .update(updates)
      .eq('id', matchId);

    if (updateError) {
      console.error('Erro ao registrar ação:', updateError);
      return NextResponse.json({ error: 'Erro ao registrar ação' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Ação registrada com sucesso',
      nextPlayer: nextPlayer,
      currentTurn: updates.current_turn,
      battleFinished: action.resultado === 'vitoria'
    });

  } catch (error) {
    console.error('Erro no POST /api/pvp/battle/action:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
