// ==================== SISTEMA DE VÍNCULO ====================
// Arquivo: /app/avatares/sistemas/bondSystem.js

/**
 * Sistema de vínculo entre caçador e avatar
 * O vínculo representa a conexão emocional e tática entre ambos
 * Afeta diretamente o desempenho do avatar em combate
 */

import {
  calcularProgressoNivel as calcularProgressoNivelGenerico,
  getProximoNivel as getProximoNivelGenerico
} from '../../../lib/utils/progressUtils';

/**
 * Configurações do sistema de vínculo
 */
export const CONFIG_VINCULO = {
  MINIMO: 0,
  MAXIMO: 100,
  INICIAL: 0,
  DEGRADACAO_POR_DIA: 0.5, // Vínculo reduz 0.5% por dia sem interação
  DEGRADACAO_POR_MORTE: 20 // Perde 20% ao morrer e ser ressuscitado
};

/**
 * Níveis de vínculo e seus efeitos
 */
export const NIVEIS_VINCULO = {
  ESTRANHO: {
    min: 0,
    max: 19,
    nome: 'Estranho',
    emoji: '❓',
    cor: 'text-gray-400',
    descricao: 'O avatar mal reconhece você como parceiro',
    penalidade: -0.10, // -10% em todos os stats
    efeitos: [
      'Avatar pode desobedecer comandos (5% de chance)',
      'Chance de falha crítica aumentada',
      '-10% em todos os atributos',
      'Não pode usar habilidades cooperativas'
    ]
  },
  CONHECIDO: {
    min: 20,
    max: 39,
    nome: 'Conhecido',
    emoji: '🤝',
    cor: 'text-slate-400',
    descricao: 'Uma relação profissional começa a se formar',
    bonus: 0, // Neutro
    efeitos: [
      'Avatar obedece comandos básicos',
      'Stats normais',
      'Pode usar habilidades básicas'
    ]
  },
  COMPANHEIRO: {
    min: 40,
    max: 59,
    nome: 'Companheiro',
    emoji: '⚔️',
    cor: 'text-blue-400',
    descricao: 'Confiança mútua estabelecida em batalha',
    bonus: 0.10, // +10% stats
    efeitos: [
      '+10% em todos os atributos',
      'Desbloqueia combo de habilidades',
      '+5% XP ganho',
      'Avatar pode avisar sobre perigos'
    ]
  },
  ALIADO: {
    min: 60,
    max: 79,
    nome: 'Aliado',
    emoji: '💙',
    cor: 'text-cyan-400',
    descricao: 'Sincronização elevada entre caçador e avatar',
    bonus: 0.20, // +20% stats
    efeitos: [
      '+20% em todos os atributos',
      '+10% XP ganho',
      'Desbloqueia habilidade cooperativa especial',
      'Avatar pode proteger o caçador automaticamente',
      '+5% chance de esquiva'
    ]
  },
  ALMA_GEMEA: {
    min: 80,
    max: 100,
    nome: 'Alma Gêmea',
    emoji: '💜',
    cor: 'text-purple-400',
    descricao: 'Conexão transcendental - vocês lutam como um só',
    bonus: 0.35, // +35% stats
    efeitos: [
      '+35% em todos os atributos',
      '+20% XP ganho',
      'Desbloqueia habilidade ultimate cooperativa',
      'Avatar e caçador compartilham HP (se um morrer, ambos morrem)',
      '+10% chance de crítico',
      '+10% chance de esquiva',
      'Avatar pode se sacrificar para salvar o caçador'
    ]
  }
};

/**
 * Ações que aumentam o vínculo
 */
