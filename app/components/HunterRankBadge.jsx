"use client";

import { useState, useEffect } from 'react';

/**
 * HunterRankBadge - Exibe o rank atual do cacador com XP e bonus
 *
 * @param {number} xpTotal - XP total do cacador
 * @param {boolean} showBonus - Mostrar lista de bonus (default: false)
 * @param {boolean} compact - Modo compacto (default: false)
 * @param {object} promocao - Dados de promocao recente (opcional)
 */
export default function HunterRankBadge({
  xpTotal = 0,
  showBonus = false,
  compact = false,
  promocao = null
}) {
  const [showPromocao, setShowPromocao] = useState(false);

  // Definicao dos ranks
  const HUNTER_RANKS = {
    F: { nome: 'F', minXp: 0, maxXp: 999, cor: '#808080', corTexto: 'text-gray-400', corBg: 'bg-gray-800/30', corBorda: 'border-gray-500' },
    E: { nome: 'E', minXp: 1000, maxXp: 3999, cor: '#a0522d', corTexto: 'text-amber-700', corBg: 'bg-amber-900/30', corBorda: 'border-amber-700' },
    D: { nome: 'D', minXp: 4000, maxXp: 11999, cor: '#cd7f32', corTexto: 'text-orange-500', corBg: 'bg-orange-900/30', corBorda: 'border-orange-500' },
    C: { nome: 'C', minXp: 12000, maxXp: 31999, cor: '#c0c0c0', corTexto: 'text-gray-300', corBg: 'bg-gray-700/30', corBorda: 'border-gray-300' },
    B: { nome: 'B', minXp: 32000, maxXp: 81999, cor: '#ffd700', corTexto: 'text-yellow-400', corBg: 'bg-yellow-900/30', corBorda: 'border-yellow-400' },
    A: { nome: 'A', minXp: 82000, maxXp: 201999, cor: '#00bfff', corTexto: 'text-cyan-400', corBg: 'bg-cyan-900/30', corBorda: 'border-cyan-400' },
    S: { nome: 'S', minXp: 202000, maxXp: 501999, cor: '#9d00ff', corTexto: 'text-purple-400', corBg: 'bg-purple-900/30', corBorda: 'border-purple-400' },
    SS: { nome: 'SS', minXp: 502000, maxXp: Infinity, cor: '#ff4500', corTexto: 'text-red-500', corBg: 'bg-red-900/30', corBorda: 'border-red-500' }
  };

  // Bonus por rank
  const RANK_BONUS = {
    F: { moedas: 0, fragmentos: 0, raro: 0, lendario: 0, mercado: 0, merge: 0 },
    E: { moedas: 2, fragmentos: 0, raro: 0, lendario: 0, mercado: 0, merge: 0 },
    D: { moedas: 4, fragmentos: 2, raro: 0, lendario: 0, mercado: 2, merge: 0 },
    C: { moedas: 6, fragmentos: 4, raro: 1, lendario: 0, mercado: 4, merge: 2 },
    B: { moedas: 8, fragmentos: 6, raro: 2, lendario: 0, mercado: 6, merge: 4 },
    A: { moedas: 10, fragmentos: 8, raro: 3, lendario: 0.5, mercado: 8, merge: 6 },
    S: { moedas: 12, fragmentos: 10, raro: 5, lendario: 1, mercado: 10, merge: 8 },
    SS: { moedas: 15, fragmentos: 12, raro: 8, lendario: 2, mercado: 12, merge: 10 }
  };

  // Obter rank atual
  const getRank = (xp) => {
    const ranks = Object.values(HUNTER_RANKS);
    return ranks.find(rank => xp >= rank.minXp && xp <= rank.maxXp) || HUNTER_RANKS.F;
  };

  // Calcular progresso
  const getProgresso = (xp, rank) => {
    if (rank.maxXp === Infinity) return 100;
    const xpNoRank = xp - rank.minXp;
    const xpTotalRank = rank.maxXp - rank.minXp + 1;
    return Math.min(100, Math.floor((xpNoRank / xpTotalRank) * 100));
  };

  // XP para proximo rank
  const getXpParaProximo = (xp, rank) => {
    if (rank.maxXp === Infinity) return 0;
    return rank.maxXp - xp + 1;
  };

  const rank = getRank(xpTotal);
  const progresso = getProgresso(xpTotal, rank);
  const xpParaProximo = getXpParaProximo(xpTotal, rank);
  const bonus = RANK_BONUS[rank.nome];

  // Mostrar animacao de promocao
  useEffect(() => {
    if (promocao && promocao.promovido) {
      setShowPromocao(true);
      const timer = setTimeout(() => setShowPromocao(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [promocao]);

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded ${rank.corBg} border ${rank.corBorda}`}>
        <span className={`font-black text-sm ${rank.corTexto}`}>
          {rank.nome}
        </span>
        <span className="text-xs text-slate-500">
          {xpTotal.toLocaleString()} XP
        </span>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Animacao de promocao */}
      {showPromocao && promocao && (
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="bg-gradient-to-r from-yellow-500 to-amber-500 text-black px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap">
            RANK UP! {promocao.rankAnterior?.nome} → {promocao.rankNovo?.nome}
          </div>
        </div>
      )}

      <div className={`${rank.corBg} border ${rank.corBorda} rounded-lg p-3`}>
        {/* Header com rank e XP */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className={`font-black text-2xl ${rank.corTexto}`} style={{ textShadow: `0 0 10px ${rank.cor}40` }}>
              {rank.nome}
            </span>
            <span className="text-xs text-slate-500 font-mono">RANK</span>
          </div>
          <div className="text-right">
            <div className="text-sm font-mono text-slate-300">{xpTotal.toLocaleString()} XP</div>
            {xpParaProximo > 0 && (
              <div className="text-xs text-slate-500">
                {xpParaProximo.toLocaleString()} para {rank.nome === 'S' ? 'SS' : String.fromCharCode(rank.nome.charCodeAt(0) - 1)}
              </div>
            )}
          </div>
        </div>

        {/* Barra de progresso */}
        {rank.maxXp !== Infinity && (
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progresso}%`,
                background: `linear-gradient(90deg, ${rank.cor}80, ${rank.cor})`
              }}
            />
          </div>
        )}

        {/* Lista de bonus */}
        {showBonus && (
          <div className="mt-3 pt-3 border-t border-slate-700/50">
            <div className="text-xs text-slate-500 mb-2">BONUS DO RANK</div>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {bonus.moedas > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-yellow-500">+{bonus.moedas}%</span>
                  <span className="text-slate-400">moedas</span>
                </div>
              )}
              {bonus.fragmentos > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-purple-500">+{bonus.fragmentos}%</span>
                  <span className="text-slate-400">fragmentos</span>
                </div>
              )}
              {bonus.raro > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-blue-400">+{bonus.raro}%</span>
                  <span className="text-slate-400">raro</span>
                </div>
              )}
              {bonus.lendario > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-amber-400">+{bonus.lendario}%</span>
                  <span className="text-slate-400">lendario</span>
                </div>
              )}
              {bonus.mercado > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-green-400">-{bonus.mercado}%</span>
                  <span className="text-slate-400">mercado</span>
                </div>
              )}
              {bonus.merge > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-cyan-400">-{bonus.merge}%</span>
                  <span className="text-slate-400">merge</span>
                </div>
              )}
              {Object.values(bonus).every(v => v === 0) && (
                <div className="col-span-2 text-slate-500 italic">Nenhum bonus ainda</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
