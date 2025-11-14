// ==================== IA DO ADVERSÁRIO ====================
// Arquivo: /lib/arena/iaEngine.js

import { usarHabilidade, defender, esperar, calcularDano, ataqueBasico } from './batalhaEngine';

/**
 * Comportamentos da IA por dificuldade
 *
 * IA 2.0 - MELHORIAS:
 * - Fácil agora considera HP e energia (não é mais completamente aleatória)
 * - Todas dificuldades consideram buffs/debuffs
 * - Agressividade dinâmica baseada em contexto
 * - Melhor uso de recursos (energia, habilidades)
 */
const COMPORTAMENTOS = {
  facil: {
    nome: 'Recruta',
    agressividade: 0.80, // MAIS AGRESSIVO! (era 0.55)
    usa_defesa: 0.10,    // Defende menos (era 0.25)
    usa_esperar: 0.10,   // Espera menos (era 0.20)
    prioriza_ultimate: false,
    considera_vantagem_elemental: false,
    considera_hp_baixo: true,       // NOVO: Agora considera HP
    hp_baixo_threshold: 0.25,       // NOVO: 25% HP
    considera_buffs: false,
    taxa_erro: 0.20 // 20% chance de fazer jogada sub-ótima
  },

  normal: {
    nome: 'Veterano',
    agressividade: 0.80, // MAIS AGRESSIVO! (era 0.65)
    usa_defesa: 0.12,    // Defende menos (era 0.20)
    usa_esperar: 0.08,   // Espera menos (era 0.15)
    prioriza_ultimate: true,
    considera_vantagem_elemental: true,
    considera_hp_baixo: true,
    hp_baixo_threshold: 0.35, // 35% HP
    considera_buffs: true,    // NOVO: Olha buffs/debuffs
    usa_combo: false,
    taxa_erro: 0.10 // 10% chance de erro
  },

  dificil: {
    nome: 'Elite',
    agressividade: 0.85, // MUITO AGRESSIVO e inteligente (era 0.70)
    usa_defesa: 0.08,    // Defende menos, ataca mais (era 0.18)
    usa_esperar: 0.07,   // Quase nunca espera (era 0.12)
    prioriza_ultimate: true,
    considera_vantagem_elemental: true,
    considera_hp_baixo: true,
    hp_baixo_threshold: 0.30, // Só se preocupa com HP muito baixo (era 0.40)
    considera_buffs: true,
    usa_combo: true,
    foca_remover_buffs: true,
    pune_jogador_baixo_hp: true, // NOVO: Foca em matar quando jogador está fraco
    usa_habilidades_controle: true, // NOVO: Prioriza stuns/debuffs
    taxa_erro: 0.02 // Quase sem erros (era 0.05)
  },

  mestre: {
    nome: 'Lendário',
    agressividade: 0.90, // EXTREMAMENTE AGRESSIVO (era 0.75)
    usa_defesa: 0.05,    // Quase nunca defende (era 0.15)
    usa_esperar: 0.05,   // Quase nunca espera (era 0.10)
    prioriza_ultimate: true,
    considera_vantagem_elemental: true,
    considera_hp_baixo: true,
    hp_baixo_threshold: 0.20, // Só defende se quase morto (era 0.50)
    considera_buffs: true,
    usa_combo: true,
    foca_remover_buffs: true,
    pune_jogador_baixo_hp: true,
    usa_habilidades_controle: true,
    perfeita: true, // Sempre faz a melhor jogada
    antecipa_jogador: true,
    maximiza_dano: true, // NOVO: Sempre busca maximizar dano
    conserva_energia_estrategica: true, // NOVO: Guarda energia para ultimates letais
    taxa_erro: 0.0 // SEM ERROS
  }
};

/**
 * Avalia o valor de uma habilidade
 *
 * IA 2.0 - Sistema de pontuação melhorado:
 * - Considera dano potencial real
 * - Analisa buffs/debuffs que a habilidade aplica
 * - Leva em conta contexto da batalha (HP, energia, turnos)
 * - Prioriza habilidades com melhor custo-benefício
 */
