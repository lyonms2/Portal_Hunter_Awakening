"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AvatarSVG from '../components/AvatarSVG';
import AvatarDetalhes from "./components/AvatarDetalhes";

export default function AvatarsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [avatares, setAvatares] = useState([]);
  const [avatarSelecionado, setAvatarSelecionado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalConfirmacao, setModalConfirmacao] = useState(null);
  const [ativando, setAtivando] = useState(false);

  // Estados de filtros
  const [filtroRaridade, setFiltroRaridade] = useState('Todos');
  const [filtroElemento, setFiltroElemento] = useState('Todos');
  const [filtroStatus, setFiltroStatus] = useState('Todos');
  const [ordenacao, setOrdenacao] = useState('nivel_desc'); // nivel_desc, nivel_asc, nome_asc

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    carregarAvatares(parsedUser.id);
  }, [router]);

  const carregarAvatares = async (userId) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/meus-avatares?userId=${userId}&t=${Date.now()}`);
      const data = await response.json();

      if (response.ok) {
        setAvatares(data.avatares);
      } else {
        console.error("Erro ao carregar avatares:", data.message);
      }
    } catch (error) {
      console.error("Erro ao carregar avatares:", error);
    } finally {
      setLoading(false);
    }
  };

  const ativarAvatar = async (avatarId, avatarNome) => {
    if (ativando) return;

    setAtivando(true);

    try {
      const response = await fetch("/api/meus-avatares", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, avatarId }),
      });

      const data = await response.json();

      if (response.ok) {
        await carregarAvatares(user.id);
        setModalConfirmacao({
          tipo: 'sucesso',
          mensagem: `${avatarNome} foi ativado com sucesso!`
        });
        setTimeout(() => setModalConfirmacao(null), 3000);
      } else {
        setModalConfirmacao({
          tipo: 'erro',
          mensagem: data.message || 'Erro ao ativar avatar'
        });
        setTimeout(() => setModalConfirmacao(null), 3000);
      }
    } catch (error) {
      console.error("Erro ao ativar avatar:", error);
      setModalConfirmacao({
        tipo: 'erro',
        mensagem: 'Erro de conexão ao ativar avatar'
      });
      setTimeout(() => setModalConfirmacao(null), 3000);
    } finally {
      setAtivando(false);
    }
  };

  // Funções auxiliares
  const getCorRaridade = (raridade) => {
    switch (raridade) {
      case 'Lendário': return 'from-amber-500 to-yellow-500';
      case 'Raro': return 'from-purple-500 to-pink-500';
      default: return 'from-slate-600 to-slate-700';
    }
  };

  const getCorBorda = (raridade) => {
    switch (raridade) {
      case 'Lendário': return 'border-amber-500/50';
      case 'Raro': return 'border-purple-500/50';
      default: return 'border-slate-700/50';
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

  const getNivelExaustao = (exaustao) => {
    if (exaustao === 0) return { label: 'Descansado', cor: 'text-green-400' };
    if (exaustao < 20) return { label: 'Alerta', cor: 'text-cyan-400' };
    if (exaustao < 40) return { label: 'Cansado', cor: 'text-yellow-400' };
    if (exaustao < 60) return { label: 'Exausto', cor: 'text-orange-400' };
    if (exaustao < 80) return { label: 'Colapso Iminente', cor: 'text-red-400' };
    return { label: 'Colapsado', cor: 'text-red-600' };
  };

  const avatarAtivo = avatares.find(av => av.ativo && av.vivo);

  // Filtrar avatares (EXCLUINDO mortos com marca_morte que estão no memorial)
  let avataresFiltrados = avatares.filter(av => {
    // Não mostrar avatares que estão no memorial
    if (!av.vivo && av.marca_morte) return false;
    return true;
  });

  // Aplicar filtros
  if (filtroRaridade !== 'Todos') {
    avataresFiltrados = avataresFiltrados.filter(av => av.raridade === filtroRaridade);
  }

  if (filtroElemento !== 'Todos') {
    avataresFiltrados = avataresFiltrados.filter(av => av.elemento === filtroElemento);
  }

  if (filtroStatus !== 'Todos') {
    if (filtroStatus === 'Vivos') {
      avataresFiltrados = avataresFiltrados.filter(av => av.vivo);
    } else if (filtroStatus === 'Mortos') {
      avataresFiltrados = avataresFiltrados.filter(av => !av.vivo);
    } else if (filtroStatus === 'Com Marca') {
      avataresFiltrados = avataresFiltrados.filter(av => av.marca_morte);
    }
  }

  // Aplicar ordenação
  avataresFiltrados.sort((a, b) => {
    switch (ordenacao) {
      case 'nivel_desc':
        return b.nivel - a.nivel;
      case 'nivel_asc':
        return a.nivel - b.nivel;
      case 'nome_asc':
        return a.nome.localeCompare(b.nome);
      case 'raridade':
        const raridadeOrder = { 'Lendário': 3, 'Raro': 2, 'Comum': 1 };
        return (raridadeOrder[b.raridade] || 0) - (raridadeOrder[a.raridade] || 0);
      default:
        return 0;
    }
  });

  // Separar ativo dos inativos
  const avataresInativos = avataresFiltrados.filter(av => !av.ativo || !av.vivo);

  // Contar avatares caídos (para o botão memorial)
  const avataresCaidos = avatares.filter(av => !av.vivo && av.marca_morte).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center">
        <div className="text-cyan-400 font-mono animate-pulse">Carregando coleção...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-gray-100 relative overflow-hidden">
      {/* Partículas de fundo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl top-20 -left-48 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-purple-500/5 rounded-full blur-3xl bottom-20 -right-48 animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      {/* Grid hexagonal */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTYiIGhlaWdodD0iMTAwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0yOCAwTDAgMTVWMzVMMjggNTBMNTYgMzVWMTVaTTI4IDUwTDAgNjVWODVMMjggMTAwTDU2IDg1VjY1WiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjY3lhbiIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48L3N2Zz4=')] pointer-events-none"></div>

      {/* Vinheta */}
      <div className="absolute inset-0 shadow-[inset_0_0_120px_rgba(0,0,0,0.9)] pointer-events-none"></div>

      <div className="relative z-10 container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 bg-clip-text text-transparent mb-1">
              MINHA COLEÇÃO
            </h1>
            <p className="text-slate-400 font-mono text-xs">
              {avatares.length} {avatares.length === 1 ? 'Avatar' : 'Avatares'} | {avatares.filter(a => a.vivo).length} Vivos | {avatares.filter(a => !a.vivo).length} Mortos
            </p>
          </div>

          <div className="flex gap-2 flex-wrap">
            {/* Botão Memorial */}
            {avataresCaidos > 0 && (
              <button
                onClick={() => router.push("/memorial")}
                className="group relative px-4 py-2 bg-gradient-to-b from-gray-900 to-black rounded-lg border border-gray-700/50 hover:border-gray-600 transition-all flex items-center gap-2 text-sm"
              >
                <span className="text-lg opacity-40 group-hover:opacity-60 transition-opacity">🕯️</span>
                <span className="text-gray-400 group-hover:text-gray-300 font-semibold">MEMORIAL ({avataresCaidos})</span>
              </button>
            )}

            <button
              onClick={() => router.push("/ocultista")}
              className="px-4 py-2 bg-purple-900/30 hover:bg-purple-800/30 border border-purple-500/30 rounded-lg transition-all flex items-center gap-2 text-sm font-semibold text-purple-400"
            >
              <span>🔮</span>
              <span>INVOCAR</span>
            </button>

            <button
              onClick={() => router.push("/dashboard")}
              className="px-4 py-2 bg-slate-900/50 hover:bg-slate-800/50 border border-slate-700/50 rounded-lg transition-all flex items-center gap-2 text-sm font-semibold text-cyan-400"
            >
              <span>←</span>
              <span>VOLTAR</span>
            </button>
          </div>
        </div>

        {/* Avatar Ativo (COMPACTO) */}
        {avatarAtivo && (
          <div className="mb-6">
            <div className="bg-gradient-to-r from-cyan-900/20 to-purple-900/20 border border-cyan-500/30 rounded-lg p-4">
              <div className="flex items-center gap-6">
                {/* Avatar SVG pequeno */}
                <div className="flex-shrink-0">
                  <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-full blur"></div>
                    <div className="relative bg-slate-900/50 rounded-full p-2 border border-cyan-500/30">
                      <AvatarSVG avatar={avatarAtivo} tamanho={80} />
                    </div>
                  </div>
                </div>

                {/* Info Compacta */}
                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-xs text-slate-500 mb-1">AVATAR ATIVO</div>
                    <div className="font-bold text-cyan-300 text-lg">{avatarAtivo.nome}</div>
                    <div className="text-xs text-slate-400">{avatarAtivo.elemento} • Nv.{avatarAtivo.nivel}</div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500 mb-1">HP</div>
                    <div className="text-sm font-semibold text-green-400">
                      {avatarAtivo.hp_atual || 0} / {(avatarAtivo.resistencia * 10) + (avatarAtivo.nivel * 5) + (avatarAtivo.raridade === 'Lendário' ? 100 : avatarAtivo.raridade === 'Raro' ? 50 : 0)}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500 mb-1">VÍNCULO</div>
                    <div className="text-sm font-semibold text-purple-400">{avatarAtivo.vinculo}%</div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500 mb-1">EXAUSTÃO</div>
                    <div className={`text-sm font-semibold ${getNivelExaustao(avatarAtivo.exaustao || 0).cor}`}>
                      {avatarAtivo.exaustao || 0}/100
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setAvatarSelecionado(avatarAtivo)}
                  className="flex-shrink-0 px-4 py-2 bg-cyan-900/30 hover:bg-cyan-800/40 border border-cyan-500/30 rounded-lg transition-all text-sm font-semibold text-cyan-400"
                >
                  DETALHES
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="mb-6 bg-slate-900/50 border border-slate-700/50 rounded-lg p-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {/* Raridade */}
            <select
              value={filtroRaridade}
              onChange={(e) => setFiltroRaridade(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white focus:border-cyan-500 focus:outline-none"
            >
              <option value="Todos">Todas Raridades</option>
              <option value="Comum">Comum</option>
              <option value="Raro">Raro</option>
              <option value="Lendário">Lendário</option>
            </select>

            {/* Elemento */}
            <select
              value={filtroElemento}
              onChange={(e) => setFiltroElemento(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white focus:border-cyan-500 focus:outline-none"
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

            {/* Status */}
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white focus:border-cyan-500 focus:outline-none"
            >
              <option value="Todos">Todos Status</option>
              <option value="Vivos">Vivos</option>
              <option value="Mortos">Mortos</option>
              <option value="Com Marca">Com Marca Morte</option>
            </select>

            {/* Ordenação */}
            <select
              value={ordenacao}
              onChange={(e) => setOrdenacao(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white focus:border-cyan-500 focus:outline-none"
            >
              <option value="nivel_desc">Nível (Maior→Menor)</option>
              <option value="nivel_asc">Nível (Menor→Maior)</option>
              <option value="nome_asc">Nome (A→Z)</option>
              <option value="raridade">Raridade</option>
            </select>

            {/* Limpar Filtros */}
            <button
              onClick={() => {
                setFiltroRaridade('Todos');
                setFiltroElemento('Todos');
                setFiltroStatus('Todos');
                setOrdenacao('nivel_desc');
              }}
              className="px-3 py-2 bg-red-900/30 hover:bg-red-800/40 border border-red-500/30 rounded text-sm font-semibold text-red-400 transition-all"
            >
              LIMPAR
            </button>
          </div>

          <div className="mt-3 text-xs text-slate-500 font-mono">
            Mostrando {avataresInativos.length} {avataresInativos.length === 1 ? 'avatar' : 'avatares'}
          </div>
        </div>

        {/* Lista de Avatares */}
        {avataresInativos.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4 opacity-20">🔍</div>
            <h3 className="text-xl font-bold text-slate-400 mb-2">Nenhum avatar encontrado</h3>
            <p className="text-slate-500 text-sm">Tente ajustar os filtros ou invoque novos avatares!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {avataresInativos.map((avatar) => (
              <div
                key={avatar.id}
                className="group relative"
              >
                <div className={`absolute -inset-0.5 bg-gradient-to-r ${getCorRaridade(avatar.raridade)} rounded-lg blur opacity-20 group-hover:opacity-40 transition-all`}></div>

                <div className={`relative bg-slate-900/80 backdrop-blur-xl border ${getCorBorda(avatar.raridade)} rounded-lg overflow-hidden group-hover:border-opacity-100 transition-all`}>
                  {/* Badge Raridade */}
                  <div className={`px-3 py-1.5 text-center font-bold text-xs bg-gradient-to-r ${getCorRaridade(avatar.raridade)}`}>
                    {avatar.raridade.toUpperCase()}
                  </div>

                  {/* Avatar */}
                  <div className={`py-4 ${!avatar.vivo ? 'opacity-40 grayscale' : ''}`}>
                    <AvatarSVG avatar={avatar} tamanho={120} />
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <h3 className="font-bold text-sm text-white mb-1 truncate">{avatar.nome}</h3>
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                      <span className={getCorElemento(avatar.elemento)}>{getEmojiElemento(avatar.elemento)} {avatar.elemento}</span>
                      <span>Nv.{avatar.nivel}</span>
                    </div>

                    {/* Status */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {!avatar.vivo && (
                        <span className="px-2 py-0.5 bg-red-900/30 border border-red-500/30 rounded text-xs text-red-400">
                          ☠️ Morto
                        </span>
                      )}
                      {avatar.marca_morte && (
                        <span className="px-2 py-0.5 bg-purple-900/30 border border-purple-500/30 rounded text-xs text-purple-400">
                          💀 Marca
                        </span>
                      )}
                    </div>

                    {/* Botões */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setAvatarSelecionado(avatar)}
                        className="flex-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-xs font-semibold text-slate-300 transition-all"
                      >
                        VER
                      </button>
                      {avatar.vivo && !avatar.ativo && (
                        <button
                          onClick={() => ativarAvatar(avatar.id, avatar.nome)}
                          disabled={ativando}
                          className="flex-1 px-3 py-1.5 bg-cyan-900/30 hover:bg-cyan-800/40 border border-cyan-500/30 rounded text-xs font-semibold text-cyan-400 transition-all disabled:opacity-50"
                        >
                          ATIVAR
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Detalhes */}
      {avatarSelecionado && (
        <AvatarDetalhes
          avatar={avatarSelecionado}
          onClose={() => setAvatarSelecionado(null)}
          onAtivar={(id, nome) => {
            ativarAvatar(id, nome);
            setAvatarSelecionado(null);
          }}
          getCorRaridade={getCorRaridade}
          getCorBorda={getCorBorda}
          getCorElemento={getCorElemento}
          getEmojiElemento={getEmojiElemento}
        />
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
