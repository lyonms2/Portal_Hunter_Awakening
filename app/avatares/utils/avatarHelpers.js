import {
  CORES_RARIDADE,
  CORES_BORDA,
  CORES_ELEMENTO,
  EMOJIS_ELEMENTO,
  NIVEIS_EXAUSTAO
} from '../constants/avatarConfig.js';

/**
 * Retorna a cor de gradiente para uma raridade
 */
export function getCorRaridade(raridade) {
  return CORES_RARIDADE[raridade] || CORES_RARIDADE['Comum'];
}

/**
 * Retorna a cor de borda para uma raridade
 */
export function getCorBorda(raridade) {
  return CORES_BORDA[raridade] || CORES_BORDA['Comum'];
}

/**
 * Retorna a cor do texto para um elemento
 */
export function getCorElemento(elemento) {
  return CORES_ELEMENTO[elemento] || 'text-gray-400';
}

/**
 * Retorna o emoji correspondente a um elemento
 */
export function getEmojiElemento(elemento) {
  return EMOJIS_ELEMENTO[elemento] || '⭐';
}

/**
 * Retorna informações sobre o nível de exaustão
 */
export function getNivelExaustao(exaustao) {
  const nivel = NIVEIS_EXAUSTAO.find(n => exaustao < n.max);
  return nivel || NIVEIS_EXAUSTAO[NIVEIS_EXAUSTAO.length - 1];
}

/**
 * Calcula o HP máximo de um avatar
 */
export function calcularHPMaximo(avatar) {
  const bonusRaridade =
    avatar.raridade === 'Lendário' ? 100 :
    avatar.raridade === 'Raro' ? 50 :
    0;

  return (avatar.resistencia * 10) + (avatar.nivel * 5) + bonusRaridade;
}

/**
 * Calcula o HP atual de um avatar (usa hp_atual salvo ou HP máximo)
 */
export function calcularHPAtual(avatar) {
  if (avatar.hp_atual !== null && avatar.hp_atual !== undefined) {
    return avatar.hp_atual;
  }
  return calcularHPMaximo(avatar);
}
