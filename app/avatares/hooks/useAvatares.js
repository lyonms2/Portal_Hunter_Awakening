import { useState } from 'react';

/**
 * Hook para gerenciar operações com avatares
 */
export function useAvatares(userId) {
  const [avatares, setAvatares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ativando, setAtivando] = useState(false);

  /**
   * Carrega lista de avatares do jogador
   */
  const carregarAvatares = async (userIdParam) => {
    const id = userIdParam || userId;
    try {
      setLoading(true);
      const response = await fetch(`/api/meus-avatares?userId=${id}&t=${Date.now()}`);
      const data = await response.json();

      if (response.ok) {
        setAvatares(data.avatares);
      } else {
        console.error("Erro ao carregar avatares:", data.message);
      }
    } catch (error) {
      console.error("Erro ao carregar avatares:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Ativa um avatar
   */
  const ativarAvatar = async (avatarId, onSuccess, onError) => {
    if (ativando) return;

    setAtivando(true);

    try {
      const response = await fetch("/api/meus-avatares", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, avatarId }),
      });

      const data = await response.json();

      if (response.ok) {
        await carregarAvatares(userId);
        onSuccess?.(data);
      } else {
        onError?.(data.message || 'Erro ao ativar avatar');
      }
    } catch (error) {
      console.error("Erro ao ativar avatar:", error);
      onError?.('Erro de conexão ao ativar avatar');
    } finally {
      setAtivando(false);
    }
  };

  /**
   * Sacrifica um avatar
   */
  const sacrificarAvatar = async (avatar, onSuccess, onError) => {
    try {
      const response = await fetch("/api/sacrificar-avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          avatarId: avatar.id
        }),
      });

      const data = await response.json();

      if (response.ok) {
        await carregarAvatares(userId);
        onSuccess?.(avatar);
      } else {
        onError?.(data.message || 'Erro ao sacrificar avatar');
      }
    } catch (error) {
      console.error("Erro ao sacrificar avatar:", error);
      onError?.('Erro de conexão');
    }
  };

  /**
   * Coloca avatar à venda
   */
  const venderAvatar = async (avatarId, precoMoedas, precoFragmentos, onSuccess, onError) => {
    try {
      const response = await fetch("/api/mercado/vender", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          avatarId,
          precoMoedas,
          precoFragmentos
        }),
      });

      const data = await response.json();

      if (response.ok) {
        await carregarAvatares(userId);
        onSuccess?.(precoMoedas, precoFragmentos);
      } else {
        onError?.(data.message || 'Erro ao colocar avatar à venda');
      }
    } catch (error) {
      console.error("Erro ao vender avatar:", error);
      onError?.('Erro de conexão');
    }
  };

  /**
   * Cancela venda de um avatar
   */
  const cancelarVenda = async (avatar, onSuccess, onError) => {
    try {
      const response = await fetch("/api/mercado/vender", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          avatarId: avatar.id
        }),
      });

      const data = await response.json();

      if (response.ok) {
        await carregarAvatares(userId);
        onSuccess?.();
      } else {
        onError?.(data.message || 'Erro ao cancelar venda');
      }
    } catch (error) {
      console.error("Erro ao cancelar venda:", error);
      onError?.('Erro de conexão');
    }
  };

  return {
    avatares,
    setAvatares,
    loading,
    ativando,
    carregarAvatares,
    ativarAvatar,
    sacrificarAvatar,
    venderAvatar,
    cancelarVenda
  };
}
