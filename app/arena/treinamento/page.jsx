"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { aplicarPenalidadesExaustao, getNivelExaustao } from "../../avatares/sistemas/exhaustionSystem";
import { getNivelVinculo } from "../../avatares/sistemas/bondSystem";
import AvatarSVG from "../../components/AvatarSVG";
import BackgroundEffects from "@/components/BackgroundEffects";

export default function ArenaTreinamentoPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [avatarAtivo, setAvatarAtivo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dificuldadeSelecionada, setDificuldadeSelecionada] = useState('normal');
  const [iniciandoBatalha, setIniciandoBatalha] = useState(false);
  const [modalAlerta, setModalAlerta] = useState(null);

  const dificuldades = {
    facil: {
      nome: "Recruta",
      emoji: "🟢",
      descricao: "Adversário inexperiente",
      detalhes: "Ideal para treinar combos e aprender mecânicas. IA comete erros táticos frequentes.",
      stats: "70% dos seus stats",
      iaComportamento: "Joga defensivamente, comete 20% de erros, não usa combos",
      recompensas: { xp: 25, vinculo: 3 },
      exaustao: 5,
      cor: "from-green-600 to-green-700",
      corBorda: "border-green-500",
      corBg: "bg-green-900/10",
      corTexto: "text-green-400"
    },
    normal: {
      nome: "Veterano",
      emoji: "🟡",
      descricao: "Desafio equilibrado",
      detalhes: "Oponente experiente que sabe usar habilidades. IA inteligente mas não perfeita.",
      stats: "100% dos seus stats",
      iaComportamento: "Balanceia ataque e defesa, 10% de erros, considera vantagem elemental",
      recompensas: { xp: 50, vinculo: 5 },
      exaustao: 10,
      cor: "from-yellow-600 to-yellow-700",
      corBorda: "border-yellow-500",
      corBg: "bg-yellow-900/10",
      corTexto: "text-yellow-400"
    },
    dificil: {
      nome: "Elite",
      emoji: "🔴",
      descricao: "Adversário muito poderoso",
      detalhes: "Combatente de elite com stats superiores. IA usa combos e tática avançada.",
      stats: "130% dos seus stats",
      iaComportamento: "Agressivo mas inteligente, usa combos, remove buffs, 5% de erros",
      recompensas: { xp: 100, vinculo: 8 },
      exaustao: 15,
      cor: "from-red-600 to-red-700",
      corBorda: "border-red-500",
      corBg: "bg-red-900/10",
      corTexto: "text-red-400"
    },
    mestre: {
      nome: "Lendário",
      emoji: "💀",
      descricao: "IA perfeita - Desafio supremo",
      detalhes: "Adversário lendário com IA perfeita. Não comete erros e prevê suas ações.",
      stats: "150% dos seus stats",
      iaComportamento: "IA PERFEITA: sem erros, antecipa jogadas, usa tática avançada",
      recompensas: { xp: 200, vinculo: 15 },
      exaustao: 20,
      cor: "from-purple-600 to-purple-800",
      corBorda: "border-purple-500",
      corBg: "bg-purple-900/10",
      corTexto: "text-purple-400"
    }
  };

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    carregarAvatarAtivo(parsedUser.id);
  }, [router]);

  const carregarAvatarAtivo = async (userId) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/meus-avatares?userId=${userId}`);
      const data = await response.json();

      if (response.ok) {
        const ativo = data.avatares.find(av => av.ativo && av.vivo);
        setAvatarAtivo(ativo || null);
      }
    } catch (error) {
      console.error("Erro ao carregar avatar ativo:", error);
    } finally {
      setLoading(false);
    }
  };

  const iniciarTreino = async () => {
    if (!avatarAtivo) {
      setModalAlerta({
        titulo: '⚠️ Sem Avatar Ativo',
        mensagem: 'Você precisa ter um avatar ativo! Vá até a tela de Avatares e selecione um avatar.'
      });
      return;
    }

    if (avatarAtivo.exaustao >= 100) {
      setModalAlerta({
        titulo: '💀 Avatar Colapsado',
        mensagem: 'Seu avatar está completamente exausto e não pode lutar! Descanse seu avatar antes de treinar.'
      });
      return;
    }

    if (avatarAtivo.exaustao >= 80) {
      setModalAlerta({
        titulo: '⚠️ Avatar Muito Exausto',
        mensagem: 'Seu avatar está com exaustão crítica! Recomendamos descansar antes de treinar. As penalidades serão severas!'
      });
      // Permite continuar após o alerta
    }

    setIniciandoBatalha(true);

    try {
      const response = await fetch('/api/arena/treino/iniciar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          avatarId: avatarAtivo.id,
          dificuldade: dificuldadeSelecionada
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Salvar estado da batalha
        localStorage.setItem('batalha_atual', JSON.stringify(data.batalha));

        // Redirecionar para tela de batalha
        router.push('/arena/batalha');
      } else {
        setModalAlerta({
          titulo: '❌ Erro',
          mensagem: data.message || 'Erro ao iniciar treino'
        });
      }
    } catch (error) {
      console.error('Erro:', error);
      setModalAlerta({
        titulo: '❌ Erro de Conexão',
        mensagem: 'Erro ao iniciar treino. Verifique sua conexão.'
      });
    } finally {
      setIniciandoBatalha(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center">
        <div className="text-cyan-400 font-mono animate-pulse">Carregando Arena de Treino...</div>
      </div>
    );
  }

  // Calcular stats com penalidades de exaustão
  let statsAtuais = null;
  let nivelExaustao = null;
  let temPenalidade = false;
  let hpMaximo = 0;
  let hpAtual = 0;
  let nivelVinculo = null;

  if (avatarAtivo) {
    const statsBase = {
      forca: avatarAtivo.forca || 0,
      agilidade: avatarAtivo.agilidade || 0,
      resistencia: avatarAtivo.resistencia || 0,
      foco: avatarAtivo.foco || 0
    };
    statsAtuais = aplicarPenalidadesExaustao(statsBase, avatarAtivo.exaustao || 0);
    nivelExaustao = getNivelExaustao(avatarAtivo.exaustao || 0);
    temPenalidade = nivelExaustao.penalidades.stats !== undefined;
    hpMaximo = avatarAtivo.resistencia * 10 + avatarAtivo.nivel * 5;
    hpAtual = avatarAtivo.hp_atual !== null && avatarAtivo.hp_atual !== undefined
      ? avatarAtivo.hp_atual
      : hpMaximo;
    nivelVinculo = getNivelVinculo(avatarAtivo.vinculo || 0);
  }

  const dificuldade = dificuldades[dificuldadeSelecionada];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-gray-100 relative overflow-hidden">
      <BackgroundEffects />

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent mb-2">
              🏟️ ARENA DE TREINO
            </h1>
            <p className="text-slate-400 font-mono text-sm">
              Aprimore suas habilidades e fortaleça o vínculo com seu avatar
            </p>
          </div>

          <button
            onClick={() => router.push("/arena")}
            className="group relative"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-500/30 to-slate-600/30 rounded blur opacity-50 group-hover:opacity-75 transition-all"></div>
            <div className="relative px-6 py-3 bg-slate-950 rounded border border-slate-500/50 group-hover:border-slate-400 transition-all">
              <span className="font-bold text-slate-400 group-hover:text-slate-300">← Voltar ao Lobby</span>
            </div>
          </button>
        </div>

        {/* Sem Avatar Ativo */}
        {!avatarAtivo && (
          <div className="max-w-3xl mx-auto">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-xl blur opacity-75"></div>

              <div className="relative bg-slate-950/90 backdrop-blur-xl border border-red-900/50 rounded-xl overflow-hidden">
                <div className="p-12 text-center">
                  <div className="text-8xl mb-6">⚔️</div>
                  <h2 className="text-3xl font-bold text-red-400 mb-4">
                    Nenhum Avatar Ativo
                  </h2>
                  <p className="text-slate-300 mb-8 text-lg leading-relaxed">
                    Você precisa ter um avatar ativo para treinar!<br/>
                    Vá até a tela de Avatares e selecione seu combatente.
                  </p>
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={() => router.push("/avatares")}
                      className="group/btn relative"
                    >
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded blur opacity-50 group-hover/btn:opacity-75 transition-all"></div>
                      <div className="relative px-8 py-4 bg-slate-950 rounded border border-cyan-500/50 transition-all">
                        <span className="font-bold text-cyan-400">Ir para Avatares</span>
                      </div>
                    </button>
                    <button
                      onClick={() => router.push("/ocultista")}
                      className="group/btn relative"
                    >
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded blur opacity-50 group-hover/btn:opacity-75 transition-all"></div>
                      <div className="relative px-8 py-4 bg-slate-950 rounded border border-purple-500/50 transition-all">
                        <span className="font-bold text-purple-400">Invocar Novo Avatar</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Interface Principal */}
        {avatarAtivo && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Coluna Esquerda - Avatar Ativo */}
            <div className="lg:col-span-1 space-y-6">
              {/* Card do Avatar */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 rounded-xl blur opacity-50"></div>

                <div className="relative bg-slate-950/90 backdrop-blur-xl border border-cyan-900/50 rounded-xl overflow-hidden">
                  {/* Header do Card */}
                  <div className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 p-4 border-b border-cyan-500/30">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs text-slate-400 uppercase font-mono tracking-wider">Seu Combatente</div>
                      <div className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                        avatarAtivo.raridade === 'Lendário' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' :
                        avatarAtivo.raridade === 'Raro' ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white' :
                        'bg-slate-700 text-slate-300'
                      }`}>
                        {avatarAtivo.raridade}
                      </div>
                    </div>
                    <h2 className="text-2xl font-bold text-cyan-400">{avatarAtivo.nome}</h2>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-sm text-slate-300">Nv.{avatarAtivo.nivel}</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-sm text-slate-400">{avatarAtivo.elemento}</span>
                    </div>
                  </div>

                  {/* Avatar Image */}
                  <div className="p-6 flex justify-center bg-gradient-to-b from-slate-950/30 to-transparent">
                    <AvatarSVG avatar={avatarAtivo} tamanho={180} />
                  </div>

                  {/* Stats */}
                  <div className="p-4 space-y-3">
                    {/* HP */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-green-400 font-bold">❤️ HP</span>
                        <span className="text-slate-400">{hpAtual} / {hpMaximo}</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            (hpAtual / hpMaximo) > 0.7 ? 'bg-green-500' :
                            (hpAtual / hpMaximo) > 0.4 ? 'bg-yellow-500' :
                            (hpAtual / hpMaximo) > 0.2 ? 'bg-orange-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${Math.min((hpAtual / hpMaximo) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Stats com Penalidade */}
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div>
                          <div className="text-red-400 font-bold text-lg">
                            {temPenalidade && <div className="text-[9px] text-slate-700 line-through">{avatarAtivo.forca}</div>}
                            {statsAtuais.forca}
                          </div>
                          <div className="text-[10px] text-slate-500 font-semibold uppercase">For</div>
                        </div>
                        <div>
                          <div className="text-green-400 font-bold text-lg">
                            {temPenalidade && <div className="text-[9px] text-slate-700 line-through">{avatarAtivo.agilidade}</div>}
                            {statsAtuais.agilidade}
                          </div>
                          <div className="text-[10px] text-slate-500 font-semibold uppercase">Agi</div>
                        </div>
                        <div>
                          <div className="text-blue-400 font-bold text-lg">
                            {temPenalidade && <div className="text-[9px] text-slate-700 line-through">{avatarAtivo.resistencia}</div>}
                            {statsAtuais.resistencia}
                          </div>
                          <div className="text-[10px] text-slate-500 font-semibold uppercase">Res</div>
                        </div>
                        <div>
                          <div className="text-purple-400 font-bold text-lg">
                            {temPenalidade && <div className="text-[9px] text-slate-700 line-through">{avatarAtivo.foco}</div>}
                            {statsAtuais.foco}
                          </div>
                          <div className="text-[10px] text-slate-500 font-semibold uppercase">Foc</div>
                        </div>
                      </div>
                    </div>

                    {/* Exaustão */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-orange-400 font-bold">😰 Exaustão</span>
                        <span className={nivelExaustao.cor}>{Math.floor(avatarAtivo.exaustao || 0)}%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            (avatarAtivo.exaustao || 0) < 20 ? 'bg-green-500' :
                            (avatarAtivo.exaustao || 0) < 40 ? 'bg-yellow-500' :
                            (avatarAtivo.exaustao || 0) < 60 ? 'bg-orange-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(avatarAtivo.exaustao || 0, 100)}%` }}
                        ></div>
                      </div>
                      <div className={`text-[10px] ${nivelExaustao.cor} font-bold mt-1 text-center`}>
                        {nivelExaustao.nome}
                      </div>
                    </div>

                    {/* Vínculo */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-pink-400 font-bold">💖 Vínculo</span>
                        <span className={nivelVinculo.cor}>{Math.floor(avatarAtivo.vinculo || 0)}%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all"
                          style={{ width: `${Math.min(avatarAtivo.vinculo || 0, 100)}%` }}
                        ></div>
                      </div>
                      <div className={`text-[10px] ${nivelVinculo.cor} font-bold mt-1 text-center`}>
                        {nivelVinculo.nome}
                      </div>
                    </div>
                  </div>

                  {/* Alerta de Status */}
                  {avatarAtivo.exaustao >= 60 && (
                    <div className="p-3 bg-orange-950/50 border-t border-orange-500/30">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">⚠️</span>
                        <div className="text-xs text-orange-400 font-bold">
                          Avatar {avatarAtivo.exaustao >= 80 ? 'crítico' : 'exausto'} - Penalidades severas em combate!
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Info sobre Treino */}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg blur opacity-50"></div>

                <div className="relative bg-slate-950/80 backdrop-blur-xl border border-blue-900/50 rounded-lg p-4">
                  <h3 className="text-cyan-400 font-bold mb-2 flex items-center gap-2">
                    <span className="text-xl">ℹ️</span>
                    <span>SOBRE O TREINO</span>
                  </h3>
                  <ul className="text-xs text-slate-300 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-0.5">✓</span>
                      <span><strong>Ganhe XP</strong> para subir o nível do seu avatar</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-pink-400 mt-0.5">💖</span>
                      <span><strong>Ganhe Vínculo</strong> para fortalecer sua conexão</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-cyan-400 mt-0.5">🤖</span>
                      <span><strong>IA Adaptativa</strong> - cada dificuldade tem comportamento único</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-400 mt-0.5">😰</span>
                      <span><strong>Exaustão</strong> aumenta após cada treino</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Coluna Direita - Seleção de Dificuldade */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h2 className="text-3xl font-black text-orange-400 mb-6 flex items-center gap-3">
                  <span className="text-4xl">🎯</span> SELECIONAR DIFICULDADE
                </h2>

                <div className="grid md:grid-cols-2 gap-4 mb-8">
                  {Object.entries(dificuldades).map(([key, dif]) => {
                    const selecionada = dificuldadeSelecionada === key;

                    return (
                      <button
                        key={key}
                        onClick={() => setDificuldadeSelecionada(key)}
                        className={`group/card relative text-left p-5 rounded-xl border-2 transition-all duration-300 ${
                          selecionada
                            ? `${dif.corBorda} ${dif.corBg} ring-4 ring-offset-2 ring-offset-slate-950 ${dif.corBorda.replace('border-', 'ring-')} scale-105 shadow-2xl`
                            : 'border-slate-700 bg-slate-900/50 hover:border-slate-600 hover:bg-slate-900/70 hover:scale-[1.02]'
                        }`}
                      >
                        {/* Badge Selecionado */}
                        {selecionada && (
                          <div className="absolute top-3 right-3 bg-cyan-500 text-white text-xs px-3 py-1 rounded-full font-black uppercase tracking-wider animate-pulse">
                            ✓ Ativo
                          </div>
                        )}

                        {/* Header */}
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`text-5xl ${selecionada ? 'animate-pulse' : ''}`}>
                            {dif.emoji}
                          </div>
                          <div className="flex-1">
                            <div className="font-black text-xl text-white mb-1">{dif.nome}</div>
                            <div className="text-sm text-slate-300 font-semibold">{dif.descricao}</div>
                          </div>
                        </div>

                        <div className="text-xs text-slate-400 leading-relaxed mb-4">
                          {dif.detalhes}
                        </div>

                        {/* Stats do Inimigo */}
                        <div className="bg-slate-950/50 rounded-lg p-3 mb-3 space-y-2">
                          <div className="text-xs font-bold text-red-400 uppercase tracking-wider">⚔️ Inimigo</div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500">Poder:</span>
                            <span className="text-white font-bold">{dif.stats}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500">Exaustão Ganho:</span>
                            <span className="text-orange-400 font-bold">+{dif.exaustao}%</span>
                          </div>
                          <div className="text-xs text-slate-400 bg-slate-900/50 p-2 rounded leading-relaxed">
                            <span className="text-purple-400 font-semibold">IA:</span> {dif.iaComportamento}
                          </div>
                        </div>

                        {/* Recompensas */}
                        <div className="bg-slate-950/50 rounded-lg p-3 space-y-2">
                          <div className="text-xs font-bold text-green-400 uppercase tracking-wider">🎁 Recompensas</div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-blue-900/30 px-2 py-2 rounded text-center">
                              <div className="text-[10px] text-blue-300 mb-1">XP</div>
                              <div className="text-base font-bold text-blue-400">+{dif.recompensas.xp}</div>
                            </div>
                            <div className="bg-pink-900/30 px-2 py-2 rounded text-center">
                              <div className="text-[10px] text-pink-300 mb-1">Vínculo</div>
                              <div className="text-base font-bold text-pink-400">+{dif.recompensas.vinculo}</div>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Preview da Dificuldade Selecionada */}
                <div className="relative group/preview mb-6">
                  <div className={`absolute -inset-1 bg-gradient-to-r ${dificuldade.cor} rounded-xl blur opacity-30`}></div>

                  <div className="relative bg-slate-950/90 backdrop-blur-xl border-2 ${dificuldade.corBorda} rounded-xl p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="text-6xl">{dificuldade.emoji}</div>
                      <div>
                        <div className="text-xs text-slate-500 uppercase font-mono mb-1">Dificuldade Selecionada</div>
                        <div className={`text-3xl font-black ${dificuldade.corTexto}`}>{dificuldade.nome}</div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 text-center">
                      <div className="bg-slate-900/50 rounded-lg p-3">
                        <div className="text-xs text-slate-500 mb-1">Ganho de XP</div>
                        <div className="text-2xl font-bold text-blue-400">+{dificuldade.recompensas.xp}</div>
                      </div>
                      <div className="bg-slate-900/50 rounded-lg p-3">
                        <div className="text-xs text-slate-500 mb-1">Ganho de Vínculo</div>
                        <div className="text-2xl font-bold text-pink-400">+{dificuldade.recompensas.vinculo}</div>
                      </div>
                      <div className="bg-slate-900/50 rounded-lg p-3">
                        <div className="text-xs text-slate-500 mb-1">Exaustão</div>
                        <div className="text-2xl font-bold text-orange-400">+{dificuldade.exaustao}%</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botão Iniciar Treino */}
                <button
                  onClick={iniciarTreino}
                  disabled={!avatarAtivo || avatarAtivo.exaustao >= 100 || iniciandoBatalha}
                  className="w-full group/btn relative disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="absolute -inset-1 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 rounded-xl blur opacity-50 group-hover/btn:opacity-75 transition-all"></div>

                  <div className="relative px-12 py-6 bg-slate-950 rounded-xl border-2 border-orange-500 group-hover/btn:border-orange-400 transition-all">
                    <span className="text-2xl font-black tracking-wider uppercase bg-gradient-to-r from-red-300 to-yellow-300 bg-clip-text text-transparent">
                      {iniciandoBatalha ? '⏳ Iniciando Treino...' : '⚔️ INICIAR TREINO'}
                    </span>
                  </div>
                </button>

                {avatarAtivo?.exaustao >= 100 && (
                  <div className="text-center text-sm text-red-400 font-bold mt-4">
                    💀 Seu avatar está completamente exausto e não pode lutar!
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Alerta */}
      {modalAlerta && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setModalAlerta(null)}
        >
          <div
            className="max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-red-500/30 to-orange-500/30 rounded-lg blur opacity-75"></div>

              <div className="relative bg-slate-950/95 backdrop-blur-xl border border-red-900/50 rounded-lg overflow-hidden">
                <div className="p-4 text-center font-bold text-lg bg-gradient-to-r from-red-600 to-orange-600">
                  {modalAlerta.titulo}
                </div>

                <div className="p-6">
                  <p className="text-slate-300 text-center leading-relaxed mb-6">
                    {modalAlerta.mensagem}
                  </p>

                  <button
                    onClick={() => setModalAlerta(null)}
                    className="w-full group/btn relative"
                  >
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded blur opacity-50 group-hover/btn:opacity-75 transition-all"></div>
                    <div className="relative px-4 py-3 bg-slate-950 rounded border border-cyan-500/50 transition-all">
                      <span className="font-bold text-cyan-400">Entendi</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
