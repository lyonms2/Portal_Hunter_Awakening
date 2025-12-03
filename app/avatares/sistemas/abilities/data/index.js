import { ELEMENTOS } from '../../elementalSystem.js';
import { HABILIDADES_FOGO } from './fogo.js';
import { HABILIDADES_AGUA } from './agua.js';
import { HABILIDADES_TERRA } from './terra.js';
import { HABILIDADES_VENTO } from './vento.js';
import { HABILIDADES_ELETRICIDADE } from './eletricidade.js';
import { HABILIDADES_SOMBRA } from './sombra.js';
import { HABILIDADES_LUZ } from './luz.js';

/**
 * Habilidades por Elemento - BALANCEADAS
 * Centraliza todas as habilidades de todos os elementos
 */
export const HABILIDADES_POR_ELEMENTO = {
  [ELEMENTOS.FOGO]: HABILIDADES_FOGO,
  [ELEMENTOS.AGUA]: HABILIDADES_AGUA,
  [ELEMENTOS.TERRA]: HABILIDADES_TERRA,
  [ELEMENTOS.VENTO]: HABILIDADES_VENTO,
  [ELEMENTOS.ELETRICIDADE]: HABILIDADES_ELETRICIDADE,
  [ELEMENTOS.SOMBRA]: HABILIDADES_SOMBRA,
  [ELEMENTOS.LUZ]: HABILIDADES_LUZ
};
