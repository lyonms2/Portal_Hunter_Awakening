import { NextResponse } from 'next/server';
import { getSupabaseClientSafe } from "@/lib/supabase/serverClient";

export const dynamic = 'force-dynamic';

/**
 * GET /api/pvp/challenge/pending?userId=xxx
 * Lista desafios pendentes recebidos pelo usuário
 */
export async function GET(request) {
  try {
    const supabase = getSupabaseClientSafe(true);
    if (!supabase) {
      return NextResponse.json({ error: 'Serviço temporariamente indisponível' }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type') || 'received'; // 'received' ou 'sent'

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }

    // Limpar desafios expirados primeiro
    await supabase.rpc('cleanup_expired_challenges');

    let query = supabase
      .from('pvp_challenges')
      .select('*')
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    // Filtrar por tipo
    if (type === 'received') {
      query = query.eq('challenged_user_id', userId);
    } else if (type === 'sent') {
      query = query.eq('challenger_user_id', userId);
    }

    const { data: challenges, error } = await query;

    if (error) {
      console.error('Erro ao buscar desafios pendentes:', error);
      return NextResponse.json({ error: 'Erro ao buscar desafios' }, { status: 500 });
    }

    if (!challenges || challenges.length === 0) {
      return NextResponse.json({
        success: true,
        challenges: []
      });
    }

    // Buscar dados dos avatares
    const avatarIds = [
      ...challenges.map(c => c.challenger_avatar_id),
      ...challenges.map(c => c.challenged_avatar_id)
    ];
    const uniqueAvatarIds = [...new Set(avatarIds)];

    const { data: avatares } = await supabase
      .from('avatares')
      .select('id, nome, nivel, elemento, raridade, forca, agilidade, resistencia, foco, aparencia, habilidades')
      .in('id', uniqueAvatarIds);

    // Combinar dados
    const challengesWithData = challenges.map(challenge => {
      const challengerAvatar = avatares?.find(a => a.id === challenge.challenger_avatar_id);
      const challengedAvatar = avatares?.find(a => a.id === challenge.challenged_avatar_id);

      return {
        id: challenge.id,
        challengerUserId: challenge.challenger_user_id,
        challengerAvatarId: challenge.challenger_avatar_id,
        challengerAvatar: challengerAvatar || null,
        challengerNivel: challenge.challenger_nivel,
        challengerPoder: challenge.challenger_poder,
        challengerFama: challenge.challenger_fama,
        challengedUserId: challenge.challenged_user_id,
        challengedAvatarId: challenge.challenged_avatar_id,
        challengedAvatar: challengedAvatar || null,
        challengedNivel: challenge.challenged_nivel,
        challengedPoder: challenge.challenged_poder,
        challengedFama: challenge.challenged_fama,
        status: challenge.status,
        createdAt: challenge.created_at,
        expiresAt: challenge.expires_at,
        // Calcular tempo restante em segundos
        timeRemaining: Math.max(0, Math.floor((new Date(challenge.expires_at) - new Date()) / 1000))
      };
    });

    return NextResponse.json({
      success: true,
      challenges: challengesWithData
    });

  } catch (error) {
    console.error('Erro no GET /api/pvp/challenge/pending:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
