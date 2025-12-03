import { ELEMENTOS } from '../../elementalSystem.js';
import { TIPO_HABILIDADE, RARIDADE_HABILIDADE } from '../constants.js';
import { criarHabilidade } from '../factory.js';

/**
 * Habilidades do Elemento Vento
 */
export const HABILIDADES_VENTO = {
  LAMINAS_DE_AR: criarHabilidade({
    nome: 'Lâminas de Ar',
    descricao: 'Múltiplos cortes rápidos de vento afiado (3 golpes)',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    elemento: ELEMENTOS.VENTO,
    dano_base: 12,
    multiplicador_stat: 0.7,
    stat_primario: 'agilidade',
    num_golpes: 3,
    custo_energia: 15,
    cooldown: 0,
    evolui_para: 'CICLONE',
    nivel_evolucao: 10
  }),

  VELOCIDADE_DO_VENTO: criarHabilidade({
    nome: 'Velocidade do Vento',
    descricao: 'Aumenta drasticamente a evasão e velocidade de ataque',
    tipo: TIPO_HABILIDADE.SUPORTE,
    elemento: ELEMENTOS.VENTO,
    dano_base: 0,
    multiplicador_stat: 1.5,
    stat_primario: 'agilidade',
    efeitos_status: ['evasao_aumentada', 'velocidade_aumentada'],
    alvo: 'self',
    duracao_efeito: 3,
    custo_energia: 30,
    cooldown: 3,
    nivel_minimo: 5
  }),

  CICLONE: criarHabilidade({
    nome: 'Ciclone',
    descricao: 'Tornado que desorienta e pode incapacitar por 1 turno',
    tipo: TIPO_HABILIDADE.CONTROLE,
    raridade: RARIDADE_HABILIDADE.AVANCADA,
    elemento: ELEMENTOS.VENTO,
    dano_base: 60,
    multiplicador_stat: 1.4,
    stat_primario: 'agilidade',
    efeitos_status: ['desorientado', 'atordoado'],
    duracao_efeito: 1,
    custo_energia: 40,
    cooldown: 3,
    nivel_minimo: 10,
    evolui_para: 'TEMPESTADE_DIVINA',
    nivel_evolucao: 25
  }),

  RAJADA_CORTANTE: criarHabilidade({
    nome: 'Rajada Cortante',
    descricao: 'Vendaval concentrado que ignora evasão (100% acerto)',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    raridade: RARIDADE_HABILIDADE.AVANCADA,
    elemento: ELEMENTOS.VENTO,
    dano_base: 65,
    multiplicador_stat: 1.6,
    stat_primario: 'agilidade',
    chance_acerto: 100,
    custo_energia: 45,
    cooldown: 2,
    nivel_minimo: 15
  }),

  TEMPESTADE_DIVINA: criarHabilidade({
    nome: 'Tempestade Divina',
    descricao: 'Furacão catastrófico com 5 golpes e aumenta precisão',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    raridade: RARIDADE_HABILIDADE.ULTIMATE,
    elemento: ELEMENTOS.VENTO,
    dano_base: 40,
    multiplicador_stat: 1.8,
    stat_primario: 'agilidade',
    efeitos_status: ['vendaval_cortante', 'precisao_aumentada'],
    num_golpes: 5,
    duracao_efeito: 3,
    custo_energia: 80,
    cooldown: 5,
    nivel_minimo: 25,
    vinculo_minimo: 60
  })
};
