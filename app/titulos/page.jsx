"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function TitulosPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [titulos, setTitulos] = useState([]);
  const [tituloAtivo, setTituloAtivo] = useState(null);
  const [ativando, setAtivando] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    carregarTitulos(parsedUser.id);
  }, [router]);

  const carregarTitulos = async (userId) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/pvp/titulos?userId=${userId}`);
      const data = await response.json();

      if (response.ok) {
        setTitulos(data.titulos);
        setTituloAtivo(data.tituloAtivo);
      } else {
        console.error("Erro ao carregar títulos:", data.error);
      }
    } catch (error) {
      console.error("Erro ao carregar títulos:", error);
    } finally {
      setLoading(false);
    }
  };

  const ativarTitulo = async (tituloId) => {
    if (!user || ativando) return;

    setAtivando(true);

    try {
      const response = await fetch("/api/pvp/titulos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          tituloId: tituloId
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Recarregar títulos
        await carregarTitulos(user.id);
      } else {
        alert("Erro ao ativar título: " + data.error);
      }
    } catch (error) {
      console.error("Erro ao ativar título:", error);
      alert("Erro ao ativar título");
    } finally {
      setAtivando(false);
    }
  };

  const desativarTitulos = async () => {
    if (!user || ativando) return;

    setAtivando(true);

    try {
      const response = await fetch("/api/pvp/titulos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          tituloId: null // null = desativar todos
        })
      });

      const data = await response.json();

      if (response.ok) {
        await carregarTitulos(user.id);
      } else {
        alert("Erro ao desativar títulos: " + data.error);
      }
    } catch (error) {
      console.error("Erro ao desativar títulos:", error);
      alert("Erro ao desativar títulos");
    } finally {
      setAtivando(false);
    }
  };

  const getTituloColor = (titulo) => {
    if (titulo.titulo_nome.includes('Campeão')) return 'from-yellow-600 to-orange-600';
    if (titulo.titulo_nome.includes('Vice')) return 'from-gray-400 to-gray-500';
    if (titulo.titulo_nome.includes('3º')) return 'from-orange-800 to-orange-700';
    if (titulo.titulo_nome.includes('Top 10')) return 'from-purple-600 to-pink-600';
    return 'from-blue-600 to-cyan-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🏆</div>
          <div className="text-white text-xl">Carregando títulos...</div>
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

          <div className="bg-gradient-to-r from-yellow-600 via-orange-500 to-yellow-600 rounded-lg p-6 shadow-2xl">
            <div className="flex items-center gap-4">
              <div className="text-6xl">🏆</div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">
                  Meus Títulos
                </h1>
                <p className="text-yellow-100">
                  Títulos conquistados em temporadas de PVP
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Título Ativo */}
        {tituloAtivo && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Título Equipado</h2>
            <div className={`bg-gradient-to-r ${getTituloColor(tituloAtivo)} rounded-lg p-6 shadow-xl border-2 border-white`}>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="text-5xl">{tituloAtivo.titulo_icone}</div>
                  <div>
                    <h3 className="text-3xl font-bold text-white mb-1">
                      {tituloAtivo.titulo_nome}
                    </h3>
                    <p className="text-white/80">
                      {tituloAtivo.temporada?.nome} - #{tituloAtivo.posicao_conquistada}
                    </p>
                  </div>
                </div>

                <button
                  onClick={desativarTitulos}
                  disabled={ativando}
                  className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold transition-colors disabled:opacity-50"
                >
                  Desequipar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Lista de Títulos */}
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-white mb-4">
            Todos os Títulos ({titulos.length})
          </h2>
        </div>

        {titulos.length === 0 ? (
          <div className="bg-slate-800/50 rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">🎖️</div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Nenhum título conquistado ainda
            </h2>
            <p className="text-slate-400">
              Termine uma temporada no Top 10 para ganhar seu primeiro título!
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {titulos.map((titulo) => (
              <div
                key={titulo.id}
                className={`rounded-lg p-6 shadow-xl border-2 transition-all ${
                  titulo.ativo
                    ? 'border-white scale-105'
                    : 'border-slate-700 hover:border-purple-500'
                } bg-gradient-to-r ${getTituloColor(titulo)}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="text-4xl">{titulo.titulo_icone}</div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-white mb-1">
                        {titulo.titulo_nome}
                      </h3>
                      <p className="text-white/80 mb-2">
                        {titulo.temporada?.nome}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-white/60">
                        <span>Posição: #{titulo.posicao_conquistada}</span>
                        <span>•</span>
                        <span>
                          {new Date(titulo.data_conquista).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {!titulo.ativo && (
                    <button
                      onClick={() => ativarTitulo(titulo.id)}
                      disabled={ativando}
                      className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-900 rounded-lg font-bold transition-colors disabled:opacity-50"
                    >
                      Equipar
                    </button>
                  )}

                  {titulo.ativo && (
                    <div className="px-4 py-2 bg-green-500 text-white rounded-lg font-bold">
                      ✓ Equipado
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info */}
        <div className="mt-8 bg-blue-900/20 border border-blue-500 rounded-lg p-4">
          <div className="flex gap-3">
            <div className="text-2xl">ℹ️</div>
            <div className="flex-1">
              <h3 className="font-bold text-blue-300 mb-1">Como ganhar títulos?</h3>
              <p className="text-blue-200 text-sm">
                Títulos são conquistados ao terminar uma temporada no Top 10 do leaderboard.
                Quanto melhor sua posição, mais prestigioso é o título!
              </p>
              <ul className="mt-2 space-y-1 text-sm text-blue-200">
                <li>• 🥇 1º lugar: Título de <strong>Campeão</strong></li>
                <li>• 🥈 2º lugar: Título de <strong>Vice-Campeão</strong></li>
                <li>• 🥉 3º lugar: Título de <strong>3º Lugar</strong></li>
                <li>• ⭐ 4º-10º: Título de <strong>Elite Top 10</strong></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
