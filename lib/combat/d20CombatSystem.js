// ==================== SISTEMA DE COMBATE D20 ====================
// Sistema baseado em rolagem de d20 com atributos, elementos e vínculo
// Cada ação é resolvida com um único teste

/**
 * Configurações do sistema d20
 */
export const CONFIG_D20 = {
  RODADAS_MAXIMAS: 20,
  DADO_BASE: 20, // d20
  DEFESA_BASE: 10,
  CRITICO_NATURAL: 20, // Nat 20 = crítico
  MULTIPLICADOR_CRITICO: 2,
  VANTAGEM_ELEMENTAL: 0.20, // +20% dano
  DESVANTAGEM_ELEMENTAL: 0.20, // -20% dano
};

/**
 * Multiplicadores de dificuldade
 */
export const DIFICULDADE_MULTIPLICADOR = {
  'facil': 0.7,
  'normal': 1.0,
  'dificil': 1.3,
  'mestre': 1.5
};

/**
 * Sistema de vantagem elemental em círculo
 * Fogo > Vento > Terra > Eletricidade > Água > Fogo
 * Luz ⇆ Sombra (forte uma contra a outra)
 */
const VANTAGEM_ELEMENTOS = {
  'Fogo': ['Vento'],
  'Vento': ['Terra'],
  'Terra': ['Eletricidade'],
  'Eletricidade': ['Água'],
  'Água': ['Fogo'],
  'Luz': ['Sombra'],
  'Sombra': ['Luz']
};

/**
 * Rola um d20
 * @returns {number} Resultado entre 1 e 20
 */
export function rolarD20() {
  return Math.floor(Math.random() * 20) + 1;
}

/**
 * Calcula bônus de vínculo (0-4)
 * @param {number} vinculo - Valor do vínculo (0-100)
 * @returns {number} Bônus de vínculo
 */
export function calcularBonusVinculo(vinculo) {
  return Math.floor((vinculo || 0) / 25);
}

/**
 * Verifica vantagem elemental
 * @param {string} elementoAtacante
 * @param {string} elementoDefensor
 * @returns {string} 'vantagem', 'desvantagem' ou 'neutro'
 */
export function verificarVantagemElemental(elementoAtacante, elementoDefensor) {
  if (!elementoAtacante || !elementoDefensor) return 'neutro';

  const vantagens = VANTAGEM_ELEMENTOS[elementoAtacante] || [];
  const desvantagensContra = VANTAGEM_ELEMENTOS[elementoDefensor] || [];

  if (vantagens.includes(elementoDefensor)) {
    return 'vantagem';
  }

  if (desvantagensContra.includes(elementoAtacante)) {
    return 'desvantagem';
  }

  return 'neutro';
}

/**
 * Calcula multiplicador de dano elemental
 * @param {string} tipoVantagem - 'vantagem', 'desvantagem' ou 'neutro'
 * @returns {number} Multiplicador de dano
 */
export function calcularMultiplicadorElemental(tipoVantagem) {
  switch (tipoVantagem) {
    case 'vantagem':
      return 1 + CONFIG_D20.VANTAGEM_ELEMENTAL; // 1.20
    case 'desvantagem':
      return 1 - CONFIG_D20.DESVANTAGEM_ELEMENTAL; // 0.80
    default:
      return 1.0;
  }
}

/**
 * Calcula Defesa do alvo
 * Defesa = 10 + Agilidade + (Resistência / 2)
 * @param {Object} avatar
 * @returns {number} Valor de defesa
 */
export function calcularDefesa(avatar) {
  const agilidade = avatar.agilidade || 0;
  const resistencia = avatar.resistencia || 0;
  return CONFIG_D20.DEFESA_BASE + agilidade + Math.floor(resistencia / 2);
}

/**
 * Calcula HP máximo
 * PV = 20 + Resistência × 3
 * @param {Object} avatar
 * @returns {number} HP máximo
 */
export function calcularHP(avatar) {
  const resistencia = avatar.resistencia || 0;
  return 20 + (resistencia * 3);
}

