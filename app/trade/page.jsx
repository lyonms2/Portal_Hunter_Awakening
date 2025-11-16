"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AvatarSVG from '../components/AvatarSVG';

export default function TradePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('marketplace'); // marketplace, my-listings, sell
  const [listings, setListings] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [myAvatares, setMyAvatares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalCompra, setModalCompra] = useState(null);
  const [comprando, setComprando] = useState(false);
  const [mensagem, setMensagem] = useState(null);

  // Filtros
  const [filtroTipo, setFiltroTipo] = useState('all'); // all, avatar, item
  const [filtroRaridade, setFiltroRaridade] = useState('all');
  const [filtroElemento, setFiltroElemento] = useState('all');
  const [ordenacao, setOrdenacao] = useState('recent'); // recent, price_asc, price_desc

  // Criar listing
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [precoMoedas, setPrecoMoedas] = useState('');
  const [precoFragmentos, setPrecoFragmentos] = useState('');
  const [criandoListing, setCriandoListing] = useState(false);

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

  const carregarDados = async (userId) => {
    setLoading(true);
    try {
      // Carregar stats do jogador
      const statsRes = await fetch(`/api/inicializar-jogador`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const statsData = await statsRes.json();
      setStats(statsData.stats);

      // Carregar listings do mercado
      await carregarListings();

      // Carregar meus avatares (para vender)
      const avataresRes = await fetch(`/api/meus-avatares?userId=${userId}`);
      const avataresData = await avataresRes.json();
      if (avataresRes.ok) {
        setMyAvatares(avataresData.avatares || []);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const carregarListings = async () => {
    try {
      const res = await fetch('/api/trade/listings');
      const data = await res.json();
      if (res.ok) {
        setListings(data.listings || []);
      }
    } catch (error) {
      console.error("Erro ao carregar listings:", error);
    }
  };

  const carregarMeusListings = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/trade/my-listings?userId=${user.id}`);
      const data = await res.json();
      if (res.ok) {
        setMyListings(data.listings || []);
      }
    } catch (error) {
      console.error("Erro ao carregar meus listings:", error);
    }
  };

  useEffect(() => {
    if (activeTab === 'my-listings' && user) {
      carregarMeusListings();
    }
  }, [activeTab, user]);

  const criarListing = async () => {
    if (!selectedAvatar || (!precoMoedas && !precoFragmentos)) {
      mostrarMensagem('Selecione um avatar e defina um preço', 'erro');
      return;
    }

    const moedas = parseInt(precoMoedas) || 0;
    const fragmentos = parseInt(precoFragmentos) || 0;

    if (moedas < 0 || fragmentos < 0) {
      mostrarMensagem('Preço não pode ser negativo', 'erro');
      return;
    }

    if (moedas === 0 && fragmentos === 0) {
      mostrarMensagem('Defina pelo menos um preço (moedas ou fragmentos)', 'erro');
      return;
    }

    setCriandoListing(true);
    try {
      const res = await fetch('/api/trade/create-listing', {
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
        mostrarMensagem('Listing criado com sucesso!', 'sucesso');
        setSelectedAvatar(null);
        setPrecoMoedas('');
        setPrecoFragmentos('');
        await carregarDados(user.id);
        setActiveTab('my-listings');
      } else {
        mostrarMensagem(data.message || 'Erro ao criar listing', 'erro');
      }
    } catch (error) {
      console.error("Erro ao criar listing:", error);
      mostrarMensagem('Erro de conexão', 'erro');
    } finally {
      setCriandoListing(false);
    }
  };

  const comprarListing = async (listing) => {
    setComprando(true);
    try {
      const res = await fetch('/api/trade/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          listingId: listing.id
        })
      });

      const data = await res.json();
      if (res.ok) {
        mostrarMensagem('Compra realizada com sucesso!', 'sucesso');
        setModalCompra(null);
        await carregarDados(user.id);
      } else {
        mostrarMensagem(data.message || 'Erro ao comprar', 'erro');
        setModalCompra(null);
      }
    } catch (error) {
      console.error("Erro ao comprar:", error);
      mostrarMensagem('Erro de conexão', 'erro');
      setModalCompra(null);
    } finally {
      setComprando(false);
    }
  };

  const cancelarListing = async (listingId) => {
    try {
      const res = await fetch('/api/trade/cancel', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          listingId
        })
      });

      const data = await res.json();
      if (res.ok) {
        mostrarMensagem('Listing cancelado', 'sucesso');
        await carregarMeusListings();
        await carregarListings();
      } else {
        mostrarMensagem(data.message || 'Erro ao cancelar', 'erro');
      }
    } catch (error) {
      console.error("Erro ao cancelar:", error);
      mostrarMensagem('Erro de conexão', 'erro');
    }
  };

  const mostrarMensagem = (texto, tipo) => {
    setMensagem({ texto, tipo });
    setTimeout(() => setMensagem(null), 4000);
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

  const getCorRaridade = (raridade) => {
    switch (raridade) {
      case 'Lendário': return 'from-amber-500 to-yellow-500';
      case 'Raro': return 'from-purple-500 to-pink-500';
      default: return 'from-slate-600 to-slate-700';
    }
  };

  // Filtrar e ordenar listings
  let listingsFiltrados = [...listings];

  if (filtroTipo !== 'all') {
    listingsFiltrados = listingsFiltrados.filter(l => l.listing_type === filtroTipo);
  }

  if (filtroRaridade !== 'all') {
    listingsFiltrados = listingsFiltrados.filter(l =>
      l.avatar_data?.raridade === filtroRaridade
    );
  }

  if (filtroElemento !== 'all') {
    listingsFiltrados = listingsFiltrados.filter(l =>
      l.avatar_data?.elemento === filtroElemento
    );
  }

  // Ordenar
  listingsFiltrados.sort((a, b) => {
    switch (ordenacao) {
      case 'price_asc':
        return (a.price_moedas + a.price_fragmentos * 10) - (b.price_moedas + b.price_fragmentos * 10);
      case 'price_desc':
        return (b.price_moedas + b.price_fragmentos * 10) - (a.price_moedas + a.price_fragmentos * 10);
      case 'recent':
      default:
        return new Date(b.created_at) - new Date(a.created_at);
    }
  });

  // Avatares que podem ser vendidos
  const avataresVendiveis = myAvatares.filter(av =>
    av.vivo && !av.ativo && !(av.marca_morte && !av.vivo)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center">
        <div className="text-cyan-400 font-mono animate-pulse">Carregando marketplace...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-gray-100 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-amber-500/5 rounded-full blur-3xl top-20 -left-48 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl bottom-20 -right-48 animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTYiIGhlaWdodD0iMTAwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0yOCAwTDAgMTVWMzVMMjggNTBMNTYgMzVWMTVaTTI4IDUwTDAgNjVWODVMMjggMTAwTDU2IDg1VjY1WiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjYW1iZXIiIHN0cm9rZS13aWR0aD0iMC41Ii8+PC9zdmc+')] pointer-events-none"></div>
      <div className="absolute inset-0 shadow-[inset_0_0_120px_rgba(0,0,0,0.9)] pointer-events-none"></div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-300 bg-clip-text text-transparent mb-2 flex items-center gap-3">
              <span className="text-5xl">💱</span>
              MERCADO DE TRADE
            </h1>
            <p className="text-slate-400 font-mono text-sm">
              💰 {stats?.moedas || 0} Moedas • 💎 {stats?.fragmentos || 0} Fragmentos
            </p>
          </div>

          <button
            onClick={() => router.push("/dashboard")}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-all"
          >
            ← Voltar
          </button>
        </div>

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
            💰 Vender Avatar
          </button>
        </div>

        {/* Conteúdo das Tabs */}
        {activeTab === 'marketplace' && (
          <div>
            {/* Filtros */}
            <div className="mb-6 bg-slate-900/50 border border-slate-700/50 rounded-lg p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <select
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value)}
                  className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white focus:border-amber-500 focus:outline-none"
                >
                  <option value="all">Todos os Tipos</option>
                  <option value="avatar">Avatares</option>
                  <option value="item">Itens</option>
                </select>

                <select
                  value={filtroRaridade}
                  onChange={(e) => setFiltroRaridade(e.target.value)}
                  className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white focus:border-amber-500 focus:outline-none"
                >
                  <option value="all">Todas Raridades</option>
                  <option value="Comum">Comum</option>
                  <option value="Raro">Raro</option>
                  <option value="Lendário">Lendário</option>
                </select>

                <select
                  value={filtroElemento}
                  onChange={(e) => setFiltroElemento(e.target.value)}
                  className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white focus:border-amber-500 focus:outline-none"
                >
                  <option value="all">Todos Elementos</option>
                  <option value="Fogo">🔥 Fogo</option>
                  <option value="Água">💧 Água</option>
                  <option value="Terra">🪨 Terra</option>
                  <option value="Vento">💨 Vento</option>
                  <option value="Eletricidade">⚡ Eletricidade</option>
                  <option value="Sombra">🌑 Sombra</option>
                  <option value="Luz">✨ Luz</option>
                </select>

                <select
                  value={ordenacao}
                  onChange={(e) => setOrdenacao(e.target.value)}
                  className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white focus:border-amber-500 focus:outline-none"
                >
                  <option value="recent">Mais Recentes</option>
                  <option value="price_asc">Menor Preço</option>
                  <option value="price_desc">Maior Preço</option>
                </select>
              </div>

              <div className="mt-3 text-xs text-slate-500 font-mono">
                {listingsFiltrados.length} {listingsFiltrados.length === 1 ? 'anúncio encontrado' : 'anúncios encontrados'}
              </div>
            </div>

            {/* Listings Grid */}
            {listingsFiltrados.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4 opacity-20">🔍</div>
                <h3 className="text-xl font-bold text-slate-400 mb-2">Nenhum anúncio encontrado</h3>
                <p className="text-slate-500 text-sm">Tente ajustar os filtros ou seja o primeiro a vender!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {listingsFiltrados.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    onComprar={() => setModalCompra(listing)}
                    isOwnListing={listing.seller_id === user?.id}
                    getCorRaridade={getCorRaridade}
                    getCorElemento={getCorElemento}
                    getEmojiElemento={getEmojiElemento}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'my-listings' && (
          <div>
            <div className="mb-4 text-sm text-slate-400">
              Seus anúncios ativos no marketplace
            </div>

            {myListings.length === 0 ? (
              <div className="text-center py-20 bg-slate-900/30 rounded-lg border border-slate-800">
                <div className="text-6xl mb-4 opacity-20">📋</div>
                <h3 className="text-xl font-bold text-slate-400 mb-2">Nenhum anúncio ativo</h3>
                <p className="text-slate-500 text-sm mb-4">Venda seus avatares extras!</p>
                <button
                  onClick={() => setActiveTab('sell')}
                  className="px-6 py-3 bg-gradient-to-r from-amber-600 to-yellow-600 text-white font-bold rounded-lg hover:from-amber-500 hover:to-yellow-500 transition-all"
                >
                  Criar Anúncio
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {myListings.map((listing) => (
                  <MyListingCard
                    key={listing.id}
                    listing={listing}
                    onCancelar={() => cancelarListing(listing.id)}
                    getCorRaridade={getCorRaridade}
                    getCorElemento={getCorElemento}
                    getEmojiElemento={getEmojiElemento}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'sell' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-slate-900/50 border border-amber-500/30 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-amber-400 mb-4">Vender Avatar</h2>

              {avataresVendiveis.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4 opacity-20">😔</div>
                  <h3 className="text-xl font-bold text-slate-400 mb-2">Nenhum avatar disponível para venda</h3>
                  <p className="text-slate-500 text-sm">
                    Apenas avatares vivos, inativos e sem marca da morte podem ser vendidos.
                  </p>
                </div>
              ) : (
                <div>
                  <div className="mb-6">
                    <label className="block text-amber-400 text-sm font-bold mb-3">
                      Selecione o Avatar
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {avataresVendiveis.map((avatar) => (
                        <button
                          key={avatar.id}
                          onClick={() => setSelectedAvatar(avatar)}
                          className={`relative p-3 rounded-lg border-2 transition-all ${
                            selectedAvatar?.id === avatar.id
                              ? 'border-amber-500 bg-amber-500/20'
                              : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                          }`}
                        >
                          <AvatarSVG avatar={avatar} tamanho={80} />
                          <div className="mt-2 text-xs font-bold text-white truncate">{avatar.nome}</div>
                          <div className="text-xs text-slate-400">{avatar.raridade}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedAvatar && (
                    <div className="space-y-4">
                      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                        <div className="flex items-center gap-4">
                          <AvatarSVG avatar={selectedAvatar} tamanho={100} />
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-white mb-1">{selectedAvatar.nome}</h3>
                            <div className="flex items-center gap-2 text-sm">
                              <span className={`px-2 py-0.5 rounded ${
                                selectedAvatar.raridade === 'Lendário' ? 'bg-amber-500/20 text-amber-400' :
                                selectedAvatar.raridade === 'Raro' ? 'bg-purple-500/20 text-purple-400' :
                                'bg-slate-600/20 text-slate-400'
                              } font-bold`}>
                                {selectedAvatar.raridade}
                              </span>
                              <span className={getCorElemento(selectedAvatar.elemento)}>
                                {getEmojiElemento(selectedAvatar.elemento)} {selectedAvatar.elemento}
                              </span>
                              <span className="text-slate-400">• Nv.{selectedAvatar.nivel}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-amber-400 text-sm font-bold mb-2">
                            💰 Preço em Moedas
                          </label>
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
                          <label className="block text-amber-400 text-sm font-bold mb-2">
                            💎 Preço em Fragmentos
                          </label>
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

                      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                        <div className="text-sm text-slate-400 mb-2">ℹ️ Informações Importantes:</div>
                        <ul className="text-xs text-slate-500 space-y-1">
                          <li>• Taxa do sistema: 5% (você receberá 95% do valor)</li>
                          <li>• O anúncio expira automaticamente em 30 dias</li>
                          <li>• Você pode cancelar o anúncio a qualquer momento</li>
                          <li>• Defina pelo menos um preço (moedas ou fragmentos)</li>
                        </ul>
                      </div>

                      <button
                        onClick={criarListing}
                        disabled={criandoListing || (!precoMoedas && !precoFragmentos)}
                        className="w-full py-4 bg-gradient-to-r from-amber-600 to-yellow-600 text-white font-bold rounded-lg hover:from-amber-500 hover:to-yellow-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {criandoListing ? 'Criando Anúncio...' : '✅ Criar Anúncio de Venda'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
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

              <div className="relative bg-slate-950/95 backdrop-blur-xl border border-amber-900/30 rounded-lg overflow-hidden">
                <div className="p-4 text-center font-bold text-lg bg-gradient-to-r from-amber-600 to-yellow-600">
                  🛒 Confirmar Compra
                </div>

                <div className="p-6">
                  {modalCompra.avatar_data && (
                    <div className="mb-4 text-center">
                      <AvatarSVG avatar={modalCompra.avatar_data} tamanho={120} />
                      <h3 className="text-xl font-bold text-white mt-2">{modalCompra.avatar_data.nome}</h3>
                      <div className="text-sm text-slate-400">
                        {modalCompra.avatar_data.raridade} • {modalCompra.avatar_data.elemento} • Nv.{modalCompra.avatar_data.nivel}
                      </div>
                    </div>
                  )}

                  <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700 mb-4">
                    <div className="text-sm text-slate-400 mb-2">Preço Total (com taxa de 5%):</div>
                    {modalCompra.price_moedas > 0 && (
                      <div className="text-2xl font-bold text-amber-400">
                        💰 {Math.ceil(modalCompra.price_moedas * 1.05)} Moedas
                      </div>
                    )}
                    {modalCompra.price_fragmentos > 0 && (
                      <div className="text-2xl font-bold text-purple-400">
                        💎 {Math.ceil(modalCompra.price_fragmentos * 1.05)} Fragmentos
                      </div>
                    )}
                  </div>

                  <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-3 mb-4">
                    <div className="text-xs text-amber-400">
                      ⚠️ Seu saldo atual: 💰 {stats?.moedas || 0} • 💎 {stats?.fragmentos || 0}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setModalCompra(null)}
                      disabled={comprando}
                      className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => comprarListing(modalCompra)}
                      disabled={comprando}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-600 to-yellow-600 text-white font-bold rounded hover:from-amber-500 hover:to-yellow-500 transition-all disabled:opacity-50"
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

      {/* Toast de Mensagem */}
      {mensagem && (
        <div className="fixed top-8 right-8 z-50 animate-fade-in">
          <div className={`px-6 py-4 rounded-lg border-2 ${
            mensagem.tipo === 'sucesso'
              ? 'bg-green-900/90 border-green-500'
              : 'bg-red-900/90 border-red-500'
          } backdrop-blur-xl`}>
            <p className={`font-semibold ${
              mensagem.tipo === 'sucesso' ? 'text-green-200' : 'text-red-200'
            }`}>
              {mensagem.texto}
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

// Componente de Card de Listing
function ListingCard({ listing, onComprar, isOwnListing, getCorRaridade, getCorElemento, getEmojiElemento }) {
  const avatar = listing.avatar_data;
  if (!avatar) return null;

  return (
    <div className="group relative">
      <div className={`absolute -inset-0.5 bg-gradient-to-r ${getCorRaridade(avatar.raridade)} rounded-lg blur opacity-20 group-hover:opacity-40 transition-all`}></div>

      <div className="relative bg-slate-900/80 backdrop-blur-xl border border-amber-500/30 rounded-lg overflow-hidden group-hover:border-amber-400/50 transition-all">
        <div className={`px-3 py-1.5 text-center font-bold text-xs bg-gradient-to-r ${getCorRaridade(avatar.raridade)}`}>
          {avatar.raridade.toUpperCase()}
        </div>

        <div className="py-4">
          <AvatarSVG avatar={avatar} tamanho={120} />
        </div>

        <div className="p-3">
          <h3 className="font-bold text-sm text-white mb-1 truncate">{avatar.nome}</h3>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
            <span className={getCorElemento(avatar.elemento)}>{getEmojiElemento(avatar.elemento)} {avatar.elemento}</span>
            <span>Nv.{avatar.nivel}</span>
          </div>

          <div className="bg-slate-950/50 rounded p-2 mb-3">
            {listing.price_moedas > 0 && (
              <div className="text-sm font-bold text-amber-400">
                💰 {listing.price_moedas} moedas
              </div>
            )}
            {listing.price_fragmentos > 0 && (
              <div className="text-sm font-bold text-purple-400">
                💎 {listing.price_fragmentos} frag.
              </div>
            )}
            <div className="text-xs text-slate-500 mt-1">
              + 5% taxa
            </div>
          </div>

          {isOwnListing ? (
            <div className="px-3 py-2 bg-slate-800/50 text-slate-500 text-xs font-semibold text-center rounded">
              Seu Anúncio
            </div>
          ) : (
            <button
              onClick={onComprar}
              className="w-full px-3 py-2 bg-gradient-to-r from-amber-600 to-yellow-600 text-white text-xs font-bold rounded hover:from-amber-500 hover:to-yellow-500 transition-all"
            >
              COMPRAR
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Componente de Card de Meu Listing
function MyListingCard({ listing, onCancelar, getCorRaridade, getCorElemento, getEmojiElemento }) {
  const avatar = listing.avatar_data;
  if (!avatar) return null;

  const dataExpiracao = new Date(listing.expires_at);
  const diasRestantes = Math.ceil((dataExpiracao - new Date()) / (1000 * 60 * 60 * 24));

  return (
    <div className="group relative">
      <div className={`absolute -inset-0.5 bg-gradient-to-r ${getCorRaridade(avatar.raridade)} rounded-lg blur opacity-20 group-hover:opacity-40 transition-all`}></div>

      <div className="relative bg-slate-900/80 backdrop-blur-xl border border-cyan-500/30 rounded-lg overflow-hidden">
        <div className={`px-3 py-1.5 text-center font-bold text-xs bg-gradient-to-r ${getCorRaridade(avatar.raridade)}`}>
          {avatar.raridade.toUpperCase()}
        </div>

        <div className="py-4">
          <AvatarSVG avatar={avatar} tamanho={120} />
        </div>

        <div className="p-3">
          <h3 className="font-bold text-sm text-white mb-1 truncate">{avatar.nome}</h3>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
            <span className={getCorElemento(avatar.elemento)}>{getEmojiElemento(avatar.elemento)} {avatar.elemento}</span>
            <span>Nv.{avatar.nivel}</span>
          </div>

          <div className="bg-slate-950/50 rounded p-2 mb-3">
            {listing.price_moedas > 0 && (
              <div className="text-sm font-bold text-amber-400">
                💰 {listing.price_moedas} moedas
              </div>
            )}
            {listing.price_fragmentos > 0 && (
              <div className="text-sm font-bold text-purple-400">
                💎 {listing.price_fragmentos} frag.
              </div>
            )}
            <div className="text-xs text-slate-500 mt-1">
              Expira em {diasRestantes} {diasRestantes === 1 ? 'dia' : 'dias'}
            </div>
          </div>

          <button
            onClick={onCancelar}
            className="w-full px-3 py-2 bg-red-900/30 hover:bg-red-800/40 border border-red-500/30 text-red-400 text-xs font-bold rounded transition-all"
          >
            CANCELAR ANÚNCIO
          </button>
        </div>
      </div>
    </div>
  );
}
