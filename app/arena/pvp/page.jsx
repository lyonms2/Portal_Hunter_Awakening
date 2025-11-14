"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { aplicarPenalidadesExaustao, getNivelExaustao } from "../../avatares/sistemas/exhaustionSystem";
import AvatarSVG from "../../components/AvatarSVG";
import { getTierPorPontos, getProgressoNoTier, getProximoTier, calcularRecompensasPvP } from "../../../lib/pvp/rankingSystem";

export default function ArenaPvPPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [avatares, setAvatares] = useState([]);
  const [avatarSelecionado, setAvatarSelecionado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [estadoMatchmaking, setEstadoMatchmaking] = useState('selecao'); // selecao, procurando, encontrado, em_batalha
  const [tempoEspera, setTempoEspera] = useState(0);
  const [oponenteEncontrado, setOponenteEncontrado] = useState(null);

  // Sistema de Ranking
  const [pontosRanking, setPontosRanking] = useState(1000); // Começa em Bronze (1000 pontos)
  const [vitorias, setVitorias] = useState(0);
  const [derrotas, setDerrotas] = useState(0);

  // Modais
  const [modalAlerta, setModalAlerta] = useState(null);
  const [modalConfirmacao, setModalConfirmacao] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    carregarAvatares(parsedUser.id);

    // Carregar dados de ranking do localStorage
    const rankingData = localStorage.getItem(`pvp_ranking_${parsedUser.id}`);
    if (rankingData) {
      const { pontos, vitorias: v, derrotas: d } = JSON.parse(rankingData);
      setPontosRanking(pontos || 1000);
      setVitorias(v || 0);
      setDerrotas(d || 0);
    }
  }, [router]);

  // Timer de espera no matchmaking
  useEffect(() => {
    let interval;
    if (estadoMatchmaking === 'procurando') {
      interval = setInterval(() => {
        setTempoEspera(prev => prev + 1);
      }, 1000);
    } else {
      setTempoEspera(0);
    }

    return () => clearInterval(interval);
  }, [estadoMatchmaking]);

  const carregarAvatares = async (userId) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/meus-avatares?userId=${userId}`);
      const data = await response.json();

      if (response.ok) {
        const avataresVivos = data.avatares.filter(av => av.vivo && av.exaustao < 80);
        setAvatares(avataresVivos);

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

  const iniciarMatchmaking = () => {
    if (!avatarSelecionado) {
      setModalAlerta({
        titulo: '⚠️ Avatar não selecionado',
        mensagem: 'Selecione um avatar antes de procurar uma partida!'
      });
      return;
    }

    if (avatarSelecionado.exaustao >= 60) {
      setModalConfirmacao({
        titulo: '⚠️ Avatar Exausto',
        mensagem: 'Seu avatar está exausto! Isso pode prejudicar significativamente seu desempenho em combate. Deseja continuar mesmo assim?',
        onConfirm: () => {
          setModalConfirmacao(null);
          setEstadoMatchmaking('procurando');
        },
        onCancel: () => setModalConfirmacao(null)
      });
      return;
    }

    setEstadoMatchmaking('procurando');

    // Simulação de matchmaking (substituir por WebSocket/API real)
    setTimeout(() => {
      // Gerar oponente simulado
      const oponente = {
        id: 'oponente_' + Date.now(),
        nome: 'Jogador Adversário',
        nivel: avatarSelecionado.nivel + Math.floor(Math.random() * 3) - 1, // ±1 nivel
        avatar: gerarAvatarOponente(avatarSelecionado.nivel)
      };

      setOponenteEncontrado(oponente);
      setEstadoMatchmaking('encontrado');

      // Auto-iniciar após 3 segundos
      setTimeout(() => {
        iniciarBatalha();
      }, 3000);
    }, Math.random() * 3000 + 2000); // 2-5 segundos
  };

  const cancelarMatchmaking = () => {
    setEstadoMatchmaking('selecao');
    setOponenteEncontrado(null);
    setTempoEspera(0);
  };

  const gerarAvatarOponente = (nivelBase) => {
    const elementos = ['Fogo', 'Água', 'Terra', 'Vento', 'Eletricidade', 'Sombra', 'Luz'];
    const raridades = ['Comum', 'Raro', 'Lendário'];

    return {
      id: 'oponente_avatar_' + Date.now(),
      nome: 'Avatar do Oponente',
      elemento: elementos[Math.floor(Math.random() * elementos.length)],
      raridade: raridades[Math.floor(Math.random() * raridades.length)],
      nivel: nivelBase,
      forca: 15 + nivelBase * 2,
      agilidade: 15 + nivelBase * 2,
      resistencia: 15 + nivelBase * 2,
      foco: 15 + nivelBase * 2,
    };
  };

  const iniciarBatalha = () => {
    // Aplicar penalidades de exaustão aos stats do avatar ANTES de entrar em batalha
    const statsBase = {
      forca: avatarSelecionado.forca,
      agilidade: avatarSelecionado.agilidade,
      resistencia: avatarSelecionado.resistencia,
      foco: avatarSelecionado.foco
    };
    const statsComPenalidades = aplicarPenalidadesExaustao(statsBase, avatarSelecionado.exaustao || 0);

    // Avatar com stats penalizados
    const avatarComPenalidades = {
      ...avatarSelecionado,
      forca: statsComPenalidades.forca,
      agilidade: statsComPenalidades.agilidade,
      resistencia: statsComPenalidades.resistencia,
      foco: statsComPenalidades.foco
    };

    // Armazenar dados da partida PvP no sessionStorage
    const dadosPartida = {
      tipo: 'pvp',
      avatarJogador: avatarComPenalidades,
      avatarOponente: oponenteEncontrado.avatar,
      nomeOponente: oponenteEncontrado.nome,
      pontosRankingJogador: pontosRanking,
      pontosRankingOponente: oponenteEncontrado.avatar.nivel * 200 + 1000, // Simular pontos do oponente
      tierJogador: getTierPorPontos(pontosRanking)
    };

    sessionStorage.setItem('batalha_pvp_dados', JSON.stringify(dadosPartida));

    // Redirecionar para a página de batalha
    router.push('/arena/batalha?modo=pvp');
  };

  const getAvisoExaustao = (exaustao) => {
    if (exaustao >= 80) return { texto: '💀 EXAUSTO DEMAIS - NÃO PODE LUTAR!', cor: 'text-red-500' };
    if (exaustao >= 60) return { texto: '🔴 EXAUSTO - Penalidades severas', cor: 'text-orange-500' };
    if (exaustao >= 40) return { texto: '🟡 CANSADO - Penalidades leves', cor: 'text-yellow-500' };
    if (exaustao >= 20) return { texto: '🟢 ALERTA - Bom para lutar', cor: 'text-green-500' };
    return { texto: '💚 DESCANSADO - Em ótima forma!', cor: 'text-green-400' };
  };

  const formatarTempo = (segundos) => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center">
        <div className="text-cyan-400 font-mono animate-pulse">Carregando Arena PvP...</div>
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
              ⚔️ ARENA PvP
            </h1>
            <p className="text-slate-400 font-mono text-sm">
              Enfrente outros jogadores em batalhas competitivas 1v1
            </p>
          </div>

          <button
            onClick={() => router.push("/arena")}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors"
          >
            ← Voltar ao Lobby
          </button>
        </div>

        {/* Info PvP */}
        <div className="mb-8 bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border-2 border-cyan-500/50 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="text-4xl">⚔️</div>
            <div className="flex-1">
              <h3 className="text-xl font-black text-cyan-400 mb-2">ARENA PvP COMPETITIVA</h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-3">
                Enfrente outros jogadores em batalhas táticas em tempo real. Suba de tier e ganhe recompensas multiplicadas!
              </p>
              <div className="text-xs text-slate-400 space-y-1">
                <div>✅ Batalhas em tempo real (30s por turno)</div>
                <div>✅ Sistema de ranking com 6 tiers</div>
                <div>✅ Recompensas escalonadas (1.0x → 3.0x)</div>
                <div>✅ Pontos ELO balanceados</div>
                <div>✅ Upsets rendem bônus de pontos</div>
              </div>
            </div>
          </div>
        </div>

        {/* Sem avatares */}
        {avatares.length === 0 && (
          <div className="max-w-2xl mx-auto text-center py-20 bg-slate-900/50 rounded-lg border border-slate-800">
            <div className="text-6xl mb-6">⚔️</div>
            <h2 className="text-2xl font-bold text-slate-300 mb-4">
              Nenhum Avatar Disponível para PvP
            </h2>
            <p className="text-slate-400 mb-8">
              Apenas avatares vivos e com menos de 80% de exaustão podem lutar no PvP.
            </p>
            <button
              onClick={() => router.push("/avatares")}
              className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-bold transition-colors"
            >
              Ver Meus Avatares
            </button>
          </div>
        )}

        {/* Interface Principal */}
        {avatares.length > 0 && (
          <div className="space-y-8">
            {/* Estado: Seleção de Avatar */}
            {estadoMatchmaking === 'selecao' && (
              <>
                {/* Seleção de Avatar */}
                <div>
                  <h2 className="text-3xl font-black text-cyan-400 mb-6 flex items-center gap-3">
                    <span className="text-4xl">👤</span> SELECIONAR AVATAR
                  </h2>

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {avatares.map((avatar) => {
                      const selecionado = avatarSelecionado?.id === avatar.id;
                      const aviso = getAvisoExaustao(avatar.exaustao);
                      const podeLutar = avatar.exaustao < 80;

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
                          {selecionado && (
                            <div className="absolute top-3 right-3 z-10 bg-cyan-500 text-white px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider animate-pulse">
                              ✓ Selecionado
                            </div>
                          )}

                          <div className={`absolute top-3 left-3 z-10 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                            avatar.raridade === 'Lendário' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' :
                            avatar.raridade === 'Raro' ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white' :
                            'bg-slate-700 text-slate-300'
                          }`}>
                            {avatar.raridade}
                          </div>

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

                          <div className="px-4 pb-4">
                            <div className="text-center mb-3">
                              <div className="font-black text-lg text-white mb-1">{avatar.nome}</div>
                              <div className="flex items-center justify-center gap-2 text-sm">
                                <span className="text-cyan-400 font-bold">Nv.{avatar.nivel}</span>
                                <span className="text-slate-500">•</span>
                                <span className="text-slate-400">{avatar.elemento}</span>
                              </div>
                            </div>

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

                  {/* Botão Procurar Partida */}
                  <div className="max-w-2xl mx-auto space-y-4">
                    {avatarSelecionado && avatarSelecionado.exaustao >= 60 && (
                      <div className="p-4 bg-orange-950/50 border-2 border-orange-500/50 rounded-lg">
                        <p className="text-sm text-orange-400 font-bold text-center">
                          ⚠️ Seu avatar está exausto! Você terá penalidades em combate.
                        </p>
                      </div>
                    )}

                    <button
                      onClick={iniciarMatchmaking}
                      disabled={!avatarSelecionado}
                      className="w-full group relative disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="absolute -inset-1 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 rounded-xl blur opacity-50 group-hover:opacity-75 transition-all"></div>

                      <div className="relative px-12 py-6 bg-slate-950 rounded-xl border-2 border-orange-500 group-hover:border-orange-400 transition-all">
                        <span className="text-2xl font-black tracking-wider uppercase bg-gradient-to-r from-red-300 to-yellow-300 bg-clip-text text-transparent">
                          🔍 PROCURAR PARTIDA
                        </span>
                      </div>
                    </button>

                    {!avatarSelecionado && (
                      <p className="text-center text-sm text-slate-500 font-mono">
                        Selecione um avatar para procurar uma partida
                      </p>
                    )}
                  </div>
                </div>

                {/* Info PvP */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
                    <h3 className="text-xl font-bold text-cyan-400 mb-4 flex items-center gap-2">
                      <span>⚔️</span> Como Funciona
                    </h3>
                    <ul className="space-y-2 text-sm text-slate-300">
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-400 mt-1">▸</span>
                        <span><strong>Matchmaking equilibrado:</strong> Sistema busca oponentes de nível similar.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-400 mt-1">▸</span>
                        <span><strong>Turnos de 30 segundos:</strong> Decida rápido ou sua vez será pulada.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-400 mt-1">▸</span>
                        <span><strong>Sem desistência:</strong> Abandonar a partida conta como derrota.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-400 mt-1">▸</span>
                        <span><strong>Recompensas baseadas em ranking:</strong> Quanto maior seu rank, melhores as recompensas.</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
                    <h3 className="text-xl font-bold text-purple-400 mb-4 flex items-center gap-2">
                      <span>🏆</span> Ranking e Recompensas
                    </h3>

                    {(() => {
                      const tierAtual = getTierPorPontos(pontosRanking);
                      const progresso = getProgressoNoTier(pontosRanking, tierAtual);
                      const proximoTier = getProximoTier(tierAtual);
                      const totalPartidas = vitorias + derrotas;
                      const winRate = totalPartidas > 0 ? Math.floor((vitorias / totalPartidas) * 100) : 0;

                      return (
                        <div className="space-y-4">
                          {/* Tier Atual */}
                          <div className={`${tierAtual.corBg} ${tierAtual.corBorda} border-2 rounded-lg p-4`}>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <span className="text-4xl">{tierAtual.icone}</span>
                                <div>
                                  <div className={`text-2xl font-black ${tierAtual.corTexto}`}>
                                    {tierAtual.nome}
                                  </div>
                                  <div className="text-sm text-slate-400 font-mono">
                                    {pontosRanking} pontos
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-slate-500">Multiplicador</div>
                                <div className="text-xl font-black text-yellow-400">
                                  {tierAtual.multiplicadorRecompensa}x
                                </div>
                              </div>
                            </div>

                            {/* Barra de Progresso */}
                            {proximoTier && (
                              <div>
                                <div className="flex justify-between text-xs text-slate-400 mb-2">
                                  <span>Progresso para {proximoTier.nome}</span>
                                  <span>{progresso}%</span>
                                </div>
                                <div className="w-full bg-slate-950/50 rounded-full h-2 overflow-hidden">
                                  <div
                                    className={`h-full bg-gradient-to-r ${tierAtual.corTexto.replace('text-', 'from-')} to-purple-500 transition-all duration-500`}
                                    style={{ width: `${progresso}%` }}
                                  ></div>
                                </div>
                                <div className="text-xs text-slate-500 mt-1 text-center">
                                  Faltam {proximoTier.minPontos - pontosRanking} pontos
                                </div>
                              </div>
                            )}

                            {!proximoTier && (
                              <div className="text-center text-sm text-yellow-400 font-bold">
                                ⭐ RANK MÁXIMO ALCANÇADO! ⭐
                              </div>
                            )}
                          </div>

                          {/* Estatísticas */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-slate-950/50 rounded-lg">
                              <div className="text-xs text-slate-500 mb-1">Vitórias</div>
                              <div className="text-2xl font-bold text-green-400">{vitorias}</div>
                            </div>
                            <div className="p-3 bg-slate-950/50 rounded-lg">
                              <div className="text-xs text-slate-500 mb-1">Derrotas</div>
                              <div className="text-2xl font-bold text-red-400">{derrotas}</div>
                            </div>
                          </div>

                          {/* Win Rate */}
                          <div className="p-3 bg-slate-950/50 rounded-lg">
                            <div className="flex justify-between items-center">
                              <span className="text-slate-400 text-sm">Taxa de Vitória</span>
                              <span className={`text-2xl font-bold ${
                                winRate >= 60 ? 'text-green-400' :
                                winRate >= 40 ? 'text-yellow-400' :
                                'text-red-400'
                              }`}>
                                {winRate}%
                              </span>
                            </div>
                            {totalPartidas === 0 && (
                              <div className="text-xs text-slate-500 mt-2 text-center">
                                Jogue sua primeira partida!
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Tabela de Recompensas por Tier */}
                <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
                  <h3 className="text-xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
                    <span>💰</span> Recompensas Competitivas
                  </h3>

                  {(() => {
                    const tierAtual = getTierPorPontos(pontosRanking);
                    const recompensasVitoria = calcularRecompensasPvP(true, tierAtual, 0);
                    const recompensasDerrota = calcularRecompensasPvP(false, tierAtual, 0);

                    return (
                      <div className="space-y-4">
                        {/* Recompensas de Vitória */}
                        <div className="bg-green-950/30 border border-green-700/50 rounded-lg p-4">
                          <h4 className="text-lg font-black text-green-400 mb-3 flex items-center gap-2">
                            <span>🏆</span> Por Vitória (Tier {tierAtual.nome})
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div className="bg-slate-950/50 rounded p-3 text-center">
                              <div className="text-2xl mb-1">⭐</div>
                              <div className="text-cyan-400 font-bold text-lg">{recompensasVitoria.xp}</div>
                              <div className="text-slate-500 text-xs">XP</div>
                            </div>
                            <div className="bg-slate-950/50 rounded p-3 text-center">
                              <div className="text-2xl mb-1">💰</div>
                              <div className="text-yellow-400 font-bold text-lg">{recompensasVitoria.moedas}</div>
                              <div className="text-slate-500 text-xs">Moedas</div>
                            </div>
                            <div className="bg-slate-950/50 rounded p-3 text-center">
                              <div className="text-2xl mb-1">💎</div>
                              <div className="text-purple-400 font-bold text-lg">{recompensasVitoria.vinculo}</div>
                              <div className="text-slate-500 text-xs">Vínculo</div>
                            </div>
                            <div className="bg-slate-950/50 rounded p-3 text-center">
                              <div className="text-2xl mb-1">✨</div>
                              <div className="text-pink-400 font-bold text-lg">
                                {Math.floor(recompensasVitoria.chance_fragmento * 100)}%
                              </div>
                              <div className="text-slate-500 text-xs">Fragmento</div>
                            </div>
                          </div>
                        </div>

                        {/* Recompensas de Derrota */}
                        <div className="bg-red-950/30 border border-red-700/50 rounded-lg p-4">
                          <h4 className="text-lg font-black text-red-400 mb-3 flex items-center gap-2">
                            <span>💔</span> Por Derrota (Consolação)
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div className="bg-slate-950/50 rounded p-3 text-center">
                              <div className="text-2xl mb-1">⭐</div>
                              <div className="text-cyan-400 font-bold text-lg">{recompensasDerrota.xp}</div>
                              <div className="text-slate-500 text-xs">XP</div>
                            </div>
                            <div className="bg-slate-950/50 rounded p-3 text-center">
                              <div className="text-2xl mb-1">💰</div>
                              <div className="text-yellow-400 font-bold text-lg">{recompensasDerrota.moedas}</div>
                              <div className="text-slate-500 text-xs">Moedas</div>
                            </div>
                            <div className="bg-slate-950/50 rounded p-3 text-center">
                              <div className="text-2xl mb-1">💎</div>
                              <div className="text-red-400 font-bold text-lg">{recompensasDerrota.vinculo}</div>
                              <div className="text-slate-500 text-xs">Vínculo</div>
                            </div>
                            <div className="bg-slate-950/50 rounded p-3 text-center">
                              <div className="text-2xl mb-1">✨</div>
                              <div className="text-pink-400 font-bold text-lg">
                                {Math.floor(recompensasDerrota.chance_fragmento * 100)}%
                              </div>
                              <div className="text-slate-500 text-xs">Fragmento</div>
                            </div>
                          </div>
                        </div>

                        {/* Informação sobre Tiers */}
                        <div className="bg-gradient-to-r from-purple-950/50 to-blue-950/50 border border-purple-700/50 rounded-lg p-4">
                          <h4 className="text-sm font-bold text-purple-400 mb-2 flex items-center gap-2">
                            <span>📈</span> Multiplicadores por Tier
                          </h4>
                          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-xs">
                            <div className="text-center">
                              <div className="text-lg">🥉</div>
                              <div className="text-orange-400 font-bold">Bronze</div>
                              <div className="text-slate-500">1.0x</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg">🥈</div>
                              <div className="text-gray-400 font-bold">Prata</div>
                              <div className="text-slate-500">1.2x</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg">🥇</div>
                              <div className="text-yellow-400 font-bold">Ouro</div>
                              <div className="text-slate-500">1.5x</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg">💎</div>
                              <div className="text-cyan-400 font-bold">Platina</div>
                              <div className="text-slate-500">2.0x</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg">💠</div>
                              <div className="text-blue-400 font-bold">Diamante</div>
                              <div className="text-slate-500">2.5x</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg">👑</div>
                              <div className="text-purple-400 font-bold">Mestre</div>
                              <div className="text-slate-500">3.0x</div>
                            </div>
                          </div>
                        </div>

                        <p className="text-xs text-slate-500 text-center italic">
                          * Quanto maior seu rank, melhores as recompensas. Suba de tier para multiplicar seus ganhos!
                        </p>
                      </div>
                    );
                  })()}
                </div>
              </>
            )}

            {/* Estado: Procurando Partida */}
            {estadoMatchmaking === 'procurando' && (
              <div className="max-w-2xl mx-auto">
                <div className="bg-gradient-to-br from-slate-900/80 to-slate-950/80 backdrop-blur-xl rounded-2xl p-12 border-2 border-cyan-500/30">
                  <div className="text-center space-y-6">
                    {/* Animação de busca */}
                    <div className="relative">
                      <div className="w-32 h-32 mx-auto">
                        <div className="absolute inset-0 border-4 border-cyan-500/20 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                        <div className="absolute inset-4 border-4 border-orange-500/20 rounded-full"></div>
                        <div className="absolute inset-4 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                        <div className="absolute inset-0 flex items-center justify-center text-4xl">
                          🔍
                        </div>
                      </div>
                    </div>

                    <div>
                      <h2 className="text-3xl font-black text-white mb-2">
                        PROCURANDO OPONENTE...
                      </h2>
                      <p className="text-slate-400 font-mono text-sm">
                        Buscando jogador de nível similar
                      </p>
                    </div>

                    {/* Timer */}
                    <div className="inline-block bg-slate-950/50 rounded-lg px-6 py-3 border border-slate-700">
                      <div className="text-cyan-400 font-mono text-2xl font-bold">
                        ⏱️ {formatarTempo(tempoEspera)}
                      </div>
                    </div>

                    {/* Avatar Selecionado */}
                    {avatarSelecionado && (
                      <div className="bg-slate-950/50 rounded-lg p-6 border border-slate-700">
                        <p className="text-xs text-slate-500 uppercase mb-3">Seu Avatar</p>
                        <div className="flex items-center gap-4">
                          <AvatarSVG avatar={avatarSelecionado} tamanho={80} />
                          <div className="text-left">
                            <div className="font-bold text-white text-lg">{avatarSelecionado.nome}</div>
                            <div className="text-sm text-slate-400">Nv.{avatarSelecionado.nivel} • {avatarSelecionado.elemento}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Botão Cancelar */}
                    <button
                      onClick={cancelarMatchmaking}
                      className="px-8 py-3 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-lg border border-red-700 transition-colors font-bold"
                    >
                      ✕ Cancelar Busca
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Estado: Oponente Encontrado */}
            {estadoMatchmaking === 'encontrado' && oponenteEncontrado && (
              <div className="max-w-4xl mx-auto">
                <div className="bg-gradient-to-br from-green-900/30 to-slate-950/80 backdrop-blur-xl rounded-2xl p-12 border-2 border-green-500/50">
                  <div className="text-center space-y-8">
                    <div>
                      <div className="text-6xl mb-4 animate-bounce">⚔️</div>
                      <h2 className="text-4xl font-black text-green-400 mb-2">
                        OPONENTE ENCONTRADO!
                      </h2>
                      <p className="text-slate-400 font-mono">
                        Preparando batalha...
                      </p>
                    </div>

                    {/* VS Display */}
                    <div className="grid grid-cols-3 gap-8 items-center">
                      {/* Seu Avatar */}
                      <div className="bg-slate-950/50 rounded-xl p-6 border-2 border-cyan-500">
                        <p className="text-xs text-cyan-400 uppercase mb-4 font-bold">Você</p>
                        <AvatarSVG avatar={avatarSelecionado} tamanho={120} />
                        <div className="mt-4">
                          <div className="font-bold text-white text-lg">{avatarSelecionado.nome}</div>
                          <div className="text-sm text-slate-400">Nv.{avatarSelecionado.nivel}</div>
                        </div>
                      </div>

                      {/* VS */}
                      <div className="text-6xl font-black text-red-400 animate-pulse">
                        VS
                      </div>

                      {/* Oponente */}
                      <div className="bg-slate-950/50 rounded-xl p-6 border-2 border-red-500">
                        <p className="text-xs text-red-400 uppercase mb-4 font-bold">Oponente</p>
                        <AvatarSVG avatar={oponenteEncontrado.avatar} tamanho={120} />
                        <div className="mt-4">
                          <div className="font-bold text-white text-lg">{oponenteEncontrado.nome}</div>
                          <div className="text-sm text-slate-400">Nv.{oponenteEncontrado.nivel}</div>
                        </div>
                      </div>
                    </div>

                    <div className="text-slate-400 text-sm font-mono">
                      Iniciando em 3 segundos...
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal de Alerta */}
        {modalAlerta && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border-2 border-orange-500/50 p-8 max-w-md w-full shadow-2xl">
              <h3 className="text-2xl font-black text-orange-400 mb-4 flex items-center gap-3">
                {modalAlerta.titulo}
              </h3>
              <p className="text-slate-300 mb-6 leading-relaxed">
                {modalAlerta.mensagem}
              </p>
              <button
                onClick={() => setModalAlerta(null)}
                className="w-full px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white rounded-lg font-bold transition-all"
              >
                OK, Entendi
              </button>
            </div>
          </div>
        )}

        {/* Modal de Confirmação */}
        {modalConfirmacao && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border-2 border-yellow-500/50 p-8 max-w-md w-full shadow-2xl">
              <h3 className="text-2xl font-black text-yellow-400 mb-4 flex items-center gap-3">
                {modalConfirmacao.titulo}
              </h3>
              <p className="text-slate-300 mb-6 leading-relaxed">
                {modalConfirmacao.mensagem}
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={modalConfirmacao.onCancel}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg font-bold transition-all"
                >
                  ✕ Cancelar
                </button>
                <button
                  onClick={modalConfirmacao.onConfirm}
                  className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white rounded-lg font-bold transition-all"
                >
                  ✓ Continuar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
