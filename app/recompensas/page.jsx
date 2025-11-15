"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function RecompensasPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recompensas, setRecompensas] = useState([]);
  const [coletando, setColetando] = useState(null);
  const [modalSucesso, setModalSucesso] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    carregarRecompensas(parsedUser.id);
  }, [router]);

  const carregarRecompensas = async (userId) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/pvp/recompensas?userId=${userId}`);
      const data = await response.json();

      if (response.ok) {
        setRecompensas(data.recompensas);
      } else {
        console.error("Erro ao carregar recompensas:", data.error);
      }
    } catch (error) {
      console.error("Erro ao carregar recompensas:", error);
    } finally {
      setLoading(false);
    }
  };

  const coletarRecompensa = async (recompensaId) => {
    if (!user || coletando) return;

    setColetando(recompensaId);

    try {
      const response = await fetch("/api/pvp/recompensas/coletar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          recompensaId
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Mostrar modal de sucesso
        setModalSucesso(data);

        // Remover recompensa da lista
        setRecompensas(prev => prev.filter(r => r.id !== recompensaId));

        // Atualizar localStorage com novos valores
        const userAtual = JSON.parse(localStorage.getItem("user"));
        userAtual.moedas = data.novosValores.moedas;
        userAtual.fragmentos = data.novosValores.fragmentos;
        localStorage.setItem("user", JSON.stringify(userAtual));
      } else {
        alert("Erro ao coletar recompensa: " + data.error);
      }
    } catch (error) {
      console.error("Erro ao coletar recompensa:", error);
      alert("Erro ao coletar recompensa");
    } finally {
      setColetando(null);
    }
  };

  const getTierIcon = (posicao) => {
    if (posicao === 1) return "👑";
    if (posicao === 2) return "🥈";
    if (posicao === 3) return "🥉";
    if (posicao <= 10) return "⭐";
    if (posicao <= 50) return "🏆";
    if (posicao <= 100) return "🎖️";
    return "📊";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🎁</div>
          <div className="text-white text-xl">Carregando recompensas...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="mb-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            ← Voltar
          </button>

          <div className="bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 rounded-lg p-6 shadow-2xl">
            <div className="flex items-center gap-4">
              <div className="text-6xl">🎁</div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">
                  Recompensas de Temporada
                </h1>
                <p className="text-yellow-100">
                  Colete suas recompensas conquistadas em temporadas anteriores
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Recompensas */}
        {recompensas.length === 0 ? (
          <div className="bg-slate-800/50 rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Nenhuma recompensa pendente
            </h2>
            <p className="text-slate-400">
              Participe de temporadas de PVP para ganhar recompensas incríveis!
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {recompensas.map((recompensa) => (
              <div
                key={recompensa.id}
                className="bg-gradient-to-r from-slate-800 via-purple-900 to-slate-800 rounded-lg p-6 shadow-xl border-2 border-purple-500"
              >
                <div className="flex items-center justify-between flex-wrap gap-4">
                  {/* Info da Temporada */}
                  <div className="flex-1 min-w-[300px]">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="text-4xl">
                        {getTierIcon(recompensa.posicao_final)}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">
                          {recompensa.temporada?.nome || "Temporada Passada"}
                        </h3>
                        <p className="text-purple-300">
                          Posição Final: #{recompensa.posicao_final || "N/A"}
                        </p>
                      </div>
                    </div>

                    {/* Recompensas */}
                    <div className="grid grid-cols-2 gap-3">
                      {recompensa.moedas > 0 && (
                        <div className="bg-yellow-900/30 rounded p-3 border border-yellow-600">
                          <div className="text-2xl mb-1">💰</div>
                          <div className="text-yellow-400 font-bold">
                            {recompensa.moedas.toLocaleString()} Moedas
                          </div>
                        </div>
                      )}

                      {recompensa.fragmentos > 0 && (
                        <div className="bg-purple-900/30 rounded p-3 border border-purple-600">
                          <div className="text-2xl mb-1">💎</div>
                          <div className="text-purple-400 font-bold">
                            {recompensa.fragmentos} Fragmentos
                          </div>
                        </div>
                      )}

                      {recompensa.avatar_lendario && (
                        <div className="bg-orange-900/30 rounded p-3 border border-orange-600 col-span-2">
                          <div className="text-2xl mb-1">✨</div>
                          <div className="text-orange-400 font-bold">
                            Avatar Lendário Garantido!
                          </div>
                        </div>
                      )}

                      {recompensa.avatar_raro && !recompensa.avatar_lendario && (
                        <div className="bg-blue-900/30 rounded p-3 border border-blue-600 col-span-2">
                          <div className="text-2xl mb-1">⚡</div>
                          <div className="text-blue-400 font-bold">
                            Avatar Raro Garantido!
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Botão Coletar */}
                  <div>
                    <button
                      onClick={() => coletarRecompensa(recompensa.id)}
                      disabled={coletando === recompensa.id}
                      className={`px-8 py-4 rounded-lg font-bold text-xl transition-all transform ${
                        coletando === recompensa.id
                          ? "bg-gray-600 cursor-not-allowed"
                          : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 hover:scale-105 shadow-lg"
                      } text-white`}
                    >
                      {coletando === recompensa.id ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin">⏳</div>
                          Coletando...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>🎁</span>
                          Coletar
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de Sucesso */}
        {modalSucesso && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-lg p-8 max-w-md w-full border-2 border-green-500 shadow-2xl">
              <div className="text-center">
                <div className="text-6xl mb-4 animate-bounce">🎉</div>
                <h2 className="text-3xl font-bold text-green-400 mb-4">
                  Recompensas Coletadas!
                </h2>

                <div className="space-y-3 mb-6">
                  {modalSucesso.recompensa.moedas > 0 && (
                    <div className="bg-yellow-900/30 rounded p-3 border border-yellow-600">
                      <div className="text-yellow-400 font-bold">
                        +{modalSucesso.recompensa.moedas.toLocaleString()} Moedas
                      </div>
                    </div>
                  )}

                  {modalSucesso.recompensa.fragmentos > 0 && (
                    <div className="bg-purple-900/30 rounded p-3 border border-purple-600">
                      <div className="text-purple-400 font-bold">
                        +{modalSucesso.recompensa.fragmentos} Fragmentos
                      </div>
                    </div>
                  )}

                  {modalSucesso.recompensa.ganhouAvatar && (
                    <div className="bg-orange-900/30 rounded p-3 border border-orange-600">
                      <div className="text-orange-400 font-bold">
                        Avatar {modalSucesso.recompensa.raridadeAvatar} desbloqueado!
                      </div>
                      <p className="text-sm text-orange-300 mt-1">
                        Vá ao Invocador para resgatar
                      </p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setModalSucesso(null)}
                  className="w-full px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold transition-colors"
                >
                  Continuar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
