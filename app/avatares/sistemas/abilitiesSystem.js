// ==================== SISTEMA DE HABILIDADES ====================
// Arquivo: /app/avatares/sistemas/abilitiesSystem.js
// Refatorado para melhor organização e manutenibilidade

// Constantes
export { TIPO_HABILIDADE, RARIDADE_HABILIDADE } from './abilities/constants.js';

// Factory
export { criarHabilidade } from './abilities/factory.js';

// Dados de habilidades
export { HABILIDADES_POR_ELEMENTO } from './abilities/data/index.js';

// Efeitos de status
export { EFEITOS_STATUS, processarEfeitoStatus } from './abilities/statusEffects.js';

// Habilidades cooperativas
export { HABILIDADES_COOPERATIVAS } from './abilities/cooperativeAbilities.js';

// Funções utilitárias
export {
  selecionarHabilidadesIniciais,
  getHabilidadesDisponiveis,
  podeEvoluirHabilidade,
  calcularDanoHabilidade,
  gerarDescricaoCompleta,
  podeUsarHabilidade
} from './abilities/utils.js';

// Tabelas de referência
export { TABELA_HABILIDADES } from './abilities/references/tabelas.js';

// Exportação default (mantida para compatibilidade)
import { TIPO_HABILIDADE, RARIDADE_HABILIDADE } from './abilities/constants.js';
import { HABILIDADES_POR_ELEMENTO } from './abilities/data/index.js';
import { EFEITOS_STATUS, processarEfeitoStatus } from './abilities/statusEffects.js';
import { HABILIDADES_COOPERATIVAS } from './abilities/cooperativeAbilities.js';
import { TABELA_HABILIDADES } from './abilities/references/tabelas.js';
import {
  selecionarHabilidadesIniciais,
  getHabilidadesDisponiveis,
  podeEvoluirHabilidade,
  calcularDanoHabilidade,
  gerarDescricaoCompleta,
  podeUsarHabilidade
} from './abilities/utils.js';

export default {
  TIPO_HABILIDADE,
  RARIDADE_HABILIDADE,
  HABILIDADES_POR_ELEMENTO,
  EFEITOS_STATUS,
  HABILIDADES_COOPERATIVAS,
  selecionarHabilidadesIniciais,
  getHabilidadesDisponiveis,
  podeEvoluirHabilidade,
  calcularDanoHabilidade,
  processarEfeitoStatus,
  gerarDescricaoCompleta,
  podeUsarHabilidade,
  TABELA_HABILIDADES
};
