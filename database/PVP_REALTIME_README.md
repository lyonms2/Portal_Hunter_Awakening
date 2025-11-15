# 🎮 Sistema de PvP em Tempo Real

## 📋 Visão Geral

Este sistema implementa batalhas PvP **síncronas e em tempo real** onde dois jogadores controlam seus avatares simultaneamente, vendo as ações um do outro instantaneamente.

---

## 🗄️ Estrutura do Banco de Dados

### 1. **pvp_matchmaking_queue**
Fila de jogadores procurando partida.

```sql
- user_id: ID do usuário
- avatar_id: ID do avatar ativo
- nivel: Nível do avatar
- poder_total: Soma de STR+AGI+RES+FOC
- fama: Pontos de fama do jogador
- status: 'waiting', 'matched', 'in_battle'
- match_id: ID da partida quando encontrado
- expires_at: Expira após 2 minutos
```

### 2. **pvp_battle_rooms**
Salas de batalha ativas entre 2 jogadores.

```sql
- id: UUID da sala (matchId)
- player1_user_id, player2_user_id: IDs dos jogadores
- player1_avatar_id, player2_avatar_id: IDs dos avatares
- player1_ready, player2_ready: Se estão prontos
- player1_connected, player2_connected: Status de conexão
- player1_last_action, player2_last_action: Último heartbeat
- status: 'waiting', 'active', 'finished', 'cancelled'
- current_turn: Turno atual (incrementa a cada ação)
- current_player: 1 ou 2 (quem pode jogar)
- winner_user_id: Vencedor ao final
- battle_data: JSON com histórico de ações
- expires_at: Expira após 15 minutos
```

---

## 🔄 Fluxo Completo de uma Batalha PvP

### **1. Matchmaking**

```javascript
// Jogador entra na fila
POST /api/pvp/queue/join
{
  userId: "uuid",
  avatarId: 123,
  nivel: 10,
  poderTotal: 180, // STR+AGI+RES+FOC
  fama: 1500
}

// Polling para verificar match (a cada 2s)
GET /api/pvp/queue/check?userId=uuid

// Resposta quando encontra match:
{
  success: true,
  matched: true,
  matchId: "uuid-da-sala",
  opponent: {
    userId: "uuid",
    nome: "NomeOponente",
    avatar: { ...dados do avatar... }
  }
}
```

### **2. Entrada na Sala de Batalha**

```javascript
// Ambos jogadores entram na página /arena/batalha?modo=pvp
// sessionStorage contém:
{
  tipo: 'pvp',
  pvpAoVivo: true,
  matchId: "uuid-da-sala",
  avatarJogador: { ...stats... },
  avatarOponente: { ...stats... },
  oponenteId: "uuid"
}

// Buscar estado inicial da sala
GET /api/pvp/battle/room?matchId=uuid&userId=uuid

// Resposta:
{
  success: true,
  room: {
    id: "uuid",
    status: "waiting", // ou "active"
    currentTurn: 1,
    currentPlayer: 1, // 1 ou 2
    battleData: { actions: [], rounds: [] }
  },
  playerNumber: 1, // Você é player 1 ou 2?
  isYourTurn: true, // É seu turno?
  player1: { ...dados... },
  player2: { ...dados... }
}
```

### **3. Marcar como Pronto**

```javascript
// Cada jogador marca como pronto
POST /api/pvp/battle/room
{
  matchId: "uuid",
  userId: "uuid",
  action: "ready"
}

// Quando AMBOS estão prontos:
// → status muda para "active"
// → started_at é setado
// → Batalha começa!
```

### **4. Executar Ações (Turnos)**

```javascript
// Jogador executa ação (ataque, defesa, habilidade, esperar)
POST /api/pvp/battle/action
{
  matchId: "uuid",
  userId: "uuid",
  action: {
    tipo: "ataque", // ou "defesa", "habilidade", "esperar"
    dano: 45,
    critico: false,
    energiaGasta: 10,
    buffs: [],
    debuffs: [],
    hp_jogador_atual: 180,
    hp_inimigo_atual: 165,
    resultado: null // ou "vitoria"
  }
}

// Resposta:
{
  success: true,
  nextPlayer: 2, // Agora é turno do player 2
  currentTurn: 2,
  battleFinished: false
}
```

