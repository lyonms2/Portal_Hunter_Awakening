export default function BattleLog({ log }) {
  return (
    <div className="mt-2 bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90 rounded-lg border-2 border-slate-700/50 overflow-hidden">
      <div className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 px-4 py-2 border-b border-cyan-500/30">
        <h3 className="text-cyan-400 font-bold text-sm flex items-center gap-2">
          <span className="text-base">📜</span>
          LOG DE COMBATE
          <span className="text-xs text-slate-500 ml-auto">Ultima acao no topo</span>
        </h3>
      </div>

      <div className="max-h-48 overflow-y-auto p-4 space-y-2">
        {log.slice().reverse().map((entry, i) => {
          const texto = entry.texto;

          // Determinar cor baseada no conteudo
          let bgColor = 'bg-slate-800/40';
          let textColor = 'text-slate-300';
          let borderColor = 'border-slate-700/50';
          let icon = '•';

          if (texto.includes('VITORIA') || texto.includes('🎉')) {
            bgColor = 'bg-green-900/30';
            textColor = 'text-green-300';
            borderColor = 'border-green-500/30';
            icon = '🎉';
          } else if (texto.includes('DERROTA') || texto.includes('☠️')) {
            bgColor = 'bg-red-900/30';
            textColor = 'text-red-300';
            borderColor = 'border-red-500/30';
            icon = '☠️';
          } else if (texto.includes('💥') || texto.includes('dano')) {
            bgColor = 'bg-orange-900/20';
            textColor = 'text-orange-200';
            borderColor = 'border-orange-500/20';
            icon = '💥';
          } else if (texto.includes('🛡️') || texto.includes('Defesa')) {
            bgColor = 'bg-blue-900/20';
            textColor = 'text-blue-200';
            borderColor = 'border-blue-500/20';
            icon = '🛡️';
          } else if (texto.includes('⚡') || texto.includes('energia')) {
            bgColor = 'bg-yellow-900/20';
            textColor = 'text-yellow-200';
            borderColor = 'border-yellow-500/20';
            icon = '⚡';
          } else if (texto.includes('🎯')) {
            bgColor = 'bg-purple-900/20';
            textColor = 'text-purple-200';
          } else if (texto.includes('🎲') || texto.includes('1d20')) {
            bgColor = 'bg-indigo-900/20';
            textColor = 'text-indigo-200';
            borderColor = 'border-indigo-500/20';
            icon = '🎲';
          } else if (texto.includes('CRITICO') || texto.includes('nat 20')) {
            bgColor = 'bg-amber-900/30';
            textColor = 'text-amber-200';
            borderColor = 'border-amber-500/30';
            icon = '💀';
          } else if (texto.includes('ESQUIVOU') || texto.includes('esquiva')) {
            bgColor = 'bg-emerald-900/20';
            textColor = 'text-emerald-200';
            borderColor = 'border-emerald-500/20';
            icon = '💨';
          } else if (texto.includes('Rodada')) {
            bgColor = 'bg-cyan-900/20';
            textColor = 'text-cyan-200';
            borderColor = 'border-cyan-500/20';
            icon = '⏰';
          } else if (texto.includes('━━━')) {
            bgColor = 'bg-slate-700/30';
            borderColor = 'border-slate-600/30';
            icon = '';
          } else if (texto.includes('🤖') || texto.includes('oponente')) {
            bgColor = 'bg-red-900/20';
            textColor = 'text-red-200';
            borderColor = 'border-red-500/20';
            icon = '🤖';
          } else if (texto.includes('⏰') || texto.includes('Rodada')) {
            bgColor = 'bg-cyan-900/20';
            textColor = 'text-cyan-200';
            borderColor = 'border-cyan-500/20';
            icon = '⏰';
          }

          return (
            <div
              key={i}
              className={`${bgColor} ${textColor} px-3 py-2 rounded border ${borderColor} text-xs font-mono leading-relaxed transition-all hover:scale-[1.02] hover:shadow-md`}
            >
              {icon && <span className="mr-2">{icon}</span>}
              {texto.replace(icon, '').trim()}
            </div>
          );
        })}

        {log.length === 0 && (
          <div className="text-center text-slate-500 py-8 text-sm">
            ⚔️ A batalha esta prestes a comecar...
          </div>
        )}
      </div>
    </div>
  );
}
