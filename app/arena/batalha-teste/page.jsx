"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function BatalhaTesteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modo = searchParams.get('modo');

  const [user, setUser] = useState(null);
  const [dadosPartida, setDadosPartida] = useState(null);
  const [logs, setLogs] = useState([]);
  const [estadoBatalha, setEstadoBatalha] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estados dos jogadores
  const [meuHP, setMeuHP] = useState(100);
  const [oponenteHP, setOponenteHP] = useState(100);
  const [meuTurno, setMeuTurno] = useState(false);
  const [batalhaConcluida, setBatalhaConcluida] = useState(false);

  const addLog = (mensagem) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] ${mensagem}`);
    setLogs(prev => [...prev, `[${timestamp}] ${mensagem}`]);
  };

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      addLog("❌ Sem usuário logado, redirecionando...");
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    addLog(`✅ Usuário carregado: ${parsedUser.id}`);

    // Buscar dados da partida
    const dadosBatalha = sessionStorage.getItem('batalha_pvp_dados');
    if (!dadosBatalha) {
      addLog("❌ Sem dados da partida, redirecionando...");
      router.push("/arena/pvp");
      return;
    }

    const dados = JSON.parse(dadosBatalha);
    setDadosPartida(dados);
    addLog(`✅ Dados da partida carregados`);
    addLog(`📊 Match ID: ${dados.matchId}`);
    addLog(`👤 Seu avatar: ${dados.avatarJogador.nome}`);
    addLog(`🎯 Oponente: ${dados.nomeOponente}`);

    setLoading(false);

    // Marcar como pronto automaticamente
    marcarComoPronte(dados.matchId, parsedUser.id);
  }, [router]);

  const marcarComoPronte = async (matchId, userId) => {
    try {
      addLog("🔄 Marcando como pronto...");
      const response = await fetch('/api/pvp/battle/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: matchId,
          userId: userId,
          action: 'ready'
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        addLog("✅ Marcado como pronto!");
        if (data.battleStarted) {
          addLog("🎮 Batalha iniciada! Ambos jogadores prontos.");
        }
      } else {
        addLog(`⚠️ Erro ao marcar como pronto: ${data.error || 'desconhecido'}`);
      }
    } catch (error) {
      addLog(`❌ Erro ao marcar como pronto: ${error.message}`);
    }
  };

  // Polling para sincronizar estado da batalha
  useEffect(() => {
    if (!dadosPartida || !user) return;

    const verificarEstado = async () => {
      try {
        const response = await fetch(`/api/pvp/battle/room?matchId=${dadosPartida.matchId}&userId=${user.id}`);
        const data = await response.json();

        if (response.ok && data.success) {
          setEstadoBatalha(data);

          // Verificar se é meu turno
          const seuPlayer = data.playerNumber;
          const turnoAtual = data.room.currentPlayer;
          setMeuTurno(seuPlayer === turnoAtual);

          // Atualizar HP (mock - pegar do battleData)
          if (data.room.battleData?.hp) {
            setMeuHP(data.room.battleData.hp[`player${seuPlayer}`] || 100);
            setOponenteHP(data.room.battleData.hp[`player${seuPlayer === 1 ? 2 : 1}`] || 100);
          }

          // Verificar se batalha terminou
          if (data.room.status === 'finished' || data.room.status === 'cancelled') {
            setBatalhaConcluida(true);
            addLog(`🏁 Batalha concluída! Status: ${data.room.status}`);
            if (data.room.winnerUserId) {
              const venci = data.room.winnerUserId === user.id;
              addLog(venci ? `🎉 VOCÊ VENCEU!` : `😢 Você perdeu`);
            }
          }
        } else {
          addLog(`⚠️ Erro ao buscar estado: ${data.error || 'desconhecido'}`);
        }
      } catch (error) {
        addLog(`❌ Erro no polling: ${error.message}`);
      }
    };

    // Verificar imediatamente
    verificarEstado();

    // Polling a cada 1 segundo
    const interval = setInterval(verificarEstado, 1000);
    return () => clearInterval(interval);
  }, [dadosPartida, user]);

  const atacar = async () => {
    if (!meuTurno || batalhaConcluida) {
      addLog("⚠️ Não é seu turno ou batalha já terminou!");
      return;
    }

    addLog("⚔️ Atacando oponente...");

    try {
      const response = await fetch('/api/pvp/battle/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: dadosPartida.matchId,
          userId: user.id,
          action: {
            type: 'attack',
            damage: 10,
            timestamp: new Date().toISOString()
          }
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        addLog("✅ Ataque enviado com sucesso!");
        addLog(`📊 Dano: 10 HP`);
      } else {
        addLog(`❌ Erro ao atacar: ${data.error}`);
      }
    } catch (error) {
      addLog(`❌ Erro na requisição: ${error.message}`);
    }
  };

  const voltar = () => {
    addLog("🏠 Voltando ao lobby...");
    router.push("/arena/pvp");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-2xl">Carregando batalha teste...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-black text-cyan-400 mb-4">
          ⚔️ BATALHA TESTE (DEBUG)
        </h1>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Painel de Informações */}
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">📊 Status da Conexão</h2>

            {estadoBatalha ? (
              <div className="space-y-2 text-sm font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Match ID:</span>
                  <span className="text-cyan-400">{dadosPartida.matchId.slice(0, 8)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span className={
                    estadoBatalha.room.status === 'active' ? 'text-green-400' :
                    estadoBatalha.room.status === 'waiting' ? 'text-yellow-400' :
                    'text-red-400'
                  }>
                    {estadoBatalha.room.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Você é:</span>
                  <span className="text-purple-400">Player {estadoBatalha.playerNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Turno atual:</span>
                  <span className="text-orange-400">Player {estadoBatalha.room.currentPlayer}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Seu turno?</span>
                  <span className={meuTurno ? 'text-green-400' : 'text-red-400'}>
                    {meuTurno ? 'SIM' : 'NÃO'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Player 1 Ready:</span>
                  <span className={estadoBatalha.player1.ready ? 'text-green-400' : 'text-red-400'}>
                    {estadoBatalha.player1.ready ? 'SIM' : 'NÃO'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Player 2 Ready:</span>
                  <span className={estadoBatalha.player2.ready ? 'text-green-400' : 'text-red-400'}>
                    {estadoBatalha.player2.ready ? 'SIM' : 'NÃO'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-yellow-400 animate-pulse">
                Conectando ao servidor...
              </div>
            )}
          </div>

          {/* Painel de Jogadores */}
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">👥 Jogadores</h2>

            {/* Você */}
            <div className="mb-4 p-4 bg-blue-950/30 border border-blue-500 rounded">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-blue-400">Você</span>
                <span className="text-sm text-slate-400">{dadosPartida?.avatarJogador.nome}</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-4">
                <div
                  className="bg-green-500 h-4 rounded-full transition-all"
                  style={{ width: `${meuHP}%` }}
                >
                  <div className="text-center text-xs font-bold text-white">{meuHP} HP</div>
                </div>
              </div>
            </div>

            {/* Oponente */}
            <div className="p-4 bg-red-950/30 border border-red-500 rounded">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-red-400">Oponente</span>
                <span className="text-sm text-slate-400">{dadosPartida?.nomeOponente}</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-4">
                <div
                  className="bg-red-500 h-4 rounded-full transition-all"
                  style={{ width: `${oponenteHP}%` }}
                >
                  <div className="text-center text-xs font-bold text-white">{oponenteHP} HP</div>
                </div>
              </div>
            </div>

            {/* Controles */}
            <div className="mt-6 space-y-3">
              <button
                onClick={atacar}
                disabled={!meuTurno || batalhaConcluida}
                className={`w-full py-3 rounded font-bold transition-all ${
                  meuTurno && !batalhaConcluida
                    ? 'bg-red-600 hover:bg-red-500 text-white'
                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                }`}
              >
                {batalhaConcluida ? '🏁 Batalha Terminada' :
                 meuTurno ? '⚔️ ATACAR (-10 HP)' : '⏳ Aguardando turno...'}
              </button>

              <button
                onClick={voltar}
                className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded font-bold transition-all"
              >
                ← Voltar ao Lobby
              </button>
            </div>
          </div>
        </div>

        {/* Painel de Logs */}
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-green-400">📝 Logs de Debug</h2>
            <button
              onClick={() => setLogs([])}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm"
            >
              🗑️ Limpar
            </button>
          </div>

          <div className="bg-black rounded p-4 h-96 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <div className="text-slate-600">Nenhum log ainda...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="text-green-400 mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Debug Info */}
        <details className="mt-6 bg-slate-900 border border-slate-700 rounded-lg p-4">
          <summary className="cursor-pointer text-slate-400 hover:text-white font-mono">
            🔍 Ver dados brutos da batalha (JSON)
          </summary>
          <pre className="mt-4 bg-black rounded p-4 overflow-x-auto text-xs text-cyan-400">
            {JSON.stringify(estadoBatalha, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
}

export default function BatalhaTestePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-2xl animate-pulse">Carregando batalha teste...</div>
      </div>
    }>
      <BatalhaTesteContent />
    </Suspense>
  );
}
