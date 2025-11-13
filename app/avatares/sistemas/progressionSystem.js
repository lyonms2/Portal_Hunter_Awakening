// ==================== SISTEMA DE PROGRESSÃO ====================
// Arquivo: /app/avatares/sistemas/progressionSystem.js

import { calcularStatsAposNivel } from './statsSystem';
import { calcularProgressoXP } from '../../../lib/utils/progressUtils';

/**
 * Configurações de níveis
 */
export const CONFIG_NIVEIS = {
  NIVEL_MINIMO: 1,
  NIVEL_MAXIMO: 100,
  XP_BASE: 100, // XP necessário para nível 2
  MULTIPLICADOR_XP: 1.15 // Crescimento exponencial de XP por nível
};

/**
 * Recompensas por raridade ao subir de nível
 */
export const RECOMPENSAS_POR_RARIDADE = {
  Comum: {
    moedas_por_nivel: 10,
    fragmentos_chance: 0.05, // 5% de chance de ganhar fragmento
    fragmentos_quantidade: 1
  },
  Raro: {
    moedas_por_nivel: 25,
    fragmentos_chance: 0.15, // 15% de chance
    fragmentos_quantidade: 2
  },
  Lendário: {
    moedas_por_nivel: 50,
    fragmentos_chance: 0.30, // 30% de chance
    fragmentos_quantidade: 5
  }
};

/**
 * Marcos importantes de nível (milestones)
 * Níveis onde acontecem eventos especiais
 */
export const MILESTONES = {
  10: {
    nome: 'Despertar',
    descricao: 'Avatar aprende uma nova habilidade',
    recompensa: 'nova_habilidade',
    bonus: { stats: 1.1 } // +10% em todos os stats
  },
  25: {
    nome: 'Ascensão Menor',
    descricao: 'Avatar pode evoluir uma habilidade existente',
    recompensa: 'evolucao_habilidade',
    bonus: { stats: 1.15, hp: 50 }
  },
  50: {
    nome: 'Ascensão Maior',
    descricao: 'Avatar desbloqueia habilidade ultimate',
    recompensa: 'habilidade_ultimate',
    bonus: { stats: 1.25, hp: 100 }
  },
  75: {
    nome: 'Transcendência',
    descricao: 'Avatar pode transcender sua forma atual',
    recompensa: 'forma_transcendente',
    bonus: { stats: 1.35, hp: 200 }
  },
  100: {
    nome: 'Perfeição',
    descricao: 'Avatar alcança seu potencial máximo',
    recompensa: 'perfeicao',
    bonus: { stats: 1.5, hp: 500 }
  }
};

/**
 * Calcula XP necessário para próximo nível
 * @param {number} nivelAtual - Nível atual do avatar
 * @returns {number} XP necessário para próximo nível
 */
export function calcularXPNecessario(nivelAtual) {
  if (nivelAtual >= CONFIG_NIVEIS.NIVEL_MAXIMO) {
    return Infinity; // Nível máximo atingido
  }

  // Fórmula exponencial: XP_BASE * (MULTIPLICADOR ^ (nivel - 1))
  return Math.floor(
    CONFIG_NIVEIS.XP_BASE * Math.pow(CONFIG_NIVEIS.MULTIPLICADOR_XP, nivelAtual - 1)
  );
}

/**
 * Calcula XP total acumulado até determinado nível
 * @param {number} nivel - Nível alvo
 * @returns {number} XP total acumulado
 */
export function calcularXPTotalAteNivel(nivel) {
  let xpTotal = 0;
  for (let i = 1; i < nivel; i++) {
    xpTotal += calcularXPNecessario(i);
  }
  return xpTotal;
}

/**
 * Processa ganho de XP e retorna informações sobre level up
 * @param {Object} avatar - Avatar atual
 * @param {number} xpGanho - Quantidade de XP ganha
 * @returns {Object} Resultado do ganho de XP
 */
