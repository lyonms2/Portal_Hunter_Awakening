// ==================== MOTOR DE BATALHA ====================
// Arquivo: /lib/arena/batalhaEngine.js

import { calcularVantagemElemental } from '../../app/avatares/sistemas/elementalSystem';
import { calcularDanoHabilidade } from '../../app/avatares/sistemas/abilitiesSystem';
import { calcularHPMaximoCompleto } from '../combat/statsCalculator';
import { getNivelExaustao, aplicarPenalidadesExaustao } from '../../app/avatares/sistemas/exhaustionSystem';
import { aplicarBonusVinculo, getNivelVinculo } from '../../app/avatares/sistemas/bondSystem';

/**
 * Configurações da batalha
 */
export const CONFIG_BATALHA = {
  ENERGIA_INICIAL: 100,
  ENERGIA_MAXIMA: 100,
  ENERGIA_POR_TURNO: 20,
  RODADAS_MAXIMAS: 20,
  CHANCE_CRITICO_BASE: 0.05, // 5%
  MULTIPLICADOR_CRITICO: 2.0,
  TEMPO_TURNO: 30000, // 30 segundos
};

/**
 * Calcula HP máximo do avatar
 * @deprecated Use calcularHPMaximoCompleto de statsCalculator.js
 */
export function calcularHPMaximo(avatar) {
  return calcularHPMaximoCompleto(avatar);
}

/**
 * Calcula dano de uma habilidade
 */
export function calcularDano(atacante, habilidade, defensor, critico = false) {
  // Dano base da habilidade
  let dano = habilidade.dano_base || 30;
  
  // Aplica multiplicador do stat primário
  const statValue = atacante[habilidade.stat_primario] || atacante.forca;
  dano += statValue * (habilidade.multiplicador_stat || 1.0);
  
  // Bônus de nível
  dano += atacante.nivel * 2;
  
  // Vantagem elemental
  const vantagemElemental = calcularVantagemElemental(atacante.elemento, defensor.elemento);
  dano *= vantagemElemental;
  
  // Crítico
  if (critico) {
    dano *= CONFIG_BATALHA.MULTIPLICADOR_CRITICO;
  }
  
  // Defesa do oponente (reduz até 50% do dano)
  let reducao = Math.min(defensor.resistencia * 0.5, dano * 0.5);

  // Verificar se defensor tem buff de defesa
  if (defensor.buffs && defensor.buffs.length > 0) {
    const buffDefesa = defensor.buffs.find(b => b.tipo === 'defesa');
    if (buffDefesa) {
      reducao *= (1 + buffDefesa.valor / 100); // Aumenta a redução
    }
  }

  dano -= reducao;
  
  // Bônus de vínculo (se avatar do jogador)
  if (atacante.vinculo >= 80) {
    dano *= 1.2; // +20% com vínculo alto
  } else if (atacante.vinculo >= 60) {
    dano *= 1.1; // +10%
  }
  
  // Penalidade de exaustão
  if (atacante.exaustao >= 80) {
    dano *= 0.5; // -50% se exausto
  } else if (atacante.exaustao >= 60) {
    dano *= 0.75; // -25%
  }
  
  return Math.max(1, Math.floor(dano));
}

/**
 * Calcula chance de crítico COMPLETA para combate
 * IMPORTANTE: Esta é a versão completa usada em batalhas.
 * Considera foco, vínculo, exaustão e outros modificadores de combate.
 * Para stats base (exibição), use calcularChanceCritico() de statsSystem.js
 *
 * @param {Object} avatar - Avatar completo com stats e estados
 * @returns {number} Chance de crítico (0-0.5, ou 0-50%)
 *
 * Fórmula:
 * - Base: 5% (CONFIG_BATALHA.CHANCE_CRITICO_BASE)
 * - +0.3% por ponto de foco
 * - +10% se vínculo >= 80 (Alma Gêmea)
 * - ×0.5 (50% de redução) se exaustão >= 60
 * - Cap máximo: 50%
 *
 * @see {@link ../../app/avatares/sistemas/statsSystem.js#calcularChanceCritico} Para versão base/simplificada
 */
export function calcularChanceCritico(avatar) {
  let chance = CONFIG_BATALHA.CHANCE_CRITICO_BASE;

  // Foco aumenta crítico
  chance += avatar.foco * 0.003; // +0.3% por ponto de foco

  // Vínculo alto aumenta
  if (avatar.vinculo >= 80) {
    chance += 0.10; // +10%
  }

  // Exaustão reduz
  if (avatar.exaustao >= 60) {
    chance *= 0.5;
  }

  return Math.min(chance, 0.5); // Cap de 50%
}

/**
 * Verifica se o ataque foi crítico
 */
export function isCritico(avatar) {
  const chance = calcularChanceCritico(avatar);
  return Math.random() < chance;
}

/**
 * Aplica efeitos de status de uma habilidade
 * @param {Object} habilidade - Habilidade usada
 * @param {Object} alvo - Alvo que receberá os efeitos
 * @param {Object} atacante - Quem usou a habilidade (para efeitos em self)
 * @returns {Array} Lista de efeitos aplicados
 */