### **5. Polling para Ver Ações do Oponente**

```javascript
// Usar BattleSyncManager para polling automático
import { BattleSyncManager } from '@/lib/pvp/battleSync';

const syncManager = new BattleSyncManager(
  matchId,
  userId,
  (roomState) => {
    // Callback quando estado muda
    console.log('Estado atualizado:', roomState);
  },
  (opponentAction) => {
    // Callback quando oponente faz ação
    console.log('Oponente fez:', opponentAction);
    // Atualizar interface
  }
);

syncManager.startPolling(2000); // A cada 2 segundos

// Cleanup ao sair
syncManager.cleanup();
```

### **6. Finalizar Batalha**

```javascript
// Quando alguém vence:
POST /api/pvp/battle/action
{
  matchId: "uuid",
  userId: "uuid",
  action: {
    tipo: "ataque",
    dano: 50,
    hp_inimigo_atual: 0,
    resultado: "vitoria" // <-- Flag de vitória
  }
}

// Sala atualiza:
// → status = "finished"
// → winner_user_id = userId do vencedor
// → finished_at = timestamp
```

### **7. Desconexão / W.O.**

```javascript
// Se um jogador desconectar:
POST /api/pvp/battle/room
{
  matchId: "uuid",
  userId: "uuid",
  action: "disconnect"
}

// → Sala cancela
// → Oponente ganha por W.O.
// → winner_user_id = oponente
```

---

## 🎯 Integração na Página de Batalha

### **Detectar PvP ao Vivo**

```javascript
const dadosPvP = JSON.parse(sessionStorage.getItem('batalha_pvp_dados'));
const isPvPAoVivo = dadosPvP?.pvpAoVivo === true;
const matchId = dadosPvP?.matchId;
```

### **Inicializar Sincronização**

```javascript
useEffect(() => {
  if (!isPvPAoVivo || !matchId) return;

  // Buscar estado inicial
  const initBattle = async () => {
    const roomState = await buscarEstadoSala(matchId, userId);

    // Determinar qual player você é
    setPlayerNumber(roomState.playerNumber);
    setIsYourTurn(roomState.isYourTurn);

    // Marcar como pronto
    await marcarComoPronto(matchId, userId);
  };

  initBattle();

  // Iniciar polling
  const sync = new BattleSyncManager(
    matchId,
    userId,
    handleRoomUpdate,
    handleOpponentAction
  );
  sync.startPolling(2000);

  return () => sync.cleanup();
}, [isPvPAoVivo, matchId]);
```

### **Modificar executarAcao()**

```javascript
const executarAcao = async (tipo, habilidadeIndex = null) => {
  if (isPvPAoVivo) {
    // MODO PVP AO VIVO

    // Verificar se é seu turno
    if (!isYourTurn) {
      adicionarLog('⚠️ Aguarde seu turno!');
      return;
    }

    // Processar ação localmente (calcular dano, etc)
    const resultado = processarAcaoJogador(estado, { tipo, habilidadeIndex });

    // Verificar vitória
    const vitoria = verificarVitoria(novoEstado);

    // Enviar para servidor
    await enviarAcaoPvP(matchId, userId, {
      tipo,
      dano: resultado.dano,
      critico: resultado.critico,
      energiaGasta: resultado.energiaGasta,
      hp_jogador_atual: novoEstado.jogador.hp_atual,
      hp_inimigo_atual: novoEstado.inimigo.hp_atual,
      resultado: vitoria.fim ? 'vitoria' : null
    });

    // Atualizar estado local
    setEstado(novoEstado);
    setIsYourTurn(false); // Agora é turno do oponente

    if (vitoria.fim) {
      finalizarBatalha(novoEstado, vitoria.vencedor);
    }

  } else {
    // MODO TREINO (IA local)
    // ... código original ...
  }
};
```

### **Callback de Ação do Oponente**

