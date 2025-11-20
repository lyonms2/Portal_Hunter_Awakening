// ==================== SISTEMA DE RANKING DE CACADOR ====================
// Ranking de F a SS baseado em XP acumulado por feitos
// Representa o prestigio geral do cacador

export const HUNTER_RANKS = {
  F: {
    nome: 'F',
    minXp: 0,
    maxXp: 999,
    cor: '#808080',
    corTexto: 'text-gray-400',
    corBg: 'bg-gray-800/30',
    corBorda: 'border-gray-500',
    icone: 'F',
    // Bonus do rank
    bonusMoedas: 0,
    bonusFragmentos: 0,
    bonusInvocacaoRaro: 0,
    bonusInvocacaoLendario: 0,
    descontoMercado: 0,
    descontoMerge: 0
  },
  E: {
    nome: 'E',
    minXp: 1000,
    maxXp: 3999,
    cor: '#a0522d',
    corTexto: 'text-amber-700',
    corBg: 'bg-amber-900/30',
    corBorda: 'border-amber-700',
    icone: 'E',
    bonusMoedas: 0.02,
    bonusFragmentos: 0,
    bonusInvocacaoRaro: 0,
    bonusInvocacaoLendario: 0,
    descontoMercado: 0,
    descontoMerge: 0
  },
  D: {
    nome: 'D',
    minXp: 4000,
    maxXp: 11999,
    cor: '#cd7f32',
    corTexto: 'text-orange-500',
    corBg: 'bg-orange-900/30',
    corBorda: 'border-orange-500',
    icone: 'D',
    bonusMoedas: 0.04,
    bonusFragmentos: 0.02,
    bonusInvocacaoRaro: 0,
    bonusInvocacaoLendario: 0,
    descontoMercado: 0.02,
    descontoMerge: 0
  },
  C: {
    nome: 'C',
    minXp: 12000,
    maxXp: 31999,
    cor: '#c0c0c0',
    corTexto: 'text-gray-300',
    corBg: 'bg-gray-700/30',
    corBorda: 'border-gray-300',
    icone: 'C',
    bonusMoedas: 0.06,
    bonusFragmentos: 0.04,
    bonusInvocacaoRaro: 0.01,
    bonusInvocacaoLendario: 0,
    descontoMercado: 0.04,
    descontoMerge: 0.02
  },
  B: {
    nome: 'B',
    minXp: 32000,
    maxXp: 81999,
    cor: '#ffd700',
    corTexto: 'text-yellow-400',
    corBg: 'bg-yellow-900/30',
    corBorda: 'border-yellow-400',
    icone: 'B',
    bonusMoedas: 0.08,
    bonusFragmentos: 0.06,
    bonusInvocacaoRaro: 0.02,
    bonusInvocacaoLendario: 0,
    descontoMercado: 0.06,
    descontoMerge: 0.04
  },
  A: {
    nome: 'A',
    minXp: 82000,
    maxXp: 201999,
    cor: '#00bfff',
    corTexto: 'text-cyan-400',
    corBg: 'bg-cyan-900/30',
    corBorda: 'border-cyan-400',
    icone: 'A',
    bonusMoedas: 0.10,
    bonusFragmentos: 0.08,
    bonusInvocacaoRaro: 0.03,
    bonusInvocacaoLendario: 0.005,
    descontoMercado: 0.08,
    descontoMerge: 0.06
  },
  S: {
    nome: 'S',
    minXp: 202000,
    maxXp: 501999,
    cor: '#9d00ff',
    corTexto: 'text-purple-400',
    corBg: 'bg-purple-900/30',
    corBorda: 'border-purple-400',
    icone: 'S',
    bonusMoedas: 0.12,
    bonusFragmentos: 0.10,
    bonusInvocacaoRaro: 0.05,
    bonusInvocacaoLendario: 0.01,
    descontoMercado: 0.10,
    descontoMerge: 0.08
  },
  SS: {
    nome: 'SS',
    minXp: 502000,
    maxXp: Infinity,
    cor: '#ff4500',
    corTexto: 'text-red-500',
    corBg: 'bg-red-900/30',
    corBorda: 'border-red-500',
    icone: 'SS',
    bonusMoedas: 0.15,
    bonusFragmentos: 0.12,
    bonusInvocacaoRaro: 0.08,
    bonusInvocacaoLendario: 0.02,
    descontoMercado: 0.12,
    descontoMerge: 0.10
  }
};

// XP ganho por cada feito
export const XP_POR_FEITO = {
  VITORIA_PVP: 15,
  DERROTA_PVP: 3,
  AVATAR_INVOCADO: 5,
  AVATAR_NIVEL_50: 20,
  AVATAR_NIVEL_100: 50,
  MERGE_REALIZADO: 10,
  BOND_MAXIMO: 30,
  VITORIA_RANK_SUPERIOR: 25, // Bonus adicional
  PRIMEIRO_AVATAR_LENDARIO: 100,
  STREAK_10: 15
};

/**
 * Obtem o rank do cacador baseado no XP acumulado
 */
export function getHunterRank(xpTotal) {
  const ranks = Object.values(HUNTER_RANKS);
  return ranks.find(rank => xpTotal >= rank.minXp && xpTotal <= rank.maxXp) || HUNTER_RANKS.F;
}

/**
 * Calcula XP ganho por um feito
 */