export const ACOES_VINCULO = {
  // Ações positivas
  VITORIA_COMBATE: {
    nome: 'Vitória em Combate',
    ganho: 2,
    descricao: 'Vencer uma batalha juntos fortalece o laço',
    cooldown: 0 // Sem cooldown
  },
  VITORIA_BOSS: {
    nome: 'Derrotar Boss',
    ganho: 5,
    descricao: 'Superar grandes desafios cria memórias poderosas',
    cooldown: 0
  },
  MISSAO_COMPLETA: {
    nome: 'Missão Completada',
    ganho: 3,
    descricao: 'Completar missões juntos aumenta a confiança',
    cooldown: 0
  },
  TREINAR_JUNTOS: {
    nome: 'Sessão de Treinamento',
    ganho: 1,
    descricao: 'Tempo de qualidade fortalece vínculos',
    cooldown: 86400000 // 1 dia em ms
  },
  ALIMENTAR: {
    nome: 'Alimentar Avatar',
    ganho: 2,
    descricao: 'Cuidar do avatar demonstra carinho',
    cooldown: 43200000 // 12 horas em ms
  },
  CURAR: {
    nome: 'Curar Avatar',
    ganho: 1,
    descricao: 'Cuidar após batalhas difíceis',
    cooldown: 3600000 // 1 hora em ms
  },
  PRESENTE_COMUM: {
    nome: 'Presente Comum',
    ganho: 1,
    descricao: 'Itens simples mas significativos',
    cooldown: 86400000
  },
  PRESENTE_RARO: {
    nome: 'Presente Raro',
    ganho: 3,
    descricao: 'Presentes especiais fortalecem muito o laço',
    cooldown: 86400000
  },
  PRESENTE_LENDARIO: {
    nome: 'Presente Lendário',
    ganho: 10,
    descricao: 'Um presente que o avatar nunca esquecerá',
    cooldown: 604800000 // 7 dias
  },
  INTERACAO_POSITIVA: {
    nome: 'Interação Positiva',
    ganho: 1,
    descricao: 'Conversar, brincar ou interagir com o avatar',
    cooldown: 21600000 // 6 horas
  },
  SALVAR_DE_MORTE: {
    nome: 'Salvar de Morte Certa',
    ganho: 15,
    descricao: 'Intervir para salvar o avatar no último momento',
    cooldown: 0
  },

  // Ações negativas
  DERROTA: {
    nome: 'Derrota',
    ganho: -1,
    descricao: 'Derrotas consecutivas abalam a confiança',
    cooldown: 0
  },
  DEIXAR_MORRER: {
    nome: 'Avatar Morreu',
    ganho: -10,
    descricao: 'Deixar o avatar morrer é devastador',
    cooldown: 0
  },
  NEGLIGENCIAR: {
    nome: 'Negligenciar Avatar',
    ganho: -2,
    descricao: 'Não interagir por muito tempo',
    cooldown: 0
  },
  FORCAR_DEMAIS: {
    nome: 'Forçar Além dos Limites',
    ganho: -3,
    descricao: 'Empurrar avatar além de suas capacidades',
    cooldown: 0
  }
};

/**
 * Retorna o nível de vínculo atual baseado no valor
 * @param {number} vinculo - Valor do vínculo (0-100)
 * @returns {Object} Informações do nível de vínculo
 */
export function getNivelVinculo(vinculo) {
  // Garantir que está no range válido
  const valorVinculo = Math.max(CONFIG_VINCULO.MINIMO, Math.min(CONFIG_VINCULO.MAXIMO, vinculo));

  for (const [key, nivel] of Object.entries(NIVEIS_VINCULO)) {
    if (valorVinculo >= nivel.min && valorVinculo <= nivel.max) {
      return {
        ...nivel,
        valor_atual: valorVinculo,
        progresso_nivel: calcularProgressoNivel(valorVinculo, nivel),
        proximo_nivel: getProximoNivel(valorVinculo)
      };
    }
  }

  return null;
}

/**
 * Calcula progresso dentro do nível atual (0-100%)
 * @param {number} vinculo - Valor do vínculo
 * @param {Object} nivelAtual - Nível atual de vínculo
 * @returns {number} Porcentagem de progresso
 */
function calcularProgressoNivel(vinculo, nivelAtual) {
  return calcularProgressoNivelGenerico(vinculo, nivelAtual);
}

/**
 * Retorna informações sobre o próximo nível
 * @param {number} vinculo - Valor atual do vínculo
 * @returns {Object|null} Próximo nível ou null se já está no máximo
 */
function getProximoNivel(vinculo) {
  return getProximoNivelGenerico(vinculo, NIVEIS_VINCULO, 'pontos_necessarios');
}

/**
 * Processa uma ação de vínculo
 * @param {Object} avatar - Avatar atual
 * @param {string} tipoAcao - Tipo de ação (chave de ACOES_VINCULO)
 * @param {Object} ultimasAcoes - Objeto com timestamp das últimas ações
 * @returns {Object} Resultado da ação
 */
