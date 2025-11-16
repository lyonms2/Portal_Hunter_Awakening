"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AvatarSVG from '../components/AvatarSVG';
import AvatarDetalhes from '../avatares/components/AvatarDetalhes';

export default function TradePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('marketplace');
  const [listings, setListings] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [myAvatares, setMyAvatares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalDetalhes, setModalDetalhes] = useState(null);
  const [mensagem, setMensagem] = useState(null);

  // DEBUG
  const [debugData, setDebugData] = useState({
    listings: null,
    myListings: null,
    avatares: null
  });

  // Vender
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [precoMoedas, setPrecoMoedas] = useState('');
  const [precoFragmentos, setPrecoFragmentos] = useState('');

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
      // Stats
      const statsRes = await fetch(`/api/inicializar-jogador`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const statsData = await statsRes.json();
      setStats(statsData.stats);

      // Listings marketplace
      const listingsRes = await fetch('/api/trade/listings');
      const listingsData = await listingsRes.json();
      setDebugData(prev => ({ ...prev, listings: listingsData }));
      if (listingsRes.ok) {
        setListings(listingsData.listings || []);
      }

      // Meus listings
      const myListingsRes = await fetch(`/api/trade/my-listings?userId=${userId}`);
      const myListingsData = await myListingsRes.json();
      setDebugData(prev => ({ ...prev, myListings: myListingsData }));
      if (myListingsRes.ok) {
        setMyListings(myListingsData.listings || []);
      }

      // Meus avatares
      const avataresRes = await fetch(`/api/meus-avatares?userId=${userId}`);
      const avataresData = await avataresRes.json();
      setDebugData(prev => ({ ...prev, avatares: { count: avataresData.avatares?.length || 0, avatares: avataresData.avatares } }));
      if (avataresRes.ok) {
        setMyAvatares(avataresData.avatares || []);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      mostrarMensagem('Erro ao carregar dados', 'erro');
    } finally {
      setLoading(false);
    }
  };

  const criarListing = async () => {
    if (!selectedAvatar || (!precoMoedas && !precoFragmentos)) {
      mostrarMensagem('Selecione um avatar e defina um preço', 'erro');
      return;
    }

    const moedas = parseInt(precoMoedas) || 0;
    const fragmentos = parseInt(precoFragmentos) || 0;

    if (moedas === 0 && fragmentos === 0) {
      mostrarMensagem('Defina pelo menos um preço', 'erro');
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
        mostrarMensagem(data.message, 'sucesso');
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

  const comprarListing = async (listing) => {
    if (!window.confirm(`Comprar ${listing.avatar.nome} por ${listing.price_moedas} moedas + ${listing.price_fragmentos} fragmentos (+ 5% taxa)?`)) {
      return;
    }

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
        mostrarMensagem(data.message, 'sucesso');
        await carregarDados(user.id);
      } else {
        mostrarMensagem(data.error || 'Erro ao comprar', 'erro');
      }
    } catch (error) {
      console.error("Erro ao comprar:", error);
      mostrarMensagem('Erro de conexão', 'erro');
    }
  };

  const cancelarListing = async (listingId) => {
    if (!window.confirm('Cancelar este anúncio?')) {
      return;
    }

    try {
      const res = await fetch('/api/trade/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          listingId
        })
      });

      const data = await res.json();
      if (res.ok) {
        mostrarMensagem(data.message, 'sucesso');
        await carregarDados(user.id);
      } else {
        mostrarMensagem(data.error || 'Erro ao cancelar', 'erro');
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

  // Avatares disponíveis para venda
  const avatarIdsEmAnuncios = new Set(myListings.map(l => l.avatar_id));
  const avataresVendiveis = myAvatares.filter(av =>
    av.vivo && !av.ativo && !av.marca_morte && !avatarIdsEmAnuncios.has(av.id)
  );

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
        {/* DEBUG PANEL - BEM GRANDE E VISÍVEL */}
        <div className="mb-6 bg-red-900/30 border-2 border-red-500 rounded-lg p-6">
          <h2 className="text-2xl font-black text-red-400 mb-4">🐛 DEBUG INFO</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-black/50 p-4 rounded">
              <div className="text-amber-400 font-bold mb-2">MARKETPLACE</div>
              <div className="text-white text-sm space-y-1">
                <div>Listings no estado: <span className="text-cyan-400">{listings.length}</span></div>
                <div>Raw count (API): <span className="text-cyan-400">{debugData.listings?.debug?.rawCount || '?'}</span></div>
                <div>Join count (API): <span className="text-cyan-400">{debugData.listings?.debug?.joinCount || '?'}</span></div>
                <div>Final count (API): <span className="text-cyan-400">{debugData.listings?.debug?.finalCount || '?'}</span></div>
                {debugData.listings?.debug?.missingAvatars && (
                  <div className="text-red-400">⚠️ {debugData.listings.debug.missingAvatars.length} listings SEM avatar!</div>
                )}
              </div>
            </div>

            <div className="bg-black/50 p-4 rounded">
              <div className="text-purple-400 font-bold mb-2">MEUS ANÚNCIOS</div>
              <div className="text-white text-sm space-y-1">
                <div>userId: <span className="text-cyan-400 text-[10px] break-all">{user?.id}</span></div>
                <div>Listings no estado: <span className="text-cyan-400">{myListings.length}</span></div>
                <div>Raw count (API): <span className="text-cyan-400">{debugData.myListings?.debug?.rawCount || '?'}</span></div>
                <div>Join count (API): <span className="text-cyan-400">{debugData.myListings?.debug?.joinCount || '?'}</span></div>
                <div>Final count (API): <span className="text-cyan-400">{debugData.myListings?.debug?.finalCount || '?'}</span></div>
                {debugData.myListings?.debug?.missingAvatars && (
                  <div className="text-red-400">⚠️ {debugData.myListings.debug.missingAvatars.length} listings SEM avatar!</div>
                )}
              </div>
            </div>

            <div className="bg-black/50 p-4 rounded">
              <div className="text-green-400 font-bold mb-2">MEUS AVATARES</div>
              <div className="text-white text-sm space-y-1">
                <div>Total: <span className="text-cyan-400">{myAvatares.length}</span></div>
                <div>Vendíveis: <span className="text-cyan-400">{avataresVendiveis.length}</span></div>
                <div>Em anúncios: <span className="text-cyan-400">{avatarIdsEmAnuncios.size}</span></div>
              </div>
            </div>
          </div>

          <details className="bg-black/50 p-4 rounded">
            <summary className="cursor-pointer text-yellow-400 font-bold mb-2">VER JSON COMPLETO DAS APIS</summary>
            <div className="mt-4 space-y-4">
              <div>
                <div className="text-amber-400 font-bold mb-1">Listings API Response:</div>
                <pre className="bg-black p-2 rounded text-xs overflow-auto max-h-60">{JSON.stringify(debugData.listings, null, 2)}</pre>
              </div>
              <div>
                <div className="text-purple-400 font-bold mb-1">My Listings API Response:</div>
                <pre className="bg-black p-2 rounded text-xs overflow-auto max-h-60">{JSON.stringify(debugData.myListings, null, 2)}</pre>
              </div>
              <div>
                <div className="text-green-400 font-bold mb-1">Avatares:</div>
                <pre className="bg-black p-2 rounded text-xs overflow-auto max-h-60">{JSON.stringify(debugData.avatares, null, 2)}</pre>
              </div>
            </div>
          </details>
        </div>

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
            📋 Meus Anúncios ({myListings.length})
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
          <div>
            {listings.length === 0 ? (
              <div className="text-center py-20 bg-slate-900/30 rounded-lg border border-slate-800">
                <div className="text-6xl mb-4 opacity-20">🛒</div>
                <h3 className="text-xl font-bold text-slate-400">Marketplace vazio</h3>
                <p className="text-slate-500 text-sm">Seja o primeiro a vender!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {listings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    onComprar={() => comprarListing(listing)}
                    onVer={() => setModalDetalhes(listing.avatar)}
                    isOwn={listing.seller_id === user?.id}
                    getCorElemento={getCorElemento}
                    getEmojiElemento={getEmojiElemento}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* MEUS ANÚNCIOS */}
        {activeTab === 'my-listings' && (
          <div>
            {myListings.length === 0 ? (
              <div className="text-center py-20 bg-slate-900/30 rounded-lg border border-slate-800">
                <div className="text-6xl mb-4 opacity-20">📋</div>
                <h3 className="text-xl font-bold text-slate-400">Nenhum anúncio ativo</h3>
                <p className="text-slate-500 text-sm mb-4">Venda seus avatares extras!</p>
                <button
                  onClick={() => setActiveTab('sell')}
                  className="px-6 py-3 bg-gradient-to-r from-amber-600 to-yellow-600 text-white font-bold rounded-lg"
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
                    onVer={() => setModalDetalhes(listing.avatar)}
                    getCorElemento={getCorElemento}
                    getEmojiElemento={getEmojiElemento}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* VENDER */}
        {activeTab === 'sell' && (
          <div className="max-w-4xl mx-auto bg-slate-900/50 border border-amber-500/30 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-amber-400 mb-4">Vender Avatar</h2>

            {avataresVendiveis.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4 opacity-20">😔</div>
                <h3 className="text-xl font-bold text-slate-400 mb-2">Nenhum avatar disponível</h3>
                <p className="text-slate-500 text-sm">
                  Apenas avatares vivos, inativos e sem marca da morte podem ser vendidos.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Selecionar Avatar */}
                <div>
                  <label className="block text-amber-400 font-bold mb-3">Selecione o Avatar</label>
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
                      </button>
                    ))}
                  </div>
                </div>

                {/* Definir Preço */}
                {selectedAvatar && (
                  <div className="space-y-4">
                    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 flex items-center gap-4">
                      <AvatarSVG avatar={selectedAvatar} tamanho={80} />
                      <div>
                        <h3 className="font-bold text-lg">{selectedAvatar.nome}</h3>
                        <p className="text-sm text-slate-400">
                          {selectedAvatar.raridade} • {getEmojiElemento(selectedAvatar.elemento)} {selectedAvatar.elemento} • Nv.{selectedAvatar.nivel}
                        </p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-amber-400 font-bold mb-2">💰 Moedas</label>
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
                        <label className="block text-amber-400 font-bold mb-2">💎 Fragmentos</label>
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

                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-sm text-amber-200">
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

      {/* Modal Detalhes */}
      {modalDetalhes && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setModalDetalhes(null)}>
          <div onClick={(e) => e.stopPropagation()}>
            <AvatarDetalhes
              avatar={modalDetalhes}
              onClose={() => setModalDetalhes(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Card de Listing no Marketplace
function ListingCard({ listing, onComprar, onVer, isOwn, getCorElemento, getEmojiElemento }) {
  const avatar = listing.avatar;
  const poderTotal = (avatar.forca || 0) + (avatar.agilidade || 0) + (avatar.resistencia || 0) + (avatar.foco || 0);
  const habilidades = Array.isArray(avatar.habilidades) ? avatar.habilidades : [];

  return (
    <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 hover:border-amber-500/50 transition-all">
      <div className="flex justify-between items-start mb-2">
        <div className="text-xs text-slate-500">por {listing.seller_username}</div>
        {isOwn && <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">SEU</span>}
      </div>

      <div className="flex justify-center mb-3">
        <AvatarSVG avatar={avatar} tamanho={100} />
      </div>

      <h3 className="font-bold text-center mb-1">{avatar.nome}</h3>
      <p className="text-xs text-center text-slate-400 mb-3">
        {avatar.raridade} • {getEmojiElemento(avatar.elemento)} {avatar.elemento} • Nv.{avatar.nivel}
      </p>

      <div className="bg-slate-950/50 rounded px-2 py-1 mb-2 text-center">
        <div className="text-[10px] text-slate-500">Poder Total</div>
        <div className="text-lg font-black bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          {poderTotal}
        </div>
      </div>

      {habilidades.length > 0 && (
        <div className="bg-slate-950/50 rounded px-2 py-1.5 mb-3">
          <div className="text-[10px] text-purple-400 uppercase mb-1">Habilidades ({habilidades.length})</div>
          <div className="text-[10px] text-slate-400 truncate">
            {habilidades[0]?.nome}
            {habilidades.length > 1 && ` +${habilidades.length - 1}`}
          </div>
        </div>
      )}

      <div className="bg-amber-500/10 rounded p-2 mb-3 text-center">
        <div className="font-bold text-amber-300">
          {listing.price_moedas > 0 && `💰 ${listing.price_moedas}`}
          {listing.price_moedas > 0 && listing.price_fragmentos > 0 && ' + '}
          {listing.price_fragmentos > 0 && `💎 ${listing.price_fragmentos}`}
        </div>
        <div className="text-[10px] text-slate-500">+ taxa 5%</div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onVer}
          className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded transition-all text-sm font-bold"
        >
          VER
        </button>
        {!isOwn && (
          <button
            onClick={onComprar}
            className="flex-1 py-2 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white rounded transition-all text-sm font-bold"
          >
            COMPRAR
          </button>
        )}
      </div>
    </div>
  );
}

// Card de Meus Anúncios
function MyListingCard({ listing, onCancelar, onVer, getCorElemento, getEmojiElemento }) {
  const avatar = listing.avatar;

  return (
    <div className="bg-slate-900/50 border border-purple-500/50 rounded-lg p-4">
      <div className="flex justify-center mb-3">
        <AvatarSVG avatar={avatar} tamanho={100} />
      </div>

      <h3 className="font-bold text-center mb-1">{avatar.nome}</h3>
      <p className="text-xs text-center text-slate-400 mb-3">
        {avatar.raridade} • {getEmojiElemento(avatar.elemento)} {avatar.elemento} • Nv.{avatar.nivel}
      </p>

      <div className="bg-amber-500/10 rounded p-2 mb-3 text-center">
        <div className="font-bold text-amber-300">
          {listing.price_moedas > 0 && `💰 ${listing.price_moedas}`}
          {listing.price_moedas > 0 && listing.price_fragmentos > 0 && ' + '}
          {listing.price_fragmentos > 0 && `💎 ${listing.price_fragmentos}`}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onVer}
          className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded transition-all text-sm font-bold"
        >
          VER
        </button>
        <button
          onClick={onCancelar}
          className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-all text-sm font-bold"
        >
          CANCELAR
        </button>
      </div>
    </div>
  );
}
