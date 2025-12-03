import { ELEMENTOS } from '../../elementalSystem.js';
import { TIPO_HABILIDADE, RARIDADE_HABILIDADE } from '../constants.js';
import { criarHabilidade } from '../factory.js';

/**
 * Habilidades do Elemento Água
 */
export const HABILIDADES_AGUA = {
  CORRENTE_AQUATICA: criarHabilidade({
    nome: 'Corrente Aquática',
    descricao: 'Ataque básico de água que atravessa o inimigo',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    elemento: ELEMENTOS.AGUA,
    dano_base: 25,
    multiplicador_stat: 1.0,
    stat_primario: 'foco',
    custo_energia: 15,
    cooldown: 0,
    evolui_para: 'MAREMOTO',
    nivel_evolucao: 10
  }),

  REGENERACAO_AQUATICA: criarHabilidade({
    nome: 'Regeneração Aquática',
    descricao: 'Restaura HP ao longo dos turnos com água purificadora',
    tipo: TIPO_HABILIDADE.SUPORTE,
    elemento: ELEMENTOS.AGUA,
    dano_base: 0,
    multiplicador_stat: 1.2,
    stat_primario: 'foco',
    efeitos_status: ['regeneracao'],
    alvo: 'self',
    duracao_efeito: 3,
    custo_energia: 30,
    cooldown: 3,
    nivel_minimo: 3
  }),

  PRISAO_DE_GELO: criarHabilidade({
    nome: 'Prisão de Gelo',
    descricao: 'Congela o alvo por 2 turnos (80% chance), não causa dano',
    tipo: TIPO_HABILIDADE.CONTROLE,
    raridade: RARIDADE_HABILIDADE.AVANCADA,
    elemento: ELEMENTOS.AGUA,
    dano_base: 0,
    multiplicador_stat: 0,
    stat_primario: 'foco',
    efeitos_status: ['congelado'],
    chance_efeito: 80,
    duracao_efeito: 2,
    custo_energia: 40,
    cooldown: 3,
    nivel_minimo: 10
  }),

  MAREMOTO: criarHabilidade({
    nome: 'Maremoto',
    descricao: 'Onda gigante que causa alto dano e pode atordoar o inimigo',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    raridade: RARIDADE_HABILIDADE.AVANCADA,
    elemento: ELEMENTOS.AGUA,
    dano_base: 80,
    multiplicador_stat: 1.6,
    stat_primario: 'foco',
    efeitos_status: ['atordoado', 'lentidao'],
    duracao_efeito: 1,
    custo_energia: 45,
    cooldown: 3,
    nivel_minimo: 10,
    evolui_para: 'DILUVIO_PRIMORDIAL',
    nivel_evolucao: 25
  }),

  DILUVIO_PRIMORDIAL: criarHabilidade({
    nome: 'Dilúvio Primordial',
    descricao: 'Invoca águas ancestrais que curam você enquanto afogam o inimigo',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    raridade: RARIDADE_HABILIDADE.ULTIMATE,
    elemento: ELEMENTOS.AGUA,
    dano_base: 160,
    multiplicador_stat: 2.2,
    stat_primario: 'foco',
    efeitos_status: ['afogamento', 'auto_cura'],
    duracao_efeito: 4,
    custo_energia: 80,
    cooldown: 5,
    nivel_minimo: 25,
    vinculo_minimo: 60
  })
};
