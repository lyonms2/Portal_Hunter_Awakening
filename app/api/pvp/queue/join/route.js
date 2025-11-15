import { NextResponse } from 'next/server';
import { getSupabaseClientSafe } from "@/lib/supabase/serverClient";

export const dynamic = 'force-dynamic';

/**
 * POST /api/pvp/queue/join
 * Adiciona jogador à fila de matchmaking
 * Body: { userId, avatarId, nivel, poderTotal, fama }
 */
export async function POST(request) {
  try {
    const supabase = getSupabaseClientSafe(true);
    if (!supabase) {
      return NextResponse.json({ error: 'Serviço temporariamente indisponível' }, { status: 503 });
    }

    const body = await request.json();
    const { userId, avatarId, nivel, poderTotal, fama } = body;

    if (!userId || !avatarId || !nivel || !poderTotal) {
      return NextResponse.json(
        { error: 'userId, avatarId, nivel e poderTotal são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se o jogador já está na fila
    const { data: existingEntry, error: checkError } = await supabase
      .from('pvp_matchmaking_queue')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existingEntry) {
      // Se já está na fila e aguardando, retornar sucesso
      if (existingEntry.status === 'waiting') {
        return NextResponse.json({
          success: true,
          message: 'Já está na fila',
          queueEntry: existingEntry
        });
      }

      // Se já encontrou match, retornar o match
      if (existingEntry.status === 'matched') {
        console.log('♻️ Jogador já estava matched, retornando match existente');

        // Buscar avatar_id do oponente
        const { data: opponentQueue } = await supabase
          .from('pvp_matchmaking_queue')
          .select('avatar_id')
          .eq('user_id', existingEntry.opponent_user_id)
          .single();

        return NextResponse.json({
          success: true,
          matched: true,
          matchId: existingEntry.match_id,
          opponentUserId: existingEntry.opponent_user_id,
          opponentAvatarId: opponentQueue?.avatar_id
        });
      }
    }

    // Remover entrada antiga se existir (EXCETO se já estiver matched)
    if (existingEntry) {
      if (existingEntry.status === 'matched') {
        // Não deve chegar aqui (já retornou acima), mas por segurança
        console.error('⚠️ Tentativa de recriar entrada matched - abortando');
        return NextResponse.json({
          error: 'Jogador já está em uma partida matched'
        }, { status: 400 });
      }

      console.log('🗑️ Removendo entrada antiga com status:', existingEntry.status);
      await supabase
        .from('pvp_matchmaking_queue')
        .delete()
        .eq('user_id', userId);
    }

    // Adicionar à fila
    const { data: queueEntry, error: insertError } = await supabase
      .from('pvp_matchmaking_queue')
      .insert({
        user_id: userId,
        avatar_id: avatarId,
        nivel: nivel,
        poder_total: poderTotal,
        fama: fama || 1000,
        status: 'waiting'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Erro ao entrar na fila:', insertError);
      return NextResponse.json({ error: 'Erro ao entrar na fila' }, { status: 500 });
    }

    // Tentar encontrar match imediatamente
    const { data: matchResult, error: matchError } = await supabase
      .rpc('find_pvp_match', {
        p_user_id: userId,
        p_nivel: nivel,
        p_poder_total: poderTotal,
        p_fama: fama || 1000
      });

    console.log('🔍 Match result:', JSON.stringify(matchResult, null, 2));

    if (matchError) {
      console.error('Erro ao buscar match:', matchError);
    }

    // Se encontrou match
    if (matchResult && matchResult.length > 0 && matchResult[0].matched) {
      console.log('✅ ============ MATCH ENCONTRADO! ============');
      console.log('   Player 1 (esperando):', matchResult[0].opponent_user_id);
      console.log('   Player 2 (novo):', userId);
      console.log('   Match ID:', matchResult[0].match_id);
      console.log('   Avatar Oponente:', matchResult[0].opponent_avatar_id);

      // Verificar se ambos foram atualizados na fila
      const { data: queueCheck } = await supabase
        .from('pvp_matchmaking_queue')
        .select('user_id, status, match_id, opponent_user_id')
        .in('user_id', [userId, matchResult[0].opponent_user_id]);

      console.log('📋 Status dos jogadores na fila após match:');
      queueCheck?.forEach(entry => {
        console.log(`   User ${entry.user_id === userId ? '(novo)' : '(esperando)'}: status=${entry.status}, match_id=${entry.match_id}`);
      });
      console.log('==========================================');

      return NextResponse.json({
        success: true,
        matched: true,
        matchId: matchResult[0].match_id,
        opponentUserId: matchResult[0].opponent_user_id,
        opponentAvatarId: matchResult[0].opponent_avatar_id
      });
    }

    // Ainda aguardando na fila
    return NextResponse.json({
      success: true,
      matched: false,
      queueEntry: queueEntry,
      message: 'Aguardando oponente...'
    });

  } catch (error) {
    console.error('Erro no POST /api/pvp/queue/join:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