/**
 * Realiza um ataque
 * @param {Object} atacante - Avatar atacante
 * @param {Object} defensor - Avatar defensor
 * @param {string} tipoAtaque - 'fisico' ou 'magico'
 * @returns {Object} Resultado do ataque com log detalhado
 */
export function realizarAtaque(atacante, defensor, tipoAtaque = 'fisico') {
  const log = [];

  // 1. Rolar d20
  const rolagem = rolarD20();
  const critico = rolagem === CONFIG_D20.CRITICO_NATURAL;

  // 2. Determinar atributo baseado no tipo de ataque
  const atributo = tipoAtaque === 'magico' ? atacante.foco : atacante.forca;
  const nomeAtributo = tipoAtaque === 'magico' ? 'Foco' : 'Força';

  // 3. Calcular bônus de vínculo
  const bonusVinculo = calcularBonusVinculo(atacante.vinculo);

  // 4. Verificar vantagem elemental (para bônus no ataque)
  const tipoVantagem = verificarVantagemElemental(atacante.elemento, defensor.elemento);
  const bonusElemento = tipoVantagem === 'vantagem' ? 2 : (tipoVantagem === 'desvantagem' ? -2 : 0);

  // 5. Calcular total do ataque
  const totalAtaque = rolagem + atributo + bonusElemento + bonusVinculo;

  // 6. Calcular defesa do alvo
  const defesa = calcularDefesa(defensor);

  // Log da rolagem
  log.push(`🎲 ${atacante.nome} rola d20: [${rolagem}]${critico ? ' CRÍTICO!' : ''}`);
  log.push(`⚔️ Ataque: ${rolagem} + ${atributo} (${nomeAtributo}) + ${bonusElemento} (Elemento) + ${bonusVinculo} (Vínculo) = ${totalAtaque}`);
  log.push(`🛡️ Defesa de ${defensor.nome}: ${defesa}`);

  // 7. Verificar acerto
  const acertou = totalAtaque >= defesa || critico; // Crítico sempre acerta

  if (!acertou) {
    log.push(`❌ ${defensor.nome} se defendeu! (${totalAtaque} < ${defesa})`);
    return {
      sucesso: false,
      acertou: false,
      rolagem,
      totalAtaque,
      defesa,
      dano: 0,
      critico: false,
      log
    };
  }

  // 8. Calcular dano base
  // Dano = Atributo + Bônus de Vínculo
  let dano = atributo + bonusVinculo;

  // 9. Aplicar multiplicador elemental ao dano
  const multiplicadorElemental = calcularMultiplicadorElemental(tipoVantagem);
  dano = Math.floor(dano * multiplicadorElemental);

  // 10. Aplicar crítico (dobro do dano)
  if (critico) {
    dano *= CONFIG_D20.MULTIPLICADOR_CRITICO;
    log.push(`💥 DANO CRÍTICO! Dano dobrado!`);
  }

  // Garantir dano mínimo de 1
  dano = Math.max(1, dano);

  // Log do dano
  let danoLog = `💢 Dano: ${atributo} (${nomeAtributo}) + ${bonusVinculo} (Vínculo)`;
  if (tipoVantagem === 'vantagem') {
    danoLog += ` × 1.2 (Vantagem ${atacante.elemento} > ${defensor.elemento})`;
  } else if (tipoVantagem === 'desvantagem') {
    danoLog += ` × 0.8 (Desvantagem ${atacante.elemento} < ${defensor.elemento})`;
  }
  danoLog += ` = ${dano}`;
  log.push(danoLog);

  log.push(`✅ ${atacante.nome} acerta ${defensor.nome} causando ${dano} de dano!`);

  return {
    sucesso: true,
    acertou: true,
    rolagem,
    totalAtaque,
    defesa,
    dano,
    critico,
    tipoVantagem,
    log
  };
}

