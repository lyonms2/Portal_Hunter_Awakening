/**
 * Configurações e constantes do sistema de avatares
 */

// Limite de avatares que o jogador pode ter
export const LIMITE_AVATARES = 15;

// Cores de raridade
export const CORES_RARIDADE = {
  'Lendário': 'from-amber-500 to-yellow-500',
  'Raro': 'from-purple-500 to-pink-500',
  'Comum': 'from-slate-600 to-slate-700'
};

// Cores de borda por raridade
export const CORES_BORDA = {
  'Lendário': 'border-amber-500/50',
  'Raro': 'border-purple-500/50',
  'Comum': 'border-slate-700/50'
};

// Cores por elemento
export const CORES_ELEMENTO = {
  'Fogo': 'text-orange-400',
  'Água': 'text-blue-400',
  'Terra': 'text-amber-600',
  'Vento': 'text-cyan-400',
  'Eletricidade': 'text-yellow-400',
  'Sombra': 'text-purple-400',
  'Luz': 'text-yellow-200'
};

// Emojis por elemento
export const EMOJIS_ELEMENTO = {
  'Fogo': '🔥',
  'Água': '💧',
  'Terra': '🪨',
  'Vento': '💨',
  'Eletricidade': '⚡',
  'Sombra': '🌑',
  'Luz': '✨'
};

// Níveis de exaustão
export const NIVEIS_EXAUSTAO = [
  { max: 0, label: 'Descansado', cor: 'text-green-400' },
  { max: 20, label: 'Alerta', cor: 'text-cyan-400' },
  { max: 40, label: 'Cansado', cor: 'text-yellow-400' },
  { max: 60, label: 'Exausto', cor: 'text-orange-400' },
  { max: 80, label: 'Colapso Iminente', cor: 'text-red-400' },
  { max: Infinity, label: 'Colapsado', cor: 'text-red-600' }
];
