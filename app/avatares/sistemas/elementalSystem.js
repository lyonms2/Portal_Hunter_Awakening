// ==================== SISTEMA ELEMENTAL ====================
// Arquivo: /app/avatares/sistemas/elementalSystem.js

/**
 * Sistema completo de elementos com vantagens, desvantagens e características
 */

export const ELEMENTOS = {
  FOGO: 'Fogo',
  AGUA: 'Água',
  TERRA: 'Terra',
  VENTO: 'Vento',
  ELETRICIDADE: 'Eletricidade',
  SOMBRA: 'Sombra',
  LUZ: 'Luz'
};

/**
 * Matriz de vantagens elementais
 * Retorna o multiplicador de dano
 * 1.5 = super efetivo
 * 1.0 = neutro
 * 0.75 = pouco efetivo
 * 0.5 = muito pouco efetivo
 */
export const VANTAGENS_ELEMENTAIS = {
  [ELEMENTOS.FOGO]: {
    forte_contra: [ELEMENTOS.VENTO],
    fraco_contra: [ELEMENTOS.AGUA],
    neutro: [ELEMENTOS.TERRA, ELEMENTOS.ELETRICIDADE],
    oposto: null
  },
  [ELEMENTOS.AGUA]: {
    forte_contra: [ELEMENTOS.FOGO],
    fraco_contra: [ELEMENTOS.ELETRICIDADE],
    neutro: [ELEMENTOS.TERRA, ELEMENTOS.VENTO],
    oposto: null
  },
  [ELEMENTOS.TERRA]: {
    forte_contra: [ELEMENTOS.ELETRICIDADE],
    fraco_contra: [ELEMENTOS.VENTO],
    neutro: [ELEMENTOS.FOGO, ELEMENTOS.AGUA],
    oposto: null
  },
  [ELEMENTOS.VENTO]: {
    forte_contra: [ELEMENTOS.TERRA],
    fraco_contra: [ELEMENTOS.FOGO],
    neutro: [ELEMENTOS.AGUA, ELEMENTOS.ELETRICIDADE],
    oposto: null
  },
  [ELEMENTOS.ELETRICIDADE]: {
    forte_contra: [ELEMENTOS.AGUA],
    fraco_contra: [ELEMENTOS.TERRA],
    neutro: [ELEMENTOS.FOGO, ELEMENTOS.VENTO],
    oposto: null
  },
  [ELEMENTOS.SOMBRA]: {
    forte_contra: [ELEMENTOS.LUZ],
    fraco_contra: [ELEMENTOS.LUZ],
    neutro: [ELEMENTOS.FOGO, ELEMENTOS.AGUA, ELEMENTOS.TERRA, ELEMENTOS.VENTO, ELEMENTOS.ELETRICIDADE],
    oposto: ELEMENTOS.LUZ
  },
  [ELEMENTOS.LUZ]: {
    forte_contra: [ELEMENTOS.SOMBRA],
    fraco_contra: [ELEMENTOS.SOMBRA],
    neutro: [ELEMENTOS.FOGO, ELEMENTOS.AGUA, ELEMENTOS.TERRA, ELEMENTOS.VENTO, ELEMENTOS.ELETRICIDADE],
    oposto: ELEMENTOS.SOMBRA
  }
};

/**
 * Calcula o multiplicador de dano baseado nos elementos
 * @param {string} elementoAtacante - Elemento do atacante
 * @param {string} elementoDefensor - Elemento do defensor
 * @returns {number} Multiplicador de dano (0.5, 0.75, 1.0, 1.5, 2.0)
 */
export function calcularVantagemElemental(elementoAtacante, elementoDefensor) {
  // Mesmo elemento = neutro
  if (elementoAtacante === elementoDefensor) {
    return 1.0;
  }

  const vantagens = VANTAGENS_ELEMENTAIS[elementoAtacante];
  
  if (!vantagens) {
    return 1.0; // Elemento inválido
  }

  // Verifica se é oposto (Luz vs Sombra)
  if (vantagens.oposto === elementoDefensor) {
    return 2.0; // Dano extremo contra oposto
  }

  // Super efetivo
  if (vantagens.forte_contra.includes(elementoDefensor)) {
    return 1.5;
  }

  // Pouco efetivo
  if (vantagens.fraco_contra.includes(elementoDefensor)) {
    return 0.75;
  }

  // Neutro (padrão)
  return 1.0;
}

/**
 * Características únicas de cada elemento
 * Define tendências de stats e comportamentos
 */