export function aplicarEfeitosStatus(habilidade, alvo, atacante) {
  const efeitosAplicados = [];

  console.log('🎯 aplicarEfeitosStatus chamada:', {
    habilidade: habilidade.nome,
    efeitos_status: habilidade.efeitos_status,
    alvo_nome: alvo.nome,
    atacante_nome: atacante.nome
  });

  if (!habilidade.efeitos_status || habilidade.efeitos_status.length === 0) {
    console.log('⚠️ Habilidade não tem efeitos_status!');
    return efeitosAplicados;
  }

  // Importar efeitos de status do sistema de habilidades
  const EFEITOS_STATUS = {
    // Dano contínuo
    queimadura: { nome: 'Queimadura', tipo: 'dano_continuo', dano_por_turno: 0.05, icone: '🔥' },
    queimadura_intensa: { nome: 'Queimadura Intensa', tipo: 'dano_continuo', dano_por_turno: 0.10, icone: '🔥🔥' },
    afogamento: { nome: 'Afogamento', tipo: 'dano_continuo', dano_por_turno: 0.08, icone: '💧' },
    maldito: { nome: 'Maldito', tipo: 'dano_continuo', dano_por_turno: 0.07, impede_cura: true, icone: '💀' },
    vendaval_cortante: { nome: 'Vendaval Cortante', tipo: 'dano_continuo', dano_por_turno: 0.06, icone: '🌪️' },
    fissuras_explosivas: { nome: 'Fissuras Explosivas', tipo: 'dano_continuo', dano_por_turno: 0.06, icone: '💥' },

    // Cura contínua
    regeneracao: { nome: 'Regeneração', tipo: 'cura_continua', cura_por_turno: 0.05, icone: '💚' },
    auto_cura: { nome: 'Auto-Cura', tipo: 'cura_continua', cura_por_turno: 0.08, icone: '💚✨' },
    cura_massiva_aliados: { nome: 'Cura Massiva', tipo: 'cura_continua', cura_por_turno: 0.10, icone: '💚💫' },

    // Buffs
    defesa_aumentada: { nome: 'Defesa Aumentada', tipo: 'buff', bonus_resistencia: 0.50, icone: '🛡️' },
    evasao_aumentada: { nome: 'Evasão Aumentada', tipo: 'buff', bonus_evasao: 0.30, icone: '💨' },
    velocidade_aumentada: { nome: 'Velocidade Aumentada', tipo: 'buff', bonus_agilidade: 0.40, icone: '⚡' },
    bencao: { nome: 'Benção', tipo: 'buff', bonus_todos_stats: 0.20, icone: '✨' },
    sobrecarga: { nome: 'Sobrecarga', tipo: 'buff_risco', bonus_foco: 0.60, reducao_resistencia: 0.30, icone: '⚡🔴' },
    precisao_aumentada: { nome: 'Precisão Aumentada', tipo: 'buff', bonus_acerto: 0.30, icone: '🎯' },

    // Debuffs
    lentidao: { nome: 'Lentidão', tipo: 'debuff', reducao_agilidade: 0.40, icone: '🐌' },
    enfraquecido: { nome: 'Enfraquecido', tipo: 'debuff', reducao_stats: 0.25, icone: '⬇️' },
    desorientado: { nome: 'Desorientado', tipo: 'debuff', reducao_acerto: 0.30, icone: '🌀' },
    stats_reduzidos: { nome: 'Stats Reduzidos', tipo: 'debuff', reducao_stats: 0.30, icone: '📉' },
    terror: { nome: 'Terror', tipo: 'debuff', reducao_stats: 0.35, icone: '😱' },
    empurrao: { nome: 'Empurrão', tipo: 'debuff', reducao_acerto: 0.20, icone: '🌊' },

    // Controle
    congelado: { nome: 'Congelado', tipo: 'controle', efeito: 'impede_acao', icone: '❄️' },
    atordoado: { nome: 'Atordoado', tipo: 'controle', efeito: 'pula_turno', icone: '💫' },
    paralisia: { nome: 'Paralisia', tipo: 'controle', chance_falha: 0.30, icone: '⚡' },
    paralisia_intensa: { nome: 'Paralisia Intensa', tipo: 'controle', chance_falha: 0.60, icone: '⚡⚡' },

    // Especiais
    invisivel: { nome: 'Invisível', tipo: 'defensivo', evasao_total: true, icone: '👻' },
    queimadura_contra_ataque: { nome: 'Escudo Flamejante', tipo: 'especial', contra_ataque_queimadura: true, icone: '🔥🛡️' },
    roubo_vida: { nome: 'Roubo de Vida', tipo: 'especial', percentual_roubo: 0.15, icone: '🩸' },
    roubo_vida_intenso: { nome: 'Roubo de Vida Intenso', tipo: 'especial', percentual_roubo: 0.30, icone: '🩸🩸' },
    roubo_vida_massivo: { nome: 'Roubo de Vida Massivo', tipo: 'especial', percentual_roubo: 0.50, icone: '🩸💀' },
    perfuracao: { nome: 'Perfuração', tipo: 'especial', ignora_defesa: 0.40, icone: '🗡️' },
    execucao: { nome: 'Execução', tipo: 'especial', bonus_baixo_hp: 0.50, limite_hp: 0.30, icone: '💀' },
    dano_massivo_inimigos: { nome: 'Dano Massivo', tipo: 'especial', multiplicador_dano: 1.5, icone: '💥💥' },
    campo_eletrico: { nome: 'Campo Elétrico', tipo: 'zona', dano_entrada: 20, icone: '⚡🔷' },
    limpar_debuffs: { nome: 'Purificação', tipo: 'utility', limpa_debuffs: true, icone: '✨🔆' }
  };

  habilidade.efeitos_status.forEach(efeitoNome => {
    const efeitoInfo = EFEITOS_STATUS[efeitoNome];

    if (!efeitoInfo) {
      console.warn(`⚠️ Efeito desconhecido: ${efeitoNome}`);
      console.log('Efeitos disponíveis:', Object.keys(EFEITOS_STATUS));
      return;
    }

    console.log(`✅ Efeito encontrado: ${efeitoNome}`, efeitoInfo);

    // Determinar duração
    const duracao = habilidade.duracao_efeito || 3;

    // Criar o efeito
    const efeito = {
      nome: efeitoInfo.nome,
      tipo: efeitoInfo.tipo,
      turnos: duracao,
      icone: efeitoInfo.icone,
      ...efeitoInfo
    };

    console.log('📦 Efeito criado:', efeito);

    // Processar efeito de utility (limpar debuffs)
    if (efeitoInfo.tipo === 'utility' && efeitoInfo.limpa_debuffs) {
      // Limpar todos os debuffs do atacante/aliado
      if (atacante.debuffs) {
        atacante.debuffs = [];
        console.log('🧹 Debuffs removidos de', atacante.nome);
        efeitosAplicados.push({ alvo: 'atacante', efeito: 'Debuffs Removidos', icone: efeitoInfo.icone });
      }
    }
    // Aplicar no alvo correto (self vs inimigo)
    else if (habilidade.alvo === 'self' || efeitoInfo.tipo === 'buff' || efeitoInfo.tipo === 'defensivo' || efeitoInfo.tipo === 'cura_continua') {
      // Efeitos positivos vão para o atacante
      if (!atacante.buffs) atacante.buffs = [];
      atacante.buffs.push(efeito);
      console.log(`💪 Buff aplicado em ${atacante.nome}:`, efeito.nome, '| Buffs totais:', atacante.buffs.length);
      efeitosAplicados.push({ alvo: 'atacante', efeito: efeitoInfo.nome, icone: efeitoInfo.icone });
    } else {
      // Efeitos negativos vão para o alvo
      if (!alvo.debuffs) alvo.debuffs = [];
      alvo.debuffs.push(efeito);
      console.log(`💀 Debuff aplicado em ${alvo.nome}:`, efeito.nome, '| Debuffs totais:', alvo.debuffs.length);
      efeitosAplicados.push({ alvo: 'defensor', efeito: efeitoInfo.nome, icone: efeitoInfo.icone });
    }
  });

  return efeitosAplicados;
}

