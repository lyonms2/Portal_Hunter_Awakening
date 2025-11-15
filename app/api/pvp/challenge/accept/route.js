import { NextResponse } from 'next/server';
import { getSupabaseClientSafe } from "@/lib/supabase/serverClient";

export const dynamic = 'force-dynamic';

/**
 * POST /api/pvp/challenge/accept
 * Aceita um desafio PvP e cria sala de batalha
 * Body: { challengeId, userId }
 */
export async function POST(request) {
  try {
    const supabase = getSupabaseClientSafe(true);
    if (!supabase) {
      return NextResponse.json({ error: 'Serviço temporariamente indisponível' }, { status: 503 });
    }

    const body = await request.json();
    const { challengeId, userId } = body;

    if (!challengeId || !userId) {
      return NextResponse.json(
        { error: 'challengeId e userId são obrigatórios' },
        { status: 400 }
      );
    }

    console.log('✅ Aceitando desafio PvP:', { challengeId, userId });

    // Chamar função do banco para aceitar desafio
    const { data, error } = await supabase
      .rpc('accept_pvp_challenge', {
        p_challenge_id: challengeId,
        p_user_id: userId
      });

    if (error) {
      console.error('Erro ao aceitar desafio:', error);
      return NextResponse.json({ error: 'Erro ao aceitar desafio' }, { status: 500 });
    }

    const result = data[0];

    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: result.message
      }, { status: 400 });
    }

    console.log('🎮 Desafio aceito! Match ID:', result.match_id);

    // Buscar dados da sala de batalha criada
    const { data: battleRoom, error: roomError } = await supabase
      .from('pvp_battle_rooms')
      .select('*')
      .eq('id', result.match_id)
      .single();

    if (roomError || !battleRoom) {
      console.error('Erro ao buscar sala de batalha:', roomError);
      return NextResponse.json({ error: 'Erro ao buscar sala de batalha' }, { status: 500 });
    }

    // Buscar dados dos avatares
    const { data: challenger_avatar } = await supabase
      .from('avatares')
      .select('*')
      .eq('id', battleRoom.player1_avatar_id)
      .single();

    const { data: challenged_avatar } = await supabase
      .from('avatares')
      .select('*')
      .eq('id', battleRoom.player2_avatar_id)
      .single();

    return NextResponse.json({
      success: true,
      matchId: result.match_id,
      message: result.message,
      battleRoom: {
        id: battleRoom.id,
        player1UserId: battleRoom.player1_user_id,
        player1AvatarId: battleRoom.player1_avatar_id,
        player1Avatar: challenger_avatar,
        player2UserId: battleRoom.player2_user_id,
        player2AvatarId: battleRoom.player2_avatar_id,
        player2Avatar: challenged_avatar
      }
    });

  } catch (error) {
    console.error('Erro no POST /api/pvp/challenge/accept:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
