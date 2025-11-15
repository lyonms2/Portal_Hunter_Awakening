# 🎮 Guia de Integração - PvP Ao Vivo na Página de Batalha

## ⚠️ IMPORTANTE
Este guia mostra como integrar o sistema de PvP ao vivo na página de batalha (`/app/arena/batalha/page.jsx`) **SEM quebrar o modo treino existente**.

---

## 📋 Pré-requisitos

1. ✅ SQL executado no Supabase (`pvp_matchmaking_queue.sql`)
2. ✅ APIs de PvP criadas (`/api/pvp/battle/*`)
3. ✅ Biblioteca `battleSync.js` implementada
4. ✅ Matchmaking funcionando

---

## 🔧 Passo 1: Adicionar Imports

No topo do arquivo `/app/arena/batalha/page.jsx`, adicione:

```javascript
import { BattleSyncManager, enviarAcaoPvP, buscarEstadoSala, marcarComoPronto, notificarDesconexao } from "@/lib/pvp/battleSync";
```

---

## 🔧 Passo 2: Adicionar Estados para PvP Ao Vivo

Dentro do componente `BatalhaContent()`, após os estados existentes, adicione:

```javascript
// Estados PvP Ao Vivo (adicionar após linha 53)
const [pvpAoVivo, setPvpAoVivo] = useState(false);
const [matchId, setMatchId] = useState(null);
const [playerNumber, setPlayerNumber] = useState(null); // 1 ou 2
const [isYourTurn, setIsYourTurn] = useState(false);
const [syncManager, setSyncManager] = useState(null);
const [aguardandoOponente, setAguardandoOponente] = useState(false);
const [oponenteDesconectou, setOponenteDesconectou] = useState(false);
```

---

## 🔧 Passo 3: Detectar PvP Ao Vivo no useEffect Inicial

Modifique o useEffect que carrega a batalha (linha 55-123) para detectar PvP ao vivo:

```javascript
useEffect(() => {
  let batalhaJSON;

  if (modoPvP) {
    batalhaJSON = sessionStorage.getItem('batalha_pvp_dados');
    if (batalhaJSON) {
      const dados = JSON.parse(batalhaJSON);
      setDadosPvP(dados);

      // NOVO: Detectar PvP ao vivo
      const isPvpRealTime = dados.pvpAoVivo === true;
      setPvpAoVivo(isPvpRealTime);

      if (isPvpRealTime) {
        setMatchId(dados.matchId);
        // Inicializar sala de batalha
        inicializarPvPAoVivo(dados);
      }

      // ... resto do código de construção da batalha ...
    }
  } else {
    // Modo treino - sem mudanças
  }

  // ... resto do useEffect ...
}, [router, modoPvP]);
```

---

## 🔧 Passo 4: Função de Inicialização de PvP Ao Vivo

Adicione esta função antes de `executarAcao`:

```javascript
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
```

---

## 🔧 Passo 5: Callbacks de Sincronização

Adicione estas funções de callback:

```javascript
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
      finalizarBatalha(estado, 'jogador');
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
      finalizarBatalha(estado, 'inimigo');
    }, 1000);
  }
};
```

---

## 🔧 Passo 6: Modificar executarAcao()

Substitua a função `executarAcao` (linha 150) por esta versão que suporta PvP ao vivo:

```javascript
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
  setTempoRestante(30);

  // Animação da ação
  setAnimacaoAcao({ tipo, alvo: 'inimigo' });
  setTimeout(() => setAnimacaoAcao(null), 800);

  try {
    const novoEstado = { ...estado };

    // === PROCESSAR AÇÃO DO JOGADOR ===
    const resultado = processarAcaoJogador(novoEstado, { tipo, habilidadeIndex });

    adicionarLog(`🎯 ${resultado.mensagem}`);

    if (resultado.energiaGasta > 0) {
      adicionarLog(`⚡ -${resultado.energiaGasta} energia`);
    }

    if (resultado.dano > 0) {
      adicionarLog(`💥 ${resultado.dano} de dano causado`);
    }

    if (resultado.cura > 0) {
      adicionarLog(`💚 +${resultado.cura} HP recuperado`);
    }

    // Verificar vitória
    const vitoria = verificarVitoria(novoEstado);

    // === MODO PVP AO VIVO ===
    if (pvpAoVivo && matchId) {
      const userData = JSON.parse(localStorage.getItem('user'));

      // Enviar ação para servidor
      await enviarAcaoPvP(matchId, userData.id, {
        tipo,
        dano: resultado.dano || 0,
        cura: resultado.cura || 0,
        critico: resultado.critico || false,
        energiaGasta: resultado.energiaGasta || 0,
        hp_jogador_atual: novoEstado.jogador.hp_atual,
        hp_inimigo_atual: novoEstado.inimigo.hp_atual,
        resultado: vitoria.fim ? 'vitoria' : null
      });

      // Atualizar estado local
      setEstado(novoEstado);
      setIsYourTurn(false); // Agora é turno do oponente
      setAguardandoOponente(true);
      adicionarLog('⏳ Aguardando oponente...');

      if (vitoria.fim) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        finalizarBatalha(novoEstado, vitoria.vencedor);
      }

      return;
    }

    // === MODO TREINO (IA LOCAL) ===
    if (vitoria.fim) {
      finalizarBatalha(novoEstado, vitoria.vencedor);
      return;
    }

    setEstado(novoEstado);

    // Turno da IA (apenas modo treino)
    await new Promise(resolve => setTimeout(resolve, 1000));

    setTurnoIA(true);
    adicionarLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    adicionarLog('🤖 Turno do oponente...');

    const mensagemIA = getMensagemIA({ tipo: 'habilidade' }, novoEstado);
    adicionarLog(mensagemIA);

    await new Promise(resolve => setTimeout(resolve, 1500));

    const resultadoIA = processarTurnoIA(novoEstado);
    adicionarLog(`💥 ${resultadoIA.mensagem}`);

    if (resultadoIA.dano > 0) {
      setAnimacaoDano({
        tipo: 'jogador',
        valor: resultadoIA.dano,
        critico: resultadoIA.critico || false
      });
      setTimeout(() => setAnimacaoDano(null), 1500);
    }

    const vitoriaIA = verificarVitoria(novoEstado);

    if (vitoriaIA.fim) {
      finalizarBatalha(novoEstado, vitoriaIA.vencedor);
      return;
    }

    // Próxima rodada
    novoEstado.rodada++;
    novoEstado.turno_atual = 'jogador';

    const turnoJogador = iniciarTurno(novoEstado.jogador, novoEstado);
    const turnoInimigo = iniciarTurno(novoEstado.inimigo, novoEstado);

    // ... logs de efeitos contínuos ...

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
```

---

## 🔧 Passo 7: Cleanup ao Sair

Adicione cleanup quando componente desmontar:

```javascript
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
```

---

## 🔧 Passo 8: Indicadores Visuais

Adicione indicador de turno no header (linha 602-608):

```javascript
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
```

---

## 🎯 Resultado Final

Com estas modificações, a página de batalha suportará:

✅ **Modo Treino** (contra IA local) - funciona como antes
✅ **PvP Ao Vivo** (contra jogadores reais em tempo real):
   - Turnos alternados sincronizados
   - Ações do oponente em tempo real
   - Detecção de desconexão
   - Vitória por W.O.
   - Indicadores visuais de turno

---

## 🐛 Troubleshooting

### Problema: "Não é seu turno" aparece sempre
- Verifique se `playerNumber` está sendo setado corretamente
- Verifique se `isYourTurn` está sendo atualizado no callback

### Problema: Ações do oponente não aparecem
- Verifique se `BattleSyncManager` está fazendo polling (console.log)
- Verifique se o `matchId` está correto
- Verifique se a API `/api/pvp/battle/room` está retornando dados

### Problema: Batalha trava após primeira ação
- Verifique se `setIsYourTurn(false)` está sendo chamado após enviar ação
- Verifique se callback `handleOpponentAction` está setando `setIsYourTurn(true)`

---

**Versão:** 1.0
**Data:** 2025-01
**Para:** Portal Hunter Awakening