export function processarGanhoXP(avatar, xpGanho) {
  const resultado = {
    nivelAnterior: avatar.nivel,
    nivelAtual: avatar.nivel,
    xpAnterior: avatar.experiencia,
    xpAtual: avatar.experiencia + xpGanho,
    xpGanho: xpGanho,
    levelUps: 0,
    statsNovos: { ...avatar },
    recompensas: {
      moedas: 0,
      fragmentos: 0,
      habilidades_novas: [],
      milestones: []
    },
    mensagens: []
  };

  let xpRestante = xpGanho;
  let nivelAtual = avatar.nivel;
  let xpAtual = avatar.experiencia;

  // Processar level ups
  while (xpRestante > 0 && nivelAtual < CONFIG_NIVEIS.NIVEL_MAXIMO) {
    const xpNecessario = calcularXPNecessario(nivelAtual);
    const xpParaProximoNivel = xpNecessario - xpAtual;

    if (xpRestante >= xpParaProximoNivel) {
      // Level up!
      nivelAtual++;
      resultado.levelUps++;
      xpRestante -= xpParaProximoNivel;
      xpAtual = 0; // Reseta XP após level up
      
      resultado.mensagens.push(`🎉 Level Up! Nível ${nivelAtual} alcançado!`);

      // Processar recompensas do level up
      const recompensas = processarRecompensasLevelUp(avatar.raridade, nivelAtual);
      resultado.recompensas.moedas += recompensas.moedas;
      resultado.recompensas.fragmentos += recompensas.fragmentos;

      // Verificar milestones
      if (MILESTONES[nivelAtual]) {
        const milestone = MILESTONES[nivelAtual];
        resultado.recompensas.milestones.push(milestone);
        resultado.mensagens.push(`⭐ ${milestone.nome}: ${milestone.descricao}`);
      }
    } else {
      // XP restante não é suficiente para próximo nível
      xpAtual += xpRestante;
      xpRestante = 0;
    }
  }

  // Calcular novos stats se houver level up
  if (resultado.levelUps > 0) {
    resultado.statsNovos = calcularStatsAposNivel(
      avatar,
      resultado.levelUps,
      avatar.raridade,
      avatar.elemento
    );
  }

  resultado.nivelAtual = nivelAtual;
  resultado.xpAtual = xpAtual;

  return resultado;
}

/**
 * Processa recompensas ao subir de nível
 * @param {string} raridade - Raridade do avatar
 * @param {number} nivel - Nível alcançado
 * @returns {Object} Recompensas { moedas, fragmentos }
 */
function processarRecompensasLevelUp(raridade, nivel) {
  const config = RECOMPENSAS_POR_RARIDADE[raridade];
  const recompensas = {
    moedas: config.moedas_por_nivel,
    fragmentos: 0
  };

  // Chance de ganhar fragmentos
  if (Math.random() < config.fragmentos_chance) {
    recompensas.fragmentos = config.fragmentos_quantidade;
  }

  // Bônus a cada 5 níveis
  if (nivel % 5 === 0) {
    recompensas.moedas *= 2;
  }

  // Bônus a cada 10 níveis
  if (nivel % 10 === 0) {
    recompensas.moedas *= 3;
    recompensas.fragmentos += config.fragmentos_quantidade * 2;
  }

  return recompensas;
}

/**
 * Calcula porcentagem de progresso para próximo nível
 * @param {number} xpAtual - XP atual do avatar
 * @param {number} nivelAtual - Nível atual do avatar
 * @returns {number} Porcentagem (0-100)
 */
export function calcularProgressoNivel(xpAtual, nivelAtual) {
  return calcularProgressoXP(xpAtual, nivelAtual, calcularXPNecessario, CONFIG_NIVEIS.NIVEL_MAXIMO);
}

/**
 * Retorna informações sobre o próximo milestone
 * @param {number} nivelAtual - Nível atual do avatar
 * @returns {Object|null} Informações do próximo milestone ou null
 */
