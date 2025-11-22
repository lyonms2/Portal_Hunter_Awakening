// ==================== SISTEMA DE HABILIDADES ====================
// Arquivo: /app/avatares/sistemas/abilitiesSystem.js

import { ELEMENTOS } from './elementalSystem';

/**
 * Tipos de habilidades
 */
export const TIPO_HABILIDADE = {
  OFENSIVA: 'Ofensiva',
  DEFENSIVA: 'Defensiva',
  SUPORTE: 'Suporte',
  CONTROLE: 'Controle',
  PASSIVA: 'Passiva'
};

/**
 * Raridade das habilidades (diferente da raridade do avatar)
 */
export const RARIDADE_HABILIDADE = {
  BASICA: 'Básica',
  AVANCADA: 'Avançada',
  ULTIMATE: 'Ultimate'
};

/**
 * Estrutura base de uma habilidade
 */
const criarHabilidade = (config) => ({
  nome: config.nome,
  descricao: config.descricao,
  tipo: config.tipo,
  raridade: config.raridade || RARIDADE_HABILIDADE.BASICA,
  elemento: config.elemento,
  
  // Custos e cooldowns
  custo_energia: config.custo_energia || 20,
  cooldown: config.cooldown || 1, // turnos
  
  // Efeitos numéricos
  dano_base: config.dano_base || 0,
  multiplicador_stat: config.multiplicador_stat || 1.0,
  stat_primario: config.stat_primario || 'forca', // qual stat usa
  
  // Efeitos especiais
  efeitos_status: config.efeitos_status || [],
  alvo: config.alvo || 'inimigo_unico', // inimigo_unico, inimigos_area, aliado, self
  area: config.area || false,
  num_alvos: config.num_alvos || 1,
  
  // Chances e durações
  chance_acerto: config.chance_acerto || 100,
  chance_efeito: config.chance_efeito || 100,
  duracao_efeito: config.duracao_efeito || 0,
  
  // Requisitos
  nivel_minimo: config.nivel_minimo || 1,
  vinculo_minimo: config.vinculo_minimo || 0,
  
  // Evolução
  evolui_para: config.evolui_para || null,
  nivel_evolucao: config.nivel_evolucao || null
});

/**
 * Habilidades por Elemento - BALANCEADAS
 */
