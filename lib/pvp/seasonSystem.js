/**
 * Sistema de Temporadas PvP
 *
 * Gerencia temporadas mensais, resets automáticos e recompensas de fim de temporada.
 * Cada temporada dura 1 mês e reseta automaticamente no dia 1.
 */

/**
 * Calcula o ID da temporada atual baseado em ano e mês
 * Formato: "YYYY-MM" (ex: "2025-01", "2025-02")
 */
export function getTemporadaAtual() {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  return `${ano}-${mes}`;
}

/**
 * Retorna informações detalhadas da temporada atual
 */
export function getInfoTemporada() {
  const temporadaId = getTemporadaAtual();
  const agora = new Date();

  // Calcular fim da temporada (último dia do mês atual às 23:59:59)
  const fimTemporada = new Date(agora.getFullYear(), agora.getMonth() + 1, 0, 23, 59, 59);

  // Calcular dias restantes
  const diasRestantes = Math.ceil((fimTemporada - agora) / (1000 * 60 * 60 * 24));

  // Nome formatado (ex: "Temporada Jan/2025")
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const nomeTemporada = `Temporada ${meses[agora.getMonth()]}/${agora.getFullYear()}`;

  return {
    id: temporadaId,
    nome: nomeTemporada,
    fimTemporada,
    diasRestantes,
    ano: agora.getFullYear(),
    mes: agora.getMonth() + 1
  };
}

/**
 * Verifica se os dados do jogador precisam ser resetados para nova temporada
 * Retorna objeto com informações sobre se precisa reset e dados a salvar
 */
export function verificarResetTemporada(userId) {
  const temporadaAtual = getTemporadaAtual();

  // Buscar dados do localStorage
  const rankingKey = `pvp_ranking_${userId}`;
  const rankingData = JSON.parse(localStorage.getItem(rankingKey) || '{"fama": 1000, "vitorias": 0, "derrotas": 0, "streak": 0}');

  // Se não tem temporada salva OU é temporada diferente, precisa resetar
  const temporadaSalva = rankingData.temporada;
  const precisaReset = !temporadaSalva || temporadaSalva !== temporadaAtual;

  if (!precisaReset) {
    return {
      precisaReset: false,
      temporadaAtual,
      rankingData
    };
  }

  // Salvar dados da temporada anterior no histórico
  const historicoKey = `pvp_historico_${userId}`;
  const historico = JSON.parse(localStorage.getItem(historicoKey) || '[]');

  // Só adicionar ao histórico se tinha dados de uma temporada anterior
  if (temporadaSalva && (rankingData.vitorias > 0 || rankingData.derrotas > 0)) {
    const dadosTemporadaAnterior = {
      temporada: temporadaSalva,
      fama: rankingData.fama || 1000,
      vitorias: rankingData.vitorias || 0,
      derrotas: rankingData.derrotas || 0,
      streakMaximo: rankingData.streakMaximo || rankingData.streak || 0,
      tier: rankingData.tier || 'BRONZE',
      posicaoLeaderboard: rankingData.posicaoLeaderboard || null,
      recompensasRecebidas: rankingData.recompensasRecebidas || false,
      dataFim: new Date().toISOString()
    };

    // Adicionar no início do array (temporadas mais recentes primeiro)
    historico.unshift(dadosTemporadaAnterior);

    // Manter apenas últimas 12 temporadas (1 ano)
    if (historico.length > 12) {
      historico.splice(12);
    }

    localStorage.setItem(historicoKey, JSON.stringify(historico));
  }

  // Preparar dados resetados para nova temporada
  const novosDados = {
    temporada: temporadaAtual,
    fama: 1000, // Reset para Bronze
    vitorias: 0,
    derrotas: 0,
    streak: 0,
    streakMaximo: 0,
    recompensasRecebidas: false
  };

  return {
    precisaReset: true,
    temporadaAtual,
    temporadaAnterior: temporadaSalva,
    dadosAntigos: rankingData,
    novosDados,
    historico
  };
}

/**
 * Aplica o reset de temporada para um jogador
 */
export function aplicarResetTemporada(userId) {
  const resultado = verificarResetTemporada(userId);

  if (!resultado.precisaReset) {
    return {
      resetAplicado: false,
      mensagem: 'Jogador já está na temporada atual'
    };
  }

  // Salvar novos dados
  const rankingKey = `pvp_ranking_${userId}`;
  localStorage.setItem(rankingKey, JSON.stringify(resultado.novosDados));

  return {
    resetAplicado: true,
    temporadaAnterior: resultado.temporadaAnterior,
    temporadaAtual: resultado.temporadaAtual,
    dadosAntigos: resultado.dadosAntigos,
    mensagem: `Bem-vindo à ${getInfoTemporada().nome}! Seus dados foram resetados.`
  };
}

/**
 * Obtém o histórico de temporadas do jogador
 */
export function getHistoricoTemporadas(userId) {
  const historicoKey = `pvp_historico_${userId}`;
  return JSON.parse(localStorage.getItem(historicoKey) || '[]');
}

/**
 * Recompensas de fim de temporada baseadas na posição no leaderboard
 */
