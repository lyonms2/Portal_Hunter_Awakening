import { useState, useMemo } from 'react';

/**
 * Hook para gerenciar filtros e ordenação de avatares
 */
export function useAvatarFilters(avatares) {
  const [filtroRaridade, setFiltroRaridade] = useState('Todos');
  const [filtroElemento, setFiltroElemento] = useState('Todos');
  const [filtroStatus, setFiltroStatus] = useState('Todos');
  const [ordenacao, setOrdenacao] = useState('nivel_desc');

  /**
   * Aplica filtros e ordenação aos avatares
   */
  const avataresFiltrados = useMemo(() => {
    // Primeiro, excluir avatares no memorial
    let resultado = avatares.filter(av => {
      if (!av.vivo && av.marca_morte) return false;
      return true;
    });

    // Aplicar filtros
    if (filtroRaridade !== 'Todos') {
      resultado = resultado.filter(av => av.raridade === filtroRaridade);
    }

    if (filtroElemento !== 'Todos') {
      resultado = resultado.filter(av => av.elemento === filtroElemento);
    }

    if (filtroStatus !== 'Todos') {
      if (filtroStatus === 'Vivos') {
        resultado = resultado.filter(av => av.vivo);
      } else if (filtroStatus === 'Mortos') {
        resultado = resultado.filter(av => !av.vivo);
      } else if (filtroStatus === 'Com Marca') {
        resultado = resultado.filter(av => av.marca_morte);
      }
    }

    // Aplicar ordenação
    resultado.sort((a, b) => {
      switch (ordenacao) {
        case 'nivel_desc':
          return b.nivel - a.nivel;
        case 'nivel_asc':
          return a.nivel - b.nivel;
        case 'nome_asc':
          return a.nome.localeCompare(b.nome);
        case 'raridade': {
          const raridadeOrder = { 'Lendário': 3, 'Raro': 2, 'Comum': 1 };
          return (raridadeOrder[b.raridade] || 0) - (raridadeOrder[a.raridade] || 0);
        }
        default:
          return 0;
      }
    });

    return resultado;
  }, [avatares, filtroRaridade, filtroElemento, filtroStatus, ordenacao]);

  /**
   * Limpa todos os filtros
   */
  const limparFiltros = () => {
    setFiltroRaridade('Todos');
    setFiltroElemento('Todos');
    setFiltroStatus('Todos');
    setOrdenacao('nivel_desc');
  };

  return {
    filtroRaridade,
    setFiltroRaridade,
    filtroElemento,
    setFiltroElemento,
    filtroStatus,
    setFiltroStatus,
    ordenacao,
    setOrdenacao,
    avataresFiltrados,
    limparFiltros
  };
}