export const HABILIDADES_POR_ELEMENTO = {
  
  // ==================== FOGO ====================
  [ELEMENTOS.FOGO]: {
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
      descricao: 'Invoca um inferno devastador causando dano massivo',
      tipo: TIPO_HABILIDADE.OFENSIVA,
      raridade: RARIDADE_HABILIDADE.ULTIMATE,
      elemento: ELEMENTOS.FOGO,
      dano_base: 250,
      multiplicador_stat: 2.8,
      stat_primario: 'forca',
      custo_energia: 80,
      cooldown: 5,
      nivel_minimo: 25,
      vinculo_minimo: 60
    })
  },

  // ==================== ÁGUA ====================
  [ELEMENTOS.AGUA]: {
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
      dano_base: 100,
      multiplicador_stat: 2.0,
      stat_primario: 'foco',
      efeitos_status: ['afogamento', 'auto_cura'],
      duracao_efeito: 4,
      custo_energia: 80,
      cooldown: 5,
      nivel_minimo: 25,
      vinculo_minimo: 60
    })
  },

  // ==================== TERRA ====================
  [ELEMENTOS.TERRA]: {
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
  },

  // ==================== VENTO ====================
  [ELEMENTOS.VENTO]: {
    LAMINAS_DE_AR: criarHabilidade({
      nome: 'Lâminas de Ar',
      descricao: 'Múltiplos cortes rápidos de vento afiado (3 golpes)',
      tipo: TIPO_HABILIDADE.OFENSIVA,
      elemento: ELEMENTOS.VENTO,
      dano_base: 20,
      multiplicador_stat: 0.8,
      stat_primario: 'agilidade',
      num_golpes: 3,
      custo_energia: 20,
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
  },

  // ==================== ELETRICIDADE ====================
  [ELEMENTOS.ELETRICIDADE]: {
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
      dano_base: 95,
      multiplicador_stat: 2.0,
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
  },

  // ==================== SOMBRA ====================
  [ELEMENTOS.SOMBRA]: {
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
      descricao: 'Drena grande quantidade de vida e enfraquece o alvo',
      tipo: TIPO_HABILIDADE.OFENSIVA,
      raridade: RARIDADE_HABILIDADE.AVANCADA,
      elemento: ELEMENTOS.SOMBRA,
      dano_base: 70,
      multiplicador_stat: 1.7,
      stat_primario: 'foco',
      efeitos_status: ['roubo_vida_intenso', 'enfraquecido'],
      duracao_efeito: 2,
      custo_energia: 45,
      cooldown: 2,
      nivel_minimo: 10,
      evolui_para: 'APOCALIPSE_SOMBRIO',
      nivel_evolucao: 25
    }),
    
    TERROR_SOMBRIO: criarHabilidade({
      nome: 'Terror Sombrio',
      descricao: 'Aterroriza inimigos, reduzindo todos os seus stats',
      tipo: TIPO_HABILIDADE.CONTROLE,
      raridade: RARIDADE_HABILIDADE.AVANCADA,
      elemento: ELEMENTOS.SOMBRA,
      dano_base: 40,
      multiplicador_stat: 1.0,
      stat_primario: 'foco',
      efeitos_status: ['terror', 'stats_reduzidos'],
      alvo: 'inimigos_area',
      area: true,
      duracao_efeito: 3,
      custo_energia: 50,
      cooldown: 3,
      nivel_minimo: 15
    }),
    
    APOCALIPSE_SOMBRIO: criarHabilidade({
      nome: 'Apocalipse Sombrio',
      descricao: 'As trevas primordiais consomem toda luz e vida',
      tipo: TIPO_HABILIDADE.OFENSIVA,
      raridade: RARIDADE_HABILIDADE.ULTIMATE,
      elemento: ELEMENTOS.SOMBRA,
      dano_base: 190,
      multiplicador_stat: 2.6,
      stat_primario: 'foco',
      efeitos_status: ['roubo_vida_massivo', 'maldito'],
      alvo: 'inimigos_area',
      area: true,
      num_alvos: 5,
      duracao_efeito: 3,
      custo_energia: 90,
      cooldown: 5,
      nivel_minimo: 25,
      vinculo_minimo: 60
    })
  },

  // ==================== LUZ ====================
  [ELEMENTOS.LUZ]: {
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
      descricao: 'Aumenta todos os stats de aliados',
      tipo: TIPO_HABILIDADE.SUPORTE,
      elemento: ELEMENTOS.LUZ,
      dano_base: 0,
      multiplicador_stat: 1.3,
      stat_primario: 'foco',
      efeitos_status: ['bencao'],
      alvo: 'aliados',
      area: true,
      duracao_efeito: 3,
      custo_energia: 35,
      cooldown: 3,
      nivel_minimo: 5
    }),
    
    PURIFICACAO: criarHabilidade({
      nome: 'Purificação',
      descricao: 'Remove todos os efeitos negativos de aliados',
      tipo: TIPO_HABILIDADE.SUPORTE,
      raridade: RARIDADE_HABILIDADE.AVANCADA,
      elemento: ELEMENTOS.LUZ,
      dano_base: -40, // Cura
      multiplicador_stat: 1.5,
      stat_primario: 'foco',
      efeitos_status: ['limpar_debuffs'],
      alvo: 'aliados',
      area: true,
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
      dano_base: 100,
      multiplicador_stat: 2.0,
      stat_primario: 'foco',
      efeitos_status: ['execucao'], // Mais dano em alvos com baixo HP
      custo_energia: 50,
      cooldown: 2,
      nivel_minimo: 10,
      evolui_para: 'ASCENSAO_CELESTIAL',
      nivel_evolucao: 25
    }),
    
    ASCENSAO_CELESTIAL: criarHabilidade({
      nome: 'Ascensão Celestial',
      descricao: 'Luz divina purifica aliados e aniquila inimigos',
      tipo: TIPO_HABILIDADE.SUPORTE,
      raridade: RARIDADE_HABILIDADE.ULTIMATE,
      elemento: ELEMENTOS.LUZ,
      dano_base: 170,
      multiplicador_stat: 2.4,
      stat_primario: 'foco',
      efeitos_status: ['cura_massiva_aliados', 'dano_massivo_inimigos'],
      alvo: 'todos',
      area: true,
      duracao_efeito: 3,
      custo_energia: 85,
      cooldown: 5,
      nivel_minimo: 25,
      vinculo_minimo: 60
    })
  }
};

/**
 * Seleciona habilidades iniciais para um novo avatar
 * @param {string} elemento - Elemento do avatar
 * @param {string} raridade - Raridade do avatar (Comum, Raro, Lendário)
 * @returns {Array} Lista de habilidades iniciais
 */
