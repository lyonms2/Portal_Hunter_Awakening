// ==================== SISTEMA DE RANKING PvP ====================
// Baseado em FAMA ao invés de pontos genéricos
// Sistema ELO adaptado com mecânicas de streak e upset

export const TIERS = {
  BRONZE: {
    nome: 'Bronze',
    minFama: 0,
    maxFama: 999,
    cor: '#cd7f32',
    corTexto: 'text-orange-700',
    corBg: 'bg-orange-900/30',
    corBorda: 'border-orange-700',
    icone: '🥉',
    multiplicadorRecompensa: 1.0
  },
  PRATA: {
    nome: 'Prata',
    minFama: 1000,
    maxFama: 1999,
    cor: '#c0c0c0',
    corTexto: 'text-gray-400',
    corBg: 'bg-gray-800/30',
    corBorda: 'border-gray-400',
    icone: '🥈',
    multiplicadorRecompensa: 1.2
  },
  OURO: {
    nome: 'Ouro',
    minFama: 2000,
    maxFama: 2999,
    cor: '#ffd700',
    corTexto: 'text-yellow-400',
    corBg: 'bg-yellow-900/30',
    corBorda: 'border-yellow-400',
    icone: '🥇',
    multiplicadorRecompensa: 1.5
  },
  PLATINA: {
    nome: 'Platina',
    minFama: 3000,
    maxFama: 3999,
    cor: '#e5e4e2',
    corTexto: 'text-cyan-300',
    corBg: 'bg-cyan-900/30',
    corBorda: 'border-cyan-300',
    icone: '💎',
    multiplicadorRecompensa: 2.0
  },
  DIAMANTE: {
    nome: 'Diamante',
    minFama: 4000,
    maxFama: 4999,
    cor: '#b9f2ff',
    corTexto: 'text-blue-300',
    corBg: 'bg-blue-900/30',
    corBorda: 'border-blue-300',
    icone: '💠',
    multiplicadorRecompensa: 2.5
  },
  LENDARIO: {
    nome: 'Lendário',
    minFama: 5000,
    maxFama: Infinity,
    cor: '#9d00ff',
    corTexto: 'text-purple-400',
    corBg: 'bg-purple-900/30',
    corBorda: 'border-purple-400',
    icone: '👑',
    multiplicadorRecompensa: 3.0
  }
};

/**
 * Obtém o tier baseado na fama do jogador
 */
export function getTierPorFama(fama) {
  const tiers = Object.values(TIERS);
  return tiers.find(tier => fama >= tier.minFama && fama <= tier.maxFama) || TIERS.BRONZE;
}

// Backward compatibility
export function getTierPorPontos(pontos) {
  return getTierPorFama(pontos);
}

/**
 * Calcula ganho de fama por vitória
 * Sistema ELO adaptado com bônus por upset
 *
 * @param {number} famaVencedor - Fama atual do vencedor
 * @param {number} famaPerdedor - Fama atual do perdedor
 * @param {number} streakVencedor - Streak atual do vencedor (default: 0)
 * @returns {number} Fama ganha
 */
export function calcularGanhoFama(famaVencedor, famaPerdedor, streakVencedor = 0) {
  const diferenca = famaPerdedor - famaVencedor;

  let ganho = 20; // Ganho base

  // === UPSET BONUS ===
  if (diferenca > 0) {
    // Venceu alguém com MAIS fama - UPSET!
    const bonusUpset = Math.min(Math.floor(diferenca / 50), 20); // Até +20 de bônus
    ganho += bonusUpset;
  } else if (diferenca < 0) {
    // Venceu alguém com MENOS fama - ganho reduzido
    const reducao = Math.min(Math.floor(Math.abs(diferenca) / 100), 10); // Até -10
    ganho -= reducao;
  }

  // === STREAK BONUS ===
  if (streakVencedor >= 3) {
    const bonusStreak = Math.min(Math.floor(streakVencedor / 3) * 2, 10); // +2 a cada 3 wins, máx +10
    ganho += bonusStreak;
  }

  return Math.max(15, Math.floor(ganho)); // Mínimo 15 de fama
}

/**
 * Calcula perda de fama por derrota
 * Perda menor se perdeu para alguém muito mais forte
 *
 * @param {number} famaVencedor - Fama do vencedor
 * @param {number} famaPerdedor - Fama do perdedor
 * @returns {number} Fama perdida (sempre positivo)
 */
