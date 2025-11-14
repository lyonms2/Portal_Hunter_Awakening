import { NextResponse } from 'next/server';
import { getSupabaseClientSafe } from "@/lib/supabase/serverClient";

export const dynamic = 'force-dynamic';

/**
 * GET /api/pvp/leaderboard?limit=100&userId=xxx
 * Busca o leaderboard da temporada ativa
 */
export async function GET(request) {
  try {
    const supabase = getSupabaseClientSafe(true);
    if (!supabase) {
      return NextResponse.json({ error: 'Serviço temporariamente indisponível' }, { status: 503 });
    }
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const userId = searchParams.get('userId');

    // Buscar leaderboard da view
    const { data: leaderboard, error: errorLeaderboard } = await supabase
      .from('leaderboard_atual')
      .select('*')
      .limit(limit);

    if (errorLeaderboard) {
      console.error('Erro ao buscar leaderboard:', errorLeaderboard);
      return NextResponse.json({ error: 'Erro ao buscar leaderboard' }, { status: 500 });
    }

    // Se userId foi fornecido, buscar posição do jogador
    let posicaoJogador = null;
    let jogadorNoTop = false;

    if (userId) {
      // Verificar se jogador está no top retornado
      const jogadorIndex = leaderboard.findIndex(p => p.user_id === userId);

      if (jogadorIndex !== -1) {
        posicaoJogador = leaderboard[jogadorIndex].posicao;
        jogadorNoTop = true;
      } else {
        // Buscar posição exata do jogador na view completa
        const { data: jogadorData, error: errorJogador } = await supabase
          .from('leaderboard_atual')
          .select('posicao, fama, vitorias, derrotas, streak, win_rate')
          .eq('user_id', userId)
          .single();

        if (!errorJogador && jogadorData) {
          posicaoJogador = jogadorData.posicao;
          jogadorNoTop = false;
        }
      }
    }

    return NextResponse.json({
      success: true,
      leaderboard,
      posicaoJogador,
      jogadorNoTop: jogadorNoTop,
      total: leaderboard.length
    });
  } catch (error) {
    console.error('Erro no GET /api/pvp/leaderboard:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
