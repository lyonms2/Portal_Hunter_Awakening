"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { aplicarPenalidadesExaustao, getNivelExaustao } from "../../avatares/sistemas/exhaustionSystem";
import { getNivelVinculo } from "../../avatares/sistemas/bondSystem";
import { calcularHPMaximoCompleto } from "../../../lib/combat/statsCalculator";
import AvatarSVG from "../../components/AvatarSVG";
import { getTierPorFama, getProgressoNoTier, getProximoTier } from "../../../lib/pvp/rankingSystem";

export default function ArenaPvPPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [avatarAtivo, setAvatarAtivo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [estadoMatchmaking, setEstadoMatchmaking] = useState('lobby'); // lobby, procurando, encontrado
  const [tempoEspera, setTempoEspera] = useState(0);
  const [oponenteEncontrado, setOponenteEncontrado] = useState(null);

  // Sistema de Ranking (Fama)
  const [fama, setFama] = useState(1000); // Começa em Bronze (1000 fama)
  const [vitorias, setVitorias] = useState(0);
  const [derrotas, setDerrotas] = useState(0);
  const [streak, setStreak] = useState(0); // Streak de vitórias consecutivas

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
    carregarAvatarAtivo(parsedUser.id);

    // Carregar dados de ranking do localStorage
    const rankingData = localStorage.getItem(`pvp_ranking_${parsedUser.id}`);
    if (rankingData) {
      const { fama: f, pontos, vitorias: v, derrotas: d, streak: s } = JSON.parse(rankingData);
      setFama(f || pontos || 1000); // Backward compatibility com "pontos"
      setVitorias(v || 0);
      setDerrotas(d || 0);
      setStreak(s || 0);
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

  const carregarAvatarAtivo = async (userId) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/meus-avatares?userId=${userId}`);
      const data = await response.json();

      if (response.ok) {
        const ativo = data.avatares.find(av => av.ativo);
        setAvatarAtivo(ativo || null);
      }
    } catch (error) {
      console.error("Erro ao carregar avatar ativo:", error);
    } finally {
      setLoading(false);
    }
  };

  const iniciarMatchmaking = () => {
    if (!avatarAtivo) {
      setModalAlerta({
        titulo: '⚠️ Sem Avatar Ativo',
        mensagem: 'Você precisa ter um avatar ativo para entrar no PvP!'
      });
      return;
    }

    if (!avatarAtivo.vivo) {
      setModalAlerta({
        titulo: '💀 Avatar Morto',
        mensagem: 'Seu avatar está morto! Visite o Necromante para ressuscitá-lo.'
      });
      return;
    }

    if (avatarAtivo.exaustao >= 80) {
      setModalAlerta({
        titulo: '😰 Avatar Colapsado',
        mensagem: 'Seu avatar está colapsado de exaustão! Deixe-o descansar antes de lutar.'
      });
      return;
    }

    if (avatarAtivo.exaustao >= 60) {
      setModalConfirmacao({
        titulo: '⚠️ Avatar Exausto',
        mensagem: 'Seu avatar está exausto! Isso causará penalidades severas em combate. Deseja continuar mesmo assim?',
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
        nivel: avatarAtivo.nivel + Math.floor(Math.random() * 3) - 1, // ±1 nivel
        avatar: gerarAvatarOponente(avatarAtivo.nivel)
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
    setEstadoMatchmaking('lobby');
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
      forca: avatarAtivo.forca,
      agilidade: avatarAtivo.agilidade,
      resistencia: avatarAtivo.resistencia,
      foco: avatarAtivo.foco
    };
    const statsComPenalidades = aplicarPenalidadesExaustao(statsBase, avatarAtivo.exaustao || 0);

    // Avatar com stats penalizados
    const avatarComPenalidades = {
      ...avatarAtivo,
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
      famaJogador: fama,
      famaOponente: oponenteEncontrado.avatar.nivel * 200 + 1000, // Simular fama do oponente
      tierJogador: getTierPorFama(fama),
      streakJogador: streak
    };

    sessionStorage.setItem('batalha_pvp_dados', JSON.stringify(dadosPartida));

    // Redirecionar para a página de batalha
    router.push('/arena/batalha?modo=pvp');
  };

  const formatarTempo = (segundos) => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calcular stats e informações do avatar
  const statsBase = avatarAtivo ? {
    forca: avatarAtivo.forca || 0,
    agilidade: avatarAtivo.agilidade || 0,
    resistencia: avatarAtivo.resistencia || 0,
    foco: avatarAtivo.foco || 0
  } : null;

  const statsAtuais = avatarAtivo ? aplicarPenalidadesExaustao(statsBase, avatarAtivo.exaustao || 0) : null;
  const nivelExaustao = avatarAtivo ? getNivelExaustao(avatarAtivo.exaustao || 0) : null;
  const nivelVinculo = avatarAtivo ? getNivelVinculo(avatarAtivo.vinculo || 0) : null;
  const hpMaximo = avatarAtivo ? calcularHPMaximoCompleto(avatarAtivo) : 0;
  const hpAtual = avatarAtivo ? (avatarAtivo.hp_atual !== undefined ? avatarAtivo.hp_atual : hpMaximo) : 0;
  const temPenalidade = nivelExaustao && nivelExaustao.penalidades.stats !== undefined;

  // Tier info
  const tierAtual = getTierPorFama(fama);
  const progressoTier = getProgressoNoTier(fama, tierAtual);
  const proximoTier = getProximoTier(tierAtual);

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

        {/* Sem Avatar Ativo */}
        {!avatarAtivo && (
          <div className="max-w-2xl mx-auto text-center py-20 bg-slate-900/50 rounded-lg border border-slate-800">
            <div className="text-6xl mb-6">⚔️</div>
            <h2 className="text-2xl font-bold text-slate-300 mb-4">
              Nenhum Avatar Ativo
            </h2>
            <p className="text-slate-400 mb-8">
              Você precisa ter um avatar ativo para participar do PvP.
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
        {avatarAtivo && estadoMatchmaking === 'lobby' && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Coluna Esquerda - Avatar Ativo */}
            <div className="lg:col-span-1 space-y-6">
              {/* Card do Avatar */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-red-500/20 via-orange-500/20 to-yellow-500/20 rounded-xl blur opacity-50"></div>

                <div className="relative bg-slate-950/90 backdrop-blur-xl border border-orange-900/50 rounded-xl overflow-hidden">
                  {/* Header do Card */}
                  <div className="bg-gradient-to-r from-red-900/30 to-orange-900/30 p-4 border-b border-orange-500/30">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs text-slate-400 uppercase font-mono tracking-wider">Seu Gladiador</div>
                      <div className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                        avatarAtivo.raridade === 'Lendário' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' :
                        avatarAtivo.raridade === 'Raro' ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white' :
                        'bg-slate-700 text-slate-300'
                      }`}>
                        {avatarAtivo.raridade}
                      </div>
                    </div>
                    <h2 className="text-2xl font-bold text-orange-400">{avatarAtivo.nome}</h2>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-sm text-slate-300">Nv.{avatarAtivo.nivel}</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-sm text-slate-400">{avatarAtivo.elemento}</span>
                    </div>
                  </div>

                  {/* Avatar Image */}
                  <div className="p-6 flex justify-center bg-gradient-to-b from-slate-950/30 to-transparent">
                    <AvatarSVG avatar={avatarAtivo} tamanho={180} />
                  </div>

                  {/* Stats */}
                  <div className="p-4 space-y-3">
                    {/* HP */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-green-400 font-bold">❤️ HP</span>
                        <span className="text-slate-400">{hpAtual} / {hpMaximo}</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            (hpAtual / hpMaximo) > 0.7 ? 'bg-green-500' :
                            (hpAtual / hpMaximo) > 0.4 ? 'bg-yellow-500' :
                            (hpAtual / hpMaximo) > 0.2 ? 'bg-orange-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${Math.min((hpAtual / hpMaximo) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* XP / Nível */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-cyan-400 font-bold">⭐ Nível {avatarAtivo.nivel}</span>
                        <span className="text-slate-400">
                          {avatarAtivo.experiencia || 0} / {avatarAtivo.nivel * 100} XP
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all"
                          style={{
                            width: `${Math.min(((avatarAtivo.experiencia || 0) / (avatarAtivo.nivel * 100)) * 100, 100)}%`
                          }}
                        ></div>
                      </div>
                      <div className="text-[10px] text-cyan-400 font-bold mt-1 text-center">
                        {Math.floor(((avatarAtivo.experiencia || 0) / (avatarAtivo.nivel * 100)) * 100)}% para próximo nível
                      </div>
                    </div>

                    {/* Stats com penalidade */}
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="text-[10px] text-slate-500 uppercase mb-1">Força</div>
                          {temPenalidade ? (
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-600 line-through">{statsBase.forca}</span>
                              <span className="text-red-400 font-bold text-lg">→ {statsAtuais.forca}</span>
                            </div>
                          ) : (
                            <div className="text-red-400 font-bold text-lg">{statsBase.forca}</div>
                          )}
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500 uppercase mb-1">Agilidade</div>
                          {temPenalidade ? (
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-600 line-through">{statsBase.agilidade}</span>
                              <span className="text-green-400 font-bold text-lg">→ {statsAtuais.agilidade}</span>
                            </div>
                          ) : (
                            <div className="text-green-400 font-bold text-lg">{statsBase.agilidade}</div>
                          )}
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500 uppercase mb-1">Resistência</div>
                          {temPenalidade ? (
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-600 line-through">{statsBase.resistencia}</span>
                              <span className="text-blue-400 font-bold text-lg">→ {statsAtuais.resistencia}</span>
                            </div>
                          ) : (
                            <div className="text-blue-400 font-bold text-lg">{statsBase.resistencia}</div>
                          )}
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500 uppercase mb-1">Foco</div>
                          {temPenalidade ? (
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-600 line-through">{statsBase.foco}</span>
                              <span className="text-purple-400 font-bold text-lg">→ {statsAtuais.foco}</span>
                            </div>
                          ) : (
                            <div className="text-purple-400 font-bold text-lg">{statsBase.foco}</div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Exaustão */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-orange-400 font-bold">😰 Exaustão</span>
                        <span className={nivelExaustao.cor}>{avatarAtivo.exaustao || 0}%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full transition-all ${nivelExaustao.corBarra}`}
                          style={{ width: `${Math.min(avatarAtivo.exaustao || 0, 100)}%` }}
                        ></div>
                      </div>
                      <div className="text-[10px] text-center mt-1">
                        <span className={nivelExaustao.cor}>{nivelExaustao.nome}</span>
                      </div>
                    </div>

                    {/* Vínculo */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-pink-400 font-bold">💚 Vínculo</span>
                        <span className="text-slate-400">{avatarAtivo.vinculo || 0}/100</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all"
                          style={{ width: `${Math.min(avatarAtivo.vinculo || 0, 100)}%` }}
                        ></div>
                      </div>
                      <div className="text-[10px] text-center mt-1">
                        <span className="text-pink-400">{nivelVinculo.emoji} {nivelVinculo.nome}</span>
                      </div>
                    </div>

                    {/* Avisos */}
                    {!avatarAtivo.vivo && (
                      <div className="p-3 bg-red-950/50 border border-red-500/50 rounded text-center">
                        <p className="text-sm text-red-400 font-bold">☠️ Avatar Morto - Visite o Necromante</p>
                      </div>
                    )}

                    {avatarAtivo.vivo && avatarAtivo.exaustao >= 80 && (
                      <div className="p-3 bg-red-950/50 border border-red-500/50 rounded text-center">
                        <p className="text-sm text-red-400 font-bold">😰 Colapsado - Não pode lutar!</p>
                      </div>
                    )}

                    {avatarAtivo.vivo && avatarAtivo.exaustao >= 60 && avatarAtivo.exaustao < 80 && (
                      <div className="p-3 bg-orange-950/50 border border-orange-500/50 rounded text-center">
                        <p className="text-sm text-orange-400 font-bold">⚠️ Muito Exausto - Penalidades Severas</p>
                      </div>
                    )}
                  </div>

                  {/* Botão trocar avatar */}
                  <div className="p-4 border-t border-slate-700/50">
                    <button
                      onClick={() => router.push('/avatares')}
                      className="w-full group/trocar relative"
                    >
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded blur opacity-0 group-hover/trocar:opacity-75 transition-all"></div>
                      <div className="relative px-4 py-3 bg-slate-900/50 hover:bg-slate-800/50 rounded border border-cyan-500/30 group-hover/trocar:border-cyan-400/50 transition-all">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-cyan-400 font-bold text-sm">🔄 Trocar Avatar</span>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Card de Ranking */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-red-500/20 rounded-xl blur opacity-50"></div>

                <div className="relative bg-slate-950/90 backdrop-blur-xl border border-yellow-900/50 rounded-xl overflow-hidden p-6">
                  <h3 className="text-xl font-black text-yellow-400 mb-4 flex items-center gap-2">
                    <span>{tierAtual.icone}</span> SEU RANKING
                  </h3>

                  <div className="space-y-4">
                    {/* Tier Atual */}
                    <div className={`${tierAtual.corBg} border ${tierAtual.corBorda} rounded-lg p-4`}>
                      <div className="text-center">
                        <div className="text-4xl mb-2">{tierAtual.icone}</div>
                        <div className={`text-2xl font-black ${tierAtual.corTexto}`}>{tierAtual.nome}</div>
                        <div className="text-sm text-slate-400 mt-1">{fama} Fama</div>
                      </div>
                    </div>

                    {/* Progresso */}
                    {proximoTier && (
                      <div>
                        <div className="flex justify-between text-xs mb-2">
                          <span className="text-slate-400">Progresso para {proximoTier.nome}</span>
                          <span className="text-yellow-400 font-bold">{progressoTier}%</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all"
                            style={{ width: `${progressoTier}%` }}
                          ></div>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1 text-center">
                          {proximoTier.minFama - fama} fama restante
                        </div>
                      </div>
                    )}

                    {/* Estatísticas */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-green-400">{vitorias}</div>
                        <div className="text-[10px] text-slate-500 uppercase">Vitórias</div>
                      </div>
                      <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-red-400">{derrotas}</div>
                        <div className="text-[10px] text-slate-500 uppercase">Derrotas</div>
                      </div>
                    </div>

                    {/* Win Rate */}
                    {(vitorias + derrotas) > 0 && (
                      <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-cyan-400">
                          {Math.round((vitorias / (vitorias + derrotas)) * 100)}%
                        </div>
                        <div className="text-[10px] text-slate-500 uppercase">Taxa de Vitória</div>
                      </div>
                    )}

                    {/* Streak */}
                    {streak > 0 && (
                      <div className={`rounded-lg p-3 text-center border-2 ${
                        streak >= 10 ? 'bg-purple-950/50 border-purple-500' :
                        streak >= 5 ? 'bg-orange-950/50 border-orange-500' :
                        'bg-yellow-950/50 border-yellow-500'
                      }`}>
                        <div className="text-lg font-bold">
                          {streak >= 10 ? '🔥' : streak >= 5 ? '⚡' : '✨'}
                          <span className={
                            streak >= 10 ? 'text-purple-400' :
                            streak >= 5 ? 'text-orange-400' :
                            'text-yellow-400'
                          }> {streak}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 uppercase">
                          {streak >= 10 ? 'STREAK LENDÁRIO!' : streak >= 5 ? 'HOT STREAK!' : 'Vitórias Seguidas'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Coluna Direita - Info e Botão */}
            <div className="lg:col-span-2 space-y-6">
              {/* Info PvP */}
              <div className="bg-gradient-to-r from-red-900/30 to-orange-900/30 border-2 border-orange-500/50 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">⚔️</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-black text-orange-400 mb-2">ARENA PvP COMPETITIVA</h3>
                    <p className="text-slate-300 text-sm leading-relaxed mb-3">
                      Enfrente outros jogadores em batalhas táticas! Suba de tier, ganhe fama e conquiste recompensas incríveis!
                    </p>
                    <div className="text-xs text-slate-400 space-y-1">
                      <div>✅ Batalhas em tempo real (30s por turno)</div>
                      <div>✅ Sistema de ranking com 6 tiers</div>
                      <div>✅ Recompensas escalonadas (1.0x → 3.0x)</div>
                      <div>✅ Ganha Fama, XP, Moedas, Vínculo e Fragmentos</div>
                      <div>✅ Matchmaking balanceado por nível</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botão Procurar Partida */}
              <div className="space-y-4">
                <button
                  onClick={iniciarMatchmaking}
                  disabled={!avatarAtivo?.vivo || (avatarAtivo?.exaustao >= 80)}
                  className="w-full group relative disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="absolute -inset-1 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 rounded-xl blur opacity-50 group-hover:opacity-75 transition-all"></div>

                  <div className="relative px-12 py-8 bg-slate-950 rounded-xl border-2 border-orange-500 group-hover:border-orange-400 transition-all">
                    <span className="text-3xl font-black tracking-wider uppercase bg-gradient-to-r from-red-300 to-yellow-300 bg-clip-text text-transparent">
                      🔍 PROCURAR PARTIDA
                    </span>
                  </div>
                </button>

                {(!avatarAtivo?.vivo || avatarAtivo?.exaustao >= 80) && (
                  <p className="text-center text-sm text-red-400 font-mono">
                    ⚠️ Seu avatar não pode lutar neste estado
                  </p>
                )}
              </div>

              {/* Recompensas e Informações */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
                  <h3 className="text-xl font-bold text-cyan-400 mb-4 flex items-center gap-2">
                    <span>🎁</span> Recompensas
                  </h3>
                  <ul className="space-y-2 text-sm text-slate-300">
                    <li className="flex items-start gap-2">
                      <span className="text-cyan-400 mt-1">▸</span>
                      <span><strong>Vitória:</strong> XP, Moedas, Fama, Vínculo e chance de Fragmentos</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-cyan-400 mt-1">▸</span>
                      <span><strong>Derrota:</strong> Perde Fama e Vínculo, ganha pouco XP</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-cyan-400 mt-1">▸</span>
                      <span><strong>Tiers mais altos:</strong> Multiplicador de recompensas (até 3x)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-cyan-400 mt-1">▸</span>
                      <span><strong>Exaustão:</strong> 15 pontos por batalha (win ou loss)</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
                  <h3 className="text-xl font-bold text-cyan-400 mb-4 flex items-center gap-2">
                    <span>⚔️</span> Como Funciona
                  </h3>
                  <ul className="space-y-2 text-sm text-slate-300">
                    <li className="flex items-start gap-2">
                      <span className="text-cyan-400 mt-1">▸</span>
                      <span><strong>Matchmaking equilibrado:</strong> Busca oponentes de nível similar</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-cyan-400 mt-1">▸</span>
                      <span><strong>Batalha tática:</strong> Mesmas regras do modo treino</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-cyan-400 mt-1">▸</span>
                      <span><strong>Timer por turno:</strong> 30 segundos para decidir sua ação</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-cyan-400 mt-1">▸</span>
                      <span><strong>Upsets:</strong> Vencer oponente mais forte dá bônus de Fama</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
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

                {/* Avatar Ativo */}
                <div className="bg-slate-950/50 rounded-lg p-6 border border-slate-700">
                  <p className="text-xs text-slate-500 uppercase mb-3">Seu Avatar</p>
                  <div className="flex items-center justify-center gap-4">
                    <AvatarSVG avatar={avatarAtivo} tamanho={80} />
                    <div className="text-left">
                      <div className="font-bold text-white text-lg">{avatarAtivo.nome}</div>
                      <div className="text-sm text-slate-400">Nv.{avatarAtivo.nivel} • {avatarAtivo.elemento}</div>
                    </div>
                  </div>
                </div>

                {/* Botão Cancelar */}
                <button
                  onClick={cancelarMatchmaking}
                  className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded transition-colors"
                >
                  Cancelar Busca
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Estado: Oponente Encontrado */}
        {estadoMatchmaking === 'encontrado' && oponenteEncontrado && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-slate-900/80 to-slate-950/80 backdrop-blur-xl rounded-2xl p-12 border-2 border-green-500/50">
              <div className="text-center space-y-8">
                <h2 className="text-4xl font-black text-green-400 mb-4">
                  🎯 OPONENTE ENCONTRADO!
                </h2>

                {/* Versus */}
                <div className="grid md:grid-cols-3 gap-6 items-center">
                  {/* Seu Avatar */}
                  <div className="bg-cyan-950/30 rounded-xl p-6 border-2 border-cyan-500/50">
                    <p className="text-xs text-cyan-400 uppercase mb-4 font-bold">VOCÊ</p>
                    <div className="flex flex-col items-center">
                      <AvatarSVG avatar={avatarAtivo} tamanho={100} />
                      <div className="mt-4 text-center">
                        <div className="font-bold text-white text-lg">{avatarAtivo.nome}</div>
                        <div className="text-sm text-slate-400">Nv.{avatarAtivo.nivel}</div>
                        <div className="text-xs text-slate-500">{avatarAtivo.elemento}</div>
                      </div>
                    </div>
                  </div>

                  {/* VS */}
                  <div className="text-6xl font-black text-orange-500 animate-pulse">
                    VS
                  </div>

                  {/* Oponente */}
                  <div className="bg-red-950/30 rounded-xl p-6 border-2 border-red-500/50">
                    <p className="text-xs text-red-400 uppercase mb-4 font-bold">OPONENTE</p>
                    <div className="flex flex-col items-center">
                      <AvatarSVG avatar={oponenteEncontrado.avatar} tamanho={100} />
                      <div className="mt-4 text-center">
                        <div className="font-bold text-white text-lg">{oponenteEncontrado.nome}</div>
                        <div className="text-sm text-slate-400">Nv.{oponenteEncontrado.nivel}</div>
                        <div className="text-xs text-slate-500">{oponenteEncontrado.avatar.elemento}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-slate-400 text-sm animate-pulse">
                  Iniciando batalha em 3 segundos...
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Alerta */}
      {modalAlerta && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 rounded-lg border-2 border-red-500 p-6">
            <h3 className="text-2xl font-black text-red-400 mb-4">{modalAlerta.titulo}</h3>
            <p className="text-slate-300 mb-6">{modalAlerta.mensagem}</p>
            <button
              onClick={() => setModalAlerta(null)}
              className="w-full px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded transition-colors"
            >
              Entendi
            </button>
          </div>
        </div>
      )}

      {/* Modal de Confirmação */}
      {modalConfirmacao && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 rounded-lg border-2 border-orange-500 p-6">
            <h3 className="text-2xl font-black text-orange-400 mb-4">{modalConfirmacao.titulo}</h3>
            <p className="text-slate-300 mb-6">{modalConfirmacao.mensagem}</p>
            <div className="flex gap-4">
              <button
                onClick={modalConfirmacao.onCancel}
                className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={modalConfirmacao.onConfirm}
                className="flex-1 px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded transition-colors"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