export function getProximoMilestone(nivelAtual) {
  const niveisOrdenados = Object.keys(MILESTONES)
    .map(Number)
    .sort((a, b) => a - b);

  for (const nivel of niveisOrdenados) {
    if (nivel > nivelAtual) {
      return {
        nivel: nivel,
        faltam: nivel - nivelAtual,
        ...MILESTONES[nivel]
      };
    }
  }

  return null; // Todos os milestones alcançados
}

/**
 * Retorna todos os milestones alcançados
 * @param {number} nivelAtual - Nível atual do avatar
 * @returns {Array} Lista de milestones alcançados
 */
export function getMilestonesAlcancados(nivelAtual) {
  return Object.keys(MILESTONES)
    .map(Number)
    .filter(nivel => nivel <= nivelAtual)
    .map(nivel => ({
      nivel: nivel,
      ...MILESTONES[nivel]
    }));
}

/**
 * Calcula recompensas totais acumuladas até determinado nível
 * @param {string} raridade - Raridade do avatar
 * @param {number} nivelAlvo - Nível até onde calcular
 * @returns {Object} Total de recompensas
 */
export function calcularRecompensasTotais(raridade, nivelAlvo) {
  let moedasTotais = 0;
  let fragmentosTotais = 0;

  for (let nivel = 2; nivel <= nivelAlvo; nivel++) {
    const recompensas = processarRecompensasLevelUp(raridade, nivel);
    moedasTotais += recompensas.moedas;
    fragmentosTotais += recompensas.fragmentos;
  }

  return {
    moedas: moedasTotais,
    fragmentos: fragmentosTotais,
    niveis: nivelAlvo - 1
  };
}

/**
 * Simula progressão até nível alvo
 * @param {Object} avatar - Avatar base
 * @param {number} nivelAlvo - Nível desejado
 * @returns {Object} Avatar simulado no nível alvo
 */
export function simularProgressao(avatar, nivelAlvo) {
  if (nivelAlvo <= avatar.nivel) {
    return { ...avatar };
  }

  const niveisGanhos = nivelAlvo - avatar.nivel;
  const statsNovos = calcularStatsAposNivel(
    avatar,
    niveisGanhos,
    avatar.raridade,
    avatar.elemento
  );

  const recompensasTotais = calcularRecompensasTotais(
    avatar.raridade,
    nivelAlvo
  );

  const xpNovoNivel = calcularXPTotalAteNivel(nivelAlvo);

  return {
    ...avatar,
    ...statsNovos,
    nivel: nivelAlvo,
    experiencia: 0,
    recompensas_ganhas: recompensasTotais,
    xp_total_investido: xpNovoNivel
  };
}

/**
 * Fontes de XP disponíveis no jogo
 */
export const FONTES_XP = {
  MISSAO_COMUM: {
    nome: 'Missão Comum',
    xp: 50,
    descricao: 'Completar uma missão de rank F-D'
  },
  MISSAO_INTERMEDIARIA: {
    nome: 'Missão Intermediária',
    xp: 150,
    descricao: 'Completar uma missão de rank C-B'
  },
  MISSAO_AVANCADA: {
    nome: 'Missão Avançada',
    xp: 400,
    descricao: 'Completar uma missão de rank A-S'
  },
  BATALHA_PORTAL: {
    nome: 'Batalha em Portal',
    xp: 100,
    descricao: 'Derrotar criaturas em portais dimensionais'
  },
  BOSS_DERROTA: {
    nome: 'Derrotar Boss',
    xp: 1000,
    descricao: 'Derrotar um boss de portal'
  },
  TREINAMENTO: {
    nome: 'Treinamento Diário',
    xp: 25,
    descricao: 'Sessão de treinamento no centro'
  },
  EVENTO_ESPECIAL: {
    nome: 'Evento Especial',
    xp: 500,
    descricao: 'Participar de eventos limitados'
  }
};

/**
 * Calcula XP com bônus aplicados
 * @param {number} xpBase - XP base da atividade
 * @param {Object} bonus - Objeto com bônus { vinculo, evento, premium }
 * @returns {Object} XP total e breakdown
 */