/**
 * Calcula modificadores de stats baseados em buffs/debuffs
 * @param {Object} avatar - Avatar com buffs/debuffs
 * @returns {Object} Modificadores aplicados
 */
export function calcularModificadoresStats(avatar) {
  const mods = {
    forca: 1.0,
    agilidade: 1.0,
    resistencia: 1.0,
    foco: 1.0,
    evasao: 0,
    acerto: 1.0
  };

  // Processar buffs
  if (avatar.buffs && avatar.buffs.length > 0) {
    avatar.buffs.forEach(buff => {
      if (buff.bonus_todos_stats) {
        mods.forca += buff.bonus_todos_stats;
        mods.agilidade += buff.bonus_todos_stats;
        mods.resistencia += buff.bonus_todos_stats;
        mods.foco += buff.bonus_todos_stats;
      }
      if (buff.bonus_resistencia) mods.resistencia += buff.bonus_resistencia;
      if (buff.bonus_agilidade) mods.agilidade += buff.bonus_agilidade;
      if (buff.bonus_foco) mods.foco += buff.bonus_foco;
      if (buff.bonus_evasao) mods.evasao += buff.bonus_evasao;
      if (buff.bonus_acerto) mods.acerto += buff.bonus_acerto;
      if (buff.evasao_total) mods.evasao = 1.0; // 100% evasão
    });
  }

  // Processar debuffs
  if (avatar.debuffs && avatar.debuffs.length > 0) {
    avatar.debuffs.forEach(debuff => {
      if (debuff.reducao_stats) {
        mods.forca -= debuff.reducao_stats;
        mods.agilidade -= debuff.reducao_stats;
        mods.resistencia -= debuff.reducao_stats;
        mods.foco -= debuff.reducao_stats;
      }
      if (debuff.reducao_agilidade) mods.agilidade -= debuff.reducao_agilidade;
      if (debuff.reducao_resistencia) mods.resistencia -= debuff.reducao_resistencia;
      if (debuff.reducao_acerto) mods.acerto -= debuff.reducao_acerto;
    });
  }

  return mods;
}

