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

    const { data: challenges, error } = await supabase
      .from('pvp_challenges')
      .select('*')
      .eq('challenger_user_id', userId)
      .eq('status', 'accepted')
      .not('match_id', 'is', null)
      .order('responded_at', { ascending: false });

    console.log('[ACCEPTED] Query result:', {
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
