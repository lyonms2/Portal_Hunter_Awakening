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
