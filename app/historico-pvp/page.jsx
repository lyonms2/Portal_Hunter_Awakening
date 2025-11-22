"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import GameNav from '../components/GameNav';

export default function HistoricoPvPPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [historico, setHistorico] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    carregarHistorico(parsedUser.id);
  }, [router]);

  const carregarHistorico = async (userId) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/pvp/historico?userId=${userId}`);
      const data = await response.json();

      if (response.ok) {
        setHistorico(data.historico);
        setStats(data.stats);
      } else {
        console.error("Erro ao carregar histórico:", data.error);
      }
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tier) => {
    const colors = {
      'LENDARIO': 'from-orange-600 to-red-600',
      'DIAMANTE': 'from-cyan-600 to-blue-600',
      'PLATINA': 'from-teal-600 to-green-600',
      'OURO': 'from-yellow-600 to-amber-600',
      'PRATA': 'from-gray-400 to-gray-500',
      'BRONZE': 'from-orange-800 to-orange-900'
    };
    return colors[tier] || 'from-gray-600 to-gray-700';
  };

  const getTierIcon = (tier) => {
    const icons = {
      'LENDARIO': '👑',
      'DIAMANTE': '💎',
      'PLATINA': '🏆',
      'OURO': '🥇',
      'PRATA': '🥈',
      'BRONZE': '🥉'
    };
    return icons[tier] || '📊';
  };

  const getPosicaoIcon = (posicao) => {
    if (posicao === 1) return "🥇";
    if (posicao === 2) return "🥈";
    if (posicao === 3) return "🥉";
    if (posicao <= 10) return "⭐";
    if (posicao <= 50) return "🏆";
    if (posicao <= 100) return "🎖️";
    return "📊";
  };

  const calcularWinRate = (vitorias, derrotas) => {
    const total = vitorias + derrotas;
    if (total === 0) return 0;
    return Math.round((vitorias / total) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">📜</div>
          <div className="text-white text-xl">Carregando histórico...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 p-6">
      <GameNav
        backTo="/arena/pvp"
        backLabel="ARENA PVP"
        title="HISTÓRICO DE TEMPORADAS"
        subtitle="Seu desempenho em temporadas anteriores"
      />

      <div className="max-w-6xl mx-auto mt-6">

        {/* Estatísticas Gerais */}
        {stats && historico.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-slate-800/50 rounded-lg p-4 text-center border border-purple-500">
              <div className="text-3xl mb-2">📅</div>
              <div className="text-2xl font-bold text-white">{stats.totalTemporadas}</div>
              <div className="text-sm text-slate-400">Temporadas</div>
            </div>

            <div className="bg-green-900/30 rounded-lg p-4 text-center border border-green-600">
              <div className="text-3xl mb-2">✅</div>
              <div className="text-2xl font-bold text-green-400">{stats.totalVitorias}</div>
              <div className="text-sm text-slate-400">Vitórias</div>
            </div>

            <div className="bg-red-900/30 rounded-lg p-4 text-center border border-red-600">
              <div className="text-3xl mb-2">❌</div>
              <div className="text-2xl font-bold text-red-400">{stats.totalDerrotas}</div>
              <div className="text-sm text-slate-400">Derrotas</div>
            </div>

            <div className="bg-yellow-900/30 rounded-lg p-4 text-center border border-yellow-600">
              <div className="text-3xl mb-2">🏆</div>
              <div className="text-2xl font-bold text-yellow-400">
                {stats.melhorPosicao ? `#${stats.melhorPosicao}` : 'N/A'}
              </div>
              <div className="text-sm text-slate-400">Melhor Posição</div>
            </div>

            <div className="bg-orange-900/30 rounded-lg p-4 text-center border border-orange-600">
              <div className="text-3xl mb-2">⚡</div>
              <div className="text-2xl font-bold text-orange-400">{stats.melhorFama}</div>
              <div className="text-sm text-slate-400">Melhor Fama</div>
            </div>

            <div className="bg-purple-900/30 rounded-lg p-4 text-center border border-purple-600">
              <div className="text-3xl mb-2">🔥</div>
              <div className="text-2xl font-bold text-purple-400">{stats.melhorStreak}</div>
              <div className="text-sm text-slate-400">Melhor Streak</div>
            </div>
          </div>
        )}

        {/* Lista de Temporadas */}
        {historico.length === 0 ? (
          <div className="bg-slate-800/50 rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Nenhum histórico ainda
            </h2>
            <p className="text-slate-400">
              Participe de temporadas de PVP para ver seu histórico aqui!
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {historico.map((temp) => {
              const winRate = calcularWinRate(temp.vitorias, temp.derrotas);
              const totalBatalhas = temp.vitorias + temp.derrotas;

              return (
                <div
                  key={temp.id}
                  className="bg-slate-800/50 rounded-lg overflow-hidden shadow-xl border-2 border-slate-700 hover:border-purple-500 transition-colors"
                >
                  {/* Header da Temporada */}
                  <div className={`bg-gradient-to-r ${getTierColor(temp.tier_final)} p-4`}>
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-3">
                        <div className="text-4xl">{getTierIcon(temp.tier_final)}</div>
                        <div>
                          <h3 className="text-xl font-bold text-white">
                            {temp.temporada?.nome || temp.temporada_id}
                          </h3>
                          <p className="text-white/80">
                            Tier Final: {temp.tier_final}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center gap-2 text-white">
                          <span className="text-3xl">{getPosicaoIcon(temp.posicao_final)}</span>
                          <div>
                            <div className="text-2xl font-bold">
                              #{temp.posicao_final}
                            </div>
                            <div className="text-sm opacity-80">Posição Final</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stats da Temporada */}
                  <div className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-slate-700/50 rounded p-3 text-center">
                        <div className="text-2xl mb-1">⚡</div>
                        <div className="text-xl font-bold text-purple-400">
                          {temp.fama_final}
                        </div>
                        <div className="text-sm text-slate-400">Fama Final</div>
                      </div>

                      <div className="bg-slate-700/50 rounded p-3 text-center">
                        <div className="text-2xl mb-1">⚔️</div>
                        <div className="text-xl font-bold text-white">
                          {totalBatalhas}
                        </div>
                        <div className="text-sm text-slate-400">Batalhas</div>
                      </div>

                      <div className="bg-slate-700/50 rounded p-3 text-center">
                        <div className="text-2xl mb-1">📊</div>
                        <div className="text-xl font-bold text-blue-400">
                          {winRate}%
                        </div>
                        <div className="text-sm text-slate-400">Win Rate</div>
                      </div>

                      <div className="bg-slate-700/50 rounded p-3 text-center">
                        <div className="text-2xl mb-1">🔥</div>
                        <div className="text-xl font-bold text-orange-400">
                          {temp.streak_maximo}
                        </div>
                        <div className="text-sm text-slate-400">Maior Streak</div>
                      </div>
                    </div>

                    <div className="mt-4 flex justify-between items-center text-sm text-slate-400">
                      <div>
                        ✅ {temp.vitorias} Vitórias | ❌ {temp.derrotas} Derrotas
                      </div>
                      <div>
                        Encerrada em: {new Date(temp.data_encerramento).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
