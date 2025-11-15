import { NextResponse } from 'next/server';
import { getSupabaseClientSafe } from "@/lib/supabase/serverClient";

export const dynamic = 'force-dynamic';

/**
 * GET /api/pvp/challenge/accepted?userId=xxx
 * Busca desafios que foram aceitos (para notificar o desafiante)
 */
export async function GET(request) {
  try {
    const supabase = getSupabaseClientSafe(true);
    if (!supabase) {
      return NextResponse.json({ error: 'Serviço temporariamente indisponível' }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }

    // Buscar desafios que você enviou (challenger) e que foram aceitos
    console.log('[ACCEPTED] Buscando desafios aceitos para userId:', userId);

    // WORKAROUND: Buscar salas de batalha onde você é player1 e está em waiting
    // Isso é mais confiável do que depender da tabela pvp_challenges
    const { data: battleRooms, error: roomError } = await supabase
      .from('pvp_battle_rooms')
      .select('*')
      .eq('player1_user_id', userId)
      .eq('status', 'waiting')
      .order('created_at', { ascending: false });

    console.log('[ACCEPTED] Battle rooms encontradas:', {
      error: roomError,
      roomsCount: battleRooms?.length || 0,
      rooms: battleRooms
    });

    if (roomError) {
      console.error('Erro ao buscar salas:', roomError);
      return NextResponse.json({ error: 'Erro ao buscar salas' }, { status: 500 });
    }

    // Se encontrou salas em waiting, buscar dados dos avatares
    if (battleRooms && battleRooms.length > 0) {
      const room = battleRooms[0]; // Pegar a mais recente

      // Buscar avatar do oponente (player2)
      const { data: opponentAvatar } = await supabase
        .from('avatares')
        .select('*')
        .eq('id', room.player2_avatar_id)
        .single();

      // Buscar fama do oponente
      const { data: opponentRanking } = await supabase
        .from('pvp_rankings')
        .select('fama')
        .eq('user_id', room.player2_user_id)
        .single();

      const challengesWithData = [{
        id: room.id, // Usar room ID como challenge ID
        matchId: room.id,
        challengerUserId: room.player1_user_id,
        challengedUserId: room.player2_user_id,
        challengedAvatarId: room.player2_avatar_id,
        challengedAvatar: opponentAvatar,
        challengedFama: opponentRanking?.fama || 1000,
        respondedAt: room.created_at
      }];

      console.log('[ACCEPTED] Retornando sala como desafio aceito:', challengesWithData);

      return NextResponse.json({
        success: true,
        challenges: challengesWithData
      });
    }

    // Fallback: tentar buscar da tabela pvp_challenges
    const { data: challenges, error } = await supabase
      .from('pvp_challenges')
      .select('*')
      .eq('challenger_user_id', userId)
      .eq('status', 'accepted')
      .not('match_id', 'is', null)
      .order('responded_at', { ascending: false });

    console.log('[ACCEPTED] Fallback - Query result:', {
      error,
      challengesCount: challenges?.length || 0,
      challenges: challenges
    });

    if (error) {
      console.error('Erro ao buscar desafios aceitos:', error);
      return NextResponse.json({ error: 'Erro ao buscar desafios aceitos' }, { status: 500 });
    }

    if (!challenges || challenges.length === 0) {
      return NextResponse.json({
        success: true,
        challenges: []
      });
    }

    // Buscar dados dos avatares desafiados
    const avatarIds = challenges.map(c => c.challenged_avatar_id);
    const uniqueAvatarIds = [...new Set(avatarIds)];

    const { data: avatares } = await supabase
      .from('avatares')
      .select('id, nome, nivel, elemento, raridade, forca, agilidade, resistencia, foco, aparencia, habilidades')
      .in('id', uniqueAvatarIds);

    // Combinar dados
    const challengesWithData = challenges.map(challenge => {
      const challengedAvatar = avatares?.find(a => a.id === challenge.challenged_avatar_id);

      return {
        id: challenge.id,
        matchId: challenge.match_id,
        challengerUserId: challenge.challenger_user_id,
        challengedUserId: challenge.challenged_user_id,
        challengedAvatarId: challenge.challenged_avatar_id,
        challengedAvatar: challengedAvatar || null,
        challengedFama: challenge.challenged_fama,
        respondedAt: challenge.responded_at
      };
    });

    return NextResponse.json({
      success: true,
      challenges: challengesWithData
    });

  } catch (error) {
    console.error('Erro no GET /api/pvp/challenge/accepted:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
