"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BackgroundEffects from "@/components/BackgroundEffects";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [avatares, setAvatares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAvatares, setLoadingAvatares] = useState(true);
  const [modalEditarNome, setModalEditarNome] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [salvandoNome, setSalvandoNome] = useState(false);
  const [erroNome, setErroNome] = useState("");

  // Função para gerar código de caçador
  const gerarCodigoCacador = (userId) => {
    if (!userId) return "HNT-000-000";
    const prefixo = userId.slice(0, 3).toUpperCase();
    const sufixo = userId.slice(-3).toUpperCase();
    return `HNT-${prefixo}-${sufixo}`;
  };

  // Função para gerar nome de caçador padrão (fallback)
  const gerarNomeCacadorPadrao = (email) => {
    if (!email) return "Caçador";
    const username = email.split('@')[0];
    return username.charAt(0).toUpperCase() + username.slice(1);
  };

  // Função para pegar nome de operação (customizado ou padrão)
  const getNomeOperacao = () => {
    return stats?.nome_operacao || gerarNomeCacadorPadrao(user?.email);
  };

  // Função para pegar emoji do elemento do avatar ativo
  const getEmojiAvatarAtivo = () => {
    const avatarAtivo = avatares.find(av => av.ativo && av.vivo);
    
    if (!avatarAtivo) return '🛡️'; // Padrão se não tiver avatar ativo
    
    const emojis = {
      'Fogo': '🔥',
      'Água': '💧',
      'Terra': '🪨',
      'Vento': '💨',
      'Eletricidade': '⚡',
      'Sombra': '🌑',
      'Luz': '✨'
    };
    
    return emojis[avatarAtivo.elemento] || '🛡️';
  };

  // Função para calcular dias desde o registro
  const calcularDiasRegistro = () => {
    if (!stats?.created_at) return 0;
    
    try {
      const dataRegistro = new Date(stats.created_at);
      if (isNaN(dataRegistro.getTime())) return 0;
      
      const hoje = new Date();
      const diferencaMs = hoje - dataRegistro;
      const dias = Math.floor(diferencaMs / (1000 * 60 * 60 * 24));
      
      return dias === 0 ? 1 : dias;
    } catch (error) {
      console.error('Erro ao calcular dias de registro:', error);
      return 0;
    }
  };

  // Função para formatar data de registro
  const formatarDataRegistro = () => {
    if (!stats?.created_at) return "Data não disponível";
    
    try {
      const data = new Date(stats.created_at);
      if (isNaN(data.getTime())) return "Data inválida";
      
      const dia = String(data.getDate()).padStart(2, '0');
      const mes = String(data.getMonth() + 1).padStart(2, '0');
      const ano = data.getFullYear();
      
      return `${dia}/${mes}/${ano}`;
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return "Erro na data";
    }
  };

  // Função para determinar classificação
  const getClassificacao = () => {
    const totalMissoes = stats?.missoes_completadas || 0;
    
    if (totalMissoes >= 1000) return { 
      nome: "ELITE", 
      cor: "text-amber-400",
      icone: "👑",
      borda: "border-amber-400/50",
      bg: "bg-amber-500/10"
    };
    if (totalMissoes >= 500) return { 
      nome: "VETERANO", 
      cor: "text-purple-400",
      icone: "⭐",
      borda: "border-purple-400/50",
      bg: "bg-purple-500/10"
    };
    if (totalMissoes >= 100) return { 
      nome: "EXPERIENTE", 
      cor: "text-blue-400",
      icone: "🎖️",
      borda: "border-blue-400/50",
      bg: "bg-blue-500/10"
    };
    if (totalMissoes >= 10) return { 
      nome: "ATIVO", 
      cor: "text-green-400",
      icone: "✓",
      borda: "border-green-400/50",
      bg: "bg-green-500/10"
    };
    return { 
      nome: "RECRUTA", 
      cor: "text-slate-400",
      icone: "🆕",
      borda: "border-slate-600/50",
      bg: "bg-slate-500/10"
    };
  };

  // Função para abrir modal de edição
  const abrirModalEditarNome = () => {
    setNovoNome(getNomeOperacao());
    setErroNome("");
    setModalEditarNome(true);
  };

  // Função para salvar nome
  const salvarNome = async () => {
    if (!novoNome || novoNome.trim().length === 0) {
      setErroNome("Nome não pode estar vazio");
      return;
    }

    if (novoNome.length > 30) {
      setErroNome("Nome deve ter no máximo 30 caracteres");
      return;
    }

    const regex = /^[a-zA-Z0-9À-ÿ\s\-_]+$/;
    if (!regex.test(novoNome)) {
      setErroNome("Nome contém caracteres inválidos");
      return;
    }

    setSalvandoNome(true);
    setErroNome("");

    try {
      const response = await fetch("/api/atualizar-nome", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId: user.id, 
          nomeOperacao: novoNome.trim() 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStats(data.stats);
        setModalEditarNome(false);
      } else {
        setErroNome(data.message);
      }
    } catch (error) {
      console.error("Erro ao salvar nome:", error);
      setErroNome("Erro ao salvar. Tente novamente.");
    } finally {
      setSalvandoNome(false);
    }
  };

  useEffect(() => {
    const initializePlayer = async () => {
      const userData = localStorage.getItem("user");
      if (!userData) {
        router.push("/login");
        return;
      }

      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);

      try {
        const response = await fetch("/api/inicializar-jogador", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: parsedUser.id }),
        });

        const data = await response.json();
        setStats(data.stats);

        setLoadingAvatares(true);
        const avatarResponse = await fetch(`/api/meus-avatares?userId=${parsedUser.id}`);
        const avatarData = await avatarResponse.json();
        
        if (avatarResponse.ok) {
          setAvatares(avatarData.avatares || []);
        } else {
          console.error("Erro ao carregar avatares:", avatarData.message);
          setAvatares([]);
        }
      } catch (error) {
        console.error("Erro ao inicializar:", error);
        setAvatares([]);
      } finally {
        setLoading(false);
        setLoadingAvatares(false);
      }
    };

    initializePlayer();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center">
        <div className="text-cyan-400 font-mono animate-pulse">Inicializando sistema...</div>
      </div>
    );
  }

  const classificacao = getClassificacao();
  const avatarAtivo = avatares.find(av => av.ativo && av.vivo);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-gray-100 relative overflow-hidden">
      <BackgroundEffects />

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 bg-clip-text text-transparent mb-2">
              CENTRAL DE COMANDO
            </h1>
            <p className="text-slate-400 font-mono text-sm">Bem-vindo de volta, Caçador!</p>
          </div>
          
          <button
            onClick={handleLogout}
            className="group relative px-6 py-3"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500/30 to-red-600/30 rounded blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
            <div className="relative px-6 py-3 bg-slate-950 rounded border border-red-500/50 group-hover:border-red-400 transition-all">
              <span className="text-sm font-bold tracking-wider uppercase text-red-400">
                Sair
              </span>
            </div>
          </button>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Esquerda - Info do Jogador */}
          <div className="lg:col-span-2">
            {/* Carteira de Identidade de Caçador */}
            <div className="relative group mb-6">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 rounded-lg blur opacity-50"></div>
              
              <div className="relative bg-slate-950/90 backdrop-blur-xl border-2 border-cyan-900/50 rounded-lg overflow-hidden">
                {/* Header da Carteira */}
                <div className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border-b border-cyan-500/30 px-6 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-cyan-500/20 rounded border border-cyan-500/50 flex items-center justify-center">
                        <span className="text-cyan-400 text-xl">{getEmojiAvatarAtivo()}</span>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 font-mono uppercase tracking-wider">Organização de Caçadores Dimensionais</div>
                        <div className="text-sm font-bold text-cyan-400">CARTEIRA OFICIAL</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-500 font-mono">ID DE REGISTRO</div>
                      <div className="text-sm font-bold text-cyan-400 font-mono">{gerarCodigoCacador(user?.id)}</div>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex gap-6 mb-6">
                    {/* Foto/Avatar - CLASSIFIED */}
                    <div className="flex-shrink-0">
                      <div className="w-32 h-32 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg flex items-center justify-center border-2 border-red-500/50 relative overflow-hidden">
                        {/* Efeito de barras diagonais */}
                        <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(239,68,68,0.1)_10px,rgba(239,68,68,0.1)_20px)]"></div>
                        
                        {/* Texto CLASSIFIED */}
                        <div className="relative z-10 text-center">
                          <div className="text-4xl mb-1 opacity-50">🕶️</div>
                          <div className="text-xs font-bold text-red-400 tracking-wider bg-red-950/50 px-2 py-1 border border-red-500/30">
                            CLASSIFIED
                          </div>
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className={`text-center px-3 py-1.5 rounded border ${classificacao.borda} ${classificacao.bg}`}>
                          <div className={`text-xs font-bold ${classificacao.cor} font-mono flex items-center justify-center gap-1.5`}>
                            <span>{classificacao.icone}</span>
                            <span>{classificacao.nome}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Informações do Caçador */}
                    <div className="flex-1 space-y-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <div className="text-xs text-slate-500 uppercase font-mono">Nome de Operação</div>
                          <button
                            onClick={abrirModalEditarNome}
                            className="text-cyan-400 hover:text-cyan-300 transition-colors"
                            title="Editar nome"
                          >
                            ✏️
                          </button>
                        </div>
                        <div className="text-2xl font-bold text-cyan-400">{getNomeOperacao()}</div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-slate-500 uppercase font-mono mb-1">Ranking</div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-purple-400">{stats?.ranking || 'F'}</span>
                            <span className="px-2 py-0.5 bg-purple-500/20 border border-purple-500/30 rounded text-xs text-purple-400 font-mono">
                              CLASSE
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 uppercase font-mono mb-1">Dias Ativos</div>
                          <div className="text-lg font-bold text-slate-300">{calcularDiasRegistro()} dias</div>
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-slate-500 uppercase font-mono mb-1">Status Operacional</div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-sm text-green-400 font-bold">ATIVO E OPERACIONAL</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent mb-4"></div>

                  {/* Recursos */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-900/50 rounded p-3 border border-amber-500/20">
                      <div className="text-xs text-slate-500 uppercase font-mono mb-1">💰 Moedas</div>
                      <div className="text-xl font-bold text-amber-400">{stats?.moedas || 0}</div>
                    </div>
                    <div className="bg-slate-900/50 rounded p-3 border border-purple-500/20">
                      <div className="text-xs text-slate-500 uppercase font-mono mb-1">💎 Fragmentos</div>
                      <div className="text-xl font-bold text-purple-400">{stats?.fragmentos || 0}</div>
                    </div>
                    <div className="bg-slate-900/50 rounded p-3 border border-red-500/20">
                      <div className="text-xs text-slate-500 uppercase font-mono mb-1">🔴 Dívida</div>
                      <div className="text-xl font-bold text-red-400">{stats?.divida || 0}</div>
                    </div>
                  </div>

                  {/* Selo de Autenticidade */}
                  <div className="mt-4 flex items-center justify-between pt-4 border-t border-slate-800/50">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-cyan-500/20 rounded-full border border-cyan-500/50 flex items-center justify-center">
                        <span className="text-cyan-400 text-xs">✓</span>
                      </div>
                      <span className="text-xs text-slate-500 font-mono">Membro desde: {formatarDataRegistro()}</span>
                    </div>
                    <div className="text-xs text-slate-600 font-mono">OCD-2025 // v2.1.4</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded blur"></div>
              <div className="relative bg-slate-950/50 backdrop-blur border border-slate-800/50 rounded p-6">
                <h3 className="text-cyan-400 font-bold mb-4 text-sm uppercase tracking-wider">Estatísticas de Campo</h3>
                
                {loadingAvatares ? (
                  <div className="text-center py-8 text-slate-500 font-mono text-sm animate-pulse">
                    Carregando estatísticas...
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-slate-500 text-xs mb-1">✅ Missões Completadas</div>
                      <div className="text-xl font-bold text-slate-300">{stats?.missoes_completadas || 0}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-xs mb-1">🔵 Total de Avatares</div>
                      <div className="text-xl font-bold text-slate-300">{avatares.length}</div>
                    </div>
                    
                    {avatares.length === 0 ? (
                      <div className="col-span-2 text-center py-4 bg-slate-900/30 rounded border border-slate-800/50">
                        <span className="text-slate-500 text-sm">
                          🔮 Nenhum avatar invocado ainda
                        </span>
                      </div>
                    ) : (
                      <>
                        <div>
                          <div className="text-slate-500 text-xs mb-1">💚 Avatares Vivos</div>
                          <div className="text-xl font-bold text-green-400">{avatares.filter(av => av.vivo).length}</div>
                        </div>
                        <div>
                          <div className="text-slate-500 text-xs mb-1">☠️ Avatares Mortos</div>
                          <div className="text-xl font-bold text-red-400">{avatares.filter(av => !av.vivo).length}</div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Coluna Direita - Ações Rápidas */}
          <div className="space-y-4">
            {/* Botão Invocar Avatar - O OCULTISTA */}
            <button
              onClick={() => router.push("/ocultista")}
              className="w-full group relative"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-cyan-500/20 rounded-lg blur opacity-50 group-hover:opacity-75 transition-all duration-300"></div>
              
              <div className="relative bg-slate-950/80 backdrop-blur-xl border border-purple-900/30 rounded-lg p-5 group-hover:border-purple-500/50 transition-all">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center border border-purple-500/30 group-hover:border-purple-400/50 transition-all">
                    <span className="text-2xl">🔮</span>
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-bold text-purple-300 text-base mb-0.5 group-hover:text-purple-200 transition-colors">
                      O OCULTISTA
                    </div>
                    <div className="text-xs text-slate-400 font-mono">
                      {stats?.primeira_invocacao ? "Primeira invocação GRATUITA" : "Invocar novos avatares"}
                    </div>
                  </div>
                  <div className="text-purple-400 group-hover:translate-x-1 group-hover:text-purple-300 transition-all text-xl">
                    →
                  </div>
                </div>
              </div>
            </button>
          
            {/* Botão Necromante */}
            <button
              onClick={() => router.push("/necromante")}
              className="w-full group relative"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-red-500/20 via-purple-500/20 to-red-500/20 rounded-lg blur opacity-50 group-hover:opacity-75 transition-all duration-300"></div>
              
              <div className="relative bg-slate-950/80 backdrop-blur-xl border border-red-900/30 rounded-lg p-5 group-hover:border-red-500/50 transition-all">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-red-500/20 to-purple-500/20 rounded-lg flex items-center justify-center border border-red-500/30 group-hover:border-red-400/50 transition-all">
                    <span className="text-2xl">⚰️</span>
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-bold text-red-300 text-base mb-0.5 group-hover:text-red-200 transition-colors">
                      O NECROMANTE
                    </div>
                    <div className="text-xs text-slate-400 font-mono">
                      Ressuscitar avatares caídos
                    </div>
                  </div>
                  <div className="text-red-400 group-hover:translate-x-1 group-hover:text-red-300 transition-all text-xl">
                    →
                  </div>
                </div>
              </div>
            </button>

            {/* Botão Purificador */}
            <button
              onClick={() => router.push("/purificador")}
              className="w-full group relative"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-cyan-500/20 rounded-lg blur opacity-50 group-hover:opacity-75 transition-all duration-300"></div>

              <div className="relative bg-slate-950/80 backdrop-blur-xl border border-cyan-900/30 rounded-lg p-5 group-hover:border-cyan-500/50 transition-all">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg flex items-center justify-center border border-cyan-500/30 group-hover:border-cyan-400/50 transition-all">
                    <span className="text-2xl">✨</span>
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-bold text-cyan-300 text-base mb-0.5 group-hover:text-cyan-200 transition-colors">
                      O PURIFICADOR
                    </div>
                    <div className="text-xs text-slate-400 font-mono">
                      Remover Marca da Morte
                    </div>
                  </div>
                  <div className="text-cyan-400 group-hover:translate-x-1 group-hover:text-cyan-300 transition-all text-xl">
                    →
                  </div>
                </div>
              </div>
            </button>

            {/* Botão Meus Avatares */}
            <button
              onClick={() => router.push("/avatares")}
              className="w-full group relative"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-cyan-500/20 rounded-lg blur opacity-50 group-hover:opacity-75 transition-all duration-300"></div>
              
              <div className="relative bg-slate-950/80 backdrop-blur-xl border border-cyan-900/30 rounded-lg p-5 group-hover:border-cyan-500/50 transition-all">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg flex items-center justify-center border border-cyan-500/30 group-hover:border-cyan-400/50 transition-all">
                    <span className="text-2xl">📚</span>
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-bold text-cyan-300 text-base mb-0.5 group-hover:text-cyan-200 transition-colors">
                      MEUS AVATARES
                    </div>
                    <div className="text-xs text-slate-400 font-mono">
                      {loadingAvatares ? 'Carregando...' : `${avatares.length} ${avatares.length === 1 ? 'avatar' : 'avatares'} invocados`}
                    </div>
                  </div>
                  <div className="text-cyan-400 group-hover:translate-x-1 group-hover:text-cyan-300 transition-all text-xl">
                    →
                  </div>
                </div>
              </div>
            </button>

            {/* Botão Inventário/Itens */}
            <button
              onClick={() => router.push("/inventario")}
              className="w-full group relative"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 rounded-lg blur opacity-50 group-hover:opacity-75 transition-all duration-300"></div>

              <div className="relative bg-slate-950/80 backdrop-blur-xl border border-amber-900/30 rounded-lg p-5 group-hover:border-amber-500/50 transition-all">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-lg flex items-center justify-center border border-amber-500/30 group-hover:border-amber-400/50 transition-all">
                    <span className="text-2xl">🎒</span>
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-bold text-amber-300 text-base mb-0.5 group-hover:text-amber-200 transition-colors">
                      INVENTÁRIO
                    </div>
                    <div className="text-xs text-slate-400 font-mono">
                      Itens, poções e equipamentos
                    </div>
                  </div>
                  <div className="text-amber-400 group-hover:translate-x-1 group-hover:text-amber-300 transition-all text-xl">
                    →
                  </div>
                </div>
              </div>
            </button>

            {/* Alerta se não tem avatar ativo */}
            {!loadingAvatares && avatares.length > 0 && !avatarAtivo && (
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded blur"></div>
                <div className="relative bg-slate-950/80 backdrop-blur-xl border border-amber-900/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-xl mt-0.5">⚠️</div>
                    <div className="flex-1">
                      <div className="font-bold text-amber-400 text-sm mb-1">Atenção!</div>
                      <div className="text-xs text-slate-400 leading-relaxed">
                        Nenhum avatar ativo. Ative um avatar para entrar em missões.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Divisor */}
            <div className="h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent my-2"></div>
          
            {/* Botão Missões - ATIVADO */}
            <button
              onClick={() => router.push("/missoes")}
              className="w-full group relative"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 rounded-lg blur opacity-50 group-hover:opacity-75 transition-all duration-300"></div>
              
              <div className="relative bg-slate-950/80 backdrop-blur-xl border border-cyan-900/30 rounded-lg p-5 group-hover:border-cyan-500/50 transition-all">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg flex items-center justify-center border border-cyan-500/30 group-hover:border-cyan-400/50 transition-all relative">
                    <span className="text-2xl animate-spin-slow">🌀</span>
                    {/* Indicador de disponibilidade */}
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-950 animate-pulse"></div>
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-bold text-cyan-300 text-base mb-0.5 group-hover:text-cyan-200 transition-colors">
                      HUB DE PORTAIS
                    </div>
                    <div className="text-xs text-slate-400 font-mono">
                      Explorar dimensões e ganhar recompensas
                    </div>
                  </div>
                  <div className="text-cyan-400 group-hover:translate-x-1 group-hover:text-cyan-300 transition-all text-xl">
                    →
                  </div>
                </div>
              </div>
            </button>
            
            <style jsx>{`
              @keyframes spin-slow {
                from {
                  transform: rotate(0deg);
                }
                to {
                  transform: rotate(360deg);
                }
              }
            
              .animate-spin-slow {
                animation: spin-slow 8s linear infinite;
              }
            `}</style>

            {/* Botão Arena (habilitado) */}
            <button
              onClick={() => router.push("/arena")}
              className="w-full group relative"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-red-500/20 via-orange-500/20 to-red-500/20 rounded-lg blur opacity-50 group-hover:opacity-75 transition-all duration-300"></div>
              
              <div className="relative bg-slate-950/80 backdrop-blur-xl border border-red-900/30 rounded-lg p-5 group-hover:border-red-500/50 transition-all">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-lg flex items-center justify-center border border-red-500/30 group-hover:border-red-400/50 transition-all">
                    <span className="text-2xl">⚔️</span>
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-bold text-red-300 text-base mb-0.5 group-hover:text-red-200 transition-colors">
                      ARENA
                    </div>
                    <div className="text-xs text-slate-400 font-mono">
                      Batalhas PvP e torneios
                    </div>
                  </div>
                  <div className="text-red-400 group-hover:translate-x-1 group-hover:text-red-300 transition-all text-xl">
                    →
                  </div>
                </div>
              </div>
            </button>
          
            {/* Botão Trade (em breve) */}
            <button
              disabled
              className="w-full group relative opacity-60 cursor-not-allowed"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/10 rounded-lg blur opacity-30"></div>
              
              <div className="relative bg-slate-950/80 backdrop-blur-xl border border-slate-800/30 rounded-lg p-5">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-slate-900/50 rounded-lg flex items-center justify-center border border-slate-700/30">
                    <span className="text-2xl opacity-50">💱</span>
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-bold text-slate-500 text-base mb-0.5">
                      TRADE
                    </div>
                    <div className="text-xs text-slate-600 font-mono">
                      Sistema de trocas em breve
                    </div>
                  </div>
                  <div className="text-slate-600 text-xl">
                    🔒
                  </div>
                </div>
              </div>
            </button>
          
            {/* Botão Ranking (em breve) */}
            <button
              disabled
              className="w-full group relative opacity-60 cursor-not-allowed"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-blue-500/10 rounded-lg blur opacity-30"></div>
              
              <div className="relative bg-slate-950/80 backdrop-blur-xl border border-slate-800/30 rounded-lg p-5">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-slate-900/50 rounded-lg flex items-center justify-center border border-slate-700/30">
                    <span className="text-2xl opacity-50">🏆</span>
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-bold text-slate-500 text-base mb-0.5">
                      RANKING
                    </div>
                    <div className="text-xs text-slate-600 font-mono">
                      Tabela de classificação em breve
                    </div>
                  </div>
                  <div className="text-slate-600 text-xl">
                    🔒
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Modal Editar Nome */}
      {modalEditarNome && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => !salvandoNome && setModalEditarNome(false)}
        >
          <div 
            className="max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/30 via-blue-500/30 to-purple-500/30 rounded-lg blur opacity-75"></div>
              
              <div className="relative bg-slate-950/95 backdrop-blur-xl border border-cyan-900/30 rounded-lg overflow-hidden">                
                <div className="p-4 text-center font-bold text-lg bg-gradient-to-r from-cyan-600 to-blue-600">
                  ✏️ EDITAR NOME DE OPERAÇÃO
                </div>

                <div className="p-6">                  
                  <div className="mb-4">
                    <label className="block text-cyan-400 text-xs uppercase tracking-widest mb-2 font-mono">
                      Novo Nome
                    </label>
                    <input
                      type="text"
                      value={novoNome}
                      onChange={(e) => setNovoNome(e.target.value)}
                      maxLength={30}
                      disabled={salvandoNome}
                      className="w-full px-4 py-3 bg-slate-900/80 border border-slate-700/50 rounded text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all disabled:opacity-50"
                      placeholder="Digite seu nome de operação"
                    />
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-slate-500">Apenas letras, números, espaços, - e _</span>
                      <span className="text-xs text-slate-500">{novoNome.length}/30</span>
                    </div>
                  </div>
                  
                  {erroNome && (
                    <div className="mb-4 p-3 bg-red-950/50 border border-red-500/30 rounded">
                      <p className="text-sm text-red-400">{erroNome}</p>
                    </div>
                  )}
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => setModalEditarNome(false)}
                      disabled={salvandoNome}
                      className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={salvarNome}
                      disabled={salvandoNome}
                      className="flex-1 group/btn relative disabled:opacity-50"
                    >
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded blur opacity-50 group-hover/btn:opacity-75 transition-all"></div>
                      <div className="relative px-4 py-3 bg-slate-950 rounded border border-cyan-500/50 transition-all">
                        <span className="font-bold text-cyan-400">
                          {salvandoNome ? 'Salvando...' : 'Salvar'}
                        </span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



