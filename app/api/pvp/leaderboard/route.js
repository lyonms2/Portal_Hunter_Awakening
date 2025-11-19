import { NextResponse } from 'next/server';
import { getDocuments } from '@/lib/firebase/firestore';

export const dynamic = 'force-dynamic';

/**
 * GET /api/pvp/leaderboard?limit=100&userId=xxx
 * Busca o leaderboard da temporada ativa
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const userId = searchParams.get('userId');

    // 1. Buscar temporada ativa
    const temporadas = await getDocuments('pvp_temporadas', {
      where: [['ativa', '==', true]]
    });

    if (!temporadas || temporadas.length === 0) {
      return NextResponse.json({ error: 'Nenhuma temporada ativa' }, { status: 404 });
    }

    const temporadaAtiva = temporadas[0];

    // 2. Buscar todos os rankings da temporada ativa
    const rankings = await getDocuments('pvp_rankings', {
      where: [['temporada_id', '==', temporadaAtiva.temporada_id]]
    });

    // 3. Calcular win_rate e preparar dados do leaderboard
    let leaderboardData = (rankings || []).map(ranking => {
      const totalBatalhas = ranking.vitorias + ranking.derrotas;
      const win_rate = totalBatalhas > 0 ? (ranking.vitorias / totalBatalhas) * 100 : 0;

      return {
        user_id: ranking.user_id,
        fama: ranking.fama || 0,
        vitorias: ranking.vitorias || 0,
        derrotas: ranking.derrotas || 0,
        streak: ranking.streak || 0,
        win_rate: Math.round(win_rate * 100) / 100
      };
    });

    // 4. Ordenar por fama (descendente)
    leaderboardData.sort((a, b) => b.fama - a.fama);

    // 5. Adicionar posições e limitar resultados
    const leaderboard = leaderboardData
      .map((jogador, index) => ({
        ...jogador,
        posicao: index + 1
      }))
      .slice(0, limit);

    // 6. Buscar títulos ativos dos jogadores no leaderboard
    if (leaderboard.length > 0) {
      const userIds = leaderboard.map(p => p.user_id);

      const titulos = await getDocuments('pvp_titulos', {
        where: [['ativo', '==', true]]
      });

      // Criar mapa de userId -> título
      const titulosMap = {};
      (titulos || []).forEach(titulo => {
        if (userIds.includes(titulo.user_id)) {
          titulosMap[titulo.user_id] = {
            nome: titulo.titulo_nome,
            icone: titulo.titulo_icone
          };
        }
      });

      // Adicionar título a cada jogador
      leaderboard.forEach(jogador => {
        jogador.titulo = titulosMap[jogador.user_id] || null;
      });
    }

    // 7. Se userId foi fornecido, buscar posição do jogador
    let posicaoJogador = null;
    let jogadorNoTop = false;

    if (userId) {
      // Verificar se jogador está no top retornado
      const jogadorIndex = leaderboard.findIndex(p => p.user_id === userId);

      if (jogadorIndex !== -1) {
        posicaoJogador = leaderboard[jogadorIndex].posicao;
        jogadorNoTop = true;
      } else {
        // Buscar posição exata do jogador no leaderboard completo
        const jogadorIndexCompleto = leaderboardData.findIndex(p => p.user_id === userId);

        if (jogadorIndexCompleto !== -1) {
          posicaoJogador = jogadorIndexCompleto + 1;
          jogadorNoTop = false;
        }
      }
    }

    return NextResponse.json({
      success: true,
      leaderboard,
      posicaoJogador,
      jogadorNoTop: jogadorNoTop,
      total: leaderboard.length
    });
  } catch (error) {
    console.error('Erro no GET /api/pvp/leaderboard:', error);
    return NextResponse.json({ error: 'Erro interno do servidor: ' + error.message }, { status: 500 });
  }
}