function avaliarHabilidade(habilidade, estado, comportamento) {
  const { inimigo, jogador } = estado;

  // Não pode usar se não tem energia
  if (inimigo.energia_atual < habilidade.custo_energia) {
    return -1;
  }

  let score = 0;

  // === DANO BASE ===
  const danoEstimado = simularDano(habilidade, inimigo, jogador);
  score += danoEstimado * 2; // Dano é muito importante

  // === CUSTO-BENEFÍCIO ===
  const custoEnergia = habilidade.custo_energia || 20;
  const ratio = danoEstimado / custoEnergia;
  score += ratio * 10; // Prioriza eficiência

  // === EFEITOS DE STATUS ===
  if (habilidade.efeitos_status && habilidade.efeitos_status.length > 0) {
    habilidade.efeitos_status.forEach(efeito => {
      // Debuffs ofensivos
      if (efeito.includes('enfraquecido') || efeito.includes('lentidao') ||
          efeito.includes('desorientado') || efeito.includes('stats_reduzidos')) {
        let bonusDebuff = 30;
        // Elite e Lendário valorizam MUITO mais debuffs
        if (comportamento?.usa_habilidades_controle) {
          bonusDebuff = 60; // Dobra o valor para IA inteligente
        }
        score += bonusDebuff;
      }

      // Buffs defensivos/utilitários
      if (efeito.includes('defesa') || efeito.includes('regeneracao') ||
          efeito.includes('bencao') || efeito.includes('evasao')) {
        const hpPercent = inimigo.hp_atual / inimigo.hp_maximo;
        if (hpPercent < 0.5) {
          score += 40; // Muito valioso quando HP baixo
        } else {
          score += 20;
        }
      }

      // Dano contínuo
      if (efeito.includes('queimadura') || efeito.includes('afogamento') ||
          efeito.includes('maldito')) {
        let bonusDoT = 25;
        // Elite e Lendário usam DoT estrategicamente
        if (comportamento?.usa_combo) {
          bonusDoT = 45; // DoT + burst = combo mortal
        }
        score += bonusDoT;
      }

      // Controle (stun, freeze, etc) - EXTREMAMENTE VALIOSO
      if (efeito.includes('atordoado') || efeito.includes('congelado') ||
          efeito.includes('paralisia')) {
        let bonusControle = 50;
        // Elite e Lendário ADORAM controle
        if (comportamento?.usa_habilidades_controle) {
          bonusControle = 100; // Controle é prioritário!
          // Se jogador está com HP baixo, controle + kill combo
          const hpJogadorPercent = jogador.hp_atual / jogador.hp_maximo;
          if (hpJogadorPercent < 0.4) {
            bonusControle = 150; // Setup para o kill!
          }
        }
        score += bonusControle;
      }
    });
  }

  // === TIPO DE HABILIDADE ===
  if (habilidade.tipo === 'Suporte' && habilidade.dano_base < 0) {
    // Habilidade de cura
    const hpPercent = inimigo.hp_atual / inimigo.hp_maximo;
    if (hpPercent < 0.3) {
      score += 80; // Cura é crucial com HP baixo
    } else if (hpPercent < 0.6) {
      score += 40;
    } else {
      score += 10; // Pouco valor com HP alto
    }
  }

  // === ULTIMATE ===
  if (habilidade.raridade === 'Ultimate') {
    if (comportamento && comportamento.prioriza_ultimate) {
      score += 60; // Ultimates são poderosos
    } else {
      score += 20; // Mas custam muita energia
    }
  }

  // === CONTEXTO: HP BAIXO DO INIMIGO ===
  const hpInimigoPercent = inimigo.hp_atual / inimigo.hp_maximo;
  if (hpInimigoPercent < 0.3) {
    // Com HP baixo, prioriza defensive/cura
    if (habilidade.tipo === 'Defensiva' || habilidade.tipo === 'Suporte') {
      score += 30;
    }
  }

  // === CONTEXTO: HP BAIXO DO JOGADOR ===
  const hpJogadorPercent = jogador.hp_atual / jogador.hp_maximo;
  if (hpJogadorPercent < 0.3 && danoEstimado >= jogador.hp_atual) {
    score += 200; // PODE MATAR! Prioridade MÁXIMA
    // Elite e Lendário: FOCO TOTAL em matar
    if (comportamento?.pune_jogador_baixo_hp) {
      score += 300; // MATAR É PRIORIDADE ABSOLUTA!
    }
  } else if (hpJogadorPercent < 0.5) {
    let bonusVulneravel = 20;
    // Elite e Lendário: Pressionam jogador vulnerável
    if (comportamento?.pune_jogador_baixo_hp) {
      bonusVulneravel = 60; // Pressão constante!
    }
    score += bonusVulneravel;
  } else if (hpJogadorPercent < 0.7 && comportamento?.maximiza_dano) {
    // Lendário: Sempre maximiza dano mesmo com HP médio do jogador
    score += 40;
  }

  // === PENALIDADE: ENERGIA INSUFICIENTE PARA PRÓXIMA RODADA ===
  const energiaRestante = inimigo.energia_atual - custoEnergia;
  if (energiaRestante < 20) {
    let penalidade = 15;
    // Lendário: Gestão perfeita de energia
    if (comportamento?.conserva_energia_estrategica) {
      penalidade = 40; // Penalidade maior - energia é crucial
    }
    score -= penalidade;
  }

  // === LENDÁRIO: CONSERVAR ENERGIA PARA ULTIMATE LETAL ===
  if (comportamento?.conserva_energia_estrategica && habilidade.raridade !== 'Ultimate') {
    // Se quase tem energia para ultimate, NÃO gaste em habilidades fracas
    const ultimates = inimigo.habilidades?.filter(h => h.raridade === 'Ultimate') || [];
    if (ultimates.length > 0) {
      const custoUltimate = ultimates[0].custo_energia || 80;
      const energiaDepois = energiaRestante;
      const energiaProximoTurno = energiaDepois + 20; // Ganha 20 por turno

      // Se no próximo turno terá energia para ultimate, ECONOMIZE!
      if (energiaProximoTurno >= custoUltimate && energiaRestante < custoUltimate) {
        // Se jogador está com HP baixo, SAVE PARA ULTIMATE LETAL
        if (hpJogadorPercent < 0.6) {
          score -= 80; // Grande penalidade - ultimate pode matar!
        }
      }
    }
  }

  // === BUFFS/DEBUFFS ATIVOS ===
  if (comportamento && comportamento.considera_buffs) {
    // Se jogador tem muitos buffs, prioriza debuffs
    if (jogador.buffs && jogador.buffs.length > 0) {
      const temDebuff = habilidade.efeitos_status?.some(e =>
        e.includes('enfraquecido') || e.includes('stats_reduzidos')
      );
      if (temDebuff) {
        score += 25; // Neutralizar buffs do jogador
      }
    }

    // Se inimigo tem debuffs, prioriza remover ou defender
    if (inimigo.debuffs && inimigo.debuffs.length > 1) {
      if (habilidade.tipo === 'Defensiva') {
        score += 20; // Defender quando debuffado
      }
    }
  }

  return Math.floor(score);
}

