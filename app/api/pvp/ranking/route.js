import { NextResponse } from 'next/server';
import { getSupabaseClientSafe } from "@/lib/supabase/serverClient";

export const dynamic = 'force-dynamic';

/**
 * GET /api/pvp/ranking?userId=xxx
 * Busca o ranking do jogador na temporada ativa
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

    // Buscar temporada ativa
    const { data: temporadaAtiva, error: errorTemporada } = await supabase
      .from('pvp_temporadas')
      .select('temporada_id')
      .eq('ativa', true)
      .single();

    if (errorTemporada) {
      console.error('Erro ao buscar temporada ativa:', errorTemporada);
      return NextResponse.json({ error: 'Erro ao buscar temporada ativa' }, { status: 500 });
    }

    if (!temporadaAtiva) {
      return NextResponse.json({ error: 'Nenhuma temporada ativa encontrada' }, { status: 404 });
    }

    // Buscar ranking do jogador
    const { data: ranking, error: errorRanking } = await supabase
      .from('pvp_rankings')
      .select('*')
      .eq('user_id', userId)
      .eq('temporada_id', temporadaAtiva.temporada_id)
      .single();

    // Se não existe, criar registro inicial
    if (errorRanking && errorRanking.code === 'PGRST116') {
      const { data: novoRanking, error: errorCriar } = await supabase
        .from('pvp_rankings')
        .insert({
          user_id: userId,
          temporada_id: temporadaAtiva.temporada_id,
          fama: 1000,
          vitorias: 0,
          derrotas: 0,
          streak: 0,
          streak_maximo: 0
        })
        .select()
        .single();

      if (errorCriar) {
        console.error('Erro ao criar ranking:', errorCriar);
        return NextResponse.json({ error: 'Erro ao criar ranking' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        ranking: novoRanking,
        temporada: temporadaAtiva.temporada_id
      });
    }

    if (errorRanking) {
      console.error('Erro ao buscar ranking:', errorRanking);
      return NextResponse.json({ error: 'Erro ao buscar ranking' }, { status: 500 });
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
    const supabase = getSupabaseClientSafe(true);
    if (!supabase) {
      return NextResponse.json({ error: 'Serviço temporariamente indisponível' }, { status: 503 });
    }
    const body = await request.json();
    const { userId, venceu, famaGanho } = body;

    if (!userId || venceu === undefined || famaGanho === undefined) {
      return NextResponse.json(
        { error: 'userId, venceu e famaGanho são obrigatórios' },
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

    // Buscar ranking atual
    const { data: rankingAtual, error: errorBuscar } = await supabase
      .from('pvp_rankings')
      .select('*')
      .eq('user_id', userId)
      .eq('temporada_id', temporadaAtiva.temporada_id)
      .single();

    if (errorBuscar) {
      console.error('Erro ao buscar ranking:', errorBuscar);
      return NextResponse.json({ error: 'Ranking não encontrado' }, { status: 404 });
    }

    // Calcular novos valores
    const novaFama = Math.max(0, rankingAtual.fama + famaGanho);
    const novasVitorias = venceu ? rankingAtual.vitorias + 1 : rankingAtual.vitorias;
    const novasDerrotas = !venceu ? rankingAtual.derrotas + 1 : rankingAtual.derrotas;
    const novoStreak = venceu ? rankingAtual.streak + 1 : 0;
    const novoStreakMaximo = Math.max(rankingAtual.streak_maximo, novoStreak);

    // Atualizar ranking
    const { data: rankingAtualizado, error: errorAtualizar } = await supabase
      .from('pvp_rankings')
      .update({
        fama: novaFama,
        vitorias: novasVitorias,
        derrotas: novasDerrotas,
        streak: novoStreak,
        streak_maximo: novoStreakMaximo,
        ultima_batalha: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('temporada_id', temporadaAtiva.temporada_id)
      .select()
      .single();

    if (errorAtualizar) {
      console.error('Erro ao atualizar ranking:', errorAtualizar);
      return NextResponse.json({ error: 'Erro ao atualizar ranking' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      ranking: rankingAtualizado
    });
  } catch (error) {
    console.error('Erro no POST /api/pvp/ranking:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
