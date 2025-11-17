"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AvatarSVG from '../components/AvatarSVG';

export default function MercadoPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [avatares, setAvatares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [modalCompra, setModalCompra] = useState(null);
  const [comprando, setComprando] = useState(false);
  const [modalConfirmacao, setModalConfirmacao] = useState(null);

  // Filtros
  const [filtroRaridade, setFiltroRaridade] = useState('Todos');
  const [filtroElemento, setFiltroElemento] = useState('Todos');
  const [precoMin, setPrecoMin] = useState('');
  const [precoMax, setPrecoMax] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    carregarStats(parsedUser.id);
    carregarAvatares(parsedUser.id);
  }, [router]);

  const carregarStats = async (userId) => {
    try {
      const response = await fetch("/api/inicializar-jogador", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await response.json();
      setStats(data.stats);
    } catch (error) {
      console.error("Erro ao carregar stats:", error);
    }
  };

  const carregarAvatares = async (userId) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        userId,
        ...(filtroRaridade !== 'Todos' && { raridade: filtroRaridade }),
        ...(filtroElemento !== 'Todos' && { elemento: filtroElemento }),
        ...(precoMin && { precoMin }),
        ...(precoMax && { precoMax }),
      });

      const response = await fetch(`/api/mercado/listar?${params}`);
      const data = await response.json();

      if (response.ok) {
        setAvatares(data.avatares || []);
      }
    } catch (error) {
      console.error("Erro ao carregar avatares:", error);
    } finally {
      setLoading(false);
    }
  };

  const comprarAvatar = async () => {
    setComprando(true);
    try {
      const response = await fetch("/api/mercado/comprar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          compradorId: user.id,
          avatarId: modalCompra.id
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setModalCompra(null);
        setModalConfirmacao({
          tipo: 'sucesso',
          mensagem: `${data.avatar.nome} é seu agora!`
        });
        setTimeout(() => setModalConfirmacao(null), 3000);
        carregarStats(user.id);
        carregarAvatares(user.id);
      } else {
        setModalConfirmacao({
          tipo: 'erro',
          mensagem: data.message || 'Erro ao comprar avatar'
        });
        setTimeout(() => setModalConfirmacao(null), 3000);
      }
    } catch (error) {
      console.error("Erro ao comprar:", error);
      setModalConfirmacao({
        tipo: 'erro',
        mensagem: 'Erro de conexão'
      });
      setTimeout(() => setModalConfirmacao(null), 3000);
    } finally {
      setComprando(false);
    }
  };

  const getCorRaridade = (raridade) => {
    switch (raridade) {
      case 'Lendário': return 'from-amber-500 to-yellow-500';
      case 'Raro': return 'from-purple-500 to-pink-500';
      default: return 'from-slate-600 to-slate-700';
    }
  };

  const getCorElemento = (elemento) => {
    const cores = {
      'Fogo': 'text-orange-400',
      'Água': 'text-blue-400',
      'Terra': 'text-amber-600',
      'Vento': 'text-cyan-400',
      'Eletricidade': 'text-yellow-400',
      'Sombra': 'text-purple-400',
      'Luz': 'text-yellow-200'
    };
    return cores[elemento] || 'text-gray-400';
  };

  const getEmojiElemento = (elemento) => {
    const emojis = {
      'Fogo': '🔥',
      'Água': '💧',
      'Terra': '🪨',
      'Vento': '💨',
      'Eletricidade': '⚡',
      'Sombra': '🌑',
      'Luz': '✨'
    };
    return emojis[elemento] || '⭐';
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center">
        <div className="text-cyan-400 font-mono animate-pulse">Carregando mercado...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-gray-100 relative overflow-hidden">
      {/* Partículas de fundo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-amber-500/5 rounded-full blur-3xl top-20 -left-48 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl bottom-20 -right-48 animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      {/* Grid hexagonal */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTYiIGhlaWdodD0iMTAwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0yOCAwTDAgMTVWMzVMMjggNTBMNTYgMzVWMTVaTTI4IDUwTDAgNjVWODVMMjggMTAwTDU2IDg1VjY1WiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjY3lhbiIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48L3N2Zz4=')] pointer-events-none"></div>

      {/* Vinheta */}
      <div className="absolute inset-0 shadow-[inset_0_0_120px_rgba(0,0,0,0.9)] pointer-events-none"></div>

      <div className="relative z-10 container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-300 bg-clip-text text-transparent mb-2">
                🏪 MERCADO DE AVATARES
              </h1>
              <p className="text-slate-400 font-mono text-sm italic">
                "Aqui, as almas são moeda e os contratos são eternos..."
              </p>
            </div>

            <div className="flex gap-3 items-center flex-wrap">
              <div className="px-4 py-2 bg-slate-900/50 border border-amber-500/30 rounded-lg">
                <span className="text-xs text-slate-500 font-mono">Suas Moedas</span>
                <div className="text-xl font-bold text-amber-400">{stats?.moedas || 0} 💰</div>
              </div>

              <button
                onClick={() => router.push("/avatares")}
                className="px-4 py-2 bg-slate-900/50 hover:bg-slate-800/50 border border-slate-700/50 rounded-lg transition-all flex items-center gap-2 text-sm font-semibold text-cyan-400"
              >
                <span>←</span>
                <span>VOLTAR</span>
              </button>
            </div>
          </div>

          {/* Lore Box */}
          <div className="relative group mb-6">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 rounded-lg blur opacity-50"></div>
            <div className="relative bg-slate-950/90 backdrop-blur-xl border border-amber-900/30 rounded-lg p-4">
              <p className="text-sm text-slate-300 leading-relaxed italic">
                No submundo da Organização de Caçadores Dimensionais, existe um mercado clandestino onde avatares são negociados como commodities.
                Alguns caçadores buscam poder rápido, outros vendem seus guerreiros por desespero. Aqui, a lealdade tem preço... e a traição também.
              </p>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="mb-6 bg-slate-900/50 border border-slate-700/50 rounded-lg p-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <select
              value={filtroRaridade}
              onChange={(e) => {
                setFiltroRaridade(e.target.value);
                setTimeout(() => carregarAvatares(user.id), 100);
              }}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white focus:border-amber-500 focus:outline-none"
            >
              <option value="Todos">Todas Raridades</option>
              <option value="Comum">Comum</option>
              <option value="Raro">Raro</option>
              <option value="Lendário">Lendário</option>
            </select>

            <select
              value={filtroElemento}
              onChange={(e) => {
                setFiltroElemento(e.target.value);
                setTimeout(() => carregarAvatares(user.id), 100);
              }}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white focus:border-amber-500 focus:outline-none"
            >
              <option value="Todos">Todos Elementos</option>
              <option value="Fogo">🔥 Fogo</option>
              <option value="Água">💧 Água</option>
              <option value="Terra">🪨 Terra</option>
              <option value="Vento">💨 Vento</option>
              <option value="Eletricidade">⚡ Eletricidade</option>
              <option value="Sombra">🌑 Sombra</option>
              <option value="Luz">✨ Luz</option>
            </select>

            <input
              type="number"
              placeholder="Preço Mín"
              value={precoMin}
              onChange={(e) => setPrecoMin(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white focus:border-amber-500 focus:outline-none"
            />

            <input
              type="number"
              placeholder="Preço Máx"
              value={precoMax}
              onChange={(e) => setPrecoMax(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white focus:border-amber-500 focus:outline-none"
            />

            <button
              onClick={() => carregarAvatares(user.id)}
              className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded text-sm font-semibold transition-all"
            >
              🔍 Filtrar
            </button>
          </div>

          <div className="mt-3 text-xs text-slate-500 font-mono">
            {avatares.length} {avatares.length === 1 ? 'avatar disponível' : 'avatares disponíveis'}
          </div>
        </div>

        {/* Lista de Avatares */}
        {loading ? (
          <div className="text-center py-20">
            <div className="text-cyan-400 animate-pulse text-lg">Buscando avatares...</div>
          </div>
        ) : avatares.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4 opacity-20">🏪</div>
            <h3 className="text-xl font-bold text-slate-400 mb-2">Nenhum avatar à venda</h3>
            <p className="text-slate-500 text-sm">Tente ajustar os filtros ou volte mais tarde</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {avatares.map((avatar) => (
              <div
                key={avatar.id}
                className="group relative"
              >
                <div className={`absolute -inset-0.5 bg-gradient-to-r ${getCorRaridade(avatar.raridade)} rounded-lg blur opacity-20 group-hover:opacity-40 transition-all`}></div>

                <div className="relative bg-slate-900/80 backdrop-blur-xl border border-amber-500/30 rounded-lg overflow-hidden group-hover:border-amber-400/50 transition-all">
                  {/* Badge Raridade */}
                  <div className={`px-3 py-1.5 text-center font-bold text-xs bg-gradient-to-r ${getCorRaridade(avatar.raridade)}`}>
                    {avatar.raridade.toUpperCase()}
                  </div>

                  {/* Avatar */}
                  <div className="py-4 flex items-center justify-center">
                    <AvatarSVG avatar={avatar} tamanho={120} />
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <h3 className="font-bold text-sm text-white mb-1 truncate">{avatar.nome}</h3>
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                      <span className={getCorElemento(avatar.elemento)}>{getEmojiElemento(avatar.elemento)} {avatar.elemento}</span>
                      <span>Nv.{avatar.nivel}</span>
                    </div>

                    {/* Preço */}
                    <div className="mb-3 p-2 bg-amber-950/30 rounded border border-amber-500/30">
                      <div className="text-xs text-amber-400 text-center font-mono">PREÇO</div>
                      <div className="text-xl font-black text-amber-300 text-center">{avatar.preco_venda} 💰</div>
                    </div>

                    {/* Stats Preview */}
                    <div className="grid grid-cols-4 gap-1 text-xs text-center mb-3">
                      <div>
                        <div className="text-slate-500">FOR</div>
                        <div className="text-red-400 font-bold">{avatar.forca}</div>
                      </div>
                      <div>
                        <div className="text-slate-500">AGI</div>
                        <div className="text-green-400 font-bold">{avatar.agilidade}</div>
                      </div>
                      <div>
                        <div className="text-slate-500">RES</div>
                        <div className="text-blue-400 font-bold">{avatar.resistencia}</div>
                      </div>
                      <div>
                        <div className="text-slate-500">FOC</div>
                        <div className="text-purple-400 font-bold">{avatar.foco}</div>
                      </div>
                    </div>

                    {/* Botão Comprar */}
                    <button
                      onClick={() => setModalCompra(avatar)}
                      disabled={stats?.moedas < avatar.preco_venda}
                      className="w-full px-3 py-2 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-bold text-sm rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {stats?.moedas < avatar.preco_venda ? '💰 Sem Moedas' : '🛒 COMPRAR'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Compra */}
      {modalCompra && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => !comprando && setModalCompra(null)}
        >
          <div
            className="max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/30 to-yellow-500/30 rounded-lg blur opacity-75"></div>

              <div className="relative bg-slate-950/95 backdrop-blur-xl border border-amber-900/50 rounded-lg overflow-hidden">
                <div className="p-4 text-center font-bold text-lg bg-gradient-to-r from-amber-600 to-yellow-600">
                  🛒 Confirmar Compra
                </div>

                <div className="p-6">
                  <div className="text-center mb-6">
                    <div className="mb-4">
                      <AvatarSVG avatar={modalCompra} tamanho={120} />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">{modalCompra.nome}</h3>
                    <p className="text-sm text-slate-400 mb-4">
                      {modalCompra.raridade} • {modalCompra.elemento} • Nv.{modalCompra.nivel}
                    </p>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between p-3 bg-slate-900 rounded">
                      <span className="text-slate-400">Preço:</span>
                      <span className="text-amber-400 font-bold">{modalCompra.preco_venda} moedas</span>
                    </div>
                    <div className="flex justify-between p-3 bg-slate-900 rounded">
                      <span className="text-slate-400">Seu saldo atual:</span>
                      <span className="text-white font-bold">{stats?.moedas} moedas</span>
                    </div>
                    <div className="flex justify-between p-3 bg-amber-950/30 rounded border border-amber-500/30">
                      <span className="text-amber-400 font-bold">Saldo após compra:</span>
                      <span className="text-amber-300 font-bold">{stats?.moedas - modalCompra.preco_venda} moedas</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setModalCompra(null)}
                      disabled={comprando}
                      className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg transition-all disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={comprarAvatar}
                      disabled={comprando}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-bold rounded-lg transition-all disabled:opacity-50"
                    >
                      {comprando ? 'Comprando...' : 'Confirmar'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast de Confirmação */}
      {modalConfirmacao && (
        <div className="fixed top-8 right-8 z-50 animate-fade-in">
          <div className={`px-6 py-4 rounded-lg border-2 ${
            modalConfirmacao.tipo === 'sucesso'
              ? 'bg-green-900/90 border-green-500'
              : 'bg-red-900/90 border-red-500'
          } backdrop-blur-xl`}>
            <p className={`font-semibold ${
              modalConfirmacao.tipo === 'sucesso' ? 'text-green-200' : 'text-red-200'
            }`}>
              {modalConfirmacao.mensagem}
            </p>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