export function calcularXpFeito(tipoFeito, extras = {}) {
  let xp = XP_POR_FEITO[tipoFeito] || 0;

  // Bonus por vitoria contra rank superior
  if (tipoFeito === 'VITORIA_PVP' && extras.rankSuperior) {
    xp += XP_POR_FEITO.VITORIA_RANK_SUPERIOR;
  }

  return xp;
}

/**
 * Aplica bonus de moedas do rank
 */
export function aplicarBonusMoedas(moedas, rank) {
  const bonus = rank.bonusMoedas || 0;
  return Math.floor(moedas * (1 + bonus));
}

/**
 * Aplica bonus de fragmentos do rank
 */
export function aplicarBonusFragmentos(chanceBase, rank) {
  const bonus = rank.bonusFragmentos || 0;
  return chanceBase + bonus;
}

/**
 * Aplica bonus de invocacao do rank
 * Retorna as chances modificadas de cada raridade
 */
export function aplicarBonusInvocacao(chancesBase, rank) {
  return {
    comum: chancesBase.comum - rank.bonusInvocacaoRaro - rank.bonusInvocacaoLendario,
    raro: chancesBase.raro + rank.bonusInvocacaoRaro,
    lendario: chancesBase.lendario + rank.bonusInvocacaoLendario
  };
}

/**
 * Aplica desconto do mercado
 */
export function aplicarDescontoMercado(preco, rank) {
  const desconto = rank.descontoMercado || 0;
  return Math.floor(preco * (1 - desconto));
}

/**
 * Aplica desconto do merge
 */
export function aplicarDescontoMerge(custo, rank) {
  const desconto = rank.descontoMerge || 0;
  return Math.floor(custo * (1 - desconto));
}

/**
 * Calcula progresso para o proximo rank
 */
export function getProgressoRank(xpTotal, rank) {
  if (rank.maxXp === Infinity) {
    return 100; // Rank maximo
  }

  const xpNoRank = xpTotal - rank.minXp;
  const xpTotalRank = rank.maxXp - rank.minXp + 1;

  return Math.min(100, Math.floor((xpNoRank / xpTotalRank) * 100));
}

/**
 * Obtem proximo rank
 */
export function getProximoRank(rankAtual) {
  const ranks = Object.values(HUNTER_RANKS);
  const indiceAtual = ranks.findIndex(r => r.nome === rankAtual.nome);

  if (indiceAtual === -1 || indiceAtual === ranks.length - 1) {
    return null; // Ja e o ultimo rank
  }

  return ranks[indiceAtual + 1];
}

/**
 * Calcula XP faltante para proximo rank
 */
export function getXpParaProximoRank(xpTotal, rank) {
  if (rank.maxXp === Infinity) {
    return 0; // Ja e o rank maximo
  }

  return rank.maxXp - xpTotal + 1;
}

/**
 * Verifica se houve promocao de rank
 */
export function verificarPromocao(xpAnterior, xpNovo) {
  const rankAnterior = getHunterRank(xpAnterior);
  const rankNovo = getHunterRank(xpNovo);

  if (rankNovo.minXp > rankAnterior.minXp) {
    return {
      promovido: true,
      rankAnterior,
      rankNovo,
      mensagem: `Parabens! Voce subiu para Rank ${rankNovo.nome}!`
    };
  }

  return { promovido: false };
}

/**
 * Gera resumo dos bonus do rank atual
 */
export function getResumoBonusRank(rank) {
  const bonus = [];

  if (rank.bonusMoedas > 0) {
    bonus.push(`+${Math.round(rank.bonusMoedas * 100)}% moedas`);
  }
  if (rank.bonusFragmentos > 0) {
    bonus.push(`+${Math.round(rank.bonusFragmentos * 100)}% chance fragmentos`);
  }
  if (rank.bonusInvocacaoRaro > 0) {
    bonus.push(`+${Math.round(rank.bonusInvocacaoRaro * 100)}% chance raro`);
  }
  if (rank.bonusInvocacaoLendario > 0) {
    bonus.push(`+${Math.round(rank.bonusInvocacaoLendario * 100)}% chance lendario`);
  }
  if (rank.descontoMercado > 0) {
    bonus.push(`${Math.round(rank.descontoMercado * 100)}% desconto mercado`);
  }
  if (rank.descontoMerge > 0) {
    bonus.push(`${Math.round(rank.descontoMerge * 100)}% desconto merge`);
  }

  return bonus.length > 0 ? bonus : ['Nenhum bonus'];
}

/**
 * Compara dois ranks
 * Retorna: -1 se rank1 < rank2, 0 se iguais, 1 se rank1 > rank2
 */
export function compararRanks(rank1, rank2) {
  if (rank1.minXp < rank2.minXp) return -1;
  if (rank1.minXp > rank2.minXp) return 1;
  return 0;
}

export default {
  HUNTER_RANKS,
  XP_POR_FEITO,
  getHunterRank,
  calcularXpFeito,
  aplicarBonusMoedas,
  aplicarBonusFragmentos,
  aplicarBonusInvocacao,
  aplicarDescontoMercado,
  aplicarDescontoMerge,
  getProgressoRank,
  getProximoRank,
  getXpParaProximoRank,
  verificarPromocao,
  getResumoBonusRank,
  compararRanks
};
