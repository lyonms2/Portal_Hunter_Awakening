// Sistema de Ranking PvP

export const TIERS = {
  BRONZE: {
    nome: 'Bronze',
    minPontos: 0,
    maxPontos: 999,
    cor: '#cd7f32',
    corTexto: 'text-orange-700',
    corBg: 'bg-orange-900/30',
    corBorda: 'border-orange-700',
    icone: '🥉',
    multiplicadorRecompensa: 1.0
  },
  PRATA: {
    nome: 'Prata',
    minPontos: 1000,
    maxPontos: 1999,
    cor: '#c0c0c0',
    corTexto: 'text-gray-400',
    corBg: 'bg-gray-800/30',
    corBorda: 'border-gray-400',
    icone: '🥈',
    multiplicadorRecompensa: 1.2
  },
  OURO: {
    nome: 'Ouro',
    minPontos: 2000,
    maxPontos: 2999,
    cor: '#ffd700',
    corTexto: 'text-yellow-400',
    corBg: 'bg-yellow-900/30',
    corBorda: 'border-yellow-400',
    icone: '🥇',
    multiplicadorRecompensa: 1.5
  },
  PLATINA: {
    nome: 'Platina',
    minPontos: 3000,
    maxPontos: 3999,
    cor: '#e5e4e2',
    corTexto: 'text-cyan-300',
    corBg: 'bg-cyan-900/30',
    corBorda: 'border-cyan-300',
    icone: '💎',
    multiplicadorRecompensa: 2.0
  },
  DIAMANTE: {
    nome: 'Diamante',
    minPontos: 4000,
    maxPontos: 4999,
    cor: '#b9f2ff',
    corTexto: 'text-blue-300',
    corBg: 'bg-blue-900/30',
    corBorda: 'border-blue-300',
    icone: '💠',
    multiplicadorRecompensa: 2.5
  },
  MESTRE: {
    nome: 'Mestre',
    minPontos: 5000,
    maxPontos: Infinity,
    cor: '#9d00ff',
    corTexto: 'text-purple-400',
    corBg: 'bg-purple-900/30',
    corBorda: 'border-purple-400',
    icone: '👑',
    multiplicadorRecompensa: 3.0
  }
};

export function getTierPorPontos(pontos) {
  const tiers = Object.values(TIERS);
  return tiers.find(tier => pontos >= tier.minPontos && pontos <= tier.maxPontos) || TIERS.BRONZE;
}

export function calcularPontosVitoria(pontosVencedor, pontosPerdedor) {
  // Sistema ELO simplificado
  const diferenca = Math.abs(pontosVencedor - pontosPerdedor);

  let ganho = 25; // Ganho base

  if (pontosPerdedor > pontosVencedor) {
    // Venceu alguém com mais pontos - UPSET!
    const bonus = Math.min(diferenca / 100, 10);
    ganho += bonus;
  } else {
    // Venceu alguém com menos pontos
    const reducao = Math.min(diferenca / 200, 10);
    ganho -= reducao;
  }

  return Math.max(5, Math.floor(ganho)); // Mínimo 5 pontos
}

export function calcularPerda(pontosVencedor, pontosPerdedor) {
  const diferenca = Math.abs(pontosVencedor - pontosPerdedor);

  let perda = 20; // Perda base

  if (pontosVencedor < pontosPerdedor) {
    // Perdeu para alguém com menos pontos - UPSET REVERSO!
    const adicional = Math.min(diferenca / 100, 10);
    perda += adicional;
  } else {
    // Perdeu para alguém com mais pontos (esperado)
    const reducao = Math.min(diferenca / 200, 8);
    perda -= reducao;
  }

  return Math.max(5, Math.floor(perda)); // Mínimo 5 pontos de perda
}

export function calcularRecompensasPvP(venceu, tier, duracaoRodadas) {
  const mult = tier.multiplicadorRecompensa;

  if (venceu) {
    return {
      xp: Math.floor(100 * mult),
      moedas: Math.floor(80 * mult),
      pontos_ranking: calcularPontosVitoria(1500, 1500), // Placeholder
      fragmentos: tier.minPontos >= TIERS.PLATINA.minPontos ? 1 : 0,
      chance_fragmento: 0.15 + (tier.minPontos >= TIERS.OURO.minPontos ? 0.10 : 0),
      vinculo: Math.floor(5 * mult)
    };
  } else {
    // Recompensas de derrota (consolation prize)
    return {
      xp: Math.floor(30 * mult),
      moedas: Math.floor(20 * mult),
      pontos_ranking: -calcularPerda(1500, 1500), // Placeholder (negativo)
      fragmentos: 0,
      chance_fragmento: 0.05,
      vinculo: -2 // Perde vínculo na derrota
    };
  }
}

export function getProximoTier(tierAtual) {
  const tiers = Object.values(TIERS);
  const indiceAtual = tiers.findIndex(t => t.nome === tierAtual.nome);

  if (indiceAtual === -1 || indiceAtual === tiers.length - 1) {
    return null; // Já é o último tier
  }

  return tiers[indiceAtual + 1];
}

export function getProgressoNoTier(pontos, tier) {
  if (tier.maxPontos === Infinity) {
    return 100; // Tier máximo
  }

  const pontosNoTier = pontos - tier.minPontos;
  const pontosTotaisTier = tier.maxPontos - tier.minPontos + 1;

  return Math.min(100, Math.floor((pontosNoTier / pontosTotaisTier) * 100));
}
