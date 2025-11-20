"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import AvatarSVG from '../components/AvatarSVG';

export default function StoryModePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Reset tracking
  const [resetsRemaining, setResetsRemaining] = useState(2);

  // Story progression state
  const [storyPhase, setStoryPhase] = useState('prologo');
  const [sceneIndex, setSceneIndex] = useState(0);
  const [playerChoices, setPlayerChoices] = useState([]);

  // Avatar creation state
  const [selectedElement, setSelectedElement] = useState(null);
  const [avatarName, setAvatarName] = useState('');
  const [avatarStats, setAvatarStats] = useState(null);
  const [avatarVisual, setAvatarVisual] = useState(null);

  // Combat/Action log
  const [actionLog, setActionLog] = useState([]);

  // Typing animation state
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingSpeed = 15; // ms per character

  // Elements available
  const elements = [
    { id: 'fogo', nome: 'Fogo', emoji: '🔥', cor: 'from-red-500 to-orange-500', descricao: 'Poder destrutivo e paixão ardente' },
    { id: 'agua', nome: 'Água', emoji: '💧', cor: 'from-blue-500 to-cyan-500', descricao: 'Adaptabilidade e fluidez' },
    { id: 'terra', nome: 'Terra', emoji: '🌍', cor: 'from-green-600 to-emerald-600', descricao: 'Força inabalável e resistência' },
    { id: 'vento', nome: 'Vento', emoji: '💨', cor: 'from-teal-400 to-cyan-400', descricao: 'Velocidade e liberdade' },
    { id: 'eletricidade', nome: 'Eletricidade', emoji: '⚡', cor: 'from-yellow-400 to-amber-400', descricao: 'Energia pura e reflexos rápidos' },
    { id: 'sombra', nome: 'Sombra', emoji: '🌑', cor: 'from-purple-900 to-indigo-900', descricao: 'Mistério e furtividade' },
    { id: 'luz', nome: 'Luz', emoji: '✨', cor: 'from-yellow-200 to-white', descricao: 'Pureza e cura' }
  ];

  // Story content - Chapter 1: "O Despertar do Vínculo"
  const storyContent = {
    prologo: {
      title: "~ / capitulo_1 / prologo.log",
      scenes: [
        {
          text: `> Iniciando Capítulo 1: O Despertar do Vínculo...\n\nA luz do portal se estabiliza diante de você. Quinze anos se passaram desde o Colapso — desde que as fendas dimensionais rasgaram a realidade e mudaram o mundo para sempre.\n\nVocê é um Invocador iniciante, recém-aceito na Organização de Caçadores Dimensionais. Hoje é o dia mais importante da sua vida: você irá estabelecer seu primeiro vínculo com um Avatar.\n\nO complexo da Organização se ergue ao redor, uma fortaleza de tecnologia e magia entrelaçadas. Hunters veteranos caminham pelos corredores, seus Avatares seguindo-os como sombras leais.\n\nEm breve, você também terá um companheiro. Um guerreiro dimensional que lutará ao seu lado.`,
          choices: [
            { id: 'continuar', text: 'Continuar' }
          ]
        }
      ]
    },
    cena1: {
      title: "~ / capitulo_1 / santuario_ocultista.log",
      scenes: [
        {
          text: `> Localização: Santuário do Ocultista\n\nVocê entra em uma sala circular revestida de runas pulsantes. No centro, um círculo de invocação brilha com energia azul-esverdeada. Um homem de vestes escuras aguarda — o Ocultista, mestre dos rituais de vínculo.\n\n"Bem-vindo, jovem Invocador," ele diz, sua voz ecoando de forma sobrenatural. "Você está pronto para forjar seu primeiro vínculo? Este é um momento que definirá sua jornada."\n\nEle gesticula para o círculo de invocação.\n\n"O vínculo entre Invocador e Avatar é sagrado. Não é escravidão, mas parceria. Você chamará uma consciência de outra dimensão, e juntos, formarão algo maior."`,
          choices: [
            { id: 'estou_pronto', text: 'Estou pronto.', next: 1 },
            { id: 'como_funciona', text: 'Como funciona o ritual?', next: 2 },
            { id: 'e_perigoso', text: 'Isso é perigoso?', next: 3 }
          ]
        },
        {
          text: `O Ocultista sorri levemente. "Confiança. Isso é bom. Um Invocador hesitante cria vínculos fracos. Mas lembre-se: o respeito mútuo é a base de tudo."\n\nEle caminha ao redor do círculo, verificando as runas.\n\n"Primeiro, você deve escolher um elemento. Cada Avatar nasce alinhado a uma força primordial. Sua escolha determinará não apenas o poder do seu companheiro, mas também sua personalidade e forma."`,
          choices: [
            { id: 'escolher_elemento', text: 'Entendo. Estou pronto para escolher.', next: 'element_selection' }
          ]
        },
        {
          text: `"Ah, um estudioso," o Ocultista aprova com um aceno. "Sabedoria antes de ação. Muito bem."\n\nEle aponta para o círculo brilhante.\n\n"O ritual de vínculo conecta sua essência à de uma entidade dimensional. Você oferece uma âncora neste plano, e em troca, ela empresta sua força. Mas não é uma corrente — é uma simbiose."\n\n"A consciência do Avatar se manifestará em forma física, moldada pelo elemento que você escolher. E com o tempo, o vínculo entre vocês se aprofundará... ou se quebrará, se você tratá-lo como mera ferramenta."`,
          choices: [
            { id: 'escolher_elemento_2', text: 'Fascinante. Estou pronto para começar.', next: 'element_selection' }
          ]
        },
        {
          text: `O Ocultista balança a cabeça. "Todo poder carrega risco. Mas o ritual em si? Não. Foi aperfeiçoado ao longo de anos."\n\nEle pausa, seu olhar se tornando mais sério.\n\n"O verdadeiro perigo não está no ritual, mas em como você trata o vínculo depois. Um Avatar maltratado pode se rebelar. Um vínculo negligenciado pode se romper. E um Invocador arrogante... bem, esses raramente sobrevivem muito tempo além dos portais."\n\n"Trate seu Avatar como parceiro, e ele dará a vida por você. Trate-o como escravo, e você descobrirá o que significa estar sozinho quando mais precisar."`,
          choices: [
            { id: 'entendi', text: 'Entendi. Vou respeitar meu Avatar.', next: 'element_selection' }
          ]
        }
      ]
    }
  };

  useEffect(() => {
    const init = async () => {
      const userData = localStorage.getItem("user");
      if (!userData) {
        router.push("/login");
        return;
      }

      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);

      // Load saved progress
      try {
        const response = await fetch(`/api/story/load?userId=${parsedUser.id}`);
        const data = await response.json();

        // Set resets remaining
        setResetsRemaining(data.resets_remaining ?? 2);

        if (data.progress) {
          // Restore progress from database
          setStoryPhase(data.progress.story_phase);
          setSceneIndex(data.progress.scene_index);
          setPlayerChoices(data.progress.player_choices || []);

          if (data.progress.selected_element) {
            const element = elements.find(el => el.id === data.progress.selected_element.id);
            setSelectedElement(element);
          }

          setAvatarName(data.progress.avatar_name || '');
          setAvatarStats(data.progress.avatar_stats);

          addToLog("Progresso carregado do banco de dados.", 'success');
          addToLog(`Fase atual: ${data.progress.story_phase}`, 'info');
        } else {
          addToLog("Sistema de Modo História inicializado.", 'info');
          addToLog("Capítulo 1: O Despertar do Vínculo carregado.", 'info');
        }
      } catch (error) {
        console.error("Erro ao carregar progresso:", error);
        addToLog("Erro ao carregar progresso. Iniciando do começo.", 'error');
      }

      setLoading(false);
    };

    init();
  }, [router]);

  // Typing animation effect
  useEffect(() => {
    const scene = getCurrentScene();
    if (!scene?.text) {
      setDisplayedText('');
      return;
    }

    setIsTyping(true);
    setDisplayedText('');
    let currentIndex = 0;

    const interval = setInterval(() => {
      if (currentIndex < scene.text.length) {
        setDisplayedText(scene.text.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, typingSpeed);

    return () => clearInterval(interval);
  }, [storyPhase, sceneIndex]);

  const getCurrentScene = () => {
    if (storyPhase === 'prologo') {
      return storyContent.prologo.scenes[sceneIndex];
    } else if (storyPhase === 'cena1') {
      return storyContent.cena1.scenes[sceneIndex];
    }
    return null;
  };

  const addToLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    setActionLog(prev => [...prev, { timestamp, message, type }]);
  };

  const saveProgress = async (updates = {}) => {
    if (!user) return;

    setSaving(true);
    try {
      const progressData = {
        userId: user.id,
        storyPhase: updates.storyPhase ?? storyPhase,
        sceneIndex: updates.sceneIndex ?? sceneIndex,
        playerChoices: updates.playerChoices ?? playerChoices,
        selectedElement: updates.selectedElement ?? selectedElement,
        avatarName: updates.avatarName ?? avatarName,
        avatarStats: updates.avatarStats ?? avatarStats,
        avatarVisual: updates.avatarVisual ?? avatarVisual,
        completed: updates.completed ?? (storyPhase === 'conclusao')
      };

      const response = await fetch('/api/story/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(progressData)
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar progresso');
      }

      addToLog('Progresso salvo automaticamente.', 'success');
    } catch (error) {
      console.error('Erro ao salvar progresso:', error);
      addToLog('Erro ao salvar progresso.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!user) return;

    if (resetsRemaining <= 0) {
      addToLog('Você já usou todos os seus 2 resets disponíveis.', 'error');
      alert('Limite de resets atingido!\n\nVocê já usou seus 2 resets disponíveis para o Modo História.');
      return;
    }

    const confirmReset = confirm(
      `Tem certeza que deseja resetar o Modo História?\n\nTodo o progresso será perdido e você começará do início.\n\nResets restantes: ${resetsRemaining}`
    );

    if (!confirmReset) return;

    setResetting(true);
    try {
      const response = await fetch('/api/story/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === 'Limite de resets atingido') {
          setResetsRemaining(0);
          addToLog(data.message, 'error');
          alert(data.message);
          return;
        }
        throw new Error('Erro ao resetar progresso');
      }

      // Update resets remaining
      setResetsRemaining(data.resets_remaining);

      // Reset all state
      setStoryPhase('prologo');
      setSceneIndex(0);
      setPlayerChoices([]);
      setSelectedElement(null);
      setAvatarName('');
      setAvatarStats(null);
      setAvatarVisual(null);
      setActionLog([]);

      addToLog(`Modo História resetado. Resets restantes: ${data.resets_remaining}`, 'important');
      addToLog('Capítulo 1: O Despertar do Vínculo carregado.', 'info');
    } catch (error) {
      console.error('Erro ao resetar:', error);
      addToLog('Erro ao resetar progresso.', 'error');
    } finally {
      setResetting(false);
    }
  };

  const handleChoice = (choice) => {
    const newChoices = [...playerChoices, choice.id];
    setPlayerChoices(newChoices);
    addToLog(`Escolha: ${choice.text}`, 'choice');

    let newPhase = storyPhase;
    let newSceneIndex = sceneIndex;

    if (choice.next === 'element_selection') {
      newPhase = 'element_selection';
      setStoryPhase('element_selection');
    } else if (typeof choice.next === 'number') {
      newSceneIndex = choice.next;
      setSceneIndex(choice.next);
    } else if (choice.id === 'continuar') {
      // Move to next phase
      if (storyPhase === 'prologo') {
        newPhase = 'cena1';
        newSceneIndex = 0;
        setStoryPhase('cena1');
        setSceneIndex(0);
      }
    }

    // Save progress automatically
    saveProgress({
      storyPhase: newPhase,
      sceneIndex: newSceneIndex,
      playerChoices: newChoices
    });
  };

  const handleElementSelection = (element) => {
    setSelectedElement(element);
    addToLog(`Elemento selecionado: ${element.nome} ${element.emoji}`, 'important');
    setStoryPhase('vinculo');
    setSceneIndex(0);

    // Save progress automatically
    saveProgress({
      selectedElement: element,
      storyPhase: 'vinculo',
      sceneIndex: 0
    });
  };

  const handleAvatarNaming = () => {
    if (!avatarName.trim()) {
      addToLog("Por favor, insira um nome válido.", 'error');
      return;
    }

    // Generate stats based on element
    const baseStats = {
      vida: 100,
      ataque: 10,
      defesa: 8,
      velocidade: 12,
      nivel: 1,
      vinculo: 50
    };

    // Element bonuses
    const elementBonuses = {
      fogo: { ataque: 3, vida: -5 },
      agua: { defesa: 2, velocidade: 1 },
      terra: { defesa: 4, velocidade: -2 },
      vento: { velocidade: 4, defesa: -2 },
      eletricidade: { velocidade: 3, ataque: 2 },
      sombra: { ataque: 2, velocidade: 2, defesa: -1 },
      luz: { vida: 10, ataque: 1 }
    };

    const bonus = elementBonuses[selectedElement.id] || {};
    const finalStats = {
      ...baseStats,
      vida: baseStats.vida + (bonus.vida || 0),
      ataque: baseStats.ataque + (bonus.ataque || 0),
      defesa: baseStats.defesa + (bonus.defesa || 0),
      velocidade: baseStats.velocidade + (bonus.velocidade || 0)
    };

    // Generate visual properties for the avatar based on element
    const elementVisuals = {
      fogo: { corPele: '#F5D0C5', corCabelo: '#FF6B35', tipoCabelo: 'spiky', corOlhos: '#FF4500', corRoupa: '#8B0000' },
      agua: { corPele: '#E8F4F8', corCabelo: '#4682B4', tipoCabelo: 'wavy', corOlhos: '#00CED1', corRoupa: '#1E90FF' },
      terra: { corPele: '#D2B48C', corCabelo: '#8B4513', tipoCabelo: 'short', corOlhos: '#556B2F', corRoupa: '#6B4423' },
      vento: { corPele: '#F0FFF0', corCabelo: '#98FB98', tipoCabelo: 'long', corOlhos: '#00FA9A', corRoupa: '#2E8B57' },
      eletricidade: { corPele: '#FFFACD', corCabelo: '#FFD700', tipoCabelo: 'spiky', corOlhos: '#FFA500', corRoupa: '#DAA520' },
      sombra: { corPele: '#C4A1FF', corCabelo: '#4B0082', tipoCabelo: 'messy', corOlhos: '#8A2BE2', corRoupa: '#2F0A3D' },
      luz: { corPele: '#FFF8DC', corCabelo: '#FAFAD2', tipoCabelo: 'long', corOlhos: '#FFD700', corRoupa: '#F5F5DC' }
    };

    const visual = elementVisuals[selectedElement.id] || elementVisuals.fogo;
    setAvatarVisual(visual);

    setAvatarStats(finalStats);
    addToLog(`Avatar ${avatarName} criado com sucesso!`, 'success');
    addToLog(`Stats: HP ${finalStats.vida} | ATK ${finalStats.ataque} | DEF ${finalStats.defesa} | SPD ${finalStats.velocidade}`, 'stats');

    setStoryPhase('conclusao');

    // Save progress automatically (chapter completed)
    saveProgress({
      avatarName: avatarName,
      avatarStats: finalStats,
      avatarVisual: visual,
      storyPhase: 'conclusao',
      completed: true
    });
  };

  const voltarDashboard = () => {
    router.push("/dashboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center">
        <div className="text-cyan-400 font-mono animate-pulse">Carregando modo história...</div>
      </div>
    );
  }

  const getCurrentTitle = () => {
    if (storyPhase === 'prologo') return storyContent.prologo.title;
    if (storyPhase === 'cena1') return storyContent.cena1.title;
    if (storyPhase === 'element_selection') return "~ / capitulo_1 / selecao_elemento.log";
    if (storyPhase === 'vinculo') return "~ / capitulo_1 / criacao_vinculo.log";
    if (storyPhase === 'conclusao') return "~ / capitulo_1 / conclusao.log";
    return "~ / modo_historia.log";
  };

  const currentScene = getCurrentScene();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-gray-100 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl top-20 -left-48 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-purple-500/5 rounded-full blur-3xl bottom-20 -right-48 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute w-64 h-64 bg-blue-500/5 rounded-full blur-3xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      {/* Grid hexagonal */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTYiIGhlaWdodD0iMTAwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0yOCAwTDAgMTVWMzVMMjggNTBMNTYgMzVWMTVaTTI4IDUwTDAgNjVWODVMMjggMTAwTDU2IDg1VjY1WiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjY3lhbiIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48L3N2Zz4=')] pointer-events-none"></div>

      {/* Scanlines */}
      <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(transparent_50%,rgba(99,102,241,0.5)_50%)] bg-[length:100%_4px] pointer-events-none"></div>

      {/* Vinheta */}
      <div className="absolute inset-0 shadow-[inset_0_0_120px_rgba(0,0,0,0.9)] pointer-events-none"></div>

      <div className="relative z-10 container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={voltarDashboard}
            className="text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-2 font-mono text-sm group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            <span>RETORNAR</span>
          </button>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-cyan-400/50 font-mono">
              <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></div>
              <span>MODO HISTÓRIA ATIVO</span>
              <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></div>
            </div>

            {saving && (
              <div className="text-xs text-green-400/70 font-mono flex items-center gap-1">
                <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
                <span>Salvando...</span>
              </div>
            )}

            <button
              onClick={handleReset}
              disabled={resetting || resetsRemaining <= 0}
              className={`transition-colors flex items-center gap-2 font-mono text-xs group disabled:opacity-50 disabled:cursor-not-allowed ${
                resetsRemaining <= 0 ? 'text-slate-600' : 'text-red-400/70 hover:text-red-400'
              }`}
              title={resetsRemaining <= 0 ? 'Sem resets disponíveis' : `Resetar Modo História (${resetsRemaining} restantes)`}
            >
              <span className="group-hover:rotate-180 transition-transform duration-500">🔄</span>
              <span>{resetting ? 'RESETANDO...' : `RESETAR (${2 - resetsRemaining}/2)`}</span>
            </button>
          </div>
        </div>

        {/* Avatar Stats Display - Top */}
        {avatarStats && avatarVisual && (
          <div className="max-w-5xl mx-auto mb-6">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 rounded-lg blur opacity-50"></div>
              <div className="relative bg-slate-950/80 backdrop-blur-xl border border-cyan-900/30 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <AvatarSVG
                      avatar={{
                        nome: avatarName,
                        elemento: selectedElement.nome,
                        corPele: avatarVisual.corPele,
                        corCabelo: avatarVisual.corCabelo,
                        tipoCabelo: avatarVisual.tipoCabelo,
                        corOlhos: avatarVisual.corOlhos,
                        corRoupa: avatarVisual.corRoupa
                      }}
                      tamanho={64}
                    />
                    <div>
                      <div className="text-xs text-slate-400">Avatar Vinculado</div>
                      <div className="text-xl font-bold text-cyan-400">{avatarName}</div>
                      <div className="text-sm text-slate-400">Elemento: {selectedElement.nome} {selectedElement.emoji}</div>
                    </div>
                  </div>
                  <div className="flex gap-6 font-mono text-sm">
                    <div className="text-center">
                      <div className="text-xs text-slate-500">HP</div>
                      <div className="text-green-400 font-bold">{avatarStats.vida}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-slate-500">ATK</div>
                      <div className="text-red-400 font-bold">{avatarStats.ataque}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-slate-500">DEF</div>
                      <div className="text-blue-400 font-bold">{avatarStats.defesa}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-slate-500">SPD</div>
                      <div className="text-yellow-400 font-bold">{avatarStats.velocidade}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-slate-500">VÍNCULO</div>
                      <div className="text-purple-400 font-bold">{avatarStats.vinculo}%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Story Terminal - Center/Left (2 columns) */}
          <div className="lg:col-span-2">
            <div className="relative group mb-6">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 rounded-lg blur opacity-50 group-hover:opacity-75 transition-opacity"></div>

              <div className="relative bg-slate-950/80 backdrop-blur-xl border border-cyan-900/30 rounded-lg overflow-hidden min-h-[500px]">
                {/* Terminal header */}
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 border-b border-cyan-900/20">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-slate-600"></div>
                    <div className="w-3 h-3 rounded-full bg-slate-600"></div>
                    <div className="w-3 h-3 rounded-full bg-slate-600"></div>
                  </div>
                  <span className="text-xs text-cyan-400/60 font-mono ml-2">{getCurrentTitle()}</span>
                </div>

                {/* Terminal content */}
                <div className="p-6 font-mono text-sm space-y-4 min-h-[450px]">
                  {/* Story scenes */}
                  {currentScene && (
                    <>
                      <div className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {displayedText}
                        {isTyping && <span className="inline-block w-2 h-4 bg-cyan-400 ml-1 animate-pulse" />}
                      </div>
                    </>
                  )}

                  {/* Element Selection Phase */}
                  {storyPhase === 'element_selection' && (
                    <div>
                      <p className="text-cyan-400 mb-4">
                        <span className="text-cyan-400">{'>'}</span> Escolha o elemento do seu Avatar:
                      </p>
                      <p className="text-slate-300 mb-6">
                        O Ocultista gesticula, e sete símbolos elementais começam a flutuar ao redor do círculo de invocação, cada um pulsando com energia única.
                      </p>
                      <p className="text-slate-400 text-xs mb-4 italic">
                        "Cada elemento carrega suas próprias virtudes e fraquezas. Escolha aquele que ressoa com sua alma."
                      </p>

                      <div className="grid grid-cols-2 gap-3 mt-6">
                        {elements.map(element => (
                          <button
                            key={element.id}
                            onClick={() => handleElementSelection(element)}
                            className="group/el relative"
                          >
                            <div className={`absolute -inset-0.5 bg-gradient-to-r ${element.cor} rounded-lg blur opacity-30 group-hover/el:opacity-60 transition-all`}></div>
                            <div className="relative bg-slate-900/90 border border-cyan-900/30 rounded-lg p-4 hover:border-cyan-500/50 transition-all">
                              <div className="text-3xl mb-2">{element.emoji}</div>
                              <div className="text-cyan-400 font-bold">{element.nome}</div>
                              <div className="text-xs text-slate-400 mt-1">{element.descricao}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Avatar Naming Phase */}
                  {storyPhase === 'vinculo' && (
                    <div>
                      <p className="text-cyan-400 mb-4">
                        <span className="text-cyan-400">{'>'}</span> Estabelecendo vínculo com elemento {selectedElement.nome} {selectedElement.emoji}
                      </p>
                      <p className="text-slate-300 mb-4">
                        O círculo de invocação explode em luz {selectedElement.nome.toLowerCase()}. Você sente uma presença se manifestando — uma consciência antiga, poderosa, agora conectada à sua essência.
                      </p>
                      <p className="text-slate-300 mb-6">
                        Uma forma começa a se solidificar diante de você. Seu Avatar está nascendo.
                      </p>

                      <div className="bg-slate-900/50 rounded p-4 border border-cyan-900/30">
                        <label className="block text-cyan-400 text-sm mb-2">
                          Dê um nome ao seu Avatar:
                        </label>
                        <input
                          type="text"
                          value={avatarName}
                          onChange={(e) => setAvatarName(e.target.value)}
                          maxLength={20}
                          placeholder="Digite o nome..."
                          className="w-full bg-slate-950 border border-cyan-900/50 rounded px-4 py-2 text-slate-200 focus:border-cyan-500 focus:outline-none font-mono"
                        />
                        <button
                          onClick={handleAvatarNaming}
                          className="mt-4 w-full group/btn relative"
                        >
                          <div className={`absolute -inset-0.5 bg-gradient-to-r ${selectedElement.cor} rounded blur opacity-50 group-hover/btn:opacity-75 transition-all`}></div>
                          <div className="relative px-4 py-2 bg-slate-950 rounded border border-cyan-500/50">
                            <span className="text-cyan-300 font-bold">Confirmar Vínculo</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Conclusion Phase */}
                  {storyPhase === 'conclusao' && (
                    <div>
                      <p className="text-cyan-400 mb-4">
                        <span className="text-cyan-400">{'>'}</span> Vínculo estabelecido com sucesso!
                      </p>
                      <p className="text-slate-300 mb-4">
                        A luz se dissipa. Diante de você, {avatarName} se ergue — seu primeiro Avatar. Vocês estão conectados agora, suas essências entrelaçadas através das dimensões.
                      </p>
                      <p className="text-slate-300 mb-4">
                        O Ocultista observa com aprovação. "O vínculo foi formado. Mas lembre-se: este é apenas o começo. Treinem juntos, lutem juntos, e o vínculo se fortalecerá."
                      </p>
                      <p className="text-green-400 font-bold mb-6">
                        🏆 Conquista Desbloqueada: "Primeiro Vínculo"
                      </p>

                      <div className="bg-slate-900/50 rounded p-4 border border-green-500/30">
                        <div className="text-green-400 font-bold mb-2">Capítulo 1 Completo!</div>
                        <div className="text-slate-400 text-xs mb-4">
                          Você completou o primeiro capítulo do Modo História. Novos capítulos serão adicionados em breve.
                        </div>
                        <button
                          onClick={voltarDashboard}
                          className="w-full px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded font-bold hover:from-green-500 hover:to-emerald-500 transition-all"
                        >
                          Retornar ao Dashboard
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Choice Buttons Panel - Right */}
          <div className="lg:col-span-1">
            {currentScene && currentScene.choices && (
              <div className="relative group mb-6">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg blur opacity-50"></div>
                <div className="relative bg-slate-950/80 backdrop-blur-xl border border-purple-900/30 rounded-lg p-4">
                  <h3 className="text-purple-400 font-bold text-sm uppercase mb-4 font-mono">
                    &gt; Suas Escolhas
                  </h3>
                  <div className="space-y-3">
                    {currentScene.choices.map((choice, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleChoice(choice)}
                        className="w-full group/choice relative"
                      >
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded blur opacity-30 group-hover/choice:opacity-60 transition-all"></div>
                        <div className="relative bg-slate-900/90 border border-purple-900/30 rounded px-4 py-3 text-left hover:border-purple-500/50 transition-all">
                          <span className="text-purple-400 font-mono text-sm">{choice.text}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Info Panel */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-lg blur opacity-50"></div>
              <div className="relative bg-slate-950/80 backdrop-blur-xl border border-cyan-900/30 rounded-lg p-4">
                <h3 className="text-cyan-400 font-bold text-sm uppercase mb-3 font-mono">
                  ℹ️ Informações
                </h3>
                <div className="space-y-2 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>Fase:</span>
                    <span className="text-cyan-400">{storyPhase}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Escolhas:</span>
                    <span className="text-purple-400">{playerChoices.length}</span>
                  </div>
                  {selectedElement && (
                    <div className="flex justify-between">
                      <span>Elemento:</span>
                      <span className="text-amber-400">{selectedElement.nome}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Log - Bottom */}
        <div className="max-w-7xl mx-auto mt-6">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg blur opacity-50"></div>
            <div className="relative bg-slate-950/80 backdrop-blur-xl border border-green-900/30 rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 border-b border-green-900/20">
                <span className="text-xs text-green-400/60 font-mono">~ / logs / acoes.log</span>
              </div>
              <div className="p-4 font-mono text-xs max-h-40 overflow-y-auto">
                {actionLog.length === 0 ? (
                  <div className="text-slate-600">Aguardando ações...</div>
                ) : (
                  <div className="space-y-1">
                    {actionLog.map((log, idx) => (
                      <div key={idx} className={`
                        ${log.type === 'info' ? 'text-slate-400' : ''}
                        ${log.type === 'choice' ? 'text-purple-400' : ''}
                        ${log.type === 'important' ? 'text-cyan-400' : ''}
                        ${log.type === 'success' ? 'text-green-400' : ''}
                        ${log.type === 'error' ? 'text-red-400' : ''}
                        ${log.type === 'stats' ? 'text-amber-400' : ''}
                      `}>
                        <span className="text-slate-600">[{log.timestamp}]</span> {log.message}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
