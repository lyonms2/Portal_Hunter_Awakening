import { ELEMENTOS } from '../../elementalSystem.js';
import { TIPO_HABILIDADE, RARIDADE_HABILIDADE } from '../constants.js';
import { criarHabilidade } from '../factory.js';

/**
 * Habilidades do Elemento Luz
 */
export const HABILIDADES_LUZ = {
  RAIO_DE_LUZ: criarHabilidade({
    nome: 'Raio de Luz',
    descricao: 'Projétil de luz pura, extra efetivo contra sombras',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    elemento: ELEMENTOS.LUZ,
    dano_base: 30,
    multiplicador_stat: 1.2,
    stat_primario: 'foco',
    custo_energia: 15,
    cooldown: 0,
    evolui_para: 'JULGAMENTO_DIVINO',
    nivel_evolucao: 10
  }),

  BENCAO: criarHabilidade({
    nome: 'Benção',
    descricao: 'Aumenta todos os stats em 20%',
    tipo: TIPO_HABILIDADE.SUPORTE,
    elemento: ELEMENTOS.LUZ,
    dano_base: 0,
    multiplicador_stat: 1.3,
    stat_primario: 'foco',
    efeitos_status: ['bencao'],
    alvo: 'self',
    duracao_efeito: 3,
    custo_energia: 35,
    cooldown: 3,
    nivel_minimo: 5
  }),

  PURIFICACAO: criarHabilidade({
    nome: 'Purificação',
    descricao: 'Remove debuffs e cura',
    tipo: TIPO_HABILIDADE.SUPORTE,
    raridade: RARIDADE_HABILIDADE.AVANCADA,
    elemento: ELEMENTOS.LUZ,
    dano_base: -50,
    multiplicador_stat: 1.5,
    stat_primario: 'foco',
    efeitos_status: ['limpar_debuffs'],
    alvo: 'self',
    custo_energia: 40,
    cooldown: 3,
    nivel_minimo: 10
  }),

  JULGAMENTO_DIVINO: criarHabilidade({
    nome: 'Julgamento Divino',
    descricao: 'Causa dano massivo, maior em inimigos feridos',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    raridade: RARIDADE_HABILIDADE.AVANCADA,
    elemento: ELEMENTOS.LUZ,
    dano_base: 85,
    multiplicador_stat: 1.8,
    stat_primario: 'foco',
    efeitos_status: ['execucao'],
    custo_energia: 45,
    cooldown: 2,
    nivel_minimo: 10,
    evolui_para: 'ASCENSAO_CELESTIAL',
    nivel_evolucao: 25
  }),

  ASCENSAO_CELESTIAL: criarHabilidade({
    nome: 'Ascensão Celestial',
    descricao: 'Cura você e causa dano massivo no inimigo',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    raridade: RARIDADE_HABILIDADE.ULTIMATE,
    elemento: ELEMENTOS.LUZ,
    dano_base: 200,
    multiplicador_stat: 2.4,
    stat_primario: 'foco',
    efeitos_status: ['auto_cura', 'dano_massivo_inimigos'],
    duracao_efeito: 3,
    custo_energia: 85,
    cooldown: 5,
    nivel_minimo: 25,
    vinculo_minimo: 60
  })
};
