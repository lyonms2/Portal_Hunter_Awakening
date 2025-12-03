/**
 * Habilidades Cooperativas (requerem vínculo alto)
 */
export const HABILIDADES_COOPERATIVAS = {
  COMBO_BASICO: {
    nome: 'Ataque Sincronizado',
    descricao: 'Caçador e Avatar atacam em perfeita sincronia',
    vinculo_minimo: 40,
    tipo: 'combo',
    multiplicador_dano: 1.5,
    custo_energia: 50
  },

  PROTECAO_MUTUA: {
    nome: 'Proteção Mútua',
    descricao: 'Avatar protege o caçador, dividindo o dano recebido',
    vinculo_minimo: 60,
    tipo: 'especial',
    divisao_dano: 0.5, // 50% do dano pro avatar
    duracao: 3,
    custo_energia: 60
  },

  FUSAO_ELEMENTAL: {
    nome: 'Fusão Elemental',
    descricao: 'Caçador canaliza o poder elemental do avatar',
    vinculo_minimo: 80,
    tipo: 'ultimate',
    multiplicador_dano: 3.0,
    bonus_todos_stats: 0.50,
    duracao: 2,
    custo_energia: 100
  }
};
