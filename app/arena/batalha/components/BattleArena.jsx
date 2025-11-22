import AvatarSVG from "@/app/components/AvatarSVG";

export default function BattleArena({
  estado,
  animacaoDano,
  animacaoAcao,
  hpJogadorPercent,
  hpInimigoPercent,
  energiaJogadorPercent
}) {
  return (
    <div className="lg:col-span-2 space-y-2">
      {/* Inimigo */}
      <div className="bg-gradient-to-br from-slate-900/90 via-red-950/30 to-slate-900/90 rounded-lg p-4 border-2 border-red-500/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl font-bold text-red-400">{estado.inimigo.nome}</h3>
              <span className="px-2 py-0.5 bg-red-900/50 border border-red-500/50 rounded text-xs text-red-300">
                Lv.{estado.inimigo.nivel}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-0.5 bg-slate-800/50 rounded text-slate-400">
                {estado.inimigo.elemento}
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">{estado.inimigo.raridade}</span>
            </div>

            {/* Debuffs do Inimigo */}
            {estado.inimigo.debuffs && estado.inimigo.debuffs.length > 0 && (
              <div className="flex gap-1 mt-1 flex-wrap">
                {estado.inimigo.debuffs.map((debuff, idx) => (
                  <span key={idx} className="text-base" title={`${debuff.nome} (${debuff.turnos} turnos)`}>
                    {debuff.icone}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="w-28 h-28 flex-shrink-0 relative">
            <AvatarSVG avatar={estado.inimigo} tamanho={112} isEnemy={true} />

            {/* Animacao de dano no inimigo */}
            {animacaoDano && animacaoDano.tipo === 'inimigo' && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 animate-bounce-up pointer-events-none">
                <div className={`text-2xl font-black ${
                  animacaoDano.critico ? 'text-purple-400' : 'text-red-400'
                } drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]`}>
                  {animacaoDano.critico && '💀 '}
                  -{animacaoDano.valor}
                  {animacaoDano.critico && ' !'}
                </div>
              </div>
            )}

            {/* Indicador de acao no inimigo */}
            {animacaoAcao && animacaoAcao.alvo === 'inimigo' && (
              <div className="absolute inset-0 border-2 border-red-500 rounded-full animate-ping"></div>
            )}
          </div>
        </div>

        {/* HP do Inimigo */}
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400 font-semibold">HP</span>
            <span className="text-red-400 font-mono font-bold text-xs">{estado.inimigo.hp_atual} / {estado.inimigo.hp_maximo}</span>
          </div>
          <div className="relative w-full bg-slate-800 rounded-full h-4 overflow-hidden border border-slate-700">
            <div
              className="bg-gradient-to-r from-red-600 via-red-500 to-red-600 h-4 transition-all duration-500 relative"
              style={{width: `${hpInimigoPercent}%`}}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-white/10"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              {Math.round(hpInimigoPercent)}%
            </div>
          </div>
        </div>
      </div>

      {/* VS */}
      <div className="text-center py-1">
        <div className="inline-block bg-gradient-to-r from-red-900/50 via-orange-900/80 to-cyan-900/50 px-6 py-1.5 rounded-full border-2 border-orange-500 text-orange-400 font-black text-lg animate-pulse shadow-lg shadow-orange-500/30">
          ⚔️ VS ⚔️
        </div>
      </div>

      {/* Jogador */}
      <div className="bg-gradient-to-br from-slate-900/90 via-cyan-950/30 to-slate-900/90 rounded-lg p-4 border-2 border-cyan-500/50">
        <div className="flex items-center justify-between mb-2">
          <div className="w-28 h-28 flex-shrink-0 relative">
            <AvatarSVG avatar={estado.jogador} tamanho={112} isEnemy={false} />

            {/* Animacao de dano no jogador */}
            {animacaoDano && animacaoDano.tipo === 'jogador' && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 animate-bounce-up pointer-events-none">
                <div className={`text-2xl font-black ${
                  animacaoDano.critico ? 'text-purple-400' : 'text-red-400'
                } drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]`}>
                  {animacaoDano.critico && '💀 '}
                  -{animacaoDano.valor}
                  {animacaoDano.critico && ' !'}
                </div>
              </div>
            )}

            {/* Indicador de defesa */}
            {animacaoAcao && animacaoAcao.tipo === 'defender' && (
              <div className="absolute inset-0 border-2 border-blue-500 rounded-full animate-ping"></div>
            )}
          </div>

          <div className="text-right flex-1 ml-3">
            <div className="flex items-center justify-end gap-2 mb-1">
              <span className="px-2 py-0.5 bg-cyan-900/50 border border-cyan-500/50 rounded text-xs text-cyan-300">
                Lv.{estado.jogador.nivel}
              </span>
              <h3 className="text-xl font-bold text-cyan-400">{estado.jogador.nome}</h3>
            </div>
            <div className="flex items-center justify-end gap-2 text-xs">
              <span className="text-slate-400">{estado.jogador.raridade}</span>
              <span className="text-slate-500">•</span>
              <span className="px-2 py-0.5 bg-slate-800/50 rounded text-slate-400">
                {estado.jogador.elemento}
              </span>
            </div>

            {/* Buffs do Jogador */}
            {estado.jogador.buffs && estado.jogador.buffs.length > 0 && (
              <div className="flex gap-1 mt-1 flex-wrap justify-end">
                {estado.jogador.buffs.map((buff, idx) => (
                  <span key={idx} className="text-base" title={`${buff.nome} (${buff.turnos} turnos)`}>
                    {buff.icone}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* HP do Jogador */}
        <div className="mb-2 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400 font-semibold">HP</span>
            <span className="text-green-400 font-mono font-bold text-xs">{estado.jogador.hp_atual} / {estado.jogador.hp_maximo}</span>
          </div>
          <div className="relative w-full bg-slate-800 rounded-full h-4 overflow-hidden border border-slate-700">
            <div
              className="bg-gradient-to-r from-green-600 via-green-500 to-green-600 h-4 transition-all duration-500 relative"
              style={{width: `${hpJogadorPercent}%`}}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-white/10"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              {Math.round(hpJogadorPercent)}%
            </div>
          </div>
        </div>

        {/* Energia do Jogador */}
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400 font-semibold">Energia</span>
            <span className="text-blue-400 font-mono font-bold text-xs">{estado.jogador.energia_atual} / {estado.jogador.energia_maxima || 100}</span>
          </div>
          <div className="relative w-full bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-700">
            <div
              className="bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 h-3 transition-all duration-500 relative"
              style={{width: `${energiaJogadorPercent}%`}}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-white/10"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              {estado.jogador.energia_atual}
            </div>
          </div>
        </div>

        {/* Indicador de Exaustao */}
        {estado.jogador.exaustao > 0 && (
          <div className="mt-2 pt-2 border-t border-slate-700">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-400">Exaustao</span>
              <span className={`font-bold ${
                estado.jogador.exaustao >= 80 ? 'text-red-500' :
                estado.jogador.exaustao >= 60 ? 'text-red-400' :
                estado.jogador.exaustao >= 40 ? 'text-orange-400' :
                estado.jogador.exaustao >= 20 ? 'text-yellow-400' :
                'text-green-400'
              }`}>
                {estado.jogador.exaustao >= 80 ? '💀' :
                 estado.jogador.exaustao >= 60 ? '🔴' :
                 estado.jogador.exaustao >= 40 ? '🟠' :
                 estado.jogador.exaustao >= 20 ? '💛' :
                 '💚'} {estado.jogador.exaustao}/100
              </span>
            </div>
            <div className="relative w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 transition-all duration-500 ${
                  estado.jogador.exaustao >= 80 ? 'bg-red-600' :
                  estado.jogador.exaustao >= 60 ? 'bg-red-500' :
                  estado.jogador.exaustao >= 40 ? 'bg-orange-500' :
                  estado.jogador.exaustao >= 20 ? 'bg-yellow-500' :
                  'bg-green-500'
                }`}
                style={{width: `${estado.jogador.exaustao}%`}}
              ></div>
            </div>
            {estado.jogador.exaustao >= 60 && (
              <div className="text-[10px] text-red-400 mt-1 flex items-center gap-1">
                <span>⚠️</span>
                <span>Stats reduzidos!</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
