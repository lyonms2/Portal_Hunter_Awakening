"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  calcularHPMaximoCompleto,
  calcularDanoHabilidade,
  calcularChanceAcerto,
  calcularDanoCritico
} from "@/lib/gameLogic";
import {
  decidirProximaAcao,
  calcularTempoDecisao,
  deveIAFugir,
  deveIARender,
  escolherPersonalidade
} from "@/lib/pvp/ai-engine";
import AvatarSVG from "../../../components/AvatarSVG";

export default function BatalhaIAPage() {
  const router = useRouter();
  const logRef = useRef(null);

  // Estados principais
  const [user, setUser] = useState(null);
  const [dadosPartida, setDadosPartida] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estados de batalha
  const [turnoAtual, setTurnoAtual] = useState(1);
  const [ehMeuTurno, setEhMeuTurno] = useState(true);
  const [batalhaConcluida, setBatalhaConcluida] = useState(false);
  const [resultado, setResultado] = useState(null);

  // Estados dos avatares
  const [jogadorHP, setJogadorHP] = useState(100);
  const [jogadorHPMax, setJogadorHPMax] = useState(100);
  const [jogadorEnergia, setJogadorEnergia] = useState(100);
  const [jogadorDefesa, setJogadorDefesa] = useState(0);

  const [iaHP, setIaHP] = useState(100);
  const [iaHPMax, setIaHPMax] = useState(100);
  const [iaEnergia, setIaEnergia] = useState(100);
  const [iaDefesa, setIaDefesa] = useState(0);

  // Cooldowns
  const [cooldownsJogador, setCooldownsJogador] = useState({});
  const [cooldownsIA, setCooldownsIA] = useState({});

  // IA
  const [personalidadeIA, setPersonalidadeIA] = useState(null);
  const [iaPensando, setIaPensando] = useState(false);
  const [iaFugiu, setIaFugiu] = useState(false);

  // Log de batalha
  const [logBatalha, setLogBatalha] = useState([]);

  // UI
  const [habilidadeSelecionada, setHabilidadeSelecionada] = useState(null);
  const [mostrarModalRender, setMostrarModalRender] = useState(false);
  const [mostrarModalFuga, setMostrarModalFuga] = useState(false);

  // Timer
  const [tempoRestante, setTempoRestante] = useState(30);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);

    // Buscar dados da partida
    const dadosBatalha = sessionStorage.getItem('batalha_pvp_ia_dados');
    if (!dadosBatalha) {
      router.push("/arena/pvp-ia");
      return;
    }

    const dados = JSON.parse(dadosBatalha);
    setDadosPartida(dados);

    // Inicializar HP
    const jogadorHPMaximo = calcularHPMaximoCompleto(dados.avatarJogador);
    const iaHPMaximo = calcularHPMaximoCompleto(dados.avatarOponente);

    setJogadorHP(jogadorHPMaximo);
    setJogadorHPMax(jogadorHPMaximo);
    setIaHP(iaHPMaximo);
    setIaHPMax(iaHPMaximo);

    // Escolher personalidade da IA
    const personalidade = escolherPersonalidade();
    setPersonalidadeIA(personalidade);

    addLog(`⚔️ Batalha iniciada contra ${dados.nomeOponente}!`);
    addLog(`💀 MODO MORTE REAL ATIVADO - Batalhe com cautela!`);
    addLog(`🏆 Fama apostada: ${dados.famaApostada} pontos`);

    setLoading(false);
  }, [router]);

  // Auto-scroll do log
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logBatalha]);

  // Turno da IA
  useEffect(() => {
    if (!ehMeuTurno && !batalhaConcluida && dadosPartida && personalidadeIA) {
      executarTurnoIA();
    }
  }, [ehMeuTurno, batalhaConcluida]);

  // Timer - conta regressiva no turno do jogador
  useEffect(() => {
    if (ehMeuTurno && !batalhaConcluida) {
      // Resetar timer ao iniciar turno
      setTempoRestante(30);

      const interval = setInterval(() => {
        setTempoRestante((prev) => {
          if (prev <= 1) {
            // Tempo esgotado - passar turno automaticamente
            addLog('⏰ Tempo esgotado! Pulando turno...', 'aviso');
            setTimeout(() => {
              setEhMeuTurno(false);
              setTurnoAtual((t) => t + 1);
            }, 500);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [ehMeuTurno, batalhaConcluida, turnoAtual]);

  const addLog = (mensagem, tipo = 'info') => {
    const cores = {
      info: 'text-gray-300',
      jogador: 'text-cyan-400',
      ia: 'text-orange-400',
      dano: 'text-red-400',
      cura: 'text-green-400',
      critico: 'text-yellow-400',
      aviso: 'text-yellow-500',
      vitoria: 'text-green-500',
      derrota: 'text-red-500'
    };

    setLogBatalha(prev => [...prev, {
      mensagem,
      cor: cores[tipo] || cores.info,
      timestamp: Date.now()
    }]);
  };

  const executarTurnoIA = async () => {
    setIaPensando(true);

    const estadoBatalha = {
      ia: { hpAtual: iaHP, hpMaximo: iaHPMax, energia: iaEnergia, defesa: iaDefesa },
      jogador: { hpAtual: jogadorHP, hpMaximo: jogadorHPMax, energia: jogadorEnergia, defesa: jogadorDefesa },
      turnoAtual
    };

    // IA decide se deve fugir
    if (deveIAFugir(estadoBatalha, personalidadeIA.config)) {
      const tempoDecisao = calcularTempoDecisao(personalidadeIA.config);
      await new Promise(resolve => setTimeout(resolve, tempoDecisao));

      const chancesFuga = calcularChancesFuga(dadosPartida.avatarOponente);
      const fugiu = Math.random() * 100 < chancesFuga;

      if (fugiu) {
        addLog(`${dadosPartida.nomeOponente} tenta fugir da batalha!`, 'ia');
        addLog(`✅ ${dadosPartida.nomeOponente} conseguiu fugir!`, 'aviso');
        setIaFugiu(true); // Marcar que fugiu
        finalizarBatalha('fuga_ia');
        return;
      } else {
        addLog(`${dadosPartida.nomeOponente} tenta fugir mas falha!`, 'ia');
        const danoFuga = Math.floor(iaHPMax * 0.1);
        setIaHP(prev => Math.max(0, prev - danoFuga));
        addLog(`${dadosPartida.nomeOponente} sofre ${danoFuga} de dano ao falhar na fuga!`, 'dano');
      }
    }

    // IA decide se deve se render
    if (deveIARender(estadoBatalha, personalidadeIA.config)) {
      const tempoDecisao = calcularTempoDecisao(personalidadeIA.config);
      await new Promise(resolve => setTimeout(resolve, tempoDecisao));

      addLog(`${dadosPartida.nomeOponente} se rende!`, 'ia');
      addLog(`🏳️ ${dadosPartida.nomeOponente} admitiu derrota!`, 'vitoria');
      finalizarBatalha('render_ia');
      return;
    }

    // Decidir ação
    const acao = decidirProximaAcao(
      estadoBatalha,
      dadosPartida.avatarOponente,
      dadosPartida.avatarJogador,
      personalidadeIA.config,
      cooldownsIA
    );

    // Simular tempo de pensamento
    const tempoDecisao = calcularTempoDecisao(personalidadeIA.config);
    await new Promise(resolve => setTimeout(resolve, tempoDecisao));

    setIaPensando(false);

    // Executar ação
    if (acao.tipo === 'ataque') {
      executarAtaqueIA();
    } else if (acao.tipo === 'habilidade' && acao.habilidade) {
      executarHabilidadeIA(acao.habilidade);
    } else if (acao.tipo === 'defender') {
      executarDefesaIA();
    }
  };

  const executarAtaqueIA = () => {
    const avatar = dadosPartida.avatarOponente;
    const danoBase = Math.floor(avatar.forca * 1.2);
    const chanceAcerto = 85;

    if (Math.random() * 100 > chanceAcerto) {
      addLog(`${dadosPartida.nomeOponente} ataca mas erra!`, 'ia');
      proximoTurno();
      return;
    }

    const critico = Math.random() * 100 < 15;
    let dano = danoBase;

    if (critico) {
      dano = Math.floor(dano * 1.5);
      addLog(`${dadosPartida.nomeOponente} acerta um GOLPE CRÍTICO!`, 'critico');
    }

    // Aplicar defesa
    const danoFinal = Math.max(1, dano - jogadorDefesa);

    setJogadorHP(prev => {
      const novoHP = Math.max(0, prev - danoFinal);
      if (novoHP === 0) {
        finalizarBatalha('derrota');
      }
      return novoHP;
    });

    addLog(`${dadosPartida.nomeOponente} ataca causando ${danoFinal} de dano!`, 'ia');

    // Resetar defesa depois do ataque
    if (jogadorDefesa > 0) {
      setJogadorDefesa(0);
    }

    // Recuperar energia
    setIaEnergia(prev => Math.min(100, prev + 15));

    proximoTurno();
  };

  const executarHabilidadeIA = (habilidade) => {
    const custoEnergia = habilidade.custo_energia || 0;

    if (iaEnergia < custoEnergia) {
      addLog(`${dadosPartida.nomeOponente} não tem energia suficiente!`, 'ia');
      executarAtaqueIA();
      return;
    }

    setIaEnergia(prev => prev - custoEnergia);

    addLog(`${dadosPartida.nomeOponente} usa ${habilidade.nome}!`, 'ia');

    // Processar habilidade
    if (habilidade.tipo === 'Ofensiva') {
      // Calcular dano: calcularDanoHabilidade(habilidade, stats, nivel, vinculo)
      const stats = {
        forca: dadosPartida.avatarOponente.forca,
        agilidade: dadosPartida.avatarOponente.agilidade,
        resistencia: dadosPartida.avatarOponente.resistencia,
        foco: dadosPartida.avatarOponente.foco,
        [habilidade.stat_primario]: dadosPartida.avatarOponente[habilidade.stat_primario]
      };
      const dano = calcularDanoHabilidade(
        habilidade,
        stats,
        dadosPartida.avatarOponente.nivel,
        dadosPartida.avatarOponente.vinculo || 0
      );
      const danoFinal = Math.max(1, dano - jogadorDefesa);

      setJogadorHP(prev => {
        const novoHP = Math.max(0, prev - danoFinal);
        if (novoHP === 0) {
          finalizarBatalha('derrota');
        }
        return novoHP;
      });

      addLog(`💥 Causou ${danoFinal} de dano!`, 'dano');

      if (jogadorDefesa > 0) {
        setJogadorDefesa(0);
      }
    } else if (habilidade.tipo === 'Cura') {
      const cura = Math.floor(iaHPMax * 0.3);
      setIaHP(prev => Math.min(iaHPMax, prev + cura));
      addLog(`💚 ${dadosPartida.nomeOponente} recuperou ${cura} HP!`, 'cura');
    } else if (habilidade.tipo === 'Buff') {
      const defesaGanha = Math.floor(dadosPartida.avatarOponente.resistencia * 0.5);
      setIaDefesa(prev => prev + defesaGanha);
      addLog(`🛡️ ${dadosPartida.nomeOponente} ganhou ${defesaGanha} de defesa!`, 'ia');
    }

    // Adicionar cooldown
    setCooldownsIA(prev => ({
      ...prev,
      [habilidade.nome]: habilidade.cooldown || 0
    }));

    proximoTurno();
  };

  const executarDefesaIA = () => {
    const defesaGanha = Math.floor(dadosPartida.avatarOponente.resistencia * 0.7);
    setIaDefesa(prev => prev + defesaGanha);
    addLog(`${dadosPartida.nomeOponente} assume posição defensiva! (+${defesaGanha} DEF)`, 'ia');

    // Recuperar energia
    setIaEnergia(prev => Math.min(100, prev + 20));

    proximoTurno();
  };

  const atacar = () => {
    if (!ehMeuTurno || batalhaConcluida) return;

    const avatar = dadosPartida.avatarJogador;
    const danoBase = Math.floor(avatar.forca * 1.2);
    const chanceAcerto = 85;

    if (Math.random() * 100 > chanceAcerto) {
      addLog('Você ataca mas erra!', 'jogador');
      proximoTurno();
      return;
    }

    const critico = Math.random() * 100 < 15;
    let dano = danoBase;

    if (critico) {
      dano = Math.floor(dano * 1.5);
      addLog('Você acerta um GOLPE CRÍTICO!', 'critico');
    }

    const danoFinal = Math.max(1, dano - iaDefesa);

    setIaHP(prev => {
      const novoHP = Math.max(0, prev - danoFinal);
      if (novoHP === 0) {
        finalizarBatalha('vitoria');
      }
      return novoHP;
    });

    addLog(`Você ataca causando ${danoFinal} de dano!`, 'jogador');

    if (iaDefesa > 0) {
      setIaDefesa(0);
    }

    setJogadorEnergia(prev => Math.min(100, prev + 15));

    proximoTurno();
  };

  const usarHabilidade = (habilidade) => {
    if (!ehMeuTurno || batalhaConcluida) return;

    const custoEnergia = habilidade.custo_energia || 0;

    if (jogadorEnergia < custoEnergia) {
      addLog('Energia insuficiente!', 'aviso');
      return;
    }

    const cooldown = cooldownsJogador[habilidade.nome] || 0;
    if (cooldown > 0) {
      addLog(`${habilidade.nome} ainda está em cooldown! (${cooldown} turnos)`, 'aviso');
      return;
    }

    setJogadorEnergia(prev => prev - custoEnergia);

    addLog(`Você usa ${habilidade.nome}!`, 'jogador');

    if (habilidade.tipo === 'Ofensiva') {
      // Calcular dano: calcularDanoHabilidade(habilidade, stats, nivel, vinculo)
      const stats = {
        forca: dadosPartida.avatarJogador.forca,
        agilidade: dadosPartida.avatarJogador.agilidade,
        resistencia: dadosPartida.avatarJogador.resistencia,
        foco: dadosPartida.avatarJogador.foco,
        [habilidade.stat_primario]: dadosPartida.avatarJogador[habilidade.stat_primario]
      };
      const dano = calcularDanoHabilidade(
        habilidade,
        stats,
        dadosPartida.avatarJogador.nivel,
        dadosPartida.avatarJogador.vinculo || 0
      );
      const danoFinal = Math.max(1, dano - iaDefesa);

      setIaHP(prev => {
        const novoHP = Math.max(0, prev - danoFinal);
        if (novoHP === 0) {
          finalizarBatalha('vitoria');
        }
        return novoHP;
      });

      addLog(`💥 Causou ${danoFinal} de dano!`, 'dano');

      if (iaDefesa > 0) {
        setIaDefesa(0);
      }
    } else if (habilidade.tipo === 'Cura') {
      const cura = Math.floor(jogadorHPMax * 0.3);
      setJogadorHP(prev => Math.min(jogadorHPMax, prev + cura));
      addLog(`💚 Você recuperou ${cura} HP!`, 'cura');
    } else if (habilidade.tipo === 'Buff') {
      const defesaGanha = Math.floor(dadosPartida.avatarJogador.resistencia * 0.5);
      setJogadorDefesa(prev => prev + defesaGanha);
      addLog(`🛡️ Você ganhou ${defesaGanha} de defesa!`, 'jogador');
    }

    setCooldownsJogador(prev => ({
      ...prev,
      [habilidade.nome]: habilidade.cooldown || 0
    }));

    setHabilidadeSelecionada(null);
    proximoTurno();
  };

  const defender = () => {
    if (!ehMeuTurno || batalhaConcluida) return;

    const defesaGanha = Math.floor(dadosPartida.avatarJogador.resistencia * 0.7);
    setJogadorDefesa(prev => prev + defesaGanha);
    addLog(`Você assume posição defensiva! (+${defesaGanha} DEF)`, 'jogador');

    setJogadorEnergia(prev => Math.min(100, prev + 20));

    proximoTurno();
  };

  const tentarFugir = () => {
    if (!ehMeuTurno || batalhaConcluida) return;
    setMostrarModalFuga(true);
  };

  const confirmarFuga = () => {
    setMostrarModalFuga(false);

    const chancesFuga = calcularChancesFuga(dadosPartida.avatarJogador);
    const fugiu = Math.random() * 100 < chancesFuga;

    addLog('Você tenta fugir da batalha!', 'jogador');

    if (fugiu) {
      addLog('✅ Você conseguiu fugir!', 'aviso');
      finalizarBatalha('fuga');
    } else {
      addLog('❌ Você falhou em fugir!', 'aviso');
      const danoFuga = Math.floor(jogadorHPMax * 0.1);
      setJogadorHP(prev => {
        const novoHP = Math.max(0, prev - danoFuga);
        if (novoHP === 0) {
          finalizarBatalha('derrota');
        }
        return novoHP;
      });
      addLog(`Você sofre ${danoFuga} de dano ao falhar na fuga!`, 'dano');
      proximoTurno();
    }
  };

  const tentarRender = () => {
    if (!ehMeuTurno || batalhaConcluida) return;
    setMostrarModalRender(true);
  };

  const confirmarRender = () => {
    setMostrarModalRender(false);
    addLog('Você se rende!', 'jogador');
    addLog('🏳️ Você admitiu derrota!', 'derrota');
    finalizarBatalha('render');
  };

  const calcularChancesFuga = (avatar) => {
    const agilidadeBase = avatar.agilidade;
    const vinculo = avatar.vinculo || 0;
    const hpPercent = (jogadorHP / jogadorHPMax) * 100;

    let chance = (agilidadeBase * 2) + (vinculo / 10);

    if (hpPercent < 30) {
      chance += 15; // Bonus por desespero
    }

    return Math.min(80, Math.max(20, chance));
  };

  const proximoTurno = () => {
    // Reduzir cooldowns
    setCooldownsJogador(prev => {
      const novos = {};
      for (const [key, value] of Object.entries(prev)) {
        if (value > 0) novos[key] = value - 1;
      }
      return novos;
    });

    setCooldownsIA(prev => {
      const novos = {};
      for (const [key, value] of Object.entries(prev)) {
        if (value > 0) novos[key] = value - 1;
      }
      return novos;
    });

    setTurnoAtual(prev => prev + 1);
    setEhMeuTurno(prev => !prev);
  };

  const finalizarBatalha = async (tipoResultado) => {
    setBatalhaConcluida(true);

    let vitoria = false;
    let famaGanha = 0;
    let vinculoGanho = 0;
    let exaustaoGanha = 15;

    switch (tipoResultado) {
      case 'vitoria':
        vitoria = true;
        famaGanha = dadosPartida.famaApostada;
        vinculoGanho = 5;
        addLog('🎉 VITÓRIA! Você derrotou seu oponente!', 'vitoria');
        break;

      case 'derrota':
        famaGanha = -dadosPartida.famaApostada;
        addLog('💀 DERROTA! Seu avatar morreu...', 'derrota');
        break;

      case 'render':
        famaGanha = -Math.floor(dadosPartida.famaApostada / 2);
        exaustaoGanha = 5;
        addLog('🏳️ Você se rendeu e salvou seu avatar.', 'aviso');
        break;

      case 'fuga':
        famaGanha = -Math.floor(dadosPartida.famaApostada / 3);
        exaustaoGanha = 10;
        addLog('🏃 Você fugiu da batalha.', 'aviso');
        break;

      case 'render_ia':
        vitoria = true;
        famaGanha = dadosPartida.famaApostada;
        vinculoGanho = 3;
        addLog('🏆 VITÓRIA POR RENDIÇÃO!', 'vitoria');
        break;

      case 'fuga_ia':
        vitoria = true;
        famaGanha = Math.floor(dadosPartida.famaApostada * 0.7);
        vinculoGanho = 2;
        addLog('🏆 VITÓRIA! Oponente fugiu!', 'vitoria');
        break;
    }

    setResultado({
      vitoria,
      tipoResultado,
      famaGanha,
      vinculoGanho,
      exaustaoGanha,
      avatarMorreu: tipoResultado === 'derrota'
    });

    // Salvar resultado no backend
    await salvarResultadoBatalha(vitoria, famaGanha, vinculoGanho, exaustaoGanha, tipoResultado === 'derrota', jogadorHP);
  };

  const salvarResultadoBatalha = async (vitoria, famaGanha, vinculoGanho, exaustaoGanha, avatarMorreu, hpFinal) => {
    try {
      console.log('[SALVANDO RESULTADO]', {
        userId: user.id,
        avatarId: dadosPartida.avatarJogador.id,
        vitoria,
        famaGanha,
        vinculoGanho,
        exaustaoGanha,
        avatarMorreu,
        hpFinal
      });

      const response = await fetch('/api/pvp/ia/finalizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          avatarId: dadosPartida.avatarJogador.id,
          vitoria,
          famaGanha,
          vinculoGanho,
          exaustaoGanha,
          avatarMorreu,
          hpFinal
        })
      });

      const data = await response.json();
      console.log('[RESPOSTA API]', data);

      if (!response.ok) {
        console.error('Erro ao salvar resultado:', data);
        addLog('⚠️ Erro ao salvar resultado da batalha!', 'aviso');
      } else {
        console.log('✅ Resultado salvo com sucesso!');
        addLog('💾 Resultado da batalha salvo!', 'info');
      }
    } catch (error) {
      console.error('Erro ao salvar resultado:', error);
      addLog('⚠️ Erro ao salvar resultado da batalha!', 'aviso');
    }
  };

  const voltarArena = () => {
    sessionStorage.removeItem('batalha_pvp_ia_dados');
    router.push('/arena/pvp-ia');
  };

  if (loading || !dadosPartida) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-cyan-400 text-xl animate-pulse">Carregando batalha...</div>
      </div>
    );
  }

  const hpJogadorPercent = (jogadorHP / jogadorHPMax) * 100;
  const hpIAPercent = (iaHP / iaHPMax) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-red-950 to-slate-950 text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 mb-2">
            ⚔️ BATALHA MORTAL
          </h1>
          <div className="flex justify-center gap-4 text-sm">
            <span className="text-gray-400">Turno: <span className="text-white font-bold">{turnoAtual}</span></span>
            {ehMeuTurno && !batalhaConcluida && (
              <span className="text-gray-400">
                Tempo: <span className={`font-bold ${
                  tempoRestante <= 5 ? 'text-red-500 animate-pulse' :
                  tempoRestante <= 10 ? 'text-orange-500' : 'text-cyan-400'
                }`}>⏱️ {tempoRestante}s</span>
              </span>
            )}
            <span className="text-gray-400">Fama Apostada: <span className="text-yellow-400 font-bold">{dadosPartida.famaApostada}</span></span>
            <span className="text-red-400 font-bold">💀 MORTE REAL</span>
          </div>
        </div>

        {/* Área de Batalha */}
        <div className="grid lg:grid-cols-12 gap-4">
          {/* Avatares - Coluna Principal */}
          <div className="lg:col-span-8">
            <div className="grid grid-cols-2 gap-6">
              {/* SEU AVATAR */}
              <div className={`bg-slate-900 border-4 rounded-lg p-6 transition-all ${
                ehMeuTurno && !batalhaConcluida ? 'border-cyan-500 shadow-lg shadow-cyan-500/50' : 'border-slate-700'
              }`}>
                <div className="text-center mb-4">
                  <h3 className="text-2xl font-black text-cyan-400 mb-1">
                    {dadosPartida.avatarJogador.nome}
                  </h3>
                  <div className="text-sm text-gray-400">VOCÊ</div>
                </div>

                {/* Avatar Visual */}
                <div className="bg-gradient-to-b from-slate-950/50 to-slate-800 rounded-lg p-6 mb-4 flex justify-center">
                  <AvatarSVG avatar={dadosPartida.avatarJogador} tamanho={220} />
                </div>
                <div className="text-center mb-4">
                  <div className="text-yellow-400 text-sm font-bold">Nível {dadosPartida.avatarJogador.nivel}</div>
                </div>

                {/* HP Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">HP</span>
                    <span className="text-white font-bold">{jogadorHP} / {jogadorHPMax}</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-4 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        hpJogadorPercent > 50 ? 'bg-green-500' :
                        hpJogadorPercent > 25 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${hpJogadorPercent}%` }}
                    />
                  </div>
                </div>

                {/* Energia Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">Energia</span>
                    <span className="text-cyan-400 font-bold">{jogadorEnergia} / 100</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div
                      className="bg-cyan-500 h-full transition-all duration-300"
                      style={{ width: `${jogadorEnergia}%` }}
                    />
                  </div>
                </div>

                {/* Exaustão Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">Exaustão</span>
                    <span className={`font-bold ${
                      (dadosPartida?.avatarJogador?.exaustao || 0) >= 80 ? 'text-red-500' :
                      (dadosPartida?.avatarJogador?.exaustao || 0) >= 60 ? 'text-orange-500' :
                      (dadosPartida?.avatarJogador?.exaustao || 0) >= 40 ? 'text-yellow-500' : 'text-gray-400'
                    }`}>{dadosPartida?.avatarJogador?.exaustao || 0}</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div
                      className={`h-full transition-all duration-300 ${
                        (dadosPartida?.avatarJogador?.exaustao || 0) >= 80 ? 'bg-red-500' :
                        (dadosPartida?.avatarJogador?.exaustao || 0) >= 60 ? 'bg-orange-500' :
                        (dadosPartida?.avatarJogador?.exaustao || 0) >= 40 ? 'bg-yellow-500' : 'bg-gray-600'
                      }`}
                      style={{ width: `${dadosPartida?.avatarJogador?.exaustao || 0}%` }}
                    />
                  </div>
                </div>

                {/* Experiência Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">Experiência</span>
                    <span className="text-purple-400 font-bold">{dadosPartida?.avatarJogador?.experiencia || 0} XP</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-full transition-all duration-300"
                      style={{ width: `${((dadosPartida?.avatarJogador?.experiencia || 0) / 100) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Status */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-800 rounded p-2 text-center">
                    <div className="text-gray-400">Defesa</div>
                    <div className="text-blue-400 font-bold">{jogadorDefesa}</div>
                  </div>
                  <div className="bg-slate-800 rounded p-2 text-center">
                    <div className="text-gray-400">Elemento</div>
                    <div className="text-purple-400 font-bold">{dadosPartida.avatarJogador.elemento}</div>
                  </div>
                </div>
              </div>

              {/* AVATAR IA */}
              <div className={`bg-slate-900 border-4 rounded-lg p-6 transition-all ${
                !ehMeuTurno && !batalhaConcluida ? 'border-orange-500 shadow-lg shadow-orange-500/50' : 'border-slate-700'
              }`}>
                <div className="text-center mb-4">
                  <h3 className="text-2xl font-black text-orange-400 mb-1">
                    {dadosPartida.nomeOponente}
                  </h3>
                  <div className="text-sm text-gray-400">{dadosPartida.caçadorOponente}</div>
                </div>

                {/* Avatar Visual */}
                <div className="bg-gradient-to-b from-slate-950/50 to-slate-800 rounded-lg p-6 mb-4 flex justify-center relative">
                  <AvatarSVG avatar={dadosPartida.avatarOponente} tamanho={220} />
                  {iaPensando && !iaFugiu && (
                    <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                      <div className="text-orange-400 animate-pulse text-lg font-bold">⚡ Pensando...</div>
                    </div>
                  )}
                  {iaFugiu && (
                    <div className="absolute inset-0 bg-black/80 rounded-lg flex items-center justify-center">
                      <div className="text-yellow-400 text-2xl font-bold">🏃 FUGIU!</div>
                    </div>
                  )}
                </div>
                <div className="text-center mb-4">
                  <div className="text-yellow-400 text-sm font-bold">Nível {dadosPartida.avatarOponente.nivel}</div>
                </div>

                {/* HP Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">HP</span>
                    <span className="text-white font-bold">{iaHP} / {iaHPMax}</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-4 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        hpIAPercent > 50 ? 'bg-green-500' :
                        hpIAPercent > 25 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${hpIAPercent}%` }}
                    />
                  </div>
                </div>

                {/* Energia Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">Energia</span>
                    <span className="text-orange-400 font-bold">{iaEnergia} / 100</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div
                      className="bg-orange-500 h-full transition-all duration-300"
                      style={{ width: `${iaEnergia}%` }}
                    />
                  </div>
                </div>

                {/* Status */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-800 rounded p-2 text-center">
                    <div className="text-gray-400">Defesa</div>
                    <div className="text-blue-400 font-bold">{iaDefesa}</div>
                  </div>
                  <div className="bg-slate-800 rounded p-2 text-center">
                    <div className="text-gray-400">Elemento</div>
                    <div className="text-purple-400 font-bold">{dadosPartida.avatarOponente.elemento}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Ações - Coluna Lateral */}
          <div className="lg:col-span-4">
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 sticky top-4">
              <h3 className="text-xl font-bold text-center mb-4 text-cyan-400">
                {batalhaConcluida ? 'BATALHA FINALIZADA' : ehMeuTurno ? 'SEU TURNO' : 'TURNO DO OPONENTE'}
              </h3>

              {!batalhaConcluida && ehMeuTurno && (
                <div className="space-y-2">
                  {/* Ataque Básico */}
                  <button
                    onClick={atacar}
                    className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg transition-all"
                  >
                    ⚔️ ATACAR
                  </button>

                  {/* Defender */}
                  <button
                    onClick={defender}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-all"
                  >
                    🛡️ DEFENDER
                  </button>

                  {/* Habilidades */}
                  <div className="border-t border-slate-700 pt-2 mt-2">
                    <div className="text-sm text-gray-400 mb-2">Habilidades:</div>
                    {dadosPartida.avatarJogador.habilidades.map((hab, idx) => {
                      const cooldown = cooldownsJogador[hab.nome] || 0;
                      const semEnergia = jogadorEnergia < (hab.custo_energia || 0);

                      return (
                        <button
                          key={idx}
                          onClick={() => usarHabilidade(hab)}
                          disabled={cooldown > 0 || semEnergia}
                          className={`w-full text-left px-3 py-2 rounded mb-1 transition-all ${
                            cooldown > 0 || semEnergia
                              ? 'bg-slate-800 text-gray-600 cursor-not-allowed'
                              : 'bg-purple-600 hover:bg-purple-500 text-white'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-sm">{hab.nome}</span>
                            <span className="text-xs">
                              {cooldown > 0 ? `CD: ${cooldown}` : `⚡${hab.custo_energia || 0}`}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Render/Fuga */}
                  <div className="border-t border-slate-700 pt-2 mt-2 grid grid-cols-2 gap-2">
                    <button
                      onClick={tentarFugir}
                      className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 rounded text-sm"
                    >
                      🏃 FUGIR
                    </button>
                    <button
                      onClick={tentarRender}
                      className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 rounded text-sm"
                    >
                      🏳️ RENDER
                    </button>
                  </div>
                </div>
              )}

              {batalhaConcluida && resultado && (
                <div className="space-y-3">
                  <div className={`text-center text-2xl font-black ${
                    resultado.vitoria ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {resultado.vitoria ? '🎉 VITÓRIA!' : '💀 DERROTA'}
                  </div>

                  <div className="bg-slate-800 rounded p-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Fama:</span>
                      <span className={resultado.famaGanha >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {resultado.famaGanha >= 0 ? '+' : ''}{resultado.famaGanha}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Vínculo:</span>
                      <span className="text-purple-400">+{resultado.vinculoGanho}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Exaustão:</span>
                      <span className="text-yellow-400">+{resultado.exaustaoGanha}%</span>
                    </div>
                    {resultado.avatarMorreu && (
                      <div className="text-red-400 text-center font-bold mt-2">
                        💀 SEU AVATAR MORREU
                      </div>
                    )}
                  </div>

                  <button
                    onClick={voltarArena}
                    className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-lg"
                  >
                    Voltar à Arena
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Log de Batalha */}
        <div className="mt-6 bg-slate-900 border border-slate-700 rounded-lg p-4">
          <h3 className="text-lg font-bold text-cyan-400 mb-3">📜 Log de Batalha (Última ação em cima)</h3>
          <div
            ref={logRef}
            className="bg-black rounded p-3 h-40 overflow-y-auto font-mono text-sm space-y-1"
          >
            {[...logBatalha].reverse().map((log, idx) => (
              <div key={idx} className={log.cor}>
                {log.mensagem}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal Render */}
      {mostrarModalRender && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-yellow-500 rounded-lg p-6 max-w-md">
            <h3 className="text-2xl font-bold text-yellow-400 mb-4">🏳️ Render-se?</h3>
            <p className="text-gray-300 mb-4">
              Você perderá metade da fama apostada ({Math.floor(dadosPartida.famaApostada / 2)}),
              mas seu avatar sobreviverá.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setMostrarModalRender(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 rounded"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarRender}
                className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 rounded"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Fuga */}
      {mostrarModalFuga && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-orange-500 rounded-lg p-6 max-w-md">
            <h3 className="text-2xl font-bold text-orange-400 mb-4">🏃 Fugir da Batalha?</h3>
            <p className="text-gray-300 mb-2">
              Chance de fuga: <span className="text-cyan-400 font-bold">{calcularChancesFuga(dadosPartida.avatarJogador)}%</span>
            </p>
            <p className="text-gray-300 mb-4">
              Se falhar, você sofrerá {Math.floor(jogadorHPMax * 0.1)} de dano e perderá o turno!
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setMostrarModalFuga(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 rounded"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarFuga}
                className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-bold py-2 rounded"
              >
                Tentar Fugir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