export function calcularPerdaFama(famaVencedor, famaPerdedor) {
  const diferenca = famaVencedor - famaPerdedor;

  let perda = 15; // Perda base

  // === UPSET REVERSO ===
  if (diferenca < 0) {
    // Perdeu para alguém com MENOS fama - VERGONHOSO!
    const penalidade = Math.min(Math.floor(Math.abs(diferenca) / 50), 15); // Até +15 de penalidade
    perda += penalidade;
  } else if (diferenca > 0) {
    // Perdeu para alguém com MAIS fama - esperado, perda reduzida
    const reducao = Math.min(Math.floor(diferenca / 100), 8); // Até -8
    perda -= reducao;
  }

  return Math.max(10, Math.floor(perda)); // Mínimo 10 de perda
}

/**
 * Calcula recompensas completas de uma batalha PvP
 *
 * @param {boolean} venceu - Se o jogador venceu
 * @param {number} famaJogador - Fama atual do jogador
 * @param {number} famaOponente - Fama do oponente
 * @param {object} tier - Tier atual do jogador
 * @param {number} streak - Streak atual (default: 0)
 * @param {number} duracaoRodadas - Rodadas da batalha (para bônus rápido)
 * @returns {object} Objeto com todas as recompensas
 */
export function calcularRecompensasPvP(venceu, famaJogador, famaOponente, tier, streak = 0, duracaoRodadas = 10) {
  const mult = tier.multiplicadorRecompensa;

  if (venceu) {
    // === VITÓRIA ===
    const fama = calcularGanhoFama(famaJogador, famaOponente, streak);

    // XP base escalado por tier
    let xp = Math.floor(100 * mult);

    // Moedas base escaladas por tier
    let moedas = Math.floor(80 * mult);

    // Vínculo base
    let vinculo = 3;

    // Chance de fragmento base
    let chanceFragmento = 0.10;

    // Fragmentos garantidos em tiers altos
    let fragmentos = 0;
    if (tier.minFama >= TIERS.PLATINA.minFama) {
      chanceFragmento = 0.25;
    }
    if (tier.minFama >= TIERS.DIAMANTE.minFama) {
      fragmentos = 1; // Garantido
      chanceFragmento = 0.35; // Chance de fragmento EXTRA
    }

    // === BÔNUS POR UPSET ===
    const diferencaFama = famaOponente - famaJogador;
    if (diferencaFama > 200) {
      // Venceu oponente muito superior!
      xp += Math.floor(xp * 0.5); // +50% XP
      moedas += Math.floor(moedas * 0.5); // +50% moedas
      vinculo += 2; // +2 vínculo extra
    }

    // === BÔNUS POR STREAK ===
    if (streak >= 3) {
      const bonusStreakPercent = Math.min(streak * 0.05, 0.30); // Até +30%
      xp += Math.floor(xp * bonusStreakPercent);
      moedas += Math.floor(moedas * bonusStreakPercent);

      if (streak >= 5) {
        vinculo += 2; // +2 vínculo em streak 5+
      }

      if (streak >= 10) {
        fragmentos += 1; // Fragmento bônus em streak 10+!
        vinculo += 3; // +3 vínculo extra
      }
    }

    // === BÔNUS POR VITÓRIA RÁPIDA ===
    if (duracaoRodadas <= 5) {
      xp += Math.floor(xp * 0.25); // +25% XP
      vinculo += 1;
    }

    // Exaustão fixa
    const exaustao = 15;

    // Rolar chance de fragmento
    if (Math.random() < chanceFragmento) {
      fragmentos += 1;
    }

    // Mensagens
    const mensagens = [];
    if (diferencaFama > 200) {
      mensagens.push(`🔥 UPSET! Derrotou oponente ${Math.floor(diferencaFama)} de fama superior!`);
    }
    if (streak >= 3) {
      mensagens.push(`⚡ Streak de ${streak} vitórias! (${Math.floor(streak * 5)}% bônus)`);
    }
    if (streak >= 10) {
      mensagens.push(`💎 STREAK LENDÁRIO! Fragmento bônus concedido!`);
    }
    if (duracaoRodadas <= 5) {
      mensagens.push(`⏱️ Vitória Rápida! (+25% XP)`);
    }

    return {
      xp,
      moedas,
      fama, // Novo campo!
      pontos_ranking: fama, // Backward compatibility
      fragmentos,
      vinculo,
      exaustao,
      mensagens
    };
  } else {
    // === DERROTA ===
    const fama = -calcularPerdaFama(famaOponente, famaJogador);

    // XP consolação (20% do que ganharia)
    const xp = Math.floor(30 * mult);

    // Moedas consolação (10% do que ganharia)
    const moedas = Math.floor(10 * mult);

    // Perda de vínculo
    let vinculo = -3;

    // Perda maior se perdeu para alguém inferior
    const diferencaFama = famaOponente - famaJogador;
    if (diferencaFama < -200) {
      vinculo = -5; // Perda MAIOR ao perder para rank inferior
    }

    // Exaustão MAIOR ao perder (como no treino)
    const exaustao = 20;

    // Chance mínima de fragmento
    const chanceFragmento = 0.02;
    let fragmentos = 0;
    if (Math.random() < chanceFragmento) {
      fragmentos = 1;
    }

    // Mensagens
    const mensagens = [];
    if (diferencaFama < -200) {
      mensagens.push(`😱 Perdeu para oponente ${Math.abs(Math.floor(diferencaFama))} de fama inferior!`);
      mensagens.push(`💔 Perda extra de vínculo e fama!`);
    }
    mensagens.push(`😰 Exaustão aumentada por derrota!`);

    return {
      xp,
      moedas,
      fama, // Negativo!
      pontos_ranking: fama, // Backward compatibility
      fragmentos,
      vinculo,
      exaustao,
      mensagens
    };
  }
}