export function processarAcaoVinculo(avatar, tipoAcao, ultimasAcoes = {}) {
  const acao = ACOES_VINCULO[tipoAcao];
  
  if (!acao) {
    return {
      sucesso: false,
      erro: 'Ação inválida'
    };
  }

  // Verificar cooldown
  const ultimaAcao = ultimasAcoes[tipoAcao];
  const agora = Date.now();

  if (ultimaAcao && acao.cooldown > 0) {
    const tempoPassado = agora - ultimaAcao;
    if (tempoPassado < acao.cooldown) {
      const tempoRestante = Math.ceil((acao.cooldown - tempoPassado) / 1000 / 60);
      return {
        sucesso: false,
        erro: 'Cooldown ativo',
        tempo_restante_minutos: tempoRestante
      };
    }
  }

  // Calcular novo vínculo
  const vinculoAnterior = avatar.vinculo || 0;
  const nivelAnterior = getNivelVinculo(vinculoAnterior);
  
  let novoVinculo = vinculoAnterior + acao.ganho;
  novoVinculo = Math.max(CONFIG_VINCULO.MINIMO, Math.min(CONFIG_VINCULO.MAXIMO, novoVinculo));
  
  const nivelNovo = getNivelVinculo(novoVinculo);
  const mudouNivel = nivelAnterior.nome !== nivelNovo.nome;

  return {
    sucesso: true,
    acao: acao.nome,
    ganho: acao.ganho,
    vinculo_anterior: vinculoAnterior,
    vinculo_novo: novoVinculo,
    nivel_anterior: nivelAnterior,
    nivel_novo: nivelNovo,
    mudou_nivel: mudouNivel,
    timestamp: agora,
    mensagem: mudouNivel 
      ? `🎉 Nível de vínculo aumentou para ${nivelNovo.nome}!`
      : acao.ganho > 0 
        ? `💚 Vínculo aumentou! (+${acao.ganho})`
        : `💔 Vínculo diminuiu... (${acao.ganho})`
  };
}

/**
 * Aplica bônus de vínculo aos stats do avatar
 * @param {Object} stats - Stats base do avatar
 * @param {number} vinculo - Valor do vínculo (0-100)
 * @returns {Object} Stats com bônus aplicados
 */
export function aplicarBonusVinculo(stats, vinculo) {
  const nivel = getNivelVinculo(vinculo);
  
  if (!nivel) {
    return stats;
  }

  const multiplicador = 1 + (nivel.bonus || nivel.penalidade || 0);
  
  return {
    forca: Math.floor(stats.forca * multiplicador),
    agilidade: Math.floor(stats.agilidade * multiplicador),
    resistencia: Math.floor(stats.resistencia * multiplicador),
    foco: Math.floor(stats.foco * multiplicador)
  };
}

/**
 * Processa degradação natural do vínculo
 * @param {number} vinculoAtual - Vínculo atual
 * @param {number} diasSemInteracao - Dias desde última interação
 * @returns {Object} Novo vínculo e informações
 */
export function processarDegradacaoVinculo(vinculoAtual, diasSemInteracao) {
  const degradacaoTotal = CONFIG_VINCULO.DEGRADACAO_POR_DIA * diasSemInteracao;
  const novoVinculo = Math.max(CONFIG_VINCULO.MINIMO, vinculoAtual - degradacaoTotal);
  
  const nivelAnterior = getNivelVinculo(vinculoAtual);
  const nivelNovo = getNivelVinculo(novoVinculo);
  const mudouNivel = nivelAnterior.nome !== nivelNovo.nome;

  return {
    vinculo_anterior: vinculoAtual,
    vinculo_novo: novoVinculo,
    degradacao: degradacaoTotal,
    dias: diasSemInteracao,
    nivel_anterior: nivelAnterior,
    nivel_novo: nivelNovo,
    mudou_nivel: mudouNivel,
    aviso: mudouNivel ? `⚠️ Vínculo caiu para ${nivelNovo.nome}` : null
  };
}

/**
 * Calcula bônus de XP baseado no vínculo
 * @param {number} vinculo - Valor do vínculo
 * @param {number} xpBase - XP base a receber
 * @returns {Object} XP com bônus
 */
export function calcularBonusXPVinculo(vinculo, xpBase) {
  const nivel = getNivelVinculo(vinculo);
  
  let multiplicadorBonus = 0;
  
  if (nivel.nome === 'COMPANHEIRO') multiplicadorBonus = 0.05;
  else if (nivel.nome === 'ALIADO') multiplicadorBonus = 0.10;
  else if (nivel.nome === 'ALMA_GEMEA') multiplicadorBonus = 0.20;

  const bonusXP = Math.floor(xpBase * multiplicadorBonus);
  const xpTotal = xpBase + bonusXP;

  return {
    xp_base: xpBase,
    bonus_vinculo: bonusXP,
    multiplicador: multiplicadorBonus,
    xp_total: xpTotal,
    nivel_vinculo: nivel.nome
  };
}

/**
 * Verifica se uma habilidade cooperativa está disponível
 * @param {number} vinculo - Valor do vínculo
 * @param {string} tipoHabilidade - Tipo de habilidade (combo, especial, ultimate)
 * @returns {boolean} Se está disponível
 */
export function podeUsarHabilidadeCooperativa(vinculo, tipoHabilidade) {
  const nivel = getNivelVinculo(vinculo);
  
  switch (tipoHabilidade) {
    case 'combo':
      return vinculo >= NIVEIS_VINCULO.COMPANHEIRO.min;
    case 'especial':
      return vinculo >= NIVEIS_VINCULO.ALIADO.min;
    case 'ultimate':
      return vinculo >= NIVEIS_VINCULO.ALMA_GEMEA.min;
    default:
      return false;
  }
}

