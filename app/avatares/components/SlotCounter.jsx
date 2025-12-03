"use client";

import { LIMITE_AVATARES } from '../constants/avatarConfig.js';

/**
 * Contador de slots de avatares
 */
export default function SlotCounter({ slotsUsados }) {
  const slotsDisponiveis = LIMITE_AVATARES - slotsUsados;
  const percentualOcupado = (slotsUsados / LIMITE_AVATARES) * 100;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-1">
        <span className={`font-mono text-sm font-bold ${
          percentualOcupado >= 100 ? 'text-red-400' :
          percentualOcupado >= 80 ? 'text-orange-400' :
          'text-cyan-400'
        }`}>
          📦 Slots: {slotsUsados}/{LIMITE_AVATARES}
        </span>
        {slotsDisponiveis > 0 && slotsDisponiveis <= 3 && (
          <span className="text-[10px] text-orange-400 font-bold animate-pulse">
            ⚠️ Quase cheio!
          </span>
        )}
        {slotsDisponiveis === 0 && (
          <span className="text-[10px] text-red-400 font-bold animate-pulse">
            🚫 LIMITE ATINGIDO
          </span>
        )}
      </div>
      <div className="w-64 bg-slate-800 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full transition-all ${
            percentualOcupado >= 100 ? 'bg-red-500' :
            percentualOcupado >= 80 ? 'bg-orange-500' :
            percentualOcupado >= 60 ? 'bg-yellow-500' :
            'bg-cyan-500'
          }`}
          style={{ width: `${Math.min(percentualOcupado, 100)}%` }}
        ></div>
      </div>
      <p className="text-[10px] text-slate-500 font-mono mt-1">
        * Avatares no memorial não ocupam slots
      </p>
    </div>
  );
}
