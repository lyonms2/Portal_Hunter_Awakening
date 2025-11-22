export default function BattleResult({ resultado, voltarAoLobby }) {
  if (!resultado) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-slate-900 rounded-lg border-2 border-cyan-500 p-8">
        <div className="text-center mb-6">
          {resultado.vencedor === 'jogador' && (
            <>
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-4xl font-black text-green-400 mb-2">VITORIA!</h2>
            </>
          )}

          {resultado.vencedor === 'inimigo' && (
            <>
              <div className="text-6xl mb-4">☠️</div>
              <h2 className="text-4xl font-black text-red-400 mb-2">DERROTA</h2>
            </>
          )}

          {resultado.vencedor === 'empate' && (
            <>
              <div className="text-6xl mb-4">⚖️</div>
              <h2 className="text-4xl font-black text-yellow-400 mb-2">EMPATE</h2>
            </>
          )}
        </div>

        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <h3 className="text-cyan-400 font-bold mb-4 text-center">🎁 RECOMPENSAS</h3>

          {/* Modo PvP ou Sobrevivencia: Mostrar XP + Moedas */}
          {resultado.pvp || resultado.modo === 'sobrevivencia' ? (
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-4 bg-slate-900 rounded">
                <div className="text-3xl font-bold text-blue-400">{resultado.recompensas.xp}</div>
                <div className="text-xs text-slate-400">XP Ganho</div>
              </div>
              <div className="text-center p-4 bg-slate-900 rounded">
                <div className="text-3xl font-bold text-yellow-400">{resultado.recompensas.moedas}</div>
                <div className="text-xs text-slate-400">Moedas</div>
              </div>
            </div>
          ) : (
            /* Modo Treino: Mostrar apenas XP (centralizado) */
            <div className="mb-4">
              <div className="text-center p-4 bg-slate-900 rounded">
                <div className="text-3xl font-bold text-blue-400">{resultado.recompensas.xp}</div>
                <div className="text-xs text-slate-400">XP Ganho</div>
              </div>
            </div>
          )}

          {resultado.recompensas.fragmentos > 0 && (
            <div className="text-center p-3 bg-purple-900/30 rounded border border-purple-500/50 mb-4">
              <span className="text-purple-400 font-bold">
                💎 +{resultado.recompensas.fragmentos} Fragmento(s)!
              </span>
            </div>
          )}

          {/* Fama (PvP) */}
          {resultado.pvp && resultado.recompensas.fama !== undefined && (
            <div className={`text-center p-4 rounded border mb-4 ${
              resultado.recompensas.fama > 0
                ? 'bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border-yellow-500/50'
                : 'bg-gradient-to-r from-red-900/30 to-orange-900/30 border-red-500/50'
            }`}>
              <div className="text-4xl mb-2">
                {resultado.recompensas.fama > 0 ? '🏆' : '📉'}
              </div>
              <div className={`text-3xl font-black ${
                resultado.recompensas.fama > 0 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {resultado.recompensas.fama > 0 ? '+' : ''}{resultado.recompensas.fama}
              </div>
              <div className="text-sm text-slate-400">Fama</div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mb-4">
            {!resultado.pvp && resultado.recompensas.exaustao && (
              <div className="text-center p-3 bg-orange-900/30 rounded border border-orange-500/50">
                <span className="text-orange-400 text-sm">
                  😰 +{resultado.recompensas.exaustao} Exaustao
                </span>
              </div>
            )}
            {resultado.pvp && resultado.recompensas.exaustao && (
              <div className="text-center p-3 bg-orange-900/30 rounded border border-orange-500/50">
                <span className="text-orange-400 text-sm">
                  😰 +{resultado.recompensas.exaustao} Exaustao
                </span>
              </div>
            )}
            {resultado.recompensas.vinculo !== undefined && (
              <div className={`text-center p-3 rounded border ${
                resultado.recompensas.vinculo > 0
                  ? 'bg-green-900/30 border-green-500/50'
                  : 'bg-red-900/30 border-red-500/50'
              }`}>
                <span className={`text-sm font-bold ${
                  resultado.recompensas.vinculo > 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {resultado.recompensas.vinculo > 0 ? '💚' : '💔'} {resultado.recompensas.vinculo > 0 ? '+' : ''}{resultado.recompensas.vinculo} Vinculo
                </span>
              </div>
            )}
          </div>

          {resultado.recompensas.mensagens && resultado.recompensas.mensagens.length > 0 && (
            <div className="mt-4 space-y-2">
              {resultado.recompensas.mensagens.map((msg, i) => (
                <div key={i} className="text-sm text-cyan-300 text-center">
                  {msg}
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={voltarAoLobby}
          className="w-full px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition-colors"
        >
          {resultado.pvp ? '← Voltar ao PvP' : '← Voltar ao Treinamento'}
        </button>
      </div>
    </div>
  );
}