/**
 * Processa o uso de uma habilidade
 */
export function usarHabilidade(atacante, habilidade, defensor, estado) {
  const resultado = {
    sucesso: false,
    mensagem: '',
    dano: 0,
    cura: 0,
    critico: false,
    energiaGasta: 0,
    energiaRecuperada: 0,
    efeitosAplicados: [],
    novoHP: defensor.hp_atual,
    novoHPAtacante: atacante.hp_atual,
    novaEnergia: atacante.energia_atual,
  };

  // Verificar energia suficiente
  const custoEnergia = habilidade.custo_energia || 20;
  if (atacante.energia_atual < custoEnergia) {
    resultado.mensagem = `${atacante.nome} não tem energia suficiente!`;
    return resultado;
  }

  // Chance de falhar se vínculo baixo
  if (atacante.vinculo < 20 && Math.random() < 0.05) {
    resultado.mensagem = `${atacante.nome} hesitou e não obedeceu o comando!`;
    resultado.energiaGasta = Math.floor(custoEnergia / 2);
    resultado.novaEnergia = atacante.energia_atual - resultado.energiaGasta;
    return resultado;
  }

  // Calcular modificadores de stats
  const modsAtacante = calcularModificadoresStats(atacante);
  const modsDefensor = calcularModificadoresStats(defensor);

  // Habilidades defensivas/suporte não precisam de acerto
  const ehHabilidadeOfensiva = habilidade.tipo === 'Ofensiva' && habilidade.dano_base > 0;

  if (ehHabilidadeOfensiva) {
    // Verificar se acertou (chance de esquiva do defensor)
    const chanceAcerto = (habilidade.chance_acerto || 95) * modsAtacante.acerto;
    const evasaoBase = Math.min(defensor.agilidade * modsDefensor.agilidade * 0.3, 40);
    const evasaoTotal = Math.min(evasaoBase + (modsDefensor.evasao * 100), 100);

    if (Math.random() * 100 > chanceAcerto - evasaoTotal) {
      resultado.mensagem = `${defensor.nome} esquivou do ataque!`;
      resultado.energiaGasta = habilidade.custo_energia;
      resultado.novaEnergia = atacante.energia_atual - resultado.energiaGasta;
      return resultado;
    }
  }

  // Processar habilidade baseado no tipo
  let dano = 0;
  let cura = 0;

  if (habilidade.tipo === 'Defensiva' && habilidade.dano_base === 0) {
    // Habilidade puramente defensiva (ex: Armadura de Pedra)
    resultado.sucesso = true;
    resultado.mensagem = `${atacante.nome} usou ${habilidade.nome}!`;
  } else if (habilidade.tipo === 'Suporte') {
    // Habilidade de suporte (cura, buffs, etc)
    if (habilidade.dano_base < 0) {
      // Dano negativo = cura
      cura = Math.abs(habilidade.dano_base);
      const statValue = atacante[habilidade.stat_primario] || atacante.foco;
      cura += statValue * (habilidade.multiplicador_stat || 1.0);
      cura = Math.floor(cura);

      resultado.cura = cura;
      resultado.novoHPAtacante = Math.min(atacante.hp_maximo, atacante.hp_atual + cura);
      resultado.sucesso = true;
      resultado.mensagem = `${atacante.nome} usou ${habilidade.nome}! Recuperou ${cura} HP!`;
    } else {
      resultado.sucesso = true;
      resultado.mensagem = `${atacante.nome} usou ${habilidade.nome}!`;
    }

    // Algumas habilidades de suporte recuperam energia
    if (habilidade.nome === 'Regeneração Aquática' || habilidade.efeitos_status.includes('regeneracao')) {
      resultado.energiaRecuperada = 10;
      resultado.novaEnergia = Math.min(CONFIG_BATALHA.ENERGIA_MAXIMA, atacante.energia_atual - habilidade.custo_energia + resultado.energiaRecuperada);
    }
  } else if (ehHabilidadeOfensiva) {
    // Habilidade ofensiva - calcular dano
    const critico = isCritico(atacante);

    // Aplicar modificadores aos stats do atacante
    const atacanteModificado = {
      ...atacante,
      forca: atacante.forca * modsAtacante.forca,
      agilidade: atacante.agilidade * modsAtacante.agilidade,
      resistencia: atacante.resistencia * modsAtacante.resistencia,
      foco: atacante.foco * modsAtacante.foco
    };

    // Aplicar modificadores aos stats do defensor
    let defensorModificado = {
      ...defensor,
      resistencia: defensor.resistencia * modsDefensor.resistencia
    };

    // Verificar efeitos especiais que afetam o cálculo de dano
    let multiplicadorEspecial = 1.0;

    // Perfuração: ignora parte da defesa
    if (habilidade.efeitos_status && habilidade.efeitos_status.includes('perfuracao')) {
      defensorModificado.resistencia *= 0.6; // Ignora 40% da defesa
    }

    // Execução: mais dano em alvos com HP baixo
    if (habilidade.efeitos_status && habilidade.efeitos_status.includes('execucao')) {
      const hpPercent = defensor.hp_atual / defensor.hp_maximo;
      if (hpPercent <= 0.30) {
        multiplicadorEspecial *= 1.5; // +50% de dano
      }
    }

    // Dano massivo
    if (habilidade.efeitos_status && habilidade.efeitos_status.includes('dano_massivo_inimigos')) {
      multiplicadorEspecial *= 1.5;
    }

    dano = calcularDano(atacanteModificado, habilidade, defensorModificado, critico);
    dano = Math.floor(dano * multiplicadorEspecial);

    // Processar múltiplos golpes
    const numGolpes = habilidade.num_golpes || 1;
    if (numGolpes > 1) {
      dano = dano * numGolpes;
      resultado.numGolpes = numGolpes;
    }

    // Processar roubo de vida
    let curaRouboVida = 0;
    if (habilidade.efeitos_status) {
      if (habilidade.efeitos_status.includes('roubo_vida')) {
        curaRouboVida = Math.floor(dano * 0.15);
      } else if (habilidade.efeitos_status.includes('roubo_vida_intenso')) {
        curaRouboVida = Math.floor(dano * 0.30);
      } else if (habilidade.efeitos_status.includes('roubo_vida_massivo')) {
        curaRouboVida = Math.floor(dano * 0.50);
      }

      if (curaRouboVida > 0) {
        resultado.cura = curaRouboVida;
        resultado.novoHPAtacante = Math.min(atacante.hp_maximo, atacante.hp_atual + curaRouboVida);
      }
    }

    // Aplicar dano
    resultado.dano = dano;
    resultado.critico = critico;
    resultado.novoHP = Math.max(0, defensor.hp_atual - dano);
    resultado.sucesso = true;

    // Mensagem
    const vantagemTexto = calcularVantagemElemental(atacante.elemento, defensor.elemento);
    let vantagemMsg = '';
    if (vantagemTexto >= 1.5) vantagemMsg = ' (SUPER EFETIVO!)';
    else if (vantagemTexto <= 0.75) vantagemMsg = ' (Pouco efetivo...)';

    let golpesMsg = numGolpes > 1 ? ` (${numGolpes} golpes!)` : '';
    let mensagem = `${atacante.nome} usou ${habilidade.nome}! Causou ${dano} de dano${critico ? ' (CRÍTICO!)' : ''}${golpesMsg}${vantagemMsg}`;
    if (curaRouboVida > 0) {
      mensagem += ` e roubou ${curaRouboVida} HP!`;
    }
    resultado.mensagem = mensagem;
  }

  // Gastar energia
  resultado.energiaGasta = habilidade.custo_energia;
  if (!resultado.energiaRecuperada) {
    resultado.novaEnergia = atacante.energia_atual - resultado.energiaGasta;
  }

  // Aplicar efeitos de status
  if (habilidade.efeitos_status && habilidade.efeitos_status.length > 0) {
    const efeitosAplicados = aplicarEfeitosStatus(habilidade, defensor, atacante);
    resultado.efeitosAplicados = efeitosAplicados;

    // Adicionar à mensagem
    if (efeitosAplicados.length > 0) {
      const icones = efeitosAplicados.map(e => e.icone).join(' ');
      resultado.mensagem += ` ${icones}`;
    }
  }

  return resultado;
}