/**
 * Tenta esquivar de um ataque
 * Esquiva: 1d20 + Agilidade + Vínculo vs Ataque do inimigo
 * @param {Object} defensor - Avatar tentando esquivar
 * @param {number} totalAtaqueInimigo - Total do ataque a ser esquivado
 * @returns {Object} Resultado da esquiva com log
 */
export function tentarEsquiva(defensor, totalAtaqueInimigo) {
  const log = [];

  const rolagem = rolarD20();
  const bonusVinculo = calcularBonusVinculo(defensor.vinculo);
  const totalEsquiva = rolagem + defensor.agilidade + bonusVinculo;

  log.push(`🎲 ${defensor.nome} tenta esquivar: d20[${rolagem}] + ${defensor.agilidade} (Agilidade) + ${bonusVinculo} (Vínculo) = ${totalEsquiva}`);

  const esquivou = totalEsquiva >= totalAtaqueInimigo;

  if (esquivou) {
    log.push(`💨 ${defensor.nome} esquivou! (${totalEsquiva} >= ${totalAtaqueInimigo})`);
  } else {
    log.push(`❌ ${defensor.nome} não conseguiu esquivar! (${totalEsquiva} < ${totalAtaqueInimigo})`);
  }

  return {
    sucesso: esquivou,
    rolagem,
    totalEsquiva,
    totalAtaqueInimigo,
    log
  };
}

/**
 * Tenta defender (reduzir dano)
 * Defesa: 1d20 + Resistência + Vínculo vs Ataque do inimigo
 * @param {Object} defensor - Avatar tentando defender
 * @param {number} totalAtaqueInimigo - Total do ataque
 * @param {number} danoOriginal - Dano original do ataque
 * @returns {Object} Resultado da defesa com log
 */
export function tentarDefesa(defensor, totalAtaqueInimigo, danoOriginal) {
  const log = [];

  const rolagem = rolarD20();
  const bonusVinculo = calcularBonusVinculo(defensor.vinculo);
  const totalDefesa = rolagem + defensor.resistencia + bonusVinculo;

  log.push(`🎲 ${defensor.nome} tenta defender: d20[${rolagem}] + ${defensor.resistencia} (Resistência) + ${bonusVinculo} (Vínculo) = ${totalDefesa}`);

  const defendeu = totalDefesa >= totalAtaqueInimigo;

  // Se defendeu, reduz o dano pela metade
  const danoFinal = defendeu ? Math.floor(danoOriginal / 2) : danoOriginal;

  if (defendeu) {
    log.push(`🛡️ ${defensor.nome} defendeu! Dano reduzido: ${danoOriginal} → ${danoFinal}`);
  } else {
    log.push(`❌ ${defensor.nome} não conseguiu defender! Dano total: ${danoFinal}`);
  }

  return {
    sucesso: defendeu,
    rolagem,
    totalDefesa,
    totalAtaqueInimigo,
    danoOriginal,
    danoFinal,
    log
  };
}

/**
 * Inicializa estado da batalha d20
 * @param {Object} avatarJogador
 * @param {Object} avatarInimigo
 * @param {string} dificuldade - 'facil', 'normal', 'dificil', 'mestre'
 * @returns {Object} Estado inicial da batalha
 */
export function inicializarBatalhaD20(avatarJogador, avatarInimigo, dificuldade = 'normal') {
  // Aplicar multiplicador de dificuldade ao inimigo
  const mult = DIFICULDADE_MULTIPLICADOR[dificuldade] || 1.0;

  const inimigoAjustado = {
    ...avatarInimigo,
    forca: Math.floor((avatarInimigo.forca || 10) * mult),
    agilidade: Math.floor((avatarInimigo.agilidade || 10) * mult),
    resistencia: Math.floor((avatarInimigo.resistencia || 10) * mult),
    foco: Math.floor((avatarInimigo.foco || 10) * mult),
    vinculo: avatarInimigo.vinculo || 50 // IA tem vínculo médio
  };

  const hpJogador = calcularHP(avatarJogador);
  const hpInimigo = calcularHP(inimigoAjustado);

  return {
    id: `battle_d20_${Date.now()}`,
    rodada: 1,
    dificuldade,

    jogador: {
      ...avatarJogador,
      hp_maximo: hpJogador,
      hp_atual: hpJogador,
      defesa: calcularDefesa(avatarJogador),
      bonus_vinculo: calcularBonusVinculo(avatarJogador.vinculo || 0)
    },

    inimigo: {
      ...inimigoAjustado,
      hp_maximo: hpInimigo,
      hp_atual: hpInimigo,
      defesa: calcularDefesa(inimigoAjustado),
      bonus_vinculo: calcularBonusVinculo(inimigoAjustado.vinculo)
    },

    historico: [],
    logs: [],
    iniciado_em: new Date().toISOString()
  };
}