/**
 * Decide ação da IA
 */
export function decidirAcaoIA(estado) {
  const { inimigo, jogador, dificuldade } = estado;
  const comportamento = COMPORTAMENTOS[dificuldade] || COMPORTAMENTOS.normal;
  
  // Calcular HP percentual
  const hpPercent = inimigo.hp_atual / inimigo.hp_maximo;
  const hpJogadorPercent = jogador.hp_atual / jogador.hp_maximo;
  
  // === MODO MESTRE: IA Perfeita ===
  if (comportamento.perfeita) {
    return decidirAcaoPerfeita(estado);
  }
  
  // === HP BAIXO: Prioriza sobrevivência ===
  if (comportamento.considera_hp_baixo && hpPercent < comportamento.hp_baixo_threshold) {
    // Recruta e Veterano: só 25% chance de defender (era 50%)
    // Elite e Mestre: 40% chance de defender
    const chanceDefender = dificuldade === 'facil' || dificuldade === 'normal' ? 0.25 : 0.40;

    if (Math.random() < chanceDefender) {
      return { tipo: 'defender' };
    }

    // Recruta e Veterano: só 15% chance de esperar (era 30%)
    // Elite e Mestre: 25% chance de esperar
    const chanceEsperar = dificuldade === 'facil' || dificuldade === 'normal' ? 0.15 : 0.25;

    if (inimigo.energia_atual < 40 && Math.random() < chanceEsperar) {
      return { tipo: 'esperar' };
    }
  }

  // === ENERGIA BAIXA: Esperar ou defender ===
  if (inimigo.energia_atual < 30) {
    // Recruta e Veterano: só 35% chance de esperar (era 60%)
    // Elite e Mestre: 50% chance de esperar
    const chanceEsperar = dificuldade === 'facil' || dificuldade === 'normal' ? 0.35 : 0.50;

    if (Math.random() < chanceEsperar) {
      return { tipo: 'esperar' };
    } else {
      return { tipo: 'defender' };
    }
  }
  
  // === DECISÃO NORMAL ===
  const rand = Math.random();
  
  // Defender?
  if (rand < comportamento.usa_defesa) {
    return { tipo: 'defender' };
  }
  
  // Esperar?
  if (rand < comportamento.usa_defesa + comportamento.usa_esperar) {
    return { tipo: 'esperar' };
  }
  
  // Atacar - escolher melhor habilidade
  const habilidades = inimigo.habilidades;
  const scoresHabilidades = [];

  habilidades.forEach((hab, index) => {
    const score = avaliarHabilidade(hab, estado, comportamento);
    if (score >= 0) {
      scoresHabilidades.push({ index, score, habilidade: hab });
    }
  });

  // Ordenar por score (melhor primeiro)
  scoresHabilidades.sort((a, b) => b.score - a.score);

  // Se nenhuma habilidade disponível, usar ataque básico
  if (scoresHabilidades.length === 0) {
    return { tipo: 'ataque_basico' };
  }

  // === TAXA DE ERRO: IA pode escolher habilidade sub-ótima ===
  let habilidadeEscolhida = scoresHabilidades[0];

  if (comportamento.taxa_erro && comportamento.taxa_erro > 0) {
    if (Math.random() < comportamento.taxa_erro) {
      // Erro! Escolhe segunda ou terceira melhor opção
      const indiceErro = Math.min(
        Math.floor(Math.random() * 3) + 1,
        scoresHabilidades.length - 1
      );
      habilidadeEscolhida = scoresHabilidades[indiceErro] || scoresHabilidades[0];
    }
  }

  return {
    tipo: 'habilidade',
    habilidadeIndex: habilidadeEscolhida.index
  };
}

