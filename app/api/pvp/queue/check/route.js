import { NextResponse } from 'next/server';
import { getSupabaseClientSafe } from "@/lib/supabase/serverClient";

export const dynamic = 'force-dynamic';

/**
 * GET /api/pvp/queue/check?userId=xxx
 * Verifica se o jogador encontrou um match
 */
export async function GET(request) {
  const requestId = `check_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = new Date().toISOString();

  try {
    const supabase = getSupabaseClientSafe(true);
    if (!supabase) {
      return NextResponse.json({ error: 'Serviço temporariamente indisponível' }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    console.log(`🔍 [${requestId}] ${timestamp} - /check INICIADO para userId=${userId}`);

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }

    // Buscar entrada na fila
    const { data: queueEntry, error: queueError } = await supabase
      .from('pvp_matchmaking_queue')
      .select('*')
      .eq('user_id', userId)
      .single();

    console.log(`🔍 [${requestId}] Queue entry check:`, {
      userId,
      found: !!queueEntry,
      status: queueEntry?.status,
      matchId: queueEntry?.match_id,
      opponentUserId: queueEntry?.opponent_user_id,
      timestamp: new Date().toISOString()
    });

    if (queueError || !queueEntry) {
      console.log(`⚠️ [${requestId}] Não encontrado na fila:`, queueError?.message);
      return NextResponse.json({
        success: true,
        inQueue: false,
        matched: false
      });
    }

    // Se ainda está aguardando, retornar status de espera
    // IMPORTANTE: NÃO chamamos find_pvp_match() aqui para evitar race conditions!
    // O matchmaking é feito APENAS no /join
    if (queueEntry.status === 'waiting') {
      console.log(`⏳ [${requestId}] Jogador ainda aguardando na fila`);

      return NextResponse.json({
        success: true,
        inQueue: true,
        matched: false,
        waitingTime: Math.floor((new Date() - new Date(queueEntry.entered_at)) / 1000)
      });
    }

    // Se já encontrou match
    if (queueEntry.status === 'matched') {
      console.log('🎯 Jogador JÁ está matched!');
      console.log('   Match ID:', queueEntry.match_id);
      console.log('   Opponent User ID:', queueEntry.opponent_user_id);

      // Buscar avatar_id do oponente na fila
      const { data: opponentQueue, error: oppQueueError } = await supabase
        .from('pvp_matchmaking_queue')
        .select('avatar_id')
        .eq('user_id', queueEntry.opponent_user_id)
        .single();

      if (!opponentQueue || oppQueueError) {
        console.error('❌ Erro ao buscar avatar do oponente:', oppQueueError);
        return NextResponse.json({
          success: false,
          error: 'Dados do oponente não encontrados'
        }, { status: 404 });
      }

      console.log('   Opponent Avatar ID:', opponentQueue.avatar_id);

      // Buscar dados do avatar do oponente
      const { data: opponentAvatar, error: avatarError } = await supabase
        .from('avatares')
        .select('*')
        .eq('id', opponentQueue.avatar_id)
        .single();

      console.log('✅ Retornando match para jogador que estava esperando');

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
