import { calcularDefesa } from "@/lib/combat/d20CombatSystem";

export default function BattleActions({
  estado,
  turnoIA,
  processando,
  executarAcao
}) {
  return (
    <div className="bg-slate-900/80 rounded-lg p-6 border-2 border-slate-700">
      <h3 className="text-cyan-400 font-bold mb-4">🎲 ACOES D20</h3>

      {/* Ataques */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          onClick={() => !turnoIA && !processando && executarAcao('ataque_fisico')}
          disabled={turnoIA || processando}
          className="p-4 rounded-lg border-2 transition-all text-left bg-gradient-to-r from-red-900/40 to-orange-900/40 border-red-500 hover:from-red-900/60 hover:to-orange-900/60 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
        >
          <div className="font-bold text-red-300 text-lg mb-1">⚔️ Ataque Fisico</div>
          <div className="text-xs text-slate-300">1d20 + Forca</div>
          <div className="mt-2 text-xs text-orange-400">🎯 Forca: {estado.jogador.forca}</div>
        </button>

        <button
          onClick={() => !turnoIA && !processando && executarAcao('ataque_magico')}
          disabled={turnoIA || processando}
          className="p-4 rounded-lg border-2 transition-all text-left bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border-purple-500 hover:from-purple-900/60 hover:to-indigo-900/60 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
        >
          <div className="font-bold text-purple-300 text-lg mb-1">✨ Ataque Magico</div>
          <div className="text-xs text-slate-300">1d20 + Foco</div>
          <div className="mt-2 text-xs text-purple-400">🔮 Foco: {estado.jogador.foco}</div>
        </button>
      </div>

      {/* Acoes Defensivas */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => !turnoIA && !processando && executarAcao('esquivar')}
          disabled={turnoIA || processando}
          className="p-4 rounded-lg border-2 transition-all text-left bg-gradient-to-r from-green-900/40 to-emerald-900/40 border-green-500 hover:from-green-900/60 hover:to-emerald-900/60 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
        >
          <div className="font-bold text-green-300 text-lg mb-1">💨 Esquivar</div>
          <div className="text-xs text-slate-300">Tenta evitar o ataque</div>
          <div className="mt-2 text-xs text-green-400">🏃 Agilidade: {estado.jogador.agilidade}</div>
        </button>

        <button
          onClick={() => !turnoIA && !processando && executarAcao('defender')}
          disabled={turnoIA || processando}
          className="p-4 rounded-lg border-2 transition-all text-left bg-gradient-to-r from-blue-900/40 to-cyan-900/40 border-blue-500 hover:from-blue-900/60 hover:to-cyan-900/60 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
        >
          <div className="font-bold text-blue-300 text-lg mb-1">🛡️ Defender</div>
          <div className="text-xs text-slate-300">Reduz dano recebido</div>
          <div className="mt-2 text-xs text-blue-400">🛡️ Resistencia: {estado.jogador.resistencia}</div>
        </button>
      </div>

      {/* Info D20 */}
      <div className="mt-4 pt-4 border-t border-slate-700 text-xs text-slate-500">
        <div className="flex justify-between">
          <span>🎲 Critico: nat 20 (2x dano)</span>
          <span>🛡️ Defesa: {calcularDefesa(estado.jogador)}</span>
        </div>
        {estado.penalidade_exaustao > 0 && (
          <div className="mt-2 text-orange-400 text-center">
            ⚠️ Exaustao: -{Math.round(estado.penalidade_exaustao * 100)}% stats
          </div>
        )}
      </div>
    </div>
  );
}