```javascript
const handleOpponentAction = (actionData) => {
  const action = actionData.action;

  // Adicionar ao log
  adicionarLog(`🔴 Oponente usou ${action.tipo}!`);

  if (action.dano > 0) {
    adicionarLog(`💥 Você recebeu ${action.dano} de dano`);

    // Animação de dano
    setAnimacaoDano({
      tipo: 'jogador',
      valor: action.dano,
      critico: action.critico
    });
  }

  // Atualizar estado local com dados do servidor
  setEstado(prev => ({
    ...prev,
    jogador: {
      ...prev.jogador,
      hp_atual: action.hp_inimigo_atual // Do ponto de vista do oponente, você é o inimigo
    },
    inimigo: {
      ...prev.inimigo,
      hp_atual: action.hp_jogador_atual
    }
  }));

  // Agora é SEU turno
  setIsYourTurn(true);

  // Verificar vitória
  if (action.resultado === 'vitoria') {
    finalizarBatalha(estado, 'inimigo');
  }
};
```

---

## 🚨 Tratamento de Erros

### **Oponente Desconectou**

```javascript
const handleRoomUpdate = (roomState) => {
  const opponent = roomState.playerNumber === 1
    ? roomState.player2
    : roomState.player1;

  if (!opponent.connected) {
    mostrarModal({
      titulo: '🏆 Vitória por W.O.!',
      mensagem: 'Seu oponente desconectou. Você venceu!'
    });

    finalizarBatalha(estado, 'jogador');
  }
};
```

### **Timeout de Turno**

```javascript
useEffect(() => {
  if (!isPvPAoVivo || !isYourTurn) return;

  const timeout = setTimeout(() => {
    // 30 segundos sem ação - executar "esperar" automaticamente
    executarAcao('esperar');
  }, 30000);

  return () => clearTimeout(timeout);
}, [isYourTurn, isPvPAoVivo]);
```

---

## 📊 Limpeza e Manutenção

### **Limpar Salas Expiradas**

Execute periodicamente (cron job):

```sql
SELECT cleanup_expired_queue_entries(); -- Limpa fila
SELECT cleanup_expired_battle_rooms();  -- Limpa salas
```

### **Monitorar Salas Ativas**

```sql
SELECT
  id,
  status,
  created_at,
  EXTRACT(EPOCH FROM (NOW() - player1_last_action)) as p1_inactive_seconds,
  EXTRACT(EPOCH FROM (NOW() - player2_last_action)) as p2_inactive_seconds
FROM pvp_battle_rooms
WHERE status = 'active'
ORDER BY created_at DESC;
```

---

## ✅ Checklist de Implementação

- [x] Executar `/database/pvp_matchmaking_queue.sql` no Supabase
- [x] APIs criadas (`/api/pvp/queue/*`, `/api/pvp/battle/*`)
- [x] Biblioteca `battleSync.js` implementada
- [ ] Modificar página `/app/arena/batalha/page.jsx`:
  - [ ] Detectar `pvpAoVivo` flag
  - [ ] Integrar `BattleSyncManager`
  - [ ] Modificar `executarAcao()` para enviar ações ao servidor
  - [ ] Adicionar callback de ações do oponente
  - [ ] Bloquear ações quando não é seu turno
  - [ ] Mostrar indicador de "Aguardando oponente..."
- [ ] Testar com 2 contas diferentes

---

## 🎮 Experiência do Jogador

**Fluxo Ideal:**

1. Jogador 1 clica em "Procurar Partida"
2. Sistema busca oponente por poder do avatar
3. Match encontrado! Ambos veem "OPONENTE ENCONTRADO!"
4. Redirecionam para sala de batalha
5. Ambos marcam "Pronto"
6. Batalha começa! Player 1 começa
7. Player 1 ataca → vê dano → turno passa
8. Player 2 vê "Oponente atacou! -45 HP" → agora é sua vez
9. Player 2 usa habilidade → vê efeito → turno passa
10. Continua até alguém vencer
11. Ambos veem resultado final
12. Atualizam fama, XP, recompensas

---

**Criado para:** Portal Hunter Awakening
**Data:** 2025-01
**Versão:** 1.0
