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

    // Primeiro, verificar se o desafio existe e está válido
    const { data: challenge, error: challengeError } = await supabase
      .from('pvp_challenges')
      .select('*')
      .eq('id', challengeId)
      .single();

    if (challengeError || !challenge) {
      console.error('❌ Desafio não encontrado:', challengeError);
      return NextResponse.json({ error: 'Desafio não encontrado' }, { status: 404 });
    }

    console.log('📋 Desafio encontrado:', {
      id: challenge.id,
      status: challenge.status,
      challenger: challenge.challenger_user_id,
      challenged: challenge.challenged_user_id,
      expires_at: challenge.expires_at,
      now: new Date().toISOString()
    });

    // Chamar função do banco para aceitar desafio
    const { data, error } = await supabase
      .rpc('accept_pvp_challenge', {
        p_challenge_id: challengeId,
        p_user_id: userId
      });

    console.log('📡 RPC result:', { data, error });

    if (error) {
      console.error('❌ Erro ao chamar accept_pvp_challenge:', error);
      return NextResponse.json({
        error: 'Erro ao aceitar desafio',
        details: error.message
      }, { status: 500 });
    }

    if (!data || data.length === 0) {
      console.error('❌ Função não retornou dados');
      return NextResponse.json({ error: 'Função não retornou resultado' }, { status: 500 });
    }

    const result = data[0];
    console.log('📊 Result from function:', result);

    if (!result.success) {
      console.log('⚠️ Função retornou sucesso=false:', result.message);
      return NextResponse.json({
        success: false,
        message: result.message
      }, { status: 400 });
    }

    console.log('🎮 Desafio aceito! Match ID:', result.match_id);

    // IMPORTANTE: Fazer UPDATE manual do desafio para garantir que status seja atualizado
    console.log('🔄 Atualizando status do desafio manualmente...');
    const { error: updateError } = await supabase
      .from('pvp_challenges')
      .update({
        status: 'accepted',
        match_id: result.match_id,
        responded_at: new Date().toISOString()
      })
      .eq('id', challengeId);

    if (updateError) {
      console.error('⚠️ Erro ao atualizar desafio:', updateError);
    } else {
      console.log('✅ Desafio atualizado com sucesso!');
    }

    // Aguardar 500ms para garantir que o INSERT foi commitado
    await new Promise(resolve => setTimeout(resolve, 500));

    // Buscar dados da sala de batalha criada
    console.log('🔍 Buscando sala de batalha:', result.match_id);
    const { data: battleRoom, error: roomError } = await supabase
      .from('pvp_battle_rooms')
      .select('*')
      .eq('id', result.match_id)
      .single();

    console.log('📡 Sala encontrada?', { found: !!battleRoom, error: roomError });

    if (roomError || !battleRoom) {
      console.error('❌ Erro ao buscar sala de batalha:', roomError);

      // Tentar buscar todas as salas para debug
      const { data: allRooms } = await supabase
        .from('pvp_battle_rooms')
        .select('id, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      console.error('🔍 Últimas 5 salas criadas:', allRooms);

      return NextResponse.json({
        error: 'Erro ao buscar sala de batalha',
        matchId: result.match_id,
        roomError: roomError?.message
      }, { status: 500 });
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