/**
 * Ataque básico (comum)
 * Não gasta energia, mas causa menos dano que habilidades
 */
export function ataqueBasico(atacante, defensor, estado) {
  const resultado = {
    sucesso: false,
    mensagem: '',
    dano: 0,
    critico: false,
    energiaGasta: 0,
    efeitosAplicados: [],
    novoHP: defensor.hp_atual,
    novaEnergia: atacante.energia_atual,
  };

  // Calcular modificadores de stats
  const modsAtacante = calcularModificadoresStats(atacante);
  const modsDefensor = calcularModificadoresStats(defensor);

  // Verificar se acertou
  const chanceAcerto = 85; // 85% de acerto para ataque básico
  const evasaoBase = Math.min(defensor.agilidade * modsDefensor.agilidade * 0.3, 40);
  const evasaoTotal = Math.min(evasaoBase + (modsDefensor.evasao * 100), 100);

  if (Math.random() * 100 > chanceAcerto - evasaoTotal) {
    resultado.mensagem = `${defensor.nome} esquivou do ataque básico!`;
    return resultado;
  }

  // Calcular dano básico
  const critico = isCritico(atacante);

  // Aplicar modificadores aos stats
  const atacanteModificado = {
    ...atacante,
    forca: atacante.forca * modsAtacante.forca,
    agilidade: atacante.agilidade * modsAtacante.agilidade,
    resistencia: atacante.resistencia * modsAtacante.resistencia,
    foco: atacante.foco * modsAtacante.foco
  };

  const defensorModificado = {
    ...defensor,
    resistencia: defensor.resistencia * modsDefensor.resistencia
  };

  // Criar habilidade fictícia para cálculo de dano
  const ataqueBasicoHabilidade = {
    dano_base: 20,
    multiplicador_stat: 0.8,
    stat_primario: 'forca',
    custo_energia: 0
  };

  let dano = calcularDano(atacanteModificado, ataqueBasicoHabilidade, defensorModificado, critico);

  // Aplicar dano
  resultado.dano = dano;
  resultado.critico = critico;
  resultado.novoHP = Math.max(0, defensor.hp_atual - dano);
  resultado.sucesso = true;

  // Mensagem
  const vantagemTexto = calcularVantagemElemental(atacante.elemento, defensor.elemento);
  let vantagemMsg = '';
  if (vantagemTexto >= 1.5) vantagemMsg = ' (SUPER EFETIVO!)';
  else if (vantagemTexto <= 0.75) vantagemMsg = ' (Pouco efetivo...)';

  resultado.mensagem = `${atacante.nome} usou Ataque Básico! Causou ${dano} de dano${critico ? ' (CRÍTICO!)' : ''}${vantagemMsg}`;

  return resultado;
}