/**
 * IA Perfeita (Modo Lendário)
 * Faz cálculos avançados para escolher a melhor jogada
 * EXTREMAMENTE INTELIGENTE E PUNITIVA
 */
function decidirAcaoPerfeita(estado) {
  const { inimigo, jogador, dificuldade } = estado;
  const comportamento = COMPORTAMENTOS[dificuldade] || COMPORTAMENTOS.mestre;

  const hpPercent = inimigo.hp_atual / inimigo.hp_maximo;
  const hpJogadorPercent = jogador.hp_atual / jogador.hp_maximo;

  // === PRIORIDADE 1: KILL GARANTIDO ===
  // Verifica se QUALQUER habilidade pode matar o jogador
  let melhorKill = null;
  let menorCustoKill = 999;

  for (let i = 0; i < inimigo.habilidades.length; i++) {
    const hab = inimigo.habilidades[i];

    if (inimigo.energia_atual < hab.custo_energia) continue;

    const danoSimulado = simularDano(hab, inimigo, jogador);

    // Se pode matar, escolhe a habilidade com menor custo de energia
    if (danoSimulado >= jogador.hp_atual) {
      if (hab.custo_energia < menorCustoKill) {
        menorCustoKill = hab.custo_energia;
        melhorKill = i;
      }
    }
  }

  // Se pode matar, MATA COM A HABILIDADE MAIS EFICIENTE!
  if (melhorKill !== null) {
    return {
      tipo: 'habilidade',
      habilidadeIndex: melhorKill
    };
  }

  // === PRIORIDADE 2: SETUP PARA KILL NO PRÓXIMO TURNO ===
  // Se jogador está com HP médio/baixo, usa controle + setup
  if (hpJogadorPercent < 0.5) {
    // Procura habilidade de controle (stun, freeze, etc)
    for (let i = 0; i < inimigo.habilidades.length; i++) {
      const hab = inimigo.habilidades[i];

      if (inimigo.energia_atual < hab.custo_energia) continue;

      // Verifica se tem efeito de controle
      const temControle = hab.efeitos_status?.some(e =>
        e.includes('atordoado') || e.includes('congelado') ||
        e.includes('paralisia') || e.includes('stats_reduzidos')
      );

      if (temControle) {
        // Simula se no próximo turno pode matar
        const danoSetup = simularDano(hab, inimigo, jogador);
        const energiaProximoTurno = (inimigo.energia_atual - hab.custo_energia) + 20;

        // Procura ultimate ou habilidade forte
        const habilidadesFortes = inimigo.habilidades
          .filter(h => h.custo_energia <= energiaProximoTurno)
          .map(h => simularDano(h, inimigo, jogador));

        const maxDanoProximoTurno = Math.max(...habilidadesFortes, 0);

        // Se controle + próximo ataque pode matar, USA!
        if (danoSetup + maxDanoProximoTurno >= jogador.hp_atual) {
          return {
            tipo: 'habilidade',
            habilidadeIndex: i
          };
        }
      }
    }
  }

  // === PRIORIDADE 3: HP CRÍTICO DO INIMIGO ===
  // Só se defende se REALMENTE em perigo mortal
  if (hpPercent < 0.20) {
    // Se jogador também está crítico, ALL-IN!
    if (hpJogadorPercent < 0.25) {
      return escolherMelhorAtaque(estado);
    }

    // Senão, defende apenas se sem energia para ataque
    if (inimigo.energia_atual < 30) {
      return { tipo: 'esperar' };
    }

    // Tenta defender
    return { tipo: 'defender' };
  }

  // === PRIORIDADE 4: ULTIMATE ESTRATÉGICO ===
  // Usa ultimate se:
  // - Tem energia suficiente
  // - Jogador está com HP médio/baixo (< 70%)
  // - Ou pode causar dano massivo
  const ultimate = inimigo.habilidades.find(h => h.raridade === 'Ultimate');
  if (ultimate && inimigo.energia_atual >= ultimate.custo_energia) {
    const danoUltimate = simularDano(ultimate, inimigo, jogador);

    // Se ultimate tira > 40% do HP do jogador, USA!
    if (danoUltimate >= jogador.hp_maximo * 0.4 || hpJogadorPercent < 0.7) {
      const index = inimigo.habilidades.indexOf(ultimate);
      return {
        tipo: 'habilidade',
        habilidadeIndex: index
      };
    }
  }

  // === PRIORIDADE 5: CONSERVAR ENERGIA PARA ULTIMATE LETAL ===
  // Se quase tem energia para ultimate E jogador está vulnerável, ESPERA
  if (ultimate && comportamento.conserva_energia_estrategica) {
    const custoUltimate = ultimate.custo_energia || 80;
    const energiaProximoTurno = inimigo.energia_atual + 20;

    if (energiaProximoTurno >= custoUltimate &&
        inimigo.energia_atual < custoUltimate &&
        hpJogadorPercent < 0.65) {
      // ESPERA para usar ultimate no próximo turno!
      return { tipo: 'esperar' };
    }
  }

  // === PRIORIDADE 6: PRESSÃO CONSTANTE - MELHOR ATAQUE ===
  return escolherMelhorAtaque(estado);
}

