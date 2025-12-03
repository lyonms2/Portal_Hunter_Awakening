"use client";

import { useState } from 'react';

/**
 * Modal para colocar avatar à venda
 */
export default function ModalVender({ avatar, onClose, onConfirm }) {
  const [precoMoedas, setPrecoMoedas] = useState('');
  const [precoFragmentos, setPrecoFragmentos] = useState('');
  const [vendendo, setVendendo] = useState(false);

  if (!avatar) return null;

  const handleVender = async () => {
    const moedas = parseInt(precoMoedas) || 0;
    const fragmentos = parseInt(precoFragmentos) || 0;

    // Validações
    if (moedas === 0 && fragmentos === 0) {
      return;
    }

    if (moedas < 0 || moedas > 10000) {
      return;
    }

    if (fragmentos < 0 || fragmentos > 500) {
      return;
    }

    setVendendo(true);
    try {
      await onConfirm(moedas, fragmentos);
      onClose();
    } catch (error) {
      console.error('Erro ao vender:', error);
    } finally {
      setVendendo(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={() => !vendendo && onClose()}
    >
      <div
        className="max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/30 to-yellow-500/30 rounded-lg blur opacity-75"></div>

          <div className="relative bg-slate-950/95 backdrop-blur-xl border border-amber-900/50 rounded-lg overflow-hidden">
            <div className="p-4 text-center font-bold text-lg bg-gradient-to-r from-amber-600 to-yellow-600">
              🏪 Colocar à Venda
            </div>

            <div className="p-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-white mb-2">{avatar.nome}</h3>
                <p className="text-sm text-slate-400">
                  {avatar.raridade} • {avatar.elemento} • Nv.{avatar.nivel}
                </p>
              </div>

              <div className="mb-6 space-y-4">
                <div>
                  <label className="block text-sm font-mono text-slate-400 mb-2">
                    Preço em Moedas (opcional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10000"
                    value={precoMoedas}
                    onChange={(e) => setPrecoMoedas(e.target.value)}
                    placeholder="0 a 10.000 moedas"
                    className="w-full px-4 py-3 bg-slate-900 border border-amber-500/30 rounded text-white text-center text-lg font-bold focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-mono text-slate-400 mb-2">
                    Preço em Fragmentos (opcional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="500"
                    value={precoFragmentos}
                    onChange={(e) => setPrecoFragmentos(e.target.value)}
                    placeholder="0 a 500 fragmentos"
                    className="w-full px-4 py-3 bg-slate-900 border border-purple-500/30 rounded text-white text-center text-lg font-bold focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <p className="text-xs text-slate-500 text-center font-mono">
                  O mercado cobra 5% de taxa nas moedas (sem taxa nos fragmentos)
                </p>

                {/* Aviso sobre reset de vínculo */}
                {avatar.vinculo > 0 && (
                  <div className="mt-4 p-3 bg-orange-950/30 border border-orange-900/30 rounded-lg">
                    <p className="text-xs text-orange-400 font-mono text-center">
                      ⚠️ <span className="font-bold">Aviso:</span> Ao ser vendido, o avatar terá seu vínculo resetado de {avatar.vinculo} para 0
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={vendendo}
                  className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg transition-all disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleVender}
                  disabled={vendendo}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-bold rounded-lg transition-all disabled:opacity-50"
                >
                  {vendendo ? 'Vendendo...' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
