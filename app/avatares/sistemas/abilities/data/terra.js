import { ELEMENTOS } from '../../elementalSystem.js';
import { TIPO_HABILIDADE, RARIDADE_HABILIDADE } from '../constants.js';
import { criarHabilidade } from '../factory.js';

/**
 * Habilidades do Elemento Terra
 */
export const HABILIDADES_TERRA = {
  PUNHO_ROCHOSO: criarHabilidade({
    nome: 'Punho Rochoso',
    descricao: 'Soco poderoso revestido de pedra',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    elemento: ELEMENTOS.TERRA,
    dano_base: 35,
    multiplicador_stat: 1.4,
    stat_primario: 'forca',
    custo_energia: 15,
    cooldown: 0,
    evolui_para: 'TERREMOTO',
    nivel_evolucao: 10
  }),

  ARMADURA_DE_PEDRA: criarHabilidade({
    nome: 'Armadura de Pedra',
    descricao: 'Aumenta drasticamente a defesa por alguns turnos',
    tipo: TIPO_HABILIDADE.DEFENSIVA,
    elemento: ELEMENTOS.TERRA,
    dano_base: 0,
    multiplicador_stat: 2.0,
    stat_primario: 'resistencia',
    efeitos_status: ['defesa_aumentada'],
    alvo: 'self',
    duracao_efeito: 3,
    custo_energia: 25,
    cooldown: 3,
    nivel_minimo: 5
  }),

  TERREMOTO: criarHabilidade({
    nome: 'Terremoto',
    descricao: 'Tremor devastador que pode atordoar o inimigo (70% chance)',
    tipo: TIPO_HABILIDADE.CONTROLE,
    raridade: RARIDADE_HABILIDADE.AVANCADA,
    elemento: ELEMENTOS.TERRA,
    dano_base: 65,
    multiplicador_stat: 1.5,
    stat_primario: 'forca',
    efeitos_status: ['atordoado'],
    chance_efeito: 70,
    duracao_efeito: 1,
    custo_energia: 40,
    cooldown: 3,
    nivel_minimo: 10,
    evolui_para: 'FURIA_TECTONICA',
    nivel_evolucao: 25
  }),

  LANCA_DE_ROCHA: criarHabilidade({
    nome: 'Lança de Rocha',
    descricao: 'Projétil perfurante de alta precisão que ignora parte da defesa',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    raridade: RARIDADE_HABILIDADE.AVANCADA,
    elemento: ELEMENTOS.TERRA,
    dano_base: 90,
    multiplicador_stat: 1.8,
    stat_primario: 'forca',
    efeitos_status: ['perfuracao'],
    chance_acerto: 95,
    custo_energia: 40,
    cooldown: 2,
    nivel_minimo: 15
  }),

  FURIA_TECTONICA: criarHabilidade({
    nome: 'Fúria Tectônica',
    descricao: 'Fissuras explosivas causam dano massivo e reduzem resistência',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    raridade: RARIDADE_HABILIDADE.ULTIMATE,
    elemento: ELEMENTOS.TERRA,
    dano_base: 240,
    multiplicador_stat: 2.6,
    stat_primario: 'forca',
    efeitos_status: ['fissuras_explosivas', 'enfraquecido'],
    duracao_efeito: 3,
    custo_energia: 75,
    cooldown: 5,
    nivel_minimo: 25,
    vinculo_minimo: 60
  })
};