/**
 * Processa turno de combate completo
 * Fluxo: Jogador age → Inimigo age → Se jogador escolheu defesa/esquiva, afeta ataque inimigo
 *
 * @param {Object} estado - Estado da batalha
 * @param {string} acaoJogador - 'atacar_fisico', 'atacar_magico', 'esquivar', 'defender'
 * @returns {Object} Resultado do turno
 */
export function processarTurnoD20(estado, acaoJogador) {
  const logs = [];
  let resultado = {
    jogadorDano: 0,
    inimigoDano: 0,
    jogadorHP: estado.jogador.hp_atual,
    inimigoHP: estado.inimigo.hp_atual,
    jogadorCritico: false,
    inimigoCritico: false,
    jogadorAcertou: false,
    inimigoAcertou: false,
    fimBatalha: false,
    vencedor: null
  };

  logs.push(`═══════════ RODADA ${estado.rodada} ═══════════`);

  // === FASE 1: AÇÃO DO JOGADOR ===
  logs.push(`\n🔵 ${estado.jogador.nome} escolhe: ${acaoJogador.toUpperCase()}`);

  if (acaoJogador === 'atacar_fisico' || acaoJogador === 'atacar_magico') {
    const tipoAtaque = acaoJogador === 'atacar_magico' ? 'magico' : 'fisico';
    const ataqueJogador = realizarAtaque(estado.jogador, estado.inimigo, tipoAtaque);
    logs.push(...ataqueJogador.log);

    resultado.jogadorAcertou = ataqueJogador.acertou;
    resultado.jogadorCritico = ataqueJogador.critico;

    if (ataqueJogador.acertou) {
      resultado.inimigoDano = ataqueJogador.dano;
      resultado.inimigoHP = Math.max(0, estado.inimigo.hp_atual - ataqueJogador.dano);
    }
  } else if (acaoJogador === 'esquivar') {
    logs.push(`💨 ${estado.jogador.nome} se prepara para esquivar do próximo ataque!`);
  } else if (acaoJogador === 'defender') {
    logs.push(`🛡️ ${estado.jogador.nome} assume posição defensiva!`);
  }

  // Verificar se inimigo morreu
  if (resultado.inimigoHP <= 0) {
    logs.push(`\n💀 ${estado.inimigo.nome} foi derrotado!`);
    resultado.fimBatalha = true;
    resultado.vencedor = 'jogador';
    logs.push(`\n📊 HP Final: ${estado.jogador.nome} ${resultado.jogadorHP}/${estado.jogador.hp_maximo}`);
    return { ...resultado, logs };
  }

  // === FASE 2: AÇÃO DO INIMIGO (IA) ===
  logs.push(`\n🔴 ${estado.inimigo.nome} ataca!`);

  // IA escolhe tipo de ataque baseado nos stats
  const tipoAtaqueIA = estado.inimigo.foco > estado.inimigo.forca ? 'magico' : 'fisico';
  const ataqueInimigo = realizarAtaque(estado.inimigo, estado.jogador, tipoAtaqueIA);
  logs.push(...ataqueInimigo.log);

  resultado.inimigoAcertou = ataqueInimigo.acertou;
  resultado.inimigoCritico = ataqueInimigo.critico;

  if (ataqueInimigo.acertou) {
    // Aplicar modificadores baseados na ação defensiva do jogador
    if (acaoJogador === 'esquivar') {
      const esquiva = tentarEsquiva(estado.jogador, ataqueInimigo.totalAtaque);
      logs.push(...esquiva.log);

      if (!esquiva.sucesso) {
        resultado.jogadorDano = ataqueInimigo.dano;
        resultado.jogadorHP = Math.max(0, estado.jogador.hp_atual - ataqueInimigo.dano);
      } else {
        resultado.inimigoAcertou = false; // Esquivou com sucesso
      }
    } else if (acaoJogador === 'defender') {
      const defesa = tentarDefesa(estado.jogador, ataqueInimigo.totalAtaque, ataqueInimigo.dano);
      logs.push(...defesa.log);

      resultado.jogadorDano = defesa.danoFinal;
      resultado.jogadorHP = Math.max(0, estado.jogador.hp_atual - defesa.danoFinal);
    } else {
      // Jogador atacou, recebe dano completo
      resultado.jogadorDano = ataqueInimigo.dano;
      resultado.jogadorHP = Math.max(0, estado.jogador.hp_atual - ataqueInimigo.dano);
    }
  }

  // Verificar se jogador morreu
  if (resultado.jogadorHP <= 0) {
    logs.push(`\n💀 ${estado.jogador.nome} foi derrotado!`);
    resultado.fimBatalha = true;
    resultado.vencedor = 'inimigo';
  }

  // Verificar limite de rodadas
  if (estado.rodada >= CONFIG_D20.RODADAS_MAXIMAS && !resultado.fimBatalha) {
    logs.push(`\n⏱️ Limite de rodadas atingido!`);
    resultado.fimBatalha = true;

    // Quem tem mais HP% vence
    const hpPercentJogador = resultado.jogadorHP / estado.jogador.hp_maximo;
    const hpPercentInimigo = resultado.inimigoHP / estado.inimigo.hp_maximo;

    if (hpPercentJogador > hpPercentInimigo) {
      resultado.vencedor = 'jogador';
      logs.push(`🏆 ${estado.jogador.nome} vence por HP restante!`);
    } else if (hpPercentInimigo > hpPercentJogador) {
      resultado.vencedor = 'inimigo';
      logs.push(`🏆 ${estado.inimigo.nome} vence por HP restante!`);
    } else {
      resultado.vencedor = 'empate';
      logs.push(`🤝 Empate!`);
    }
  }

  // Resumo da rodada
  logs.push(`\n📊 HP: ${estado.jogador.nome} ${resultado.jogadorHP}/${estado.jogador.hp_maximo} | ${estado.inimigo.nome} ${resultado.inimigoHP}/${estado.inimigo.hp_maximo}`);

  return { ...resultado, logs };
}

/**
 * Exportações
 */
export default {
  CONFIG_D20,
  DIFICULDADE_MULTIPLICADOR,
  rolarD20,
  calcularBonusVinculo,
  verificarVantagemElemental,
  calcularMultiplicadorElemental,
  calcularDefesa,
  calcularHP,
  realizarAtaque,
  tentarEsquiva,
  tentarDefesa,
  inicializarBatalhaD20,
  processarTurnoD20
};

// ==================== SISTEMA DE ENERGIA E HABILIDADES ====================
// TODO: Implementar depois de acertar o combate básico
//
// Ideias para habilidades no sistema d20:
// - Cada habilidade tem um custo de energia
// - Energia recupera X por turno
// - Habilidades usam o mesmo sistema de rolagem (1d20 + stat + elemento + vínculo)
// - Habilidades especiais podem ter efeitos adicionais (buff, debuff, DoT, etc)
//
// export function usarHabilidadeD20(atacante, habilidade, defensor) { ... }
// export function calcularCustoEnergia(habilidade) { ... }
// export function recuperarEnergia(avatar) { ... }
// ===========================================================================
