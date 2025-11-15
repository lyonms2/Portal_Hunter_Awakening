/**
 * Centraliza exports de funções de lógica do jogo
 * Re-exporta de diferentes módulos para facilitar imports
 */

// Stats e HP
export {
  calcularHPMaximoCompleto
} from './combat/statsCalculator';

/**
 * Calcula poder total de um avatar (soma de todos os stats)
 */
export function calcularPoderTotal(avatar) {
  if (!avatar) return 0;
  const forca = avatar.forca || 0;
  const agilidade = avatar.agilidade || 0;
  const resistencia = avatar.resistencia || 0;
  const foco = avatar.foco || 0;
  return forca + agilidade + resistencia + foco;
}

// Exaustão
export {
  getNivelExaustao,
  aplicarPenalidadesExaustao
} from '../app/avatares/sistemas/exhaustionSystem';

// Vínculo
export {
  getNivelVinculo,
  aplicarBonusVinculo
} from '../app/avatares/sistemas/bondSystem';

// Habilidades e Dano
export {
  calcularDanoHabilidade
} from '../app/avatares/sistemas/abilitiesSystem';

/**
 * Calcula chance de acerto baseado em stats
 */
export function calcularChanceAcerto(atacante, defensor) {
  const agilidadeAtacante = atacante?.agilidade || 0;
  const agilidadeDefensor = defensor?.agilidade || 0;

  let chance = 85; // Base de 85%
  chance += (agilidadeAtacante - agilidadeDefensor) * 0.5;

  return Math.max(30, Math.min(95, chance));
}

/**
 * Calcula dano crítico
 */
export function calcularDanoCritico(danoBase, stats) {
  const multiplicador = 1.5 + ((stats?.foco || 0) / 100);
  return Math.floor(danoBase * multiplicador);
}

// Batalha
export {
  calcularDano
} from './arena/batalhaEngine';

// Elementos
export {
  calcularVantagemElemental
} from '../app/avatares/sistemas/elementalSystem';
