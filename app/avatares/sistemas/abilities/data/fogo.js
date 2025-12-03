import { ELEMENTOS } from '../../elementalSystem.js';
import { TIPO_HABILIDADE, RARIDADE_HABILIDADE } from '../constants.js';
import { criarHabilidade } from '../factory.js';

/**
 * Habilidades do Elemento Fogo
 */
export const HABILIDADES_FOGO = {
  // Básicas
  CHAMAS_BASICAS: criarHabilidade({
    nome: 'Labareda',
    descricao: 'Lança uma rajada de fogo no inimigo',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    elemento: ELEMENTOS.FOGO,
    dano_base: 30,
    multiplicador_stat: 1.2,
    stat_primario: 'forca',
    custo_energia: 15,
    cooldown: 0,
    evolui_para: 'EXPLOSAO_IGNEA',
    nivel_evolucao: 10
  }),

  ESCUDO_DE_CHAMAS: criarHabilidade({
    nome: 'Escudo de Chamas',
    descricao: 'Cria uma barreira de fogo que aumenta defesa e queima atacantes',
    tipo: TIPO_HABILIDADE.DEFENSIVA,
    elemento: ELEMENTOS.FOGO,
    dano_base: 10,
    multiplicador_stat: 0.5,
    stat_primario: 'resistencia',
    efeitos_status: ['defesa_aumentada', 'queimadura_contra_ataque'],
    alvo: 'self',
    custo_energia: 25,
    cooldown: 3,
    duracao_efeito: 2,
    nivel_minimo: 5
  }),

  // Avançadas
  EXPLOSAO_IGNEA: criarHabilidade({
    nome: 'Explosão Ígnea',
    descricao: 'Causa dano massivo com chamas devastadoras e queimadura',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    raridade: RARIDADE_HABILIDADE.AVANCADA,
    elemento: ELEMENTOS.FOGO,
    dano_base: 100,
    multiplicador_stat: 1.8,
    stat_primario: 'forca',
    efeitos_status: ['queimadura'],
    custo_energia: 40,
    cooldown: 2,
    nivel_minimo: 10,
    evolui_para: 'INFERNO_ETERNO',
    nivel_evolucao: 25
  }),

  ONDA_DE_CALOR: criarHabilidade({
    nome: 'Onda de Calor',
    descricao: 'Calor extremo que pode atordoar o oponente e causar queimadura',
    tipo: TIPO_HABILIDADE.CONTROLE,
    raridade: RARIDADE_HABILIDADE.AVANCADA,
    elemento: ELEMENTOS.FOGO,
    dano_base: 40,
    multiplicador_stat: 1.0,
    stat_primario: 'foco',
    efeitos_status: ['atordoado', 'queimadura'],
    duracao_efeito: 3,
    custo_energia: 35,
    cooldown: 3,
    nivel_minimo: 15
  }),

  // Ultimate
  INFERNO_ETERNO: criarHabilidade({
    nome: 'Inferno Eterno',
    descricao: 'Invoca um inferno devastador com dano massivo e queimadura intensa',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    raridade: RARIDADE_HABILIDADE.ULTIMATE,
    elemento: ELEMENTOS.FOGO,
    dano_base: 220,
    multiplicador_stat: 2.6,
    stat_primario: 'forca',
    efeitos_status: ['queimadura_intensa'],
    duracao_efeito: 3,
    custo_energia: 80,
    cooldown: 5,
    nivel_minimo: 25,
    vinculo_minimo: 60
  })
};
