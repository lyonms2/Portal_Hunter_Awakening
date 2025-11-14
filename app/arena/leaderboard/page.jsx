"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getLeaderboard, getJogadoresProximos } from "../../../lib/pvp/leaderboardSystem";
import { getInfoTemporada, calcularRecompensasTemporada } from "../../../lib/pvp/seasonSystem";

export default function LeaderboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [infoTemporada, setInfoTemporada] = useState(null);
  const [filtroTier, setFiltroTier] = useState('TODOS');
  const [visualizacao, setVisualizacao] = useState('top100'); // top100, proximos
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    carregarLeaderboard(parsedUser.id);

    // Carregar info da temporada
    const tempInfo = getInfoTemporada();
    setInfoTemporada(tempInfo);
  }, [router]);

  const carregarLeaderboard = async (userId) => {
    try {
      setLoading(true);

      // Buscar ranking do jogador
      let famaJogador = 1000;
      try {
        const response = await fetch(`/api/pvp/ranking?userId=${userId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.ranking) {
            famaJogador = data.ranking.fama || 1000;
          }
        }
      } catch (error) {
        console.warn('Erro ao buscar ranking, usando localStorage:', error);
        const rankingData = JSON.parse(localStorage.getItem(`pvp_ranking_${userId}`) || '{"fama": 1000}');
        famaJogador = rankingData.fama || 1000;
      }

      // Carregar leaderboard (agora é async)
      const lbData = await getLeaderboard(userId, famaJogador);
      setLeaderboardData(lbData);
    } catch (error) {
      console.error('Erro ao carregar leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950 flex items-center justify-center">
        <div className="text-purple-400 font-mono animate-pulse">Carregando Leaderboard...</div>
      </div>
    );
  }

  const leaderboardFiltrado = filtroTier === 'TODOS'
    ? leaderboardData.leaderboard
    : leaderboardData.leaderboard.filter(p => p.tier === filtroTier);

  const jogadoresExibir = visualizacao === 'proximos'
    ? getJogadoresProximos(leaderboardData.leaderboard, leaderboardData.posicaoJogador, 10)
    : leaderboardFiltrado;

  const recompensasJogador = leaderboardData.posicaoJogador
    ? calcularRecompensasTemporada(leaderboardData.posicaoJogador)
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950 text-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent mb-2">
              🏆 LEADERBOARD
            </h1>
            <p className="text-slate-400 font-mono text-sm">
              {infoTemporada.nome} • Termina em {infoTemporada.diasRestantes} dias
            </p>
          </div>

          <button
            onClick={() => router.push("/arena/pvp")}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors"
          >
            ← Voltar ao PvP
          </button>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Coluna Esquerda - Info Jogador */}
          <div className="lg:col-span-1 space-y-6">
            {/* Card Posição do Jogador */}
            <div className="bg-slate-900/50 rounded-xl p-6 border border-yellow-500/30">
              <h3 className="text-yellow-400 font-bold mb-4 text-center">SUA POSIÇÃO</h3>

              <div className="text-center mb-6">
                <div className="text-6xl mb-2">
                  {leaderboardData.posicaoJogador <= 3 ? (
                    leaderboardData.posicaoJogador === 1 ? '🥇' :
                    leaderboardData.posicaoJogador === 2 ? '🥈' : '🥉'
                  ) : '🎖️'}
                </div>
                <div className="text-4xl font-black text-yellow-400">
                  #{leaderboardData.posicaoJogador || '?'}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {leaderboardData.jogadorNoTop100 ? 'TOP 100' : 'Fora do Top 100'}
                </div>
              </div>

              {/* Recompensas Potenciais */}
              {recompensasJogador && (
                <div className="bg-slate-950/50 rounded-lg p-4 border border-yellow-500/20">
                  <div className="text-xs text-slate-400 mb-2 text-center">Recompensas de Fim de Temporada:</div>
                  <div className="space-y-2 text-sm">
                    {recompensasJogador.moedas && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">💰 Moedas:</span>
                        <span className="text-yellow-400 font-bold">{recompensasJogador.moedas}</span>
                      </div>
                    )}
                    {recompensasJogador.fragmentos && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">💎 Fragmentos:</span>
                        <span className="text-purple-400 font-bold">{recompensasJogador.fragmentos}</span>
                      </div>
                    )}
                    {recompensasJogador.avatarLendario && (
                      <div className="text-center p-2 bg-purple-900/30 rounded border border-purple-500/50">
                        <span className="text-purple-400 font-bold text-xs">🌟 Avatar Lendário!</span>
                      </div>
                    )}
                    {recompensasJogador.avatarRaro && (
                      <div className="text-center p-2 bg-blue-900/30 rounded border border-blue-500/50">
                        <span className="text-blue-400 font-bold text-xs">⭐ Avatar Raro!</span>
                      </div>
                    )}
                    {recompensasJogador.tituloPermamente && (
                      <div className="text-center p-2 bg-yellow-900/30 rounded border border-yellow-500/50">
                        <span className="text-yellow-400 font-bold text-xs">👑 Título: {recompensasJogador.tituloPermamente}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!recompensasJogador && (
                <div className="bg-slate-950/50 rounded-lg p-4 border border-slate-700/50 text-center">
                  <p className="text-sm text-slate-500">
                    📊 Entre no TOP 100 para ganhar recompensas!
                  </p>
                </div>
              )}
            </div>

            {/* Info Temporada */}
            <div className="bg-slate-900/50 rounded-xl p-6 border border-purple-500/30">
              <h3 className="text-purple-400 font-bold mb-4">📅 TEMPORADA</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-xs text-slate-500">Temporada Atual</div>
                  <div className="text-white font-bold">{infoTemporada.nome}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Termina em</div>
                  <div className="text-orange-400 font-bold">{infoTemporada.diasRestantes} dias</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Data Final</div>
                  <div className="text-slate-300 text-xs">
                    {infoTemporada.fimTemporada.toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-purple-950/30 rounded border border-purple-500/30">
                <p className="text-xs text-purple-300">
                  ⏰ Ao final da temporada, todos os jogadores serão resetados para 1000 Fama e receberão suas recompensas baseadas na posição final!
                </p>
              </div>
            </div>

            {/* Filtros */}
            <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700/50">
              <h3 className="text-slate-300 font-bold mb-4">🎯 FILTROS</h3>

              {/* Visualização */}
              <div className="mb-4">
                <div className="text-xs text-slate-500 mb-2">Visualização</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setVisualizacao('top100')}
                    className={`px-3 py-2 text-xs rounded transition-colors ${
                      visualizacao === 'top100'
                        ? 'bg-cyan-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    TOP 100
                  </button>
                  <button
                    onClick={() => setVisualizacao('proximos')}
                    className={`px-3 py-2 text-xs rounded transition-colors ${
                      visualizacao === 'proximos'
                        ? 'bg-cyan-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    Próximos
                  </button>
                </div>
              </div>

              {/* Filtro por Tier */}
              <div>
                <div className="text-xs text-slate-500 mb-2">Tier</div>
                <select
                  value={filtroTier}
                  onChange={(e) => setFiltroTier(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 text-slate-300 rounded text-sm border border-slate-700 focus:outline-none focus:border-cyan-500"
                >
                  <option value="TODOS">Todos os Tiers</option>
                  <option value="LENDARIO">🔥 Lendário</option>
                  <option value="DIAMANTE">💎 Diamante</option>
                  <option value="PLATINA">⚜️ Platina</option>
                  <option value="OURO">👑 Ouro</option>
                  <option value="PRATA">⚔️ Prata</option>
                  <option value="BRONZE">🛡️ Bronze</option>
                </select>
              </div>
            </div>
          </div>

          {/* Coluna Direita - Leaderboard */}
          <div className="lg:col-span-3">
            <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 overflow-hidden">
              {/* Header da Tabela */}
              <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border-b border-yellow-500/30 p-4">
                <div className="grid grid-cols-12 gap-2 text-xs font-bold text-yellow-400 uppercase">
                  <div className="col-span-1 text-center">#</div>
                  <div className="col-span-4">Jogador</div>
                  <div className="col-span-2 text-center">Tier</div>
                  <div className="col-span-2 text-center">Fama</div>
                  <div className="col-span-2 text-center">W/L</div>
                  <div className="col-span-1 text-center">WR%</div>
                </div>
              </div>

              {/* Lista de Jogadores */}
              <div className="max-h-[800px] overflow-y-auto">
                {jogadoresExibir.length === 0 && (
                  <div className="p-8 text-center text-slate-500">
                    Nenhum jogador encontrado com este filtro.
                  </div>
                )}

                {jogadoresExibir.map((player, index) => (
                  <div
                    key={player.userId}
                    className={`grid grid-cols-12 gap-2 p-4 border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors ${
                      player.isJogador ? 'bg-cyan-900/20 border-l-4 border-l-cyan-500' : ''
                    } ${
                      player.posicao === 1 ? 'bg-gradient-to-r from-yellow-900/20 to-transparent' :
                      player.posicao === 2 ? 'bg-gradient-to-r from-slate-700/20 to-transparent' :
                      player.posicao === 3 ? 'bg-gradient-to-r from-orange-900/20 to-transparent' : ''
                    }`}
                  >
                    {/* Posição */}
                    <div className="col-span-1 flex items-center justify-center">
                      <div className={`font-bold ${
                        player.posicao === 1 ? 'text-yellow-400 text-2xl' :
                        player.posicao === 2 ? 'text-slate-300 text-xl' :
                        player.posicao === 3 ? 'text-orange-400 text-xl' :
                        player.posicao <= 10 ? 'text-cyan-400 text-lg' :
                        'text-slate-400'
                      }`}>
                        {player.posicao === 1 ? '🥇' :
                         player.posicao === 2 ? '🥈' :
                         player.posicao === 3 ? '🥉' :
                         `#${player.posicao}`}
                      </div>
                    </div>

                    {/* Jogador */}
                    <div className="col-span-4 flex flex-col justify-center">
                      <div className={`font-bold ${player.isJogador ? 'text-cyan-400' : 'text-white'}`}>
                        {player.nome}
                        {player.isJogador && <span className="ml-2 text-xs text-cyan-500">(Você)</span>}
                      </div>
                      <div className="text-xs text-slate-500">
                        {player.avatar.elemento} • Nv.{player.avatar.nivel}
                        {player.streak > 0 && (
                          <span className="ml-2 text-orange-400">
                            {player.streak >= 10 ? '🔥' : player.streak >= 5 ? '⚡' : '✨'} {player.streak}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Tier */}
                    <div className="col-span-2 flex items-center justify-center">
                      <div className={`text-center px-2 py-1 rounded text-xs font-bold ${
                        player.tier === 'LENDARIO' ? 'bg-red-900/30 text-red-400' :
                        player.tier === 'DIAMANTE' ? 'bg-purple-900/30 text-purple-400' :
                        player.tier === 'PLATINA' ? 'bg-cyan-900/30 text-cyan-400' :
                        player.tier === 'OURO' ? 'bg-yellow-900/30 text-yellow-400' :
                        player.tier === 'PRATA' ? 'bg-slate-700/30 text-slate-300' :
                        'bg-orange-900/30 text-orange-400'
                      }`}>
                        {player.tierIcone} {player.tier}
                      </div>
                    </div>

                    {/* Fama */}
                    <div className="col-span-2 flex items-center justify-center">
                      <div className="font-bold text-yellow-400">{player.fama}</div>
                    </div>

                    {/* W/L */}
                    <div className="col-span-2 flex items-center justify-center">
                      <div className="text-sm">
                        <span className="text-green-400">{player.vitorias}</span>
                        <span className="text-slate-600 mx-1">/</span>
                        <span className="text-red-400">{player.derrotas}</span>
                      </div>
                    </div>

                    {/* Win Rate */}
                    <div className="col-span-1 flex items-center justify-center">
                      <div className={`font-bold text-sm ${
                        player.winRate >= 70 ? 'text-green-400' :
                        player.winRate >= 50 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {player.winRate}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recompensas de Fim de Temporada */}
            <div className="mt-6 bg-gradient-to-r from-yellow-900/20 to-orange-900/20 rounded-xl p-6 border border-yellow-500/30">
              <h3 className="text-xl font-black text-yellow-400 mb-4 text-center">
                🎁 RECOMPENSAS DE FIM DE TEMPORADA
              </h3>

              <div className="grid md:grid-cols-3 gap-4">
                {/* Top 1 */}
                <div className="bg-gradient-to-b from-yellow-900/30 to-transparent rounded-lg p-4 border border-yellow-500/50">
                  <div className="text-center mb-3">
                    <div className="text-4xl mb-2">🥇</div>
                    <div className="text-yellow-400 font-bold">1º LUGAR</div>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="text-slate-300">🌟 Avatar Lendário</div>
                    <div className="text-yellow-400">💰 5.000 Moedas</div>
                    <div className="text-purple-400">💎 50 Fragmentos</div>
                    <div className="text-orange-400">👑 Título Permanente</div>
                  </div>
                </div>

                {/* Top 2-3 */}
                <div className="bg-gradient-to-b from-blue-900/30 to-transparent rounded-lg p-4 border border-blue-500/50">
                  <div className="text-center mb-3">
                    <div className="text-4xl mb-2">🥈🥉</div>
                    <div className="text-blue-400 font-bold">2º - 3º LUGAR</div>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="text-slate-300">⭐ Avatar Raro</div>
                    <div className="text-yellow-400">💰 3.000 Moedas</div>
                    <div className="text-purple-400">💎 30 Fragmentos</div>
                    <div className="text-orange-400">👑 Título Permanente</div>
                  </div>
                </div>

                {/* Top 4-10 */}
                <div className="bg-gradient-to-b from-cyan-900/30 to-transparent rounded-lg p-4 border border-cyan-500/50">
                  <div className="text-center mb-3">
                    <div className="text-4xl mb-2">⭐</div>
                    <div className="text-cyan-400 font-bold">TOP 4-10</div>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="text-yellow-400">💰 1.500 Moedas</div>
                    <div className="text-purple-400">💎 20 Fragmentos</div>
                    <div className="text-orange-400">👑 Título "Elite Top 10"</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                {/* Top 11-50 */}
                <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-600/50">
                  <div className="text-center mb-2">
                    <div className="text-blue-400 font-bold text-sm">🌟 TOP 11-50</div>
                  </div>
                  <div className="space-y-1 text-xs text-center">
                    <div className="text-yellow-400">💰 800 Moedas</div>
                    <div className="text-purple-400">💎 10 Fragmentos</div>
                  </div>
                </div>

                {/* Top 51-100 */}
                <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-600/50">
                  <div className="text-center mb-2">
                    <div className="text-purple-400 font-bold text-sm">💫 TOP 51-100</div>
                  </div>
                  <div className="space-y-1 text-xs text-center">
                    <div className="text-yellow-400">💰 400 Moedas</div>
                    <div className="text-purple-400">💎 5 Fragmentos</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
