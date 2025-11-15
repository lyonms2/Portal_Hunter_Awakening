/**
 * Motor de IA para batalhas PVP
 * Simula comportamento humano realista
 */

/**
 * Personalidades de IA com diferentes estratégias
 */
const PERSONALIDADES = {
  AGRESSIVO: {
    nome: 'Agressivo',
    prioridades: {
      ataque: 0.7,
      habilidade: 0.2,
      defesa: 0.05,
      cura: 0.05
    },
    limiar_hp_critico: 20, // Só defende/cura se HP < 20%
    usa_habilidade_sempre_que_possivel: true
  },
  DEFENSIVO: {
    nome: 'Defensivo',
    prioridades: {
      ataque: 0.3,
      habilidade: 0.2,
      defesa: 0.3,
      cura: 0.2
    },
    limiar_hp_critico: 60, // Começa a defender cedo
    economiza_energia: true
  },
  TATICO: {
    nome: 'Tático',
    prioridades: {
      ataque: 0.4,
      habilidade: 0.4,
      defesa: 0.15,
      cura: 0.05
    },
    limiar_hp_critico: 40,
    analisa_fraquezas: true,
    usa_contra_elemento: true
  },
  EQUILIBRADO: {
    nome: 'Equilibrado',
    prioridades: {
      ataque: 0.45,
      habilidade: 0.25,
      defesa: 0.2,
      cura: 0.1
    },
    limiar_hp_critico: 35,
    varia_estrategia: true
  },
  IMPREVISIVEL: {
    nome: 'Imprevisível',
    prioridades: {
      ataque: 0.35,
      habilidade: 0.35,
      defesa: 0.15,
      cura: 0.15
    },
    limiar_hp_critico: 30,
    randomiza_tudo: true
  }
};

/**
 * Tabela de vantagem de elementos
 */
const VANTAGEM_ELEMENTO = {
  'Fogo': { forte_contra: 'Vento', fraco_contra: 'Água' },
  'Água': { forte_contra: 'Fogo', fraco_contra: 'Terra' },
  'Terra': { forte_contra: 'Água', fraco_contra: 'Vento' },
  'Vento': { forte_contra: 'Terra', fraco_contra: 'Fogo' },
  'Luz': { forte_contra: 'Trevas', fraco_contra: 'Trevas' },
  'Trevas': { forte_contra: 'Luz', fraco_contra: 'Luz' }
};

/**
 * Escolhe personalidade aleatória para a IA
 */
export function escolherPersonalidade() {
  const tipos = Object.keys(PERSONALIDADES);
  const tipo = tipos[Math.floor(Math.random() * tipos.length)];
  return { tipo, config: PERSONALIDADES[tipo] };
}

/**
 * Calcula HP percentual
 */
function calcularHpPercent(hpAtual, hpMaximo) {
  return (hpAtual / hpMaximo) * 100;
}

/**
 * Verifica se tem vantagem de elemento
 */
function temVantagemElemento(meuElemento, elementoInimigo) {
  const vantagem = VANTAGEM_ELEMENTO[meuElemento];
  if (!vantagem) return false;
  return vantagem.forte_contra === elementoInimigo;
}

/**
 * Verifica se está em desvantagem de elemento
 */
function temDesvantagemElemento(meuElemento, elementoInimigo) {
  const vantagem = VANTAGEM_ELEMENTO[meuElemento];
  if (!vantagem) return false;
  return vantagem.fraco_contra === elementoInimigo;
}

/**
 * Filtra habilidades disponíveis (energia suficiente, cooldown pronto)
 */
function filtrarHabilidadesDisponiveis(habilidades, energiaAtual, cooldowns = {}) {
  return habilidades.filter(hab => {
    const custoEnergia = hab.custo_energia || 0;
    const cooldownAtivo = cooldowns[hab.nome] || 0;
    return energiaAtual >= custoEnergia && cooldownAtivo === 0;
  });
}

/**
 * Escolhe melhor habilidade baseado na situação
 */
