// ==================== SISTEMA DE STATS ====================
// Arquivo: /app/avatares/sistemas/statsSystem.js

import { CARACTERISTICAS_ELEMENTAIS } from './elementalSystem';
import { calcularHPMaximoSimples } from '../../../lib/combat/statsCalculator';

/**
 * Ranges de stats base por raridade (SEM overlap)
 */
export const RANGES_STATS_POR_RARIDADE = {
  Comum: {
    min: 5,
    max: 10,
    total_min: 20,  // Soma mínima dos 4 stats
    total_max: 35   // Soma máxima dos 4 stats
  },
  Raro: {
    min: 10,
    max: 16,
    total_min: 45,
    total_max: 60
  },
  Lendário: {
    min: 16,
    max: 25,
    total_min: 70,
    total_max: 90
  }
};

/**
 * Multiplicadores de crescimento por raridade
 * Define quanto os stats crescem por nível
 */
export const CRESCIMENTO_POR_RARIDADE = {
  Comum: {
    forca: 0.8,
    agilidade: 0.8,
    resistencia: 0.8,
    foco: 0.8
  },
  Raro: {
    forca: 1.2,
    agilidade: 1.2,
    resistencia: 1.2,
    foco: 1.2
  },
  Lendário: {
    forca: 1.8,
    agilidade: 1.8,
    resistencia: 1.8,
    foco: 1.8
  }
};

/**
 * Define o que cada stat faz no jogo
 */
export const EFEITOS_STATS = {
  forca: {
    nome: 'Força',
    descricao: 'Determina o dano físico causado',
    emoji: '💪',
    cor: 'text-red-400',
    efeitos: [
      'Aumenta dano de ataques físicos',
      'Melhora efetividade de habilidades corpo-a-corpo',
      '+1% de dano por ponto de Força'
    ],
    formula_dano: (forca) => forca * 1.0
  },
  agilidade: {
    nome: 'Agilidade',
    descricao: 'Define velocidade de ataque e chance de evasão',
    emoji: '⚡',
    cor: 'text-green-400',
    efeitos: [
      'Aumenta velocidade de ataque',
      'Melhora chance de esquiva',
      '+0.5% de evasão por ponto de Agilidade',
      'Determina ordem de ação no combate'
    ],
    formula_evasao: (agilidade) => Math.min(agilidade * 0.5, 75), // Cap de 75%
    formula_velocidade: (agilidade) => agilidade
  },
  resistencia: {
    nome: 'Resistência',
    descricao: 'Determina pontos de vida e defesa',
    emoji: '🛡️',
    cor: 'text-blue-400',
    efeitos: [
      'Aumenta HP máximo',
      'Reduz dano recebido',
      '+10 HP por ponto de Resistência',
      '+0.5% de redução de dano por ponto'
    ],
    formula_hp: (resistencia) => resistencia * 10,
    formula_defesa: (resistencia) => resistencia * 0.5
  },
  foco: {
    nome: 'Foco',
    descricao: 'Poder mágico e chance de crítico',
    emoji: '🎯',
    cor: 'text-purple-400',
    efeitos: [
      'Aumenta dano mágico',
      'Melhora chance de crítico',
      '+1.2% de dano mágico por ponto de Foco',
      '+0.3% de crítico por ponto'
    ],
    formula_dano_magico: (foco) => foco * 1.2,
    formula_critico: (foco) => Math.min(foco * 0.3, 50) // Cap de 50%
  }
};

/**
 * Gera stats balanceados para um novo avatar
 * @param {string} raridade - Raridade do avatar (Comum, Raro, Lendário)
 * @param {string} elemento - Elemento do avatar
 * @returns {Object} Stats gerados { forca, agilidade, resistencia, foco }
 */
