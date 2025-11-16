"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function TradePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }
    setUser(JSON.parse(userData));
  }, [router]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center">
        <div className="text-cyan-400 font-mono animate-pulse">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-gray-100 relative overflow-hidden">
      {/* Partículas de fundo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-amber-500/5 rounded-full blur-3xl top-20 -left-48 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl bottom-20 -right-48 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute w-96 h-96 bg-amber-500/5 rounded-full blur-3xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      {/* Grid hexagonal */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTYiIGhlaWdodD0iMTAwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0yOCAwTDAgMTVWMzVMMjggNTBMNTYgMzVWMTVaTTI4IDUwTDAgNjVWODVMMjggMTAwTDU2IDg1VjY1WiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjYW1iZXIiIHN0cm9rZS13aWR0aD0iMC41Ii8+PC9zdmc+')] pointer-events-none"></div>

      {/* Vinheta */}
      <div className="absolute inset-0 shadow-[inset_0_0_120px_rgba(0,0,0,0.9)] pointer-events-none"></div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-5xl font-black bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-300 bg-clip-text text-transparent mb-3 flex items-center gap-4">
              <span className="text-6xl">💱</span>
              MERCADO DE TRADE
            </h1>
            <p className="text-slate-400 font-mono text-lg">
              Negocie avatares e itens com outros caçadores dimensionais
            </p>
          </div>

          <button
            onClick={() => router.push("/dashboard")}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-all hover:scale-105"
          >
            ← Voltar ao Dashboard
          </button>
        </div>

        {/* Conteúdo Principal - Em Desenvolvimento */}
        <div className="max-w-4xl mx-auto">
          <div className="relative group mb-8">
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/30 via-yellow-500/30 to-amber-500/30 rounded-lg blur opacity-75"></div>

            <div className="relative bg-slate-950/90 backdrop-blur-xl border-2 border-amber-900/50 rounded-lg overflow-hidden">
              {/* Status Badge */}
              <div className="bg-gradient-to-r from-amber-600 to-yellow-600 px-6 py-4 text-center">
                <div className="flex items-center justify-center gap-3">
                  <span className="text-3xl">🔨</span>
                  <div>
                    <div className="text-xl font-black uppercase tracking-wider">Em Desenvolvimento</div>
                    <div className="text-xs text-amber-100">Sistema de Trade será liberado em breve</div>
                  </div>
                </div>
              </div>

              <div className="p-8">
                {/* Ilustração Central */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center gap-4 text-8xl mb-6">
                    <span className="opacity-60">👤</span>
                    <span className="text-4xl text-amber-400">⟷</span>
                    <span className="opacity-60">👤</span>
                  </div>
                  <h2 className="text-3xl font-bold text-amber-400 mb-3">
                    Sistema de Trocas entre Jogadores
                  </h2>
                  <p className="text-slate-400 text-lg leading-relaxed max-w-2xl mx-auto">
                    Em breve você poderá negociar diretamente com outros caçadores, comprando e vendendo avatares raros, itens lendários e muito mais!
                  </p>
                </div>

                {/* Features Planejadas */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  {/* Mercado de Avatares */}
                  <div className="bg-slate-900/50 rounded-lg p-6 border border-amber-500/20">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center border border-amber-500/30">
                        <span className="text-3xl">🎭</span>
                      </div>
                      <h3 className="text-xl font-bold text-amber-400">Mercado de Avatares</h3>
                    </div>
                    <ul className="space-y-2 text-sm text-slate-400">
                      <li className="flex items-start gap-2">
                        <span className="text-amber-400 mt-1">▸</span>
                        <span>Compre avatares raros de outros jogadores</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-amber-400 mt-1">▸</span>
                        <span>Venda seus avatares extras por moedas</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-amber-400 mt-1">▸</span>
                        <span>Sistema de leilão para lendários</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-amber-400 mt-1">▸</span>
                        <span>Filtros por raridade, elemento e nível</span>
                      </li>
                    </ul>
                  </div>

                  {/* Mercado de Itens */}
                  <div className="bg-slate-900/50 rounded-lg p-6 border border-purple-500/20">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center border border-purple-500/30">
                        <span className="text-3xl">📦</span>
                      </div>
                      <h3 className="text-xl font-bold text-purple-400">Mercado de Itens</h3>
                    </div>
                    <ul className="space-y-2 text-sm text-slate-400">
                      <li className="flex items-start gap-2">
                        <span className="text-purple-400 mt-1">▸</span>
                        <span>Compre e venda poções, equipamentos</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-purple-400 mt-1">▸</span>
                        <span>Negocie fragmentos dimensionais</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-purple-400 mt-1">▸</span>
                        <span>Sistema de ofertas e contraofertas</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-purple-400 mt-1">▸</span>
                        <span>Histórico de transações</span>
                      </li>
                    </ul>
                  </div>

                  {/* Sistema de Segurança */}
                  <div className="bg-slate-900/50 rounded-lg p-6 border border-cyan-500/20">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center border border-cyan-500/30">
                        <span className="text-3xl">🔒</span>
                      </div>
                      <h3 className="text-xl font-bold text-cyan-400">Sistema de Segurança</h3>
                    </div>
                    <ul className="space-y-2 text-sm text-slate-400">
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-400 mt-1">▸</span>
                        <span>Transações protegidas e verificadas</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-400 mt-1">▸</span>
                        <span>Sistema anti-fraude automático</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-400 mt-1">▸</span>
                        <span>Reputação de vendedores</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-400 mt-1">▸</span>
                        <span>Garantia de entrega</span>
                      </li>
                    </ul>
                  </div>

                  {/* Recursos Adicionais */}
                  <div className="bg-slate-900/50 rounded-lg p-6 border border-green-500/20">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center border border-green-500/30">
                        <span className="text-3xl">⭐</span>
                      </div>
                      <h3 className="text-xl font-bold text-green-400">Recursos Extras</h3>
                    </div>
                    <ul className="space-y-2 text-sm text-slate-400">
                      <li className="flex items-start gap-2">
                        <span className="text-green-400 mt-1">▸</span>
                        <span>Chat direto com vendedores</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-400 mt-1">▸</span>
                        <span>Lista de desejos personalizada</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-400 mt-1">▸</span>
                        <span>Alertas de preço</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-400 mt-1">▸</span>
                        <span>Rankings de melhores negócios</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Timeline */}
                <div className="bg-gradient-to-r from-slate-900/50 to-slate-800/50 rounded-lg p-6 border border-amber-500/30">
                  <div className="text-center">
                    <div className="text-xs text-amber-400 uppercase tracking-wider mb-2">Status do Projeto</div>
                    <div className="flex items-center justify-center gap-4 mb-4">
                      <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full" style={{width: '25%'}}></div>
                      </div>
                      <span className="text-lg font-bold text-amber-400">25%</span>
                    </div>
                    <p className="text-sm text-slate-400">
                      🔨 Planejamento concluído • Desenvolvimento iniciado • Previsão: Fase Beta em breve
                    </p>
                  </div>
                </div>

                {/* CTA */}
                <div className="mt-8 text-center">
                  <p className="text-slate-500 text-sm mb-4">
                    Enquanto isso, continue fortalecendo seus avatares e acumulando recursos!
                  </p>
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="group relative inline-flex"
                  >
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-yellow-500 rounded blur opacity-50 group-hover:opacity-75 transition-all"></div>
                    <div className="relative px-8 py-3 bg-slate-950 rounded border border-amber-500/50 group-hover:border-amber-400 transition-all">
                      <span className="font-bold text-amber-400 uppercase tracking-wider">
                        ← Voltar ao Dashboard
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
