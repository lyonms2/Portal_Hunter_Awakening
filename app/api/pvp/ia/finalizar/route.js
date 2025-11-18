import { NextResponse } from 'next/server';
import { getDocument, getDocuments, updateDocument, createDocument } from '@/lib/firebase/firestore';

export const dynamic = 'force-dynamic';

/**
 * POST /api/pvp/ia/finalizar
 *
 * 🎯 TREINO PVP (Assíncrono) - Finalizar batalha
 *
 * Registra resultado de uma batalha LOCAL contra avatar de outro jogador.
 * Atualiza fama, ranking, vínculo e exaustão do avatar.
 *
 * IMPORTANTE: Esta é uma batalha ASSÍNCRONA (não ao vivo)
 * - Você lutou contra o avatar de outro jogador
 * - A IA controlou o oponente no seu cliente
 * - O outro jogador NÃO estava online durante a luta
 *
 * Para batalhas AO VIVO em tempo real, use /api/pvp/battle/action
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, avatarId, vitoria, famaGanha, vinculoGanho, exaustaoGanha, avatarMorreu, hpFinal } = body;

    console.log('[PVP IA FINALIZAR]', { userId, avatarId, vitoria, famaGanha, vinculoGanho, exaustaoGanha, avatarMorreu, hpFinal });

    // Buscar temporada ativa no Firestore
    const temporadas = await getDocuments('pvp_temporadas', {
      where: [['ativa', '==', true]]
    });

    if (!temporadas || temporadas.length === 0) {
      console.error('[ERRO] Nenhuma temporada ativa encontrada');
      return NextResponse.json({ error: 'Nenhuma temporada ativa' }, { status: 404 });
    }

    const temporadaAtiva = temporadas[0];
    console.log('[TEMPORADA ATIVA]', temporadaAtiva.temporada_id);

    // 1. Atualizar ranking PVP (fama)
    const rankingId = `${userId}_${temporadaAtiva.temporada_id}`;
    const rankingAtual = await getDocument('pvp_rankings', rankingId);

    console.log('[RANKING ATUAL]', rankingAtual);

    if (rankingAtual) {
      // Atualizar existente
      const novaFama = Math.max(0, (rankingAtual.fama || 1000) + famaGanha);
      const novasVitorias = vitoria ? rankingAtual.vitorias + 1 : rankingAtual.vitorias;
      const novasDerrotas = !vitoria ? rankingAtual.derrotas + 1 : rankingAtual.derrotas;
      const novoStreak = vitoria ? (rankingAtual.streak || 0) + 1 : 0;

      console.log('[ATUALIZANDO RANKING]', { novaFama, novasVitorias, novasDerrotas, novoStreak });

      await updateDocument('pvp_rankings', rankingId, {
        fama: novaFama,
        vitorias: novasVitorias,
        derrotas: novasDerrotas,
        streak: novoStreak,
        streak_maximo: Math.max(rankingAtual.streak_maximo || 0, novoStreak),
        ultima_batalha: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      console.log('[RANKING ATUALIZADO COM SUCESSO]');
    } else {
      // Criar novo registro de ranking para a temporada ativa
      console.log('[CRIANDO NOVO RANKING]');
      await createDocument('pvp_rankings', {
        user_id: userId,
        temporada_id: temporadaAtiva.temporada_id,
        fama: Math.max(0, 1000 + famaGanha),
        vitorias: vitoria ? 1 : 0,
        derrotas: vitoria ? 0 : 1,
        streak: vitoria ? 1 : 0,
        streak_maximo: vitoria ? 1 : 0,
        ultima_batalha: new Date().toISOString(),
        recompensas_recebidas: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, rankingId);
    }

    // 2. Atualizar avatar
    const avatar = await getDocument('avatares', avatarId);

    console.log('[AVATAR ATUAL]', avatar);

    if (avatar) {
      const novoVinculo = Math.min(100, (avatar.vinculo || 0) + vinculoGanho);
      const novaExaustao = Math.min(100, (avatar.exaustao || 0) + exaustaoGanha);

      const updates = {
        vinculo: novoVinculo,
        exaustao: novaExaustao,
        hp_atual: avatarMorreu ? 0 : Math.max(1, hpFinal || 1), // Se não morreu, mínimo 1 HP
        updated_at: new Date().toISOString()
      };

      // Se morreu, marcar como morto (sem marca_morte, pode ser ressuscitado)
      if (avatarMorreu) {
        updates.vivo = false;
        // NÃO adicionar marca_morte - avatar pode ser ressuscitado pelo Necromante
      }

      console.log('[ATUALIZANDO AVATAR]', updates);

      await updateDocument('avatares', avatarId, updates);

      console.log('[AVATAR ATUALIZADO COM SUCESSO]');
    }

    // Buscar ranking atualizado para retornar ao frontend
    const rankingAtualizado = await getDocument('pvp_rankings', rankingId);

    return NextResponse.json({
      success: true,
      message: 'Resultado da batalha salvo com sucesso',
      ranking: rankingAtualizado || null
    });

  } catch (error) {
    console.error('[PVP IA FINALIZAR] Erro:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
