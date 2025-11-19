import { NextResponse } from 'next/server';
import { getDocuments, getDocument } from '@/lib/firebase/firestore';

export const dynamic = 'force-dynamic';

/**
 * GET /api/pvp/ia/leaderboard
 * Retorna o ranking de PVP IA ordenado por fama
 */
export async function GET(request) {
  try {
    // Buscar temporada ativa primeiro
    const temporadas = await getDocuments('pvp_temporadas', {
      where: [['ativa', '==', true]]
    });

    if (!temporadas || temporadas.length === 0) {
      console.error('[LEADERBOARD] Nenhuma temporada ativa encontrada');
      return NextResponse.json({ error: 'Nenhuma temporada ativa' }, { status: 404 });
    }

    const temporadaAtiva = temporadas[0];
    console.log('[LEADERBOARD] Temporada ativa:', temporadaAtiva.temporada_id);

    // Buscar top 100 rankings ordenados por fama DA TEMPORADA ATIVA
    const rankings = await getDocuments('pvp_rankings', {
      where: [['temporada_id', '==', temporadaAtiva.temporada_id]],
      orderBy: ['fama', 'desc'],
      limit: 100
    });

    if (!rankings || rankings.length === 0) {
      return NextResponse.json({
        success: true,
        rankings: []
      });
    }

    // Buscar nomes dos usuários da tabela player_stats (coluna nome_operacao)
    const rankingsComNomes = await Promise.all(
      rankings.map(async (rank) => {
        const playerStats = await getDocument('player_stats', rank.user_id);

        return {
          user_id: rank.user_id,
          fama: rank.fama,
          vitorias: rank.vitorias,
          derrotas: rank.derrotas,
          streak: rank.streak,
          nome: playerStats?.nome_operacao || 'Caçador Misterioso'
        };
      })
    );

    return NextResponse.json({
      success: true,
      rankings: rankingsComNomes
    });

  } catch (error) {
    console.error('[LEADERBOARD] Erro:', error);
    return NextResponse.json({ error: 'Erro interno do servidor: ' + error.message }, { status: 500 });
  }
}
