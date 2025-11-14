"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AvatarAtivo from "./components/AvatarAtivo";
import AvatarCard from "./components/AvatarCard";
import AvatarDetalhes from "./components/AvatarDetalhes";

export default function AvatarsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [avatares, setAvatares] = useState([]);
  const [avatarSelecionado, setAvatarSelecionado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalConfirmacao, setModalConfirmacao] = useState(null);
  const [ativando, setAtivando] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    carregarAvatares(parsedUser.id);
  }, [router]);

  const carregarAvatares = async (userId) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/meus-avatares?userId=${userId}&t=${Date.now()}`);
      const data = await response.json();
      
      if (response.ok) {
        setAvatares(data.avatares);
      } else {
        console.error("Erro ao carregar avatares:", data.message);
      }
    } catch (error) {
      console.error("Erro ao carregar avatares:", error);
    } finally {
      setLoading(false);
    }
  };

  const ativarAvatar = async (avatarId, avatarNome) => {
    if (ativando) return;
    
    setAtivando(true);
    
    try {
      const response = await fetch("/api/meus-avatares", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, avatarId }),
      });

      const data = await response.json();

      if (response.ok) {
        await carregarAvatares(user.id);
        setModalConfirmacao({
          tipo: 'sucesso',
          mensagem: `${avatarNome} foi ativado com sucesso!`
        });
      } else {
        setModalConfirmacao({
          tipo: 'erro',
          mensagem: data.message || 'Erro ao ativar avatar'
        });
      }
    } catch (error) {
      console.error("Erro ao ativar avatar:", error);
      setModalConfirmacao({
        tipo: 'erro',
        mensagem: 'Erro de conexão ao ativar avatar'
      });
    } finally {
      setAtivando(false);
    }
  };

  // Funções auxiliares de estilo
  const getCorRaridade = (raridade) => {
    switch (raridade) {
      case 'Lendário': return 'from-amber-500 to-yellow-500';
      case 'Raro': return 'from-purple-500 to-pink-500';
      default: return 'from-slate-600 to-slate-700';
    }
  };

  const getCorBorda = (raridade) => {
    switch (raridade) {
      case 'Lendário': return 'border-amber-500/50';
      case 'Raro': return 'border-purple-500/50';
      default: return 'border-slate-700/50';
    }
  };

  const getCorElemento = (elemento) => {
    const cores = {
      'Fogo': 'text-orange-400',
      'Água': 'text-blue-400',
      'Terra': 'text-amber-600',
      'Vento': 'text-cyan-400',
      'Eletricidade': 'text-yellow-400',
      'Sombra': 'text-purple-400',
      'Luz': 'text-yellow-200'
    };
    return cores[elemento] || 'text-gray-400';
  };

  const getEmojiElemento = (elemento) => {
    const emojis = {
      'Fogo': '🔥',
      'Água': '💧',
      'Terra': '🪨',
      'Vento': '💨',
      'Eletricidade': '⚡',
      'Sombra': '🌑',
      'Luz': '✨'
    };
    return emojis[elemento] || '⭐';
  };

  const avatarAtivo = avatares.find(av => av.ativo && av.vivo);
  
  // Filtrar avatares inativos, EXCLUINDO os que estão no memorial (mortos + marca da morte)
  const avataresInativos = avatares.filter(av => {
    // Não mostrar avatares que estão no memorial
    if (!av.vivo && av.marca_morte) return false;
    // Mostrar os demais inativos
    return !av.ativo || !av.vivo;
  });
  
  // Contar avatares caídos (mortos com marca da morte) - para o botão do memorial
  const avataresCaidos = avatares.filter(av => !av.vivo && av.marca_morte).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center">
        <div className="text-cyan-400 font-mono animate-pulse">Carregando coleção...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-gray-100 relative overflow-hidden">
      {/* Partículas de fundo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl top-20 -left-48 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-purple-500/5 rounded-full blur-3xl bottom-20 -right-48 animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      {/* Grid hexagonal */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTYiIGhlaWdodD0iMTAwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0yOCAwTDAgMTVWMzVMMjggNTBMNTYgMzVWMTVaTTI4IDUwTDAgNjVWODVMMjggMTAwTDU2IDg1VjY1WiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjY3lhbiIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48L3N2Zz4=')] pointer-events-none"></div>

      {/* Vinheta */}
      <div className="absolute inset-0 shadow-[inset_0_0_120px_rgba(0,0,0,0.9)] pointer-events-none"></div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 bg-clip-text text-transparent mb-2">
              MINHA COLEÇÃO
            </h1>
            <p className="text-slate-400 font-mono text-sm">
              {avatares.length} {avatares.length === 1 ? 'Avatar' : 'Avatares'} | {avatares.filter(a => a.vivo).length} Vivos | {avatares.filter(a => !a.vivo).length} Destruídos
            </p>
          </div>
          
          <div className="flex gap-4">
            {/* Botão Memorial */}
            {avataresCaidos > 0 && (
              <button
                onClick={() => router.push("/memorial")}
                className="group relative"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 rounded-lg blur opacity-30 group-hover:opacity-60 transition-all duration-300"></div>
                
                <div className="relative px-5 py-2.5 bg-gradient-to-b from-gray-900 to-black rounded-lg border border-gray-700/50 group-hover:border-gray-600 transition-all flex items-center gap-3">
                  <div className="relative">
                    <span className="text-2xl opacity-40 group-hover:opacity-60 transition-opacity animate-flicker-slow">🕯️</span>
                  </div>
                  <div className="text-left">
                    <div className="text-gray-400 group-hover:text-gray-300 font-bold text-sm tracking-wide transition-colors">
                      MEMORIAL
                    </div>
                    <div className="text-gray-600 text-xs font-mono">
                      {avataresCaidos} {avataresCaidos === 1 ? 'herói caído' : 'heróis caídos'}
                    </div>
                  </div>
                </div>
              </button>
            )}
            
            <button
              onClick={() => router.push("/ocultista")}
              className="text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-2 font-mono text-sm group"
            >
              <span>🔮</span>
              <span>INVOCAR</span>
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-2 font-mono text-sm group"
            >
              <span className="group-hover:-translate-x-1 transition-transform">←</span> 
              <span>VOLTAR</span>
            </button>
          </div>
        </div>

        {/* Informação sobre Recuperação */}
        {avatares.length > 0 && (
          <div className="mb-8 bg-gradient-to-r from-blue-950/50 to-purple-950/50 border border-blue-500/30 rounded-lg p-6">
            <h3 className="text-cyan-400 font-bold mb-3 flex items-center gap-2">
              <span className="text-xl">ℹ️</span>
              <span>RECUPERAÇÃO DE AVATARES</span>
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              {/* Exaustão */}
              <div className="bg-slate-900/50 border border-orange-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">😰</span>
                  <span className="text-orange-400 font-bold">EXAUSTÃO</span>
                </div>
                <ul className="text-slate-300 space-y-1 text-xs">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span><strong className="text-slate-200">Avatares inativos:</strong> Recuperam 8 pontos/hora automaticamente</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-0.5">✗</span>
                    <span><strong className="text-slate-200">Avatar ativo:</strong> NÃO recupera exaustão (em uso)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-0.5">⏱️</span>
                    <span>Mínimo 5 minutos para processar recuperação</span>
                  </li>
                </ul>
              </div>

              {/* HP */}
              <div className="bg-slate-900/50 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">❤️</span>
                  <span className="text-green-400 font-bold">HP (SAÚDE)</span>
                </div>
                <ul className="text-slate-300 space-y-1 text-xs">
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-0.5">✗</span>
                    <span><strong className="text-slate-200">Sem recuperação automática</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-400 mt-0.5">⭐</span>
                    <span><strong className="text-slate-200">Recupera ao subir de nível:</strong> +20 HP</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-0.5">🔮</span>
                    <span>Use itens ou habilidades de cura (em breve)</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Lista vazia */}
        {avatares.length === 0 && (
          <div className="max-w-2xl mx-auto text-center py-20">
            <div className="text-6xl mb-6">🔮</div>
            <h2 className="text-2xl font-bold text-slate-300 mb-4">Nenhum Avatar Invocado</h2>
            <p className="text-slate-400 mb-8">
              Você ainda não possui avatares. Visite o Ocultista para invocar seu primeiro guardião!
            </p>
            <button
              onClick={() => router.push("/ocultista")}
              className="group relative inline-block"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 rounded-lg blur opacity-50 group-hover:opacity-75 transition-all duration-300"></div>
              
              <div className="relative px-8 py-4 bg-slate-950 rounded-lg border border-purple-500/50 group-hover:border-purple-400 transition-all">
                <span className="text-lg font-bold tracking-wider uppercase bg-gradient-to-r from-purple-300 to-cyan-300 bg-clip-text text-transparent">
                  Invocar Avatar
                </span>
              </div>
            </button>
          </div>
        )}

        {/* Avatar Ativo */}
        <AvatarAtivo
          avatar={avatarAtivo}
          onClickDetalhes={setAvatarSelecionado}
          getCorRaridade={getCorRaridade}
          getCorBorda={getCorBorda}
          getCorElemento={getCorElemento}
          getEmojiElemento={getEmojiElemento}
        />

        {/* Outros Avatares */}
        {avataresInativos.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-slate-400 mb-6 flex items-center gap-3">
              <span className="text-3xl">📚</span>
              <span>OUTROS AVATARES ({avataresInativos.length})</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {avataresInativos.map((avatar) => (
                <AvatarCard
                  key={avatar.id}
                  avatar={avatar}
                  onClickDetalhes={setAvatarSelecionado}
                  onClickAtivar={ativarAvatar}
                  ativando={ativando}
                  getCorRaridade={getCorRaridade}
                  getCorBorda={getCorBorda}
                  getCorElemento={getCorElemento}
                  getEmojiElemento={getEmojiElemento}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Confirmação */}
      {modalConfirmacao && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setModalConfirmacao(null)}
        >
          <div 
            className="max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative group">
              <div className={`absolute -inset-1 ${
                modalConfirmacao.tipo === 'sucesso' 
                  ? 'bg-gradient-to-r from-green-500/30 via-cyan-500/30 to-blue-500/30' 
                  : 'bg-gradient-to-r from-red-500/30 via-orange-500/30 to-red-500/30'
              } rounded-lg blur opacity-75 animate-pulse`}></div>
              
              <div className="relative bg-slate-950/95 backdrop-blur-xl border-2 border-cyan-900/50 rounded-lg overflow-hidden">
                <div className={`p-4 text-center font-bold text-lg ${
                  modalConfirmacao.tipo === 'sucesso'
                    ? 'bg-gradient-to-r from-green-600 to-cyan-600'
                    : 'bg-gradient-to-r from-red-600 to-orange-600'
                }`}>
                  {modalConfirmacao.tipo === 'sucesso' ? '✅ SUCESSO' : '❌ ERRO'}
                </div>

                <div className="p-8 text-center">
                  <div className="text-6xl mb-4">
                    {modalConfirmacao.tipo === 'sucesso' ? '⚔️' : '⚠️'}
                  </div>

                  <p className="text-xl text-slate-200 font-bold mb-2">
                    {modalConfirmacao.mensagem}
                  </p>

                  {modalConfirmacao.tipo === 'sucesso' && (
                    <p className="text-sm text-slate-400 font-mono mb-6">
                      Avatar pronto para combate
                    </p>
                  )}

                  <button
                    onClick={() => setModalConfirmacao(null)}
                    className="group/btn relative inline-block mt-4"
                  >
                    <div className={`absolute -inset-1 ${
                      modalConfirmacao.tipo === 'sucesso'
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500'
                        : 'bg-gradient-to-r from-red-500 to-orange-500'
                    } rounded blur opacity-50 group-hover/btn:opacity-75 transition-all duration-300`}></div>
                    
                    <div className="relative px-8 py-3 bg-slate-950 rounded border border-cyan-500/50 group-hover/btn:border-cyan-400 transition-all">
                      <span className="font-bold tracking-wider uppercase bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
                        Entendido
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalhes */}
      <AvatarDetalhes
        avatar={avatarSelecionado}
        onClose={() => setAvatarSelecionado(null)}
        getCorRaridade={getCorRaridade}
        getCorBorda={getCorBorda}
        getCorElemento={getCorElemento}
        getEmojiElemento={getEmojiElemento}
      />

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes flicker-slow {
          0%, 100% {
            opacity: 0.4;
          }
          50% {
            opacity: 0.6;
          }
        }
      
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .animate-flicker-slow {
          animation: flicker-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
