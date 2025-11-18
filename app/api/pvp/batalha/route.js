import { NextResponse } from 'next/server';
import { getDocument, getDocuments, createDocument, updateDocument } from '@/lib/firebase/firestore';

export const dynamic = 'force-dynamic';

/**
 * POST /api/pvp/batalha
 * Salva o resultado de uma batalha PvP e atualiza rankings
 *
 * Body: {
 *   jogador1Id: UUID,
 *   jogador2Id: UUID,
 *   vencedorId: UUID,
 *   jogador1FamaAntes: number,
 *   jogador2FamaAntes: number,
 *   jogador1FamaGanho: number,
 *   jogador2FamaGanho: number,
 *   duracaoRodadas: number,
 *   jogador1Recompensas: object,
 *   jogador2Recompensas: object,
 *   salvarLog: boolean (opcional, default false)
 * }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      jogador1Id,
      jogador2Id,
      vencedorId,
      jogador1FamaAntes,
      jogador2FamaAntes,
      jogador1FamaGanho,
      jogador2FamaGanho,
      duracaoRodadas,
      jogador1Recompensas,
      jogador2Recompensas,
      salvarLog = false
    } = body;

    // Validações
    if (!jogador1Id || !jogador2Id || !vencedorId) {
      return NextResponse.json(
        { error: 'jogador1Id, jogador2Id e vencedorId são obrigatórios' },
        { status: 400 }
      );
    }

    if (jogador1FamaGanho === undefined || jogador2FamaGanho === undefined) {
      return NextResponse.json(
        { error: 'jogador1FamaGanho e jogador2FamaGanho são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar temporada ativa no Firestore
    const temporadas = await getDocuments('pvp_temporadas', {
      where: [['ativa', '==', true]]
    });

    if (!temporadas || temporadas.length === 0) {
      return NextResponse.json({ error: 'Nenhuma temporada ativa' }, { status: 404 });
    }

    const temporadaAtiva = temporadas[0];
    const temporadaId = temporadaAtiva.temporada_id;

    // Atualizar rankings no Firestore
    const venceuJ1 = vencedorId === jogador1Id;

    await atualizarRankingManual(
      temporadaId,
      jogador1Id,
      venceuJ1,
      jogador1FamaGanho
    );

    await atualizarRankingManual(
      temporadaId,
      jogador2Id,
      !venceuJ1,
      jogador2FamaGanho
    );

    // Salvar no log (opcional)
    if (salvarLog) {
      const diferencaFama = Math.abs(jogador1FamaAntes - jogador2FamaAntes);
      const foiUpset = (vencedorId === jogador1Id && jogador1FamaAntes < jogador2FamaAntes) ||
                       (vencedorId === jogador2Id && jogador2FamaAntes < jogador1FamaAntes);

      try {
        await createDocument('pvp_batalhas_log', {
          temporada_id: temporadaId,
          jogador1_id: jogador1Id,
          jogador2_id: jogador2Id,
          jogador1_fama_antes: jogador1FamaAntes,
          jogador2_fama_antes: jogador2FamaAntes,
          vencedor_id: vencedorId,
          duracao_rodadas: duracaoRodadas,
          jogador1_fama_ganho: jogador1FamaGanho,
          jogador2_fama_ganho: jogador2FamaGanho,
          jogador1_recompensas: jogador1Recompensas,
          jogador2_recompensas: jogador2Recompensas,
          foi_upset: foiUpset,
          diferenca_fama: diferencaFama,
          data_batalha: new Date().toISOString()
        });
      } catch (errorLog) {
        console.error('Erro ao salvar log de batalha:', errorLog);
        // Não retornar erro, pois o log é opcional
      }
    }

    // Buscar rankings atualizados
    const ranking1Atualizado = await getDocument('pvp_rankings', `${jogador1Id}_${temporadaId}`);
    const ranking2Atualizado = await getDocument('pvp_rankings', `${jogador2Id}_${temporadaId}`);

    return NextResponse.json({
      success: true,
      jogador1: ranking1Atualizado,
      jogador2: ranking2Atualizado
    });
  } catch (error) {
    console.error('Erro no POST /api/pvp/batalha:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * Função auxiliar para atualizar ranking manualmente no Firestore
 */
async function atualizarRankingManual(temporadaId, userId, venceu, famaGanho) {
  const rankingId = `${userId}_${temporadaId}`;

  // Buscar ranking atual
  const rankingAtual = await getDocument('pvp_rankings', rankingId);

  if (!rankingAtual) {
    // Criar se não existe
    await createDocument('pvp_rankings', {
      user_id: userId,
      temporada_id: temporadaId,
      fama: Math.max(0, 1000 + famaGanho),
      vitorias: venceu ? 1 : 0,
      derrotas: venceu ? 0 : 1,
      streak: venceu ? 1 : 0,
      streak_maximo: venceu ? 1 : 0,
      ultima_batalha: new Date().toISOString(),
      recompensas_recebidas: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, rankingId);
  } else {
    // Atualizar
    const novaFama = Math.max(0, rankingAtual.fama + famaGanho);
    const novoStreak = venceu ? rankingAtual.streak + 1 : 0;
    const novoStreakMaximo = Math.max(rankingAtual.streak_maximo, novoStreak);

    await updateDocument('pvp_rankings', rankingId, {
      fama: novaFama,
      vitorias: venceu ? rankingAtual.vitorias + 1 : rankingAtual.vitorias,
      derrotas: venceu ? rankingAtual.derrotas : rankingAtual.derrotas + 1,
      streak: novoStreak,
      streak_maximo: novoStreakMaximo,
      ultima_batalha: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }
}