function escolherMelhorHabilidade(habilidades, situacao, personalidade) {
  const { hpPercent, elementoInimigo, energiaAtual } = situacao;

  let melhorHabilidade = null;
  let melhorPontuacao = -1;

  habilidades.forEach(hab => {
    let pontuacao = 0;

    // Priorizar cura se HP baixo
    if (hab.tipo === 'Cura' && hpPercent < personalidade.limiar_hp_critico) {
      pontuacao += 100;
    }

    // Priorizar ofensiva se HP alto
    if (hab.tipo === 'Ofensiva' && hpPercent > 60) {
      pontuacao += 50;
    }

    // Bonus por contra-elemento
    if (personalidade.analisa_fraquezas && hab.elemento) {
      if (temVantagemElemento(hab.elemento, elementoInimigo)) {
        pontuacao += 30;
      }
    }

    // Bonus por dano alto
    if (hab.dano_base) {
      pontuacao += hab.dano_base / 10;
    }

    // Penalidade por custo alto de energia (se economiza)
    if (personalidade.economiza_energia) {
      const custoRelativo = (hab.custo_energia || 0) / energiaAtual;
      if (custoRelativo > 0.5) {
        pontuacao -= 20;
      }
    }

    // Adicionar aleatoriedade
    if (personalidade.randomiza_tudo) {
      pontuacao += Math.random() * 50 - 25;
    } else {
      pontuacao += Math.random() * 10 - 5;
    }

    if (pontuacao > melhorPontuacao) {
      melhorPontuacao = pontuacao;
      melhorHabilidade = hab;
    }
  });

  return melhorHabilidade;
}

/**
 * Decide próxima ação da IA
 *
 * @param {Object} estadoBatalha - Estado atual da batalha
 * @param {Object} avatarIA - Avatar da IA
 * @param {Object} avatarOponente - Avatar do oponente
 * @param {Object} personalidade - Personalidade da IA
 * @param {Object} cooldowns - Cooldowns ativos
 * @returns {Object} Ação decidida { tipo, habilidade?, razao }
 */
export function decidirProximaAcao(estadoBatalha, avatarIA, avatarOponente, personalidade, cooldowns = {}) {
  const { hpAtual, hpMaximo, energia } = estadoBatalha.ia;
  const hpPercent = calcularHpPercent(hpAtual, hpMaximo);

  const situacao = {
    hpPercent,
    hpOponentePercent: calcularHpPercent(estadoBatalha.jogador.hpAtual, estadoBatalha.jogador.hpMaximo),
    energiaAtual: energia,
    elementoIA: avatarIA.elemento,
    elementoInimigo: avatarOponente.elemento,
    turno: estadoBatalha.turnoAtual
  };

  // 1. SITUAÇÃO CRÍTICA - HP muito baixo
  if (hpPercent < personalidade.limiar_hp_critico) {
    // Tentar habilidade de cura
    const habilidadesCura = avatarIA.habilidades.filter(h =>
      h.tipo === 'Cura' || h.efeitos_status?.some(e => e.tipo === 'cura')
    );
    const curasDisponiveis = filtrarHabilidadesDisponiveis(habilidadesCura, energia, cooldowns);

    if (curasDisponiveis.length > 0) {
      return {
        tipo: 'habilidade',
        habilidade: curasDisponiveis[0],
        razao: 'HP crítico - usando cura'
      };
    }

    // Se não tem cura, defender
    if (Math.random() < 0.7) {
      return {
        tipo: 'defender',
        razao: 'HP crítico - defendendo'
      };
    }
  }

  // 2. OPONENTE QUASE MORTO - Tentar finalizar
  if (situacao.hpOponentePercent < 25 && hpPercent > 30) {
    const habilidadesOfensivas = avatarIA.habilidades.filter(h =>
      h.tipo === 'Ofensiva' && h.dano_base > 0
    );
    const ofensivasDisponiveis = filtrarHabilidadesDisponiveis(habilidadesOfensivas, energia, cooldowns);

    if (ofensivasDisponiveis.length > 0) {
      // Escolher a mais forte
      const maisForte = ofensivasDisponiveis.reduce((prev, current) =>
        (current.dano_base > prev.dano_base) ? current : prev
      );
      return {
        tipo: 'habilidade',
        habilidade: maisForte,
        razao: 'Oponente quase morto - finalizando'
      };
    }

    return {
      tipo: 'ataque',
      razao: 'Oponente quase morto - atacando'
    };
  }

  // 3. DECISÃO BASEADA EM PERSONALIDADE
  const habilidadesDisponiveis = filtrarHabilidadesDisponiveis(avatarIA.habilidades, energia, cooldowns);

  // Ajustar prioridades baseado na situação
  let prioridades = { ...personalidade.prioridades };

  // Se energia baixa, reduzir uso de habilidades
  if (energia < 30) {
    prioridades.habilidade *= 0.3;
    prioridades.ataque *= 1.5;
  }

  // Se imprevisível, randomizar prioridades
  if (personalidade.randomiza_tudo && Math.random() < 0.3) {
    const acoes = ['ataque', 'habilidade', 'defesa'];
    const acaoAleatoria = acoes[Math.floor(Math.random() * acoes.length)];

    if (acaoAleatoria === 'habilidade' && habilidadesDisponiveis.length > 0) {
      const habAleatoria = habilidadesDisponiveis[Math.floor(Math.random() * habilidadesDisponiveis.length)];
      return {
        tipo: 'habilidade',
        habilidade: habAleatoria,
        razao: 'Ação imprevisível'
      };
    }

    return {
      tipo: acaoAleatoria === 'defesa' ? 'defender' : 'ataque',
      razao: 'Ação imprevisível'
    };
  }

  // Escolher ação baseado em pesos
  const rand = Math.random();
  let acumulado = 0;

  if (rand < (acumulado += prioridades.ataque)) {
    return {
      tipo: 'ataque',
      razao: 'Estratégia: ataque básico'
    };
  }

  if (rand < (acumulado += prioridades.habilidade)) {
    if (habilidadesDisponiveis.length > 0) {
      const habilidade = escolherMelhorHabilidade(habilidadesDisponiveis, situacao, personalidade);
      return {
        tipo: 'habilidade',
        habilidade,
        razao: 'Estratégia: usando habilidade'
      };
    }
    // Fallback para ataque se não tem habilidade
    return {
      tipo: 'ataque',
      razao: 'Sem habilidades disponíveis - atacando'
    };
  }

  if (rand < (acumulado += prioridades.defesa)) {
    return {
      tipo: 'defender',
      razao: 'Estratégia: defesa'
    };
  }

  // Fallback
  return {
    tipo: 'ataque',
    razao: 'Ação padrão'
  };
}

