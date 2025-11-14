"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { aplicarPenalidadesExaustao, getNivelExaustao } from "../../avatares/sistemas/exhaustionSystem";
import AvatarSVG from "../../components/AvatarSVG";

export default function ArenaSobrevivenciaPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [avatarAtivo, setAvatarAtivo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [estadoJogo, setEstadoJogo] = useState('lobby'); // lobby, preparando, sobrevivendo, game_over
  const [ondaAtual, setOndaAtual] = useState(0);
  const [recordePessoal, setRecordePessoal] = useState(0);

  // Estados de combate
  const [statsAvatarAtual, setStatsAvatarAtual] = useState(null); // HP, energia, stats atuais
  const [recompensasAcumuladas, setRecompensasAcumuladas] = useState({ xp: 0, moedas: 0, fragmentos: 0 });
  const [modalLevelUp, setModalLevelUp] = useState(null); // { nivelAnterior, nivelNovo }
  const [exaustaoAcumulada, setExaustaoAcumulada] = useState(0); // Exaustão total acumulada

  // Estados para modais
  const [modalOndaCompleta, setModalOndaCompleta] = useState(null); // { onda, recompensas, exaustao }
  const [modalGameOver, setModalGameOver] = useState(null); // { ondaFinal, recompensasTotais, novoRecorde }
  const [modalAlerta, setModalAlerta] = useState(null); // { titulo, mensagem }

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    carregarAvatarAtivo(parsedUser.id);

    // Carregar recorde pessoal
    const recordeSalvo = localStorage.getItem(`survival_record_${parsedUser.id}`);
    if (recordeSalvo) {
      setRecordePessoal(parseInt(recordeSalvo));
    }
  }, [router]);

  const carregarAvatarAtivo = async (userId) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/meus-avatares?userId=${userId}`);
      const data = await response.json();

      if (response.ok) {
        const ativo = data.avatares.find(av => av.ativo);
        setAvatarAtivo(ativo || null);
      }
    } catch (error) {
      console.error("Erro ao carregar avatar ativo:", error);
    } finally {
      setLoading(false);
    }
  };

  const calcularMultiplicadorOnda = (onda) => {
    // ANTI-FARM: Dificuldade aumenta EXPONENCIALMENTE
    // Onda 8+ = quase impossível sobreviver
    if (onda <= 5) return 1.0 + (onda * 0.15); // 1.0 a 1.75 (mais agressivo)
    if (onda <= 8) return 1.75 + ((onda - 5) * 0.4); // 1.75 a 2.95 (MUITO mais agressivo)
    if (onda <= 12) return 2.95 + ((onda - 8) * 0.6); // 2.95 a 5.35 (brutal)
    return 5.35 + ((onda - 12) * 0.8); // 5.35+ (quase impossível)
  };

  const calcularRecompensasOnda = (onda) => {
    const base_xp = 30;
    const base_moedas = 20;

    const isBossWave = onda % 5 === 0;
    const bossBonus = isBossWave ? 2 : 1;

    return {
      xp: Math.floor(base_xp * onda * 0.8 * bossBonus),
      moedas: Math.floor(base_moedas * onda * 0.6 * bossBonus),
      chance_fragmento: isBossWave ? 0.3 + (Math.floor(onda / 10) * 0.1) : 0.05 + (Math.floor(onda / 10) * 0.02),
      fragmentos_garantidos: onda >= 20 && isBossWave ? 1 : 0
    };
  };

  const calcularExaustaoOnda = (onda) => {
    // ANTI-FARM: Exaustão aumenta MUITO mais rápido
    // Após 10 ondas, avatar estará quase colapsado
    if (onda <= 5) return 5 + (onda * 2); // 7 a 15
    if (onda <= 10) return 15 + ((onda - 5) * 4); // 19 a 35
    if (onda <= 15) return 35 + ((onda - 10) * 6); // 41 a 65
    return 65 + ((onda - 15) * 8); // 73+ (colapso garantido)
  };

  const getNomeDificuldadeOnda = (onda) => {
    if (onda <= 5) return { nome: 'Iniciante', cor: 'text-green-400' };
    if (onda <= 10) return { nome: 'Intermediário', cor: 'text-cyan-400' };
    if (onda <= 15) return { nome: 'Avançado', cor: 'text-blue-400' };
    if (onda <= 20) return { nome: 'Elite', cor: 'text-purple-400' };
    if (onda <= 30) return { nome: 'Lendário', cor: 'text-red-400' };
    return { nome: 'IMPOSSÍVEL', cor: 'text-red-600' };
  };

  const iniciarSobrevivencia = () => {
    if (!avatarAtivo) {
      setModalAlerta({
        titulo: '⚠️ Sem Avatar Ativo',
        mensagem: 'Você precisa ter um avatar ativo! Vá até a tela de Avatares e selecione um avatar.'
      });
      return;
    }

    if (!avatarAtivo.vivo) {
      setModalAlerta({
        titulo: '💀 Avatar Morto',
        mensagem: 'Seu avatar ativo está morto! Ressuscite-o ou selecione outro avatar na tela de Avatares.'
      });
      return;
    }

    if (avatarAtivo.exaustao >= 60) {
      setModalAlerta({
        titulo: '💀 Avatar Exausto',
        mensagem: 'Seu avatar está muito exausto! Modo Sobrevivência exige avatares em boa forma (menos de 60% de exaustão). Descanse seu avatar ou selecione outro.'
      });
      return;
    }

    // ANTI-FARM: Custo de entrada de 100 moedas
    const CUSTO_ENTRADA = 100;
    if (user.moedas < CUSTO_ENTRADA) {
      setModalAlerta({
        titulo: '💰 Moedas Insuficientes',
        mensagem: `Modo Sobrevivência custa ${CUSTO_ENTRADA} moedas para entrar. Você tem apenas ${user.moedas} moedas.`
      });
      return;
    }

    // Descontar moedas imediatamente
    fetch('/api/atualizar-stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        moedas: -CUSTO_ENTRADA // Subtrai 100 moedas
      })
    });

    // Atualizar moedas localmente
    setUser(prev => ({
      ...prev,
      moedas: prev.moedas - CUSTO_ENTRADA
    }));

    // Inicializar stats do avatar
    // IMPORTANTE: Aplicar penalidades de exaustão ANTES de entrar em combate
    const statsBase = {
      forca: avatarAtivo.forca,
      agilidade: avatarAtivo.agilidade,
      resistencia: avatarAtivo.resistencia,
      foco: avatarAtivo.foco
    };
    const statsComPenalidades = aplicarPenalidadesExaustao(statsBase, avatarAtivo.exaustao || 0);

    // Calcular HP máximo baseado em resistência (JÁ com penalidade aplicada)
    const hpMaximo = statsComPenalidades.resistencia * 10 + avatarAtivo.nivel * 5;

    // Se hp_atual estiver salvo no banco, usar ele. Senão, usar HP máximo (avatar novo)
    const hpInicial = avatarAtivo.hp_atual !== null && avatarAtivo.hp_atual !== undefined
      ? avatarAtivo.hp_atual
      : hpMaximo;

    const statsIniciais = {
      hp_atual: hpInicial,
      hp_maximo: hpMaximo,
      energia_atual: 100,
      energia_maxima: 100,
      forca: statsComPenalidades.forca,
      agilidade: statsComPenalidades.agilidade,
      resistencia: statsComPenalidades.resistencia,
      foco: statsComPenalidades.foco,
      nivel: avatarAtivo.nivel,
      xp_atual: avatarAtivo.experiencia || 0
    };

    setStatsAvatarAtual(statsIniciais);
    setRecompensasAcumuladas({ xp: 0, moedas: 0, fragmentos: 0 });
    setExaustaoAcumulada(avatarAtivo.exaustao || 0); // Começar com exaustão salva no banco
    setEstadoJogo('preparando');
    setOndaAtual(1);

    // Simular preparação (1.5 segundos de animação)
    setTimeout(() => {
      setEstadoJogo('sobrevivendo');
      iniciarOndaAtual(1);
    }, 1500);
  };

  const iniciarOndaAtual = (onda) => {
    // Simular batalha com dificuldade crescente
    const multiplicador = calcularMultiplicadorOnda(onda);
    const danoBase = 15 * multiplicador;
    const gastoEnergiaBase = 20 + (onda * 2);

    const tempoCombate = 2500;

    setTimeout(() => {
      // Calcular dano recebido na onda (progressivo e balanceado)
      const danoAleatorio = danoBase + Math.random() * (danoBase * 0.5);
      const dano = Math.floor(danoAleatorio);

      // Calcular gasto de energia
      const energiaGasta = Math.min(gastoEnergiaBase + Math.random() * 10, 80);

      // Atualizar exaustão acumulada
      const exaustaoOnda = calcularExaustaoOnda(onda);
      setExaustaoAcumulada(prev => prev + exaustaoOnda);

      // Calcular novos valores antes de atualizar estado
      let novoHP = 0;
      let morreu = false;

      // Atualizar stats do avatar
      setStatsAvatarAtual(prev => {
        if (!prev) return prev;

        novoHP = Math.max(0, prev.hp_atual - dano);
        const novaEnergia = Math.max(0, prev.energia_atual - energiaGasta);
        morreu = novoHP <= 0;

        return {
          ...prev,
          hp_atual: novoHP,
          energia_atual: novaEnergia
        };
      });

      // Verificar resultado FORA do setState
      setTimeout(() => {
        if (morreu) {
          // Mesmo ao morrer, processar recompensas da onda completada
          processarRecompensasOnda(onda);

          // Aguardar um frame para garantir que o estado foi atualizado
          setTimeout(() => {
            finalizarSobrevivencia(onda, true);
          }, 100);
        } else {
          ondaCompleta(onda);
        }
      }, 400);
    }, tempoCombate);
  };

  const processarRecompensasOnda = (onda) => {
    // Atualizar recorde se necessário
    if (onda > recordePessoal) {
      setRecordePessoal(onda);
      localStorage.setItem(`survival_record_${user.id}`, onda.toString());
    }

    // Calcular recompensas da onda
    const recompensas = calcularRecompensasOnda(onda);

    // Acumular recompensas
    setRecompensasAcumuladas(prev => ({
      xp: prev.xp + recompensas.xp,
      moedas: prev.moedas + recompensas.moedas,
      fragmentos: prev.fragmentos + recompensas.fragmentos_garantidos + (Math.random() < recompensas.chance_fragmento ? 1 : 0)
    }));

    return recompensas;
  };

  const ondaCompleta = (onda) => {
    const recompensas = processarRecompensasOnda(onda);

    // Verificar level up e atualizar XP
    let houveLevelUp = false;
    let nivelAnterior = 0;
    let nivelNovo = 0;

    setStatsAvatarAtual(prev => {
      if (!prev) return prev;

      const novoXP = prev.xp_atual + recompensas.xp;
      const xpParaProximoNivel = prev.nivel * 100; // Fórmula simples

      if (novoXP >= xpParaProximoNivel) {
        // Level up!
        nivelAnterior = prev.nivel;
        nivelNovo = nivelAnterior + 1;
        houveLevelUp = true;

        console.log('🎉 LEVEL UP DETECTADO!', { nivelAnterior, nivelNovo, novoXP, xpParaProximoNivel });

        // Aumentar stats ao subir de nível
        return {
          ...prev,
          nivel: nivelNovo,
          xp_atual: novoXP - xpParaProximoNivel,
          hp_maximo: prev.hp_maximo + 10,
          hp_atual: Math.min(prev.hp_atual + 20, prev.hp_maximo + 10), // Recupera 20 HP
          energia_atual: Math.min(prev.energia_atual + 30, 100), // Recupera 30 energia
          forca: prev.forca + 1,
          agilidade: prev.agilidade + 1,
          resistencia: prev.resistencia + 1,
          foco: prev.foco + 1
        };
      }

      return { ...prev, xp_atual: novoXP };
    });

    const exaustao = calcularExaustaoOnda(onda);

    // Se houve level up, mostrar modal de level up PRIMEIRO
    // IMPORTANTE: Usar setTimeout para garantir que o setState acima complete primeiro
    setTimeout(() => {
      if (houveLevelUp) {
        console.log('⭐ Mostrando modal de LEVEL UP:', { nivelAnterior, nivelNovo });
        setModalLevelUp({
          nivelAnterior,
          nivelNovo,
          // Guardar dados da onda para mostrar depois
          proximoModal: { onda, recompensas, exaustao }
        });
      } else {
        // Sem level up, mostrar modal de onda completa direto
        console.log('📊 Sem level up, mostrando modal de onda completa');
        setModalOndaCompleta({ onda, recompensas, exaustao });
      }
    }, 800);
  };

  const continuarParaProximaOnda = () => {
    const proximaOnda = modalOndaCompleta.onda + 1;
    setModalOndaCompleta(null);
    setOndaAtual(proximaOnda);
    setEstadoJogo('preparando');

    setTimeout(() => {
      setEstadoJogo('sobrevivendo');
      iniciarOndaAtual(proximaOnda);
    }, 1500);
  };

  const desistirSobrevivencia = () => {
    const ondaFinal = modalOndaCompleta.onda;
    setModalOndaCompleta(null);
    finalizarSobrevivencia(ondaFinal, false);
  };

  const finalizarSobrevivencia = async (ondaFinal, derrota = true) => {
    const novoRecorde = ondaFinal > recordePessoal;

    // IMPORTANTE: Recalcular recompensas totais baseado na onda final
    // Isso garante que as recompensas sejam calculadas corretamente mesmo na primeira onda
    // quando o estado recompensasAcumuladas pode não ter sido atualizado ainda
    const recompensasTotais = calcularRecompensasTotais(ondaFinal);

    // Atualizar estado de recompensas para refletir o valor correto
    setRecompensasAcumuladas(recompensasTotais);

    // Salvar recompensas no banco de dados
    try {
      // Atualizar stats do jogador (moedas e fragmentos)
      const responseStats = await fetch('/api/atualizar-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          moedas: recompensasTotais.moedas,
          fragmentos: recompensasTotais.fragmentos
        })
      });

      // Atualizar estado local do usuário
      if (responseStats.ok) {
        const dataStats = await responseStats.json();
        console.log('✅ Stats do jogador atualizados:', dataStats);

        setUser(prev => ({
          ...prev,
          moedas: dataStats.jogador?.moedas || prev.moedas,
          fragmentos: dataStats.jogador?.fragmentos || prev.fragmentos
        }));

        // Atualizar localStorage
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        userData.moedas = dataStats.jogador?.moedas || userData.moedas;
        userData.fragmentos = dataStats.jogador?.fragmentos || userData.fragmentos;
        localStorage.setItem('user', JSON.stringify(userData));
      }

      // Atualizar avatar (XP, exaustão, nível)
      // IMPORTANTE: NÃO enviar 'vinculo' - modo sobrevivência não altera vínculo
      console.log('🏋️ Salvando sobrevivência:', {
        avatarId: avatarAtivo.id,
        xp: recompensasTotais.xp,
        exaustaoAcumulada: exaustaoAcumulada,
        exaustaoEnviada: Math.floor(exaustaoAcumulada),
        nivel: statsAvatarAtual?.nivel || avatarAtivo.nivel
      });

      const responseAvatar = await fetch('/api/atualizar-avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avatarId: avatarAtivo.id,
          experiencia: recompensasTotais.xp,
          exaustao: Math.floor(exaustaoAcumulada),
          // NÃO enviar 'vinculo' - modo sobrevivência não altera vínculo!
          hp_atual: statsAvatarAtual?.hp_atual,
          nivel: statsAvatarAtual?.nivel || avatarAtivo.nivel,
          // Atualizar stats se subiram de nível
          forca: statsAvatarAtual?.forca || avatarAtivo.forca,
          agilidade: statsAvatarAtual?.agilidade || avatarAtivo.agilidade,
          resistencia: statsAvatarAtual?.resistencia || avatarAtivo.resistencia,
          foco: statsAvatarAtual?.foco || avatarAtivo.foco
        })
      });

      // CRÍTICO: Atualizar estado local do avatar com dados salvos
      if (responseAvatar.ok) {
        const dataAvatar = await responseAvatar.json();
        console.log('✅ Avatar atualizado na API:', dataAvatar.avatar);

        // Atualizar avatar ativo com novos valores
        setAvatarAtivo(prev => ({
          ...prev,
          nivel: dataAvatar.avatar.nivel,
          experiencia: dataAvatar.avatar.experiencia,
          exaustao: dataAvatar.avatar.exaustao,
          hp_atual: dataAvatar.avatar.hp_atual,
          forca: dataAvatar.avatar.forca,
          agilidade: dataAvatar.avatar.agilidade,
          resistencia: dataAvatar.avatar.resistencia,
          foco: dataAvatar.avatar.foco
        }));

        // Recarregar avatar ativo para refletir mudanças
        if (user?.id) {
          carregarAvatarAtivo(user.id);
        }
      }
    } catch (error) {
      console.error('Erro ao salvar recompensas:', error);
    }

    setModalGameOver({
      ondaFinal,
      recompensasTotais,
      novoRecorde,
      derrota,
      statsFinais: statsAvatarAtual
    });
  };

  const voltarAoLobby = () => {
    setModalGameOver(null);
    setEstadoJogo('lobby');
    setOndaAtual(0);
  };

  const calcularRecompensasTotais = (ondaFinal) => {
    let totalXP = 0;
    let totalMoedas = 0;
    let totalFragmentos = 0;

    for (let i = 1; i <= ondaFinal; i++) {
      const recompensas = calcularRecompensasOnda(i);
      totalXP += recompensas.xp;
      totalMoedas += recompensas.moedas;
      totalFragmentos += recompensas.fragmentos_garantidos;

      // Simular chance de fragmento
      if (Math.random() < recompensas.chance_fragmento) {
        totalFragmentos++;
      }
    }

    return { xp: totalXP, moedas: totalMoedas, fragmentos: totalFragmentos };
  };

  const getAvisoExaustao = (exaustao) => {
    if (exaustao >= 60) return { texto: '🔴 MUITO EXAUSTO - NÃO RECOMENDADO!', cor: 'text-red-500' };
    if (exaustao >= 40) return { texto: '🟡 CANSADO - Cuidado com penalidades', cor: 'text-yellow-500' };
    if (exaustao >= 20) return { texto: '🟢 BOM - Pequenas penalidades', cor: 'text-green-500' };
    return { texto: '💚 PERFEITO - Sem penalidades!', cor: 'text-green-400' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950 flex items-center justify-center">
        <div className="text-purple-400 font-mono animate-pulse">Carregando Modo Sobrevivência...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950 text-gray-100">
      {/* Modal de Alerta */}
      {modalAlerta && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 overflow-y-auto p-4"
          onClick={() => setModalAlerta(null)}
        >
          <div className="min-h-full flex items-center justify-center py-8">
            <div
              className="max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/30 via-red-500/30 to-orange-500/30 rounded-lg blur opacity-75"></div>
                <div className="relative bg-gradient-to-br from-slate-900 to-slate-950 rounded-xl border-2 border-orange-500 p-8">
                  <div className="text-center mb-6">
                    <div className="text-6xl mb-4">{modalAlerta.titulo.split(' ')[0]}</div>
                    <h2 className="text-2xl font-black text-white mb-2">
                      {modalAlerta.titulo.substring(2)}
                    </h2>
                    <p className="text-slate-300">{modalAlerta.mensagem}</p>
                  </div>
                  <button
                    onClick={() => setModalAlerta(null)}
                    className="w-full px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-lg transition-colors"
                  >
                    Entendi
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Onda Completa */}
      {modalOndaCompleta && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 overflow-y-auto p-4"
          onClick={desistirSobrevivencia}
        >
          <div className="min-h-full flex items-center justify-center py-8">
            <div
              className="max-w-2xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/30 via-pink-500/30 to-purple-500/30 rounded-lg blur opacity-75"></div>
                <div className="relative bg-gradient-to-br from-purple-900/50 to-slate-950 rounded-2xl border-2 border-purple-500 p-8">
            <div className="text-center mb-8">
              <div className="text-7xl mb-4 animate-bounce">🎉</div>
              <h2 className="text-5xl font-black text-purple-400 mb-2">
                ONDA {modalOndaCompleta.onda}
              </h2>
              <p className="text-2xl text-green-400 font-bold">COMPLETADA!</p>
              {modalOndaCompleta.onda > recordePessoal - 1 && modalOndaCompleta.onda > recordePessoal && (
                <div className="mt-2 text-yellow-400 font-black text-lg animate-pulse">
                  🎊 NOVO RECORDE! 🎊
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-900/50 rounded-lg p-4 border border-blue-500/30">
                <div className="text-xs text-blue-300 mb-2 uppercase font-bold">XP Ganho</div>
                <div className="text-3xl font-black text-blue-400">+{modalOndaCompleta.recompensas.xp}</div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4 border border-yellow-500/30">
                <div className="text-xs text-yellow-300 mb-2 uppercase font-bold">Moedas</div>
                <div className="text-3xl font-black text-yellow-400">+{modalOndaCompleta.recompensas.moedas}</div>
              </div>
            </div>

            <div className="bg-slate-900/50 rounded-lg p-4 border border-purple-500/30 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">💎 Chance de Fragmento:</span>
                <span className="text-lg font-bold text-purple-400">
                  {(modalOndaCompleta.recompensas.chance_fragmento * 100).toFixed(0)}%
                </span>
              </div>
              {modalOndaCompleta.recompensas.fragmentos_garantidos > 0 && (
                <div className="mt-2 text-center text-purple-300 font-bold">
                  +{modalOndaCompleta.recompensas.fragmentos_garantidos} Fragmento(s) Garantido(s)!
                </div>
              )}
            </div>

            <div className="bg-orange-950/30 border border-orange-500/50 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-sm text-orange-300">😰 Exaustão Acumulada:</span>
                <span className="text-2xl font-bold text-orange-400">+{modalOndaCompleta.exaustao}</span>
              </div>
              <div className="text-xs text-slate-400 mt-2 text-center">
                Sua exaustão continua aumentando sem recuperação!
              </div>
            </div>

            {/* Card de Stats Atuais do Avatar */}
            {statsAvatarAtual && (
              <div className="bg-slate-900/70 border-2 border-cyan-500/50 rounded-lg p-6 mb-8">
                <h3 className="text-cyan-400 font-bold mb-4 text-center">📊 STATUS DO AVATAR</h3>

                <div className="flex items-center gap-4 mb-4 justify-center">
                  <AvatarSVG avatar={avatarAtivo} tamanho={60} />
                  <div>
                    <div className="font-bold text-white">{avatarAtivo.nome}</div>
                    <div className="text-slate-400 text-sm">Nv.{statsAvatarAtual.nivel} • {avatarAtivo.elemento}</div>
                  </div>
                </div>

                {/* Barras de HP, Energia e Exaustão */}
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-red-400 font-bold">❤️ HP</span>
                      <span className="text-slate-300 font-mono">{Math.floor(statsAvatarAtual.hp_atual)} / {statsAvatarAtual.hp_maximo}</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-4 overflow-hidden border border-slate-700">
                      <div
                        className={`h-full transition-all duration-500 ${
                          (statsAvatarAtual.hp_atual / statsAvatarAtual.hp_maximo) > 0.5 ? 'bg-gradient-to-r from-green-600 to-green-400' :
                          (statsAvatarAtual.hp_atual / statsAvatarAtual.hp_maximo) > 0.25 ? 'bg-gradient-to-r from-yellow-600 to-yellow-400' :
                          'bg-gradient-to-r from-red-600 to-red-400'
                        }`}
                        style={{ width: `${(statsAvatarAtual.hp_atual / statsAvatarAtual.hp_maximo) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-blue-400 font-bold">⚡ Energia</span>
                      <span className="text-slate-300 font-mono">{Math.floor(statsAvatarAtual.energia_atual)} / {statsAvatarAtual.energia_maxima}</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-4 overflow-hidden border border-slate-700">
                      <div
                        className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-500"
                        style={{ width: `${(statsAvatarAtual.energia_atual / statsAvatarAtual.energia_maxima) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-orange-400 font-bold">😰 Exaustão</span>
                      <span className="text-slate-300 font-mono">{Math.floor(exaustaoAcumulada)}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-4 overflow-hidden border border-slate-700">
                      <div
                        className={`h-full transition-all duration-500 ${
                          exaustaoAcumulada < 40 ? 'bg-gradient-to-r from-green-600 to-green-400' :
                          exaustaoAcumulada < 60 ? 'bg-gradient-to-r from-yellow-600 to-orange-400' :
                          'bg-gradient-to-r from-orange-600 to-red-600'
                        }`}
                        style={{ width: `${Math.min(exaustaoAcumulada, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Aviso de perigo */}
                {statsAvatarAtual.hp_atual < statsAvatarAtual.hp_maximo * 0.3 && (
                  <div className="mt-4 bg-red-950/50 border border-red-600 rounded p-3 text-center">
                    <p className="text-red-400 text-sm font-bold">⚠️ HP CRÍTICO! Considere coletar e sair!</p>
                  </div>
                )}

                {statsAvatarAtual.energia_atual < 20 && (
                  <div className="mt-4 bg-yellow-950/50 border border-yellow-600 rounded p-3 text-center">
                    <p className="text-yellow-400 text-sm font-bold">⚠️ ENERGIA BAIXA! Próxima onda será difícil!</p>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={desistirSobrevivencia}
                className="px-6 py-4 bg-red-900/50 hover:bg-red-900/70 border-2 border-red-600 text-red-300 font-bold rounded-lg transition-all"
              >
                💰 Coletar e Sair
              </button>
              <button
                onClick={continuarParaProximaOnda}
                className="px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black rounded-lg transition-all shadow-lg shadow-purple-500/30"
              >
                ⚔️ Próxima Onda ({modalOndaCompleta.onda + 1})
              </button>
            </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Level Up */}
      {modalLevelUp && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] overflow-y-auto p-4"
          onClick={() => {
            // Se tem próximo modal (onda completa), mostrar ele
            if (modalLevelUp.proximoModal) {
              setModalOndaCompleta(modalLevelUp.proximoModal);
            }
            setModalLevelUp(null);
          }}
        >
          <div className="min-h-full flex items-center justify-center py-8">
            <div
              className="max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500/50 via-orange-500/50 to-yellow-500/50 rounded-lg blur opacity-75 animate-pulse"></div>
                <div className="relative bg-gradient-to-br from-yellow-900 via-orange-900 to-yellow-900 rounded-2xl border-4 border-yellow-400 p-8 shadow-2xl shadow-yellow-500/50">
            <div className="text-center">
              <div className="text-8xl mb-4 animate-bounce">⭐</div>
              <h2 className="text-6xl font-black text-yellow-300 mb-2 drop-shadow-lg">
                LEVEL UP!
              </h2>
              <div className="text-4xl font-bold text-white mb-6">
                {modalLevelUp.nivelAnterior} → {modalLevelUp.nivelNovo}
              </div>

              <div className="bg-black/40 rounded-lg p-6 mb-6">
                <h3 className="text-yellow-400 font-bold mb-4 text-lg">✨ MELHORIAS</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-green-900/50 border border-green-500 rounded p-2">
                    <div className="text-green-400 font-bold">+20 HP</div>
                    <div className="text-xs text-slate-300">Recuperado</div>
                  </div>
                  <div className="bg-blue-900/50 border border-blue-500 rounded p-2">
                    <div className="text-blue-400 font-bold">+30 Energia</div>
                    <div className="text-xs text-slate-300">Recuperada</div>
                  </div>
                  <div className="bg-red-900/50 border border-red-500 rounded p-2">
                    <div className="text-red-400 font-bold">+1 Força</div>
                  </div>
                  <div className="bg-green-900/50 border border-green-500 rounded p-2">
                    <div className="text-green-400 font-bold">+1 Agilidade</div>
                  </div>
                  <div className="bg-blue-900/50 border border-blue-500 rounded p-2">
                    <div className="text-blue-400 font-bold">+1 Resistência</div>
                  </div>
                  <div className="bg-purple-900/50 border border-purple-500 rounded p-2">
                    <div className="text-purple-400 font-bold">+1 Foco</div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  // Se tem próximo modal (onda completa), mostrar ele
                  if (modalLevelUp.proximoModal) {
                    setModalOndaCompleta(modalLevelUp.proximoModal);
                  }
                  setModalLevelUp(null);
                }}
                className="w-full px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-black rounded-lg transition-all text-lg shadow-lg"
              >
                🎉 CONTINUAR
              </button>
            </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Game Over */}
      {modalGameOver && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 overflow-y-auto p-4"
          onClick={voltarAoLobby}
        >
          <div className="min-h-full flex items-center justify-center py-8">
            <div
              className="max-w-2xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/30 via-pink-500/30 to-red-500/30 rounded-lg blur opacity-75"></div>
                <div className="relative bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl border-2 border-purple-500 p-8">
            <div className="text-center mb-8">
              <div className="text-8xl mb-4">
                {modalGameOver.derrota ? '💀' : '🏆'}
              </div>
              <h2 className="text-5xl font-black text-white mb-4">
                {modalGameOver.derrota ? 'GAME OVER' : 'SOBREVIVÊNCIA FINALIZADA'}
              </h2>
              <div className="text-3xl font-bold text-purple-400 mb-2">
                {modalGameOver.ondaFinal} Ondas Sobrevividas
              </div>
              {modalGameOver.novoRecorde && (
                <div className="text-2xl text-yellow-400 font-black animate-pulse">
                  🎊 NOVO RECORDE PESSOAL! 🎊
                </div>
              )}
            </div>

            <div className="bg-slate-900/50 rounded-lg p-6 border border-purple-500/30 mb-8">
              <h3 className="text-cyan-400 font-bold mb-4 text-center text-xl">🎁 RECOMPENSAS TOTAIS</h3>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-4 bg-slate-800 rounded">
                  <div className="text-3xl font-bold text-blue-400">{modalGameOver.recompensasTotais.xp}</div>
                  <div className="text-xs text-slate-400 mt-1">XP Total</div>
                </div>
                <div className="text-center p-4 bg-slate-800 rounded">
                  <div className="text-3xl font-bold text-yellow-400">{modalGameOver.recompensasTotais.moedas}</div>
                  <div className="text-xs text-slate-400 mt-1">Moedas</div>
                </div>
                <div className="text-center p-4 bg-slate-800 rounded">
                  <div className="text-3xl font-bold text-purple-400">{modalGameOver.recompensasTotais.fragmentos}</div>
                  <div className="text-xs text-slate-400 mt-1">💎 Fragmentos</div>
                </div>
              </div>
            </div>

            <button
              onClick={voltarAoLobby}
              className="w-full px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black rounded-lg transition-all text-lg shadow-lg shadow-purple-500/30"
            >
              ← Voltar ao Lobby
            </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent mb-2">
              💀 MODO SOBREVIVÊNCIA
            </h1>
            <p className="text-slate-400 font-mono text-sm">
              Quantas ondas você consegue sobreviver? Sem recuperação, sem piedade.
            </p>
          </div>

          <button
            onClick={() => router.push("/arena")}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors"
          >
            ← Voltar ao Lobby
          </button>
        </div>

        {/* Recorde Pessoal */}
        {recordePessoal > 0 && (
          <div className="mb-8 bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-2 border-purple-500/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-5xl">🏆</div>
                <div>
                  <div className="text-sm text-purple-400 font-bold uppercase tracking-wider">Seu Recorde</div>
                  <div className="text-4xl font-black text-white">{recordePessoal} Ondas</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-400">Dificuldade</div>
                <div className={`text-xl font-bold ${getNomeDificuldadeOnda(recordePessoal).cor}`}>
                  {getNomeDificuldadeOnda(recordePessoal).nome}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Interface Principal */}
        {estadoJogo === 'lobby' && (
          <div className="space-y-8">
            {/* Explicação do Modo */}
            <div className="bg-gradient-to-br from-purple-900/30 to-slate-900/30 rounded-xl p-8 border-2 border-purple-500/30">
              <h2 className="text-2xl font-black text-purple-400 mb-6 flex items-center gap-3">
                <span className="text-3xl">⚔️</span> COMO FUNCIONA
              </h2>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white mb-3">🎯 Mecânicas</h3>
                  <ul className="space-y-2 text-sm text-slate-300">
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400 mt-1">▸</span>
                      <span><strong>Custo de entrada:</strong> 100 moedas para entrar</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400 mt-1">▸</span>
                      <span><strong>Ondas infinitas:</strong> Inimigos ficam exponencialmente mais fortes</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400 mt-1">▸</span>
                      <span><strong>Sem recuperação:</strong> HP e energia não regeneram entre ondas</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400 mt-1">▸</span>
                      <span><strong>Exaustão devastadora:</strong> Avatar fica quase inutilizável após 10+ ondas</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400 mt-1">▸</span>
                      <span><strong>Boss Waves:</strong> A cada 5 ondas, chefe com recompensas dobradas</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white mb-3">🎁 Recompensas</h3>
                  <ul className="space-y-2 text-sm text-slate-300">
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">▸</span>
                      <span><strong>Crescentes:</strong> Recompensas aumentam a cada onda</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">▸</span>
                      <span><strong>Boss Bonus:</strong> Ondas 5, 10, 15, 20+ dão o dobro de XP e moedas</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">▸</span>
                      <span><strong>Fragmentos:</strong> Chance alta em boss waves, garantido na onda 20+</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">▸</span>
                      <span><strong>Pode desistir:</strong> Colete suas recompensas a qualquer momento</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Tabela de Dificuldade */}
              <div className="bg-slate-950/50 rounded-lg p-4">
                <h3 className="text-sm font-bold text-cyan-400 mb-3 uppercase tracking-wider">📊 Progressão de Dificuldade</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                  {[
                    { ondas: '1-5', nome: 'Iniciante', mult: '1.0-1.75x', cor: 'border-green-500' },
                    { ondas: '6-8', nome: 'Perigoso', mult: '1.75-2.95x', cor: 'border-yellow-500' },
                    { ondas: '9-12', nome: 'Brutal', mult: '2.95-5.35x', cor: 'border-orange-500' },
                    { ondas: '13-15', nome: 'Extremo', mult: '5.35-7.75x', cor: 'border-red-500' },
                    { ondas: '16-20', nome: 'Mortal', mult: '7.75-10.95x', cor: 'border-red-600' },
                    { ondas: '21+', nome: 'IMPOSSÍVEL', mult: '10.95x+', cor: 'border-red-900' }
                  ].map((tier, idx) => (
                    <div key={idx} className={`bg-slate-900/50 border-2 ${tier.cor} rounded p-2 text-center`}>
                      <div className="font-bold text-white mb-1">{tier.ondas}</div>
                      <div className="text-slate-400 mb-1">{tier.nome}</div>
                      <div className="text-[10px] text-slate-500">{tier.mult}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Avatar Ativo */}
            {!avatarAtivo ? (
              <div className="max-w-2xl mx-auto text-center py-20 bg-slate-900/50 rounded-lg border border-slate-800">
                <div className="text-6xl mb-6">⚠️</div>
                <h2 className="text-2xl font-bold text-slate-300 mb-4">
                  Nenhum Avatar Ativo
                </h2>
                <p className="text-slate-400 mb-8">
                  Você precisa ter um avatar ativo para entrar no Modo Sobrevivência. Vá até a tela de Avatares e selecione um avatar.
                </p>
                <button
                  onClick={() => router.push("/avatares")}
                  className="px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded font-bold transition-colors"
                >
                  Ir para Avatares
                </button>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto space-y-6">
                {/* Card do Avatar Ativo */}
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/30 via-pink-500/30 to-purple-500/30 rounded-lg blur opacity-75"></div>
                  <div className="relative bg-gradient-to-br from-slate-900 to-slate-950 rounded-xl border-2 border-purple-500 p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-black text-purple-400 flex items-center gap-3">
                        <span className="text-3xl">👤</span> SEU AVATAR ATIVO
                      </h2>
                      <button
                        onClick={() => router.push("/avatares")}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors text-sm"
                      >
                        Trocar Avatar
                      </button>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-8">
                      {/* Avatar SVG */}
                      <div className="flex-shrink-0">
                        <div className="relative">
                          <AvatarSVG avatar={avatarAtivo} tamanho={180} />
                          <div className={`absolute -top-2 -right-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                            avatarAtivo.raridade === 'Lendário' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' :
                            avatarAtivo.raridade === 'Raro' ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white' :
                            'bg-slate-700 text-slate-300'
                          }`}>
                            {avatarAtivo.raridade}
                          </div>
                        </div>
                      </div>

                      {/* Info do Avatar */}
                      <div className="flex-1 w-full">
                        <div className="text-center md:text-left mb-4">
                          <div className="font-black text-3xl text-white mb-2">{avatarAtivo.nome}</div>
                          <div className="flex items-center justify-center md:justify-start gap-3 text-lg">
                            <span className="text-purple-400 font-bold">Nv.{avatarAtivo.nivel}</span>
                            <span className="text-slate-500">•</span>
                            <span className="text-slate-400">{avatarAtivo.elemento}</span>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="bg-slate-950/50 rounded-lg p-4 mb-4">
                          <div className="grid grid-cols-4 gap-4 text-center">
                            {(() => {
                              const statsBase = {
                                forca: avatarAtivo.forca || 0,
                                agilidade: avatarAtivo.agilidade || 0,
                                resistencia: avatarAtivo.resistencia || 0,
                                foco: avatarAtivo.foco || 0
                              };
                              const statsAtuais = aplicarPenalidadesExaustao(statsBase, avatarAtivo.exaustao || 0);
                              const nivelExaustao = getNivelExaustao(avatarAtivo.exaustao || 0);
                              const temPenalidade = nivelExaustao.penalidades.stats !== undefined;

                              return (
                                <>
                                  <div>
                                    {temPenalidade ? (
                                      <div>
                                        <div className="text-xs text-slate-700 line-through">{statsBase.forca}</div>
                                        <div className="text-red-400 font-bold text-2xl">{statsAtuais.forca}</div>
                                      </div>
                                    ) : (
                                      <div className="text-red-400 font-bold text-2xl">{statsBase.forca}</div>
                                    )}
                                    <div className="text-slate-500 font-semibold mt-1">FOR</div>
                                  </div>
                                  <div>
                                    {temPenalidade ? (
                                      <div>
                                        <div className="text-xs text-slate-700 line-through">{statsBase.agilidade}</div>
                                        <div className="text-green-400 font-bold text-2xl">{statsAtuais.agilidade}</div>
                                      </div>
                                    ) : (
                                      <div className="text-green-400 font-bold text-2xl">{statsBase.agilidade}</div>
                                    )}
                                    <div className="text-slate-500 font-semibold mt-1">AGI</div>
                                  </div>
                                  <div>
                                    {temPenalidade ? (
                                      <div>
                                        <div className="text-xs text-slate-700 line-through">{statsBase.resistencia}</div>
                                        <div className="text-blue-400 font-bold text-2xl">{statsAtuais.resistencia}</div>
                                      </div>
                                    ) : (
                                      <div className="text-blue-400 font-bold text-2xl">{statsBase.resistencia}</div>
                                    )}
                                    <div className="text-slate-500 font-semibold mt-1">RES</div>
                                  </div>
                                  <div>
                                    {temPenalidade ? (
                                      <div>
                                        <div className="text-xs text-slate-700 line-through">{statsBase.foco}</div>
                                        <div className="text-purple-400 font-bold text-2xl">{statsAtuais.foco}</div>
                                      </div>
                                    ) : (
                                      <div className="text-purple-400 font-bold text-2xl">{statsBase.foco}</div>
                                    )}
                                    <div className="text-slate-500 font-semibold mt-1">FOC</div>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Barras de Progresso */}
                        <div className="space-y-3 mb-4">
                          {/* Barra de Level / XP */}
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-cyan-400 font-bold">📊 Nível {avatarAtivo.nivel}</span>
                              <span className="text-slate-400 font-mono">
                                {avatarAtivo.experiencia || 0} / {avatarAtivo.nivel * 100} XP
                              </span>
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-700">
                              <div
                                className="h-full bg-gradient-to-r from-cyan-600 to-blue-400 transition-all duration-500"
                                style={{
                                  width: `${Math.min(((avatarAtivo.experiencia || 0) / (avatarAtivo.nivel * 100)) * 100, 100)}%`
                                }}
                              ></div>
                            </div>
                          </div>

                          {/* Barra de HP */}
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-green-400 font-bold">❤️ HP</span>
                              <span className="text-slate-400 font-mono">
                                {(() => {
                                  const hpMaximo = avatarAtivo.resistencia * 10 + avatarAtivo.nivel * 5;
                                  const hpAtual = avatarAtivo.hp_atual !== null && avatarAtivo.hp_atual !== undefined
                                    ? avatarAtivo.hp_atual
                                    : hpMaximo;
                                  return `${hpAtual} / ${hpMaximo}`;
                                })()}
                              </span>
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-700">
                              <div
                                className={`h-full transition-all duration-500 ${(() => {
                                  const hpMaximo = avatarAtivo.resistencia * 10 + avatarAtivo.nivel * 5;
                                  const hpAtual = avatarAtivo.hp_atual !== null && avatarAtivo.hp_atual !== undefined
                                    ? avatarAtivo.hp_atual
                                    : hpMaximo;
                                  const hpPercent = (hpAtual / hpMaximo) * 100;

                                  if (hpPercent > 70) return 'bg-gradient-to-r from-green-600 to-green-400';
                                  if (hpPercent > 40) return 'bg-gradient-to-r from-yellow-600 to-yellow-400';
                                  if (hpPercent > 20) return 'bg-gradient-to-r from-orange-600 to-orange-400';
                                  return 'bg-gradient-to-r from-red-600 to-red-400';
                                })()}`}
                                style={{
                                  width: `${(() => {
                                    const hpMaximo = avatarAtivo.resistencia * 10 + avatarAtivo.nivel * 5;
                                    const hpAtual = avatarAtivo.hp_atual !== null && avatarAtivo.hp_atual !== undefined
                                      ? avatarAtivo.hp_atual
                                      : hpMaximo;
                                    return Math.min((hpAtual / hpMaximo) * 100, 100);
                                  })()}%`
                                }}
                              ></div>
                            </div>
                          </div>

                          {/* Barra de Exaustão */}
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-orange-400 font-bold">😰 Exaustão</span>
                              <span className="text-slate-400 font-mono">{Math.floor(avatarAtivo.exaustao || 0)}%</span>
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-700">
                              <div
                                className={`h-full transition-all duration-500 ${
                                  (avatarAtivo.exaustao || 0) < 20 ? 'bg-gradient-to-r from-green-600 to-green-400' :
                                  (avatarAtivo.exaustao || 0) < 40 ? 'bg-gradient-to-r from-green-600 to-yellow-400' :
                                  (avatarAtivo.exaustao || 0) < 60 ? 'bg-gradient-to-r from-yellow-600 to-orange-400' :
                                  'bg-gradient-to-r from-orange-600 to-red-600'
                                }`}
                                style={{ width: `${Math.min(avatarAtivo.exaustao || 0, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>

                        {/* Aviso de Exaustão */}
                        {(() => {
                          const aviso = getAvisoExaustao(avatarAtivo.exaustao);
                          return (
                            <div className={`text-sm ${aviso.cor} font-mono text-center font-bold py-3 px-4 rounded bg-slate-900/50`}>
                              {aviso.texto}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Aviso adicional se exaustão >= 40 */}
                {avatarAtivo.exaustao >= 40 && avatarAtivo.exaustao < 60 && (
                  <div className="p-4 bg-orange-950/50 border-2 border-orange-500/50 rounded-lg">
                    <p className="text-sm text-orange-400 font-bold text-center">
                      ⚠️ Seu avatar está cansado! Sobrevivência será mais difícil com penalidades de stats.
                    </p>
                  </div>
                )}

                {/* Botão Iniciar */}
                <button
                  onClick={() => iniciarSobrevivencia()}
                  className="w-full group relative"
                >
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 rounded-xl blur opacity-50 group-hover:opacity-75 transition-all"></div>
                  <div className="relative px-12 py-6 bg-slate-950 rounded-xl border-2 border-purple-500 group-hover:border-purple-400 transition-all">
                    <span className="text-2xl font-black tracking-wider uppercase bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                      💀 INICIAR SOBREVIVÊNCIA
                    </span>
                  </div>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Estado: Preparando */}
        {estadoJogo === 'preparando' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-gradient-to-br from-purple-900/80 to-slate-950/80 backdrop-blur-xl rounded-2xl p-12 border-2 border-purple-500/30">
              <div className="text-center space-y-6">
                <div className="relative">
                  <div className="w-32 h-32 mx-auto">
                    <div className="absolute inset-0 border-4 border-purple-500/20 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-5xl">
                      💀
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-4xl font-black text-white mb-2">
                    PREPARANDO DESAFIO
                  </h2>
                  <p className="text-purple-400 font-mono text-lg">
                    Onda 1 • Iniciante
                  </p>
                </div>

                <div className="bg-slate-950/50 rounded-lg p-6 border border-slate-700">
                  <p className="text-sm text-slate-400 mb-4">Seu Avatar</p>
                  <div className="flex items-center gap-4 justify-center">
                    <AvatarSVG avatar={avatarAtivo} tamanho={100} />
                    <div className="text-left">
                      <div className="font-bold text-white text-xl">{avatarAtivo.nome}</div>
                      <div className="text-slate-400">Nv.{avatarAtivo.nivel} • {avatarAtivo.elemento}</div>
                    </div>
                  </div>
                </div>

                <p className="text-slate-500 text-sm font-mono">
                  Boa sorte, caçador...
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