/**
 * Gera relatório completo do vínculo
 * @param {Object} avatar - Avatar completo
 * @returns {Object} Relatório detalhado
 */
export function gerarRelatorioVinculo(avatar) {
  const vinculo = avatar.vinculo || 0;
  const nivel = getNivelVinculo(vinculo);
  const proximoNivel = nivel.proximo_nivel;

  return {
    vinculo_atual: vinculo,
    nivel: nivel.nome,
    emoji: nivel.emoji,
    descricao: nivel.descricao,
    efeitos_ativos: nivel.efeitos,
    bonus_stats: nivel.bonus || nivel.penalidade || 0,
    progresso_nivel: nivel.progresso_nivel,
    proximo_nivel: proximoNivel ? {
      nome: proximoNivel.nome,
      pontos_faltam: proximoNivel.pontos_necessarios
    } : null,
    habilidades_desbloqueadas: {
      combo: podeUsarHabilidadeCooperativa(vinculo, 'combo'),
      especial: podeUsarHabilidadeCooperativa(vinculo, 'especial'),
      ultimate: podeUsarHabilidadeCooperativa(vinculo, 'ultimate')
    },
    bonus_xp: vinculo >= NIVEIS_VINCULO.COMPANHEIRO.min,
    recomendacoes: gerarRecomendacoes(vinculo)
  };
}

/**
 * Gera recomendações para melhorar o vínculo
 * @param {number} vinculo - Valor do vínculo
 * @returns {Array} Lista de recomendações
 */
function gerarRecomendacoes(vinculo) {
  const recomendacoes = [];
  
  if (vinculo < NIVEIS_VINCULO.CONHECIDO.min) {
    recomendacoes.push('Treine com seu avatar para estabelecer confiança básica');
    recomendacoes.push('Complete missões simples juntos');
  } else if (vinculo < NIVEIS_VINCULO.COMPANHEIRO.min) {
    recomendacoes.push('Alimente seu avatar regularmente');
    recomendacoes.push('Vença batalhas em portais para fortalecer o laço');
  } else if (vinculo < NIVEIS_VINCULO.ALIADO.min) {
    recomendacoes.push('Derrote bosses difíceis juntos');
    recomendacoes.push('Use presentes raros para demonstrar apreço');
  } else if (vinculo < NIVEIS_VINCULO.ALMA_GEMEA.min) {
    recomendacoes.push('Supere os maiores desafios para alcançar conexão perfeita');
    recomendacoes.push('Use presentes lendários em momentos especiais');
  } else {
    recomendacoes.push('Mantenha interações diárias para preservar o vínculo máximo');
  }

  return recomendacoes;
}

// ==================== TABELAS DE REFERÊNCIA ====================

export const TABELA_VINCULOS = `
╔═══════════════════════════════════════════════════════════════╗
║                    NÍVEIS DE VÍNCULO                          ║
╠═══════════════════════════════════════════════════════════════╣
║ ❓ ESTRANHO (0-19)                                            ║
║    -10% em todos os stats                                     ║
║    Avatar pode desobedecer (5% chance)                        ║
╠═══════════════════════════════════════════════════════════════╣
║ 🤝 CONHECIDO (20-39)                                          ║
║    Stats normais                                              ║
║    Obediência básica garantida                                ║
╠═══════════════════════════════════════════════════════════════╣
║ ⚔️ COMPANHEIRO (40-59)                                        ║
║    +10% em todos os stats                                     ║
║    +5% XP ganho                                               ║
║    Desbloqueia combos de habilidades                          ║
╠═══════════════════════════════════════════════════════════════╣
║ 💙 ALIADO (60-79)                                             ║
║    +20% em todos os stats                                     ║
║    +10% XP ganho                                              ║
║    Habilidade cooperativa especial                            ║
║    +5% evasão                                                 ║
╠═══════════════════════════════════════════════════════════════╣
║ 💜 ALMA GÊMEA (80-100)                                        ║
║    +35% em todos os stats                                     ║
║    +20% XP ganho                                              ║
║    Habilidade ultimate cooperativa                            ║
║    +10% crítico e +10% evasão                                 ║
║    HP compartilhado com caçador                               ║
╚═══════════════════════════════════════════════════════════════╝
`;

// Exportação default
export default {
  CONFIG_VINCULO,
  NIVEIS_VINCULO,
  ACOES_VINCULO,
  getNivelVinculo,
  processarAcaoVinculo,
  aplicarBonusVinculo,
  processarDegradacaoVinculo,
  calcularBonusXPVinculo,
  podeUsarHabilidadeCooperativa,
  gerarRelatorioVinculo,
  TABELA_VINCULOS
};
