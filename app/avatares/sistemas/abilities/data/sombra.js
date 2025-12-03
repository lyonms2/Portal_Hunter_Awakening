import { ELEMENTOS } from '../../elementalSystem.js';
import { TIPO_HABILIDADE, RARIDADE_HABILIDADE } from '../constants.js';
import { criarHabilidade } from '../factory.js';

/**
 * Habilidades do Elemento Sombra
 */
export const HABILIDADES_SOMBRA = {
  TOQUE_SOMBRIO: criarHabilidade({
    nome: 'Toque Sombrio',
    descricao: 'Drena uma pequena quantidade de vida do inimigo',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    elemento: ELEMENTOS.SOMBRA,
    dano_base: 25,
    multiplicador_stat: 1.1,
    stat_primario: 'foco',
    efeitos_status: ['roubo_vida'],
    custo_energia: 15,
    cooldown: 0,
    evolui_para: 'ABRACO_DAS_TREVAS',
    nivel_evolucao: 10
  }),

  MANTO_DA_NOITE: criarHabilidade({
    nome: 'Manto da Noite',
    descricao: 'Torna-se invisível, garantindo evasão total por 1 turno',
    tipo: TIPO_HABILIDADE.DEFENSIVA,
    elemento: ELEMENTOS.SOMBRA,
    dano_base: 0,
    multiplicador_stat: 0,
    stat_primario: 'foco',
    efeitos_status: ['invisivel'],
    alvo: 'self',
    duracao_efeito: 1,
    custo_energia: 40,
    cooldown: 4,
    nivel_minimo: 5
  }),

  ABRACO_DAS_TREVAS: criarHabilidade({
    nome: 'Abraço das Trevas',
    descricao: 'Drena vida intensamente e pode paralisar de medo',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    raridade: RARIDADE_HABILIDADE.AVANCADA,
    elemento: ELEMENTOS.SOMBRA,
    dano_base: 70,
    multiplicador_stat: 1.7,
    stat_primario: 'foco',
    efeitos_status: ['roubo_vida_intenso', 'atordoado'],
    duracao_efeito: 1,
    custo_energia: 45,
    cooldown: 2,
    nivel_minimo: 10,
    evolui_para: 'APOCALIPSE_SOMBRIO',
    nivel_evolucao: 25
  }),

  TERROR_SOMBRIO: criarHabilidade({
    nome: 'Terror Sombrio',
    descricao: 'Aterroriza o inimigo, reduzindo todos os seus stats',
    tipo: TIPO_HABILIDADE.CONTROLE,
    raridade: RARIDADE_HABILIDADE.AVANCADA,
    elemento: ELEMENTOS.SOMBRA,
    dano_base: 40,
    multiplicador_stat: 1.0,
    stat_primario: 'foco',
    efeitos_status: ['terror'],
    duracao_efeito: 3,
    custo_energia: 50,
    cooldown: 3,
    nivel_minimo: 15
  }),

  APOCALIPSE_SOMBRIO: criarHabilidade({
    nome: 'Apocalipse Sombrio',
    descricao: 'Trevas consomem vida massivamente e causam terror',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    raridade: RARIDADE_HABILIDADE.ULTIMATE,
    elemento: ELEMENTOS.SOMBRA,
    dano_base: 230,
    multiplicador_stat: 2.6,
    stat_primario: 'foco',
    efeitos_status: ['roubo_vida_massivo', 'terror'],
    duracao_efeito: 3,
    custo_energia: 90,
    cooldown: 5,
    nivel_minimo: 25,
    vinculo_minimo: 60
  })
};