/**
 * Ação de defender
 */
export function defender(avatar, estado) {
  return {
    sucesso: true,
    mensagem: `${avatar.nome} assumiu posição defensiva!`,
    energiaGasta: 0,
    energiaRecuperada: 15,
    novaEnergia: Math.min(CONFIG_BATALHA.ENERGIA_MAXIMA, avatar.energia_atual + 15),
    defesaAumentada: true,
    buffs: [{
      nome: 'Defesa',
      tipo: 'buff',
      bonus_resistencia: 0.50, // +50% resistência
      icone: '🛡️',
      turnos: 1
    }]
  };
}

/**
 * Ação de esperar (recupera mais energia)
 */
export function esperar(avatar, estado) {
  return {
    sucesso: true,
    mensagem: `${avatar.nome} concentrou suas energias!`,
    energiaGasta: 0,
    energiaRecuperada: 30,
    novaEnergia: Math.min(CONFIG_BATALHA.ENERGIA_MAXIMA, avatar.energia_atual + 30)
  };
}

/**
 * Processa início do turno
 * IMPORTANTE: Energia NÃO é mais regenerada automaticamente.
 * Energia só é recuperada ao usar as ações "Esperar" ou "Defender".
 */
export function iniciarTurno(avatar, estado) {
  const resultado = {
    energia: avatar.energia_atual,
    mensagem: `Turno de ${avatar.nome}!`,
    efeitosProcessados: []
  };

  // Processar buffs (incluindo cura contínua)
  if (avatar.buffs && avatar.buffs.length > 0) {
    // CORREÇÃO: Processar efeitos de cura contínua dos buffs
    avatar.buffs.forEach(buff => {
      if (buff.tipo === 'cura_continua' && buff.cura_por_turno) {
        const cura = Math.floor(avatar.hp_maximo * buff.cura_por_turno);
        avatar.hp_atual = Math.min(avatar.hp_maximo, avatar.hp_atual + cura);
        resultado.efeitosProcessados.push({
          tipo: 'cura_continua',
          nome: buff.nome,
          cura: cura
        });
      }
    });

    // Reduzir duração e remover buffs expirados
    avatar.buffs = avatar.buffs.map(buff => ({
      ...buff,
      turnos: buff.turnos - 1
    })).filter(buff => buff.turnos > 0);
  }

  // Processar debuffs (dano contínuo e outros efeitos negativos)
  if (avatar.debuffs && avatar.debuffs.length > 0) {
    // Processar efeitos de dano contínuo
    avatar.debuffs.forEach(debuff => {
      if (debuff.tipo === 'dano_continuo' && debuff.dano_por_turno) {
        const dano = Math.floor(avatar.hp_maximo * debuff.dano_por_turno);
        avatar.hp_atual = Math.max(0, avatar.hp_atual - dano);
        resultado.efeitosProcessados.push({
          tipo: 'dano_continuo',
          nome: debuff.nome,
          dano: dano
        });
      }
    });

    // Reduzir duração dos debuffs
    avatar.debuffs = avatar.debuffs.map(debuff => ({
      ...debuff,
      turnos: debuff.turnos - 1
    })).filter(debuff => debuff.turnos > 0);
  }

  return resultado;
}

/**
 * Verifica condição de vitória
 */
