/**
 * Sistema de Leaderboard PvP
 *
 * Gerencia o ranking global de jogadores na temporada atual.
 * Busca dados reais do banco de dados via API.
 */

import { getTierPorFama } from './rankingSystem';
import { getTemporadaAtual } from './seasonSystem';

/**
 * Busca leaderboard real do banco de dados
 * Em produção, isso busca da API que consulta a view leaderboard_atual
 */
export async function getLeaderboard(jogadorId = null, famaJogador = 1000) {
  try {
    // Tentar buscar do banco via API
    const params = new URLSearchParams({ limit: '100' });
    if (jogadorId) {
      params.append('userId', jogadorId);
    }

    const response = await fetch(`/api/pvp/leaderboard?${params}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.ok) {
      const data = await response.json();

      if (data.success && data.leaderboard && data.leaderboard.length > 0) {
        // Formatar dados do banco para o formato esperado
        const leaderboardFormatado = data.leaderboard.map(p => ({
          posicao: p.posicao,
          userId: p.user_id,
          nome: p.nome_usuario || 'Jogador',
          fama: p.fama,
          tier: getTierPorFama(p.fama).nome,
          tierIcone: getTierPorFama(p.fama).icone,
          vitorias: p.vitorias,
          derrotas: p.derrotas,
          streak: p.streak,
          streakMaximo: p.streak_maximo,
          winRate: p.win_rate,
          avatar: {
            nome: 'Avatar',
            elemento: 'N/A',
            nivel: Math.floor(p.fama / 200) + 5
          },
          temporada: p.temporada_id,
          isJogador: p.user_id === jogadorId
        }));

        return {
          leaderboard: leaderboardFormatado,
          posicaoJogador: data.posicaoJogador,
          jogadorNoTop100: data.jogadorNoTop
        };
      }
    }
  } catch (error) {
    console.warn('Erro ao buscar leaderboard do banco, usando dados simulados:', error);
  }

  // Fallback: gerar dados simulados se API falhar
  return gerarLeaderboardSimulado(jogadorId, famaJogador);
}

/**
 * Gera dados simulados de leaderboard para visualização
 * Top 100 jogadores com dados realistas (usado como fallback)
 */
export function gerarLeaderboardSimulado(jogadorId, famaJogador = 1000) {
  const temporada = getTemporadaAtual();
  const leaderboard = [];

  // Nomes fictícios para o leaderboard
  const nomes = [
    'ShadowHunter', 'DragonSlayer', 'PhoenixRising', 'StormBreaker', 'NightWolf',
    'IceQueen', 'FireKing', 'ThunderGod', 'DarkMage', 'LightBringer',
    'CrimsonBlade', 'SilverArrow', 'GoldenShield', 'IronFist', 'SteelHeart',
    'MysticSage', 'RuneMaster', 'SpellWeaver', 'SoulReaper', 'StarGazer',
    'MoonWalker', 'SunRider', 'WindDancer', 'EarthShaker', 'WaveRider',
    'FlameSpirit', 'FrostBite', 'VoltStrike', 'NatureCaller', 'VoidWalker',
    'ChaosKnight', 'OrderPaladin', 'DeathBringer', 'LifeGiver', 'TimeMaster',
    'SpaceWarrior', 'DimensionJumper', 'RealityBender', 'DreamWeaver', 'NightmareKing',
    'CrystalSeer', 'ObsidianGuard', 'DiamondEdge', 'RubyRose', 'SapphireSky',
    'EmeraldEye', 'TopazTouch', 'AmethystAura', 'OpalOracle', 'PearlPrince'
  ];

  // Avatar types
  const avatarElements = ['Fogo', 'Água', 'Terra', 'Vento', 'Eletricidade', 'Sombra', 'Luz'];

  // Gerar top 100
  for (let i = 0; i < 100; i++) {
    const posicao = i + 1;

    // Calcular fama baseado na posição (distribuição realista)
    let fama;
    if (posicao === 1) {
      fama = 3800 + Math.floor(Math.random() * 500); // Top 1: 3800-4300
    } else if (posicao <= 3) {
      fama = 3300 + Math.floor(Math.random() * 500); // Top 3: 3300-3800
    } else if (posicao <= 10) {
      fama = 2500 + Math.floor(Math.random() * 800); // Top 10: 2500-3300
    } else if (posicao <= 50) {
      fama = 1500 + Math.floor(Math.random() * 1000); // Top 50: 1500-2500
    } else {
      fama = 1000 + Math.floor(Math.random() * 500); // Top 100: 1000-1500
    }

    const tier = getTierPorFama(fama);
    const vitorias = Math.floor(fama / 25) + Math.floor(Math.random() * 20);
    const derrotas = Math.floor(vitorias * (Math.random() * 0.4)); // 0-40% derrotas
    const streak = posicao <= 10 ? Math.floor(Math.random() * 15) + 5 : Math.floor(Math.random() * 10);

    leaderboard.push({
      posicao,
      userId: `player_${i + 1}`,
      nome: nomes[i % nomes.length] + (i >= 50 ? (i - 49) : ''),
      fama,
      tier: tier.nome,
      tierIcone: tier.icone,
      vitorias,
      derrotas,
      streak,
      winRate: derrotas > 0 ? Math.round((vitorias / (vitorias + derrotas)) * 100) : 100,
      avatar: {
        nome: `Avatar ${avatarElements[i % avatarElements.length]}`,
        elemento: avatarElements[i % avatarElements.length],
        nivel: Math.floor(fama / 200) + 5
      },
      temporada
    });
  }

  // Inserir o jogador se ele não estiver no top 100
  const jogadorNoTop100 = leaderboard.find(p => p.userId === jogadorId);

  if (!jogadorNoTop100 && famaJogador < leaderboard[99].fama) {
    // Calcular posição estimada do jogador
    let posicaoEstimada = 101;
    for (let i = 0; i < leaderboard.length; i++) {
      if (famaJogador >= leaderboard[i].fama) {
        posicaoEstimada = i + 1;
        break;
      }
    }

    // Se ainda for pior que top 100, calcular posição fictícia
    if (posicaoEstimada === 101) {
      const diferencaFama = leaderboard[99].fama - famaJogador;
      posicaoEstimada = 101 + Math.floor(diferencaFama / 10);
    }

    return {
      leaderboard,
      posicaoJogador: posicaoEstimada,
      jogadorNoTop100: false
    };
  }

  // Se o jogador deveria estar no top 100 baseado na fama, inserir ele
  if (!jogadorNoTop100 && famaJogador >= leaderboard[99].fama) {
    // Encontrar posição correta
    let posicaoCorreta = 100;
    for (let i = 0; i < leaderboard.length; i++) {
      if (famaJogador > leaderboard[i].fama) {
        posicaoCorreta = i + 1;
        break;
      }
    }

    const tier = getTierPorFama(famaJogador);
    const rankingData = JSON.parse(localStorage.getItem(`pvp_ranking_${jogadorId}`) || '{}');

    const jogadorEntry = {
      posicao: posicaoCorreta,
      userId: jogadorId,
      nome: 'Você',
      fama: famaJogador,
      tier: tier.nome,
      tierIcone: tier.icone,
      vitorias: rankingData.vitorias || 0,
      derrotas: rankingData.derrotas || 0,
      streak: rankingData.streak || 0,
      winRate: (rankingData.vitorias + rankingData.derrotas) > 0
        ? Math.round((rankingData.vitorias / (rankingData.vitorias + rankingData.derrotas)) * 100)
        : 0,
      avatar: {
        nome: 'Seu Avatar',
        elemento: 'N/A',
        nivel: Math.floor(famaJogador / 200) + 5
      },
      temporada,
      isJogador: true
    };

    // Inserir jogador e remover o último
    leaderboard.splice(posicaoCorreta - 1, 0, jogadorEntry);
    leaderboard.splice(100, 1);

    // Reajustar posições
    leaderboard.forEach((player, index) => {
      player.posicao = index + 1;
    });

    return {
      leaderboard,
      posicaoJogador: posicaoCorreta,
      jogadorNoTop100: true
    };
  }

  return {
    leaderboard,
    posicaoJogador: jogadorNoTop100 ? jogadorNoTop100.posicao : null,
    jogadorNoTop100: !!jogadorNoTop100
  };
}

/**
 * Busca a posição do jogador no leaderboard
 */
export async function getPosicaoJogador(jogadorId, famaJogador) {
  const { posicaoJogador, jogadorNoTop100 } = await getLeaderboard(jogadorId, famaJogador);

  return {
    posicao: posicaoJogador,
    noTop100: jogadorNoTop100,
    elegivel: posicaoJogador && posicaoJogador <= 100
  };
}

/**
 * Filtra leaderboard por tier
 */
export function filtrarLeaderboardPorTier(leaderboard, tierNome) {
  return leaderboard.filter(player => player.tier === tierNome);
}

/**
 * Busca jogadores próximos ao jogador atual
 */
export function getJogadoresProximos(leaderboard, posicaoJogador, quantidade = 5) {
  if (!posicaoJogador) return [];

  const inicio = Math.max(0, posicaoJogador - quantidade - 1);
  const fim = Math.min(leaderboard.length, posicaoJogador + quantidade);

  return leaderboard.slice(inicio, fim);
}

/**
 * Estatísticas do leaderboard
 */
export function getEstatisticasLeaderboard(leaderboard) {
  const totalJogadores = leaderboard.length;

  const mediaFama = Math.floor(
    leaderboard.reduce((sum, p) => sum + p.fama, 0) / totalJogadores
  );

  const mediaWinRate = Math.floor(
    leaderboard.reduce((sum, p) => sum + p.winRate, 0) / totalJogadores
  );

  // Distribuição por tier
  const distribuicaoTier = {};
  leaderboard.forEach(p => {
    distribuicaoTier[p.tier] = (distribuicaoTier[p.tier] || 0) + 1;
  });

  // Maior streak
  const maiorStreak = Math.max(...leaderboard.map(p => p.streak));

  return {
    totalJogadores,
    mediaFama,
    mediaWinRate,
    distribuicaoTier,
    maiorStreak
  };
}
