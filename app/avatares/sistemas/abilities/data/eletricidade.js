import { ELEMENTOS } from '../../elementalSystem.js';
import { TIPO_HABILIDADE, RARIDADE_HABILIDADE } from '../constants.js';
import { criarHabilidade } from '../factory.js';

/**
 * Habilidades do Elemento Eletricidade
 */
export const HABILIDADES_ELETRICIDADE = {
  CHOQUE_BASICO: criarHabilidade({
    nome: 'Choque Básico',
    descricao: 'Descarga elétrica rápida',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    elemento: ELEMENTOS.ELETRICIDADE,
    dano_base: 28,
    multiplicador_stat: 1.3,
    stat_primario: 'foco',
    efeitos_status: ['paralisia'],
    chance_efeito: 20,
    custo_energia: 15,
    cooldown: 0,
    evolui_para: 'RAIO_PERFURANTE',
    nivel_evolucao: 10
  }),

  CAMPO_ELETRICO: criarHabilidade({
    nome: 'Campo Elétrico',
    descricao: 'Dano elétrico contínuo por 3 turnos',
    tipo: TIPO_HABILIDADE.CONTROLE,
    elemento: ELEMENTOS.ELETRICIDADE,
    dano_base: 25,
    multiplicador_stat: 0.8,
    stat_primario: 'foco',
    efeitos_status: ['eletrocucao'],
    duracao_efeito: 3,
    custo_energia: 35,
    cooldown: 3,
    nivel_minimo: 5
  }),

  RAIO_PERFURANTE: criarHabilidade({
    nome: 'Raio Perfurante',
    descricao: 'Raio concentrado com alto dano e chance de paralisia',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    raridade: RARIDADE_HABILIDADE.AVANCADA,
    elemento: ELEMENTOS.ELETRICIDADE,
    dano_base: 85,
    multiplicador_stat: 1.8,
    stat_primario: 'foco',
    efeitos_status: ['paralisia'],
    chance_efeito: 50,
    duracao_efeito: 1,
    custo_energia: 40,
    cooldown: 2,
    nivel_minimo: 10,
    evolui_para: 'JULGAMENTO_TROVAO',
    nivel_evolucao: 25
  }),

  SOBRECARGA: criarHabilidade({
    nome: 'Sobrecarga',
    descricao: 'Aumenta poder de ataque drasticamente mas reduz defesa',
    tipo: TIPO_HABILIDADE.SUPORTE,
    raridade: RARIDADE_HABILIDADE.AVANCADA,
    elemento: ELEMENTOS.ELETRICIDADE,
    dano_base: 0,
    multiplicador_stat: 2.5,
    stat_primario: 'foco',
    efeitos_status: ['sobrecarga'],
    alvo: 'self',
    duracao_efeito: 3,
    custo_energia: 30,
    cooldown: 4,
    nivel_minimo: 15
  }),

  JULGAMENTO_TROVAO: criarHabilidade({
    nome: 'Julgamento do Trovão',
    descricao: 'Raios devastadores com paralisia intensa e dano por 5 turnos',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    raridade: RARIDADE_HABILIDADE.ULTIMATE,
    elemento: ELEMENTOS.ELETRICIDADE,
    dano_base: 220,
    multiplicador_stat: 2.8,
    stat_primario: 'foco',
    efeitos_status: ['paralisia_intensa', 'eletrocucao'],
    chance_efeito: 80,
    duracao_efeito: 5,
    custo_energia: 85,
    cooldown: 5,
    nivel_minimo: 25,
    vinculo_minimo: 60
  })
};
