"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AvatarSVG from '../components/AvatarSVG';

export default function MergePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [avatares, setAvatares] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados do merge
  const [avatarBase, setAvatarBase] = useState(null);
  const [avatarSacrificio, setAvatarSacrificio] = useState(null);
  const [fusionando, setFusionando] = useState(false);
  const [mensagem, setMensagem] = useState(null);
  const [modalConfirmacao, setModalConfirmacao] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [modalResultado, setModalResultado] = useState(false);

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
      // Carregar stats
      const statsRes = await fetch(`/api/inicializar-jogador`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const statsData = await statsRes.json();
      setStats(statsData.stats);

      // Carregar avatares
      const avataresRes = await fetch(`/api/meus-avatares?userId=${userId}`);
      const avataresData = await avataresRes.json();
      if (avataresRes.ok) {
        setAvatares(avataresData.avatares || []);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const calcularCusto = () => {
    if (!avatarBase || !avatarSacrificio) return { moedas: 0, fragmentos: 0 };

    const nivelTotal = avatarBase.nivel + avatarSacrificio.nivel;
    const multiplicador = avatarBase.raridade === 'Lendário' ? 2 : avatarBase.raridade === 'Raro' ? 1.5 : 1;

    return {
      moedas: Math.floor(nivelTotal * 100 * multiplicador),
      fragmentos: Math.floor(nivelTotal * 10 * multiplicador)
    };
  };

  const calcularGanhos = () => {
    if (!avatarBase || !avatarSacrificio) return null;

    // Ganhos de stats (30% dos stats do sacrificado)
    const ganhoForca = Math.floor(avatarSacrificio.forca * 0.3);
    const ganhoAgilidade = Math.floor(avatarSacrificio.agilidade * 0.3);
    const ganhoResistencia = Math.floor(avatarSacrificio.resistencia * 0.3);
    const ganhoFoco = Math.floor(avatarSacrificio.foco * 0.3);

    // Chance de ganhar elemento (30% se diferente)
    const ganhaElemento = avatarBase.elemento !== avatarSacrificio.elemento ? 0.3 : 0;

    return {
      forca: ganhoForca,
      agilidade: ganhoAgilidade,
      resistencia: ganhoResistencia,
      foco: ganhoFoco,
      chanceElemento: ganhaElemento
    };
  };

  const realizarMerge = async () => {
    if (!avatarBase || !avatarSacrificio) {
      mostrarMensagem('Selecione os dois avatares para fusão', 'erro');
      return;
    }

    if (avatarBase.id === avatarSacrificio.id) {
      mostrarMensagem('Não é possível fundir um avatar com ele mesmo', 'erro');
      return;
    }

    const custo = calcularCusto();

    if (stats.moedas < custo.moedas) {
      mostrarMensagem(`Moedas insuficientes. Necessário: ${custo.moedas}`, 'erro');
      return;
    }

    if (stats.fragmentos < custo.fragmentos) {
      mostrarMensagem(`Fragmentos insuficientes. Necessário: ${custo.fragmentos}`, 'erro');
      return;
    }

    setFusionando(true);
    try {
      const res = await fetch('/api/merge-avatares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          avatarBaseId: avatarBase.id,
          avatarSacrificioId: avatarSacrificio.id
        })
      });

      const data = await res.json();

      if (res.ok) {
        setResultado(data.resultado);
        setModalConfirmacao(false);
        setModalResultado(true);
        setAvatarBase(null);
        setAvatarSacrificio(null);
        await carregarDados(user.id);
      } else {
        mostrarMensagem(data.message || 'Erro ao realizar fusão', 'erro');
        setModalConfirmacao(false);
      }
    } catch (error) {
      console.error("Erro ao realizar merge:", error);
      mostrarMensagem('Erro de conexão', 'erro');
      setModalConfirmacao(false);
    } finally {
      setFusionando(false);
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

  // Filtrar apenas avatares vivos e não ativos
  const avataresDisponiveis = avatares.filter(av => av.vivo && !av.ativo);
  const custo = calcularCusto();
  const ganhos = calcularGanhos();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center">
        <div className="text-cyan-400 font-mono animate-pulse">Carregando Câmara de Fusão...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950 text-gray-100 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl top-20 -left-48 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-violet-500/10 rounded-full blur-3xl bottom-20 -right-48 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute w-96 h-96 bg-purple-500/10 rounded-full blur-3xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] pointer-events-none"></div>
      <div className="absolute inset-0 shadow-[inset_0_0_120px_rgba(0,0,0,0.9)] pointer-events-none"></div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-5xl font-black bg-gradient-to-r from-indigo-300 via-violet-300 to-purple-300 bg-clip-text text-transparent mb-2 flex items-center gap-3">
              <span className="text-6xl">🧬</span>
              CÂMARA DE FUSÃO DIMENSIONAL
            </h1>
            <p className="text-slate-400 font-mono text-sm">
              💰 {stats?.moedas || 0} Moedas • 💎 {stats?.fragmentos || 0} Fragmentos
            </p>
          </div>

          <button
            onClick={() => router.push("/avatares")}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-all"
          >
            ← Voltar
          </button>
        </div>


        {/* Lore Introduction */}
        <div className="mb-8 bg-gradient-to-r from-indigo-950/50 to-violet-950/50 rounded-lg p-6 border border-indigo-900/50">
          <div className="flex items-start gap-4">
            <div className="text-5xl">📖</div>
            <div>
              <h3 className="text-xl font-bold text-indigo-300 mb-2">Sobre o Ritual de Fusão</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Na Câmara de Fusão Dimensional, Caçadores experientes podem realizar o antigo ritual de transmutação de almas.
                <span className="block mt-2 text-indigo-200">
                  Ao sacrificar um avatar, sua essência é transferida para outro, criando um guerreiro mais poderoso.
                </span>
                <span className="block mt-2 text-violet-300 font-semibold">
                  O avatar base absorverá 30% dos atributos do sacrificado e poderá, com sorte, herdar seu elemento dimensional.
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Seleção de Avatares */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Avatar Base */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-lg blur opacity-50"></div>

            <div className="relative bg-slate-950/80 backdrop-blur-xl border border-cyan-900/50 rounded-lg p-6">
              <h3 className="text-cyan-400 font-bold text-lg mb-3 flex items-center gap-2">
                <span>🎯</span> Avatar Base (Receberá os Poderes)
              </h3>

              {avatarBase ? (
                <div>
                  <div className="bg-slate-900/50 rounded-lg p-4 border border-cyan-500/30 mb-4">
                    <div className="flex items-center gap-4">
                      <AvatarSVG avatar={avatarBase} tamanho={100} />
                      <div className="flex-1">
                        <h4 className="text-xl font-bold text-white mb-1">{avatarBase.nome}</h4>
                        <div className="text-sm text-slate-400 mb-2">
                          {avatarBase.raridade} • {avatarBase.elemento} • Nv.{avatarBase.nivel}
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-xs">
                          <div className="bg-slate-800/50 rounded px-2 py-1">
                            <div className="text-slate-500">FOR</div>
                            <div className="font-bold text-red-400">{avatarBase.forca}</div>
                          </div>
                          <div className="bg-slate-800/50 rounded px-2 py-1">
                            <div className="text-slate-500">AGI</div>
                            <div className="font-bold text-green-400">{avatarBase.agilidade}</div>
                          </div>
                          <div className="bg-slate-800/50 rounded px-2 py-1">
                            <div className="text-slate-500">RES</div>
                            <div className="font-bold text-blue-400">{avatarBase.resistencia}</div>
                          </div>
                          <div className="bg-slate-800/50 rounded px-2 py-1">
                            <div className="text-slate-500">FOC</div>
                            <div className="font-bold text-purple-400">{avatarBase.foco}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setAvatarBase(null)}
                    className="w-full px-4 py-2 bg-red-900/30 hover:bg-red-800/40 border border-red-500/30 text-red-400 font-semibold rounded transition-all"
                  >
                    Remover
                  </button>
                </div>
              ) : (
                <div>
                  <div className="mb-4 p-6 bg-cyan-950/20 rounded-lg border border-cyan-900/30 text-center">
                    <div className="text-4xl mb-2">👤</div>
                    <div className="text-sm text-cyan-400">Selecione o avatar que receberá os poderes</div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 max-h-96 overflow-y-auto custom-scrollbar">
                    {avataresDisponiveis
                      .filter(av => !avatarSacrificio || av.id !== avatarSacrificio.id)
                      .map((avatar) => (
                        <button
                          key={avatar.id}
                          onClick={() => setAvatarBase(avatar)}
                          className="p-2 bg-slate-900/50 hover:bg-slate-800/50 border border-slate-700 hover:border-cyan-500/50 rounded transition-all"
                        >
                          <AvatarSVG avatar={avatar} tamanho={60} />
                          <div className="text-xs font-bold text-white mt-1 truncate">{avatar.nome}</div>
                          <div className="text-xs text-slate-400">Nv.{avatar.nivel}</div>
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Avatar Sacrifício */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-lg blur opacity-50"></div>

            <div className="relative bg-slate-950/80 backdrop-blur-xl border border-red-900/50 rounded-lg p-6">
              <h3 className="text-red-400 font-bold text-lg mb-3 flex items-center gap-2">
                <span>⚰️</span> Avatar Sacrifício (Será Consumido)
              </h3>

              {avatarSacrificio ? (
                <div>
                  <div className="bg-slate-900/50 rounded-lg p-4 border border-red-500/30 mb-4">
                    <div className="flex items-center gap-4">
                      <div className="opacity-60 grayscale">
                        <AvatarSVG avatar={avatarSacrificio} tamanho={100} />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xl font-bold text-white mb-1">{avatarSacrificio.nome}</h4>
                        <div className="text-sm text-slate-400 mb-2">
                          {avatarSacrificio.raridade} • {avatarSacrificio.elemento} • Nv.{avatarSacrificio.nivel}
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-xs">
                          <div className="bg-slate-800/50 rounded px-2 py-1">
                            <div className="text-slate-500">FOR</div>
                            <div className="font-bold text-red-400">{avatarSacrificio.forca}</div>
                          </div>
                          <div className="bg-slate-800/50 rounded px-2 py-1">
                            <div className="text-slate-500">AGI</div>
                            <div className="font-bold text-green-400">{avatarSacrificio.agilidade}</div>
                          </div>
                          <div className="bg-slate-800/50 rounded px-2 py-1">
                            <div className="text-slate-500">RES</div>
                            <div className="font-bold text-blue-400">{avatarSacrificio.resistencia}</div>
                          </div>
                          <div className="bg-slate-800/50 rounded px-2 py-1">
                            <div className="text-slate-500">FOC</div>
                            <div className="font-bold text-purple-400">{avatarSacrificio.foco}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setAvatarSacrificio(null)}
                    className="w-full px-4 py-2 bg-red-900/30 hover:bg-red-800/40 border border-red-500/30 text-red-400 font-semibold rounded transition-all"
                  >
                    Remover
                  </button>
                </div>
              ) : (
                <div>
                  <div className="mb-4 p-6 bg-red-950/20 rounded-lg border border-red-900/30 text-center">
                    <div className="text-4xl mb-2">💀</div>
                    <div className="text-sm text-red-400">Selecione o avatar que será sacrificado</div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 max-h-96 overflow-y-auto custom-scrollbar">
                    {avataresDisponiveis
                      .filter(av => !avatarBase || av.id !== avatarBase.id)
                      .map((avatar) => (
                        <button
                          key={avatar.id}
                          onClick={() => setAvatarSacrificio(avatar)}
                          className="p-2 bg-slate-900/50 hover:bg-slate-800/50 border border-slate-700 hover:border-red-500/50 rounded transition-all"
                        >
                          <AvatarSVG avatar={avatar} tamanho={60} />
                          <div className="text-xs font-bold text-white mt-1 truncate">{avatar.nome}</div>
                          <div className="text-xs text-slate-400">Nv.{avatar.nivel}</div>
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Preview de Ganhos */}
        {avatarBase && avatarSacrificio && ganhos && (
          <div className="mb-8 relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-lg blur opacity-50"></div>

            <div className="relative bg-slate-950/80 backdrop-blur-xl border border-violet-900/50 rounded-lg p-6">
              <h3 className="text-violet-400 font-bold text-lg mb-4 flex items-center gap-2">
                <span>📊</span> Preview dos Ganhos
              </h3>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Stats */}
                <div>
                  <h4 className="text-sm font-bold text-slate-400 mb-3">Aumento de Atributos (30%):</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-slate-900/50 rounded">
                      <span className="text-sm text-red-400">Força:</span>
                      <span className="font-bold text-white">
                        {avatarBase.forca} <span className="text-green-400">+{ganhos.forca}</span> = {avatarBase.forca + ganhos.forca}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-slate-900/50 rounded">
                      <span className="text-sm text-green-400">Agilidade:</span>
                      <span className="font-bold text-white">
                        {avatarBase.agilidade} <span className="text-green-400">+{ganhos.agilidade}</span> = {avatarBase.agilidade + ganhos.agilidade}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-slate-900/50 rounded">
                      <span className="text-sm text-blue-400">Resistência:</span>
                      <span className="font-bold text-white">
                        {avatarBase.resistencia} <span className="text-green-400">+{ganhos.resistencia}</span> = {avatarBase.resistencia + ganhos.resistencia}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-slate-900/50 rounded">
                      <span className="text-sm text-purple-400">Foco:</span>
                      <span className="font-bold text-white">
                        {avatarBase.foco} <span className="text-green-400">+{ganhos.foco}</span> = {avatarBase.foco + ganhos.foco}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Outros Benefícios */}
                <div>
                  <h4 className="text-sm font-bold text-slate-400 mb-3">Benefícios Adicionais:</h4>
                  <div className="space-y-2">
                    {ganhos.chanceElemento > 0 && (
                      <div className="p-3 bg-violet-950/30 rounded border border-violet-500/30">
                        <div className="flex items-center gap-2 mb-1">
                          <span>✨</span>
                          <span className="font-bold text-violet-300 text-sm">Transmutação Elemental</span>
                        </div>
                        <div className="text-xs text-slate-400">
                          {Math.floor(ganhos.chanceElemento * 100)}% de chance de ganhar o elemento {getEmojiElemento(avatarSacrificio.elemento)} {avatarSacrificio.elemento}
                        </div>
                      </div>
                    )}

                    <div className="p-3 bg-purple-950/30 rounded border border-purple-500/30">
                      <div className="flex items-center gap-2 mb-1">
                        <span>💫</span>
                        <span className="font-bold text-purple-300 text-sm">Experiência Preservada</span>
                      </div>
                      <div className="text-xs text-slate-400">
                        O avatar manterá seu nível e XP atual
                      </div>
                    </div>

                    <div className="p-3 bg-indigo-950/30 rounded border border-indigo-500/30">
                      <div className="flex items-center gap-2 mb-1">
                        <span>🎯</span>
                        <span className="font-bold text-indigo-300 text-sm">Vínculo Mantido</span>
                      </div>
                      <div className="text-xs text-slate-400">
                        O vínculo com o avatar base permanece intacto
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Custo */}
              <div className="mt-6 p-4 bg-gradient-to-r from-slate-900/80 to-violet-950/80 rounded-lg border border-violet-500/50">
                <h4 className="text-sm font-bold text-slate-400 mb-3">Custo do Ritual:</h4>
                <div className="flex items-center justify-between">
                  <div className="flex gap-4">
                    <div>
                      <span className="text-amber-400 font-bold text-lg">💰 {custo.moedas}</span>
                      <span className="text-xs text-slate-500 ml-2">moedas</span>
                    </div>
                    <div>
                      <span className="text-purple-400 font-bold text-lg">💎 {custo.fragmentos}</span>
                      <span className="text-xs text-slate-500 ml-2">fragmentos</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setModalConfirmacao(true)}
                    disabled={fusionando}
                    className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-lg transition-all disabled:opacity-50 shadow-lg shadow-indigo-900/50"
                  >
                    🧬 Iniciar Fusão
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {avataresDisponiveis.length < 2 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4 opacity-20">😔</div>
            <h3 className="text-xl font-bold text-slate-400 mb-2">Avatares Insuficientes</h3>
            <p className="text-slate-500 text-sm">
              Você precisa de pelo menos 2 avatares vivos e inativos para realizar a fusão.
            </p>
          </div>
        )}
      </div>

      {/* Modal de Resultado */}
      {modalResultado && resultado && resultado.avatar && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto p-4"
          onClick={() => setModalResultado(false)}
        >
          <div className="min-h-full flex items-center justify-center py-8">
            <div
              className="max-w-4xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/40 via-violet-500/40 to-purple-500/40 rounded-lg blur opacity-75 animate-pulse"></div>

                <div className="relative bg-slate-950/95 backdrop-blur-xl border-2 border-indigo-900/50 rounded-lg overflow-hidden">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-indigo-900/80 to-violet-900/80 p-4 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20"></div>
                    <div className="relative">
                      <div className="text-5xl mb-2 animate-pulse">✨</div>
                      <h2 className="text-xl font-black uppercase tracking-wider text-indigo-200">
                        Fusão Completa!
                      </h2>
                      <p className="text-xs text-indigo-300/80 font-mono mt-1">
                        O ritual dimensional foi bem-sucedido
                      </p>
                    </div>
                  </div>

                  {/* Botão Fechar */}
                  <button
                    onClick={() => {
                      setModalResultado(false);
                      setResultado(null);
                    }}
                    className="absolute top-3 right-3 w-8 h-8 bg-slate-900/80 hover:bg-indigo-900/80 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-all z-20 border border-slate-700/50 hover:border-indigo-500/50"
                  >
                    ✕
                  </button>

                  <div className="p-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Coluna Esquerda - Avatar */}
                      <div className="space-y-4">
                        {/* Avatar Preview */}
                        <div className="bg-slate-900/70 rounded-lg p-6 aspect-square border-2 border-indigo-900/50 flex items-center justify-center relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-violet-500/5"></div>
                          <div className="relative">
                            <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500/30 to-violet-500/30 rounded-full blur"></div>
                            <div className="relative">
                              <AvatarSVG avatar={resultado.avatar} tamanho={200} />
                            </div>
                          </div>
                        </div>

                        {/* Nome e Info */}
                        <div className="text-center">
                          <h3 className="text-2xl font-black mb-2 bg-gradient-to-r from-indigo-300 to-violet-300 bg-clip-text text-transparent">
                            {resultado.avatar?.nome || 'Avatar'}
                          </h3>
                          <div className="flex items-center justify-center gap-2 flex-wrap">
                            <span className="inline-block px-3 py-1 bg-slate-800 rounded-full text-sm font-mono text-indigo-300">
                              {resultado.avatar?.elemento || 'Neutro'}
                            </span>
                            <span className="inline-block px-3 py-1 bg-slate-800 rounded-full text-sm font-mono text-violet-300">
                              {resultado.avatar?.raridade || 'Comum'}
                            </span>
                            <span className="inline-block px-3 py-1 bg-slate-800 rounded-full text-sm font-mono text-purple-300">
                              Nv.{resultado.avatar?.nivel || 1}
                            </span>
                          </div>
                        </div>

                        {/* Lore Text */}
                        <div className="bg-gradient-to-br from-indigo-950/40 to-violet-950/40 rounded-lg p-4 border border-indigo-900/50">
                          <div className="text-xs text-indigo-400 font-bold uppercase mb-2 tracking-wider">✨ Resultado da Fusão</div>
                          <p className="text-sm text-indigo-200/90 leading-relaxed italic">
                            "O ritual dimensional alcançou seu ápice. As energias se entrelaçaram perfeitamente, fundindo duas almas em uma só.
                            <span className="block mt-2 font-bold text-indigo-300">
                              O avatar base absorveu com sucesso a essência do sacrificado, aumentando seu poder dimensional.
                            </span>
                            <span className="block mt-2 text-violet-300/80">
                              A nova forma mantém as memórias e habilidades originais, agora potencializadas pela energia dimensional absorvida.
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Coluna Direita - Stats e Ganhos */}
                      <div className="space-y-4">
                        {/* Stats Finais */}
                        <div>
                          <h4 className="text-indigo-400 font-bold text-xs uppercase tracking-wider mb-3">Atributos Finais</h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-900/50 rounded-lg p-3 text-center border border-indigo-500/30">
                              <div className="text-xs text-slate-500 uppercase mb-1">Força</div>
                              <div className="text-2xl font-bold text-red-400">{resultado.avatar?.forca || 0}</div>
                              {resultado.ganhos?.forca > 0 && (
                                <div className="text-xs text-green-400 font-bold">+{resultado.ganhos.forca}</div>
                              )}
                            </div>
                            <div className="bg-slate-900/50 rounded-lg p-3 text-center border border-indigo-500/30">
                              <div className="text-xs text-slate-500 uppercase mb-1">Agilidade</div>
                              <div className="text-2xl font-bold text-green-400">{resultado.avatar?.agilidade || 0}</div>
                              {resultado.ganhos?.agilidade > 0 && (
                                <div className="text-xs text-green-400 font-bold">+{resultado.ganhos.agilidade}</div>
                              )}
                            </div>
                            <div className="bg-slate-900/50 rounded-lg p-3 text-center border border-indigo-500/30">
                              <div className="text-xs text-slate-500 uppercase mb-1">Resistência</div>
                              <div className="text-2xl font-bold text-blue-400">{resultado.avatar?.resistencia || 0}</div>
                              {resultado.ganhos?.resistencia > 0 && (
                                <div className="text-xs text-green-400 font-bold">+{resultado.ganhos.resistencia}</div>
                              )}
                            </div>
                            <div className="bg-slate-900/50 rounded-lg p-3 text-center border border-indigo-500/30">
                              <div className="text-xs text-slate-500 uppercase mb-1">Foco</div>
                              <div className="text-2xl font-bold text-purple-400">{resultado.avatar?.foco || 0}</div>
                              {resultado.ganhos?.foco > 0 && (
                                <div className="text-xs text-green-400 font-bold">+{resultado.ganhos.foco}</div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Poder Total */}
                        <div className="bg-gradient-to-r from-indigo-950/50 to-violet-950/50 rounded-lg p-4 border border-indigo-600/50">
                          <div className="text-center">
                            <div className="text-xs text-indigo-400 uppercase mb-1">Poder Total</div>
                            <div className="text-3xl font-black bg-gradient-to-r from-indigo-300 to-violet-300 bg-clip-text text-transparent">
                              {(resultado.avatar?.forca || 0) + (resultado.avatar?.agilidade || 0) + (resultado.avatar?.resistencia || 0) + (resultado.avatar?.foco || 0)}
                            </div>
                            <div className="text-xs text-green-400 font-bold mt-1">
                              +{(resultado.ganhos?.forca || 0) + (resultado.ganhos?.agilidade || 0) + (resultado.ganhos?.resistencia || 0) + (resultado.ganhos?.foco || 0)} pts ganhos
                            </div>
                          </div>
                        </div>

                        {/* Benefícios */}
                        <div>
                          <h4 className="text-indigo-400 font-bold text-xs uppercase tracking-wider mb-3">Benefícios Obtidos</h4>
                          <div className="space-y-2">
                            <div className="flex items-start gap-2 p-3 bg-indigo-950/30 rounded border border-indigo-900/50">
                              <span className="text-xl">💪</span>
                              <div className="flex-1">
                                <div className="font-bold text-indigo-300 text-xs">Stats Aumentados</div>
                                <div className="text-[10px] text-indigo-400/80">
                                  +{resultado.ganhos?.forca || 0} FOR, +{resultado.ganhos?.agilidade || 0} AGI, +{resultado.ganhos?.resistencia || 0} RES, +{resultado.ganhos?.foco || 0} FOC
                                </div>
                              </div>
                            </div>

                            {resultado?.mudouElemento && (
                              <div className="flex items-start gap-2 p-3 bg-violet-950/30 rounded border border-violet-900/50">
                                <span className="text-xl">✨</span>
                                <div className="flex-1">
                                  <div className="font-bold text-violet-300 text-xs">Elemento Transmutado!</div>
                                  <div className="text-[10px] text-violet-400/80">
                                    Absorveu o elemento {resultado.elementoOriginal || ''}
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="flex items-start gap-2 p-3 bg-purple-950/30 rounded border border-purple-900/50">
                              <span className="text-xl">🔮</span>
                              <div className="flex-1">
                                <div className="font-bold text-purple-300 text-xs">Experiência Preservada</div>
                                <div className="text-[10px] text-purple-400/80">
                                  Memórias e conhecimentos mantidos
                                </div>
                              </div>
                            </div>

                            <div className="flex items-start gap-2 p-3 bg-indigo-950/30 rounded border border-indigo-900/50">
                              <span className="text-xl">🎯</span>
                              <div className="flex-1">
                                <div className="font-bold text-indigo-300 text-xs">Vínculo Intacto</div>
                                <div className="text-[10px] text-indigo-400/80">
                                  Conexão com o avatar fortalecida
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action Button */}
                        <button
                          onClick={() => {
                            setModalResultado(false);
                            setResultado(null);
                          }}
                          className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-lg transition-all shadow-lg shadow-indigo-900/50"
                        >
                          🧬 Nova Fusão
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação */}
      {modalConfirmacao && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => !fusionando && setModalConfirmacao(false)}
        >
          <div
            className="max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600/40 via-violet-600/40 to-purple-600/40 rounded-lg blur opacity-75 animate-pulse"></div>

              <div className="relative bg-slate-950/95 backdrop-blur-xl border-2 border-indigo-900/50 rounded-lg overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-900/80 to-violet-900/80 p-6 text-center">
                  <div className="text-6xl mb-3">🧬</div>
                  <h2 className="text-2xl font-black uppercase tracking-wider text-indigo-200 mb-1">
                    Confirmar Fusão Dimensional
                  </h2>
                  <p className="text-sm text-indigo-300/80">
                    Esta ação não pode ser desfeita
                  </p>
                </div>

                <div className="p-6">
                  <div className="mb-6 p-4 bg-red-950/30 rounded-lg border border-red-900/50">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">⚠️</span>
                      <div>
                        <div className="font-bold text-red-300 text-sm mb-1">Atenção!</div>
                        <div className="text-xs text-red-400/80 leading-relaxed">
                          {avatarSacrificio?.nome} será consumido pelo ritual e enviado ao Memorial Eterno.
                          Esta ação é permanente e irreversível.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setModalConfirmacao(false)}
                      disabled={fusionando}
                      className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg transition-all disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={realizarMerge}
                      disabled={fusionando}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-lg transition-all disabled:opacity-50 shadow-lg shadow-indigo-900/50"
                    >
                      {fusionando ? 'Fundindo...' : '✨ Confirmar'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
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

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5);
          border-radius: 3px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.5);
          border-radius: 3px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.7);
        }
      `}</style>
    </div>
  );
}
