"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AvatarSVG from '../components/AvatarSVG';
import AvatarDetalhes from "./components/AvatarDetalhes";
import GameNav, { COMMON_ACTIONS } from '../components/GameNav';

export default function AvatarsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [avatares, setAvatares] = useState([]);
  const [avatarSelecionado, setAvatarSelecionado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalConfirmacao, setModalConfirmacao] = useState(null);
  const [ativando, setAtivando] = useState(false);
  const [modalSacrificar, setModalSacrificar] = useState(null);
  const [sacrificando, setSacrificando] = useState(false);
  const [modalVender, setModalVender] = useState(null);
  const [precoVendaMoedas, setPrecoVendaMoedas] = useState('');
  const [precoVendaFragmentos, setPrecoVendaFragmentos] = useState('');
  const [vendendo, setVendendo] = useState(false);

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

  const sacrificarAvatar = async (avatar) => {
    setSacrificando(true);
    try {
      const response = await fetch("/api/sacrificar-avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          avatarId: avatar.id
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setModalSacrificar(null);
        setModalConfirmacao({
          tipo: 'sucesso',
          mensagem: `${avatar.nome} foi enviado ao Memorial...`
        });
        setTimeout(() => setModalConfirmacao(null), 3000);
        await carregarAvatares(user.id);
      } else {
        setModalConfirmacao({
          tipo: 'erro',
          mensagem: data.message || 'Erro ao sacrificar avatar'
        });
        setTimeout(() => setModalConfirmacao(null), 3000);
      }
    } catch (error) {
      console.error("Erro ao sacrificar avatar:", error);
      setModalConfirmacao({
        tipo: 'erro',
        mensagem: 'Erro de conexão'
      });
      setTimeout(() => setModalConfirmacao(null), 3000);
    } finally {
      setSacrificando(false);
    }
  };

  const venderAvatar = async () => {
    const moedas = parseInt(precoVendaMoedas) || 0;
    const fragmentos = parseInt(precoVendaFragmentos) || 0;

    // Validar que pelo menos um preço foi definido
    if (moedas === 0 && fragmentos === 0) {
      setModalConfirmacao({
        tipo: 'erro',
        mensagem: 'Defina um preço em moedas e/ou fragmentos'
      });
      setTimeout(() => setModalConfirmacao(null), 3000);
      return;
    }

    // Validar limites
    if (moedas < 0 || moedas > 10000) {
      setModalConfirmacao({
        tipo: 'erro',
        mensagem: 'Moedas devem estar entre 0 e 10.000'
      });
      setTimeout(() => setModalConfirmacao(null), 3000);
      return;
    }

    if (fragmentos < 0 || fragmentos > 500) {
      setModalConfirmacao({
        tipo: 'erro',
        mensagem: 'Fragmentos devem estar entre 0 e 500'
      });
      setTimeout(() => setModalConfirmacao(null), 3000);
      return;
    }

    setVendendo(true);
    try {
      const response = await fetch("/api/mercado/vender", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          avatarId: modalVender.id,
          precoMoedas: moedas,
          precoFragmentos: fragmentos
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setModalVender(null);
        setPrecoVendaMoedas('');
        setPrecoVendaFragmentos('');

        const precoTexto = [];
        if (moedas > 0) precoTexto.push(`${moedas} 💰`);
        if (fragmentos > 0) precoTexto.push(`${fragmentos} 💎`);

        setModalConfirmacao({
          tipo: 'sucesso',
          mensagem: `${modalVender.nome} colocado à venda por ${precoTexto.join(' + ')}!`
        });
        setTimeout(() => setModalConfirmacao(null), 3000);
        await carregarAvatares(user.id);
      } else {
        setModalConfirmacao({
          tipo: 'erro',
          mensagem: data.message || 'Erro ao colocar avatar à venda'
        });
        setTimeout(() => setModalConfirmacao(null), 3000);
      }
    } catch (error) {
      console.error("Erro ao vender avatar:", error);
      setModalConfirmacao({
        tipo: 'erro',
        mensagem: 'Erro de conexão'
      });
      setTimeout(() => setModalConfirmacao(null), 3000);
    } finally {
      setVendendo(false);
    }
  };

  const cancelarVenda = async (avatar) => {
    try {
      const response = await fetch("/api/mercado/vender", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          avatarId: avatar.id
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setModalConfirmacao({
          tipo: 'sucesso',
          mensagem: `Venda cancelada!`
        });
        setTimeout(() => setModalConfirmacao(null), 3000);
        await carregarAvatares(user.id);
      } else {
        setModalConfirmacao({
          tipo: 'erro',
          mensagem: data.message || 'Erro ao cancelar venda'
        });
        setTimeout(() => setModalConfirmacao(null), 3000);
      }
    } catch (error) {
      console.error("Erro ao cancelar venda:", error);
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

  // Sistema de limite de avatares (avatares mortos no memorial não contam)
  const LIMITE_AVATARES = 15;
  const avataresConta = avatares.filter(av => !(av.marca_morte && !av.vivo)).length;
  const slotsUsados = avataresConta;
  const slotsDisponiveis = LIMITE_AVATARES - slotsUsados;
  const percentualOcupado = (slotsUsados / LIMITE_AVATARES) * 100;

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

      {/* Navegação padronizada */}
      <GameNav
        backTo="/dashboard"
        backLabel="DASHBOARD"
        title="MINHA COLEÇÃO"
        subtitle={`${avatares.length} ${avatares.length === 1 ? 'Avatar' : 'Avatares'} | ${avatares.filter(a => a.vivo).length} Vivos | ${avatares.filter(a => !a.vivo).length} Mortos`}
        actions={[
          COMMON_ACTIONS.mercado,
          COMMON_ACTIONS.fusao,
          ...(avataresCaidos > 0 ? [{ ...COMMON_ACTIONS.memorial, label: `MEMORIAL (${avataresCaidos})` }] : []),
          COMMON_ACTIONS.invocar,
          COMMON_ACTIONS.necromante,
          COMMON_ACTIONS.purificador,
          COMMON_ACTIONS.inventario
        ]}
      />

      <div className="relative z-10 container mx-auto px-4 py-6 max-w-7xl">
        {/* Contador de Slots */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className={`font-mono text-sm font-bold ${
              percentualOcupado >= 100 ? 'text-red-400' :
              percentualOcupado >= 80 ? 'text-orange-400' :
              'text-cyan-400'
            }`}>
              📦 Slots: {slotsUsados}/{LIMITE_AVATARES}
            </span>
            {slotsDisponiveis > 0 && slotsDisponiveis <= 3 && (
              <span className="text-[10px] text-orange-400 font-bold animate-pulse">
                ⚠️ Quase cheio!
              </span>
            )}
            {slotsDisponiveis === 0 && (
              <span className="text-[10px] text-red-400 font-bold animate-pulse">
                🚫 LIMITE ATINGIDO
              </span>
            )}
          </div>
          <div className="w-64 bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all ${
                percentualOcupado >= 100 ? 'bg-red-500' :
                percentualOcupado >= 80 ? 'bg-orange-500' :
                percentualOcupado >= 60 ? 'bg-yellow-500' :
                'bg-cyan-500'
              }`}
              style={{ width: `${Math.min(percentualOcupado, 100)}%` }}
            ></div>
          </div>
          <p className="text-[10px] text-slate-500 font-mono mt-1">
            * Avatares no memorial não ocupam slots
          </p>
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
                  <div className={`py-4 flex items-center justify-center ${!avatar.vivo ? 'opacity-40 grayscale' : ''}`}>
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
                      {avatar.em_venda && (
                        <span className="px-2 py-0.5 bg-amber-900/30 border border-amber-500/30 rounded text-xs text-amber-400 animate-pulse">
                          🏪 À Venda
                        </span>
                      )}
                    </div>

                    {/* Botões */}
                    <div className="space-y-2">
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

                      {/* Botão Sacrificar - Apenas para avatares vivos e inativos */}
                      {avatar.vivo && !avatar.ativo && !avatar.em_venda && (
                        <button
                          onClick={() => setModalSacrificar(avatar)}
                          className="w-full px-2 py-1 bg-red-950/20 hover:bg-red-900/30 border border-red-900/30 hover:border-red-800/50 rounded text-xs font-semibold text-red-500/70 hover:text-red-400 transition-all"
                        >
                          ⚠️ Sacrificar
                        </button>
                      )}

                      {/* Botão Vender - Apenas para avatares vivos, inativos, sem marca_morte e não em venda */}
                      {avatar.vivo && !avatar.ativo && !avatar.marca_morte && !avatar.em_venda && (
                        <button
                          onClick={() => {
                            setModalVender(avatar);
                            setPrecoVendaMoedas('');
                            setPrecoVendaFragmentos('');
                          }}
                          className="w-full px-2 py-1 bg-amber-950/20 hover:bg-amber-900/30 border border-amber-900/30 hover:border-amber-800/50 rounded text-xs font-semibold text-amber-500/70 hover:text-amber-400 transition-all"
                        >
                          🏪 Vender
                        </button>
                      )}

                      {/* Botão Cancelar Venda - Para avatares em venda */}
                      {avatar.em_venda && (
                        <button
                          onClick={() => cancelarVenda(avatar)}
                          className="w-full px-2 py-1 bg-slate-950/20 hover:bg-slate-900/30 border border-slate-700/30 hover:border-slate-600/50 rounded text-xs font-semibold text-slate-400/70 hover:text-slate-300 transition-all"
                        >
                          ✖️ Cancelar Venda
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
          userId={user?.id}
          onRename={(avatarId, novoNome) => {
            // Atualizar o nome no estado local
            setAvatares(prev => prev.map(av =>
              av.id === avatarId ? { ...av, nome: novoNome } : av
            ));
            // Atualizar o avatar selecionado também
            setAvatarSelecionado(prev =>
              prev && prev.id === avatarId ? { ...prev, nome: novoNome } : prev
            );
            // Mostrar confirmação
            setModalConfirmacao({
              tipo: 'sucesso',
              mensagem: `Avatar renomeado para "${novoNome}"!`
            });
            setTimeout(() => setModalConfirmacao(null), 3000);
          }}
        />
      )}

      {/* Modal de Sacrifício */}
      {modalSacrificar && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto p-4"
          onClick={() => !sacrificando && setModalSacrificar(null)}
        >
          <div className="min-h-full flex items-center justify-center py-8">
            <div
              className="max-w-4xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-red-600/40 via-orange-600/40 to-red-600/40 rounded-lg blur opacity-75 animate-pulse"></div>

                <div className="relative bg-slate-950/95 backdrop-blur-xl border-2 border-red-900/50 rounded-lg overflow-hidden">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-red-900/80 to-orange-900/80 p-4 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20"></div>
                    <div className="relative">
                      <div className="text-5xl mb-2 animate-pulse">⚠️</div>
                      <h2 className="text-xl font-black uppercase tracking-wider text-red-200">
                        Ritual de Sacrifício
                      </h2>
                      <p className="text-xs text-red-300/80 font-mono mt-1">
                        Esta ação é irreversível
                      </p>
                    </div>
                  </div>

                  {/* Botão Fechar */}
                  <button
                    onClick={() => setModalSacrificar(null)}
                    disabled={sacrificando}
                    className="absolute top-3 right-3 w-8 h-8 bg-slate-900/80 hover:bg-red-900/80 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-all z-20 border border-slate-700/50 hover:border-red-500/50 disabled:opacity-50"
                  >
                    ✕
                  </button>

                  <div className="p-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Coluna Esquerda - Avatar e Lore */}
                      <div className="space-y-4">
                        {/* Avatar Preview */}
                        <div className="bg-slate-900/70 rounded-lg p-6 aspect-square border-2 border-red-900/50 flex items-center justify-center relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-orange-500/5"></div>
                          <div className="relative">
                            <div className="absolute -inset-2 bg-gradient-to-r from-red-500/30 to-orange-500/30 rounded-full blur"></div>
                            <div className="relative">
                              <AvatarSVG avatar={modalSacrificar} tamanho={200} />
                            </div>
                          </div>
                        </div>

                        {/* Nome e Info */}
                        <div className="text-center">
                          <h3 className="text-2xl font-black mb-2 text-white">
                            {modalSacrificar.nome}
                          </h3>
                          <div className="flex items-center justify-center gap-2 flex-wrap">
                            <span className="inline-block px-3 py-1 bg-slate-800 rounded-full text-sm font-mono text-slate-300">
                              {getEmojiElemento(modalSacrificar.elemento)} {modalSacrificar.elemento}
                            </span>
                            <span className="inline-block px-3 py-1 bg-slate-800 rounded-full text-sm font-mono text-slate-300">
                              {modalSacrificar.raridade}
                            </span>
                            <span className="inline-block px-3 py-1 bg-slate-800 rounded-full text-sm font-mono text-slate-300">
                              Nv.{modalSacrificar.nivel}
                            </span>
                          </div>
                        </div>

                        {/* Lore Text */}
                        <div className="bg-gradient-to-br from-red-950/40 to-orange-950/40 rounded-lg p-4 border border-red-900/50">
                          <div className="text-xs text-red-400 font-bold uppercase mb-2 tracking-wider">⚠️ Aviso do Vazio</div>
                          <p className="text-sm text-red-200/90 leading-relaxed italic">
                            "Nas profundezas da Organização de Caçadores Dimensionais, existe um ritual sombrio reservado apenas para os mais desesperados.
                            <span className="block mt-2 font-bold text-red-300">
                              Ao sacrificar um avatar, sua essência é consumida pelo Vazio Dimensional, e sua alma é enviada ao Memorial Eterno.
                            </span>
                            <span className="block mt-2 text-red-400/80">
                              Uma vez realizado, não há retorno. Nem mesmo o Necromante mais poderoso pode trazer de volta o que foi entregue ao Vazio.
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Coluna Direita - Avisos e Confirmação */}
                      <div className="space-y-4">
                        {/* Stats do Avatar */}
                        <div>
                          <h4 className="text-red-400 font-bold text-xs uppercase tracking-wider mb-3">O que será perdido</h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-900/50 rounded-lg p-3 text-center border border-red-500/30">
                              <div className="text-xs text-slate-500 uppercase mb-1">Força</div>
                              <div className="text-2xl font-bold text-red-400">{modalSacrificar.forca}</div>
                            </div>
                            <div className="bg-slate-900/50 rounded-lg p-3 text-center border border-red-500/30">
                              <div className="text-xs text-slate-500 uppercase mb-1">Agilidade</div>
                              <div className="text-2xl font-bold text-green-400">{modalSacrificar.agilidade}</div>
                            </div>
                            <div className="bg-slate-900/50 rounded-lg p-3 text-center border border-red-500/30">
                              <div className="text-xs text-slate-500 uppercase mb-1">Resistência</div>
                              <div className="text-2xl font-bold text-blue-400">{modalSacrificar.resistencia}</div>
                            </div>
                            <div className="bg-slate-900/50 rounded-lg p-3 text-center border border-red-500/30">
                              <div className="text-xs text-slate-500 uppercase mb-1">Foco</div>
                              <div className="text-2xl font-bold text-purple-400">{modalSacrificar.foco}</div>
                            </div>
                          </div>
                        </div>

                        {/* Poder Total */}
                        <div className="bg-gradient-to-r from-red-950/50 to-orange-950/50 rounded-lg p-4 border border-red-600/50">
                          <div className="text-center">
                            <div className="text-xs text-red-400 uppercase mb-1">Poder Total Perdido</div>
                            <div className="text-3xl font-black text-red-300">
                              {modalSacrificar.forca + modalSacrificar.agilidade + modalSacrificar.resistencia + modalSacrificar.foco}
                            </div>
                            <div className="text-[10px] text-red-500 mt-1">
                              XP: {modalSacrificar.experiencia || 0} | Vínculo: {modalSacrificar.vinculo}%
                            </div>
                          </div>
                        </div>

                        {/* Warnings */}
                        <div>
                          <h4 className="text-red-400 font-bold text-xs uppercase tracking-wider mb-3">Consequências</h4>
                          <div className="space-y-2">
                            <div className="flex items-start gap-2 p-3 bg-red-950/30 rounded border border-red-900/50">
                              <span className="text-xl">💀</span>
                              <div className="flex-1">
                                <div className="font-bold text-red-300 text-xs">Morte Permanente</div>
                                <div className="text-[10px] text-red-400/80">Marcado com a Marca da Morte e enviado ao Memorial</div>
                              </div>
                            </div>

                            <div className="flex items-start gap-2 p-3 bg-red-950/30 rounded border border-red-900/50">
                              <span className="text-xl">⛔</span>
                              <div className="flex-1">
                                <div className="font-bold text-red-300 text-xs">Sem Ressurreição</div>
                                <div className="text-[10px] text-red-400/80">Necromante e Purificador não podem reverter</div>
                              </div>
                            </div>

                            <div className="flex items-start gap-2 p-3 bg-red-950/30 rounded border border-red-900/50">
                              <span className="text-xl">🌑</span>
                              <div className="flex-1">
                                <div className="font-bold text-red-300 text-xs">Consumido pelo Vazio</div>
                                <div className="text-[10px] text-red-400/80">Todas habilidades e progresso perdidos</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Confirmation Question */}
                        <div className="bg-gradient-to-r from-slate-900/80 to-red-950/80 rounded-lg p-4 border-2 border-red-600/50">
                          <p className="text-center font-bold text-red-200 text-sm">
                            Você realmente deseja sacrificar {modalSacrificar.nome}?
                          </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                          <button
                            onClick={() => setModalSacrificar(null)}
                            disabled={sacrificando}
                            className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg transition-all disabled:opacity-50"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => sacrificarAvatar(modalSacrificar)}
                            disabled={sacrificando}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-lg transition-all disabled:opacity-50 shadow-lg shadow-red-900/50"
                          >
                            {sacrificando ? 'Sacrificando...' : '💀 Confirmar'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Venda */}
      {modalVender && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => !vendendo && setModalVender(null)}
        >
          <div
            className="max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/30 to-yellow-500/30 rounded-lg blur opacity-75"></div>

              <div className="relative bg-slate-950/95 backdrop-blur-xl border border-amber-900/50 rounded-lg overflow-hidden">
                <div className="p-4 text-center font-bold text-lg bg-gradient-to-r from-amber-600 to-yellow-600">
                  🏪 Colocar à Venda
                </div>

                <div className="p-6">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-white mb-2">{modalVender.nome}</h3>
                    <p className="text-sm text-slate-400">
                      {modalVender.raridade} • {modalVender.elemento} • Nv.{modalVender.nivel}
                    </p>
                  </div>

                  <div className="mb-6 space-y-4">
                    <div>
                      <label className="block text-sm font-mono text-slate-400 mb-2">
                        Preço em Moedas (opcional)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="10000"
                        value={precoVendaMoedas}
                        onChange={(e) => setPrecoVendaMoedas(e.target.value)}
                        placeholder="0 a 10.000 moedas"
                        className="w-full px-4 py-3 bg-slate-900 border border-amber-500/30 rounded text-white text-center text-lg font-bold focus:border-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-mono text-slate-400 mb-2">
                        Preço em Fragmentos (opcional)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="500"
                        value={precoVendaFragmentos}
                        onChange={(e) => setPrecoVendaFragmentos(e.target.value)}
                        placeholder="0 a 500 fragmentos"
                        className="w-full px-4 py-3 bg-slate-900 border border-purple-500/30 rounded text-white text-center text-lg font-bold focus:border-purple-500 focus:outline-none"
                      />
                    </div>

                    <p className="text-xs text-slate-500 text-center font-mono">
                      O mercado cobra 5% de taxa nas moedas (sem taxa nos fragmentos)
                    </p>

                    {/* Aviso sobre reset de vínculo */}
                    {modalVender.vinculo > 0 && (
                      <div className="mt-4 p-3 bg-orange-950/30 border border-orange-900/30 rounded-lg">
                        <p className="text-xs text-orange-400 font-mono text-center">
                          ⚠️ <span className="font-bold">Aviso:</span> Ao ser vendido, o avatar terá seu vínculo resetado de {modalVender.vinculo} para 0
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setModalVender(null)}
                      disabled={vendendo}
                      className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg transition-all disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={venderAvatar}
                      disabled={vendendo}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-bold rounded-lg transition-all disabled:opacity-50"
                    >
                      {vendendo ? 'Vendendo...' : 'Confirmar'}
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