export function gerarStatsBalanceados(raridade, elemento) {
  const range = RANGES_STATS_POR_RARIDADE[raridade];
  
  if (!range) {
    throw new Error(`Raridade inválida: ${raridade}`);
  }

  const caracteristicas = CARACTERISTICAS_ELEMENTAIS[elemento];
  
  // Gerar stats base aleatórios dentro do range
  let stats = {
    forca: gerarStatAleatorio(range.min, range.max),
    agilidade: gerarStatAleatorio(range.min, range.max),
    resistencia: gerarStatAleatorio(range.min, range.max),
    foco: gerarStatAleatorio(range.min, range.max)
  };

  // Ajustar para garantir total dentro do range
  let totalAtual = stats.forca + stats.agilidade + stats.resistencia + stats.foco;
  
  while (totalAtual < range.total_min || totalAtual > range.total_max) {
    stats = {
      forca: gerarStatAleatorio(range.min, range.max),
      agilidade: gerarStatAleatorio(range.min, range.max),
      resistencia: gerarStatAleatorio(range.min, range.max),
      foco: gerarStatAleatorio(range.min, range.max)
    };
    totalAtual = stats.forca + stats.agilidade + stats.resistencia + stats.foco;
  }

  // Aplicar bônus elementais se existir característica
  if (caracteristicas) {
    // Aumentar stat primária
    const statPrimaria = caracteristicas.stat_primaria;
    stats[statPrimaria] = Math.floor(stats[statPrimaria] * 1.15);

    // Aumentar stat secundária
    const statSecundaria = caracteristicas.stat_secundaria;
    stats[statSecundaria] = Math.floor(stats[statSecundaria] * 1.08);

    // Reduzir stat fraca
    const statFraca = caracteristicas.stat_fraca;
    stats[statFraca] = Math.floor(stats[statFraca] * 0.92);
  }

  return stats;
}

/**
 * Gera um valor aleatório dentro de um range
 */