/**
 * Escolhe o ataque com melhor custo-benefício
 */
function escolherMelhorAtaque(estado) {
  const { inimigo, jogador } = estado;
  
  let melhorIndex = 0;
  let melhorRatio = 0;
  
  inimigo.habilidades.forEach((hab, index) => {
    if (inimigo.energia_atual < hab.custo_energia) return;
    
    const dano = simularDano(hab, inimigo, jogador);
    const ratio = dano / hab.custo_energia; // Dano por energia
    
    if (ratio > melhorRatio) {
      melhorRatio = ratio;
      melhorIndex = index;
    }
  });
  
  // Se nenhum ataque disponível
  if (melhorRatio === 0) {
    if (inimigo.energia_atual < 40) {
      return { tipo: 'esperar' };
    }
    return { tipo: 'defender' };
  }
  
  return {
    tipo: 'habilidade',
    habilidadeIndex: melhorIndex
  };
}

/**
 * Simula dano de uma habilidade (versão simplificada para IA)
 * Reutiliza calcularDano do batalhaEngine sem aplicar crítico
 *
 * @param {Object} habilidade - Habilidade a simular
 * @param {Object} atacante - Avatar atacante
 * @param {Object} defensor - Avatar defensor
 * @returns {number} Dano estimado (sem crítico)
 */
