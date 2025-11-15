/**
 * Centraliza exports de funções de lógica do jogo
 * Re-exporta de diferentes módulos para facilitar imports
 */

// Stats e HP
export {
  calcularHPMaximoCompleto,
  calcularPoderTotal
} from './combat/statsCalculator';

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
  calcularDanoHabilidade,
  calcularChanceAcerto,
  calcularDanoCritico
} from '../app/avatares/sistemas/abilitiesSystem';

// Batalha
export {
  calcularDano,
  calcularVantagemElemental
} from './arena/batalhaEngine';