export const CARACTERISTICAS_ELEMENTAIS = {
  [ELEMENTOS.FOGO]: {
    stat_primaria: 'forca',
    stat_secundaria: 'agilidade',
    stat_fraca: 'resistencia',
    descricao: 'Especializado em causar dano massivo e rápido',
    bonus_passivo: {
      tipo: 'critico',
      valor: 0.15, // +15% chance de crítico
      descricao: 'Chamas Intensas: +15% chance de acerto crítico'
    },
    estilo_combate: 'Ofensivo',
    cor_primaria: '#FF4500',
    cor_secundaria: '#FF8C00'
  },
  [ELEMENTOS.AGUA]: {
    stat_primaria: 'resistencia',
    stat_secundaria: 'foco',
    stat_fraca: 'forca',
    descricao: 'Mestre da cura e controle, com alta sustentação',
    bonus_passivo: {
      tipo: 'regeneracao',
      valor: 0.03, // 3% de vida por turno
      descricao: 'Cura das Marés: Regenera 3% de vida por turno'
    },
    estilo_combate: 'Suporte/Tank',
    cor_primaria: '#1E90FF',
    cor_secundaria: '#00CED1'
  },
  [ELEMENTOS.TERRA]: {
    stat_primaria: 'resistencia',
    stat_secundaria: 'forca',
    stat_fraca: 'agilidade',
    descricao: 'Defensor imbatível com contraataques devastadores',
    bonus_passivo: {
      tipo: 'reducao_dano',
      valor: 0.20, // -20% de dano recebido
      descricao: 'Pele de Rocha: Reduz 20% do dano recebido'
    },
    estilo_combate: 'Tanque',
    cor_primaria: '#8B4513',
    cor_secundaria: '#D2691E'
  },
  [ELEMENTOS.VENTO]: {
    stat_primaria: 'agilidade',
    stat_secundaria: 'foco',
    stat_fraca: 'resistencia',
    descricao: 'Veloz e evasivo, ataca múltiplas vezes',
    bonus_passivo: {
      tipo: 'evasao',
      valor: 0.25, // +25% de evasão
      descricao: 'Velocidade do Vento: +25% de chance de esquiva'
    },
    estilo_combate: 'Assassino',
    cor_primaria: '#87CEEB',
    cor_secundaria: '#B0E0E6'
  },
  [ELEMENTOS.ELETRICIDADE]: {
    stat_primaria: 'foco',
    stat_secundaria: 'agilidade',
    stat_fraca: 'resistencia',
    descricao: 'Poder devastador com chance de paralisar inimigos',
    bonus_passivo: {
      tipo: 'paralisia',
      valor: 0.20, // 20% chance de paralisar
      descricao: 'Sobrecarga: 20% de chance de paralisar o alvo'
    },
    estilo_combate: 'Mago de Dano',
    cor_primaria: '#FFD700',
    cor_secundaria: '#FFA500'
  },
  [ELEMENTOS.SOMBRA]: {
    stat_primaria: 'foco',
    stat_secundaria: 'forca',
    stat_fraca: 'agilidade',
    descricao: 'Drena vida dos inimigos e enfraquece oponentes',
    bonus_passivo: {
      tipo: 'roubo_vida',
      valor: 0.15, // 15% de roubo de vida
      descricao: 'Abraço das Trevas: Rouba 15% da vida causada como dano'
    },
    estilo_combate: 'Bruxo',
    cor_primaria: '#4B0082',
    cor_secundaria: '#8B008B'
  },
  [ELEMENTOS.LUZ]: {
    stat_primaria: 'foco',
    stat_secundaria: 'resistencia',
    stat_fraca: 'forca',
    descricao: 'Cura aliados e causa dano massivo contra as trevas',
    bonus_passivo: {
      tipo: 'purificacao',
      valor: 0.10, // 10% de buff para aliados
      descricao: 'Benção da Luz: +10% em todos os stats de aliados próximos'
    },
    estilo_combate: 'Clérigo',
    cor_primaria: '#FFD700',
    cor_secundaria: '#FFFFFF'
  }
};

/**
 * Retorna as características de um elemento
 * @param {string} elemento - Nome do elemento
 * @returns {Object} Características do elemento
 */
export function getCaracteristicasElemento(elemento) {
  return CARACTERISTICAS_ELEMENTAIS[elemento] || null;
}

/**
 * Calcula bônus de stats baseado no elemento
 * @param {string} elemento - Elemento do avatar
 * @param {Object} statsBase - Stats base do avatar
 * @returns {Object} Stats com bônus elementais aplicados
 */
