"use client";

import { useState } from 'react';
import AvatarSVG from '../../../components/AvatarSVG';
import { getEmojiElemento } from '../../utils/avatarHelpers.js';

/**
 * Modal de sacrifício de avatar
 */
export default function ModalSacrificar({ avatar, onClose, onConfirm }) {
  const [sacrificando, setSacrificando] = useState(false);

  if (!avatar) return null;

  const handleSacrificar = async () => {
    setSacrificando(true);
    try {
      await onConfirm(avatar);
      onClose();
    } catch (error) {
      console.error('Erro ao sacrificar:', error);
    } finally {
      setSacrificando(false);
    }
  };

  const poderTotal = avatar.forca + avatar.agilidade + avatar.resistencia + avatar.foco;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto p-4"
      onClick={() => !sacrificando && onClose()}
    >
      <div className="min-h-full flex items-center justify-center py-8">
        <div
          className="max-w-4xl w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-red-600/40 via-orange-600/40 to-red-600/40 rounded-lg blur opacity-75 animate-pulse"></div>

            <div className="relative bg-slate-950/95 backdrop-blur-xl border-2 border-red-900/50 rounded-lg overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-red-900/80 to-orange-900/80 p-4 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20"></div>
                <div className="relative">
                  <div className="text-5xl mb-2 animate-pulse">⚠️</div>
                  <h2 className="text-xl font-black uppercase tracking-wider text-red-200">
                    Ritual de Sacrifício
                  </h2>
                  <p className="text-xs text-red-300/80 font-mono mt-1">
                    Esta ação é irreversível
                  </p>
                </div>
              </div>

              {/* Botão Fechar */}
              <button
                onClick={onClose}
                disabled={sacrificando}
                className="absolute top-3 right-3 w-8 h-8 bg-slate-900/80 hover:bg-red-900/80 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-all z-20 border border-slate-700/50 hover:border-red-500/50 disabled:opacity-50"
              >
                ✕
              </button>

              <div className="p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Coluna Esquerda - Avatar e Lore */}
                  <div className="space-y-4">
                    {/* Avatar Preview */}
                    <div className="bg-slate-900/70 rounded-lg p-6 aspect-square border-2 border-red-900/50 flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-orange-500/5"></div>
                      <div className="relative">
                        <div className="absolute -inset-2 bg-gradient-to-r from-red-500/30 to-orange-500/30 rounded-full blur"></div>
                        <div className="relative">
                          <AvatarSVG avatar={avatar} tamanho={200} />
                        </div>
                      </div>
                    </div>

                    {/* Nome e Info */}
                    <div className="text-center">
                      <h3 className="text-2xl font-black mb-2 text-white">
                        {avatar.nome}
                      </h3>
                      <div className="flex items-center justify-center gap-2 flex-wrap">
                        <span className="inline-block px-3 py-1 bg-slate-800 rounded-full text-sm font-mono text-slate-300">
                          {getEmojiElemento(avatar.elemento)} {avatar.elemento}
                        </span>
                        <span className="inline-block px-3 py-1 bg-slate-800 rounded-full text-sm font-mono text-slate-300">
                          {avatar.raridade}
                        </span>
                        <span className="inline-block px-3 py-1 bg-slate-800 rounded-full text-sm font-mono text-slate-300">
                          Nv.{avatar.nivel}
                        </span>
                      </div>
                    </div>

                    {/* Lore Text */}
                    <div className="bg-gradient-to-br from-red-950/40 to-orange-950/40 rounded-lg p-4 border border-red-900/50">
                      <div className="text-xs text-red-400 font-bold uppercase mb-2 tracking-wider">⚠️ Aviso do Vazio</div>
                      <p className="text-sm text-red-200/90 leading-relaxed italic">
                        "Nas profundezas da Organização de Caçadores Dimensionais, existe um ritual sombrio reservado apenas para os mais desesperados.
                        <span className="block mt-2 font-bold text-red-300">
                          Ao sacrificar um avatar, sua essência é consumida pelo Vazio Dimensional, e sua alma é enviada ao Memorial Eterno.
                        </span>
                        <span className="block mt-2 text-red-400/80">
                          Uma vez realizado, não há retorno. Nem mesmo o Necromante mais poderoso pode trazer de volta o que foi entregue ao Vazio.
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Coluna Direita - Avisos e Confirmação */}
                  <div className="space-y-4">
                    {/* Stats do Avatar */}
                    <div>
                      <h4 className="text-red-400 font-bold text-xs uppercase tracking-wider mb-3">O que será perdido</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-900/50 rounded-lg p-3 text-center border border-red-500/30">
                          <div className="text-xs text-slate-500 uppercase mb-1">Força</div>
                          <div className="text-2xl font-bold text-red-400">{avatar.forca}</div>
                        </div>
                        <div className="bg-slate-900/50 rounded-lg p-3 text-center border border-red-500/30">
                          <div className="text-xs text-slate-500 uppercase mb-1">Agilidade</div>
                          <div className="text-2xl font-bold text-green-400">{avatar.agilidade}</div>
                        </div>
                        <div className="bg-slate-900/50 rounded-lg p-3 text-center border border-red-500/30">
                          <div className="text-xs text-slate-500 uppercase mb-1">Resistência</div>
                          <div className="text-2xl font-bold text-blue-400">{avatar.resistencia}</div>
                        </div>
                        <div className="bg-slate-900/50 rounded-lg p-3 text-center border border-red-500/30">
                          <div className="text-xs text-slate-500 uppercase mb-1">Foco</div>
                          <div className="text-2xl font-bold text-purple-400">{avatar.foco}</div>
                        </div>
                      </div>
                    </div>

                    {/* Poder Total */}
                    <div className="bg-gradient-to-r from-red-950/50 to-orange-950/50 rounded-lg p-4 border border-red-600/50">
                      <div className="text-center">
                        <div className="text-xs text-red-400 uppercase mb-1">Poder Total Perdido</div>
                        <div className="text-3xl font-black text-red-300">
                          {poderTotal}
                        </div>
                        <div className="text-[10px] text-red-500 mt-1">
                          XP: {avatar.experiencia || 0} | Vínculo: {avatar.vinculo}%
                        </div>
                      </div>
                    </div>

                    {/* Warnings */}
                    <div>
                      <h4 className="text-red-400 font-bold text-xs uppercase tracking-wider mb-3">Consequências</h4>
                      <div className="space-y-2">
                        <div className="flex items-start gap-2 p-3 bg-red-950/30 rounded border border-red-900/50">
                          <span className="text-xl">💀</span>
                          <div className="flex-1">
                            <div className="font-bold text-red-300 text-xs">Morte Permanente</div>
                            <div className="text-[10px] text-red-400/80">Marcado com a Marca da Morte e enviado ao Memorial</div>
                          </div>
                        </div>

                        <div className="flex items-start gap-2 p-3 bg-red-950/30 rounded border border-red-900/50">
                          <span className="text-xl">⛔</span>
                          <div className="flex-1">
                            <div className="font-bold text-red-300 text-xs">Sem Ressurreição</div>
                            <div className="text-[10px] text-red-400/80">Necromante e Purificador não podem reverter</div>
                          </div>
                        </div>

                        <div className="flex items-start gap-2 p-3 bg-red-950/30 rounded border border-red-900/50">
                          <span className="text-xl">🌑</span>
                          <div className="flex-1">
                            <div className="font-bold text-red-300 text-xs">Consumido pelo Vazio</div>
                            <div className="text-[10px] text-red-400/80">Todas habilidades e progresso perdidos</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Confirmation Question */}
                    <div className="bg-gradient-to-r from-slate-900/80 to-red-950/80 rounded-lg p-4 border-2 border-red-600/50">
                      <p className="text-center font-bold text-red-200 text-sm">
                        Você realmente deseja sacrificar {avatar.nome}?
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={onClose}
                        disabled={sacrificando}
                        className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg transition-all disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleSacrificar}
                        disabled={sacrificando}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-lg transition-all disabled:opacity-50 shadow-lg shadow-red-900/50"
                      >
                        {sacrificando ? 'Sacrificando...' : '💀 Confirmar'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
