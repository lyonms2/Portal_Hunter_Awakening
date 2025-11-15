import { NextResponse } from 'next/server';
import { getSupabaseClientSafe } from "@/lib/supabase/serverClient";

export const dynamic = 'force-dynamic';

/**
 * GET /api/pvp/matchmaking?userId=xxx&nivel=10
 * Busca um oponente adequado para o jogador
 */
export async function GET(request) {
  try {
    const supabase = getSupabaseClientSafe(true);
    if (!supabase) {
      return NextResponse.json({ error: 'Serviço temporariamente indisponível' }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const nivel = parseInt(searchParams.get('nivel') || '1');
    const fama = parseInt(searchParams.get('fama') || '1000');

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
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

    // Faixa de nível para busca (±2 níveis)
    const nivelMin = Math.max(1, nivel - 2);
    const nivelMax = nivel + 2;

    // Faixa de fama para busca (±300 fama)
    const famaMin = Math.max(0, fama - 300);
    const famaMax = fama + 300;

    // Buscar jogadores com avatares ativos próximos ao nível e fama do jogador
    // Primeiro, buscar avatares ativos de outros jogadores
    const { data: avatares, error: errorAvatares } = await supabase
      .from('avatares')
      .select(`
        id,
        user_id,
        nome,
        nivel,
        elemento,
        raridade,
        forca,
        agilidade,
        resistencia,
        foco,
        vivo,
        exaustao,
        hp_atual
      `)
      .eq('ativo', true)
      .eq('vivo', true)
      .neq('user_id', userId)
      .gte('nivel', nivelMin)
      .lte('nivel', nivelMax)
      .lt('exaustao', 80) // Não pegar avatares colapsados
      .limit(50); // Pegar até 50 candidatos

    if (errorAvatares) {
      console.error('Erro ao buscar avatares:', errorAvatares);
      return NextResponse.json({ error: 'Erro ao buscar oponentes' }, { status: 500 });
    }

    if (!avatares || avatares.length === 0) {
      // Se não encontrou ninguém, retornar null para página criar oponente simulado
      return NextResponse.json({
        success: true,
        oponente: null,
        message: 'Nenhum oponente disponível no momento'
      });
    }

    // Buscar rankings dos candidatos para filtrar por fama
    const userIds = avatares.map(av => av.user_id);
    const { data: rankings, error: errorRankings } = await supabase
      .from('pvp_rankings')
      .select('user_id, fama')
      .in('user_id', userIds)
      .eq('temporada_id', temporadaAtiva.temporada_id);

    if (errorRankings) {
      console.error('Erro ao buscar rankings:', errorRankings);
      // Se falhar, continua sem filtro de fama
    }

    // Criar mapa de fama por usuário
    const famaMap = {};
    if (rankings) {
      rankings.forEach(r => {
        famaMap[r.user_id] = r.fama || 1000;
      });
    }

    // Filtrar avatares por fama e criar lista de candidatos
    let candidatos = avatares.map(avatar => {
      const famaOponente = famaMap[avatar.user_id] || 1000;
      const diferencaFama = Math.abs(famaOponente - fama);
      const diferencaNivel = Math.abs(avatar.nivel - nivel);

      return {
        avatar,
        famaOponente,
        diferencaFama,
        diferencaNivel,
        score: (diferencaFama / 10) + (diferencaNivel * 50) // Pontuação de matchmaking
      };
    });

    // Filtrar por fama (permitir range maior se não houver muitos jogadores)
    const candidatosDentroFama = candidatos.filter(c =>
      c.famaOponente >= famaMin && c.famaOponente <= famaMax
    );

    // Se tiver pelo menos 3 dentro da faixa, usar só eles. Senão, usar todos
    if (candidatosDentroFama.length >= 3) {
      candidatos = candidatosDentroFama;
    }

    // Ordenar por score (menor = melhor match)
    candidatos.sort((a, b) => a.score - b.score);

    // Pegar top 10 melhores matches
    const topCandidatos = candidatos.slice(0, 10);

    // Selecionar um aleatório dos top 10
    const randomIndex = Math.floor(Math.random() * topCandidatos.length);
    const oponenteSelecionado = topCandidatos[randomIndex];

    // Usar nome do avatar (tabela usuarios não existe)
    return NextResponse.json({
      success: true,
      oponente: {
        id: oponenteSelecionado.avatar.user_id,
        nome: oponenteSelecionado.avatar.nome || 'Jogador Desconhecido',
        nivel: oponenteSelecionado.avatar.nivel,
        fama: oponenteSelecionado.famaOponente,
        avatar: {
          id: oponenteSelecionado.avatar.id,
          nome: oponenteSelecionado.avatar.nome,
          elemento: oponenteSelecionado.avatar.elemento,
          raridade: oponenteSelecionado.avatar.raridade,
          nivel: oponenteSelecionado.avatar.nivel,
          forca: oponenteSelecionado.avatar.forca,
          agilidade: oponenteSelecionado.avatar.agilidade,
          resistencia: oponenteSelecionado.avatar.resistencia,
          foco: oponenteSelecionado.avatar.foco,
          vivo: oponenteSelecionado.avatar.vivo,
          exaustao: oponenteSelecionado.avatar.exaustao,
          hp_atual: oponenteSelecionado.avatar.hp_atual
        }
      },
      matchQuality: {
        diferencaNivel: oponenteSelecionado.diferencaNivel,
        diferencaFama: oponenteSelecionado.diferencaFama,
        score: oponenteSelecionado.score
      }
    });
  } catch (error) {
    console.error('Erro no GET /api/pvp/matchmaking:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
