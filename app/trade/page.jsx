"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function TradePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('marketplace');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    carregarDados(parsedUser.id);
  }, [router]);

  const carregarDados = async (userId) => {
    setLoading(true);
    try {
      // Stats
      const statsRes = await fetch(`/api/inicializar-jogador`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const statsData = await statsRes.json();
      setStats(statsData.stats);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center">
        <div className="text-cyan-400 font-mono animate-pulse">Carregando marketplace...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-300 bg-clip-text text-transparent mb-2">
              💱 MERCADO DE TRADE
            </h1>
            <p className="text-slate-400 font-mono text-sm">
              💰 {stats?.moedas || 0} Moedas • 💎 {stats?.fragmentos || 0} Fragmentos
            </p>
          </div>

          <button
            onClick={() => router.push("/dashboard")}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all"
          >
            ← Voltar
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setActiveTab('marketplace')}
            className={`px-6 py-3 rounded-lg font-bold transition-all ${
              activeTab === 'marketplace'
                ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white'
                : 'bg-slate-900/50 text-slate-400 hover:bg-slate-800/50'
            }`}
          >
            🛒 Mercado
          </button>
          <button
            onClick={() => setActiveTab('my-listings')}
            className={`px-6 py-3 rounded-lg font-bold transition-all ${
              activeTab === 'my-listings'
                ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white'
                : 'bg-slate-900/50 text-slate-400 hover:bg-slate-800/50'
            }`}
          >
            📋 Meus Anúncios
          </button>
          <button
            onClick={() => setActiveTab('sell')}
            className={`px-6 py-3 rounded-lg font-bold transition-all ${
              activeTab === 'sell'
                ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white'
                : 'bg-slate-900/50 text-slate-400 hover:bg-slate-800/50'
            }`}
          >
            💰 Vender
          </button>
        </div>

        {/* MERCADO */}
        {activeTab === 'marketplace' && (
          <div className="text-center py-20 bg-slate-900/30 rounded-lg border border-slate-800">
            <div className="text-6xl mb-4 opacity-20">🛒</div>
            <h3 className="text-xl font-bold text-slate-400">Aba Mercado</h3>
            <p className="text-slate-500 text-sm">Vazia - aguardando código</p>
          </div>
        )}

        {/* MEUS ANÚNCIOS */}
        {activeTab === 'my-listings' && (
          <div className="text-center py-20 bg-slate-900/30 rounded-lg border border-slate-800">
            <div className="text-6xl mb-4 opacity-20">📋</div>
            <h3 className="text-xl font-bold text-slate-400">Aba Meus Anúncios</h3>
            <p className="text-slate-500 text-sm">Vazia - aguardando código</p>
          </div>
        )}

        {/* VENDER */}
        {activeTab === 'sell' && (
          <div className="text-center py-20 bg-slate-900/30 rounded-lg border border-slate-800">
            <div className="text-6xl mb-4 opacity-20">💰</div>
            <h3 className="text-xl font-bold text-slate-400">Aba Vender</h3>
            <p className="text-slate-500 text-sm">Vazia - aguardando código</p>
          </div>
        )}
      </div>
    </div>
  );
}