export function selecionarHabilidadesIniciais(elemento, raridade) {
  const habilidadesElemento = HABILIDADES_POR_ELEMENTO[elemento];
  
  if (!habilidadesElemento) {
    return [];
  }

  const habilidadesDisponiveis = Object.values(habilidadesElemento)
    .filter(hab => hab.nivel_minimo === 1 || hab.raridade === RARIDADE_HABILIDADE.BASICA);

  let quantidade = 1; // Comum = 1 habilidade
  if (raridade === 'Raro') quantidade = 2;
  if (raridade === 'Lendário') quantidade = 3;

  // Sempre incluir a primeira habilidade (básica)
  const selecionadas = [habilidadesDisponiveis[0]];

  // Adicionar habilidades aleatórias adicionais
  const restantes = habilidadesDisponiveis.slice(1);
  while (selecionadas.length < quantidade && restantes.length > 0) {
    const index = Math.floor(Math.random() * restantes.length);
    selecionadas.push(restantes[index]);
    restantes.splice(index, 1);
  }

  return selecionadas;
}

/**
 * Retorna todas as habilidades disponíveis para um elemento e nível
 * @param {string} elemento - Elemento do avatar
 * @param {number} nivel - Nível do avatar
 * @param {number} vinculo - Vínculo do avatar
 * @returns {Array} Habilidades disponíveis
 */
export function getHabilidadesDisponiveis(elemento, nivel, vinculo) {
  const habilidadesElemento = HABILIDADES_POR_ELEMENTO[elemento];
  
  if (!habilidadesElemento) {
    return [];
  }

  return Object.values(habilidadesElemento).filter(hab => 
    hab.nivel_minimo <= nivel && hab.vinculo_minimo <= vinculo
  );
}

/**
 * Verifica se uma habilidade pode evoluir
 * @param {Object} habilidade - Habilidade atual
 * @param {number} nivel - Nível do avatar
 * @returns {Object|null} Habilidade evoluída ou null
 */
export function podeEvoluirHabilidade(habilidade, nivel) {
  if (!habilidade.evolui_para || !habilidade.nivel_evolucao) {
    return null;
  }

  if (nivel < habilidade.nivel_evolucao) {
    return null;
  }

  // Buscar habilidade evoluída
  const elemento = habilidade.elemento;
  const habilidadesElemento = HABILIDADES_POR_ELEMENTO[elemento];
  
  const evoluida = Object.values(habilidadesElemento).find(
    hab => hab.nome === habilidade.evolui_para
  );

  return evoluida || null;
}

/**
 * Calcula dano final de uma habilidade
 * @param {Object} habilidade - Habilidade usada
 * @param {Object} stats - Stats do avatar
 * @param {number} nivel - Nível do avatar
 * @param {number} vinculo - Vínculo (afeta dano)
 * @returns {number} Dano calculado
 */
export function calcularDanoHabilidade(habilidade, stats, nivel, vinculo = 0) {
  // Valores padrão caso a habilidade não tenha esses campos
  const statPrimario = habilidade.stat_primario || 'forca';
  const danoBase = habilidade.dano_base || 0;
  const multiplicadorStat = habilidade.multiplicador_stat || 1.0;

  const statValue = stats[statPrimario] || 10;

  // Dano base + (stat × multiplicador)
  let dano = danoBase + (statValue * multiplicadorStat);

  // Bônus de nível (1% por nível)
  dano *= (1 + (nivel * 0.01));

  // Bônus de vínculo (até 20% em Alma Gêmea)
  const bonusVinculo = vinculo >= 80 ? 0.20 : vinculo >= 60 ? 0.15 : vinculo >= 40 ? 0.10 : 0;
  dano *= (1 + bonusVinculo);

  return Math.floor(dano);
}

/**
 * Efeitos de status possíveis
 */
