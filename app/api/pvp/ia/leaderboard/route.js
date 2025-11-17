import { NextResponse } from 'next/server';
import { getSupabaseClientSafe } from "@/lib/supabase/serverClient";

export const dynamic = 'force-dynamic';

/**
 * GET /api/pvp/ia/leaderboard
 * Retorna o ranking de PVP IA ordenado por fama
 */
export async function GET(request) {
  try {
    const supabase = getSupabaseClientSafe(true);
    if (!supabase) {
      return NextResponse.json({ error: 'Serviço temporariamente indisponível' }, { status: 503 });
    }

    // Buscar temporada ativa primeiro
    const { data: temporadaAtiva, error: errorTemporada } = await supabase
      .from('pvp_temporadas')
      .select('temporada_id')
      .eq('ativa', true)
      .single();

    if (errorTemporada || !temporadaAtiva) {
      console.error('[LEADERBOARD] Nenhuma temporada ativa encontrada:', errorTemporada);
      return NextResponse.json({ error: 'Nenhuma temporada ativa' }, { status: 404 });
    }

    console.log('[LEADERBOARD] Temporada ativa:', temporadaAtiva.temporada_id);

    // Buscar top 100 rankings ordenados por fama DA TEMPORADA ATIVA
    const { data: rankings, error: rankingsError } = await supabase
      .from('pvp_rankings')
      .select('user_id, fama, vitorias, derrotas, streak')
      .eq('temporada_id', temporadaAtiva.temporada_id)
      .order('fama', { ascending: false })
      .limit(100);

    if (rankingsError) {
      console.error('[LEADERBOARD] Erro ao buscar rankings:', rankingsError);
      return NextResponse.json({ error: 'Erro ao buscar rankings' }, { status: 500 });
    }

    // Buscar nomes dos usuários da tabela player_stats (coluna nome_operacao)
    const userIds = rankings.map(r => r.user_id);

    const { data: playerStats } = await supabase
      .from('player_stats')
      .select('user_id, nome_operacao')
      .in('user_id', userIds);

    // Criar mapa de userId -> nome
    const nomesMap = {};
    if (playerStats && playerStats.length > 0) {
      playerStats.forEach(stats => {
        nomesMap[stats.user_id] = stats.nome_operacao || 'Caçador Misterioso';
      });
    }

    // Adicionar nomes aos rankings
    const rankingsComNomes = rankings.map(rank => ({
      ...rank,
      nome: nomesMap[rank.user_id] || 'Caçador Misterioso'
    }));

    return NextResponse.json({
      success: true,
      rankings: rankingsComNomes
    });

  } catch (error) {
    console.error('[LEADERBOARD] Erro:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