export const RECOMPENSAS_TEMPORADA = {
  // TOP 1
  1: {
    titulo: '👑 CAMPEÃO DA TEMPORADA',
    avatarLendario: true,
    moedas: 5000,
    fragmentos: 50,
    tituloPermamente: 'Campeão',
    cor: 'text-yellow-400',
    mensagem: '🏆 PARABÉNS! Você é o CAMPEÃO desta temporada!'
  },

  // TOP 2-3
  2: {
    titulo: '🥈 Vice-Campeão',
    avatarRaro: true,
    moedas: 3000,
    fragmentos: 30,
    tituloPermamente: 'Vice-Campeão',
    cor: 'text-slate-300',
    mensagem: '🥈 Excelente! Você terminou em 2º lugar!'
  },
  3: {
    titulo: '🥉 3º Lugar',
    avatarRaro: true,
    moedas: 3000,
    fragmentos: 30,
    tituloPermamente: '3º Lugar',
    cor: 'text-orange-400',
    mensagem: '🥉 Muito bem! Você terminou em 3º lugar!'
  },

  // TOP 4-10
  'top10': {
    titulo: '⭐ TOP 10',
    moedas: 1500,
    fragmentos: 20,
    tituloPermamente: 'Elite Top 10',
    cor: 'text-cyan-400',
    mensagem: '⭐ Incrível! Você está no TOP 10!'
  },

  // TOP 11-50
  'top50': {
    titulo: '🌟 TOP 50',
    moedas: 800,
    fragmentos: 10,
    cor: 'text-blue-400',
    mensagem: '🌟 Parabéns! Você está no TOP 50!'
  },

  // TOP 51-100
  'top100': {
    titulo: '💫 TOP 100',
    moedas: 400,
    fragmentos: 5,
    cor: 'text-purple-400',
    mensagem: '💫 Muito bem! Você está no TOP 100!'
  }
};

/**
 * Calcula as recompensas de fim de temporada baseado na posição
 */
export function calcularRecompensasTemporada(posicao) {
  if (posicao === 1) {
    return RECOMPENSAS_TEMPORADA[1];
  } else if (posicao === 2) {
    return RECOMPENSAS_TEMPORADA[2];
  } else if (posicao === 3) {
    return RECOMPENSAS_TEMPORADA[3];
  } else if (posicao >= 4 && posicao <= 10) {
    return { ...RECOMPENSAS_TEMPORADA['top10'], posicao };
  } else if (posicao >= 11 && posicao <= 50) {
    return { ...RECOMPENSAS_TEMPORADA['top50'], posicao };
  } else if (posicao >= 51 && posicao <= 100) {
    return { ...RECOMPENSAS_TEMPORADA['top100'], posicao };
  }

  return null; // Sem recompensas se não estiver no top 100
}

/**
 * Marca as recompensas de temporada como recebidas
 */
export function marcarRecompensasRecebidas(userId) {
  const rankingKey = `pvp_ranking_${userId}`;
  const rankingData = JSON.parse(localStorage.getItem(rankingKey) || '{}');

  rankingData.recompensasRecebidas = true;

  localStorage.setItem(rankingKey, JSON.stringify(rankingData));
}

/**
 * Retorna a melhor temporada do jogador (maior fama alcançada)
 */
export function getMelhorTemporada(userId) {
  const historico = getHistoricoTemporadas(userId);

  if (historico.length === 0) {
    return null;
  }

  // Encontrar temporada com maior fama
  const melhor = historico.reduce((prev, current) => {
    return (current.fama > prev.fama) ? current : prev;
  });

  return melhor;
}

/**
 * Calcula estatísticas totais do jogador através de todas as temporadas
 */
export function getEstatisticasTotais(userId) {
  const historico = getHistoricoTemporadas(userId);
  const rankingAtual = JSON.parse(localStorage.getItem(`pvp_ranking_${userId}`) || '{"vitorias": 0, "derrotas": 0}');

  const totais = {
    vitoriasTotal: rankingAtual.vitorias || 0,
    derrotasTotal: rankingAtual.derrotas || 0,
    streakMaximo: rankingAtual.streakMaximo || rankingAtual.streak || 0,
    temporadasJogadas: historico.length,
    melhorPosicao: null,
    melhorFama: rankingAtual.fama || 1000,
    titulos: []
  };

  // Somar dados de temporadas anteriores
  historico.forEach(temp => {
    totais.vitoriasTotal += temp.vitorias || 0;
    totais.derrotasTotal += temp.derrotas || 0;

    if (temp.streakMaximo > totais.streakMaximo) {
      totais.streakMaximo = temp.streakMaximo;
    }

    if (temp.fama > totais.melhorFama) {
      totais.melhorFama = temp.fama;
    }

    if (temp.posicaoLeaderboard) {
      if (!totais.melhorPosicao || temp.posicaoLeaderboard < totais.melhorPosicao) {
        totais.melhorPosicao = temp.posicaoLeaderboard;
      }
    }
  });

  // Calcular taxa de vitória total
  const batalhasTotal = totais.vitoriasTotal + totais.derrotasTotal;
  totais.winRate = batalhasTotal > 0 ? Math.round((totais.vitoriasTotal / batalhasTotal) * 100) : 0;

  return totais;
}
