"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AvatarSVG from '../components/AvatarSVG';

export default function OcultistaPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [etapa, setEtapa] = useState('introducao'); // introducao, perguntas, invocando, revelacao
  const [loading, setLoading] = useState(true);
  const [avatarGerado, setAvatarGerado] = useState(null);
  const [invocando, setInvocando] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    carregarStats(parsedUser.id);
  }, [router]);

  const carregarStats = async (userId) => {
    try {
      const response = await fetch("/api/inicializar-jogador", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();
      setStats(data.stats);
    } catch (error) {
      console.error("Erro ao carregar stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const iniciarInvocacao = async () => {
    setEtapa('invocando');
    setInvocando(true);

    try {
      const response = await fetch("/api/invocar-avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await response.json();

      if (response.ok) {
        // Simular tempo de invocação (dramático)
        setTimeout(() => {
          setAvatarGerado(data.avatar);
          setStats(prev => ({
            ...prev,
            moedas: data.recursos_restantes.moedas,
            fragmentos: data.recursos_restantes.fragmentos,
            primeira_invocacao: false
          }));
          setEtapa('revelacao');
          setInvocando(false);
        }, 3000);
      } else {
        alert(data.message);
        setEtapa('introducao');
        setInvocando(false);
      }
    } catch (error) {
      console.error("Erro na invocação:", error);
      alert("Erro ao invocar avatar. Tente novamente.");
      setEtapa('introducao');
      setInvocando(false);
    }
  };

  const finalizarInvocacao = () => {
    router.push("/avatares");
  };

  if (loading) {
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
        <div className="absolute w-96 h-96 bg-purple-500/5 rounded-full blur-3xl top-20 -left-48 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-pink-500/5 rounded-full blur-3xl bottom-20 -right-48 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      {/* Grid hexagonal */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTYiIGhlaWdodD0iMTAwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0yOCAwTDAgMTVWMzVMMjggNTBMNTYgMzVWMTVaTTI4IDUwTDAgNjVWODVMMjggMTAwTDU2IDg1VjY1WiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjY3lhbiIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48L3N2Zz4=')] pointer-events-none"></div>

      {/* Vinheta */}
      <div className="absolute inset-0 shadow-[inset_0_0_120px_rgba(0,0,0,0.9)] pointer-events-none"></div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8">
        {/* Botão Voltar */}
        {etapa === 'introducao' && (
          <button
            onClick={() => router.push("/dashboard")}
            className="absolute top-8 left-8 text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-2 font-mono text-sm group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span> 
            <span>RETORNAR</span>
          </button>
        )}

        <div className="max-w-4xl w-full">
          {/* ETAPA 1: INTRODUÇÃO */}
          {etapa === 'introducao' && (
            <div className="space-y-8 animate-fade-in">
              {/* Título */}
              <div className="text-center mb-12">
                <div className="text-7xl mb-4 animate-pulse">🔮</div>
                <h1 className="text-5xl font-black bg-gradient-to-r from-purple-300 via-pink-300 to-cyan-300 bg-clip-text text-transparent mb-4">
                  O OCULTISTA
                </h1>
                <div className="h-px w-64 mx-auto bg-gradient-to-r from-transparent via-purple-500 to-transparent mb-4"></div>
                <p className="text-slate-400 font-mono text-sm">Invocador de Entidades Dimensionais</p>
              </div>

              {/* Diálogo do Ocultista */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-cyan-500/20 rounded-lg blur opacity-50"></div>
                
                <div className="relative bg-slate-950/90 backdrop-blur-xl border border-purple-900/30 rounded-lg p-8">
                  <div className="flex gap-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-3xl flex-shrink-0">
                      👁️
                    </div>
                    <div className="flex-1">
                      <h3 className="text-purple-400 font-bold mb-2">O Ocultista</h3>
                      <div className="space-y-3 text-slate-300 leading-relaxed">
                        <p className="font-mono text-sm">
                          "Bem-vindo, caçador. Sinto a marca dos portais em sua alma..."
                        </p>
                        <p className="font-mono text-sm">
                          "Você busca um Avatar, uma entidade que lutará ao seu lado contra os horrores dimensionais. 
                          Mas saiba: o vínculo entre caçador e Avatar é sagrado. Cuide bem dele, ou perderá mais do que imagina."
                        </p>
                        <p className="font-mono text-sm">
                          "Deixe-me olhar através das fendas da realidade e invocar um guardião digno de sua essência..."
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent mb-6"></div>

                  {/* Info de Custo */}
                  <div className="bg-slate-900/50 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-400 text-sm font-mono">Custo da Invocação:</span>
                      <span className="text-xl font-bold">
                        {stats?.primeira_invocacao ? (
                          <span className="text-green-400">GRATUITA</span>
                        ) : (
                          <span className="text-amber-400">100 moedas</span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-sm font-mono">Seus Recursos:</span>
                      <div className="flex gap-4">
                        <span className="text-amber-400 font-bold">{stats?.moedas || 0} 💰</span>
                        <span className="text-purple-400 font-bold">{stats?.fragmentos || 0} 💎</span>
                      </div>
                    </div>
                  </div>

                  {/* Aviso */}
                  {stats?.primeira_invocacao && (
                    <div className="bg-purple-950/30 border border-purple-500/30 rounded p-4 mb-6">
                      <p className="text-purple-300 text-sm font-mono text-center">
                        ✨ Sua primeira invocação é especial e gratuita. O primeiro Avatar sempre será de raridade Comum.
                      </p>
                    </div>
                  )}

                  {/* Botão Invocar */}
                  <button
                    onClick={iniciarInvocacao}
                    disabled={!stats?.primeira_invocacao && stats?.moedas < 100}
                    className="w-full group/btn relative disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 rounded-lg blur opacity-50 group-hover/btn:opacity-75 transition-all duration-300"></div>
                    
                    <div className="relative px-8 py-5 bg-slate-950 rounded-lg border border-purple-500/50 group-hover/btn:border-purple-400 transition-all">
                      <span className="text-xl font-bold tracking-wider uppercase bg-gradient-to-r from-purple-300 to-cyan-300 bg-clip-text text-transparent">
                        Iniciar Invocação
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ETAPA 2: INVOCANDO */}
          {etapa === 'invocando' && (
            <div className="text-center space-y-8 animate-fade-in">
              <div className="text-8xl animate-spin-slow mb-8">🔮</div>
              
              <div className="relative group max-w-2xl mx-auto">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/30 via-pink-500/30 to-cyan-500/30 rounded-lg blur animate-pulse"></div>
                
                <div className="relative bg-slate-950/90 backdrop-blur-xl border border-purple-900/30 rounded-lg p-8">
                  <h2 className="text-3xl font-black bg-gradient-to-r from-purple-300 to-cyan-300 bg-clip-text text-transparent mb-4">
                    INVOCANDO...
                  </h2>
                  
                  <div className="space-y-4 text-slate-300 font-mono text-sm">
                    <p className="animate-pulse">Rasgando o véu entre dimensões...</p>
                    <p className="animate-pulse" style={{animationDelay: '0.5s'}}>Conectando com entidades além do plano físico...</p>
                    <p className="animate-pulse" style={{animationDelay: '1s'}}>Materializando a essência dimensional...</p>
                  </div>

                  {/* Barra de loading */}
                  <div className="mt-8 w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 animate-loading-bar"></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ETAPA 3: REVELAÇÃO */}
          {etapa === 'revelacao' && avatarGerado && (
            <div className="space-y-8 animate-fade-in">
              {/* Mensagem do Ocultista */}
              <div className="text-center mb-8">
                <div className="text-6xl mb-4">✨</div>
                <h2 className="text-4xl font-black bg-gradient-to-r from-purple-300 to-cyan-300 bg-clip-text text-transparent mb-2">
                  INVOCAÇÃO COMPLETA
                </h2>
                <p className="text-slate-400 font-mono text-sm">Um novo guardião atende ao seu chamado</p>
              </div>

              {/* Card do Avatar */}
              <div className="relative group max-w-2xl mx-auto">
                <div className="flex justify-center py-8 bg-slate-900/30 rounded-t-lg">
                  <AvatarSVG avatar={avatarGerado} tamanho={250} />
                </div>
                
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/30 via-pink-500/30 to-cyan-500/30 rounded-lg blur opacity-75"></div>
                
                <div className="relative bg-slate-950/90 backdrop-blur-xl border border-purple-900/30 rounded-lg overflow-hidden">
                  {/* Header com raridade */}
                  <div className={`p-4 text-center font-bold text-lg ${
                    avatarGerado.raridade === 'Lendário' ? 'bg-gradient-to-r from-amber-600 to-yellow-500' :
                    avatarGerado.raridade === 'Raro' ? 'bg-gradient-to-r from-purple-600 to-pink-600' :
                    'bg-gradient-to-r from-slate-700 to-slate-600'
                  }`}>
                    {avatarGerado.raridade.toUpperCase()}
                  </div>

                  <div className="p-8">
                    {/* Nome */}
                    <h3 className="text-3xl font-black text-center mb-2 bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent">
                      {avatarGerado.nome}
                    </h3>

                    {/* Elemento */}
                    <div className="text-center mb-6">
                      <span className="inline-block px-4 py-1 bg-slate-800 rounded-full text-sm font-mono text-cyan-400">
                        {avatarGerado.elemento}
                      </span>
                    </div>

                    {/* Descrição */}
                    <p className="text-slate-300 text-center leading-relaxed mb-8 italic">
                      {avatarGerado.descricao}
                    </p>

                    <div className="h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent mb-8"></div>

                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-4 mb-8">
                      <div className="bg-slate-900/50 rounded p-4 text-center border border-red-500/20">
                        <div className="text-xs text-slate-500 uppercase mb-1">Força</div>
                        <div className="text-3xl font-bold text-red-400">{avatarGerado.forca}</div>
                      </div>
                      <div className="bg-slate-900/50 rounded p-4 text-center border border-green-500/20">
                        <div className="text-xs text-slate-500 uppercase mb-1">Agilidade</div>
                        <div className="text-3xl font-bold text-green-400">{avatarGerado.agilidade}</div>
                      </div>
                      <div className="bg-slate-900/50 rounded p-4 text-center border border-blue-500/20">
                        <div className="text-xs text-slate-500 uppercase mb-1">Resistência</div>
                        <div className="text-3xl font-bold text-blue-400">{avatarGerado.resistencia}</div>
                      </div>
                      <div className="bg-slate-900/50 rounded p-4 text-center border border-purple-500/20">
                        <div className="text-xs text-slate-500 uppercase mb-1">Foco</div>
                        <div className="text-3xl font-bold text-purple-400">{avatarGerado.foco}</div>
                      </div>
                    </div>

                    {/* Habilidades */}
                    <div className="space-y-3 mb-8">
                      <h4 className="text-cyan-400 font-bold text-sm uppercase tracking-wider">Habilidades</h4>
                      {avatarGerado.habilidades.map((hab, index) => (
                        <div key={index} className="bg-slate-900/50 rounded p-3 border border-slate-700/50">
                          <div className="font-bold text-purple-400 text-sm mb-1">{hab.nome}</div>
                          <div className="text-slate-400 text-xs">{hab.descricao}</div>
                        </div>
                      ))}
                    </div>

                    {/* Info adicional */}
                    <div className="grid grid-cols-3 gap-4 text-center text-sm">
                      <div>
                        <div className="text-slate-500 text-xs mb-1">Nível</div>
                        <div className="text-cyan-400 font-bold">{avatarGerado.nivel}</div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-xs mb-1">Vínculo</div>
                        <div className="text-purple-400 font-bold">{avatarGerado.vinculo}%</div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-xs mb-1">Status</div>
                        <div className="text-green-400 font-bold">Ativo</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botão finalizar */}
              <div className="text-center">
                <button
                  onClick={finalizarInvocacao}
                  className="group relative inline-block"
                >
                  <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-lg blur opacity-50 group-hover:opacity-75 transition-all duration-300"></div>
                  
                  <div className="relative px-12 py-4 bg-slate-950 rounded-lg border border-cyan-500/50 group-hover:border-cyan-400 transition-all">
                    <span className="text-lg font-bold tracking-wider uppercase bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
                      Ver Meus Avatares
                    </span>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Efeito de scan */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.015]">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/50 to-transparent animate-scan"></div>
      </div>

      <style jsx>{`

        @keyframes scan {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(100%);
          }
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes loading-bar {
          0% {
            width: 0%;
          }
          100% {
            width: 100%;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }

        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }

        .animate-loading-bar {
          animation: loading-bar 3s ease-out;
        }
      `}</style>
    </div>
  );
}
