import { NextResponse } from 'next/server';
import { getSupabaseClientSafe } from "@/lib/supabase/serverClient";

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
    const supabase = getSupabaseClientSafe(true);
    if (!supabase) {
      return NextResponse.json({ error: 'Serviço temporariamente indisponível' }, { status: 503 });
    }
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

    // Buscar temporada ativa
    const { data: temporadaAtiva, error: errorTemporada } = await supabase
      .from('pvp_temporadas')
      .select('temporada_id')
      .eq('ativa', true)
      .single();

    if (errorTemporada || !temporadaAtiva) {
      return NextResponse.json({ error: 'Nenhuma temporada ativa' }, { status: 404 });
    }

    const temporadaId = temporadaAtiva.temporada_id;

    // Atualizar ranking do jogador 1
    const venceuJ1 = vencedorId === jogador1Id;
    const { data: ranking1, error: errorRank1 } = await supabase
      .rpc('atualizar_ranking_apos_batalha', {
        p_temporada_id: temporadaId,
        p_jogador1_id: jogador1Id,
        p_jogador2_id: jogador2Id,
        p_vencedor_id: vencedorId,
        p_jogador1_fama_ganho: jogador1FamaGanho,
        p_jogador2_fama_ganho: jogador2FamaGanho
      });

    if (errorRank1) {
      console.error('Erro ao atualizar rankings:', errorRank1);
      // Tentar atualização manual se a função RPC não existir
      await atualizarRankingManual(
        supabase,
        temporadaId,
        jogador1Id,
        venceuJ1,
        jogador1FamaGanho
      );
      await atualizarRankingManual(
        supabase,
        temporadaId,
        jogador2Id,
        !venceuJ1,
        jogador2FamaGanho
      );
    }

    // Salvar no log (opcional)
    if (salvarLog) {
      const diferencaFama = Math.abs(jogador1FamaAntes - jogador2FamaAntes);
      const foiUpset = (vencedorId === jogador1Id && jogador1FamaAntes < jogador2FamaAntes) ||
                       (vencedorId === jogador2Id && jogador2FamaAntes < jogador1FamaAntes);

      const { error: errorLog } = await supabase
        .from('pvp_batalhas_log')
        .insert({
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

      if (errorLog) {
        console.error('Erro ao salvar log de batalha:', errorLog);
        // Não retornar erro, pois o log é opcional
      }
    }

    // Buscar rankings atualizados
    const { data: ranking1Atualizado } = await supabase
      .from('pvp_rankings')
      .select('*')
      .eq('user_id', jogador1Id)
      .eq('temporada_id', temporadaId)
      .single();

    const { data: ranking2Atualizado } = await supabase
      .from('pvp_rankings')
      .select('*')
      .eq('user_id', jogador2Id)
      .eq('temporada_id', temporadaId)
      .single();

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
 * Função auxiliar para atualizar ranking manualmente
 */
async function atualizarRankingManual(supabase, temporadaId, userId, venceu, famaGanho) {
  // Buscar ranking atual
  const { data: rankingAtual } = await supabase
    .from('pvp_rankings')
    .select('*')
    .eq('user_id', userId)
    .eq('temporada_id', temporadaId)
    .single();

  if (!rankingAtual) {
    // Criar se não existe
    await supabase
      .from('pvp_rankings')
      .insert({
        user_id: userId,
        temporada_id: temporadaId,
        fama: Math.max(0, 1000 + famaGanho),
        vitorias: venceu ? 1 : 0,
        derrotas: venceu ? 0 : 1,
        streak: venceu ? 1 : 0,
        streak_maximo: venceu ? 1 : 0,
        ultima_batalha: new Date().toISOString()
      });
  } else {
    // Atualizar
    const novaFama = Math.max(0, rankingAtual.fama + famaGanho);
    const novoStreak = venceu ? rankingAtual.streak + 1 : 0;
    const novoStreakMaximo = Math.max(rankingAtual.streak_maximo, novoStreak);

    await supabase
      .from('pvp_rankings')
      .update({
        fama: novaFama,
        vitorias: venceu ? rankingAtual.vitorias + 1 : rankingAtual.vitorias,
        derrotas: venceu ? rankingAtual.derrotas : rankingAtual.derrotas + 1,
        streak: novoStreak,
        streak_maximo: novoStreakMaximo,
        ultima_batalha: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('temporada_id', temporadaId);
  }
}