export function verificarVitoria(estado) {
  // CORREÇÃO: Verificar morte ANTES de modificar o HP
  const jogadorMorto = estado.jogador.hp_atual <= 0;
  const inimigoMorto = estado.inimigo.hp_atual <= 0;
  const maxRodadas = estado.rodada >= CONFIG_BATALHA.RODADAS_MAXIMAS;

  // Garantir HP mínimo de 1 após verificar vitória
  if (estado.jogador.hp_atual < 1) {
    estado.jogador.hp_atual = 1;
  }
  if (estado.inimigo.hp_atual < 1) {
    estado.inimigo.hp_atual = 1;
  }

  if (jogadorMorto && inimigoMorto) {
    return { fim: true, vencedor: 'empate', razao: 'Ambos caíram!' };
  }

  if (jogadorMorto) {
    return { fim: true, vencedor: 'inimigo', razao: 'Seu avatar foi derrotado!' };
  }

  if (inimigoMorto) {
    return { fim: true, vencedor: 'jogador', razao: 'Vitória!' };
  }

  if (maxRodadas) {
    // Empate por tempo - vence quem tem mais HP %
    const hpJogadorPercent = estado.jogador.hp_atual / estado.jogador.hp_maximo;
    const hpInimigoPercent = estado.inimigo.hp_atual / estado.inimigo.hp_maximo;

    if (hpJogadorPercent > hpInimigoPercent) {
      return { fim: true, vencedor: 'jogador', razao: 'Vitória por pontos!' };
    } else if (hpInimigoPercent > hpJogadorPercent) {
      return { fim: true, vencedor: 'inimigo', razao: 'Derrota por pontos!' };
    } else {
      return { fim: true, vencedor: 'empate', razao: 'Empate técnico!' };
    }
  }

  return { fim: false };
}

/**
 * Inicializa estado da batalha
 */
export function inicializarBatalha(avatarJogador, avatarInimigo, dificuldade = 'normal') {
  // === CALCULAR STATS DO JOGADOR COM MODIFICADORES ===

  // 1. Aplicar bônus de vínculo aos stats base
  const vinculoJogador = avatarJogador.vinculo || 0;
  const nivelVinculo = getNivelVinculo(vinculoJogador);
  const statsComVinculo = aplicarBonusVinculo({
    forca: avatarJogador.forca,
    agilidade: avatarJogador.agilidade,
    resistencia: avatarJogador.resistencia,
    foco: avatarJogador.foco
  }, vinculoJogador);

  console.log('Vínculo do jogador:', {
    vinculo: vinculoJogador,
    nivel: nivelVinculo.nome,
    bonus: nivelVinculo.bonus || nivelVinculo.penalidade || 0,
    statsOriginais: { forca: avatarJogador.forca, agilidade: avatarJogador.agilidade, resistencia: avatarJogador.resistencia, foco: avatarJogador.foco },
    statsComVinculo: statsComVinculo
  });

  // 2. Aplicar penalidades de exaustão sobre os stats com vínculo
  const exaustaoJogador = avatarJogador.exaustao || 0;
  const nivelExaustao = getNivelExaustao(exaustaoJogador);
  const statsJogadorFinal = aplicarPenalidadesExaustao(statsComVinculo, exaustaoJogador);

  console.log('Exaustão do jogador:', {
    exaustao: exaustaoJogador,
    nivel: nivelExaustao.nome,
    statsComVinculo: statsComVinculo,
    statsFinais: statsJogadorFinal,
    penalidades: nivelExaustao.penalidades
  });

  // Calcular stats do inimigo baseado na dificuldade
  let multiplicador = 1.0;
  switch (dificuldade) {
    case 'facil': multiplicador = 0.7; break;
    case 'normal': multiplicador = 1.0; break;
    case 'dificil': multiplicador = 1.3; break;
    case 'mestre': multiplicador = 1.5; break;
  }

  // Stats do inimigo
  const inimigoAjustado = {
    ...avatarInimigo,
    forca: Math.floor(avatarInimigo.forca * multiplicador),
    agilidade: Math.floor(avatarInimigo.agilidade * multiplicador),
    resistencia: Math.floor(avatarInimigo.resistencia * multiplicador),
    foco: Math.floor(avatarInimigo.foco * multiplicador),
  };

  // Usar stats finais (com vínculo e exaustão) para o jogador
  const jogadorFinal = {
    ...avatarJogador,
    ...statsJogadorFinal
  };

  const hpJogador = calcularHPMaximo(jogadorFinal);
  const hpInimigo = calcularHPMaximo(inimigoAjustado);

  // Calcular energia máxima com penalidade
  let energiaMaximaJogador = CONFIG_BATALHA.ENERGIA_MAXIMA;
  if (nivelExaustao.penalidades.energia_maxima) {
    energiaMaximaJogador = Math.floor(energiaMaximaJogador * (1 + nivelExaustao.penalidades.energia_maxima));
  }

  console.log('Stats finais aplicados:', {
    statsFinais: statsJogadorFinal,
    hpMaximo: hpJogador,
    energiaMaxima: energiaMaximaJogador
  });

  return {
    id: `battle_${Date.now()}`,
    tipo: 'treino',
    dificuldade,
    rodada: 1,
    turno_atual: 'jogador', // Jogador sempre começa

    jogador: {
      ...jogadorFinal,
      hp_maximo: hpJogador,
      hp_atual: hpJogador,
      energia_atual: Math.min(CONFIG_BATALHA.ENERGIA_INICIAL, energiaMaximaJogador),
      energia_maxima: energiaMaximaJogador,
      vinculo: vinculoJogador,
      nivel_vinculo: nivelVinculo.nome,
      exaustao: exaustaoJogador,
      nivel_exaustao: nivelExaustao.nome,
      buffs: [],
      debuffs: [],
    },
    
    inimigo: {
      ...inimigoAjustado,
      hp_maximo: hpInimigo,
      hp_atual: hpInimigo,
      energia_atual: CONFIG_BATALHA.ENERGIA_INICIAL,
      buffs: [],
      debuffs: [],
    },
    
    historico: [],
    iniciado_em: new Date().toISOString(),
  };
}

