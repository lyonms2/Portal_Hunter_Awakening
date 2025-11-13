// ==================== UTILITÁRIOS DE PROGRESSÃO ====================
// Arquivo: /lib/utils/progressUtils.js
//
// Funções compartilhadas para cálculos de progressão utilizadas
// em múltiplos sistemas (progressão, vínculo, exaustão)

/**
 * Calcula progresso percentual dentro de um range (nível atual)
 *
 * @param {number} valorAtual - Valor atual do progresso (XP, vínculo, exaustão, etc)
 * @param {Object} nivelInfo - Informações do nível { min, max }
 * @returns {number} Porcentagem de progresso (0-100)
 *
 * @example
 * // Para vínculo: avatar tem 45 pontos, nível "Companheiro" vai de 40-59
 * calcularProgressoNivel(45, { min: 40, max: 59 })
 * // Retorna: 26.32 (26.32% de progresso no nível atual)
 */
export function calcularProgressoNivel(valorAtual, nivelInfo) {
  const range = nivelInfo.max - nivelInfo.min;

  // Evitar divisão por zero
  if (range === 0) {
    return 100;
  }

  const progresso = valorAtual - nivelInfo.min;
  const porcentagem = (progresso / range) * 100;

  // Garantir que está entre 0-100
  return Math.min(100, Math.max(0, porcentagem));
}

/**
 * Encontra o próximo nível em uma lista ordenada de níveis
 *
 * @param {number} valorAtual - Valor atual do progresso
 * @param {Object} niveisConfig - Objeto com configurações de níveis (ex: NIVEIS_VINCULO)
 * @param {string} [nomeChavePontos='pontos_necessarios'] - Nome da chave para pontos faltantes
 * @returns {Object|null} Próximo nível com pontos necessários, ou null se já está no máximo
 *
 * @example
 * // Para vínculo: avatar tem 45 pontos
 * getProximoNivel(45, NIVEIS_VINCULO, 'pontos_necessarios')
 * // Retorna: { nome: 'Aliado', min: 60, max: 79, pontos_necessarios: 15, ... }
 */
export function getProximoNivel(valorAtual, niveisConfig, nomeChavePontos = 'pontos_necessarios') {
  // Converter objeto de níveis para array e ordenar por valor mínimo
  const niveisOrdenados = Object.values(niveisConfig).sort((a, b) => a.min - b.min);

  // Encontrar primeiro nível onde o valor atual é menor que o mínimo
  for (const nivel of niveisOrdenados) {
    if (valorAtual < nivel.min) {
      return {
        ...nivel,
        [nomeChavePontos]: nivel.min - valorAtual
      };
    }
  }

  // Já está no nível máximo
  return null;
}

/**
 * Calcula progresso para XP (específico para sistema de progressão)
 * Esta é uma versão especializada que usa calcularXPNecessario
 *
 * @param {number} xpAtual - XP atual do avatar
 * @param {number} nivelAtual - Nível atual do avatar
 * @param {Function} calcularXPNecessario - Função que calcula XP necessário para próximo nível
 * @param {number} nivelMaximo - Nível máximo permitido
 * @returns {number} Porcentagem de progresso (0-100)
 */
export function calcularProgressoXP(xpAtual, nivelAtual, calcularXPNecessario, nivelMaximo) {
  if (nivelAtual >= nivelMaximo) {
    return 100;
  }

  const xpNecessario = calcularXPNecessario(nivelAtual);
  return Math.min(100, (xpAtual / xpNecessario) * 100);
}

/**
 * Verifica se houve mudança de nível
 *
 * @param {Object} nivelAnterior - Nível anterior
 * @param {Object} nivelNovo - Nível novo
 * @returns {boolean} Se mudou de nível
 */
export function mudouNivel(nivelAnterior, nivelNovo) {
  if (!nivelAnterior || !nivelNovo) {
    return false;
  }

  return nivelAnterior.nome !== nivelNovo.nome;
}

/**
 * Calcula quantos níveis faltam até um nível alvo
 *
 * @param {number} valorAtual - Valor atual
 * @param {number} valorAlvo - Valor do nível alvo
 * @returns {Object} { pontos_faltam, porcentagem }
 */
export function calcularDistanciaAteNivel(valorAtual, valorAlvo) {
  const pontosFaltam = Math.max(0, valorAlvo - valorAtual);
  const porcentagem = valorAlvo > 0 ? (valorAtual / valorAlvo) * 100 : 100;

  return {
    pontos_faltam: pontosFaltam,
    porcentagem: Math.min(100, porcentagem),
    ja_alcancado: valorAtual >= valorAlvo
  };
}

// Exportação default
export default {
  calcularProgressoNivel,
  getProximoNivel,
  calcularProgressoXP,
  mudouNivel,
  calcularDistanciaAteNivel
};