export function aplicarBonusElemental(elemento, statsBase) {
  const caracteristicas = getCaracteristicasElemento(elemento);
  
  if (!caracteristicas) {
    return statsBase;
  }

  const statsComBonus = { ...statsBase };

  // Aumenta stat primária em 20%
  const statPrimaria = caracteristicas.stat_primaria;
  statsComBonus[statPrimaria] = Math.floor(statsBase[statPrimaria] * 1.20);

  // Aumenta stat secundária em 10%
  const statSecundaria = caracteristicas.stat_secundaria;
  statsComBonus[statSecundaria] = Math.floor(statsBase[statSecundaria] * 1.10);

  // Reduz stat fraca em 10%
  const statFraca = caracteristicas.stat_fraca;
  statsComBonus[statFraca] = Math.floor(statsBase[statFraca] * 0.90);

  return statsComBonus;
}

/**
 * Gera descrição de matchup entre dois elementos
 * @param {string} elemento1 - Primeiro elemento
 * @param {string} elemento2 - Segundo elemento
 * @returns {string} Descrição do matchup
 */
export function getDescricaoMatchup(elemento1, elemento2) {
  const multiplicador = calcularVantagemElemental(elemento1, elemento2);
  
  if (multiplicador === 2.0) {
    return `${elemento1} é EXTREMAMENTE EFETIVO contra ${elemento2}! (2x dano)`;
  } else if (multiplicador === 1.5) {
    return `${elemento1} é super efetivo contra ${elemento2}! (1.5x dano)`;
  } else if (multiplicador === 1.0) {
    return `${elemento1} causa dano neutro em ${elemento2}.`;
  } else if (multiplicador === 0.75) {
    return `${elemento1} é pouco efetivo contra ${elemento2}. (0.75x dano)`;
  } else if (multiplicador === 0.5) {
    return `${elemento1} é MUITO POUCO EFETIVO contra ${elemento2}! (0.5x dano)`;
  }
  
  return 'Matchup indefinido.';
}

/**
 * Retorna todos os elementos disponíveis
 * @returns {Array} Lista de elementos
 */
export function getTodosElementos() {
  return Object.values(ELEMENTOS);
}

/**
 * Valida se um elemento existe
 * @param {string} elemento - Elemento a validar
 * @returns {boolean} True se o elemento é válido
 */
export function isElementoValido(elemento) {
  return Object.values(ELEMENTOS).includes(elemento);
}

// ==================== TABELA DE REFERÊNCIA RÁPIDA ====================

export const TABELA_VANTAGENS = `
╔════════════════════════════════════════════════════════════════╗
║              TABELA DE VANTAGENS ELEMENTAIS                    ║
╠════════════════════════════════════════════════════════════════╣
║ 🔥 FOGO                                                        ║
║   ├─ Forte contra: 💨 Vento, 🪨 Terra                         ║
║   └─ Fraco contra: 💧 Água                                     ║
╠════════════════════════════════════════════════════════════════╣
║ 💧 ÁGUA                                                        ║
║   ├─ Forte contra: 🔥 Fogo, 🪨 Terra                          ║
║   └─ Fraco contra: ⚡ Eletricidade, 💨 Vento                  ║
╠════════════════════════════════════════════════════════════════╣
║ 🪨 TERRA                                                       ║
║   ├─ Forte contra: ⚡ Eletricidade, 💨 Vento                  ║
║   └─ Fraco contra: 🔥 Fogo, 💧 Água                           ║
╠════════════════════════════════════════════════════════════════╣
║ 💨 VENTO                                                       ║
║   ├─ Forte contra: 💧 Água                                     ║
║   └─ Fraco contra: 🔥 Fogo, 🪨 Terra                          ║
╠════════════════════════════════════════════════════════════════╣
║ ⚡ ELETRICIDADE                                                ║
║   ├─ Forte contra: 💧 Água, 💨 Vento                          ║
║   └─ Fraco contra: 🪨 Terra                                    ║
╠════════════════════════════════════════════════════════════════╣
║ 🌑 SOMBRA ↔ ✨ LUZ (Opostos - 2x dano mútuo)                  ║
║   └─ Neutros contra elementos físicos                          ║
╚════════════════════════════════════════════════════════════════╝
`;

// Exportação default para facilitar imports
export default {
  ELEMENTOS,
  VANTAGENS_ELEMENTAIS,
  CARACTERISTICAS_ELEMENTAIS,
  calcularVantagemElemental,
  getCaracteristicasElemento,
  aplicarBonusElemental,
  getDescricaoMatchup,
  getTodosElementos,
  isElementoValido,
  TABELA_VANTAGENS
};
