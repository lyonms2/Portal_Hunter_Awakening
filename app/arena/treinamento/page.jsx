"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { aplicarPenalidadesExaustao, getNivelExaustao } from "../../avatares/sistemas/exhaustionSystem";
import AvatarSVG from "../../components/AvatarSVG";

export default function ArenaPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [avatares, setAvatares] = useState([]);
  const [avatarSelecionado, setAvatarSelecionado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dificuldadeSelecionada, setDificuldadeSelecionada] = useState('normal');
  const [iniciandoBatalha, setIniciandoBatalha] = useState(false);

  const dificuldades = {
    facil: {
      nome: "Recruta",
      emoji: "🟢",
      descricao: "Adversário inexperiente",
      detalhes: "Ideal para treinar combos e aprender mecânicas. IA comete erros táticos.",
      stats: "70% dos seus stats",
      iaComportamento: "Joga defensivamente, comete 20% de erros, não usa combos",
      recompensas: { xp: 25, moedas: 15, chance_fragmento: "5%" },
      exaustao: 5,
      cor: "from-green-600 to-green-700",
      corBorda: "border-green-500",
      corBg: "bg-green-900/10"
    },
    normal: {
      nome: "Veterano",
      emoji: "🟡",
      descricao: "Desafio equilibrado",
      detalhes: "Oponente experiente que sabe usar habilidades. IA inteligente mas não perfeita.",
      stats: "100% dos seus stats",
      iaComportamento: "Balanceia ataque e defesa, 10% de erros, considera vantagem elemental",
      recompensas: { xp: 50, moedas: 30, chance_fragmento: "12%" },
      exaustao: 10,
      cor: "from-yellow-600 to-yellow-700",
      corBorda: "border-yellow-500",
      corBg: "bg-yellow-900/10"
    },
    dificil: {
      nome: "Elite",
      emoji: "🔴",
      descricao: "Adversário muito poderoso",
      detalhes: "Combatente de elite com stats superiores. IA usa combos e tática avançada.",
      stats: "130% dos seus stats",
      iaComportamento: "Agressivo mas inteligente, usa combos, remove buffs, 5% de erros",
      recompensas: { xp: 100, moedas: 60, chance_fragmento: "25%" },
      exaustao: 15,
      cor: "from-red-600 to-red-700",
      corBorda: "border-red-500",
      corBg: "bg-red-900/10"
    },
    mestre: {
      nome: "Lendário",
      emoji: "💀",
      descricao: "IA perfeita - Desafio supremo",
      detalhes: "Adversário lendário com IA perfeita. Não comete erros e prevê suas ações.",
      stats: "150% dos seus stats",
      iaComportamento: "IA PERFEITA: sem erros, antecipa jogadas, usa tática avançada",
      recompensas: { xp: 200, moedas: 120, fragmentos: 1, chance_extra: "40%" },
      exaustao: 20,
      cor: "from-purple-600 to-purple-800",
      corBorda: "border-purple-500",
      corBg: "bg-purple-900/10"
    }
  };

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
      const response = await fetch(`/api/meus-avatares?userId=${userId}`);
      const data = await response.json();
      
      if (response.ok) {
        const avataresVivos = data.avatares.filter(av => av.vivo);
        setAvatares(avataresVivos);
        
        // Auto-seleciona o avatar ativo
        const ativo = avataresVivos.find(av => av.ativo);
        if (ativo) {
          setAvatarSelecionado(ativo);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar avatares:", error);
    } finally {
      setLoading(false);
    }
  };

  const iniciarTreino = async () => {
    if (!avatarSelecionado) {
      alert('Selecione um avatar primeiro!');
      return;
    }

    if (avatarSelecionado.exaustao >= 80) {
      if (!confirm('Seu avatar está muito exausto! Continuar mesmo assim?')) {
        return;
      }
    }

    setIniciandoBatalha(true);

    try {
      const response = await fetch('/api/arena/treino/iniciar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          avatarId: avatarSelecionado.id,
          dificuldade: dificuldadeSelecionada
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Salvar estado da batalha
        localStorage.setItem('batalha_atual', JSON.stringify(data.batalha));
        
        // Redirecionar para tela de batalha
        router.push('/arena/batalha');
      } else {
        alert(data.message || 'Erro ao iniciar treino');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao iniciar treino');
    } finally {
      setIniciandoBatalha(false);
    }
  };

  const getAvisoExaustao = (exaustao) => {
    if (exaustao >= 80) return { texto: '💀 COLAPSADO - NÃO PODE LUTAR!', cor: 'text-red-500' };
    if (exaustao >= 60) return { texto: '🔴 EXAUSTO - Penalidades severas', cor: 'text-orange-500' };
    if (exaustao >= 40) return { texto: '🟡 CANSADO - Penalidades leves', cor: 'text-yellow-500' };
    if (exaustao >= 20) return { texto: '🟢 ALERTA - Tudo ok', cor: 'text-green-500' };
    return { texto: '💚 DESCANSADO - Bônus ativo!', cor: 'text-green-400' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center">
        <div className="text-cyan-400 font-mono animate-pulse">Carregando Arena...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent mb-2">
              🏟️ ARENA DE TREINO
            </h1>
            <p className="text-slate-400 font-mono text-sm">
              Teste suas habilidades contra adversários controlados por IA
            </p>
          </div>
          
          <button
            onClick={() => router.push("/arena")}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors"
          >
            ← Voltar ao Lobby
          </button>
        </div>

        {/* Sem avatares */}
        {avatares.length === 0 && (
          <div className="max-w-2xl mx-auto text-center py-20 bg-slate-900/50 rounded-lg border border-slate-800">
            <div className="text-6xl mb-6">⚔️</div>
            <h2 className="text-2xl font-bold text-slate-300 mb-4">
              Nenhum Avatar Disponível
            </h2>
            <p className="text-slate-400 mb-8">
              Você precisa de avatares vivos para treinar!
            </p>
            <button
              onClick={() => router.push("/ocultista")}
              className="px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded font-bold transition-colors"
            >
              Invocar Avatar
            </button>
          </div>
        )}

        {/* Interface Principal */}
        {avatares.length > 0 && (
          <div className="space-y-8">
            {/* Seleção de Avatar */}
            <div>
              <h2 className="text-3xl font-black text-cyan-400 mb-6 flex items-center gap-3">
                <span className="text-4xl">👤</span> SELECIONAR AVATAR
              </h2>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {avatares.map((avatar) => {
                  const selecionado = avatarSelecionado?.id === avatar.id;
                  const aviso = getAvisoExaustao(avatar.exaustao);
                  const podeLutar = avatar.exaustao < 100;

                  // Calcular stats com penalidades
                  const statsBase = {
                    forca: avatar.forca || 0,
                    agilidade: avatar.agilidade || 0,
                    resistencia: avatar.resistencia || 0,
                    foco: avatar.foco || 0
                  };
                  const statsAtuais = aplicarPenalidadesExaustao(statsBase, avatar.exaustao || 0);
                  const nivelExaustao = getNivelExaustao(avatar.exaustao || 0);
                  const temPenalidade = nivelExaustao.penalidades.stats !== undefined;

                  return (
                    <button
                      key={avatar.id}
                      onClick={() => podeLutar && setAvatarSelecionado(avatar)}
                      disabled={!podeLutar}
                      className={`group relative text-left overflow-hidden rounded-xl border-2 transition-all duration-300 ${
                        selecionado
                          ? 'border-cyan-500 bg-cyan-900/30 ring-4 ring-cyan-500/50 scale-105 shadow-2xl shadow-cyan-500/20'
                          : podeLutar
                            ? 'border-slate-700 bg-slate-900/50 hover:border-cyan-700 hover:scale-102 hover:shadow-xl'
                            : 'border-red-900 bg-red-950/30 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      {/* Badge de Seleção */}
                      {selecionado && (
                        <div className="absolute top-3 right-3 z-10 bg-cyan-500 text-white px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider animate-pulse">
                          ✓ Selecionado
                        </div>
                      )}

                      {/* Badge de Raridade */}
                      <div className={`absolute top-3 left-3 z-10 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                        avatar.raridade === 'Lendário' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' :
                        avatar.raridade === 'Raro' ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white' :
                        'bg-slate-700 text-slate-300'
                      }`}>
                        {avatar.raridade}
                      </div>

                      {/* Avatar Image */}
                      <div className="relative p-6 pb-3 flex justify-center items-center bg-gradient-to-b from-slate-950/50 to-transparent">
                        <div className={`relative ${podeLutar ? 'group-hover:scale-110' : ''} transition-transform duration-300`}>
                          <AvatarSVG avatar={avatar} tamanho={140} />
                          {!podeLutar && (
                            <div className="absolute inset-0 bg-red-950/70 rounded-full flex items-center justify-center">
                              <span className="text-4xl">💀</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Info do Avatar */}
                      <div className="px-4 pb-4">
                        {/* Nome e Nível */}
                        <div className="text-center mb-3">
                          <div className="font-black text-lg text-white mb-1">{avatar.nome}</div>
                          <div className="flex items-center justify-center gap-2 text-sm">
                            <span className="text-cyan-400 font-bold">Nv.{avatar.nivel}</span>
                            <span className="text-slate-500">•</span>
                            <span className="text-slate-400">{avatar.elemento}</span>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="bg-slate-950/50 rounded-lg p-3 mb-3">
                          <div className="grid grid-cols-4 gap-2 text-center text-xs">
                            <div>
                              {temPenalidade ? (
                                <div>
                                  <div className="text-[9px] text-slate-700 line-through">{statsBase.forca}</div>
                                  <div className="text-red-400 font-bold text-base">{statsAtuais.forca}</div>
                                </div>
                              ) : (
                                <div className="text-red-400 font-bold text-base">{statsBase.forca}</div>
                              )}
                              <div className="text-slate-600 font-semibold mt-1">FOR</div>
                            </div>
                            <div>
                              {temPenalidade ? (
                                <div>
                                  <div className="text-[9px] text-slate-700 line-through">{statsBase.agilidade}</div>
                                  <div className="text-green-400 font-bold text-base">{statsAtuais.agilidade}</div>
                                </div>
                              ) : (
                                <div className="text-green-400 font-bold text-base">{statsBase.agilidade}</div>
                              )}
                              <div className="text-slate-600 font-semibold mt-1">AGI</div>
                            </div>
                            <div>
                              {temPenalidade ? (
                                <div>
                                  <div className="text-[9px] text-slate-700 line-through">{statsBase.resistencia}</div>
                                  <div className="text-blue-400 font-bold text-base">{statsAtuais.resistencia}</div>
                                </div>
                              ) : (
                                <div className="text-blue-400 font-bold text-base">{statsBase.resistencia}</div>
                              )}
                              <div className="text-slate-600 font-semibold mt-1">RES</div>
                            </div>
                            <div>
                              {temPenalidade ? (
                                <div>
                                  <div className="text-[9px] text-slate-700 line-through">{statsBase.foco}</div>
                                  <div className="text-purple-400 font-bold text-base">{statsAtuais.foco}</div>
                                </div>
                              ) : (
                                <div className="text-purple-400 font-bold text-base">{statsBase.foco}</div>
                              )}
                              <div className="text-slate-600 font-semibold mt-1">FOC</div>
                            </div>
                          </div>
                        </div>

                        {/* Status de Exaustão */}
                        <div className={`text-xs ${aviso.cor} font-mono text-center font-bold py-2 px-3 rounded ${
                          podeLutar ? 'bg-slate-900/50' : 'bg-red-950/50'
                        }`}>
                          {aviso.texto}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Seleção de Dificuldade */}
            <div>
              <h2 className="text-3xl font-black text-orange-400 mb-6 flex items-center gap-3">
                <span className="text-4xl">🎯</span> SELECIONAR DIFICULDADE
              </h2>

              <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
                {Object.entries(dificuldades).map(([key, dif]) => {
                  const selecionada = dificuldadeSelecionada === key;

                  return (
                    <button
                      key={key}
                      onClick={() => setDificuldadeSelecionada(key)}
                      className={`group relative text-left p-5 rounded-xl border-2 transition-all duration-300 ${
                        selecionada
                          ? `${dif.corBorda} ${dif.corBg} ring-4 ring-offset-2 ring-offset-slate-950 ${dif.corBorda.replace('border-', 'ring-')} scale-105 shadow-2xl`
                          : 'border-slate-700 bg-slate-900/50 hover:border-slate-600 hover:bg-slate-900/70 hover:scale-102'
                      }`}
                    >
                      {/* Badge Selecionado */}
                      {selecionada && (
                        <div className="absolute top-3 right-3 bg-cyan-500 text-white text-xs px-3 py-1 rounded-full font-black uppercase tracking-wider animate-pulse">
                          ✓ Ativo
                        </div>
                      )}

                      {/* Header */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`text-5xl ${selecionada ? 'animate-pulse' : ''}`}>
                          {dif.emoji}
                        </div>
                        <div className="flex-1">
                          <div className="font-black text-xl text-white mb-1">{dif.nome}</div>
                          <div className="text-sm text-slate-300 font-semibold">{dif.descricao}</div>
                        </div>
                      </div>

                      <div className="text-xs text-slate-400 leading-relaxed mb-4">
                        {dif.detalhes}
                      </div>

                      {/* Stats do Inimigo */}
                      <div className="bg-slate-950/50 rounded-lg p-3 mb-3 space-y-2">
                        <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider">⚔️ Inimigo</div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Poder:</span>
                          <span className="text-white font-bold">{dif.stats}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Exaustão:</span>
                          <span className="text-orange-400 font-bold">+{dif.exaustao}</span>
                        </div>
                        <div className="text-xs text-slate-400 bg-slate-900/50 p-2 rounded leading-relaxed">
                          <span className="text-purple-400 font-semibold">IA:</span> {dif.iaComportamento}
                        </div>
                      </div>

                      {/* Recompensas */}
                      <div className="bg-slate-950/50 rounded-lg p-3 space-y-2">
                        <div className="text-xs font-bold text-green-400 uppercase tracking-wider">🎁 Recompensas</div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-blue-900/30 px-2 py-2 rounded text-center">
                            <div className="text-[10px] text-blue-300 mb-1">XP</div>
                            <div className="text-base font-bold text-blue-400">+{dif.recompensas.xp}</div>
                          </div>
                          <div className="bg-yellow-900/30 px-2 py-2 rounded text-center">
                            <div className="text-[10px] text-yellow-300 mb-1">Moedas</div>
                            <div className="text-base font-bold text-yellow-400">+{dif.recompensas.moedas}</div>
                          </div>
                        </div>
                        <div className="text-[10px] text-center text-slate-400">
                          💎 Fragmento: <span className="text-purple-400 font-bold">{dif.recompensas.chance_fragmento}</span>
                          {dif.recompensas.fragmentos && (
                            <span className="block text-purple-300 font-bold mt-1">+{dif.recompensas.fragmentos} Garantido!</span>
                          )}
                          {dif.recompensas.chance_extra && (
                            <span className="block text-purple-300 font-bold mt-1">+{dif.recompensas.chance_extra} extra</span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Botão Iniciar - Centralizado */}
              <div className="max-w-2xl mx-auto space-y-4">
                {avatarSelecionado && avatarSelecionado.exaustao >= 60 && (
                  <div className="p-4 bg-orange-950/50 border-2 border-orange-500/50 rounded-lg">
                    <p className="text-sm text-orange-400 font-bold text-center">
                      ⚠️ Seu avatar está exausto e terá penalidades em combate!
                    </p>
                  </div>
                )}

                <button
                  onClick={iniciarTreino}
                  disabled={!avatarSelecionado || avatarSelecionado.exaustao >= 100 || iniciandoBatalha}
                  className="w-full group relative disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="absolute -inset-1 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 rounded-xl blur opacity-50 group-hover:opacity-75 transition-all"></div>

                  <div className="relative px-12 py-6 bg-slate-950 rounded-xl border-2 border-orange-500 group-hover:border-orange-400 transition-all">
                    <span className="text-2xl font-black tracking-wider uppercase bg-gradient-to-r from-red-300 to-yellow-300 bg-clip-text text-transparent">
                      {iniciandoBatalha ? '⏳ Iniciando Batalha...' : '⚔️ INICIAR TREINO'}
                    </span>
                  </div>
                </button>

                {!avatarSelecionado && (
                  <p className="text-center text-sm text-slate-500 font-mono">
                    Selecione um avatar e uma dificuldade para começar
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
