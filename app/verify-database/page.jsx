"use client";

import { useEffect, useState } from "react";

export default function VerifyDatabasePage() {
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    verificarBanco();
  }, []);

  const verificarBanco = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/verify-database');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao verificar banco de dados');
      }

      setResultado(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin">🔍</div>
          <div className="text-cyan-400 font-mono text-xl">Verificando banco de dados...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-900/30 border-2 border-red-500 rounded-lg p-6">
            <h1 className="text-3xl font-black text-red-400 mb-4">❌ Erro</h1>
            <p className="text-white">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const statusColor = resultado.status === 'OK' ? 'green' :
                       resultado.status === 'INCOMPLETO' ? 'yellow' : 'red';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2">
            🔍 Verificação do Banco de Dados PVP
          </h1>
          <p className="text-slate-400 font-mono text-sm">
            {resultado.timestamp}
          </p>
        </div>

        {/* Status Geral */}
        <div className={`bg-${statusColor}-900/30 border-2 border-${statusColor}-500 rounded-lg p-6 mb-8`}>
          <h2 className={`text-2xl font-black text-${statusColor}-400 mb-2`}>
            {resultado.mensagem}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="bg-slate-900/50 rounded p-3 text-center">
              <div className="text-2xl font-bold text-green-400">{resultado.resumo.tabelasOk}</div>
              <div className="text-xs text-slate-400">Tabelas OK</div>
            </div>
            <div className="bg-slate-900/50 rounded p-3 text-center">
              <div className="text-2xl font-bold text-red-400">{resultado.resumo.tabelasFaltando}</div>
              <div className="text-xs text-slate-400">Tabelas Faltando</div>
            </div>
            <div className="bg-slate-900/50 rounded p-3 text-center">
              <div className="text-2xl font-bold text-green-400">{resultado.resumo.funcoesOk}</div>
              <div className="text-xs text-slate-400">Funções OK</div>
            </div>
            <div className="bg-slate-900/50 rounded p-3 text-center">
              <div className="text-2xl font-bold text-red-400">{resultado.resumo.funcoesFaltando}</div>
              <div className="text-xs text-slate-400">Funções Faltando</div>
            </div>
          </div>
        </div>

        {/* Tabelas */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">📋 Tabelas</h2>
          <div className="grid gap-4">
            {Object.entries(resultado.tabelas).map(([nome, info]) => (
              <div
                key={nome}
                className={`bg-slate-900/50 border rounded-lg p-4 ${
                  info.existe ? 'border-green-500/30' : 'border-red-500/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{info.existe ? '✅' : '❌'}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white">{nome}</span>
                        {info.novo && (
                          <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">NOVO</span>
                        )}
                      </div>
                      <div className="text-sm text-slate-400">
                        {info.existe
                          ? `${info.registros || 0} registros`
                          : info.mensagem || info.erro || 'Não existe'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Funções */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">⚙️ Funções RPC</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {Object.entries(resultado.funcoes).map(([nome, info]) => (
              <div
                key={nome}
                className={`bg-slate-900/50 border rounded-lg p-4 ${
                  info.existe ? 'border-green-500/30' : 'border-red-500/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{info.existe ? '✅' : '❌'}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-white">{nome}()</span>
                      {info.novo && (
                        <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">NOVO</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400">
                      {info.mensagem || info.erro || 'Não existe'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dados de Exemplo */}
        {resultado.dadosExemplo && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">📊 Dados Atuais</h2>
            <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-6">
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-sm text-slate-400">Desafios Ativos</div>
                  <div className="text-3xl font-bold text-orange-400">
                    {resultado.dadosExemplo.desafios_ativos || 0}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-400">Jogadores Online</div>
                  <div className="text-3xl font-bold text-cyan-400">
                    {resultado.dadosExemplo.jogadores_online || 0}
                  </div>
                </div>
              </div>

              {resultado.dadosExemplo.jogadores && resultado.dadosExemplo.jogadores.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-lg font-bold text-white mb-2">Jogadores Online:</h3>
                  <div className="space-y-2">
                    {resultado.dadosExemplo.jogadores.map((player, i) => (
                      <div key={i} className="bg-slate-800/50 rounded p-2 text-sm font-mono text-slate-300">
                        Nível {player.nivel} • Poder: {player.poder_total} • Fama: {player.fama}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Instruções */}
        {resultado.status !== 'OK' && (
          <div className="bg-orange-900/30 border-2 border-orange-500 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-orange-400 mb-4">📝 Próximos Passos</h2>
            <ol className="list-decimal list-inside space-y-2 text-white">
              <li>Abra o <strong>Supabase Dashboard</strong></li>
              <li>Vá em <strong>"SQL Editor"</strong></li>
              <li>Clique em <strong>"New Query"</strong></li>
              <li>Cole o conteúdo de: <code className="bg-slate-800 px-2 py-1 rounded">database/pvp_challenges.sql</code></li>
              <li>Clique em <strong>"Run"</strong> ou pressione Ctrl+Enter</li>
              <li>Recarregue esta página para verificar novamente</li>
            </ol>
          </div>
        )}

        {resultado.status === 'OK' && (
          <div className="bg-green-900/30 border-2 border-green-500 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-green-400 mb-4">🎉 Tudo Pronto!</h2>
            <p className="text-white mb-4">
              Seu banco de dados está configurado corretamente. Você pode:
            </p>
            <ul className="list-disc list-inside space-y-2 text-white">
              <li>Acessar <a href="/arena/pvp" className="text-cyan-400 hover:underline">/arena/pvp</a> para testar</li>
              <li>Abrir duas abas com usuários diferentes</li>
              <li>Testar enviar e aceitar desafios!</li>
            </ul>
          </div>
        )}

        {/* Botão de Recarregar */}
        <div className="mt-8 text-center">
          <button
            onClick={verificarBanco}
            className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded transition-colors"
          >
            🔄 Verificar Novamente
          </button>
        </div>

        {/* JSON Raw */}
        <details className="mt-8">
          <summary className="cursor-pointer text-slate-400 hover:text-white">
            📄 Ver JSON completo
          </summary>
          <pre className="mt-4 bg-slate-900 border border-slate-700 rounded p-4 text-xs text-slate-300 overflow-x-auto">
            {JSON.stringify(resultado, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
}
