import { RARIDADE_HABILIDADE } from './constants.js';
import { HABILIDADES_POR_ELEMENTO } from './data/index.js';
import { EFEITOS_STATUS } from './statusEffects.js';

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
