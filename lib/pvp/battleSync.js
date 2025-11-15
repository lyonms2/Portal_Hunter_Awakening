/**
 * Sistema de sincronização de batalhas PvP em tempo real
 */

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
 * Busca estado atual da sala de batalha
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
 * Hook personalizado para sincronização de batalha PvP
 */
export class BattleSyncManager {
  constructor(matchId, userId, onStateUpdate, onOpponentAction) {
    this.matchId = matchId;
    this.userId = userId;
    this.onStateUpdate = onStateUpdate;
    this.onOpponentAction = onOpponentAction;
    this.pollingInterval = null;
    this.lastActionIndex = 0;
  }

  /**
   * Inicia polling para verificar ações do oponente
   */
  startPolling(intervalMs = 2000) {
    this.pollingInterval = setInterval(async () => {
      try {
        const estado = await buscarEstadoSala(this.matchId, this.userId);

        // Atualizar callback de estado
        if (this.onStateUpdate) {
          this.onStateUpdate(estado);
        }

        // Verificar novas ações do oponente
        const actions = estado.room.battleData?.actions || [];
        if (actions.length > this.lastActionIndex) {
          // Há novas ações
          const newActions = actions.slice(this.lastActionIndex);

          // Filtrar apenas ações do oponente
          const opponentActions = newActions.filter(
            action => action.userId !== this.userId
          );

          if (opponentActions.length > 0 && this.onOpponentAction) {
            opponentActions.forEach(action => {
              this.onOpponentAction(action);
            });
          }

          this.lastActionIndex = actions.length;
        }
      } catch (error) {
        console.error('Erro no polling:', error);
      }
    }, intervalMs);
  }

  /**
   * Para polling
   */
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  /**
   * Limpa recursos
   */
  cleanup() {
    this.stopPolling();
  }
}
