"use client";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-gray-100 relative overflow-hidden">
      {/* Partículas de fundo animadas */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl top-20 -left-48 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-purple-500/5 rounded-full blur-3xl bottom-20 -right-48 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute w-64 h-64 bg-blue-500/5 rounded-full blur-3xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      {/* Grid hexagonal de fundo */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTYiIGhlaWdodD0iMTAwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0yOCAwTDAgMTVWMzVMMjggNTBMNTYgMzVWMTVaTTI4IDUwTDAgNjVWODVMMjggMTAwTDU2IDg1VjY1WiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjY3lhbiIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48L3N2Zz4=')] pointer-events-none"></div>
      
      {/* Scanlines sutis */}
      <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(transparent_50%,rgba(99,102,241,0.5)_50%)] bg-[length:100%_4px] pointer-events-none"></div>

      {/* Vinheta */}
      <div className="absolute inset-0 shadow-[inset_0_0_120px_rgba(0,0,0,0.9)] pointer-events-none"></div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-screen">
          {/* Logo/Título com efeito holográfico */}
          <div className="mb-16 text-center relative">
            <div className="absolute inset-0 blur-2xl bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 animate-pulse"></div>
            
            <div className="relative mb-6">
              <h1 className="text-8xl font-black tracking-tight relative">
                <span className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent blur-sm">
                  PORTAL HUNTER
                </span>
                <span className="relative bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 bg-clip-text text-transparent">
                  PORTAL HUNTER
                </span>
              </h1>
              
              {/* Glitch effect decorativo */}
              <div className="absolute -inset-4 opacity-30">
                <div className="absolute left-0 top-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
                <div className="absolute left-0 bottom-0 w-full h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent"></div>
              </div>
            </div>

            <div className="relative">
              <p className="text-3xl text-cyan-400/90 tracking-[0.4em] font-light uppercase mb-4">
                Awakening
              </p>
              <div className="h-px w-80 mx-auto bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
            </div>

            {/* Indicador de sistema */}
            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-cyan-400/50 font-mono">
              <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></div>
              <span>SISTEMA OPERACIONAL</span>
              <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></div>
            </div>
          </div>

          {/* Terminal de contexto */}
          <div className="max-w-3xl mb-16 relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 rounded-lg blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
            
            <div className="relative bg-slate-950/80 backdrop-blur-xl border border-cyan-900/30 rounded-lg overflow-hidden">
              {/* Terminal header */}
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 border-b border-cyan-900/20">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-slate-600"></div>
                  <div className="w-3 h-3 rounded-full bg-slate-600"></div>
                  <div className="w-3 h-3 rounded-full bg-slate-600"></div>
                </div>
                <span className="text-xs text-cyan-400/60 font-mono ml-2">~ / briefing / intro.log</span>
              </div>
              
              {/* Terminal content */}
              <div className="p-6 font-mono text-sm space-y-3">
                <p className="text-cyan-400/40">
                  <span className="text-cyan-400">{'>'}</span> Iniciando transmissão...
                </p>
                <p className="text-slate-300 leading-relaxed">
                  O colapso aconteceu há 15 anos. Anomalias dimensionais — <span className="text-cyan-400">os Portais</span> — 
                  rasgaram a realidade, trazendo entidades do Vazio. A humanidade se refugiou em <span className="text-purple-400">zonas seguras</span>, 
                  enquanto o mundo lá fora se tornou um cemitério de civilizações.
                </p>
                <p className="text-slate-300 leading-relaxed">
                  Você é um <span className="text-blue-400 font-semibold">Portal Hunter</span> — treinado para adentrar as fendas, 
                  coletar artefatos pré-colapso e enfrentar o desconhecido. Cada missão é um jogo de sobrevivência. 
                  <span className="text-cyan-400"> Cada escolha tem consequências.</span>
                </p>
                <p className="text-cyan-400/40 mt-4">
                  <span className="text-cyan-400">{'>'}</span> Transmissão concluída.
                </p>
              </div>
            </div>
          </div>

          {/* Botão Principal */}
          <button
            onClick={() => window.location.href = "/login"}
            className="group relative mb-12"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-lg blur opacity-40 group-hover:opacity-75 transition-all duration-500 group-hover:blur-xl"></div>
            
            <div className="relative px-16 py-5 bg-slate-950 rounded-lg border border-cyan-500/50 group-hover:border-cyan-400 transition-all duration-300">
              <div className="flex items-center gap-4">
                <span className="text-xl font-bold tracking-wider uppercase bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
                  Acessar Portal
                </span>
                <span className="text-cyan-400 group-hover:translate-x-1 transition-transform text-xl">→</span>
              </div>
            </div>
          </button>

          {/* Dashboard de status */}
          <div className="flex gap-8 text-sm font-mono">
            <div className="flex flex-col items-center gap-2 px-6 py-3 bg-slate-950/50 backdrop-blur border border-slate-800/50 rounded">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-lg shadow-cyan-400/50"></div>
                <span className="text-slate-500 uppercase text-xs tracking-wider">Portais Ativos</span>
              </div>
              <span className="text-2xl font-bold text-cyan-400">47</span>
            </div>

            <div className="flex flex-col items-center gap-2 px-6 py-3 bg-slate-950/50 backdrop-blur border border-slate-800/50 rounded">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse shadow-lg shadow-purple-400/50"></div>
                <span className="text-slate-500 uppercase text-xs tracking-wider">Hunters Online</span>
              </div>
              <span className="text-2xl font-bold text-purple-400">23</span>
            </div>

            <div className="flex flex-col items-center gap-2 px-6 py-3 bg-slate-950/50 backdrop-blur border border-slate-800/50 rounded">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse shadow-lg shadow-amber-400/50"></div>
                <span className="text-slate-500 uppercase text-xs tracking-wider">Zonas Críticas</span>
              </div>
              <span className="text-2xl font-bold text-amber-400">08</span>
            </div>
          </div>
        </div>
      </div>

      {/* Efeito de scan holográfico */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.015]">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/50 to-transparent animate-scan"></div>
      </div>
    </div>
  );
}
