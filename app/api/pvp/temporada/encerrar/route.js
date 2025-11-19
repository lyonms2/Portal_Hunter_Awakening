import { NextResponse } from 'next/server';
import { getDocuments, updateDocument, createDocument } from '@/lib/firebase/firestore';

export const dynamic = 'force-dynamic';

/**
 * POST /api/pvp/temporada/encerrar
 * Encerra a temporada ativa e distribui recompensas
 * IMPORTANTE: Deve ser chamado automaticamente a cada 30 dias ou manualmente por admin
 *
 * TODO: Esta funcionalidade complexa deveria ser migrada para Firebase Cloud Functions
 * para melhor performance e confiabilidade em operações batch.
 */
export async function POST(request) {
  try {
    console.log('[ENCERRAR TEMPORADA] Iniciando encerramento...');

    // 1. Buscar temporada ativa
    const temporadas = await getDocuments('pvp_temporadas', {
      where: [['ativa', '==', true]]
    });

    if (!temporadas || temporadas.length === 0) {
      return NextResponse.json({ error: 'Nenhuma temporada ativa encontrada' }, { status: 404 });
    }

    const temporadaAtiva = temporadas[0];

    // 2. Buscar todos os rankings da temporada
    const rankings = await getDocuments('pvp_rankings', {
      where: [['temporada_id', '==', temporadaAtiva.temporada_id]]
    });

    // 3. Ordenar por fama e calcular posições
    const rankingsOrdenados = (rankings || [])
      .sort((a, b) => b.fama - a.fama)
      .map((ranking, index) => ({
        ...ranking,
        posicao_final: index + 1
      }));

    // 4. Processar cada jogador (salvar histórico, gerar recompensas, títulos)
    const promises = rankingsOrdenados.map(async (ranking, index) => {
      // Salvar histórico
      await createDocument('pvp_historico_temporadas', {
        user_id: ranking.user_id,
        temporada_id: temporadaAtiva.temporada_id,
        posicao_final: ranking.posicao_final,
        fama_final: ranking.fama,
        vitorias: ranking.vitorias,
        derrotas: ranking.derrotas,
        streak_maximo: ranking.streak_maximo,
        data_encerramento: new Date().toISOString()
      });

      // Gerar recompensas para top 100
      if (index < 100) {
        const moedas = index < 10 ? 10000 : index < 50 ? 5000 : 2000;
        const fragmentos = index < 10 ? 500 : index < 50 ? 250 : 100;

        await createDocument('pvp_recompensas_pendentes', {
          user_id: ranking.user_id,
          temporada_id: temporadaAtiva.temporada_id,
          posicao: ranking.posicao_final,
          moedas,
          fragmentos,
          avatar_lendario: index === 0, // 1º lugar ganha avatar lendário
          avatar_raro: index > 0 && index < 10, // 2º-10º ganham avatar raro
          coletada: false,
          created_at: new Date().toISOString()
        });
      }

      // Criar títulos para top 10
      if (index < 10) {
        const titulosNomes = [
          'Campeão Supremo', 'Lenda Imortal', 'Mestre Absoluto',
          'Grande Conquistador', 'Herói Lendário', 'Guerreiro Épico',
          'Combatente Elite', 'Campeão Veterano', 'Mestre de Batalha', 'Gladiador Honrado'
        ];

        await createDocument('pvp_titulos', {
          user_id: ranking.user_id,
          temporada_id: temporadaAtiva.temporada_id,
          titulo_nome: titulosNomes[index],
          titulo_icone: '🏆',
          posicao: ranking.posicao_final,
          ativo: false,
          data_conquista: new Date().toISOString()
        });
      }
    });

    await Promise.all(promises);

    // 5. Desativar temporada atual
    await updateDocument('pvp_temporadas', temporadaAtiva.id, {
      ativa: false,
      data_encerramento: new Date().toISOString()
    });

    console.log('[ENCERRAR TEMPORADA] Temporada encerrada com sucesso!');

    // 6. Criar nova temporada automaticamente
    const novaTemporadaId = `SEASON_${Date.now()}`;
    const dataInicio = new Date();
    const dataFim = new Date(dataInicio);
    dataFim.setDate(dataFim.getDate() + 30); // 30 dias

    await createDocument('pvp_temporadas', {
      temporada_id: novaTemporadaId,
      nome: `Temporada ${parseInt(temporadaAtiva.temporada_id.split('_')[1]) + 1 || 'Nova'}`,
      data_inicio: dataInicio.toISOString(),
      data_fim: dataFim.toISOString(),
      ativa: true,
      created_at: new Date().toISOString()
    }, novaTemporadaId);

    return NextResponse.json({
      success: true,
      message: 'Temporada encerrada e nova temporada criada com sucesso',
      jogadores_processados: rankingsOrdenados.length
    });
  } catch (error) {
    console.error('[ENCERRAR TEMPORADA] Erro interno:', error);
    return NextResponse.json({
      error: 'Erro interno do servidor',
      details: error.message
    }, { status: 500 });
  }
}