/**
 * Simula "tempo de pensamento" humano (delay aleatório)
 */
export function calcularTempoDecisao(personalidade) {
  const base = 1000; // 1 segundo base
  const variacao = Math.random() * 1000; // 0-1 segundo extra

  if (personalidade.randomiza_tudo) {
    return base + variacao * 2; // Imprevisível demora mais
  }

  return base + variacao;
}

/**
 * Decide se IA deve fugir
 */
export function deveIAFugir(estadoBatalha, personalidade) {
  const { hpAtual, hpMaximo } = estadoBatalha.ia;
  const hpPercent = calcularHpPercent(hpAtual, hpMaximo);

  // Só considera fugir se HP muito baixo
  if (hpPercent > 15) return false;

  // Personalidades diferentes têm diferentes chances de fugir
  if (personalidade.tipo === 'AGRESSIVO') {
    return Math.random() < 0.1; // 10% chance (nunca desiste)
  }

  if (personalidade.tipo === 'DEFENSIVO') {
    return Math.random() < 0.6; // 60% chance (foge fácil)
  }

  // Outros: 30% chance
  return Math.random() < 0.3;
}

/**
 * Decide se IA deve se render
 */
export function deveIARender(estadoBatalha, personalidade) {
  const { hpAtual, hpMaximo } = estadoBatalha.ia;
  const hpPercent = calcularHpPercent(hpAtual, hpMaximo);

  // Só considera render se HP baixíssimo
  if (hpPercent > 10) return false;

  // IA prefere render a fugir (mais seguro)
  if (personalidade.tipo === 'DEFENSIVO') {
    return Math.random() < 0.8; // 80% chance
  }

  if (personalidade.tipo === 'AGRESSIVO') {
    return Math.random() < 0.05; // 5% chance (quase nunca)
  }

  return Math.random() < 0.5; // 50% chance
}
