/**
 * Sistema de sincronização de batalhas PvP em tempo real com Firestore
 * Substitui polling por real-time listeners para latência ultra-baixa
 */

import { db } from '@/lib/firebase/config';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Envia ação do jogador para o servidor
 */
export async function enviarAcaoPvP(matchId, userId, action) {
  try {
    const response = await fetch('/api/pvp/battle/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        matchId,
        userId,
        action
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erro ao enviar ação');
    }

    return data;
  } catch (error) {
    console.error('Erro ao enviar ação PvP:', error);
    throw error;
  }
}

/**
 * Busca estado atual da sala de batalha (fallback, preferir listener)
 */
export async function buscarEstadoSala(matchId, userId) {
  try {
    const response = await fetch(
      `/api/pvp/battle/room?matchId=${matchId}&userId=${userId}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erro ao buscar estado da sala');
    }

    return data;
  } catch (error) {
    console.error('Erro ao buscar estado da sala:', error);
    throw error;
  }
}

/**
 * Marca jogador como pronto
 */
export async function marcarComoPronto(matchId, userId) {
  try {
    const response = await fetch('/api/pvp/battle/room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        matchId,
        userId,
        action: 'ready'
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erro ao marcar como pronto');
    }

    return data;
  } catch (error) {
    console.error('Erro ao marcar como pronto:', error);
    throw error;
  }
}

/**
 * Notifica desconexão
 */
export async function notificarDesconexao(matchId, userId) {
  try {
    const response = await fetch('/api/pvp/battle/room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        matchId,
        userId,
        action: 'disconnect'
      })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao notificar desconexão:', error);
    return null;
  }
}

/**
 * Gerenciador de sincronização em tempo real com Firestore
 * Usa onSnapshot para updates instantâneos (sem polling!)
 */
export class BattleSyncManagerFirestore {
  constructor(matchId, userId, onStateUpdate, onOpponentAction) {
    this.matchId = matchId;
    this.userId = userId;
    this.onStateUpdate = onStateUpdate;
    this.onOpponentAction = onOpponentAction;
    this.unsubscribe = null;
    this.heartbeatInterval = null;
    this.lastActionIndex = 0;
  }

  /**
   * Inicia listener em tempo real (substitui polling)
   * Firestore envia atualizações instantaneamente quando há mudanças!
   */
  startRealtimeListener() {
    const roomRef = doc(db, 'pvp_battle_rooms', this.matchId);

    console.log('🔥 Iniciando listener em tempo real para sala:', this.matchId);

    // onSnapshot recebe atualizações em TEMPO REAL
    this.unsubscribe = onSnapshot(
      roomRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          console.warn('Sala não encontrada');
          return;
        }

        const roomData = { id: snapshot.id, ...snapshot.data() };
        console.log('📡 Atualização em tempo real recebida:', roomData);

        // Callback de atualização de estado
        if (this.onStateUpdate) {
          this.onStateUpdate(roomData);
        }

        // Verificar novas ações do oponente
        const actions = roomData.battleData?.actions || [];
        if (actions.length > this.lastActionIndex) {
          const newActions = actions.slice(this.lastActionIndex);

          // Filtrar apenas ações do oponente
          const opponentActions = newActions.filter(
            action => action.userId !== this.userId
          );

          if (opponentActions.length > 0 && this.onOpponentAction) {
            opponentActions.forEach(action => {
              console.log('⚔️ Oponente fez ação:', action);
              this.onOpponentAction(action);
            });
          }

          this.lastActionIndex = actions.length;
        }
      },
      (error) => {
        console.error('❌ Erro no listener em tempo real:', error);
      }
    );

    // Iniciar heartbeat para mostrar que está conectado
    this.startHeartbeat();
  }

  /**
   * Heartbeat para manter conexão ativa (a cada 10s)
   * Atualiza timestamp de última ação do jogador
   */
  startHeartbeat() {
    this.heartbeatInterval = setInterval(async () => {
      try {
        const roomRef = doc(db, 'pvp_battle_rooms', this.matchId);

        // Determinar qual player somos
        const snapshot = await getDoc(roomRef);
        if (!snapshot.exists()) return;

        const data = snapshot.data();
        const isPlayer1 = data.player1_user_id === this.userId;
        const field = isPlayer1 ? 'player1_last_action' : 'player2_last_action';

        await updateDoc(roomRef, {
          [field]: serverTimestamp()
        });

        console.log('💓 Heartbeat enviado');
      } catch (error) {
        console.error('Erro no heartbeat:', error);
      }
    }, 10000); // 10 segundos
  }

  /**
   * Para heartbeat
   */
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Para listener em tempo real
   */
  stopRealtimeListener() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
      console.log('🔇 Listener em tempo real desconectado');
    }
  }

  /**
   * Limpa recursos
   */
  cleanup() {
    this.stopRealtimeListener();
    this.stopHeartbeat();

    // Notificar desconexão
    notificarDesconexao(this.matchId, this.userId);
  }
}

/**
 * Hook do lado do cliente para facilitar uso em React
 * IMPORTANTE: Import no cliente com 'use client'
 */
export function useBattleSyncFirestore(matchId, userId, callbacks) {
  if (typeof window === 'undefined') {
    return null; // SSR guard
  }

  const manager = new BattleSyncManagerFirestore(
    matchId,
    userId,
    callbacks.onStateUpdate,
    callbacks.onOpponentAction
  );

  return manager;
}
