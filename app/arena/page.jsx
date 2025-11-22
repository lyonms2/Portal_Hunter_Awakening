"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import GameNav from '../components/GameNav';

export default function ArenaLobby() {
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

  const modos = [
    {
      id: 'treinamento',
      nome: 'Treinamento',
      emoji: '🎯',
      descricao: 'Lute contra IA em diferentes dificuldades',
      detalhes: 'Ganhe XP, moedas e fragmentos. Teste suas habilidades contra adversários controlados por IA com diferentes níveis de dificuldade.',
      recursos: [
        '4 níveis de dificuldade',
        'IA inteligente e adaptativa',
        'Recompensas balanceadas',
        'Sem risco de perda permanente'
      ],
      cor: 'from-green-600 to-green-800',
      corBorda: 'border-green-500',
      corBg: 'bg-green-900/10',
      corHover: 'hover:border-green-400',
      disponivel: true,
      rota: '/arena/treinamento'
    },
    {
      id: 'pvp',
      nome: 'Arena PvP',
      emoji: '⚔️',
      descricao: 'Batalhe contra avatares de outros jogadores controlados por IA',
      detalhes: 'Sistema de IA inteligente que simula batalhas realistas contra avatares reais. Ganhe ou perca Fama, com risco de morte permanente!',
      recursos: [
        'IA com 5 personalidades diferentes',
        'Avatares reais de outros jogadores',
        'Sistema de Fama e Rankings',
        '💀 MORTE REAL - Batalhe com cautela!',
        'Mecânicas de Render e Fuga'
      ],
      cor: 'from-red-600 to-red-800',
      corBorda: 'border-red-500',
      corBg: 'bg-red-900/10',
      corHover: 'hover:border-red-400',
      disponivel: true,
      rota: '/arena/pvp'
    },
    {
      id: 'sobrevivencia',
      nome: 'Sobrevivência',
      emoji: '💀',
      descricao: 'Quantas ondas você consegue sobreviver?',
      detalhes: 'Sistema de ondas progressivas com dificuldade crescente. Teste suas habilidades no modo mais difícil da arena.',
      recursos: [
        'Ondas infinitas e progressivas',
        'Dificuldade crescente balanceada',
        'Recompensas acumulativas',
        'Sistema de recordes pessoais'
      ],
      cor: 'from-purple-600 to-purple-900',
      corBorda: 'border-purple-500',
      corBg: 'bg-purple-900/10',
      corHover: 'hover:border-purple-400',
      disponivel: true, // INTERFACE DISPONÍVEL
      rota: '/arena/sobrevivencia',
      beta: true // Badge BETA
    }
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center">
        <div className="text-cyan-400 font-mono animate-pulse">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-gray-100">
      {/* Navegação padronizada */}
      <GameNav
        backTo="/dashboard"
        backLabel="DASHBOARD"
        title="ARENA DE COMBATE"
        subtitle="Escolha seu modo de jogo e prove seu valor"
      />

      <div className="container mx-auto px-4 py-8">

        {/* Modos de Jogo */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {modos.map((modo) => (
            <button
              key={modo.id}
              onClick={() => modo.disponivel && router.push(modo.rota)}
              disabled={!modo.disponivel}
              className={`relative group text-left overflow-hidden rounded-2xl border-2 transition-all duration-300 ${
                modo.disponivel
                  ? `${modo.corBorda} ${modo.corBg} ${modo.corHover} hover:scale-105 hover:shadow-2xl cursor-pointer`
                  : 'border-slate-700 bg-slate-900/30 opacity-60 cursor-not-allowed'
              }`}
            >
              {/* Glow effect */}
              {modo.disponivel && (
                <div className={`absolute inset-0 bg-gradient-to-br ${modo.cor} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}></div>
              )}

              {/* Badge "Em Breve" ou "BETA" */}
              {modo.emBreve && (
                <div className="absolute top-4 right-4 z-10">
                  <div className="bg-yellow-500 text-slate-900 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
                    Em Breve
                  </div>
                </div>
              )}
              {modo.beta && (
                <div className="absolute top-4 right-4 z-10">
                  <div className="bg-orange-500 text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider animate-pulse">
                    BETA
                  </div>
                </div>
              )}

              <div className="relative p-6">
                {/* Emoji */}
                <div className={`text-7xl mb-4 ${modo.disponivel ? 'group-hover:scale-110' : ''} transition-transform duration-300`}>
                  {modo.emoji}
                </div>

                {/* Nome */}
                <h2 className="text-3xl font-black text-white mb-2">
                  {modo.nome}
                </h2>

                {/* Descrição */}
                <p className="text-slate-300 font-semibold mb-3">
                  {modo.descricao}
                </p>

                <p className="text-sm text-slate-400 leading-relaxed mb-4">
                  {modo.detalhes}
                </p>

                {/* Recursos */}
                <div className="space-y-2 mb-6">
                  {modo.recursos.map((recurso, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <div className={`w-1.5 h-1.5 rounded-full ${modo.disponivel ? 'bg-cyan-400' : 'bg-slate-600'}`}></div>
                      <span className="text-slate-400">{recurso}</span>
                    </div>
                  ))}
                </div>

                {/* Botão */}
                {modo.disponivel ? (
                  <div className={`bg-gradient-to-r ${modo.cor} text-white font-black py-3 px-6 rounded-lg text-center uppercase tracking-wider group-hover:shadow-lg transition-shadow`}>
                    Entrar →
                  </div>
                ) : (
                  <div className="bg-slate-800 text-slate-500 font-black py-3 px-6 rounded-lg text-center uppercase tracking-wider">
                    Bloqueado
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Informações Adicionais */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Dicas */}
          <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
            <h3 className="text-xl font-bold text-cyan-400 mb-4 flex items-center gap-2">
              <span>💡</span> Dicas de Combate
            </h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-1">▸</span>
                <span><strong>Gerencie energia:</strong> Use "Esperar" (+30 energia) ou "Defender" (+15 energia + buff) quando necessário.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-1">▸</span>
                <span><strong>Vantagem elemental:</strong> Fogo &gt; Terra &gt; Vento &gt; Água &gt; Fogo. Luz ↔ Sombra.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-1">▸</span>
                <span><strong>Observe buffs/debuffs:</strong> Ícones mostram efeitos ativos. Use-os a seu favor!</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-1">▸</span>
                <span><strong>Exaustão:</strong> Avatares cansados têm stats reduzidos. Deixe-os descansar!</span>
              </li>
            </ul>
          </div>

          {/* Estatísticas */}
          <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
            <h3 className="text-xl font-bold text-purple-400 mb-4 flex items-center gap-2">
              <span>📊</span> Suas Estatísticas
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-slate-950/50 rounded-lg">
                <span className="text-slate-400">Vitórias em Treinamento</span>
                <span className="text-2xl font-bold text-green-400">-</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-950/50 rounded-lg">
                <span className="text-slate-400">Ranking PvP</span>
                <span className="text-2xl font-bold text-red-400">-</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-950/50 rounded-lg">
                <span className="text-slate-400">Recorde Sobrevivência</span>
                <span className="text-2xl font-bold text-purple-400">-</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-4 text-center">
              * Estatísticas serão implementadas em breve
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
