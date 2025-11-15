import { NextResponse } from 'next/server';
import { getSupabaseClientSafe } from "@/lib/supabase/serverClient";

export const dynamic = 'force-dynamic';

/**
 * GET /api/pvp/queue/check?userId=xxx
 * Verifica se o jogador encontrou um match
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

    // Buscar entrada na fila
    const { data: queueEntry, error: queueError } = await supabase
      .from('pvp_matchmaking_queue')
      .select('*')
      .eq('user_id', userId)
      .single();

    console.log('🔍 Queue entry check:', {
      userId,
      found: !!queueEntry,
      status: queueEntry?.status,
      matchId: queueEntry?.match_id,
      opponentUserId: queueEntry?.opponent_user_id
    });

    if (queueError || !queueEntry) {
      console.log('⚠️ Não encontrado na fila:', queueError?.message);
      return NextResponse.json({
        success: true,
        inQueue: false,
        matched: false
      });
    }

    // Se ainda está aguardando, tentar encontrar match novamente
    if (queueEntry.status === 'waiting') {
      const { data: matchResult, error: matchError } = await supabase
        .rpc('find_pvp_match', {
          p_user_id: userId,
          p_nivel: queueEntry.nivel,
          p_poder_total: queueEntry.poder_total,
          p_fama: queueEntry.fama
        });

      if (matchError) {
        console.error('Erro ao buscar match:', matchError);
      }

      // Se encontrou match agora
      if (matchResult && matchResult.length > 0 && matchResult[0].matched) {
        // Buscar dados do avatar do oponente
        const { data: opponentAvatar, error: avatarError } = await supabase
          .from('avatares')
          .select('*')
          .eq('id', matchResult[0].opponent_avatar_id)
          .single();

        return NextResponse.json({
          success: true,
          inQueue: true,
          matched: true,
          matchId: matchResult[0].match_id,
          opponentUserId: matchResult[0].opponent_user_id,
          opponentAvatarId: matchResult[0].opponent_avatar_id,
          opponent: {
            userId: matchResult[0].opponent_user_id,
            avatarId: matchResult[0].opponent_avatar_id,
            nome: opponentAvatar?.nome || 'Oponente',
            avatar: opponentAvatar
          }
        });
      }

      // Ainda aguardando
      return NextResponse.json({
        success: true,
        inQueue: true,
        matched: false,
        waitingTime: Math.floor((new Date() - new Date(queueEntry.entered_at)) / 1000)
      });
    }

    // Se já encontrou match
    if (queueEntry.status === 'matched') {
      // Buscar avatar_id do oponente na fila
      const { data: opponentQueue, error: oppQueueError } = await supabase
        .from('pvp_matchmaking_queue')
        .select('avatar_id')
        .eq('user_id', queueEntry.opponent_user_id)
        .single();

      if (!opponentQueue || oppQueueError) {
        console.error('Erro ao buscar avatar do oponente:', oppQueueError);
        return NextResponse.json({
          success: false,
          error: 'Dados do oponente não encontrados'
        }, { status: 404 });
      }

      // Buscar dados do avatar do oponente
      const { data: opponentAvatar, error: avatarError } = await supabase
        .from('avatares')
        .select('*')
        .eq('id', opponentQueue.avatar_id)
        .single();

      return NextResponse.json({
        success: true,
        inQueue: true,
        matched: true,
        matchId: queueEntry.match_id,
        opponentUserId: queueEntry.opponent_user_id,
        opponentAvatarId: opponentQueue.avatar_id,
        opponent: {
          userId: queueEntry.opponent_user_id,
          avatarId: opponentQueue.avatar_id,
          nome: opponentAvatar?.nome || 'Oponente',
          avatar: opponentAvatar
        }
      });
    }

    return NextResponse.json({
      success: true,
      inQueue: false,
      matched: false
    });

  } catch (error) {
    console.error('Erro no GET /api/pvp/queue/check:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
