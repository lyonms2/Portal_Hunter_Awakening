import { NextResponse } from 'next/server';
import { getSupabaseClientSafe } from "@/lib/supabase/serverClient";

export const dynamic = 'force-dynamic';

/**
 * GET /api/pvp/historico?userId=xxx
 * Busca histórico de temporadas do jogador
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

    // Buscar histórico de temporadas
    const { data: historico, error } = await supabase
      .from('pvp_historico_temporadas')
      .select(`
        *,
        temporada:pvp_temporadas!pvp_historico_temporadas_temporada_id_fkey(
          temporada_id,
          nome,
          data_inicio,
          data_fim
        )
      `)
      .eq('user_id', userId)
      .order('data_encerramento', { ascending: false });

    if (error) {
      console.error('[HISTORICO] Erro ao buscar:', error);
      return NextResponse.json({ error: 'Erro ao buscar histórico' }, { status: 500 });
    }

    // Calcular estatísticas gerais
    const stats = {
      totalTemporadas: historico?.length || 0,
      totalVitorias: historico?.reduce((sum, h) => sum + (h.vitorias || 0), 0) || 0,
      totalDerrotas: historico?.reduce((sum, h) => sum + (h.derrotas || 0), 0) || 0,
      melhorPosicao: historico?.reduce((min, h) => {
        if (!h.posicao_final) return min;
        return min === null ? h.posicao_final : Math.min(min, h.posicao_final);
      }, null),
      melhorFama: historico?.reduce((max, h) => Math.max(max, h.fama_final || 0), 0) || 0,
      melhorStreak: historico?.reduce((max, h) => Math.max(max, h.streak_maximo || 0), 0) || 0
    };

    return NextResponse.json({
      success: true,
      historico: historico || [],
      stats
    });
  } catch (error) {
    console.error('[HISTORICO] Erro interno:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