function gerarStatAleatorio(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Calcula stats após ganhar níveis
 * @param {Object} statsAtuais - Stats atuais do avatar
 * @param {number} niveisGanhos - Quantidade de níveis ganhos
 * @param {string} raridade - Raridade do avatar
 * @param {string} elemento - Elemento do avatar
 * @returns {Object} Novos stats calculados
 */
export function calcularStatsAposNivel(statsAtuais, niveisGanhos, raridade, elemento) {
  const crescimento = CRESCIMENTO_POR_RARIDADE[raridade];
  const caracteristicas = CARACTERISTICAS_ELEMENTAIS[elemento];
  
  if (!crescimento) {
    throw new Error(`Raridade inválida: ${raridade}`);
  }

  const novosStats = { ...statsAtuais };

  // Aplicar crescimento base por nível
  Object.keys(crescimento).forEach(stat => {
    const crescimentoBase = crescimento[stat] * niveisGanhos;
    
    // Bônus adicional para stat primária do elemento
    let multiplicador = 1.0;
    if (caracteristicas && caracteristicas.stat_primaria === stat) {
      multiplicador = 1.3; // 30% mais crescimento na stat primária
    } else if (caracteristicas && caracteristicas.stat_secundaria === stat) {
      multiplicador = 1.15; // 15% mais na secundária
    } else if (caracteristicas && caracteristicas.stat_fraca === stat) {
      multiplicador = 0.85; // 15% menos na fraca
    }

    novosStats[stat] = Math.floor(novosStats[stat] + (crescimentoBase * multiplicador));
  });

  return novosStats;
}

/**
 * Calcula HP máximo baseado em resistência
 * @param {number} resistencia - Valor de resistência
 * @param {number} nivel - Nível do avatar
 * @returns {number} HP máximo
 * @deprecated Use calcularHPMaximoSimples de statsCalculator.js
 */
export function calcularHPMaximo(resistencia, nivel) {
  return calcularHPMaximoSimples(resistencia, nivel);
}

/**
 * Calcula dano físico baseado em força
 * @param {number} forca - Valor de força
 * @param {number} nivel - Nível do avatar
 * @returns {number} Dano físico
 */
export function calcularDanoFisico(forca, nivel) {
  const danoBase = EFEITOS_STATS.forca.formula_dano(forca);
  const bonusNivel = nivel * 2; // +2 dano por nível
  return Math.floor(danoBase + bonusNivel);
}

/**
 * Calcula dano mágico baseado em foco
 * @param {number} foco - Valor de foco
 * @param {number} nivel - Nível do avatar
 * @returns {number} Dano mágico
 */
export function calcularDanoMagico(foco, nivel) {
  const danoBase = EFEITOS_STATS.foco.formula_dano_magico(foco);
  const bonusNivel = nivel * 2.5; // +2.5 dano mágico por nível
  return Math.floor(danoBase + bonusNivel);
}

/**
 * Calcula chance de evasão baseado em agilidade
 * @param {number} agilidade - Valor de agilidade
 * @returns {number} Porcentagem de evasão (0-75)
 */
export function calcularEvasao(agilidade) {
  return EFEITOS_STATS.agilidade.formula_evasao(agilidade);
}

/**
 * Calcula chance de crítico BASE baseado em foco
 * IMPORTANTE: Esta é a versão simplificada para exibição de stats base.
 * Para cálculos em combate, use calcularChanceCritico() de batalhaEngine.js
 * que considera vínculo, exaustão e outros modificadores de combate.
 *
 * @param {number} foco - Valor de foco
 * @returns {number} Porcentagem de crítico base (0-50)
 *
 * @see {@link ../../lib/arena/batalhaEngine.js#calcularChanceCritico} Para versão completa de combate
 */
export function calcularChanceCritico(foco) {
  return EFEITOS_STATS.foco.formula_critico(foco);
}

/**
 * Calcula redução de dano baseado em resistência
 * @param {number} resistencia - Valor de resistência
 * @returns {number} Porcentagem de redução de dano
 */
export function calcularReducaoDano(resistencia) {
  return EFEITOS_STATS.resistencia.formula_defesa(resistencia);
}

/**
 * Gera resumo completo dos stats calculados
 * @param {Object} avatar - Objeto do avatar completo
 * @returns {Object} Resumo de todos os stats calculados
 */
export function gerarResumoStats(avatar) {
  return {
    // Stats base
    forca: avatar.forca,
    agilidade: avatar.agilidade,
    resistencia: avatar.resistencia,
    foco: avatar.foco,
    total_stats: avatar.forca + avatar.agilidade + avatar.resistencia + avatar.foco,

    // Stats calculados - Combate
    hp_maximo: calcularHPMaximo(avatar.resistencia, avatar.nivel),
    dano_fisico: calcularDanoFisico(avatar.forca, avatar.nivel),
    dano_magico: calcularDanoMagico(avatar.foco, avatar.nivel),
    
    // Stats calculados - Defesa/Utilidade
    evasao: calcularEvasao(avatar.agilidade),
    chance_critico: calcularChanceCritico(avatar.foco),
    reducao_dano: calcularReducaoDano(avatar.resistencia),
    velocidade: avatar.agilidade, // Determina ordem de ação

    // Metadados
    nivel: avatar.nivel,
    raridade: avatar.raridade,
    elemento: avatar.elemento
  };
}

/**
 * Compara dois avatares e retorna diferenças
 * @param {Object} avatar1 
 * @param {Object} avatar2 
 * @returns {Object} Comparação detalhada
 */
export function compararAvatares(avatar1, avatar2) {
  const stats1 = gerarResumoStats(avatar1);
  const stats2 = gerarResumoStats(avatar2);

  const comparacao = {};

  Object.keys(stats1).forEach(key => {
    if (typeof stats1[key] === 'number' && typeof stats2[key] === 'number') {
      const diferenca = stats2[key] - stats1[key];
      const porcentagem = stats1[key] !== 0 
        ? ((diferenca / stats1[key]) * 100).toFixed(1)
        : 0;

      comparacao[key] = {
        avatar1: stats1[key],
        avatar2: stats2[key],
        diferenca: diferenca,
        porcentagem: porcentagem,
        melhor: diferenca > 0 ? 'avatar2' : diferenca < 0 ? 'avatar1' : 'empate'
      };
    }
  });

  return comparacao;
}

/**
 * Valida se os stats estão dentro dos limites permitidos
 * @param {Object} stats - Stats a validar
 * @param {string} raridade - Raridade do avatar
 * @returns {Object} { valido: boolean, erros: [] }
 */
export function validarStats(stats, raridade) {
  const range = RANGES_STATS_POR_RARIDADE[raridade];
  const erros = [];

  if (!range) {
    erros.push(`Raridade inválida: ${raridade}`);
    return { valido: false, erros };
  }

  // Verificar cada stat individualmente
  ['forca', 'agilidade', 'resistencia', 'foco'].forEach(stat => {
    if (stats[stat] < range.min) {
      erros.push(`${stat} muito baixo: ${stats[stat]} (mínimo: ${range.min})`);
    }
    if (stats[stat] > range.max) {
      erros.push(`${stat} muito alto: ${stats[stat]} (máximo: ${range.max})`);
    }
  });

  // Verificar total
  const total = stats.forca + stats.agilidade + stats.resistencia + stats.foco;
  if (total < range.total_min) {
    erros.push(`Total de stats muito baixo: ${total} (mínimo: ${range.total_min})`);
  }
  if (total > range.total_max) {
    erros.push(`Total de stats muito alto: ${total} (máximo: ${range.total_max})`);
  }

  return {
    valido: erros.length === 0,
    erros
  };
}

// ==================== TABELAS DE REFERÊNCIA ====================

export const TABELA_RANGES = `
╔═══════════════════════════════════════════════════════════════╗
║                    RANGES DE STATS POR RARIDADE               ║
╠═══════════════════════════════════════════════════════════════╣
║ COMUM                                                         ║
║   Range Individual: 5-10                                      ║
║   Total de Stats: 20-35                                       ║
║   Crescimento/Nível: 0.8 por stat                            ║
╠═══════════════════════════════════════════════════════════════╣
║ RARO                                                          ║
║   Range Individual: 10-16                                     ║
║   Total de Stats: 45-60                                       ║
║   Crescimento/Nível: 1.2 por stat                            ║
╠═══════════════════════════════════════════════════════════════╣
║ LENDÁRIO                                                      ║
║   Range Individual: 16-25                                     ║
║   Total de Stats: 70-90                                       ║
║   Crescimento/Nível: 1.8 por stat                            ║
╚═══════════════════════════════════════════════════════════════╝
`;

export const TABELA_FORMULAS = `
╔═══════════════════════════════════════════════════════════════╗
║                      FÓRMULAS DE COMBATE                      ║
╠═══════════════════════════════════════════════════════════════╣
║ HP Máximo = (Resistência × 10) + (Nível × 5)                 ║
║ Dano Físico = (Força × 1.0) + (Nível × 2)                    ║
║ Dano Mágico = (Foco × 1.2) + (Nível × 2.5)                   ║
║ Evasão = (Agilidade × 0.5)% [Max: 75%]                       ║
║ Crítico = (Foco × 0.3)% [Max: 50%]                           ║
║ Redução Dano = (Resistência × 0.5)%                          ║
╚═══════════════════════════════════════════════════════════════╝
`;

// Exportação default
export default {
  RANGES_STATS_POR_RARIDADE,
  CRESCIMENTO_POR_RARIDADE,
  EFEITOS_STATS,
  gerarStatsBalanceados,
  calcularStatsAposNivel,
  calcularHPMaximo,
  calcularDanoFisico,
  calcularDanoMagico,
  calcularEvasao,
  calcularChanceCritico,
  calcularReducaoDano,
  gerarResumoStats,
  compararAvatares,
  validarStats,
  TABELA_RANGES,
  TABELA_FORMULAS
};
