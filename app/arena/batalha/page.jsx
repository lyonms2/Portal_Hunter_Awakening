"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { processarAcaoJogador, verificarVitoria, iniciarTurno } from "@/lib/arena/batalhaEngine";
import { processarTurnoIA, getMensagemIA } from "@/lib/arena/iaEngine";
import { calcularRecompensasTreino } from "@/lib/arena/recompensasCalc";
import { calcularRecompensasPvP, calcularPontosVitoria, calcularPerda } from "@/lib/pvp/rankingSystem";
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

  useEffect(() => {
    // Carregar estado da batalha
    let batalhaJSON;

    if (modoPvP) {
      // Modo PvP - carregar de sessionStorage
      batalhaJSON = sessionStorage.getItem('batalha_pvp_dados');
      if (batalhaJSON) {
        const dados = JSON.parse(batalhaJSON);
        setDadosPvP(dados);

        // Construir estado de batalha a partir dos dados PvP
        const batalha = {
          jogador: {
            ...dados.avatarJogador,
            hp_atual: dados.avatarJogador.hp || (dados.avatarJogador.resistencia * 10),
            hp_maximo: dados.avatarJogador.hp || (dados.avatarJogador.resistencia * 10),
            energia_atual: 100,
            buffs: [],
            debuffs: []
          },
          inimigo: {
            ...dados.avatarOponente,
            nome: dados.nomeOponente,
            hp_atual: dados.avatarOponente.hp || (dados.avatarOponente.resistencia * 10),
            hp_maximo: dados.avatarOponente.hp || (dados.avatarOponente.resistencia * 10),
            energia_atual: 100,
            buffs: [],
            debuffs: []
          },
          dificuldade: 'pvp',
          rodada: 1,
          turno_atual: 'jogador'
        };

        setEstado(batalha);

        adicionarLog('⚔️ BATALHA PvP INICIADA!');
        adicionarLog(`Você: ${batalha.jogador.nome} (${batalha.jogador.elemento})`);
        adicionarLog(`VS`);
        adicionarLog(`${dados.nomeOponente}: ${batalha.inimigo.nome} (${batalha.inimigo.elemento})`);
        adicionarLog(`Tier: ${dados.tierJogador.nome} ${dados.tierJogador.icone}`);
        adicionarLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
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

    const interval = setInterval(() => {
      setTempoRestante((prev) => {
        if (prev <= 1) {
          // Tempo esgotado - executar ação automática (esperar)
          adicionarLog('⏱️ Tempo esgotado! Passando a vez...');
          executarAcao('esperar');
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerAtivo, turnoIA, processando, resultado]);

  const adicionarLog = (mensagem) => {
    setLog(prev => [...prev, { texto: mensagem, timestamp: Date.now() }]);
  };

  const executarAcao = async (tipo, habilidadeIndex = null) => {
    if (!estado || turnoIA || processando) return;

    setProcessando(true);
    setTempoRestante(30); // Reset timer

    // Animação da ação
    setAnimacaoAcao({ tipo, alvo: 'inimigo' });
    setTimeout(() => setAnimacaoAcao(null), 800);

    try {
      const novoEstado = { ...estado };

      // === TURNO DO JOGADOR ===
      const resultado = processarAcaoJogador(novoEstado, { tipo, habilidadeIndex });

      adicionarLog(`🎯 ${resultado.mensagem}`);

      if (resultado.energiaGasta > 0) {
        adicionarLog(`⚡ -${resultado.energiaGasta} energia`);
      }

      if (resultado.energiaRecuperada > 0) {
        adicionarLog(`⚡ +${resultado.energiaRecuperada} energia recuperada`);
      }

      if (resultado.dano > 0) {
        adicionarLog(`💥 ${resultado.dano} de dano causado`);
      }

      if (resultado.buffs && resultado.buffs.length > 0) {
        resultado.buffs.forEach(buff => {
          if (buff.tipo === 'defesa') {
            adicionarLog(`🛡️ Defesa aumentada em ${buff.valor}% por 1 turno!`);
          }
        });
      }

      // Verificar vitória
      const vitoria = verificarVitoria(novoEstado);
      
      if (vitoria.fim) {
        finalizarBatalha(novoEstado, vitoria.vencedor);
        return;
      }

      // Atualizar estado
      setEstado(novoEstado);

      // Aguardar 1 segundo antes do turno da IA
      await new Promise(resolve => setTimeout(resolve, 1000));

      // === TURNO DA IA ===
      setTurnoIA(true);
      adicionarLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      adicionarLog('🤖 Turno do oponente...');
      
      // Mensagem de flavor
      const mensagemIA = getMensagemIA({ tipo: 'habilidade' }, novoEstado);
      adicionarLog(mensagemIA);

      await new Promise(resolve => setTimeout(resolve, 1500));

      // Executar ação da IA
      const resultadoIA = processarTurnoIA(novoEstado);
      adicionarLog(`💥 ${resultadoIA.mensagem}`);

      // Animação de dano da IA no jogador
      if (resultadoIA.dano > 0) {
        setAnimacaoDano({
          tipo: 'jogador',
          valor: resultadoIA.dano,
          critico: resultadoIA.critico || false
        });
        setTimeout(() => setAnimacaoDano(null), 1500);
      }

      // Verificar vitória novamente
      const vitoriaIA = verificarVitoria(novoEstado);
      
      if (vitoriaIA.fim) {
        finalizarBatalha(novoEstado, vitoriaIA.vencedor);
        return;
      }

      // === PRÓXIMA RODADA ===
      novoEstado.rodada++;
      novoEstado.turno_atual = 'jogador';

      // Processar efeitos contínuos (dano/cura por turno, reduzir duração de buffs/debuffs)
      const turnoJogador = iniciarTurno(novoEstado.jogador, novoEstado);
      const turnoInimigo = iniciarTurno(novoEstado.inimigo, novoEstado);

      // Registrar efeitos processados
      if (turnoJogador.efeitosProcessados && turnoJogador.efeitosProcessados.length > 0) {
        turnoJogador.efeitosProcessados.forEach(efeito => {
          if (efeito.tipo === 'dano_continuo') {
            adicionarLog(`🔥 ${novoEstado.jogador.nome} sofreu ${efeito.dano} de dano de ${efeito.nome}`);
          } else if (efeito.tipo === 'cura_continua') {
            adicionarLog(`💚 ${novoEstado.jogador.nome} recuperou ${efeito.cura} HP de ${efeito.nome}`);
          }
        });
      }

      if (turnoInimigo.efeitosProcessados && turnoInimigo.efeitosProcessados.length > 0) {
        turnoInimigo.efeitosProcessados.forEach(efeito => {
          if (efeito.tipo === 'dano_continuo') {
            adicionarLog(`🔥 ${novoEstado.inimigo.nome} sofreu ${efeito.dano} de dano de ${efeito.nome}`);
          } else if (efeito.tipo === 'cura_continua') {
            adicionarLog(`💚 ${novoEstado.inimigo.nome} recuperou ${efeito.cura} HP de ${efeito.nome}`);
          }
        });
      }

      adicionarLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      adicionarLog(`⏰ Rodada ${novoEstado.rodada}`);

      setEstado(novoEstado);
      setTurnoIA(false);

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
    let pontosGanhos = 0;

    if (modoPvP && dadosPvP) {
      // Calcular recompensas PvP
      const venceu = vencedor === 'jogador';
      recompensas = calcularRecompensasPvP(venceu, dadosPvP.tierJogador, estadoFinal.rodada);

      // Calcular pontos de ranking
      if (venceu) {
        pontosGanhos = calcularPontosVitoria(dadosPvP.pontosRankingJogador, dadosPvP.pontosRankingOponente);
        adicionarLog(`🏆 +${pontosGanhos} pontos de ranking!`);
      } else {
        pontosGanhos = -calcularPerda(dadosPvP.pontosRankingOponente, dadosPvP.pontosRankingJogador);
        adicionarLog(`📉 ${pontosGanhos} pontos de ranking`);
      }

      recompensas.pontos_ranking = pontosGanhos;
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
          // Modo PvP - atualizar ranking
          const rankingKey = `pvp_ranking_${userData.id}`;
          const rankingData = JSON.parse(localStorage.getItem(rankingKey) || '{"pontos": 1000, "vitorias": 0, "derrotas": 0}');

          // Atualizar pontos e estatísticas
          const novosPontos = Math.max(0, rankingData.pontos + (resultado.recompensas.pontos_ranking || 0));

          if (resultado.vencedor === 'jogador') {
            rankingData.vitorias = (rankingData.vitorias || 0) + 1;
          } else if (resultado.vencedor === 'inimigo') {
            rankingData.derrotas = (rankingData.derrotas || 0) + 1;
          }

          rankingData.pontos = novosPontos;

          localStorage.setItem(rankingKey, JSON.stringify(rankingData));

          // Aplicar recompensas (XP, moedas, etc.)
          await fetch('/api/atualizar-stats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: userData.id,
              moedas: resultado.recompensas.moedas,
              fragmentos: resultado.recompensas.fragmentos || 0
            })
          });

          await fetch('/api/atualizar-avatar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              avatarId: estado.jogador.id,
              experiencia: resultado.recompensas.xp,
              exaustao: 15, // Exaustão fixa para PvP
              vinculo: resultado.recompensas.vinculo || 0
            })
          });

          sessionStorage.removeItem('batalha_pvp_dados');
          router.push('/arena/pvp');
        } else if (resultado.vencedor === 'jogador') {
          // Modo Treino - aplicar recompensas normalmente
          await fetch('/api/atualizar-stats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: userData.id,
              moedas: resultado.recompensas.moedas,
              fragmentos: resultado.recompensas.fragmentos || 0
            })
          });

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
        } else {
          // Derrota no treino
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

              {resultado.recompensas.fragmentos > 0 && (
                <div className="text-center p-3 bg-purple-900/30 rounded border border-purple-500/50 mb-4">
                  <span className="text-purple-400 font-bold">
                    💎 +{resultado.recompensas.fragmentos} Fragmento(s)!
                  </span>
                </div>
              )}

              {/* Pontos de Ranking (PvP) */}
              {resultado.pvp && resultado.recompensas.pontos_ranking !== undefined && (
                <div className={`text-center p-4 rounded border mb-4 ${
                  resultado.recompensas.pontos_ranking > 0
                    ? 'bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border-yellow-500/50'
                    : 'bg-gradient-to-r from-red-900/30 to-orange-900/30 border-red-500/50'
                }`}>
                  <div className="text-4xl mb-2">
                    {resultado.recompensas.pontos_ranking > 0 ? '🏆' : '📉'}
                  </div>
                  <div className={`text-3xl font-black ${
                    resultado.recompensas.pontos_ranking > 0 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {resultado.recompensas.pontos_ranking > 0 ? '+' : ''}{resultado.recompensas.pontos_ranking}
                  </div>
                  <div className="text-sm text-slate-400">Pontos de Ranking</div>
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
                {resultado.pvp && (
                  <div className="text-center p-3 bg-orange-900/30 rounded border border-orange-500/50">
                    <span className="text-orange-400 text-sm">
                      😰 +15 Exaustão
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
            {turnoIA ? '🤖 Oponente' : '🎮 Seu Turno'}
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

            {/* Ações */}
            <div className="bg-slate-900/80 rounded-lg p-6 border-2 border-slate-700">
              <h3 className="text-cyan-400 font-bold mb-4">⚡ SUAS AÇÕES</h3>

              {/* Ataque Básico */}
              <div className="mb-4">
                <button
                  onClick={() => !turnoIA && !processando && executarAcao('atacar')}
                  disabled={turnoIA || processando}
                  className="w-full p-4 rounded-lg border-2 transition-all text-left bg-gradient-to-r from-red-900/40 to-orange-900/40 border-red-500 hover:from-red-900/60 hover:to-orange-900/60 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-red-300 text-lg mb-1">⚔️ Ataque Básico</div>
                      <div className="text-xs text-slate-300">Ataque físico rápido • Sem custo de energia</div>
                    </div>
                    <div className="text-3xl">⚔️</div>
                  </div>
                  <div className="mt-2 text-xs text-green-400">✅ Sempre disponível • Pode causar crítico</div>
                </button>
              </div>

              {/* Habilidades */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {estado.jogador.habilidades && estado.jogador.habilidades.length > 0 ? estado.jogador.habilidades.map((hab, index) => {
                  const custoEnergia = hab.custo_energia || hab.custoEnergia || 20;
                  const podeUsar = estado.jogador.energia_atual >= custoEnergia && !turnoIA && !processando;
                  const energiaInsuficiente = estado.jogador.energia_atual < custoEnergia;

                  return (
                    <button
                      key={index}
                      onClick={() => podeUsar && executarAcao('habilidade', index)}
                      disabled={!podeUsar}
                      className={`p-3 rounded-lg border-2 transition-all text-left relative overflow-hidden ${
                        podeUsar
                          ? 'border-purple-500 bg-gradient-to-br from-purple-900/40 to-purple-800/30 hover:from-purple-800/50 hover:to-purple-700/40 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20 cursor-pointer'
                          : energiaInsuficiente
                          ? 'border-slate-700 bg-slate-800/30 opacity-40 cursor-not-allowed'
                          : 'border-slate-600 bg-slate-800/20 opacity-50 cursor-wait'
                      }`}
                    >
                      {podeUsar && (
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-purple-500/0 animate-pulse"></div>
                      )}
                      <div className="relative z-10">
                        <div className="font-bold text-purple-300 text-sm mb-1 flex items-center justify-between">
                          <span>{hab.nome}</span>
                          {hab.tipo && (
                            <span className="text-[10px] px-1 py-0.5 rounded bg-purple-500/20 text-purple-200">
                              {hab.tipo}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 mb-2 line-clamp-2">{hab.descricao}</div>
                        <div className={`text-xs flex items-center justify-between ${
                          energiaInsuficiente ? 'text-red-400' : 'text-blue-400'
                        }`}>
                          <span>⚡ {custoEnergia} energia</span>
                          {energiaInsuficiente && (
                            <span className="text-[10px] text-red-400">❌ Sem energia</span>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-slate-400 mb-2 line-clamp-2">{hab.descricao}</div>
                      <div className={`text-xs flex items-center justify-between ${
                        energiaInsuficiente ? 'text-red-400' : 'text-blue-400'
                      }`}>
                        <span>⚡ {custoEnergia} energia</span>
                        {energiaInsuficiente && (
                          <span className="text-[10px] text-red-400">❌ Sem energia</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              }) : (
                <div className="text-center text-slate-400 py-4 text-xs">
                  Sem habilidades
                </div>
              )}
            </div>

            {/* Ações Especiais */}
            <div className="space-y-2">
              <button
                onClick={() => !turnoIA && !processando && executarAcao('ataque_basico')}
                disabled={turnoIA || processando}
                className="w-full px-4 py-3 bg-gradient-to-br from-red-900/60 to-red-800/40 hover:from-red-800/70 hover:to-red-700/50 rounded border border-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-semibold hover:scale-105"
              >
                ⚔️ Ataque Básico <span className="text-xs text-red-300">(0 energia)</span>
              </button>

              <button
                onClick={() => !turnoIA && !processando && executarAcao('defender')}
                disabled={turnoIA || processando}
                className="w-full px-4 py-3 bg-gradient-to-br from-blue-900/60 to-blue-800/40 hover:from-blue-800/70 hover:to-blue-700/50 rounded border border-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-semibold hover:scale-105"
              >
                🛡️ Defender <span className="text-xs text-blue-300">(+15 energia)</span>
              </button>

              <button
                onClick={() => !turnoIA && !processando && executarAcao('esperar')}
                disabled={turnoIA || processando}
                className="w-full px-4 py-3 bg-gradient-to-br from-green-900/60 to-green-800/40 hover:from-green-800/70 hover:to-green-700/50 rounded border border-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-semibold hover:scale-105"
              >
                ⏸️ Esperar <span className="text-xs text-green-300">(+30 energia)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Log de Combate - Embaixo */}
        <div className="mt-2 bg-slate-900/80 rounded-lg p-3 border border-slate-700">
          <h3 className="text-cyan-400 font-bold mb-2 text-sm">📜 LOG DE COMBATE</h3>

          <div className="max-h-32 overflow-y-auto space-y-1 text-xs font-mono">
            {log.map((entry, i) => (
              <div key={i} className="text-slate-300 leading-relaxed">
                {entry.texto}
              </div>
            ))}
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
