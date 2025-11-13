"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AvatarSVG from '../components/AvatarSVG';

export default function MemorialPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [avataresMarcados, setAvataresMarcados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [avatarSelecionado, setAvatarSelecionado] = useState(null);

  useEffect(() => {
    const init = async () => {
      const userData = localStorage.getItem("user");
      if (!userData) {
        router.push("/login");
        return;
      }

      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);

      try {
        const response = await fetch(`/api/meus-avatares?userId=${parsedUser.id}`);
        const data = await response.json();
        
        if (response.ok) {
          // Filtrar apenas avatares mortos E com marca da morte
          const marcados = (data.avatares || []).filter(av => !av.vivo && av.marca_morte);
          setAvataresMarcados(marcados);
        }
      } catch (error) {
        console.error("Erro ao carregar memorial:", error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  const voltarParaAvatares = () => {
    router.push("/avatares");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-950 flex items-center justify-center">
        <div className="text-gray-600 font-mono animate-pulse">Adentrando o memorial...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-950 text-gray-100 relative overflow-hidden">
      {/* Névoa densa */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[1000px] h-[1000px] bg-gray-900/10 rounded-full blur-[150px] top-0 left-0 animate-float-slow"></div>
        <div className="absolute w-[800px] h-[800px] bg-gray-800/10 rounded-full blur-[120px] bottom-0 right-0 animate-float-slower"></div>
        <div className="absolute w-[600px] h-[600px] bg-slate-900/10 rounded-full blur-[100px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-float-slow" style={{animationDelay: '3s'}}></div>
      </div>

      {/* Vinheta muito escura */}
      <div className="absolute inset-0 shadow-[inset_0_0_300px_rgba(0,0,0,0.95)] pointer-events-none"></div>

      {/* Partículas de cinzas caindo */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-gray-600 rounded-full animate-fall"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${8 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        {/* Botão Voltar */}
        <button
          onClick={voltarParaAvatares}
          className="absolute top-8 left-8 text-gray-600 hover:text-gray-500 transition-colors flex items-center gap-2 font-mono text-sm group"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span> 
          <span>SAIR DO MEMORIAL</span>
        </button>

        <div className="max-w-7xl w-full">
          {/* Cabeçalho */}
          <div className="text-center mb-20">
            {/* Portão do cemitério */}
            <div className="mb-8 relative">
              <div className="flex justify-center items-end gap-4 mb-6">
                <div className="w-2 h-32 bg-gradient-to-b from-gray-700 to-gray-900 rounded-t"></div>
                <div className="relative">
                  <div className="text-7xl opacity-30 blur-sm absolute inset-0 flex items-center justify-center">🕯️</div>
                  <div className="text-7xl relative animate-flicker">🕯️</div>
                </div>
                <div className="w-2 h-32 bg-gradient-to-b from-gray-700 to-gray-900 rounded-t"></div>
              </div>
            </div>
            
            <h3 className="text-5xl font-black text-gray-500 mb-6 tracking-widest drop-shadow-2xl">
              MEMORIAL DOS CAÍDOS
            </h3>
            
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="h-px w-48 bg-gradient-to-r from-transparent via-gray-700 to-gray-700"></div>
              
              <div className="h-px w-48 bg-gradient-to-l from-transparent via-gray-700 to-gray-700"></div>
            </div>
            
            <p className="text-gray-600 font-mono text-base max-w-3xl mx-auto leading-relaxed mb-6">
              "Aqui repousam os guerreiros que tombaram em combate honrado.<br/>
              Heróis que lutaram até o último suspiro, defendendo o que era certo.<br/>
              Não poderão mais ressurgir, mas jamais serão esquecidos."
            </p>

            {avataresMarcados.length > 0 && (
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-gray-950/50 border border-gray-800/50 rounded-full">
                <span className="text-amber-900/50">⚔️</span>
                <span className="text-gray-600 font-mono text-sm">
                  {avataresMarcados.length} {avataresMarcados.length === 1 ? 'herói caído' : 'heróis caídos'} em batalha
                </span>
              </div>
            )}
          </div>

          {/* Lista de Avatares Marcados */}
          {avataresMarcados.length === 0 ? (
            <div className="text-center py-32">
              <div className="relative mb-8">
                <div className="text-9xl opacity-10 blur-sm">🪦</div>
                <div className="absolute inset-0 flex items-center justify-center text-9xl opacity-5">🪦</div>
              </div>
              <h3 className="text-3xl font-bold text-gray-700 mb-4">Memorial Vazio</h3>
              <p className="text-gray-700 text-base mb-10 max-w-md mx-auto leading-relaxed">
                Nenhum avatar tombou em combate ainda.<br/>
                Que suas vitórias sejam muitas e suas perdas, nenhuma.
              </p>
              <button
                onClick={voltarParaAvatares}
                className="text-gray-600 hover:text-gray-500 transition-colors font-mono text-sm px-6 py-3 border border-gray-800/30 rounded hover:border-gray-700/50"
              >
                Retornar aos Avatares
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
              {avataresMarcados.map((avatar) => (
                <div 
                  key={avatar.id} 
                  className="relative group transform hover:scale-105 transition-all duration-500"
                >
                  {/* Efeito de névoa ao redor */}
                  <div className="absolute -inset-4 bg-gradient-to-b from-gray-900/0 via-gray-900/5 to-gray-900/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
                  
                  {/* Lápide */}
                  <div className="relative bg-gradient-to-b from-gray-900/80 to-black/80 backdrop-blur border-2 border-gray-800/50 rounded-2xl overflow-hidden group-hover:border-gray-700/70 transition-all duration-500 shadow-2xl">
                    {/* Topo da lápide com formato arredondado */}
                    <div className="relative bg-gradient-to-b from-gray-800/50 to-gray-900/50 pt-8 pb-4 rounded-t-2xl">
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-2 bg-gray-700/30 rounded-b-full"></div>
                      
                      <div className="text-center">
                        <div className="text-5xl mb-3 opacity-30 animate-flicker-slow">🪦</div>
                        <div className={`text-xs font-black tracking-widest ${
                          avatar.raridade === 'Lendário' ? 'text-amber-700/50' :
                          avatar.raridade === 'Raro' ? 'text-purple-700/50' :
                          'text-gray-700/70'
                        }`}>
                          {avatar.raridade.toUpperCase()}
                        </div>
                      </div>
                    </div>

                    {/* Corpo da lápide */}
                    <div className="p-6 pb-8">
                      {/* Avatar centralizado com moldura */}
                      <div className="mb-6 flex justify-center">
                        <div className="relative">
                          <div className="absolute -inset-2 bg-gradient-to-b from-gray-800/20 to-transparent rounded-full blur"></div>
                          <div className="relative p-4 bg-gray-950/50 rounded-full border border-gray-800/30 opacity-40 grayscale hover:opacity-50 hover:grayscale-[60%] transition-all duration-700">
                            <AvatarSVG avatar={avatar} tamanho={180} />
                          </div>
                        </div>
                      </div>

                      {/* Nome gravado */}
                      <div className="text-center mb-6">
                        <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-800 to-transparent mb-4"></div>
                        <h3 className="text-2xl font-black text-gray-500 tracking-wide mb-2">
                          {avatar.nome}
                        </h3>
                        <div className="flex items-center justify-center gap-2 text-xs text-gray-700">
                          <span>{avatar.elemento}</span>
                          <span>•</span>
                          <span>Nível {avatar.nivel}</span>
                        </div>
                        <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-800 to-transparent mt-4"></div>
                      </div>

                      {/* Descanse em Paz */}
                      <div className="flex justify-center mb-6">
                        <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900/50 border border-gray-700/40 rounded-full">
                          <span className="text-gray-500 text-xs font-black tracking-widest">⚰️ DESCANSE EM PAZ</span>
                        </div>
                      </div>

                      {/* Epitáfio */}
                      <div className="text-center">
                        <p className="text-gray-700 text-xs font-mono italic leading-relaxed">
                          "Tombou em combate honrado,<br/>um verdadeiro guerreiro até o fim."
                        </p>
                      </div>
                    </div>

                    {/* Base da lápide */}
                    <div className="h-3 bg-gradient-to-b from-gray-900 to-gray-950 border-t border-gray-800/50"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Modal de Detalhes */}
          {avatarSelecionado && (
            <div></div>
          )}
        </div>
      </div>

      {/* Chão do cemitério */}
      <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-black via-gray-950/50 to-transparent pointer-events-none"></div>

      <style jsx>{`
        @keyframes float-slow {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }
          50% {
            transform: translateY(-40px) translateX(30px);
          }
        }

        @keyframes float-slower {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }
          50% {
            transform: translateY(30px) translateX(-40px);
          }
        }

        @keyframes fall {
          0% {
            transform: translateY(-10px) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }

        @keyframes flicker {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.6;
          }
        }

        @keyframes flicker-slow {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.5;
          }
        }

        @keyframes pulse-slow {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-float-slow {
          animation: float-slow 25s ease-in-out infinite;
        }

        .animate-float-slower {
          animation: float-slower 30s ease-in-out infinite;
        }

        .animate-fall {
          animation: fall linear infinite;
        }

        .animate-flicker {
          animation: flicker 3s ease-in-out infinite;
        }

        .animate-flicker-slow {
          animation: flicker-slow 4s ease-in-out infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }

        .animate-fade-in {
          animation: fade-in 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}