function simularDano(habilidade, atacante, defensor) {
  // Reutiliza função completa de cálculo de dano
  // mas sempre sem crítico (false) para estimativa conservadora
  return calcularDano(atacante, habilidade, defensor, false);
}

/**
 * Processa turno da IA
 */
export function processarTurnoIA(estado) {
  // Decidir ação
  const acao = decidirAcaoIA(estado);

  let resultado;

  switch (acao.tipo) {
    case 'ataque_basico':
      resultado = ataqueBasico(estado.inimigo, estado.jogador, estado);

      // Atualizar estado
      if (resultado.sucesso) {
        estado.jogador.hp_atual = resultado.novoHP;
        estado.inimigo.energia_atual = resultado.novaEnergia;
      }
      break;

    case 'habilidade':
      const habilidade = estado.inimigo.habilidades[acao.habilidadeIndex];
      resultado = usarHabilidade(estado.inimigo, habilidade, estado.jogador, estado);

      // Atualizar estado
      if (resultado.sucesso) {
        estado.jogador.hp_atual = resultado.novoHP;
        estado.inimigo.energia_atual = resultado.novaEnergia;

        // Atualizar HP do atacante se houver cura
        if (resultado.novoHPAtacante !== undefined && resultado.novoHPAtacante !== estado.inimigo.hp_atual) {
          estado.inimigo.hp_atual = resultado.novoHPAtacante;
        }
      } else {
        // Mesmo se falhou, pode ter gastado energia
        if (resultado.energiaGasta > 0) {
          estado.inimigo.energia_atual = resultado.novaEnergia;
        }
      }
      break;

    case 'defender':
      resultado = defender(estado.inimigo, estado);
      estado.inimigo.energia_atual = resultado.novaEnergia;
      if (!estado.inimigo.buffs) estado.inimigo.buffs = [];
      estado.inimigo.buffs.push(...(resultado.buffs || []));
      break;

    case 'esperar':
      resultado = esperar(estado.inimigo, estado);
      estado.inimigo.energia_atual = resultado.novaEnergia;
      break;

    default:
      resultado = { sucesso: false, mensagem: 'Ação inválida da IA!' };
  }

  // Adicionar ao histórico
  estado.historico.push({
    rodada: estado.rodada,
    turno: 'inimigo',
    acao: acao.tipo,
    resultado,
    timestamp: new Date().toISOString()
  });

  return resultado;
}

/**
 * Mensagens de flavor para a IA
 */
export function getMensagemIA(acao, estado) {
  const mensagens = {
    habilidade: [
      "O adversário prepara seu ataque!",
      "Uma energia poderosa se concentra!",
      "Seu oponente lança sua técnica!",
    ],
    defender: [
      "O adversário assume posição defensiva!",
      "Uma barreira se forma!",
      "Seu oponente se prepara para o contra-ataque!",
    ],
    esperar: [
      "O adversário está concentrando energia!",
      "Seu oponente aguarda o momento certo!",
      "Uma aura misteriosa envolve o inimigo...",
    ]
  };
  
  const lista = mensagens[acao.tipo] || ["O adversário age!"];
  return lista[Math.floor(Math.random() * lista.length)];
}

export default {
  decidirAcaoIA,
  processarTurnoIA,
  getMensagemIA,
};
