"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { aplicarPenalidadesExaustao, getNivelExaustao } from "../../avatares/sistemas/exhaustionSystem";
import { getNivelVinculo } from "../../avatares/sistemas/bondSystem";
import { calcularHPMaximoCompleto } from "../../../lib/combat/statsCalculator";
import AvatarSVG from "../../components/AvatarSVG";
import { getTierPorFama, getProgressoNoTier, getProximoTier } from "../../../lib/pvp/rankingSystem";
import { getInfoTemporada } from "../../../lib/pvp/seasonSystem";
import { getPosicaoJogador } from "../../../lib/pvp/leaderboardSystem";

export default function ArenaPvPPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [avatarAtivo, setAvatarAtivo] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sistema de Ranking (Fama)
  const [fama, setFama] = useState(1000);
  const [vitorias, setVitorias] = useState(0);
  const [derrotas, setDerrotas] = useState(0);
  const [streak, setStreak] = useState(0);
  const [infoTemporada, setInfoTemporada] = useState(null);
  const [posicaoLeaderboard, setPosicaoLeaderboard] = useState(null);

  // Estado da UI
  const [abaAtiva, setAbaAtiva] = useState('jogadores'); // 'jogadores' ou 'desafios'

  // Jogadores disponíveis
  const [jogadoresDisponiveis, setJogadoresDisponiveis] = useState([]);
  const [loadingJogadores, setLoadingJogadores] = useState(false);

  // Desafios
  const [desafiosRecebidos, setDesafiosRecebidos] = useState([]);
  const [desafiosEnviados, setDesafiosEnviados] = useState([]);
  const [loadingDesafios, setLoadingDesafios] = useState(false);

  // Modais
  const [modalAlerta, setModalAlerta] = useState(null);
  const [modalConfirmacao, setModalConfirmacao] = useState(null);

  // Heartbeat interval
  const [heartbeatInterval, setHeartbeatInterval] = useState(null);

  // Controle para evitar múltiplas entradas na mesma batalha
  const [batalhaEmAndamento, setBatalhaEmAndamento] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    carregarAvatarAtivo(parsedUser.id);
    carregarRankingData(parsedUser.id);

    const tempInfo = getInfoTemporada();
    setInfoTemporada(tempInfo);

    return () => {
      // Cleanup ao desmontar
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
      // Remover da lista de disponíveis
      if (parsedUser?.id) {
        removerDaListaDisponiveis(parsedUser.id);
      }
    };
  }, [router]);

  // Atualizar listas periodicamente quando na aba
  useEffect(() => {
    if (!user || !avatarAtivo) return;

    // Carregar lista inicial
    if (abaAtiva === 'jogadores') {
      carregarJogadoresDisponiveis();
      // Auto-refresh a cada 5 segundos
      const interval = setInterval(carregarJogadoresDisponiveis, 5000);
      return () => clearInterval(interval);
    } else if (abaAtiva === 'desafios') {
      carregarDesafios();
      // Auto-refresh a cada 3 segundos
      const interval = setInterval(carregarDesafios, 3000);
      return () => clearInterval(interval);
    }
  }, [abaAtiva, user, avatarAtivo]);

  // Heartbeat para manter jogador na lista de disponíveis
  useEffect(() => {
    if (!user || !avatarAtivo || abaAtiva !== 'jogadores') return;

    // Adicionar/atualizar imediatamente
    adicionarAListaDisponiveis();

    // Heartbeat a cada 60 segundos
    const interval = setInterval(adicionarAListaDisponiveis, 60000);
    setHeartbeatInterval(interval);

    return () => {
      clearInterval(interval);
    };
  }, [user, avatarAtivo, abaAtiva]);

  // Polling GLOBAL para verificar se desafios foram aceitos (independente da aba)
  useEffect(() => {
    if (!user || !avatarAtivo) return;

    // Verificar imediatamente
    verificarEEntrarEmDesafiosAceitos();

    // Polling a cada 500ms (mais rápido!)
    const interval = setInterval(verificarEEntrarEmDesafiosAceitos, 500);

    return () => {
      clearInterval(interval);
    };
  }, [user, avatarAtivo]);

  const verificarEEntrarEmDesafiosAceitos = async () => {
    if (!user || batalhaEmAndamento) return;

    try {
      const desafiosAceitos = await verificarDesafiosAceitos(user.id);

      // Log detalhado para debug
      if (desafiosAceitos && desafiosAceitos.length > 0) {
        console.log('🔔 [POLLING] Desafios aceitos encontrados:', desafiosAceitos.length);
        console.log('🔔 [POLLING] Primeiro desafio:', desafiosAceitos[0]);
      }

      if (desafiosAceitos && desafiosAceitos.length > 0) {
        const desafioAceito = desafiosAceitos[0];
        console.log('🎉 Seu desafio foi aceito! Entrando na batalha...', desafioAceito);

        // Marcar que está entrando na batalha
        setBatalhaEmAndamento(true);

        await entrarNaBatalhaComoDesafiante(desafioAceito);
      }
    } catch (error) {
      console.error('Erro ao verificar desafios aceitos:', error);
      setBatalhaEmAndamento(false);
    }
  };

  const carregarRankingData = async (userId) => {
    try {
      const response = await fetch(`/api/pvp/ranking?userId=${userId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.ranking) {
          setFama(data.ranking.fama || 1000);
          setVitorias(data.ranking.vitorias || 0);
          setDerrotas(data.ranking.derrotas || 0);
          setStreak(data.ranking.streak || 0);

          const posicao = await getPosicaoJogador(userId, data.ranking.fama || 1000);
          setPosicaoLeaderboard(posicao);
        }
      }
    } catch (error) {
      console.warn('Erro ao buscar ranking:', error);
    }
  };

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

  const adicionarAListaDisponiveis = async () => {
    if (!user || !avatarAtivo) return;

    try {
      const poderTotal = avatarAtivo.forca + avatarAtivo.agilidade + avatarAtivo.resistencia + avatarAtivo.foco;

      await fetch('/api/pvp/players/available', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          avatarId: avatarAtivo.id,
          nivel: avatarAtivo.nivel,
          poderTotal: poderTotal,
          fama: fama
        })
      });
    } catch (error) {
      console.error('Erro ao atualizar disponibilidade:', error);
    }
  };

  const removerDaListaDisponiveis = async (userId) => {
    try {
      await fetch(`/api/pvp/players/available?userId=${userId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Erro ao remover disponibilidade:', error);
    }
  };

  const carregarJogadoresDisponiveis = async () => {
    if (!user) return;

    try {
      setLoadingJogadores(true);
      const response = await fetch(`/api/pvp/players/available?userId=${user.id}`);
      const data = await response.json();

      if (response.ok && data.success) {
        setJogadoresDisponiveis(data.players || []);
      }
    } catch (error) {
      console.error('Erro ao carregar jogadores:', error);
    } finally {
      setLoadingJogadores(false);
    }
  };

  const verificarDesafiosAceitos = async (userId) => {
    try {
      // Buscar desafios que você enviou e que foram aceitos
      console.log('[POLLING] Verificando desafios aceitos para userId:', userId);
      const response = await fetch(`/api/pvp/challenge/accepted?userId=${userId}`);
      const data = await response.json();

      console.log('[POLLING] Response:', { status: response.status, data });

      if (response.ok && data.success) {
        console.log('[POLLING] Desafios retornados:', data.challenges?.length || 0);
        return data.challenges || [];
      }
      return [];
    } catch (error) {
      console.error('Erro ao verificar desafios aceitos:', error);
      return [];
    }
  };

  const entrarNaBatalhaComoDesafiante = async (desafioAceito) => {
    try {
      console.log('🚀 [ENTRADA] Iniciando entrada na batalha como desafiante...');
      console.log('🚀 [ENTRADA] Dados do desafio:', desafioAceito);

      // Usar dados do desafio diretamente (mais rápido)
      const oponente = {
        userId: desafioAceito.challengedUserId,
        avatarId: desafioAceito.challengedAvatarId,
        avatar: desafioAceito.challengedAvatar,
        fama: desafioAceito.challengedFama,
        matchId: desafioAceito.matchId
      };

      console.log('🚀 [ENTRADA] Oponente preparado:', oponente);

      // Verificar se avatar tem habilidades
      if (!oponente.avatar?.habilidades) {
        console.warn('⚠️ [ENTRADA] Avatar sem habilidades, buscando dados completos...');
        const avatarResponse = await fetch(`/api/buscar-avatar?avatarId=${oponente.avatarId}`);
        if (avatarResponse.ok) {
          const avatarData = await avatarResponse.json();
          oponente.avatar = avatarData.avatar;
          console.log('✅ [ENTRADA] Avatar completo obtido');
        }
      }

      // Deletar o desafio aceito para não tentar entrar novamente
      console.log('🗑️ [ENTRADA] Deletando desafio processado...');
      await fetch(`/api/pvp/challenge/processed?challengeId=${desafioAceito.id}`, {
        method: 'DELETE'
      });

      console.log('🎮 [ENTRADA] Desafiante entrando na batalha com oponente:', oponente);

      iniciarBatalhaComOponente(oponente);
    } catch (error) {
      console.error('❌ [ENTRADA] Erro ao entrar na batalha como desafiante:', error);
      setBatalhaEmAndamento(false);
    }
  };

  const carregarDesafios = async () => {
    if (!user) return;

    try {
      setLoadingDesafios(true);

      // Buscar desafios recebidos
      const receivedResponse = await fetch(`/api/pvp/challenge/pending?userId=${user.id}&type=received`);
      const receivedData = await receivedResponse.json();

      // Buscar desafios enviados
      const sentResponse = await fetch(`/api/pvp/challenge/pending?userId=${user.id}&type=sent`);
      const sentData = await sentResponse.json();

      if (receivedResponse.ok && receivedData.success) {
        setDesafiosRecebidos(receivedData.challenges || []);
      }

      if (sentResponse.ok && sentData.success) {
        setDesafiosEnviados(sentData.challenges || []);
      }
    } catch (error) {
      console.error('Erro ao carregar desafios:', error);
    } finally {
      setLoadingDesafios(false);
    }
  };

  const desafiarJogador = async (jogador) => {
    if (!avatarAtivo) {
      setModalAlerta({
        titulo: '⚠️ Sem Avatar Ativo',
        mensagem: 'Você precisa ter um avatar ativo para desafiar!'
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
        mensagem: 'Seu avatar está colapsado de exaustão! Deixe-o descansar.'
      });
      return;
    }

    if (avatarAtivo.exaustao >= 60) {
      setModalConfirmacao({
        titulo: '⚠️ Avatar Exausto',
        mensagem: 'Seu avatar está exausto! Isso causará penalidades severas. Continuar?',
        onConfirm: () => {
          setModalConfirmacao(null);
          enviarDesafio(jogador);
        },
        onCancel: () => setModalConfirmacao(null)
      });
      return;
    }

    enviarDesafio(jogador);
  };

  const enviarDesafio = async (jogador) => {
    try {
      const poderTotal = avatarAtivo.forca + avatarAtivo.agilidade + avatarAtivo.resistencia + avatarAtivo.foco;

      const response = await fetch('/api/pvp/challenge/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengerUserId: user.id,
          challengerAvatarId: avatarAtivo.id,
          challengerNivel: avatarAtivo.nivel,
          challengerPoder: poderTotal,
          challengerFama: fama,
          challengedUserId: jogador.userId,
          challengedAvatarId: jogador.avatarId,
          challengedNivel: jogador.nivel,
          challengedPoder: jogador.poderTotal,
          challengedFama: jogador.fama
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setModalAlerta({
          titulo: '✅ Desafio Enviado!',
          mensagem: `Desafio enviado para ${jogador.avatar?.nome || 'jogador'}! Aguardando resposta...`
        });
        // Mudar para aba de desafios
        setAbaAtiva('desafios');
      } else {
        setModalAlerta({
          titulo: '⚠️ Erro',
          mensagem: data.message || 'Erro ao enviar desafio'
        });
      }
    } catch (error) {
      console.error('Erro ao enviar desafio:', error);
      setModalAlerta({
        titulo: '⚠️ Erro',
        mensagem: 'Erro ao enviar desafio. Tente novamente.'
      });
    }
  };

  const aceitarDesafio = async (desafio) => {
    try {
      const response = await fetch('/api/pvp/challenge/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: desafio.id,
          userId: user.id
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Iniciar batalha imediatamente
        // Quando você aceita, você é o player2, então o oponente é player1
        const oponente = {
          userId: data.battleRoom.player1UserId,
          avatarId: data.battleRoom.player1AvatarId,
          avatar: data.battleRoom.player1Avatar, // Dados completos do endpoint
          fama: desafio.challengerFama,
          matchId: data.matchId
        };

        iniciarBatalhaComOponente(oponente);
      } else {
        setModalAlerta({
          titulo: '⚠️ Erro',
          mensagem: data.message || 'Erro ao aceitar desafio'
        });
        carregarDesafios(); // Recarregar lista
      }
    } catch (error) {
      console.error('Erro ao aceitar desafio:', error);
      setModalAlerta({
        titulo: '⚠️ Erro',
        mensagem: 'Erro ao aceitar desafio. Tente novamente.'
      });
    }
  };

  const rejeitarDesafio = async (desafio) => {
    try {
      const response = await fetch('/api/pvp/challenge/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: desafio.id,
          userId: user.id
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        carregarDesafios(); // Recarregar lista
      }
    } catch (error) {
      console.error('Erro ao rejeitar desafio:', error);
    }
  };

  const iniciarBatalhaComOponente = (oponente) => {
    if (!oponente || !oponente.avatar) {
      console.error('Erro: Oponente não encontrado ou dados incompletos', oponente);
      setModalAlerta({
        titulo: '⚠️ Erro no Matchmaking',
        mensagem: 'Houve um erro ao iniciar a batalha. Tente novamente.'
      });
      return;
    }

    // Aplicar penalidades de exaustão
    const statsBase = {
      forca: avatarAtivo.forca,
      agilidade: avatarAtivo.agilidade,
      resistencia: avatarAtivo.resistencia,
      foco: avatarAtivo.foco
    };
    const statsComPenalidades = aplicarPenalidadesExaustao(statsBase, avatarAtivo.exaustao || 0);

    const avatarComPenalidades = {
      ...avatarAtivo,
      forca: statsComPenalidades.forca,
      agilidade: statsComPenalidades.agilidade,
      resistencia: statsComPenalidades.resistencia,
      foco: statsComPenalidades.foco,
      habilidades: Array.isArray(avatarAtivo.habilidades) ? avatarAtivo.habilidades : []
    };

    const avatarOponenteSeguro = {
      ...oponente.avatar,
      habilidades: Array.isArray(oponente.avatar.habilidades) ? oponente.avatar.habilidades : []
    };

    // Armazenar dados da partida
    const dadosPartida = {
      tipo: 'pvp',
      pvpAoVivo: true,
      matchId: oponente.matchId,
      avatarJogador: avatarComPenalidades,
      avatarOponente: avatarOponenteSeguro,
      nomeOponente: oponente.avatar.nome || 'Oponente',
      famaJogador: fama,
      famaOponente: oponente.fama || 1000,
      tierJogador: getTierPorFama(fama),
      streakJogador: streak,
      oponenteReal: true,
      oponenteId: oponente.userId
    };

    sessionStorage.setItem('batalha_pvp_dados', JSON.stringify(dadosPartida));

    // Redirecionar para batalha TESTE (DEBUG)
    router.push('/arena/batalha-teste?modo=pvp');
  };

  // Calcular stats do avatar
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
              Desafie outros jogadores em batalhas 1v1
            </p>
            {infoTemporada && (
              <div className="mt-2 flex items-center gap-3 text-xs">
                <span className="text-purple-400">
                  📅 {infoTemporada.nome}
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-orange-400">
                  ⏰ Termina em {infoTemporada.diasRestantes} dias
                </span>
                {posicaoLeaderboard && posicaoLeaderboard.posicao && (
                  <>
                    <span className="text-slate-600">•</span>
                    <span className="text-yellow-400">
                      🏆 #{posicaoLeaderboard.posicao}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => router.push("/arena/leaderboard")}
              className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white font-bold rounded border border-yellow-500/50 transition-colors"
            >
              🏆 Leaderboard
            </button>
            <button
              onClick={() => router.push("/arena")}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors"
            >
              ← Voltar ao Lobby
            </button>
          </div>
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
        {avatarAtivo && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Coluna Esquerda - Avatar e Ranking */}
            <div className="lg:col-span-1 space-y-6">
              {/* Card do Avatar */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-red-500/20 via-orange-500/20 to-yellow-500/20 rounded-xl blur opacity-50"></div>

                <div className="relative bg-slate-950/90 backdrop-blur-xl border border-orange-900/50 rounded-xl overflow-hidden">
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

                  <div className="p-6 flex justify-center bg-gradient-to-b from-slate-950/30 to-transparent">
                    <AvatarSVG avatar={avatarAtivo} tamanho={180} />
                  </div>

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
                            'bg-red-500'
                          }`}
                          style={{ width: `${Math.min((hpAtual / hpMaximo) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Stats */}
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

                    {/* Avisos */}
                    {!avatarAtivo.vivo && (
                      <div className="p-3 bg-red-950/50 border border-red-500/50 rounded text-center">
                        <p className="text-sm text-red-400 font-bold">☠️ Avatar Morto</p>
                      </div>
                    )}

                    {avatarAtivo.vivo && avatarAtivo.exaustao >= 80 && (
                      <div className="p-3 bg-red-950/50 border border-red-500/50 rounded text-center">
                        <p className="text-sm text-red-400 font-bold">😰 Colapsado</p>
                      </div>
                    )}
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
                  </div>
                </div>
              </div>
            </div>

            {/* Coluna Direita - Jogadores e Desafios */}
            <div className="lg:col-span-2 space-y-6">
              {/* Abas */}
              <div className="flex gap-4 mb-6">
                <button
                  onClick={() => setAbaAtiva('jogadores')}
                  className={`flex-1 px-6 py-4 rounded-lg font-bold transition-all ${
                    abaAtiva === 'jogadores'
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  👥 Jogadores Online ({jogadoresDisponiveis.length})
                </button>
                <button
                  onClick={() => setAbaAtiva('desafios')}
                  className={`flex-1 px-6 py-4 rounded-lg font-bold transition-all relative ${
                    abaAtiva === 'desafios'
                      ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  ⚔️ Desafios ({desafiosRecebidos.length + desafiosEnviados.length})
                  {desafiosRecebidos.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                      {desafiosRecebidos.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Conteúdo da Aba de Jogadores */}
              {abaAtiva === 'jogadores' && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border-2 border-cyan-500/50 rounded-xl p-6">
                    <h3 className="text-xl font-black text-cyan-400 mb-2">🌐 PVP AO VIVO</h3>
                    <p className="text-slate-300 text-sm mb-2">
                      Escolha um oponente abaixo e envie um desafio! Quando ele aceitar, a batalha começa imediatamente.
                    </p>
                    <p className="text-xs text-slate-400">
                      ✅ Sem espera por matchmaking automático • ✅ Você escolhe seu oponente • ✅ Batalhas instantâneas
                    </p>
                  </div>

                  {loadingJogadores ? (
                    <div className="text-center py-12 text-cyan-400 animate-pulse">
                      Carregando jogadores...
                    </div>
                  ) : jogadoresDisponiveis.length === 0 ? (
                    <div className="text-center py-12 bg-slate-900/50 rounded-lg border border-slate-800">
                      <div className="text-4xl mb-4">😔</div>
                      <p className="text-slate-400">Nenhum jogador online no momento</p>
                      <p className="text-xs text-slate-500 mt-2">A lista atualiza automaticamente a cada 5 segundos</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {jogadoresDisponiveis.map((jogador) => (
                        <div
                          key={jogador.userId}
                          className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 hover:border-cyan-500/50 transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <AvatarSVG avatar={jogador.avatar} tamanho={80} />

                            <div className="flex-1">
                              <h4 className="font-bold text-white text-lg">{jogador.avatar?.nome || 'Jogador'}</h4>
                              <div className="flex items-center gap-3 text-sm text-slate-400">
                                <span>Nv. {jogador.nivel}</span>
                                <span>•</span>
                                <span>{jogador.avatar?.elemento}</span>
                                <span>•</span>
                                <span className="text-yellow-400">{jogador.fama} Fama</span>
                              </div>
                              <div className="mt-1 text-xs text-slate-500">
                                Poder Total: {jogador.poderTotal}
                              </div>
                            </div>

                            <button
                              onClick={() => desafiarJogador(jogador)}
                              disabled={!avatarAtivo.vivo || avatarAtivo.exaustao >= 80}
                              className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              ⚔️ Desafiar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Conteúdo da Aba de Desafios */}
              {abaAtiva === 'desafios' && (
                <div className="space-y-6">
                  {/* Desafios Recebidos */}
                  <div>
                    <h3 className="text-xl font-bold text-orange-400 mb-4">📥 Desafios Recebidos</h3>

                    {desafiosRecebidos.length === 0 ? (
                      <div className="text-center py-8 bg-slate-900/50 rounded-lg border border-slate-800">
                        <p className="text-slate-400">Nenhum desafio recebido</p>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {desafiosRecebidos.map((desafio) => (
                          <div
                            key={desafio.id}
                            className="bg-gradient-to-r from-orange-900/30 to-red-900/30 border-2 border-orange-500/50 rounded-lg p-4"
                          >
                            <div className="flex items-center gap-4">
                              <AvatarSVG avatar={desafio.challengerAvatar} tamanho={80} />

                              <div className="flex-1">
                                <h4 className="font-bold text-white text-lg">
                                  {desafio.challengerAvatar?.nome || 'Jogador'} te desafiou!
                                </h4>
                                <div className="flex items-center gap-3 text-sm text-slate-400">
                                  <span>Nv. {desafio.challengerNivel}</span>
                                  <span>•</span>
                                  <span>{desafio.challengerAvatar?.elemento}</span>
                                  <span>•</span>
                                  <span className="text-yellow-400">{desafio.challengerFama} Fama</span>
                                </div>
                                <div className="mt-1 text-xs text-orange-400">
                                  ⏱️ Expira em {Math.floor(desafio.timeRemaining / 60)}:{(desafio.timeRemaining % 60).toString().padStart(2, '0')}
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <button
                                  onClick={() => aceitarDesafio(desafio)}
                                  className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded transition-all"
                                >
                                  ✅ Aceitar
                                </button>
                                <button
                                  onClick={() => rejeitarDesafio(desafio)}
                                  className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded transition-all"
                                >
                                  ❌ Rejeitar
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Desafios Enviados */}
                  <div>
                    <h3 className="text-xl font-bold text-cyan-400 mb-4">📤 Desafios Enviados</h3>

                    {desafiosEnviados.length === 0 ? (
                      <div className="text-center py-8 bg-slate-900/50 rounded-lg border border-slate-800">
                        <p className="text-slate-400">Nenhum desafio enviado</p>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {desafiosEnviados.map((desafio) => (
                          <div
                            key={desafio.id}
                            className="bg-slate-900/50 border border-slate-700 rounded-lg p-4"
                          >
                            <div className="flex items-center gap-4">
                              <AvatarSVG avatar={desafio.challengedAvatar} tamanho={60} />

                              <div className="flex-1">
                                <h4 className="font-bold text-white">
                                  Aguardando {desafio.challengedAvatar?.nome || 'Jogador'}...
                                </h4>
                                <div className="text-sm text-slate-400">
                                  Desafio enviado • Expira em {Math.floor(desafio.timeRemaining / 60)}:{(desafio.timeRemaining % 60).toString().padStart(2, '0')}
                                </div>
                              </div>

                              <div className="text-yellow-400 animate-pulse">⏳ Aguardando</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
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
