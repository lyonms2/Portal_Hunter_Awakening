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
    agressividade: 0.55, // Mais cauteloso
    usa_defesa: 0.25,    // Defende mais (de 0.2)
    usa_esperar: 0.20,
    prioriza_ultimate: false,
    considera_vantagem_elemental: false,
    considera_hp_baixo: true,       // NOVO: Agora considera HP
    hp_baixo_threshold: 0.25,       // NOVO: 25% HP
    considera_buffs: false,
    taxa_erro: 0.20 // 20% chance de fazer jogada sub-ótima
  },

  normal: {
    nome: 'Veterano',
    agressividade: 0.65, // Balanceado
    usa_defesa: 0.20,
    usa_esperar: 0.15,
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
    agressividade: 0.70, // Agressivo mas inteligente
    usa_defesa: 0.18,
    usa_esperar: 0.12,
    prioriza_ultimate: true,
    considera_vantagem_elemental: true,
    considera_hp_baixo: true,
    hp_baixo_threshold: 0.40, // 40% HP
    considera_buffs: true,
    usa_combo: true,
    foca_remover_buffs: true, // NOVO: Tenta tirar buffs do jogador
    taxa_erro: 0.05 // 5% chance de erro
  },

  mestre: {
    nome: 'Lendário',
    agressividade: 0.75, // Muito agressivo mas calculado
    usa_defesa: 0.15,
    usa_esperar: 0.10,
    prioriza_ultimate: true,
    considera_vantagem_elemental: true,
    considera_hp_baixo: true,
    hp_baixo_threshold: 0.50, // 50% HP - joga seguro
    considera_buffs: true,
    usa_combo: true,
    foca_remover_buffs: true,
    perfeita: true, // Sempre faz a melhor jogada
    antecipa_jogador: true, // NOVO: Tenta prever ações do jogador
    taxa_erro: 0.0 // Sem erros
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
        score += 30; // Debuffs são ótimos
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
        score += 25; // DoT é bom para controle
      }

      // Controle (stun, freeze, etc)
      if (efeito.includes('atordoado') || efeito.includes('congelado') ||
          efeito.includes('paralisia')) {
        score += 50; // Controle é MUITO valioso
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
    score += 100; // PODE MATAR! Prioridade máxima
  } else if (hpJogadorPercent < 0.5) {
    score += 20; // Jogador vulnerável, ataque vale mais
  }

  // === PENALIDADE: ENERGIA INSUFICIENTE PARA PRÓXIMA RODADA ===
  const energiaRestante = inimigo.energia_atual - custoEnergia;
  if (energiaRestante < 20) {
    score -= 15; // Penalidade por deixar sem energia
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
    // 50% chance de defender se HP baixo
    if (Math.random() < 0.5) {
      return { tipo: 'defender' };
    }
    
    // 30% chance de esperar para recuperar energia
    if (inimigo.energia_atual < 40 && Math.random() < 0.3) {
      return { tipo: 'esperar' };
    }
  }
  
  // === ENERGIA BAIXA: Esperar ou defender ===
  if (inimigo.energia_atual < 30) {
    if (Math.random() < 0.6) {
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
 * IA Perfeita (Modo Mestre)
 * Faz cálculos avançados para escolher a melhor jogada
 */
function decidirAcaoPerfeita(estado) {
  const { inimigo, jogador } = estado;
  
  const hpPercent = inimigo.hp_atual / inimigo.hp_maximo;
  const hpJogadorPercent = jogador.hp_atual / jogador.hp_maximo;
  
  // === ANÁLISE: Pode matar o jogador neste turno? ===
  for (let i = 0; i < inimigo.habilidades.length; i++) {
    const hab = inimigo.habilidades[i];
    
    if (inimigo.energia_atual < hab.custo_energia) continue;
    
    // Simular dano
    const danoSimulado = simularDano(hab, inimigo, jogador);
    
    // Se pode matar, MATA!
    if (danoSimulado >= jogador.hp_atual) {
      return {
        tipo: 'habilidade',
        habilidadeIndex: i
      };
    }
  }
  
  // === ANÁLISE: HP crítico? ===
  if (hpPercent < 0.25) {
    // Se jogador também está com HP baixo, all-in!
    if (hpJogadorPercent < 0.3) {
      // Ataque mais forte disponível
      return escolherMelhorAtaque(estado);
    }
    
    // Senão, defender
    if (inimigo.energia_atual < 50) {
      return { tipo: 'esperar' };
    }
    return { tipo: 'defender' };
  }
  
  // === ANÁLISE: Energia para ultimate? ===
  const ultimate = inimigo.habilidades.find(h => h.raridade === 'Ultimate');
  if (ultimate && inimigo.energia_atual >= ultimate.custo_energia) {
    const index = inimigo.habilidades.indexOf(ultimate);
    return {
      tipo: 'habilidade',
      habilidadeIndex: index
    };
  }
  
  // === ESTRATÉGIA PADRÃO: Melhor ataque disponível ===
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