/**
 * Obtém próximo tier
 */
export function getProximoTier(tierAtual) {
  const tiers = Object.values(TIERS);
  const indiceAtual = tiers.findIndex(t => t.nome === tierAtual.nome);

  if (indiceAtual === -1 || indiceAtual === tiers.length - 1) {
    return null; // Já é o último tier
  }

  return tiers[indiceAtual + 1];
}

/**
 * Calcula progresso no tier atual
 */
export function getProgressoNoTier(fama, tier) {
  if (tier.maxFama === Infinity) {
    return 100; // Tier máximo
  }

  const famaNoTier = fama - tier.minFama;
  const famaTotalTier = tier.maxFama - tier.minFama + 1;

  return Math.min(100, Math.floor((famaNoTier / famaTotalTier) * 100));
}

/**
 * Verifica se pode iniciar PvP
 */
export function podeIniciarPvP(avatar) {
  if (!avatar) {
    return {
      pode: false,
      motivo: 'Nenhum avatar ativo'
    };
  }

  if (!avatar.vivo) {
    return {
      pode: false,
      motivo: 'Avatar está morto! Visite o Necromante.'
    };
  }

  if (avatar.exaustao >= 80) {
    return {
      pode: false,
      motivo: 'Avatar colapsado de exaustão! Deixe-o descansar.'
    };
  }

  if (avatar.exaustao >= 60) {
    return {
      pode: true,
      aviso: 'Avatar muito exausto! Terá penalidades severas em combate.'
    };
  }

  return { pode: true };
}

/**
 * Calcula streak bônus
 */
export function calcularBonusStreak(streak) {
  if (streak < 3) return { multiplicador: 1.0, mensagem: null };

  const mult = 1 + Math.min(streak * 0.05, 0.30); // Até +30%

  let mensagem = `⚡ Streak x${streak}`;
  if (streak >= 10) {
    mensagem = `🔥 STREAK LENDÁRIO x${streak}!`;
  } else if (streak >= 5) {
    mensagem = `⚡ HOT STREAK x${streak}!`;
  }

  return { multiplicador: mult, mensagem };
}

// Backward compatibility exports
export { calcularGanhoFama as calcularPontosVitoria };
export { calcularPerdaFama as calcularPerda };

export default {
  TIERS,
  getTierPorFama,
  getTierPorPontos,
  calcularGanhoFama,
  calcularPerdaFama,
  calcularRecompensasPvP,
  getProximoTier,
  getProgressoNoTier,
  podeIniciarPvP,
  calcularBonusStreak
};