export const EFEITOS_STATUS = {
  // Ofensivos
  queimadura: {
    nome: 'Queimadura',
    tipo: 'dano_continuo',
    dano_por_turno: 0.05, // 5% do HP máximo
    duracao_base: 3,
    icone: '🔥'
  },
  queimadura_intensa: {
    nome: 'Queimadura Intensa',
    tipo: 'dano_continuo',
    dano_por_turno: 0.10,
    duracao_base: 3,
    icone: '🔥🔥'
  },
  congelado: {
    nome: 'Congelado',
    tipo: 'controle',
    efeito: 'impede_acao',
    duracao_base: 2,
    icone: '❄️'
  },
  paralisia: {
    nome: 'Paralisia',
    tipo: 'controle',
    chance_falha: 0.30, // 30% chance de falhar ação
    duracao_base: 2,
    icone: '⚡'
  },
  paralisia_intensa: {
    nome: 'Paralisia Intensa',
    tipo: 'controle',
    chance_falha: 0.60,
    duracao_base: 2,
    icone: '⚡⚡'
  },
  atordoado: {
    nome: 'Atordoado',
    tipo: 'controle',
    efeito: 'pula_turno',
    duracao_base: 1,
    icone: '💫'
  },
  desorientado: {
    nome: 'Desorientado',
    tipo: 'debuff',
    reducao_acerto: 0.30, // -30% chance de acerto
    duracao_base: 2,
    icone: '🌀'
  },
  enfraquecido: {
    nome: 'Enfraquecido',
    tipo: 'debuff',
    reducao_stats: 0.25, // -25% em todos os stats
    duracao_base: 3,
    icone: '⬇️'
  },
  lentidao: {
    nome: 'Lentidão',
    tipo: 'debuff',
    reducao_agilidade: 0.40, // -40% agilidade
    duracao_base: 3,
    icone: '🐌'
  },
  afogamento: {
    nome: 'Afogamento',
    tipo: 'dano_continuo',
    dano_por_turno: 0.08,
    duracao_base: 3,
    icone: '💧'
  },
  maldito: {
    nome: 'Maldito',
    tipo: 'dano_continuo',
    dano_por_turno: 0.07,
    impede_cura: true,
    duracao_base: 4,
    icone: '💀'
  },

  // Defensivos/Buffs
  defesa_aumentada: {
    nome: 'Defesa Aumentada',
    tipo: 'buff',
    bonus_resistencia: 0.50, // +50% resistência
    duracao_base: 3,
    icone: '🛡️'
  },
  evasao_aumentada: {
    nome: 'Evasão Aumentada',
    tipo: 'buff',
    bonus_evasao: 0.30, // +30% evasão
    duracao_base: 3,
    icone: '💨'
  },
  velocidade_aumentada: {
    nome: 'Velocidade Aumentada',
    tipo: 'buff',
    bonus_agilidade: 0.40, // +40% agilidade
    duracao_base: 3,
    icone: '⚡'
  },
  sobrecarga: {
    nome: 'Sobrecarga',
    tipo: 'buff_risco',
    bonus_foco: 0.60, // +60% foco
    reducao_resistencia: 0.30, // -30% resistência
    duracao_base: 3,
    icone: '⚡🔴'
  },
  bencao: {
    nome: 'Benção',
    tipo: 'buff',
    bonus_todos_stats: 0.20, // +20% todos os stats
    duracao_base: 3,
    icone: '✨'
  },
  regeneracao: {
    nome: 'Regeneração',
    tipo: 'cura_continua',
    cura_por_turno: 0.05, // 5% HP por turno
    duracao_base: 4,
    icone: '💚'
  },
  invisivel: {
    nome: 'Invisível',
    tipo: 'defensivo',
    evasao_total: true, // 100% evasão
    duracao_base: 1,
    icone: '👻'
  },

  // Especiais
  roubo_vida: {
    nome: 'Roubo de Vida',
    tipo: 'especial',
    percentual_roubo: 0.15, // 15% do dano vira cura
    duracao_base: 0, // Instantâneo
    icone: '🩸'
  },
  roubo_vida_intenso: {
    nome: 'Roubo de Vida Intenso',
    tipo: 'especial',
    percentual_roubo: 0.30,
    duracao_base: 0,
    icone: '🩸🩸'
  },
  perfuracao: {
    nome: 'Perfuração',
    tipo: 'especial',
    ignora_defesa: 0.40, // Ignora 40% da defesa
    duracao_base: 0,
    icone: '🗡️'
  },
  execucao: {
    nome: 'Execução',
    tipo: 'especial',
    bonus_baixo_hp: 0.50, // +50% dano em alvos com <30% HP
    limite_hp: 0.30,
    duracao_base: 0,
    icone: '💀'
  },
  campo_eletrico: {
    nome: 'Campo Elétrico',
    tipo: 'zona',
    dano_entrada: 20,
    duracao_base: 4,
    icone: '⚡🔷'
  },
  fissuras_explosivas: {
    nome: 'Fissuras Explosivas',
    tipo: 'zona',
    dano_continuo: 0.06,
    duracao_base: 3,
    icone: '💥'
  }
};

/**
 * Processa um efeito de status
 * @param {string} efeitoNome - Nome do efeito
 * @param {Object} alvo - Alvo do efeito
 * @returns {Object} Resultado do processamento
 */
