"use client";

import { useRouter } from "next/navigation";

/**
 * GameNav - Componente de navegação padronizado para todas as páginas do jogo
 *
 * @param {string} backTo - Rota de retorno (ex: "/dashboard", "/avatares")
 * @param {string} backLabel - Texto do botão de voltar (ex: "DASHBOARD", "AVATARES")
 * @param {Array} actions - Array de ações adicionais [{href, label, icon, color}]
 * @param {string} title - Título da página (opcional)
 * @param {string} subtitle - Subtítulo/descrição (opcional)
 * @param {boolean} compact - Usar botões menores (para muitas ações)
 */
export default function GameNav({
  backTo = "/dashboard",
  backLabel = "VOLTAR",
  actions = [],
  title,
  subtitle,
  compact = false
}) {
  const router = useRouter();

  // Cores padrão para cada tipo de ação
  const getActionStyle = (color) => {
    const styles = {
      purple: "from-purple-900/30 to-violet-900/30 hover:from-purple-800/40 hover:to-violet-800/40 border-purple-500/30 text-purple-400",
      cyan: "from-cyan-900/30 to-blue-900/30 hover:from-cyan-800/40 hover:to-blue-800/40 border-cyan-500/30 text-cyan-400",
      amber: "from-amber-900/30 to-yellow-900/30 hover:from-amber-800/40 hover:to-yellow-800/40 border-amber-500/30 text-amber-400",
      red: "from-red-900/30 to-orange-900/30 hover:from-red-800/40 hover:to-orange-800/40 border-red-500/30 text-red-400",
      green: "from-green-900/30 to-emerald-900/30 hover:from-green-800/40 hover:to-emerald-800/40 border-green-500/30 text-green-400",
      indigo: "from-indigo-900/30 to-violet-900/30 hover:from-indigo-800/40 hover:to-violet-800/40 border-indigo-500/30 text-indigo-400",
      gray: "from-gray-900/30 to-slate-900/30 hover:from-gray-800/40 hover:to-slate-800/40 border-gray-600/30 text-gray-400",
      slate: "bg-slate-900/50 hover:bg-slate-800/50 border-slate-700/50 text-cyan-400"
    };
    return styles[color] || styles.slate;
  };

  return (
    <div className="relative z-20">
      {/* Barra de navegação */}
      <div className="bg-slate-950/80 backdrop-blur-xl border-b border-cyan-900/20">
        <div className="container mx-auto px-4 py-3 max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            {/* Lado esquerdo - Título e voltar */}
            <div className="flex items-center gap-4">
              {/* Botão Voltar */}
              <button
                onClick={() => router.push(backTo)}
                className="group flex items-center gap-2 px-3 py-2 bg-slate-900/50 hover:bg-slate-800/50 border border-slate-700/50 rounded-lg transition-all text-sm font-mono"
              >
                <span className="text-cyan-400 group-hover:-translate-x-1 transition-transform">←</span>
                <span className="text-slate-400 group-hover:text-slate-300">{backLabel}</span>
              </button>

              {/* Título da página */}
              {title && (
                <div className="hidden md:block">
                  <h1 className="text-xl font-black bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 bg-clip-text text-transparent">
                    {title}
                  </h1>
                  {subtitle && (
                    <p className="text-xs text-slate-500 font-mono">{subtitle}</p>
                  )}
                </div>
              )}
            </div>

            {/* Lado direito - Ações */}
            {actions.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => router.push(action.href)}
                    className={`${compact ? 'px-2 py-1.5 text-xs gap-1' : 'px-3 py-1.5 text-xs gap-1.5'} bg-gradient-to-r ${getActionStyle(action.color)} border rounded-lg transition-all flex items-center font-semibold`}
                  >
                    {action.icon && <span className={compact ? 'text-sm' : ''}>{action.icon}</span>}
                    <span>{action.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Título mobile */}
          {title && (
            <div className="md:hidden mt-3 pt-3 border-t border-slate-800/50">
              <h1 className="text-lg font-black bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 bg-clip-text text-transparent">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs text-slate-500 font-mono">{subtitle}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Linha decorativa */}
      <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"></div>
    </div>
  );
}

// Presets de navegação comuns
export const NAV_PRESETS = {
  // Para páginas que voltam ao dashboard
  dashboard: {
    backTo: "/dashboard",
    backLabel: "DASHBOARD"
  },
  // Para páginas que voltam aos avatares
  avatares: {
    backTo: "/avatares",
    backLabel: "AVATARES"
  },
  // Para páginas que voltam à arena
  arena: {
    backTo: "/arena",
    backLabel: "ARENA"
  }
};

// Ações comuns reutilizáveis
export const COMMON_ACTIONS = {
  mercado: { href: "/mercado", label: "MERCADO", icon: "🏪", color: "amber" },
  fusao: { href: "/merge", label: "FUSAO", icon: "🧬", color: "indigo" },
  memorial: { href: "/memorial", label: "MEMORIAL", icon: "🕯️", color: "gray" },
  invocar: { href: "/ocultista", label: "INVOCAR", icon: "🔮", color: "purple" },
  avatares: { href: "/avatares", label: "AVATARES", icon: "👤", color: "cyan" },
  arena: { href: "/arena", label: "ARENA", icon: "⚔️", color: "red" },
  missoes: { href: "/missoes", label: "MISSOES", icon: "📜", color: "green" },
  inventario: { href: "/inventario", label: "INVENTARIO", icon: "🎒", color: "amber" },
  necromante: { href: "/necromante", label: "NECROMANTE", icon: "💀", color: "purple" },
  purificador: { href: "/purificador", label: "PURIFICADOR", icon: "✨", color: "cyan" }
};
