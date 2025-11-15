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

    if (queueError || !queueEntry) {
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
        // Buscar dados do oponente
        const { data: opponentAvatar, error: avatarError } = await supabase
          .from('avatares')
          .select('*, usuarios!inner(id, nome_usuario)')
          .eq('id', matchResult[0].opponent_avatar_id)
          .single();

        return NextResponse.json({
          success: true,
          inQueue: true,
          matched: true,
          matchId: matchResult[0].match_id,
          opponent: {
            userId: matchResult[0].opponent_user_id,
            avatarId: matchResult[0].opponent_avatar_id,
            nome: opponentAvatar?.usuarios?.nome_usuario || 'Oponente',
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
      // Buscar dados do oponente
      const { data: opponentAvatar, error: avatarError } = await supabase
        .from('avatares')
        .select('*, usuarios!inner(id, nome_usuario)')
        .eq('id', (await supabase
          .from('pvp_matchmaking_queue')
          .select('avatar_id')
          .eq('user_id', queueEntry.opponent_user_id)
          .single()).data?.avatar_id)
        .single();

      return NextResponse.json({
        success: true,
        inQueue: true,
        matched: true,
        matchId: queueEntry.match_id,
        opponent: {
          userId: queueEntry.opponent_user_id,
          nome: opponentAvatar?.usuarios?.nome_usuario || 'Oponente',
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
