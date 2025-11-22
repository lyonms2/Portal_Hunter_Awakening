"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  calcularPoderTotal,
  calcularHPMaximoCompleto,
  aplicarPenalidadesExaustao,
  getNivelExaustao
} from "@/lib/gameLogic";
import AvatarSVG from "../../components/AvatarSVG";

export default function PvPPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [avatarAtivo, setAvatarAtivo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalAlerta, setModalAlerta] = useState(null);

  // Estados de matchmaking
  const [buscandoPartida, setBuscandoPartida] = useState(false);
  const [tempoEspera, setTempoEspera] = useState(0);
  const [partidaEncontrada, setPartidaEncontrada] = useState(null);
  const intervalRef = useRef(null);
  const pollingRef = useRef(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    carregarAvatarAtivo(parsedUser.id);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
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

  const iniciarMatchmaking = async () => {
    if (!avatarAtivo) return;

    if (!avatarAtivo.vivo) {
      setModalAlerta({
        titulo: '💀 Avatar Morto',
        mensagem: 'Seu avatar está morto! Visite o Necromante para ressuscitá-lo.'
      });
      return;
    }

    if (avatarAtivo.exaustao >= 60) {
      setModalAlerta({
        titulo: '😰 Avatar Muito Exausto',
        mensagem: 'Seu avatar está muito exausto! Deixe-o descansar antes de batalhar.'
      });
      return;
    }

    setBuscandoPartida(true);
    setTempoEspera(0);

    // Timer de espera
    intervalRef.current = setInterval(() => {
      setTempoEspera(prev => prev + 1);
    }, 1000);

    try {
      // Entrar na fila de matchmaking
      const poderTotal = calcularPoderTotal(avatarAtivo);
      const statsComPenalidades = aplicarPenalidadesExaustao({
        forca: avatarAtivo.forca,
        agilidade: avatarAtivo.agilidade,
        resistencia: avatarAtivo.resistencia,
        foco: avatarAtivo.foco
      }, avatarAtivo.exaustao || 0);

      const response = await fetch('/api/pvp/matchmaking/entrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          avatarId: avatarAtivo.id,
          avatar: {
            ...avatarAtivo,
            ...statsComPenalidades,
            habilidades: avatarAtivo.habilidades || []
          },
          poderTotal,
          nomeJogador: user.nome || user.email?.split('@')[0] || 'Caçador'
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao entrar na fila');
      }

      const data = await response.json();

      // Iniciar polling para verificar match
      pollingRef.current = setInterval(async () => {
        try {
          const checkResponse = await fetch(`/api/pvp/matchmaking/verificar?userId=${user.id}`);
          const checkData = await checkResponse.json();

          if (checkData.matched) {
            // Partida encontrada!
            clearInterval(intervalRef.current);
            clearInterval(pollingRef.current);

            setPartidaEncontrada(checkData);

            // Preparar dados da batalha
            const dadosPartida = {
              tipo: 'pvp',
              pvpAoVivo: true,
              matchId: checkData.matchId,
              avatarJogador: {
                ...avatarAtivo,
                ...statsComPenalidades,
                habilidades: avatarAtivo.habilidades || []
              },
              avatarOponente: checkData.oponente.avatar,
              nomeOponente: checkData.oponente.nome,
              morteReal: true
            };

            sessionStorage.setItem('batalha_pvp_dados', JSON.stringify(dadosPartida));

            // Redirecionar após 3 segundos
            setTimeout(() => {
              router.push('/arena/batalha?modo=pvp');
            }, 3000);
          }
        } catch (error) {
          console.error('Erro ao verificar match:', error);
        }
      }, 2000);

    } catch (error) {
      console.error('Erro no matchmaking:', error);
      cancelarMatchmaking();
      setModalAlerta({
        titulo: '❌ Erro',
        mensagem: 'Erro ao buscar partida. Tente novamente.'
      });
    }
  };

  const cancelarMatchmaking = async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (pollingRef.current) clearInterval(pollingRef.current);

    setBuscandoPartida(false);
    setTempoEspera(0);

    // Sair da fila
    try {
      await fetch('/api/pvp/matchmaking/sair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id })
      });
    } catch (error) {
      console.error('Erro ao sair da fila:', error);
    }
  };

  const formatarTempo = (segundos) => {
    const min = Math.floor(segundos / 60);
    const sec = segundos % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const getElementoColor = (elemento) => {
    const cores = {
      'Fogo': 'text-red-400',
      'Água': 'text-blue-400',
      'Terra': 'text-amber-600',
      'Vento': 'text-cyan-300',
      'Luz': 'text-yellow-300',
      'Sombra': 'text-purple-400',
      'Eletricidade': 'text-yellow-400'
    };
    return cores[elemento] || 'text-gray-400';
  };

  const getRaridadeColor = (raridade) => {
    const cores = {
      'Comum': 'text-gray-400',
      'Incomum': 'text-green-400',
      'Raro': 'text-blue-400',
      'Épico': 'text-purple-400',
      'Lendário': 'text-orange-400',
      'Mítico': 'text-red-400'
    };
    return cores[raridade] || 'text-gray-400';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center">
        <div className="text-cyan-400 font-mono animate-pulse text-xl">
          Carregando Arena PvP...
        </div>
      </div>
    );
  }

  if (!avatarAtivo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <button
              onClick={() => router.push('/arena')}
              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-2 mb-4"
            >
              ← Voltar para Arena
            </button>

            <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 mb-2">
              ⚔️ ARENA PVP
            </h1>
            <p className="text-gray-400 text-lg">
              Batalhe contra outros caçadores em tempo real
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-xl blur opacity-75"></div>
              <div className="relative bg-slate-950/90 backdrop-blur-xl border border-red-900/50 rounded-xl p-12 text-center">
                <div className="text-8xl mb-6">⚔️</div>
                <h2 className="text-3xl font-bold text-red-400 mb-4">
                  Nenhum Avatar Ativo
                </h2>
                <p className="text-slate-300 mb-8 text-lg">
                  Você precisa ter um avatar ativo para entrar na Arena PvP!
                </p>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => router.push("/avatares")}
                    className="px-8 py-4 bg-cyan-600 hover:bg-cyan-500 rounded font-bold"
                  >
                    Ir para Avatares
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const poderTotal = calcularPoderTotal(avatarAtivo);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
            <button
              onClick={() => router.push('/arena')}
              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-2"
            >
              ← Voltar para Arena
            </button>

            <div className="flex gap-3">
              <button
                onClick={() => router.push('/arena/pvp-ia/leaderboard')}
                className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-sm"
              >
                🏆 Ranking
              </button>
            </div>
          </div>

          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 mb-2">
            ⚔️ ARENA PVP
          </h1>
          <p className="text-gray-400 text-lg">
            Batalhe contra outros caçadores em tempo real
          </p>
        </div>

        {/* Seu Avatar */}
        <div className="bg-slate-900 border border-cyan-500 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-cyan-400">Seu Avatar</h2>
            <button
              onClick={() => router.push('/avatares')}
              className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded font-bold text-sm"
            >
              🔄 Trocar
            </button>
          </div>

          <div className="flex items-center gap-6">
            <div className="p-4 bg-gradient-to-b from-cyan-900/20 to-transparent rounded-lg">
              <AvatarSVG avatar={avatarAtivo} tamanho={120} />
            </div>

            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-1">{avatarAtivo.nome}</h3>
              <div className="flex gap-3 text-sm mb-3 flex-wrap">
                <span className={`font-semibold ${getElementoColor(avatarAtivo.elemento)}`}>
                  {avatarAtivo.elemento}
                </span>
                <span className={getRaridadeColor(avatarAtivo.raridade)}>
                  {avatarAtivo.raridade}
                </span>
                <span className="text-yellow-400">Nv. {avatarAtivo.nivel}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>⚔️ Poder: <span className="text-cyan-400 font-bold">{poderTotal}</span></div>
                <div>❤️ HP: <span className="text-green-400 font-bold">{calcularHPMaximoCompleto(avatarAtivo)}</span></div>
              </div>

              {avatarAtivo.exaustao >= 40 && (
                <div className="mt-3 text-orange-400 text-sm">
                  ⚠️ Exaustão: {avatarAtivo.exaustao}%
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Matchmaking */}
        <div className="bg-slate-900 border border-orange-500 rounded-lg p-8 text-center">
          {partidaEncontrada ? (
            // Partida encontrada
            <div className="animate-pulse">
              <div className="text-6xl mb-4">⚔️</div>
              <h2 className="text-3xl font-bold text-green-400 mb-2">
                PARTIDA ENCONTRADA!
              </h2>
              <p className="text-gray-300 mb-4">
                Oponente: <span className="text-orange-400 font-bold">{partidaEncontrada.oponente.nome}</span>
              </p>
              <p className="text-cyan-400">Entrando na batalha...</p>
            </div>
          ) : buscandoPartida ? (
            // Buscando partida
            <div>
              <div className="text-6xl mb-4 animate-spin">⏳</div>
              <h2 className="text-2xl font-bold text-yellow-400 mb-2">
                Buscando Oponente...
              </h2>
              <p className="text-gray-400 mb-4">
                Tempo de espera: <span className="text-white font-mono">{formatarTempo(tempoEspera)}</span>
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Procurando jogadores com poder similar ({poderTotal} ± 30%)
              </p>
              <button
                onClick={cancelarMatchmaking}
                className="bg-red-600 hover:bg-red-500 text-white px-8 py-3 rounded-lg font-bold"
              >
                Cancelar
              </button>
            </div>
          ) : (
            // Pronto para buscar
            <div>
              <div className="text-6xl mb-4">🎮</div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Pronto para Batalhar?
              </h2>
              <p className="text-gray-400 mb-6">
                Entre na fila e enfrente outros caçadores em batalhas em tempo real!
              </p>

              <button
                onClick={iniciarMatchmaking}
                disabled={avatarAtivo.exaustao >= 60}
                className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 disabled:from-gray-600 disabled:to-gray-600 text-white px-12 py-4 rounded-lg font-bold text-xl transition-all transform hover:scale-105 disabled:hover:scale-100"
              >
                ⚔️ BUSCAR PARTIDA
              </button>

              {avatarAtivo.exaustao >= 60 && (
                <p className="text-red-400 text-sm mt-4">
                  Avatar muito exausto para batalhar
                </p>
              )}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="mt-8 bg-slate-900/50 border border-slate-700 rounded-lg p-6">
          <h3 className="text-lg font-bold text-cyan-400 mb-3">Como funciona</h3>
          <ul className="text-gray-400 text-sm space-y-2">
            <li>• Você será pareado com jogadores de poder similar</li>
            <li>• As batalhas são em tempo real - ambos jogadores online</li>
            <li>• Sistema de combate 1d20 + Foco para acertos</li>
            <li>• Vitórias concedem XP, moedas e pontos de ranking</li>
            <li>• Derrotas causam perda de HP e exaustão</li>
          </ul>
        </div>
      </div>

      {/* Modal de Alerta */}
      {modalAlerta && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-red-500 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-red-400 mb-3">{modalAlerta.titulo}</h3>
            <p className="text-gray-300 mb-6">{modalAlerta.mensagem}</p>
            <button
              onClick={() => setModalAlerta(null)}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 rounded"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