export function processarEfeitoStatus(efeitoNome, alvo) {
  const efeito = EFEITOS_STATUS[efeitoNome];
  
  if (!efeito) {
    return { sucesso: false, mensagem: 'Efeito inválido' };
  }

  return {
    sucesso: true,
    efeito: efeito,
    mensagem: `${alvo.nome} está ${efeito.nome}! ${efeito.icone}`,
    duracao: efeito.duracao_base
  };
}

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

/**
 * Gera descrição completa de uma habilidade
 * @param {Object} habilidade - Habilidade
 * @param {Object} stats - Stats do avatar (opcional)
 * @param {number} nivel - Nível do avatar (opcional)
 * @returns {string} Descrição formatada
 */
export function gerarDescricaoCompleta(habilidade, stats = null, nivel = 1) {
  let descricao = `${habilidade.nome} (${habilidade.tipo})\n`;
  descricao += `${habilidade.descricao}\n\n`;
  
  descricao += `⚡ Custo de Energia: ${habilidade.custo_energia}\n`;
  descricao += `⏱️ Cooldown: ${habilidade.cooldown} turno(s)\n`;
  
  if (stats) {
    const dano = calcularDanoHabilidade(habilidade, stats, nivel);
    if (dano > 0) {
      descricao += `💥 Dano Estimado: ${dano}\n`;
    } else if (dano < 0) {
      descricao += `💚 Cura Estimada: ${Math.abs(dano)}\n`;
    }
  }
  
  if (habilidade.efeitos_status.length > 0) {
    descricao += `\n🎯 Efeitos:\n`;
    habilidade.efeitos_status.forEach(ef => {
      const efeitoInfo = EFEITOS_STATUS[ef];
      if (efeitoInfo) {
        descricao += `  ${efeitoInfo.icone} ${efeitoInfo.nome}\n`;
      }
    });
  }
  
  if (habilidade.evolui_para) {
    descricao += `\n⬆️ Evolui para: ${habilidade.evolui_para} (Nível ${habilidade.nivel_evolucao})\n`;
  }
  
  return descricao;
}

/**
 * Valida se avatar pode usar habilidade
 * @param {Object} avatar - Avatar
 * @param {Object} habilidade - Habilidade
 * @param {number} energiaAtual - Energia atual
 * @returns {Object} { pode_usar: boolean, motivo: string }
 */
export function podeUsarHabilidade(avatar, habilidade, energiaAtual) {
  // Verificar nível
  if (avatar.nivel < habilidade.nivel_minimo) {
    return {
      pode_usar: false,
      motivo: `Requer nível ${habilidade.nivel_minimo}`
    };
  }
  
  // Verificar vínculo
  if ((avatar.vinculo || 0) < habilidade.vinculo_minimo) {
    return {
      pode_usar: false,
      motivo: `Requer vínculo ${habilidade.vinculo_minimo}`
    };
  }
  
  // Verificar energia
  if (energiaAtual < habilidade.custo_energia) {
    return {
      pode_usar: false,
      motivo: `Energia insuficiente (${energiaAtual}/${habilidade.custo_energia})`
    };
  }
  
  return { pode_usar: true, motivo: null };
}

// ==================== TABELAS DE REFERÊNCIA ====================

export const TABELA_HABILIDADES = `
╔═══════════════════════════════════════════════════════════════╗
║                    SISTEMA DE HABILIDADES                     ║
╠═══════════════════════════════════════════════════════════════╣
║ TIPOS DE HABILIDADES:                                         ║
║   Ofensiva: Causa dano direto                                 ║
║   Defensiva: Protege e reduz dano                             ║
║   Suporte: Cura e buffa aliados                               ║
║   Controle: Impede/dificulta ações inimigas                   ║
║   Passiva: Sempre ativa                                       ║
╠═══════════════════════════════════════════════════════════════╣
║ RARIDADE DE HABILIDADES:                                      ║
║   Básica: Disponível desde o início                           ║
║   Avançada: Desbloqueada no nível 10-15                      ║
║   Ultimate: Requer nível 25+ e vínculo 60+                   ║
╠═══════════════════════════════════════════════════════════════╣
║ EVOLUÇÃO:                                                      ║
║   Habilidades básicas evoluem no nível 10                     ║
║   Habilidades avançadas evoluem no nível 25                   ║
║   Ultimates não evoluem (já são máximas)                      ║
╠═══════════════════════════════════════════════════════════════╣
║ HABILIDADES COOPERATIVAS:                                     ║
║   Combo (Vínculo 40+): +50% dano                             ║
║   Especial (Vínculo 60+): Proteção mútua                     ║
║   Ultimate (Vínculo 80+): +200% dano, fusão completa         ║
╚═══════════════════════════════════════════════════════════════╝
`;

// Exportação default
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
