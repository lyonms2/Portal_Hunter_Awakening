import { NextResponse } from 'next/server';
import { getDocuments, getDocument } from '@/lib/firebase/firestore';

export const dynamic = 'force-dynamic';

/**
 * GET /api/pvp/historico?userId=xxx
 * Busca histórico de temporadas do jogador
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }

    // Buscar histórico de temporadas no Firestore
    const historicoItems = await getDocuments('pvp_historico_temporadas', {
      where: [['user_id', '==', userId]],
      orderBy: [['data_encerramento', 'desc']]
    });

    // Para cada item do histórico, buscar detalhes da temporada
    // (Firestore não suporta JOIN, então fazemos queries separadas)
    const historico = await Promise.all(
      (historicoItems || []).map(async (item) => {
        const temporada = await getDocument('pvp_temporadas', item.temporada_id);

        return {
          ...item,
          temporada: temporada ? {
            temporada_id: temporada.temporada_id,
            nome: temporada.nome,
            data_inicio: temporada.data_inicio,
            data_fim: temporada.data_fim
          } : null
        };
      })
    );

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
    return NextResponse.json({ error: 'Erro interno do servidor: ' + error.message }, { status: 500 });
  }
}
