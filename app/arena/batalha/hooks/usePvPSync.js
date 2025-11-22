import { useState, useEffect } from 'react';
import { BattleSyncManager, buscarEstadoSala, marcarComoPronto, notificarDesconexao } from '@/lib/pvp/battleSync';

export function usePvPSync({
  matchId,
  enabled,
  onRoomStateUpdate,
  onOpponentAction,
  onError
}) {
  const [syncManager, setSyncManager] = useState(null);
  const [playerNumber, setPlayerNumber] = useState(null);
  const [isYourTurn, setIsYourTurn] = useState(false);
  const [aguardandoOponente, setAguardandoOponente] = useState(false);
  const [oponenteDesconectou, setOponenteDesconectou] = useState(false);

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

      // Iniciar sincronizacao
      const sync = new BattleSyncManager(
        dados.matchId,
        userData.id,
        (roomState) => {
          // Verificar se oponente desconectou
          const opponent = roomState.playerNumber === 1 ? roomState.player2 : roomState.player1;

          if (!opponent.connected) {
            setOponenteDesconectou(true);
          }

          // Atualizar turno
          setIsYourTurn(roomState.isYourTurn);
          setAguardandoOponente(!roomState.isYourTurn && roomState.room.status === 'active');

          if (onRoomStateUpdate) {
            onRoomStateUpdate(roomState);
          }
        },
        onOpponentAction
      );

      sync.startPolling(2000); // Poll a cada 2 segundos
      setSyncManager(sync);

      return {
        playerNumber: roomState.playerNumber,
        isYourTurn: roomState.isYourTurn
      };

    } catch (error) {
      console.error('Erro ao inicializar PvP ao vivo:', error);
      if (onError) {
        onError(error);
      }
    }
  };

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (syncManager) {
        syncManager.cleanup();
      }

      // Notificar desconexao se PvP ao vivo
      if (enabled && matchId) {
        const userData = JSON.parse(localStorage.getItem('user'));
        if (userData) {
          notificarDesconexao(matchId, userData.id);
        }
      }
    };
  }, [syncManager, enabled, matchId]);

  return {
    syncManager,
    playerNumber,
    isYourTurn,
    setIsYourTurn,
    aguardandoOponente,
    setAguardandoOponente,
    oponenteDesconectou,
    inicializarPvPAoVivo
  };
}
