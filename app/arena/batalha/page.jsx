"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { inicializarBatalhaD20, processarTurnoD20, calcularHP, calcularDefesa } from "@/lib/combat/d20CombatSystem";
import { calcularRecompensasTreino } from "@/lib/arena/recompensasCalc";
import { calcularRecompensasPvP, calcularPontosVitoria, calcularPerda } from "@/lib/pvp/rankingSystem";
import { BattleSyncManager, enviarAcaoPvP, buscarEstadoSala, marcarComoPronto, notificarDesconexao } from "@/lib/pvp/battleSync";
import AvatarSVG from "@/app/components/AvatarSVG";

// CSS personalizado para animações
const styles = `
  @keyframes bounce-up {
    0% {
      transform: translateY(0) translateX(-50%);
      opacity: 1;
    }
    50% {
      transform: translateY(-40px) translateX(-50%);
      opacity: 1;
    }
    100% {
      transform: translateY(-80px) translateX(-50%);
      opacity: 0;
    }
  }

  .animate-bounce-up {
    animation: bounce-up 1.5s ease-out forwards;
  }
`;

function BatalhaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modoPvP = searchParams.get('modo') === 'pvp';

  const [estado, setEstado] = useState(null);
  const [log, setLog] = useState([]);
  const [turnoIA, setTurnoIA] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [processando, setProcessando] = useState(false);

  // Sistema de Timer
  const [tempoRestante, setTempoRestante] = useState(30); // 30 segundos por turno
  const [timerAtivo, setTimerAtivo] = useState(false);

  // Animações visuais
  const [animacaoDano, setAnimacaoDano] = useState(null); // { tipo: 'jogador'|'inimigo', valor: number, critico: bool }
  const [animacaoAcao, setAnimacaoAcao] = useState(null); // { tipo: 'ataque'|'defesa'|'habilidade', alvo: string }

  // Dados PvP
  const [dadosPvP, setDadosPvP] = useState(null);

  // Estados PvP Ao Vivo
  const [pvpAoVivo, setPvpAoVivo] = useState(false);
  const [matchId, setMatchId] = useState(null);
  const [playerNumber, setPlayerNumber] = useState(null); // 1 ou 2
  const [isYourTurn, setIsYourTurn] = useState(false);
  const [syncManager, setSyncManager] = useState(null);
  const [aguardandoOponente, setAguardandoOponente] = useState(false);
  const [oponenteDesconectou, setOponenteDesconectou] = useState(false);

  useEffect(() => {
    // Carregar estado da batalha
    let batalhaJSON;

    if (modoPvP) {
      // Modo PvP - carregar de sessionStorage
      batalhaJSON = sessionStorage.getItem('batalha_pvp_dados');
      if (batalhaJSON) {
        const dados = JSON.parse(batalhaJSON);
        setDadosPvP(dados);

        // Detectar PvP ao vivo
        const isPvpRealTime = dados.pvpAoVivo === true;
        setPvpAoVivo(isPvpRealTime);

        if (isPvpRealTime && dados.matchId) {
          setMatchId(dados.matchId);
        }

        // Construir estado de batalha a partir dos dados PvP usando D20
        const hpJogador = calcularHP(dados.avatarJogador);
        const hpInimigo = calcularHP(dados.avatarOponente);

        const batalha = inicializarBatalhaD20(
          {
            ...dados.avatarJogador,
            habilidades: Array.isArray(dados.avatarJogador.habilidades) ? dados.avatarJogador.habilidades : [],
          },
          {
            ...dados.avatarOponente,
            nome: dados.nomeOponente || dados.avatarOponente.nome,
            habilidades: Array.isArray(dados.avatarOponente.habilidades) ? dados.avatarOponente.habilidades : [],
          },
          'normal' // PvP usa dificuldade normal
        );

        setEstado(batalha);

        adicionarLog('⚔️ BATALHA PvP INICIADA!');
        adicionarLog(`Você: ${batalha.jogador.nome} (${batalha.jogador.elemento})`);
        adicionarLog(`VS`);
        adicionarLog(`${dados.nomeOponente}: ${batalha.inimigo.nome} (${batalha.inimigo.elemento})`);
        if (dados.tierJogador) {
          adicionarLog(`Tier: ${dados.tierJogador.nome} ${dados.tierJogador.icone}`);
        }
        adicionarLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        // Inicializar PvP ao vivo se aplicável
        if (isPvpRealTime && dados.matchId) {
          inicializarPvPAoVivo(dados);
        }
      }
    } else {
      // Modo Treino - carregar de localStorage
      batalhaJSON = localStorage.getItem('batalha_atual');
      if (batalhaJSON) {
        const batalha = JSON.parse(batalhaJSON);
        setEstado(batalha);

        adicionarLog('🎮 Batalha iniciada!');
        adicionarLog(`Você: ${batalha.jogador.nome} (${batalha.jogador.elemento})`);
        adicionarLog(`VS`);
        adicionarLog(`Oponente: ${batalha.inimigo.nome} (${batalha.inimigo.elemento})`);
        adicionarLog(`Dificuldade: ${batalha.dificuldade.toUpperCase()}`);
        adicionarLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      }
    }

    if (!batalhaJSON) {
      router.push('/arena');
      return;
    }

    // Iniciar timer no primeiro turno
    setTimerAtivo(true);
    setTempoRestante(30);
  }, [router, modoPvP]);

  // Timer para turnos (especialmente útil para PvP)
  useEffect(() => {
    if (!timerAtivo || turnoIA || processando || resultado) {
      return;
    }

    // PvP ao vivo - só contar tempo se for seu turno
    if (pvpAoVivo && !isYourTurn) {
      return;
    }

    const interval = setInterval(() => {
      setTempoRestante((prev) => {
        if (prev <= 1) {
          // Tempo esgotado - executar ação automática (defender)
          adicionarLog('⏱️ Tempo esgotado! Defendendo automaticamente...');
          executarAcao('defender');
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerAtivo, turnoIA, processando, resultado, pvpAoVivo, isYourTurn]);

  // Cleanup PvP ao sair
  useEffect(() => {
    return () => {
      // Cleanup ao sair
      if (syncManager) {
        syncManager.cleanup();
      }

      // Notificar desconexão se PvP ao vivo
      if (pvpAoVivo && matchId && !resultado) {
        const userData = JSON.parse(localStorage.getItem('user'));
        if (userData) {
          notificarDesconexao(matchId, userData.id);
        }
      }
    };
  }, [syncManager, pvpAoVivo, matchId, resultado]);

  const adicionarLog = (mensagem) => {
    setLog(prev => [...prev, { texto: mensagem, timestamp: Date.now() }]);
  };

  // === FUNÇÕES PvP AO VIVO ===
  const inicializarPvPAoVivo = async (dados) => {
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      if (!userData) return;

      // Buscar estado da sala
      const roomState = await buscarEstadoSala(dados.matchId, userData.id);

      if (!roomState.success) {
        console.error('Erro ao buscar sala:', roomState);
        return;
      }

      // Configurar player number
      setPlayerNumber(roomState.playerNumber);
      setIsYourTurn(roomState.isYourTurn);

      // Marcar como pronto
      await marcarComoPronto(dados.matchId, userData.id);
      adicionarLog(`✅ Conectado à sala de batalha!`);
      adicionarLog(`🎮 Você é o Player ${roomState.playerNumber}`);

      // Iniciar sincronização
      const sync = new BattleSyncManager(
        dados.matchId,
        userData.id,
        handleRoomStateUpdate,
        handleOpponentAction
      );

      sync.startPolling(2000); // Poll a cada 2 segundos
      setSyncManager(sync);

      adicionarLog(`⏳ Aguardando ambos jogadores estarem prontos...`);

    } catch (error) {
      console.error('Erro ao inicializar PvP ao vivo:', error);
      adicionarLog('❌ Erro ao conectar à sala. Retornando ao lobby...');
      setTimeout(() => router.push('/arena/pvp'), 3000);
    }
  };

  const handleRoomStateUpdate = (roomState) => {
    // Verificar se batalha começou
    if (roomState.room.status === 'active' && !estado) {
      adicionarLog(`🎮 Ambos prontos! Batalha iniciada!`);
    }

    // Verificar se oponente desconectou
    const opponent = roomState.playerNumber === 1 ? roomState.player2 : roomState.player1;

    if (!opponent.connected) {
      setOponenteDesconectou(true);
      adicionarLog(`🚪 ${opponent.nome} desconectou!`);
      adicionarLog(`🏆 Você venceu por W.O.!`);

      setTimeout(() => {
        if (estado) {
          finalizarBatalha(estado, 'jogador');
        }
      }, 2000);
    }

    // Atualizar turno
    setIsYourTurn(roomState.isYourTurn);
    setAguardandoOponente(!roomState.isYourTurn && roomState.room.status === 'active');
  };

  const handleOpponentAction = (actionData) => {
    const action = actionData.action;

    adicionarLog(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    adicionarLog(`🔴 Oponente usou ${action.tipo}!`);

    if (action.dano > 0) {
      adicionarLog(`💥 Você recebeu ${action.dano} de dano`);

      // Animação de dano
      setAnimacaoDano({
        tipo: 'jogador',
        valor: action.dano,
        critico: action.critico || false
      });
      setTimeout(() => setAnimacaoDano(null), 1500);
    }

    if (action.cura > 0) {
      adicionarLog(`💚 Oponente se curou em ${action.cura} HP`);
    }

    // Atualizar estado local com dados do servidor
    setEstado(prev => {
      if (!prev) return prev;

      return {
        ...prev,
        jogador: {
          ...prev.jogador,
          hp_atual: action.hp_inimigo_atual // Do POV do oponente, você é o inimigo
        },
        inimigo: {
          ...prev.inimigo,
          hp_atual: action.hp_jogador_atual
        }
      };
    });

    // Agora é SEU turno
    setIsYourTurn(true);
    setAguardandoOponente(false);

    // Verificar vitória
    if (action.resultado === 'vitoria') {
      adicionarLog(`☠️ Você foi derrotado!`);
      setTimeout(() => {
        if (estado) {
          finalizarBatalha(estado, 'inimigo');
        }
      }, 1000);
    }
  };

  const executarAcao = async (tipo, habilidadeIndex = null) => {
    if (!estado) return;

    // NOVO: Verificações PvP ao vivo
    if (pvpAoVivo) {
      if (!isYourTurn) {
        adicionarLog('⚠️ Aguarde seu turno!');
        return;
      }
      if (aguardandoOponente) {
        adicionarLog('⏳ Aguardando oponente...');
        return;
      }
    } else {
      // Modo treino - verificações antigas
      if (turnoIA || processando) return;
    }

    setProcessando(true);
    setTempoRestante(30); // Reset timer

    // Animação da ação
    setAnimacaoAcao({ tipo, alvo: tipo === 'defender' || tipo === 'esquivar' ? 'jogador' : 'inimigo' });
    setTimeout(() => setAnimacaoAcao(null), 800);

    try {
      // === PROCESSAR TURNO D20 ===
      const resultado = processarTurnoD20(estado, tipo);

      // Exibir logs detalhados do D20
      resultado.logs.forEach(logMsg => {
        adicionarLog(logMsg);
      });

      // Animação de dano no inimigo (ataque do jogador)
      if (resultado.ataqueJogador && resultado.ataqueJogador.acertou && resultado.ataqueJogador.danoFinal > 0) {
        setAnimacaoDano({
          tipo: 'inimigo',
          valor: resultado.ataqueJogador.danoFinal,
          critico: resultado.ataqueJogador.critico || false
        });
        setTimeout(() => setAnimacaoDano(null), 1500);
      }

      // === MODO PVP AO VIVO ===
      if (pvpAoVivo && matchId) {
        const userData = JSON.parse(localStorage.getItem('user'));

        // Enviar ação para servidor
        await enviarAcaoPvP(matchId, userData.id, {
          tipo,
          dano: resultado.ataqueJogador?.danoFinal || 0,
          cura: 0,
          critico: resultado.ataqueJogador?.critico || false,
          energiaGasta: 0,
          hp_jogador_atual: resultado.novoEstado.jogador.hp_atual,
          hp_inimigo_atual: resultado.novoEstado.inimigo.hp_atual,
          resultado: resultado.fimBatalha ? (resultado.vencedor === 'jogador' ? 'vitoria' : 'derrota') : null
        });

        // Atualizar estado local
        setEstado(resultado.novoEstado);
        setIsYourTurn(false); // Agora é turno do oponente
        setAguardandoOponente(true);
        adicionarLog('⏳ Aguardando oponente...');

        if (resultado.fimBatalha) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          finalizarBatalha(resultado.novoEstado, resultado.vencedor);
        }

        setProcessando(false);
        return;
      }

      // === MODO TREINO (IA LOCAL) ===

      // Aguardar um pouco para mostrar os logs
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Animação de dano no jogador (ataque do inimigo)
      if (resultado.ataqueInimigo && resultado.ataqueInimigo.acertou && resultado.ataqueInimigo.danoFinal > 0) {
        setTurnoIA(true);
        setAnimacaoDano({
          tipo: 'jogador',
          valor: resultado.ataqueInimigo.danoFinal,
          critico: resultado.ataqueInimigo.critico || false
        });
        setTimeout(() => setAnimacaoDano(null), 1500);
        await new Promise(resolve => setTimeout(resolve, 1500));
        setTurnoIA(false);
      }

      // Verificar fim da batalha
      if (resultado.fimBatalha) {
        finalizarBatalha(resultado.novoEstado, resultado.vencedor);
        setProcessando(false);
        return;
      }

      // Atualizar estado
      setEstado(resultado.novoEstado);

    } catch (error) {
      console.error('Erro ao executar ação:', error);
      adicionarLog('❌ Erro ao processar ação!');
    } finally {
      setProcessando(false);
    }
  };

  const finalizarBatalha = (estadoFinal, vencedor) => {
    setTurnoIA(false);

    adicionarLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (vencedor === 'jogador') {
      adicionarLog('🎉 VITÓRIA!');
    } else if (vencedor === 'inimigo') {
      adicionarLog('☠️ DERROTA!');
    } else {
      adicionarLog('⚖️ EMPATE!');
    }

    let recompensas;

    if (modoPvP && dadosPvP) {
      // Calcular recompensas PvP com o novo sistema de Fama
      const venceu = vencedor === 'jogador';
      recompensas = calcularRecompensasPvP(
        venceu,
        dadosPvP.famaJogador,
        dadosPvP.famaOponente,
        dadosPvP.tierJogador,
        dadosPvP.streakJogador || 0,
        estadoFinal.rodada
      );

      // Log de ganho/perda de fama
      if (venceu) {
        adicionarLog(`🏆 +${recompensas.fama} Fama!`);
      } else {
        adicionarLog(`📉 ${recompensas.fama} Fama`); // Já vem negativo
      }

      // Exibir mensagens especiais (upset, streak, etc.)
      if (recompensas.mensagens && recompensas.mensagens.length > 0) {
        recompensas.mensagens.forEach(msg => adicionarLog(msg));
      }
    } else {
      // Calcular recompensas de treino
      recompensas = calcularRecompensasTreino(estadoFinal, vencedor);
    }

    setResultado({
      vencedor,
      recompensas,
      estado: estadoFinal,
      pvp: modoPvP
    });
  };

  const voltarAoLobby = async () => {
    const userData = JSON.parse(localStorage.getItem('user'));

    if (resultado) {
      try {
        if (modoPvP) {
          // Modo PvP - salvar resultado no banco via API
          const venceuBatalha = resultado.vencedor === 'jogador';
          const jogador1Id = userData.id;
          const jogador2Id = 'oponente_simulado'; // TODO: usar ID real do oponente quando tiver matchmaking real

          // Obter fama atual do jogador
          const rankingKey = `pvp_ranking_${userData.id}`;
          const rankingData = JSON.parse(localStorage.getItem(rankingKey) || '{"fama": 1000, "vitorias": 0, "derrotas": 0, "streak": 0}');
          const famaAntes = rankingData.fama || 1000;

          try {
            // Salvar resultado da batalha no banco (atualiza rankings automaticamente)
            const responseBatalha = await fetch('/api/pvp/batalha', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jogador1Id: jogador1Id,
                jogador2Id: jogador2Id,
                vencedorId: venceuBatalha ? jogador1Id : jogador2Id,
                jogador1FamaAntes: famaAntes,
                jogador2FamaAntes: dadosPvP.famaOponente || 1000,
                jogador1FamaGanho: venceuBatalha ? resultado.recompensas.fama : resultado.recompensas.fama, // Já vem negativo na derrota
                jogador2FamaGanho: venceuBatalha ? -resultado.recompensas.fama : Math.abs(resultado.recompensas.fama),
                duracaoRodadas: resultado.estado.rodada,
                jogador1Recompensas: {
                  xp: resultado.recompensas.xp,
                  moedas: resultado.recompensas.moedas,
                  fragmentos: resultado.recompensas.fragmentos || 0,
                  vinculo: resultado.recompensas.vinculo || 0,
                  exaustao: resultado.recompensas.exaustao
                },
                jogador2Recompensas: {},
                salvarLog: true
              })
            });

            if (responseBatalha.ok) {
              const dataBatalha = await responseBatalha.json();
              // Atualizar localStorage com dados do banco
              if (dataBatalha.success && dataBatalha.jogador1) {
                localStorage.setItem(rankingKey, JSON.stringify(dataBatalha.jogador1));
              }
            } else {
              console.warn('Erro ao salvar resultado no banco, salvando localmente');
              // Fallback para localStorage se API falhar
              const novaFama = Math.max(0, famaAntes + resultado.recompensas.fama);
              rankingData.fama = novaFama;
              rankingData.vitorias = venceuBatalha ? (rankingData.vitorias || 0) + 1 : rankingData.vitorias;
              rankingData.derrotas = !venceuBatalha ? (rankingData.derrotas || 0) + 1 : rankingData.derrotas;
              rankingData.streak = venceuBatalha ? (rankingData.streak || 0) + 1 : 0;
              localStorage.setItem(rankingKey, JSON.stringify(rankingData));
            }
          } catch (error) {
            console.error('Erro ao salvar batalha PvP:', error);
            // Fallback para localStorage
            const novaFama = Math.max(0, famaAntes + resultado.recompensas.fama);
            rankingData.fama = novaFama;
            rankingData.vitorias = venceuBatalha ? (rankingData.vitorias || 0) + 1 : rankingData.vitorias;
            rankingData.derrotas = !venceuBatalha ? (rankingData.derrotas || 0) + 1 : rankingData.derrotas;
            rankingData.streak = venceuBatalha ? (rankingData.streak || 0) + 1 : 0;
            localStorage.setItem(rankingKey, JSON.stringify(rankingData));
          }

          // Aplicar recompensas de moedas e fragmentos
          await fetch('/api/atualizar-stats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: userData.id,
              moedas: resultado.recompensas.moedas,
              fragmentos: resultado.recompensas.fragmentos || 0
            })
          });

          // Aplicar recompensas de avatar (XP, exaustão, vínculo)
          await fetch('/api/atualizar-avatar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              avatarId: estado.jogador.id,
              experiencia: resultado.recompensas.xp,
              exaustao: resultado.recompensas.exaustao,
              vinculo: resultado.recompensas.vinculo || 0
            })
          });

          sessionStorage.removeItem('batalha_pvp_dados');
          router.push('/arena/pvp');
        } else {
          // Modo Treino (vitória ou derrota)
          await fetch('/api/atualizar-avatar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              avatarId: estado.jogador.id,
              experiencia: resultado.recompensas.xp,
              exaustao: resultado.recompensas.exaustao,
              vinculo: resultado.recompensas.vinculo || 0
            })
          });

          localStorage.removeItem('batalha_atual');
          router.push('/arena/treinamento');
        }
      } catch (error) {
        console.error('Erro ao aplicar recompensas:', error);
        if (modoPvP) {
          sessionStorage.removeItem('batalha_pvp_dados');
          router.push('/arena/pvp');
        } else {
          localStorage.removeItem('batalha_atual');
          router.push('/arena/treinamento');
        }
      }
    }
  };

  if (!estado) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 flex items-center justify-center">
        <div className="text-red-400 font-mono animate-pulse">Carregando batalha...</div>
      </div>
    );
  }

  const hpJogadorPercent = (estado.jogador.hp_atual / estado.jogador.hp_maximo) * 100;
  const hpInimigoPercent = (estado.inimigo.hp_atual / estado.inimigo.hp_maximo) * 100;
  const energiaJogadorPercent = (estado.jogador.energia_atual / 100) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 text-gray-100">
      {/* CSS personalizado */}
      <style jsx>{styles}</style>

      {/* Modal de Resultado */}
      {resultado && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-slate-900 rounded-lg border-2 border-cyan-500 p-8">
            <div className="text-center mb-6">
              {resultado.vencedor === 'jogador' && (
                <>
                  <div className="text-6xl mb-4">🎉</div>
                  <h2 className="text-4xl font-black text-green-400 mb-2">VITÓRIA!</h2>
                </>
              )}
              
              {resultado.vencedor === 'inimigo' && (
                <>
                  <div className="text-6xl mb-4">☠️</div>
                  <h2 className="text-4xl font-black text-red-400 mb-2">DERROTA</h2>
                </>
              )}
              
              {resultado.vencedor === 'empate' && (
                <>
                  <div className="text-6xl mb-4">⚖️</div>
                  <h2 className="text-4xl font-black text-yellow-400 mb-2">EMPATE</h2>
                </>
              )}
            </div>

            <div className="bg-slate-800 rounded-lg p-6 mb-6">
              <h3 className="text-cyan-400 font-bold mb-4 text-center">🎁 RECOMPENSAS</h3>

              {/* Modo PvP ou Sobrevivência: Mostrar XP + Moedas */}
              {resultado.pvp || resultado.modo === 'sobrevivencia' ? (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-4 bg-slate-900 rounded">
                    <div className="text-3xl font-bold text-blue-400">{resultado.recompensas.xp}</div>
                    <div className="text-xs text-slate-400">XP Ganho</div>
                  </div>
                  <div className="text-center p-4 bg-slate-900 rounded">
                    <div className="text-3xl font-bold text-yellow-400">{resultado.recompensas.moedas}</div>
                    <div className="text-xs text-slate-400">Moedas</div>
                  </div>
                </div>
              ) : (
                /* Modo Treino: Mostrar apenas XP (centralizado) */
                <div className="mb-4">
                  <div className="text-center p-4 bg-slate-900 rounded">
                    <div className="text-3xl font-bold text-blue-400">{resultado.recompensas.xp}</div>
                    <div className="text-xs text-slate-400">XP Ganho</div>
                  </div>
                </div>
              )}

              {resultado.recompensas.fragmentos > 0 && (
                <div className="text-center p-3 bg-purple-900/30 rounded border border-purple-500/50 mb-4">
                  <span className="text-purple-400 font-bold">
                    💎 +{resultado.recompensas.fragmentos} Fragmento(s)!
                  </span>
                </div>
              )}

              {/* Fama (PvP) */}
              {resultado.pvp && resultado.recompensas.fama !== undefined && (
                <div className={`text-center p-4 rounded border mb-4 ${
                  resultado.recompensas.fama > 0
                    ? 'bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border-yellow-500/50'
                    : 'bg-gradient-to-r from-red-900/30 to-orange-900/30 border-red-500/50'
                }`}>
                  <div className="text-4xl mb-2">
                    {resultado.recompensas.fama > 0 ? '🏆' : '📉'}
                  </div>
                  <div className={`text-3xl font-black ${
                    resultado.recompensas.fama > 0 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {resultado.recompensas.fama > 0 ? '+' : ''}{resultado.recompensas.fama}
                  </div>
                  <div className="text-sm text-slate-400">Fama</div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 mb-4">
                {!resultado.pvp && resultado.recompensas.exaustao && (
                  <div className="text-center p-3 bg-orange-900/30 rounded border border-orange-500/50">
                    <span className="text-orange-400 text-sm">
                      😰 +{resultado.recompensas.exaustao} Exaustão
                    </span>
                  </div>
                )}
                {resultado.pvp && resultado.recompensas.exaustao && (
                  <div className="text-center p-3 bg-orange-900/30 rounded border border-orange-500/50">
                    <span className="text-orange-400 text-sm">
                      😰 +{resultado.recompensas.exaustao} Exaustão
                    </span>
                  </div>
                )}
                {resultado.recompensas.vinculo !== undefined && (
                  <div className={`text-center p-3 rounded border ${
                    resultado.recompensas.vinculo > 0
                      ? 'bg-green-900/30 border-green-500/50'
                      : 'bg-red-900/30 border-red-500/50'
                  }`}>
                    <span className={`text-sm font-bold ${
                      resultado.recompensas.vinculo > 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {resultado.recompensas.vinculo > 0 ? '💚' : '💔'} {resultado.recompensas.vinculo > 0 ? '+' : ''}{resultado.recompensas.vinculo} Vínculo
                    </span>
                  </div>
                )}
              </div>

              {resultado.recompensas.mensagens && resultado.recompensas.mensagens.length > 0 && (
                <div className="mt-4 space-y-2">
                  {resultado.recompensas.mensagens.map((msg, i) => (
                    <div key={i} className="text-sm text-cyan-300 text-center">
                      {msg}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={voltarAoLobby}
              className="w-full px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition-colors"
            >
              {resultado.pvp ? '← Voltar ao PvP' : '← Voltar ao Treinamento'}
            </button>
          </div>
        </div>
      )}

      {/* Interface de Batalha */}
      <div className="container mx-auto px-3 py-2 max-w-7xl">
        {/* Header Compacto */}
        <div className="flex justify-between items-center mb-2 bg-slate-900/50 rounded px-3 py-1.5 border border-slate-700/50">
          <div className="text-xs text-slate-400 font-mono">
            ⏰ R{estado.rodada} | 🎯 {estado.dificuldade}
          </div>
          <div className="text-xs font-bold">
            {pvpAoVivo ? (
              isYourTurn ? (
                <span className="text-green-400 animate-pulse">🟢 SEU TURNO</span>
              ) : (
                <span className="text-orange-400">🟠 Aguardando Oponente...</span>
              )
            ) : (
              turnoIA ? '🤖 Oponente' : '🎮 Seu Turno'
            )}
          </div>

          {/* Timer Compacto Inline */}
          {!turnoIA && !resultado && (
            <div className="flex items-center gap-2">
              <span className={`text-lg ${tempoRestante <= 5 ? 'animate-bounce' : ''}`}>
                {tempoRestante <= 10 ? '⏰' : '⏱️'}
              </span>
              <div className="w-20 bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-600">
                <div
                  className={`h-2 transition-all duration-1000 ${
                    tempoRestante <= 5 ? 'bg-red-500' :
                    tempoRestante <= 10 ? 'bg-orange-500' :
                    'bg-cyan-500'
                  }`}
                  style={{ width: `${(tempoRestante / 30) * 100}%` }}
                ></div>
              </div>
              <span className={`text-xs font-mono font-bold min-w-[24px] ${
                tempoRestante <= 5 ? 'text-red-400 animate-pulse' :
                tempoRestante <= 10 ? 'text-orange-400' :
                'text-cyan-400'
              }`}>
                {tempoRestante}s
              </span>
            </div>
          )}
        </div>

        {/* Banner de Última Ação - Compacto */}
        {log.length > 0 && (() => {
          const ultimaAcao = log[log.length - 1].texto;

          const isVitoria = ultimaAcao.includes('VITÓRIA') || ultimaAcao.includes('🎉');
          const isDerrota = ultimaAcao.includes('DERROTA') || ultimaAcao.includes('☠️');
          const isDano = ultimaAcao.includes('causou') || ultimaAcao.includes('dano') || ultimaAcao.includes('💥');
          const isCura = ultimaAcao.includes('recuperou') || ultimaAcao.includes('HP') || ultimaAcao.includes('💚');
          const isDefesa = ultimaAcao.includes('defendeu') || ultimaAcao.includes('🛡️');
          const isCritico = ultimaAcao.includes('CRÍTICO') || ultimaAcao.includes('💀');

          let corBorda = 'border-cyan-500/50';
          let icone = '⚡';

          if (isVitoria) { corBorda = 'border-green-500/50'; icone = '🎉'; }
          else if (isDerrota) { corBorda = 'border-red-500/50'; icone = '☠️'; }
          else if (isCritico) { corBorda = 'border-purple-500/50'; icone = '💀'; }
          else if (isDano) { corBorda = 'border-orange-500/50'; icone = '💥'; }
          else if (isCura) { corBorda = 'border-green-500/50'; icone = '💚'; }
          else if (isDefesa) { corBorda = 'border-blue-500/50'; icone = '🛡️'; }

          return (
            <div className={`mb-2 bg-slate-900/80 rounded px-3 py-2 border ${corBorda} flex items-center gap-2`}>
              <span className="text-sm">{icone}</span>
              <div className="text-xs font-mono text-slate-200 truncate flex-1">
                {ultimaAcao}
              </div>
            </div>
          );
        })()}

        <div className="grid lg:grid-cols-3 gap-2">
          {/* Arena de Combate */}
          <div className="lg:col-span-2 space-y-2">
            {/* Inimigo */}
            <div className="bg-gradient-to-br from-slate-900/90 via-red-950/30 to-slate-900/90 rounded-lg p-4 border-2 border-red-500/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-bold text-red-400">{estado.inimigo.nome}</h3>
                    <span className="px-2 py-0.5 bg-red-900/50 border border-red-500/50 rounded text-xs text-red-300">
                      Lv.{estado.inimigo.nivel}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 bg-slate-800/50 rounded text-slate-400">
                      {estado.inimigo.elemento}
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400">{estado.inimigo.raridade}</span>
                  </div>

                  {/* Debuffs do Inimigo */}
                  {estado.inimigo.debuffs && estado.inimigo.debuffs.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {estado.inimigo.debuffs.map((debuff, idx) => (
                        <span key={idx} className="text-base" title={`${debuff.nome} (${debuff.turnos} turnos)`}>
                          {debuff.icone}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="w-28 h-28 flex-shrink-0 relative">
                  <AvatarSVG avatar={estado.inimigo} tamanho={112} isEnemy={true} />

                  {/* Animação de dano no inimigo */}
                  {animacaoDano && animacaoDano.tipo === 'inimigo' && (
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 animate-bounce-up pointer-events-none">
                      <div className={`text-2xl font-black ${
                        animacaoDano.critico ? 'text-purple-400' : 'text-red-400'
                      } drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]`}>
                        {animacaoDano.critico && '💀 '}
                        -{animacaoDano.valor}
                        {animacaoDano.critico && ' !'}
                      </div>
                    </div>
                  )}

                  {/* Indicador de ação no inimigo */}
                  {animacaoAcao && animacaoAcao.alvo === 'inimigo' && (
                    <div className="absolute inset-0 border-2 border-red-500 rounded-full animate-ping"></div>
                  )}
                </div>
              </div>

              {/* HP do Inimigo */}
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400 font-semibold">HP</span>
                  <span className="text-red-400 font-mono font-bold text-xs">{estado.inimigo.hp_atual} / {estado.inimigo.hp_maximo}</span>
                </div>
                <div className="relative w-full bg-slate-800 rounded-full h-4 overflow-hidden border border-slate-700">
                  <div
                    className="bg-gradient-to-r from-red-600 via-red-500 to-red-600 h-4 transition-all duration-500 relative"
                    style={{width: `${hpInimigoPercent}%`}}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-white/10"></div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                    {Math.round(hpInimigoPercent)}%
                  </div>
                </div>
              </div>
            </div>

            {/* VS */}
            <div className="text-center py-1">
              <div className="inline-block bg-gradient-to-r from-red-900/50 via-orange-900/80 to-cyan-900/50 px-6 py-1.5 rounded-full border-2 border-orange-500 text-orange-400 font-black text-lg animate-pulse shadow-lg shadow-orange-500/30">
                ⚔️ VS ⚔️
              </div>
            </div>

            {/* Jogador */}
            <div className="bg-gradient-to-br from-slate-900/90 via-cyan-950/30 to-slate-900/90 rounded-lg p-4 border-2 border-cyan-500/50">
              <div className="flex items-center justify-between mb-2">
                <div className="w-28 h-28 flex-shrink-0 relative">
                  <AvatarSVG avatar={estado.jogador} tamanho={112} isEnemy={false} />

                  {/* Animação de dano no jogador */}
                  {animacaoDano && animacaoDano.tipo === 'jogador' && (
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 animate-bounce-up pointer-events-none">
                      <div className={`text-2xl font-black ${
                        animacaoDano.critico ? 'text-purple-400' : 'text-red-400'
                      } drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]`}>
                        {animacaoDano.critico && '💀 '}
                        -{animacaoDano.valor}
                        {animacaoDano.critico && ' !'}
                      </div>
                    </div>
                  )}

                  {/* Indicador de defesa */}
                  {animacaoAcao && animacaoAcao.tipo === 'defender' && (
                    <div className="absolute inset-0 border-2 border-blue-500 rounded-full animate-ping"></div>
                  )}
                </div>

                <div className="text-right flex-1 ml-3">
                  <div className="flex items-center justify-end gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-cyan-900/50 border border-cyan-500/50 rounded text-xs text-cyan-300">
                      Lv.{estado.jogador.nivel}
                    </span>
                    <h3 className="text-xl font-bold text-cyan-400">{estado.jogador.nome}</h3>
                  </div>
                  <div className="flex items-center justify-end gap-2 text-xs">
                    <span className="text-slate-400">{estado.jogador.raridade}</span>
                    <span className="text-slate-500">•</span>
                    <span className="px-2 py-0.5 bg-slate-800/50 rounded text-slate-400">
                      {estado.jogador.elemento}
                    </span>
                  </div>

                  {/* Buffs do Jogador */}
                  {estado.jogador.buffs && estado.jogador.buffs.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap justify-end">
                      {estado.jogador.buffs.map((buff, idx) => (
                        <span key={idx} className="text-base" title={`${buff.nome} (${buff.turnos} turnos)`}>
                          {buff.icone}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* HP do Jogador */}
              <div className="mb-2 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400 font-semibold">HP</span>
                  <span className="text-green-400 font-mono font-bold text-xs">{estado.jogador.hp_atual} / {estado.jogador.hp_maximo}</span>
                </div>
                <div className="relative w-full bg-slate-800 rounded-full h-4 overflow-hidden border border-slate-700">
                  <div
                    className="bg-gradient-to-r from-green-600 via-green-500 to-green-600 h-4 transition-all duration-500 relative"
                    style={{width: `${hpJogadorPercent}%`}}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-white/10"></div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                    {Math.round(hpJogadorPercent)}%
                  </div>
                </div>
              </div>

              {/* Energia do Jogador */}
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400 font-semibold">Energia</span>
                  <span className="text-blue-400 font-mono font-bold text-xs">{estado.jogador.energia_atual} / {estado.jogador.energia_maxima || 100}</span>
                </div>
                <div className="relative w-full bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-700">
                  <div
                    className="bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 h-3 transition-all duration-500 relative"
                    style={{width: `${energiaJogadorPercent}%`}}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-white/10"></div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                    {estado.jogador.energia_atual}
                  </div>
                </div>
              </div>

              {/* Indicador de Exaustão */}
              {estado.jogador.exaustao > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-700">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-400">Exaustão</span>
                    <span className={`font-bold ${
                      estado.jogador.exaustao >= 80 ? 'text-red-500' :
                      estado.jogador.exaustao >= 60 ? 'text-red-400' :
                      estado.jogador.exaustao >= 40 ? 'text-orange-400' :
                      estado.jogador.exaustao >= 20 ? 'text-yellow-400' :
                      'text-green-400'
                    }`}>
                      {estado.jogador.exaustao >= 80 ? '💀' :
                       estado.jogador.exaustao >= 60 ? '🔴' :
                       estado.jogador.exaustao >= 40 ? '🟠' :
                       estado.jogador.exaustao >= 20 ? '💛' :
                       '💚'} {estado.jogador.exaustao}/100
                    </span>
                  </div>
                  <div className="relative w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 transition-all duration-500 ${
                        estado.jogador.exaustao >= 80 ? 'bg-red-600' :
                        estado.jogador.exaustao >= 60 ? 'bg-red-500' :
                        estado.jogador.exaustao >= 40 ? 'bg-orange-500' :
                        estado.jogador.exaustao >= 20 ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{width: `${estado.jogador.exaustao}%`}}
                    ></div>
                  </div>
                  {estado.jogador.exaustao >= 60 && (
                    <div className="text-[10px] text-red-400 mt-1 flex items-center gap-1">
                      <span>⚠️</span>
                      <span>Stats reduzidos!</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

            {/* Ações D20 */}
            <div className="bg-slate-900/80 rounded-lg p-6 border-2 border-slate-700">
              <h3 className="text-cyan-400 font-bold mb-4">🎲 AÇÕES D20</h3>

              {/* Ataques */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  onClick={() => !turnoIA && !processando && executarAcao('ataque_fisico')}
                  disabled={turnoIA || processando}
                  className="p-4 rounded-lg border-2 transition-all text-left bg-gradient-to-r from-red-900/40 to-orange-900/40 border-red-500 hover:from-red-900/60 hover:to-orange-900/60 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
                >
                  <div className="font-bold text-red-300 text-lg mb-1">⚔️ Ataque Físico</div>
                  <div className="text-xs text-slate-300">1d20 + Força</div>
                  <div className="mt-2 text-xs text-orange-400">🎯 Força: {estado.jogador.forca}</div>
                </button>

                <button
                  onClick={() => !turnoIA && !processando && executarAcao('ataque_magico')}
                  disabled={turnoIA || processando}
                  className="p-4 rounded-lg border-2 transition-all text-left bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border-purple-500 hover:from-purple-900/60 hover:to-indigo-900/60 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
                >
                  <div className="font-bold text-purple-300 text-lg mb-1">✨ Ataque Mágico</div>
                  <div className="text-xs text-slate-300">1d20 + Foco</div>
                  <div className="mt-2 text-xs text-purple-400">🔮 Foco: {estado.jogador.foco}</div>
                </button>
              </div>

              {/* Ações Defensivas */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => !turnoIA && !processando && executarAcao('esquivar')}
                  disabled={turnoIA || processando}
                  className="p-4 rounded-lg border-2 transition-all text-left bg-gradient-to-r from-green-900/40 to-emerald-900/40 border-green-500 hover:from-green-900/60 hover:to-emerald-900/60 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
                >
                  <div className="font-bold text-green-300 text-lg mb-1">💨 Esquivar</div>
                  <div className="text-xs text-slate-300">Tenta evitar o ataque</div>
                  <div className="mt-2 text-xs text-green-400">🏃 Agilidade: {estado.jogador.agilidade}</div>
                </button>

                <button
                  onClick={() => !turnoIA && !processando && executarAcao('defender')}
                  disabled={turnoIA || processando}
                  className="p-4 rounded-lg border-2 transition-all text-left bg-gradient-to-r from-blue-900/40 to-cyan-900/40 border-blue-500 hover:from-blue-900/60 hover:to-cyan-900/60 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
                >
                  <div className="font-bold text-blue-300 text-lg mb-1">🛡️ Defender</div>
                  <div className="text-xs text-slate-300">Reduz dano recebido</div>
                  <div className="mt-2 text-xs text-blue-400">🛡️ Resistência: {estado.jogador.resistencia}</div>
                </button>
              </div>

              {/* Info D20 */}
              <div className="mt-4 pt-4 border-t border-slate-700 text-xs text-slate-500">
                <div className="flex justify-between">
                  <span>🎲 Crítico: nat 20 (2x dano)</span>
                  <span>🛡️ Defesa: {calcularDefesa(estado.jogador)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Log de Combate - Embaixo */}
        <div className="mt-2 bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90 rounded-lg border-2 border-slate-700/50 overflow-hidden">
          <div className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 px-4 py-2 border-b border-cyan-500/30">
            <h3 className="text-cyan-400 font-bold text-sm flex items-center gap-2">
              <span className="text-base">📜</span>
              LOG DE COMBATE
              <span className="text-xs text-slate-500 ml-auto">Última ação no topo</span>
            </h3>
          </div>

          <div className="max-h-48 overflow-y-auto p-4 space-y-2">
            {log.slice().reverse().map((entry, i) => {
              const texto = entry.texto;

              // Determinar cor baseada no conteúdo
              let bgColor = 'bg-slate-800/40';
              let textColor = 'text-slate-300';
              let borderColor = 'border-slate-700/50';
              let icon = '•';

              if (texto.includes('VITÓRIA') || texto.includes('🎉')) {
                bgColor = 'bg-green-900/30';
                textColor = 'text-green-300';
                borderColor = 'border-green-500/30';
                icon = '🎉';
              } else if (texto.includes('DERROTA') || texto.includes('☠️')) {
                bgColor = 'bg-red-900/30';
                textColor = 'text-red-300';
                borderColor = 'border-red-500/30';
                icon = '☠️';
              } else if (texto.includes('💥') || texto.includes('dano')) {
                bgColor = 'bg-orange-900/20';
                textColor = 'text-orange-200';
                borderColor = 'border-orange-500/20';
                icon = '💥';
              } else if (texto.includes('🛡️') || texto.includes('Defesa')) {
                bgColor = 'bg-blue-900/20';
                textColor = 'text-blue-200';
                borderColor = 'border-blue-500/20';
                icon = '🛡️';
              } else if (texto.includes('⚡') || texto.includes('energia')) {
                bgColor = 'bg-yellow-900/20';
                textColor = 'text-yellow-200';
                borderColor = 'border-yellow-500/20';
                icon = '⚡';
              } else if (texto.includes('🎯')) {
                bgColor = 'bg-purple-900/20';
                textColor = 'text-purple-200';
              } else if (texto.includes('🎲') || texto.includes('1d20')) {
                bgColor = 'bg-indigo-900/20';
                textColor = 'text-indigo-200';
                borderColor = 'border-indigo-500/20';
                icon = '🎲';
              } else if (texto.includes('CRÍTICO') || texto.includes('nat 20')) {
                bgColor = 'bg-amber-900/30';
                textColor = 'text-amber-200';
                borderColor = 'border-amber-500/30';
                icon = '💀';
              } else if (texto.includes('ESQUIVOU') || texto.includes('esquiva')) {
                bgColor = 'bg-emerald-900/20';
                textColor = 'text-emerald-200';
                borderColor = 'border-emerald-500/20';
                icon = '💨';
              } else if (texto.includes('Rodada')) {
                bgColor = 'bg-cyan-900/20';
                textColor = 'text-cyan-200';
                borderColor = 'border-cyan-500/20';
                icon = '⏰';
              } else if (texto.includes('━━━')) {
                bgColor = 'bg-slate-700/30';
                borderColor = 'border-slate-600/30';
                icon = '';
              } else if (texto.includes('🤖') || texto.includes('oponente')) {
                bgColor = 'bg-red-900/20';
                textColor = 'text-red-200';
                borderColor = 'border-red-500/20';
                icon = '🤖';
              } else if (texto.includes('⏰') || texto.includes('Rodada')) {
                bgColor = 'bg-cyan-900/20';
                textColor = 'text-cyan-200';
                borderColor = 'border-cyan-500/20';
                icon = '⏰';
              }

              return (
                <div
                  key={i}
                  className={`${bgColor} ${textColor} px-3 py-2 rounded border ${borderColor} text-xs font-mono leading-relaxed transition-all hover:scale-[1.02] hover:shadow-md`}
                >
                  {icon && <span className="mr-2">{icon}</span>}
                  {texto.replace(icon, '').trim()}
                </div>
              );
            })}

            {log.length === 0 && (
              <div className="text-center text-slate-500 py-8 text-sm">
                ⚔️ A batalha está prestes a começar...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BatalhaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 flex items-center justify-center">
        <div className="text-red-400 font-mono animate-pulse">Carregando batalha...</div>
      </div>
    }>
      <BatalhaContent />
    </Suspense>
  );
}
