import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/**
 * GET /api/pvp/challenge/check-accepted?challengeId=xxx
 * Verifica se um desafio específico foi aceito
 */
export async function GET(request) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      return NextResponse.json({ error: 'Configuração inválida' }, { status: 503 });
    }

    const supabase = createClient(url, key);

    const { searchParams } = new URL(request.url);
    const challengeId = searchParams.get('challengeId');

    if (!challengeId) {
      return NextResponse.json({ error: 'challengeId é obrigatório' }, { status: 400 });
    }

    console.log('[CHECK] Verificando desafio:', challengeId);

    // Buscar o desafio
    const { data: challenge, error } = await supabase
      .from('pvp_challenges')
      .select('*')
      .eq('id', challengeId)
      .single();

    console.log('[CHECK] Resultado:', { challenge, error });

    if (error || !challenge) {
      return NextResponse.json({
        accepted: false,
        error: 'Desafio não encontrado'
      });
    }

    if (challenge.status === 'accepted' && challenge.match_id) {
      // Buscar dados do oponente
      const { data: avatar } = await supabase
        .from('avatares')
        .select('*')
        .eq('id', challenge.challenged_avatar_id)
        .single();

      const { data: ranking } = await supabase
        .from('pvp_rankings')
        .select('fama')
        .eq('user_id', challenge.challenged_user_id)
        .single();

      return NextResponse.json({
        accepted: true,
        matchId: challenge.match_id,
        opponent: {
          userId: challenge.challenged_user_id,
          avatarId: challenge.challenged_avatar_id,
          avatar: avatar,
          fama: ranking?.fama || 1000
        }
      });
    }

    return NextResponse.json({ accepted: false });

  } catch (error) {
    console.error('[CHECK] Erro:', error);
    return NextResponse.json({ error: 'Erro interno', accepted: false }, { status: 500 });
  }
}