export function calcularXPComBonus(xpBase, bonus = {}) {
  let xpTotal = xpBase;
  const breakdown = {
    base: xpBase,
    bonus_vinculo: 0,
    bonus_evento: 0,
    bonus_premium: 0,
    total: xpBase
  };

  // Bônus de vínculo (até 50%)
  if (bonus.vinculo) {
    const bonusVinculo = Math.floor(xpBase * (bonus.vinculo / 100) * 0.5);
    breakdown.bonus_vinculo = bonusVinculo;
    xpTotal += bonusVinculo;
  }

  // Bônus de evento (ex: fim de semana 2x XP)
  if (bonus.evento) {
    const bonusEvento = Math.floor(xpBase * bonus.evento);
    breakdown.bonus_evento = bonusEvento;
    xpTotal += bonusEvento;
  }

  // Bônus premium (ex: passe de batalha)
  if (bonus.premium) {
    const bonusPremium = Math.floor(xpBase * 0.5);
    breakdown.bonus_premium = bonusPremium;
    xpTotal += bonusPremium;
  }

  breakdown.total = xpTotal;
  return breakdown;
}

// ==================== TABELAS DE REFERÊNCIA ====================

export const TABELA_PROGRESSAO = `
╔═══════════════════════════════════════════════════════════════╗
║                    SISTEMA DE PROGRESSÃO                      ║
╠═══════════════════════════════════════════════════════════════╣
║ XP Base (Nível 2): 100 XP                                    ║
║ Multiplicador: 1.15x por nível                                ║
║ Nível Máximo: 100                                             ║
╠═══════════════════════════════════════════════════════════════╣
║ RECOMPENSAS POR NÍVEL:                                        ║
║   Comum: 10 moedas (5% chance de 1 fragmento)                ║
║   Raro: 25 moedas (15% chance de 2 fragmentos)               ║
║   Lendário: 50 moedas (30% chance de 5 fragmentos)           ║
║                                                                ║
║   Bônus nível múltiplo de 5: 2x moedas                       ║
║   Bônus nível múltiplo de 10: 3x moedas + fragmentos extra   ║
╠═══════════════════════════════════════════════════════════════╣
║ MILESTONES:                                                    ║
║   Nível 10: Despertar (Nova habilidade)                      ║
║   Nível 25: Ascensão Menor (Evolução de habilidade)          ║
║   Nível 50: Ascensão Maior (Habilidade Ultimate)             ║
║   Nível 75: Transcendência (Forma transcendente)             ║
║   Nível 100: Perfeição (Potencial máximo)                    ║
╚═══════════════════════════════════════════════════════════════╝
`;

export const TABELA_FONTES_XP = `
╔═══════════════════════════════════════════════════════════════╗
║                       FONTES DE XP                            ║
╠═══════════════════════════════════════════════════════════════╣
║ Missão Comum (F-D): 50 XP                                    ║
║ Missão Intermediária (C-B): 150 XP                           ║
║ Missão Avançada (A-S): 400 XP                                ║
║ Batalha em Portal: 100 XP                                    ║
║ Derrotar Boss: 1000 XP                                       ║
║ Treinamento Diário: 25 XP                                    ║
║ Evento Especial: 500 XP                                      ║
╠═══════════════════════════════════════════════════════════════╣
║ BÔNUS DE XP:                                                  ║
║   Vínculo Alto: Até +50% XP                                  ║
║   Evento Especial: +100% XP                                  ║
║   Premium: +50% XP                                            ║
╚═══════════════════════════════════════════════════════════════╝
`;

// Exportação default
export default {
  CONFIG_NIVEIS,
  RECOMPENSAS_POR_RARIDADE,
  MILESTONES,
  FONTES_XP,
  calcularXPNecessario,
  calcularXPTotalAteNivel,
  processarGanhoXP,
  calcularProgressoNivel,
  getProximoMilestone,
  getMilestonesAlcancados,
  calcularRecompensasTotais,
  simularProgressao,
  calcularXPComBonus,
  TABELA_PROGRESSAO,
  TABELA_FONTES_XP
};
