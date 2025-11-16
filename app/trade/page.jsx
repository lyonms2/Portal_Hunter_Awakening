"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AvatarSVG from '../components/AvatarSVG';

export default function TradePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('marketplace');
  const [loading, setLoading] = useState(true);

  // Aba Vender
  const [avataresVendiveis, setAvataresVendiveis] = useState([]);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [precoMoedas, setPrecoMoedas] = useState('');
  const [precoFragmentos, setPrecoFragmentos] = useState('');
  const [mensagem, setMensagem] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    carregarDados(parsedUser.id);
  }, [router]);

  // Recarregar dados quando mudar de aba
  useEffect(() => {
    if (user && activeTab === 'sell') {
      console.log('[Trade] Aba "Vender" selecionada - recarregando avatares vendíveis');
      carregarAvatares(user.id);
    }
  }, [activeTab, user]);

  const carregarAvatares = async (userId) => {
    try {
      // Adicionar timestamp para evitar cache
      const timestamp = new Date().getTime();
      const avataresRes = await fetch(`/api/trade/available-avatares?userId=${userId}&t=${timestamp}`);
      const avataresData = await avataresRes.json();
      console.log('[Trade] Avatares vendíveis carregados:', avataresData.count, avataresData.avatares);
      if (avataresRes.ok) {
        setAvataresVendiveis(avataresData.avatares || []);
      }
    } catch (error) {
      console.error("Erro ao carregar avatares vendíveis:", error);
    }
  };

  const carregarDados = async (userId) => {
    setLoading(true);
    try {
      // Stats
      const statsRes = await fetch(`/api/inicializar-jogador`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const statsData = await statsRes.json();
      setStats(statsData.stats);

      // Avatares vendíveis
      const avataresRes = await fetch(`/api/trade/available-avatares?userId=${userId}`);
      const avataresData = await avataresRes.json();
      if (avataresRes.ok) {
        setAvataresVendiveis(avataresData.avatares || []);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const criarListing = async () => {
    if (!selectedAvatar) {
      mostrarMensagem('Selecione um avatar', 'erro');
      return;
    }

    const moedas = parseInt(precoMoedas) || 0;
    const fragmentos = parseInt(precoFragmentos) || 0;

    if (moedas === 0 && fragmentos === 0) {
      mostrarMensagem('Defina pelo menos um preço (moedas ou fragmentos)', 'erro');
      return;
    }

    try {
      const res = await fetch('/api/trade/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          avatarId: selectedAvatar.id,
          priceMoedas: moedas,
          priceFragmentos: fragmentos
        })
      });

      const data = await res.json();

      if (res.ok) {
        mostrarMensagem(data.message || 'Anúncio criado com sucesso!', 'sucesso');
        setSelectedAvatar(null);
        setPrecoMoedas('');
        setPrecoFragmentos('');
        await carregarDados(user.id);
        setActiveTab('my-listings');
      } else {
        mostrarMensagem(data.error || 'Erro ao criar anúncio', 'erro');
      }
    } catch (error) {
      console.error("Erro ao criar listing:", error);
      mostrarMensagem('Erro de conexão', 'erro');
    }
  };

  const mostrarMensagem = (texto, tipo) => {
    setMensagem({ texto, tipo });
    setTimeout(() => setMensagem(null), 4000);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center">
        <div className="text-cyan-400 font-mono animate-pulse">Carregando marketplace...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-300 bg-clip-text text-transparent mb-2">
              💱 MERCADO DE TRADE
            </h1>
            <p className="text-slate-400 font-mono text-sm">
              💰 {stats?.moedas || 0} Moedas • 💎 {stats?.fragmentos || 0} Fragmentos
            </p>
          </div>

          <button
            onClick={() => router.push("/dashboard")}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all"
          >
            ← Voltar
          </button>
        </div>

        {/* Mensagem */}
        {mensagem && (
          <div className={`mb-6 p-4 rounded-lg border ${
            mensagem.tipo === 'sucesso'
              ? 'bg-green-500/20 border-green-500 text-green-300'
              : 'bg-red-500/20 border-red-500 text-red-300'
          }`}>
            {mensagem.texto}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setActiveTab('marketplace')}
            className={`px-6 py-3 rounded-lg font-bold transition-all ${
              activeTab === 'marketplace'
                ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white'
                : 'bg-slate-900/50 text-slate-400 hover:bg-slate-800/50'
            }`}
          >
            🛒 Mercado
          </button>
          <button
            onClick={() => setActiveTab('my-listings')}
            className={`px-6 py-3 rounded-lg font-bold transition-all ${
              activeTab === 'my-listings'
                ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white'
                : 'bg-slate-900/50 text-slate-400 hover:bg-slate-800/50'
            }`}
          >
            📋 Meus Anúncios
          </button>
          <button
            onClick={() => setActiveTab('sell')}
            className={`px-6 py-3 rounded-lg font-bold transition-all ${
              activeTab === 'sell'
                ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white'
                : 'bg-slate-900/50 text-slate-400 hover:bg-slate-800/50'
            }`}
          >
            💰 Vender
          </button>
        </div>

        {/* MERCADO */}
        {activeTab === 'marketplace' && (
          <div className="text-center py-20 bg-slate-900/30 rounded-lg border border-slate-800">
            <div className="text-6xl mb-4 opacity-20">🛒</div>
            <h3 className="text-xl font-bold text-slate-400">Aba Mercado</h3>
            <p className="text-slate-500 text-sm">Vazia - aguardando código</p>
          </div>
        )}

        {/* MEUS ANÚNCIOS */}
        {activeTab === 'my-listings' && (
          <div className="text-center py-20 bg-slate-900/30 rounded-lg border border-slate-800">
            <div className="text-6xl mb-4 opacity-20">📋</div>
            <h3 className="text-xl font-bold text-slate-400">Aba Meus Anúncios</h3>
            <p className="text-slate-500 text-sm">Vazia - aguardando código</p>
          </div>
        )}

        {/* VENDER */}
        {activeTab === 'sell' && (
          <div className="max-w-4xl mx-auto bg-slate-900/50 border border-amber-500/30 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-amber-400">Vender Avatar</h2>
              <button
                onClick={() => user && carregarAvatares(user.id)}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-bold transition-all"
              >
                🔄 Recarregar
              </button>
            </div>

            {avataresVendiveis.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4 opacity-20">😔</div>
                <h3 className="text-xl font-bold text-slate-400 mb-2">Nenhum avatar disponível</h3>
                <p className="text-slate-500 text-sm">
                  Apenas avatares vivos, inativos, sem marca da morte e não listados podem ser vendidos.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Selecionar Avatar */}
                <div>
                  <label className="block text-amber-400 font-bold mb-3">
                    Selecione o Avatar ({avataresVendiveis.length} disponíveis)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {avataresVendiveis.map((avatar) => (
                      <button
                        key={avatar.id}
                        onClick={() => setSelectedAvatar(avatar)}
                        className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center ${
                          selectedAvatar?.id === avatar.id
                            ? 'border-amber-500 bg-amber-500/20'
                            : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                        }`}
                      >
                        <AvatarSVG avatar={avatar} tamanho={80} />
                        <div className="mt-2 text-xs font-bold truncate w-full text-center">{avatar.nome}</div>
                        <div className="text-xs text-slate-400">{avatar.raridade}</div>
                        <div className="text-xs text-slate-500">Nv.{avatar.nivel}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Definir Preço */}
                {selectedAvatar && (
                  <div className="space-y-4 bg-slate-800/30 rounded-lg p-4 border border-slate-700">
                    <div className="flex items-center gap-4 pb-4 border-b border-slate-700">
                      <AvatarSVG avatar={selectedAvatar} tamanho={80} />
                      <div>
                        <h3 className="font-bold text-lg">{selectedAvatar.nome}</h3>
                        <p className="text-sm text-slate-400">
                          {selectedAvatar.raridade} • {getEmojiElemento(selectedAvatar.elemento)} {selectedAvatar.elemento} • Nv.{selectedAvatar.nivel}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Poder: {(selectedAvatar.forca + selectedAvatar.agilidade + selectedAvatar.resistencia + selectedAvatar.foco)}
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-amber-400 font-bold mb-2">Definir Preço</label>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-slate-400 mb-1">💰 Moedas</label>
                          <input
                            type="number"
                            min="0"
                            value={precoMoedas}
                            onChange={(e) => setPrecoMoedas(e.target.value)}
                            placeholder="0"
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded text-white focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm text-slate-400 mb-1">💎 Fragmentos</label>
                          <input
                            type="number"
                            min="0"
                            value={precoFragmentos}
                            onChange={(e) => setPrecoFragmentos(e.target.value)}
                            placeholder="0"
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded text-white focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-sm text-amber-200">
                      <strong>Nota:</strong> Uma taxa de 5% será deduzida do valor de venda.
                    </div>

                    <button
                      onClick={criarListing}
                      className="w-full py-4 bg-gradient-to-r from-amber-600 to-yellow-600 text-white font-bold rounded-lg hover:from-amber-500 hover:to-yellow-500 transition-all"
                    >
                      CRIAR ANÚNCIO
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
