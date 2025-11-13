// ==================== CALCULADORA DE STATS DE COMBATE ====================
// Arquivo: /lib/combat/statsCalculator.js
//
// Funções centralizadas para cálculos de stats utilizados em combate

/**
 * Calcula HP máximo de um avatar
 *
 * Esta função pode ser chamada de duas formas:
 * 1. Com um objeto avatar completo: calcularHPMaximo(avatar)
 * 2. Com parâmetros separados: calcularHPMaximo({ resistencia, nivel, raridade })
 *
 * @param {Object|number} avatarOuResistencia - Avatar completo ou valor de resistência
 * @param {number} [nivel] - Nível do avatar (se primeiro param for número)
 * @param {string} [raridade] - Raridade do avatar (opcional: 'Comum', 'Raro', 'Lendário')
 * @returns {number} HP máximo calculado
 *
 * @example
 * // Usando avatar completo
 * const hp = calcularHPMaximo(avatar);
 *
 * @example
 * // Usando parâmetros separados
 * const hp = calcularHPMaximo({ resistencia: 20, nivel: 10, raridade: 'Raro' });
 *
 * @example
 * // Sem raridade (padrão para statsSystem)
 * const hp = calcularHPMaximo({ resistencia: 20, nivel: 10 });
 */
export function calcularHPMaximo(avatarOuResistencia, nivel, raridade) {
  // Normalizar parâmetros
  let resistencia, nivelFinal, raridadeFinal;

  if (typeof avatarOuResistencia === 'object') {
    // Chamado com objeto { resistencia, nivel, raridade }
    resistencia = avatarOuResistencia.resistencia;
    nivelFinal = avatarOuResistencia.nivel;
    raridadeFinal = avatarOuResistencia.raridade;
  } else {
    // Chamado com parâmetros separados (legacy)
    resistencia = avatarOuResistencia;
    nivelFinal = nivel;
    raridadeFinal = raridade;
  }

  // Validação
  if (typeof resistencia !== 'number' || typeof nivelFinal !== 'number') {
    throw new Error('calcularHPMaximo requer resistencia e nivel como números');
  }

  // Cálculo base: HP = resistencia × 10
  const hpBase = resistencia * 10;

  // Bônus de nível: +5 HP por nível
  const bonusNivel = nivelFinal * 5;

  // Bônus de raridade (opcional)
  let bonusRaridade = 0;
  if (raridadeFinal) {
    switch (raridadeFinal) {
      case 'Lendário':
      case 'Legendário': // Suporte para ambas grafias
        bonusRaridade = 100;
        break;
      case 'Raro':
        bonusRaridade = 50;
        break;
      case 'Comum':
      default:
        bonusRaridade = 0;
        break;
    }
  }

  return Math.floor(hpBase + bonusNivel + bonusRaridade);
}

/**
 * Calcula HP máximo baseado apenas em resistência e nível
 * Versão simplificada sem bônus de raridade
 *
 * @param {number} resistencia - Valor de resistência
 * @param {number} nivel - Nível do avatar
 * @returns {number} HP máximo
 *
 * @example
 * const hp = calcularHPMaximoSimples(20, 10); // 250 HP
 */
export function calcularHPMaximoSimples(resistencia, nivel) {
  return calcularHPMaximo({ resistencia, nivel });
}

/**
 * Calcula HP máximo com todos os bônus (incluindo raridade)
 * Versão completa usada em batalhas
 *
 * @param {Object} avatar - Avatar completo com { resistencia, nivel, raridade }
 * @returns {number} HP máximo com todos os bônus
 *
 * @example
 * const hp = calcularHPMaximoCompleto(avatar); // Inclui bônus de raridade
 */
export function calcularHPMaximoCompleto(avatar) {
  return calcularHPMaximo(avatar);
}

/**
 * Calcula quanto HP um avatar ganha ao subir de nível
 *
 * @param {number} niveisGanhos - Quantos níveis foram ganhos
 * @returns {number} HP adicional ganho
 *
 * @example
 * const hpGanho = calcularGanhoHPPorNivel(3); // 15 HP (3 níveis × 5 HP)
 */
export function calcularGanhoHPPorNivel(niveisGanhos) {
  return niveisGanhos * 5;
}

/**
 * Calcula o HP que um avatar teria em um nível específico
 * Útil para simulações e previsões
 *
 * @param {Object} avatar - Avatar base
 * @param {number} nivelAlvo - Nível para simular
 * @returns {number} HP no nível alvo
 *
 * @example
 * const hpNoNivel50 = calcularHPEmNivel(avatar, 50);
 */
export function calcularHPEmNivel(avatar, nivelAlvo) {
  return calcularHPMaximo({
    resistencia: avatar.resistencia,
    nivel: nivelAlvo,
    raridade: avatar.raridade
  });
}

/**
 * Calcula diferença de HP entre dois níveis
 *
 * @param {Object} avatar - Avatar base
 * @param {number} nivelAtual - Nível atual
 * @param {number} nivelAlvo - Nível alvo
 * @returns {Object} { hpAtual, hpAlvo, diferenca }
 *
 * @example
 * const diff = calcularDiferencaHP(avatar, 10, 20);
 * // { hpAtual: 250, hpAlvo: 300, diferenca: 50 }
 */
export function calcularDiferencaHP(avatar, nivelAtual, nivelAlvo) {
  const hpAtual = calcularHPEmNivel(avatar, nivelAtual);
  const hpAlvo = calcularHPEmNivel(avatar, nivelAlvo);

  return {
    hpAtual,
    hpAlvo,
    diferenca: hpAlvo - hpAtual,
    porcentagem: ((hpAlvo - hpAtual) / hpAtual) * 100
  };
}

/**
 * Tabela de referência de HP por raridade
 */
export const BONUS_HP_POR_RARIDADE = {
  Comum: 0,
  Raro: 50,
  'Lendário': 100,
  'Legendário': 100 // Suporte para ambas grafias
};

/**
 * Fórmula base de HP
 */
export const FORMULA_HP = {
  HP_POR_RESISTENCIA: 10,
  HP_POR_NIVEL: 5,
  descricao: 'HP = (resistencia × 10) + (nivel × 5) + bônus_raridade'
};

// Exportação default
export default {
  calcularHPMaximo,
  calcularHPMaximoSimples,
  calcularHPMaximoCompleto,
  calcularGanhoHPPorNivel,
  calcularHPEmNivel,
  calcularDiferencaHP,
  BONUS_HP_POR_RARIDADE,
  FORMULA_HP
};
