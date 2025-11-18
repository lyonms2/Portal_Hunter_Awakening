import { NextResponse } from 'next/server';
import { getDocument, getDocuments, createDocument, updateDocument } from '@/lib/firebase/firestore';

export const dynamic = 'force-dynamic';

/**
 * GET /api/pvp/ranking?userId=xxx
 * Busca o ranking do jogador na temporada ativa
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }

    // Buscar temporada ativa no Firestore
    const temporadas = await getDocuments('pvp_temporadas', {
      where: [['ativa', '==', true]]
    });

    if (!temporadas || temporadas.length === 0) {
      return NextResponse.json({ error: 'Nenhuma temporada ativa encontrada' }, { status: 404 });
    }

    const temporadaAtiva = temporadas[0];

    // Buscar ranking do jogador
    const rankingId = `${userId}_${temporadaAtiva.temporada_id}`;
    const ranking = await getDocument('pvp_rankings', rankingId);

    // Se não existe, criar registro inicial
    if (!ranking) {
      const novoRanking = {
        user_id: userId,
        temporada_id: temporadaAtiva.temporada_id,
        fama: 1000,
        vitorias: 0,
        derrotas: 0,
        streak: 0,
        streak_maximo: 0,
        ultima_batalha: null,
        recompensas_recebidas: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await createDocument('pvp_rankings', novoRanking, rankingId);

      return NextResponse.json({
        success: true,
        ranking: { id: rankingId, ...novoRanking },
        temporada: temporadaAtiva.temporada_id
      });
    }

    return NextResponse.json({
      success: true,
      ranking,
      temporada: temporadaAtiva.temporada_id
    });
  } catch (error) {
    console.error('Erro no GET /api/pvp/ranking:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * POST /api/pvp/ranking
 * Atualiza o ranking do jogador após uma batalha
 * Body: { userId, venceu, famaGanho }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, venceu, famaGanho } = body;

    if (!userId || venceu === undefined || famaGanho === undefined) {
      return NextResponse.json(
        { error: 'userId, venceu e famaGanho são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar temporada ativa
    const temporadas = await getDocuments('pvp_temporadas', {
      where: [['ativa', '==', true]]
    });

    if (!temporadas || temporadas.length === 0) {
      return NextResponse.json({ error: 'Nenhuma temporada ativa' }, { status: 404 });
    }

    const temporadaAtiva = temporadas[0];

    // Buscar ranking atual
    const rankingId = `${userId}_${temporadaAtiva.temporada_id}`;
    const rankingAtual = await getDocument('pvp_rankings', rankingId);

    if (!rankingAtual) {
      console.error('Ranking não encontrado');
      return NextResponse.json({ error: 'Ranking não encontrado' }, { status: 404 });
    }

    // Calcular novos valores
    const novaFama = Math.max(0, rankingAtual.fama + famaGanho);
    const novasVitorias = venceu ? rankingAtual.vitorias + 1 : rankingAtual.vitorias;
    const novasDerrotas = !venceu ? rankingAtual.derrotas + 1 : rankingAtual.derrotas;
    const novoStreak = venceu ? rankingAtual.streak + 1 : 0;
    const novoStreakMaximo = Math.max(rankingAtual.streak_maximo, novoStreak);

    // Atualizar ranking no Firestore
    await updateDocument('pvp_rankings', rankingId, {
      fama: novaFama,
      vitorias: novasVitorias,
      derrotas: novasDerrotas,
      streak: novoStreak,
      streak_maximo: novoStreakMaximo,
      ultima_batalha: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    // Buscar ranking atualizado
    const rankingAtualizado = await getDocument('pvp_rankings', rankingId);

    return NextResponse.json({
      success: true,
      ranking: rankingAtualizado
    });
  } catch (error) {
    console.error('Erro no POST /api/pvp/ranking:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
