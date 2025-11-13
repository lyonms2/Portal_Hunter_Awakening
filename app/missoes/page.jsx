"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AvatarSVG from '../components/AvatarSVG';

export default function MissoesPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [avatares, setAvatares] = useState([]);
  const [avatarAtivo, setAvatarAtivo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [portalSelecionado, setPortalSelecionado] = useState(null);
  const [preparandoMissao, setPreparandoMissao] = useState(false);

  // Definição dos portais dimensionais
  const portais = [
    {
      id: 'floresta_sombria',
      nome: 'Floresta das Sombras',
      emoji: '🌲',
      cor: 'from-green-500 to-emerald-600',
      corBorda: 'border-green-500/50',
      corTexto: 'text-green-400',
      dificuldade: 'Fácil',
      corDificuldade: 'text-green-400',
      nivel_recomendado: '1-5',
      descricao: 'Uma floresta ancestral onde as sombras ganham vida. Ideal para iniciantes testarem suas habilidades.',
      recompensas: { moedas: [50, 100], fragmentos: [5, 15], xp: [25, 50] },
      inimigos: ['Lobo Sombrio', 'Treant Corrompido', 'Espírito da Névoa'],
      ambiente: 'Mata densa com névoa constante',
      perigo: 'Baixo',
      status: 'disponivel'
    },
    {
      id: 'cavernas_cristal',
      nome: 'Cavernas de Cristal',
      emoji: '💎',
      cor: 'from-cyan-500 to-blue-600',
      corBorda: 'border-cyan-500/50',
      corTexto: 'text-cyan-400',
      dificuldade: 'Médio',
      corDificuldade: 'text-yellow-400',
      nivel_recomendado: '5-10',
      descricao: 'Cavernas luminosas repletas de cristais mágicos e criaturas elementais. Requer estratégia e resistência.',
      recompensas: { moedas: [100, 200], fragmentos: [15, 30], xp: [50, 100] },
      inimigos: ['Golem de Cristal', 'Elemental de Gelo', 'Aranha Cristalina'],
      ambiente: 'Subterrâneo com formações cristalinas',
      perigo: 'Moderado',
      status: 'disponivel'
    },
    {
      id: 'vulcao_ardente',
      nome: 'Vulcão Ardente',
      emoji: '🌋',
      cor: 'from-red-500 to-orange-600',
      corBorda: 'border-red-500/50',
      corTexto: 'text-red-400',
      dificuldade: 'Difícil',
      corDificuldade: 'text-orange-400',
      nivel_recomendado: '10-15',
      descricao: 'O coração flamejante da dimensão. Calor extremo e inimigos poderosos aguardam os corajosos.',
      recompensas: { moedas: [200, 400], fragmentos: [30, 60], xp: [100, 200] },
      inimigos: ['Drake de Fogo', 'Titã de Magma', 'Salamandra Infernal'],
      ambiente: 'Rios de lava e temperaturas extremas',
      perigo: 'Alto',
      status: 'disponivel'
    },
    {
      id: 'tempestade_eterna',
      nome: 'Tempestade Eterna',
      emoji: '⚡',
      cor: 'from-purple-500 to-indigo-600',
      corBorda: 'border-purple-500/50',
      corTexto: 'text-purple-400',
      dificuldade: 'Muito Difícil',
      corDificuldade: 'text-red-400',
      nivel_recomendado: '15-20',
      descricao: 'Uma dimensão onde tempestades violentas nunca cessam. Apenas os mais experientes sobrevivem.',
      recompensas: { moedas: [400, 800], fragmentos: [60, 120], xp: [200, 400] },
      inimigos: ['Harpia Tempestuosa', 'Elemental de Raios', 'Senhor da Tormenta'],
      ambiente: 'Ilhas flutuantes em céu tempestuoso',
      perigo: 'Extremo',
      status: 'disponivel'
    },
    {
      id: 'abismo_void',
      nome: 'Abismo do Vazio',
      emoji: '🌑',
      cor: 'from-slate-700 to-black',
      corBorda: 'border-purple-900/50',
      corTexto: 'text-purple-300',
      dificuldade: 'Extremo',
      corDificuldade: 'text-purple-400',
      nivel_recomendado: '20+',
      descricao: 'O vazio entre dimensões. Entidades cósmicas e horrores inimagináveis habitam este lugar.',
      recompensas: { moedas: [800, 1500], fragmentos: [120, 250], xp: [400, 800] },
      inimigos: ['Horror do Vazio', 'Entidade Cósmica', 'Devorador de Almas'],
      ambiente: 'Espaço vazio com fragmentos flutuantes',
      perigo: 'FATAL',
      status: 'disponivel'
    },
    {
      id: 'cidade_perdida',
      nome: 'Cidade Perdida',
      emoji: '🏛️',
      cor: 'from-amber-500 to-yellow-600',
      corBorda: 'border-amber-500/50',
      corTexto: 'text-amber-400',
      dificuldade: 'Médio',
      corDificuldade: 'text-yellow-400',
      nivel_recomendado: '8-12',
      descricao: 'Ruínas de uma civilização antiga. Tesouros escondidos e guardiões mortais protegem seus segredos.',
      recompensas: { moedas: [150, 300], fragmentos: [20, 40], xp: [75, 150] },
      inimigos: ['Guardião de Pedra', 'Múmia Ancestral', 'Espectro Antigo'],
      ambiente: 'Ruínas urbanas tomadas pela vegetação',
      perigo: 'Moderado',
      status: 'bloqueado'
    }
  ];

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
        // Buscar stats
        const statsResponse = await fetch("/api/inicializar-jogador", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: parsedUser.id }),
        });
        const statsData = await statsResponse.json();
        setStats(statsData.stats);

        // Buscar avatares
        const avatarResponse = await fetch(`/api/meus-avatares?userId=${parsedUser.id}`);
        const avatarData = await avatarResponse.json();
        
        if (avatarResponse.ok) {
          const todosAvatares = avatarData.avatares || [];
          setAvatares(todosAvatares);
          
          // Encontrar avatar ativo
          const ativo = todosAvatares.find(av => av.ativo && av.vivo);
          setAvatarAtivo(ativo || null);
        }
      } catch (error) {
        console.error("Erro ao carregar:", error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  const selecionarPortal = (portal) => {
    if (portal.status === 'bloqueado') return;
    setPortalSelecionado(portal);
  };

  const iniciarMissao = () => {
    if (!avatarAtivo) {
      alert("Você precisa ter um avatar ativo para entrar em missões!");
      return;
    }

    setPreparandoMissao(true);
    
    // Simular preparação da missão
    setTimeout(() => {
      alert(`Entrando no portal: ${portalSelecionado.nome}!\n\n(Sistema de combate em desenvolvimento)`);
      setPreparandoMissao(false);
      setPortalSelecionado(null);
    }, 2000);
  };

  const voltarDashboard = () => {
    router.push("/dashboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex items-center justify-center">
        <div className="text-cyan-400 font-mono animate-pulse">Sincronizando com portais dimensionais...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 text-gray-100 relative overflow-hidden">
      {/* Efeitos de fundo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[120px] top-20 left-1/4 animate-pulse-slow"></div>
        <div className="absolute w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[100px] bottom-20 right-1/4 animate-pulse-slower"></div>
        <div className="absolute w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[80px] top-1/2 left-1/2 animate-pulse-slow"></div>
      </div>

      {/* Grid tech */}
      <div className="absolute inset-0 opacity-[0.02] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iY3lhbiIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] pointer-events-none"></div>

      {/* Vinheta */}
      <div className="absolute inset-0 shadow-[inset_0_0_200px_rgba(0,0,0,0.8)] pointer-events-none"></div>

      <div className="relative z-10 min-h-screen px-4 py-8">
        {/* Header */}
        <div className="max-w-7xl mx-auto mb-12">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={voltarDashboard}
              className="text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-2 font-mono text-sm group"
            >
              <span className="group-hover:-translate-x-1 transition-transform">←</span> 
              <span>RETORNAR</span>
            </button>

            {/* Status do Avatar */}
            {avatarAtivo && (
              <div className="flex items-center gap-3 bg-slate-950/80 backdrop-blur border border-cyan-500/30 rounded-lg px-4 py-2">
                <div className="w-10 h-10">
                  <AvatarSVG avatar={avatarAtivo} tamanho={40} />
                </div>
                <div>
                  <div className="text-xs text-slate-400">Avatar Ativo</div>
                  <div className="text-sm font-bold text-cyan-400">{avatarAtivo.nome}</div>
                </div>
                <div className="w-px h-8 bg-slate-700 mx-2"></div>
                <div className="text-center">
                  <div className="text-xs text-slate-400">Nível</div>
                  <div className="text-sm font-bold text-purple-400">{avatarAtivo.nivel}</div>
                </div>
              </div>
            )}
          </div>

          {/* Título Principal */}
          <div className="text-center mb-8">
            <div className="text-7xl mb-6 animate-float">🌀</div>
            <h1 className="text-6xl font-black bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 bg-clip-text text-transparent mb-4">
              HUB DE PORTAIS
            </h1>
            <div className="h-px w-96 mx-auto bg-gradient-to-r from-transparent via-cyan-500 to-transparent mb-4"></div>
            <p className="text-slate-400 font-mono text-sm max-w-2xl mx-auto">
              Cada portal leva a uma dimensão única repleta de perigos e tesouros. 
              Escolha sabiamente e que seu avatar esteja preparado para o que encontrar além do véu.
            </p>
          </div>

          {/* Alerta se não tem avatar ativo */}
          {!avatarAtivo && (
            <div className="max-w-2xl mx-auto mb-8">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-red-500/30 to-orange-500/30 rounded-lg blur"></div>
                <div className="relative bg-red-950/30 border border-red-500/50 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">⚠️</div>
                    <div>
                      <h3 className="text-red-400 font-bold text-lg mb-2">Avatar Necessário</h3>
                      <p className="text-slate-300 text-sm mb-4">
                        Você precisa ter um avatar ativo para acessar os portais dimensionais.
                      </p>
                      <button
                        onClick={() => router.push("/avatares")}
                        className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded font-bold text-sm transition-colors"
                      >
                        Ativar Avatar →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Grid de Portais */}
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {portais.map((portal) => {
              const bloqueado = portal.status === 'bloqueado';
              
              return (
                <div 
                  key={portal.id}
                  onClick={() => !bloqueado && avatarAtivo && selecionarPortal(portal)}
                  className={`relative group ${bloqueado || !avatarAtivo ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {/* Efeito de brilho */}
                  <div className={`absolute -inset-1 bg-gradient-to-r ${portal.cor} rounded-lg blur opacity-20 ${!bloqueado && avatarAtivo ? 'group-hover:opacity-50' : ''} transition-all duration-300`}></div>
                  
                  <div className={`relative bg-gradient-to-b from-slate-900/90 to-slate-950/90 backdrop-blur-xl border-2 ${portal.corBorda} rounded-lg overflow-hidden ${!bloqueado && avatarAtivo ? 'group-hover:border-opacity-100' : ''} transition-all`}>
                    {/* Header */}
                    <div className={`bg-gradient-to-r ${portal.cor} p-4 text-center relative`}>
                      <div className="text-5xl mb-2 filter drop-shadow-lg">{portal.emoji}</div>
                      <h3 className="text-xl font-black text-white mb-1">{portal.nome}</h3>
                      <div className="flex items-center justify-center gap-2 text-xs">
                        <span className={`px-2 py-0.5 bg-black/30 rounded ${portal.corDificuldade} font-bold`}>
                          {portal.dificuldade}
                        </span>
                        <span className="text-white/80">Nv. {portal.nivel_recomendado}</span>
                      </div>
                      
                      {bloqueado && (
                        <div className="absolute top-2 right-2 text-2xl">🔒</div>
                      )}
                    </div>

                    <div className="p-5">
                      {/* Descrição */}
                      <p className="text-slate-300 text-sm mb-4 leading-relaxed h-16 overflow-hidden">
                        {portal.descricao}
                      </p>

                      {/* Recompensas */}
                      <div className="bg-slate-900/50 rounded p-3 mb-3 border border-slate-800">
                        <div className="text-xs text-slate-500 uppercase font-mono mb-2">Recompensas:</div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="text-center">
                            <div className="text-amber-400 font-bold">💰 {portal.recompensas.moedas[0]}-{portal.recompensas.moedas[1]}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-purple-400 font-bold">💎 {portal.recompensas.fragmentos[0]}-{portal.recompensas.fragmentos[1]}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-cyan-400 font-bold">⭐ {portal.recompensas.xp[0]}-{portal.recompensas.xp[1]}</div>
                          </div>
                        </div>
                      </div>

                      {/* Botão */}
                      <button
                        disabled={bloqueado || !avatarAtivo}
                        className={`w-full py-3 rounded font-bold text-sm transition-all ${
                          bloqueado || !avatarAtivo
                            ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                            : `bg-gradient-to-r ${portal.cor} text-white hover:shadow-lg hover:scale-105`
                        }`}
                      >
                        {bloqueado ? '🔒 BLOQUEADO' : '🌀 ENTRAR NO PORTAL'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legenda */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-slate-950/80 backdrop-blur border border-slate-800 rounded-lg p-6">
              <h3 className="text-cyan-400 font-bold mb-4 text-sm uppercase tracking-wider">📋 Informações Importantes</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-slate-400">
                <div className="flex items-start gap-2">
                  <span className="text-cyan-400">•</span>
                  <span>Missões concedem moedas, fragmentos e experiência</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-cyan-400">•</span>
                  <span>Nível recomendado afeta dificuldade dos inimigos</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-cyan-400">•</span>
                  <span>Avatar exausto tem penalidades em combate</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-cyan-400">•</span>
                  <span>Morte em missão reduz stats permanentemente</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Confirmação */}
      {portalSelecionado && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => !preparandoMissao && setPortalSelecionado(null)}
        >
          <div 
            className="max-w-3xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <div className={`absolute -inset-1 bg-gradient-to-r ${portalSelecionado.cor} rounded-lg blur opacity-75`}></div>
              
              <div className="relative bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-cyan-500/50 rounded-lg overflow-hidden">
                {/* Header */}
                <div className={`bg-gradient-to-r ${portalSelecionado.cor} p-6 text-center`}>
                  <div className="text-6xl mb-3">{portalSelecionado.emoji}</div>
                  <h2 className="text-3xl font-black text-white mb-2">{portalSelecionado.nome}</h2>
                  <div className="flex items-center justify-center gap-3">
                    <span className={`px-3 py-1 bg-black/30 rounded ${portalSelecionado.corDificuldade} font-bold text-sm`}>
                      {portalSelecionado.dificuldade}
                    </span>
                    <span className="text-white/90 text-sm">Nível Recomendado: {portalSelecionado.nivel_recomendado}</span>
                  </div>
                </div>

                <div className="p-8">
                  {/* Avatar que vai entrar */}
                  {avatarAtivo && (
                    <div className="flex items-center gap-4 bg-slate-900/50 rounded-lg p-4 mb-6 border border-cyan-500/30">
                      <div className="w-16 h-16">
                        <AvatarSVG avatar={avatarAtivo} tamanho={64} />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-slate-400 mb-1">Avatar Selecionado:</div>
                        <div className="text-xl font-bold text-cyan-400">{avatarAtivo.nome}</div>
                        <div className="text-sm text-slate-400">Nível {avatarAtivo.nivel} • {avatarAtivo.elemento}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-400">Vínculo</div>
                        <div className="text-lg font-bold text-purple-400">{avatarAtivo.vinculo}%</div>
                      </div>
                    </div>
                  )}

                  {/* Descrição */}
                  <div className="mb-6">
                    <h4 className="text-cyan-400 font-bold text-sm uppercase mb-2">Sobre Esta Dimensão:</h4>
                    <p className="text-slate-300 leading-relaxed mb-3">{portalSelecionado.descricao}</p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-slate-500">Ambiente:</span>
                        <span className="text-slate-300 ml-2">{portalSelecionado.ambiente}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Nível de Perigo:</span>
                        <span className="text-red-400 ml-2 font-bold">{portalSelecionado.perigo}</span>
                      </div>
                    </div>
                  </div>

                  {/* Inimigos */}
                  <div className="mb-6">
                    <h4 className="text-red-400 font-bold text-sm uppercase mb-2">⚔️ Inimigos Conhecidos:</h4>
                    <div className="flex flex-wrap gap-2">
                      {portalSelecionado.inimigos.map((inimigo, idx) => (
                        <span key={idx} className="px-3 py-1 bg-red-950/30 border border-red-500/30 rounded text-red-400 text-xs font-mono">
                          {inimigo}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Recompensas */}
                  <div className="bg-slate-900/50 rounded-lg p-4 mb-6 border border-slate-800">
                    <h4 className="text-amber-400 font-bold text-sm uppercase mb-3">💰 Recompensas Esperadas:</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl mb-1">💰</div>
                        <div className="text-amber-400 font-bold">{portalSelecionado.recompensas.moedas[0]} - {portalSelecionado.recompensas.moedas[1]}</div>
                        <div className="text-xs text-slate-500">Moedas</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl mb-1">💎</div>
                        <div className="text-purple-400 font-bold">{portalSelecionado.recompensas.fragmentos[0]} - {portalSelecionado.recompensas.fragmentos[1]}</div>
                        <div className="text-xs text-slate-500">Fragmentos</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl mb-1">⭐</div>
                        <div className="text-cyan-400 font-bold">{portalSelecionado.recompensas.xp[0]} - {portalSelecionado.recompensas.xp[1]}</div>
                        <div className="text-xs text-slate-500">Experiência</div>
                      </div>
                    </div>
                  </div>

                  {/* Avisos */}
                  <div className="bg-red-950/20 border border-red-500/30 rounded p-4 mb-6">
                    <h4 className="text-red-400 font-bold text-xs uppercase mb-2">⚠️ AVISOS IMPORTANTES:</h4>
                    <ul className="text-xs text-slate-400 space-y-1">
                      <li className="flex items-start gap-2">
                        <span className="text-red-400">•</span>
                        <span>Se seu avatar morrer, ele perderá stats permanentemente</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-400">•</span>
                        <span>Avatares exaustos têm penalidades de combate</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-400">•</span>
                        <span>Não é possível trocar de avatar durante a missão</span>
                      </li>
                    </ul>
                  </div>

                  {/* Botões */}
                  <div className="flex gap-4">
                    <button
                      onClick={() => setPortalSelecionado(null)}
                      disabled={preparandoMissao}
                      className="flex-1 px-6 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={iniciarMissao}
                      disabled={preparandoMissao}
                      className="flex-1 group/btn relative disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className={`absolute -inset-0.5 bg-gradient-to-r ${portalSelecionado.cor} rounded-lg blur opacity-50 group-hover/btn:opacity-75 transition-all`}></div>
                      <div className="relative px-6 py-4 bg-slate-950 rounded-lg border border-cyan-500/50 transition-all">
                        <span className="font-bold text-cyan-300">
                          {preparandoMissao ? '🌀 ATRAVESSANDO O PORTAL...' : '🌀 ENTRAR NO PORTAL'}
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

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
          }
        }

        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.6;
          }
        }

        @keyframes pulse-slower {
          0%, 100% {
            opacity: 0.2;
          }
          50% {
            opacity: 0.5;
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

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }

        .animate-pulse-slower {
          animation: pulse-slower 6s ease-in-out infinite;
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
