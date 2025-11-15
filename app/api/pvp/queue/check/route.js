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

    // INTELLIGENT RETRY LOGIC para lidar com read replica lag
    // Tenta até 3 vezes com delays crescentes: 100ms, 200ms, 400ms (total 700ms max)
    let queueEntry = null;
    let queueError = null;
    const maxRetries = 3;
    const retryDelays = [100, 200, 400]; // ms

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      if (attempt > 0) {
        const delay = retryDelays[attempt - 1];
        console.log(`⏱️ [${requestId}] Retry ${attempt}/${maxRetries - 1} após ${delay}ms devido a replica lag...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      // Buscar entrada na fila
      // IMPORTANTE: Usar .order() + .limit(1) + .maybeSingle() para FORÇAR query fresca
      // sem cache do Supabase client e evitar connection pooling issues
      const { data, error } = await supabase
        .from('pvp_matchmaking_queue')
        .select('*')
        .eq('user_id', userId)
        .order('id', { ascending: false }) // Cache buster: força query diferente a cada tentativa
        .limit(1)
        .maybeSingle(); // Evita erro se não encontrar, e força fetch novo

      queueEntry = data;
      queueError = error;

      console.log(`🔍 [${requestId}] Queue entry check (attempt ${attempt + 1}/${maxRetries}):`, {
        userId,
        found: !!queueEntry,
        status: queueEntry?.status,
        matchId: queueEntry?.match_id,
        opponentUserId: queueEntry?.opponent_user_id,
        timestamp: new Date().toISOString()
      });

      // Se encontrou matched, retorna imediatamente (sucesso!)
      if (queueEntry?.status === 'matched') {
        console.log(`✅ [${requestId}] Status=matched encontrado na tentativa ${attempt + 1}`);
        break;
      }

      // Se está waiting e é a última tentativa, aceita o resultado
      if (attempt === maxRetries - 1) {
        console.log(`⏹️ [${requestId}] Última tentativa: status=${queueEntry?.status || 'not found'}`);
        break;
      }

      // Se está waiting, pode ser replica lag, então tenta novamente
      if (queueEntry?.status === 'waiting') {
        console.log(`⚠️ [${requestId}] Status=waiting detectado, pode ser replica lag. Tentando novamente...`);
        continue;
      }

      // Se não encontrou na fila, não precisa retry
      if (!queueEntry) {
        console.log(`ℹ️ [${requestId}] Não encontrado na fila, não há necessidade de retry`);
        break;
      }
    }

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
