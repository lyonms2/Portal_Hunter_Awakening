"use client";

/**
 * Barra de filtros e ordenação de avatares
 */
export default function AvatarFiltros({
  filtroRaridade,
  setFiltroRaridade,
  filtroElemento,
  setFiltroElemento,
  filtroStatus,
  setFiltroStatus,
  ordenacao,
  setOrdenacao,
  limparFiltros,
  totalMostrados
}) {
  return (
    <div className="mb-6 bg-slate-900/50 border border-slate-700/50 rounded-lg p-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* Raridade */}
        <select
          value={filtroRaridade}
          onChange={(e) => setFiltroRaridade(e.target.value)}
          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white focus:border-cyan-500 focus:outline-none"
        >
          <option value="Todos">Todas Raridades</option>
          <option value="Comum">Comum</option>
          <option value="Raro">Raro</option>
          <option value="Lendário">Lendário</option>
        </select>

        {/* Elemento */}
        <select
          value={filtroElemento}
          onChange={(e) => setFiltroElemento(e.target.value)}
          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white focus:border-cyan-500 focus:outline-none"
        >
          <option value="Todos">Todos Elementos</option>
          <option value="Fogo">🔥 Fogo</option>
          <option value="Água">💧 Água</option>
          <option value="Terra">🪨 Terra</option>
          <option value="Vento">💨 Vento</option>
          <option value="Eletricidade">⚡ Eletricidade</option>
          <option value="Sombra">🌑 Sombra</option>
          <option value="Luz">✨ Luz</option>
        </select>

        {/* Status */}
        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white focus:border-cyan-500 focus:outline-none"
        >
          <option value="Todos">Todos Status</option>
          <option value="Vivos">Vivos</option>
          <option value="Mortos">Mortos</option>
          <option value="Com Marca">Com Marca Morte</option>
        </select>

        {/* Ordenação */}
        <select
          value={ordenacao}
          onChange={(e) => setOrdenacao(e.target.value)}
          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white focus:border-cyan-500 focus:outline-none"
        >
          <option value="nivel_desc">Nível (Maior→Menor)</option>
          <option value="nivel_asc">Nível (Menor→Maior)</option>
          <option value="nome_asc">Nome (A→Z)</option>
          <option value="raridade">Raridade</option>
        </select>

        {/* Limpar Filtros */}
        <button
          onClick={limparFiltros}
          className="px-3 py-2 bg-red-900/30 hover:bg-red-800/40 border border-red-500/30 rounded text-sm font-semibold text-red-400 transition-all"
        >
          LIMPAR
        </button>
      </div>

      <div className="mt-3 text-xs text-slate-500 font-mono">
        Mostrando {totalMostrados} {totalMostrados === 1 ? 'avatar' : 'avatares'}
      </div>
    </div>
  );
}