/**
 * Processa ação do jogador
 */
export function processarAcaoJogador(estado, acao) {
  const { tipo, habilidadeIndex } = acao;

  let resultado;

  switch (tipo) {
    case 'ataque_basico':
      resultado = ataqueBasico(estado.jogador, estado.inimigo, estado);

      // Atualizar estado
      if (resultado.sucesso) {
        estado.inimigo.hp_atual = resultado.novoHP;
        estado.jogador.energia_atual = resultado.novaEnergia;
      }
      break;

    case 'habilidade':
      const habilidade = estado.jogador.habilidades[habilidadeIndex];

      if (!habilidade) {
        console.error('Habilidade não encontrada!', {
          habilidadeIndex,
          totalHabilidades: estado.jogador.habilidades?.length,
          habilidades: estado.jogador.habilidades
        });
        resultado = { sucesso: false, mensagem: 'Habilidade não encontrada!' };
        break;
      }

      console.log('Usando habilidade:', {
        nome: habilidade.nome,
        custo: habilidade.custo_energia,
        energiaAtual: estado.jogador.energia_atual,
        tipo: habilidade.tipo,
        efeitos: habilidade.efeitos_status
      });

      resultado = usarHabilidade(estado.jogador, habilidade, estado.inimigo, estado);

      console.log('Resultado habilidade:', {
        sucesso: resultado.sucesso,
        mensagem: resultado.mensagem,
        dano: resultado.dano,
        efeitosAplicados: resultado.efeitosAplicados
      });

      // Atualizar estado
      if (resultado.sucesso) {
        estado.inimigo.hp_atual = resultado.novoHP;
        estado.jogador.energia_atual = resultado.novaEnergia;

        // Atualizar HP do atacante se houver cura
        if (resultado.novoHPAtacante !== undefined && resultado.novoHPAtacante !== estado.jogador.hp_atual) {
          estado.jogador.hp_atual = resultado.novoHPAtacante;
        }

        console.log('📊 Estado após habilidade:', {
          jogador_buffs: estado.jogador.buffs?.length || 0,
          jogador_debuffs: estado.jogador.debuffs?.length || 0,
          inimigo_buffs: estado.inimigo.buffs?.length || 0,
          inimigo_debuffs: estado.inimigo.debuffs?.length || 0,
          efeitosAplicados: resultado.efeitosAplicados
        });
      } else {
        // Mesmo se falhou, pode ter gastado energia
        if (resultado.energiaGasta > 0) {
          estado.jogador.energia_atual = resultado.novaEnergia;
        }
      }
      break;

    case 'defender':
      resultado = defender(estado.jogador, estado);
      estado.jogador.energia_atual = resultado.novaEnergia;
      if (!estado.jogador.buffs) estado.jogador.buffs = [];
      estado.jogador.buffs.push(...(resultado.buffs || []));
      console.log('Defender aplicado:', {
        buffsAplicados: resultado.buffs,
        buffsAtuais: estado.jogador.buffs,
        energiaAtual: estado.jogador.energia_atual
      });
      break;

    case 'esperar':
      resultado = esperar(estado.jogador, estado);
      estado.jogador.energia_atual = resultado.novaEnergia;
      break;

    default:
      resultado = { sucesso: false, mensagem: 'Ação inválida!' };
  }

  // Adicionar ao histórico
  estado.historico.push({
    rodada: estado.rodada,
    turno: 'jogador',
    acao: tipo,
    resultado,
    timestamp: new Date().toISOString()
  });

  return resultado;
}

/**
 * Exportações
 */
export default {
  CONFIG_BATALHA,
  calcularHPMaximo,
  calcularDano,
  calcularChanceCritico,
  isCritico,
  aplicarEfeitosStatus,
  calcularModificadoresStats,
  ataqueBasico,
  usarHabilidade,
  defender,
  esperar,
  iniciarTurno,
  verificarVitoria,
  inicializarBatalha,
  processarAcaoJogador,
};
