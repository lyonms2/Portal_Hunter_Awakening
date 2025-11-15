import { NextResponse } from 'next/server';
import { getSupabaseClientSafe } from "@/lib/supabase/serverClient";

export const dynamic = 'force-dynamic';

/**
 * POST /api/pvp/challenge/create
 * Cria um desafio PvP entre dois jogadores
 * Body: { challengerUserId, challengerAvatarId, challengedUserId, challengedAvatarId, ... }
 */
export async function POST(request) {
  try {
    const supabase = getSupabaseClientSafe(true);
    if (!supabase) {
      return NextResponse.json({ error: 'Serviço temporariamente indisponível' }, { status: 503 });
    }

    const body = await request.json();
    const {
      challengerUserId,
      challengerAvatarId,
      challengerNivel,
      challengerPoder,
      challengerFama,
      challengedUserId,
      challengedAvatarId,
      challengedNivel,
      challengedPoder,
      challengedFama
    } = body;

    // Validar campos obrigatórios
    if (!challengerUserId || !challengerAvatarId || !challengedUserId || !challengedAvatarId) {
      return NextResponse.json(
        { error: 'Dados do desafio incompletos' },
        { status: 400 }
      );
    }

    console.log('🎯 Criando desafio PvP:', {
      challenger: challengerUserId,
      challenged: challengedUserId
    });

    // Chamar função do banco para criar desafio
    const { data, error } = await supabase
      .rpc('create_pvp_challenge', {
        p_challenger_user_id: challengerUserId,
        p_challenger_avatar_id: challengerAvatarId,
        p_challenger_nivel: challengerNivel,
        p_challenger_poder: challengerPoder,
        p_challenger_fama: challengerFama || 1000,
        p_challenged_user_id: challengedUserId,
        p_challenged_avatar_id: challengedAvatarId,
        p_challenged_nivel: challengedNivel,
        p_challenged_poder: challengedPoder,
        p_challenged_fama: challengedFama || 1000
      });

    if (error) {
      console.error('Erro ao criar desafio:', error);
      return NextResponse.json({ error: 'Erro ao criar desafio' }, { status: 500 });
    }

    const result = data[0];

    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: result.message
      }, { status: 400 });
    }

    console.log('✅ Desafio criado com sucesso:', result.challenge_id);

    return NextResponse.json({
      success: true,
      challengeId: result.challenge_id,
      message: result.message
    });

  } catch (error) {
    console.error('Erro no POST /api/pvp/challenge/create:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
