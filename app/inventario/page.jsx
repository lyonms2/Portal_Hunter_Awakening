"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BackgroundEffects from "@/components/BackgroundEffects";

export default function InventarioPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [avatarAtivo, setAvatarAtivo] = useState(null);
  const [inventario, setInventario] = useState([]);
  const [itensLoja, setItensLoja] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingLoja, setLoadingLoja] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState('inventario'); // 'inventario' ou 'loja'

  // Estados para usar item
  const [usandoItem, setUsandoItem] = useState(false);
  const [itemParaUsar, setItemParaUsar] = useState(null);

  // Estados para comprar item
  const [comprandoItem, setComprandoItem] = useState(false);
  const [itemParaComprar, setItemParaComprar] = useState(null);
  const [quantidadeCompra, setQuantidadeCompra] = useState(1);

  // Estados para feedback
  const [mensagemFeedback, setMensagemFeedback] = useState(null);

  useEffect(() => {
    const initializePage = async () => {
      const userData = localStorage.getItem("user");
      if (!userData) {
        router.push("/login");
        return;
      }

      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);

      try {
        // Buscar stats do jogador
        const statsResponse = await fetch("/api/inicializar-jogador", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: parsedUser.id }),
        });
        const statsData = await statsResponse.json();
        setStats(statsData.stats);

        // Buscar avatar ativo
        const avatarResponse = await fetch(`/api/meus-avatares?userId=${parsedUser.id}`);
        const avatarData = await avatarResponse.json();

        if (avatarResponse.ok) {
          const ativo = avatarData.avatares?.find(av => av.ativo && av.vivo);
          setAvatarAtivo(ativo || null);
        }

        // Buscar inventário
        await carregarInventario(parsedUser.id);

        // Buscar itens da loja
        await carregarItensLoja();

      } catch (error) {
        console.error("Erro ao inicializar página:", error);
      } finally {
        setLoading(false);
      }
    };

    initializePage();
  }, [router]);

  const carregarInventario = async (userId) => {
    try {
      const response = await fetch(`/api/inventario?userId=${userId}`);
      const data = await response.json();

      if (response.ok) {
        setInventario(data.inventario || []);
      } else {
        console.error("Erro ao carregar inventário:", data.message);
      }
    } catch (error) {
      console.error("Erro ao carregar inventário:", error);
    }
  };

  const carregarItensLoja = async () => {
    setLoadingLoja(true);
    try {
      const response = await fetch('/api/inventario/loja');
      const data = await response.json();

      if (response.ok) {
        setItensLoja(data.itens || []);
      } else {
        console.error("Erro ao carregar itens da loja:", data.message);
        mostrarFeedback("Erro ao carregar loja. Tente novamente.", 'erro');
      }
    } catch (error) {
      console.error("Erro ao carregar loja:", error);
      mostrarFeedback("Erro ao conectar com a loja.", 'erro');
    } finally {
      setLoadingLoja(false);
    }
  };

  const mostrarFeedback = (mensagem, tipo = 'sucesso') => {
    setMensagemFeedback({ texto: mensagem, tipo });
    setTimeout(() => setMensagemFeedback(null), 3000);
  };

  const usarItem = async (inventoryItem) => {
    if (!avatarAtivo) {
      mostrarFeedback("Você precisa ter um avatar ativo para usar itens!", 'erro');
      return;
    }

    setUsandoItem(true);

    try {
      const response = await fetch("/api/inventario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          itemId: inventoryItem.items.id,
          inventoryItemId: inventoryItem.id
        }),
      });

      const data = await response.json();

      if (response.ok) {
        mostrarFeedback(data.mensagem, 'sucesso');

        // Atualizar inventário
        await carregarInventario(user.id);

        // Atualizar avatar ativo
        const avatarResponse = await fetch(`/api/meus-avatares?userId=${user.id}`);
        const avatarData = await avatarResponse.json();

        if (avatarResponse.ok) {
          const ativo = avatarData.avatares?.find(av => av.ativo && av.vivo);
          setAvatarAtivo(ativo || null);
        }
      } else {
        mostrarFeedback(data.message, 'erro');
      }
    } catch (error) {
      console.error("Erro ao usar item:", error);
      mostrarFeedback("Erro ao usar item. Tente novamente.", 'erro');
    } finally {
      setUsandoItem(false);
      setItemParaUsar(null);
    }
  };

  const comprarItem = async () => {
    if (!itemParaComprar) return;

    setComprandoItem(true);

    try {
      const response = await fetch("/api/inventario/comprar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          itemId: itemParaComprar.id,
          quantidade: quantidadeCompra
        }),
      });

      const data = await response.json();

      if (response.ok) {
        mostrarFeedback(data.mensagem, 'sucesso');

        // Atualizar stats (moedas)
        setStats(prev => ({
          ...prev,
          moedas: data.moedas_restantes
        }));

        // Atualizar inventário
        await carregarInventario(user.id);

        // Fechar modal
        setItemParaComprar(null);
        setQuantidadeCompra(1);
      } else {
        if (data.moedas_necessarias) {
          mostrarFeedback(
            `Moedas insuficientes! Faltam ${data.diferenca} moedas.`,
            'erro'
          );
        } else {
          mostrarFeedback(data.message, 'erro');
        }
      }
    } catch (error) {
      console.error("Erro ao comprar item:", error);
      mostrarFeedback("Erro ao comprar item. Tente novamente.", 'erro');
    } finally {
      setComprandoItem(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center">
        <div className="text-cyan-400 font-mono animate-pulse">Carregando inventário...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-gray-100 relative overflow-hidden">
      <BackgroundEffects />

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-300 bg-clip-text text-transparent mb-2">
              📦 INVENTÁRIO DO CAÇADOR
            </h1>
            <p className="text-slate-400 font-mono text-sm">Gerencie seus itens e equipamentos</p>
          </div>

          {/* Recursos do jogador */}
          <div className="flex gap-3">
            <div className="bg-slate-950/80 backdrop-blur-xl border border-amber-500/30 rounded-lg px-4 py-2">
              <div className="text-xs text-slate-500 uppercase font-mono">Moedas</div>
              <div className="text-xl font-bold text-amber-400">💰 {stats?.moedas || 0}</div>
            </div>
            <div className="bg-slate-950/80 backdrop-blur-xl border border-purple-500/30 rounded-lg px-4 py-2">
              <div className="text-xs text-slate-500 uppercase font-mono">Fragmentos</div>
              <div className="text-xl font-bold text-purple-400">💎 {stats?.fragmentos || 0}</div>
            </div>
          </div>
        </div>

        {/* Avatar Ativo Info */}
        {avatarAtivo && (
          <div className="mb-6 relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500/20 to-cyan-500/20 rounded-lg blur"></div>
            <div className="relative bg-slate-950/80 backdrop-blur-xl border border-green-500/30 rounded-lg p-4">
              <div className="flex items-center gap-4">
                <div className="text-3xl">⚔️</div>
                <div className="flex-1">
                  <div className="text-xs text-slate-500 uppercase font-mono mb-1">Avatar Ativo</div>
                  <div className="text-lg font-bold text-green-400">{avatarAtivo.nome}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500 uppercase font-mono mb-1">HP</div>
                  <div className="text-lg font-bold text-green-400">
                    {avatarAtivo.hp_atual !== null && avatarAtivo.hp_atual !== undefined
                      ? avatarAtivo.hp_atual
                      : avatarAtivo.resistencia * 10 + avatarAtivo.nivel * 5
                    } / {avatarAtivo.resistencia * 10 + avatarAtivo.nivel * 5}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Abas */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setAbaAtiva('inventario')}
            className={`flex-1 py-3 px-6 rounded-lg font-bold transition-all ${
              abaAtiva === 'inventario'
                ? 'bg-cyan-500/20 border-2 border-cyan-500/50 text-cyan-400'
                : 'bg-slate-900/50 border-2 border-slate-700/30 text-slate-400 hover:border-slate-600/50'
            }`}
          >
            📦 MEU INVENTÁRIO ({inventario.length})
          </button>
          <button
            onClick={() => setAbaAtiva('loja')}
            className={`flex-1 py-3 px-6 rounded-lg font-bold transition-all ${
              abaAtiva === 'loja'
                ? 'bg-amber-500/20 border-2 border-amber-500/50 text-amber-400'
                : 'bg-slate-900/50 border-2 border-slate-700/30 text-slate-400 hover:border-slate-600/50'
            }`}
          >
            🏪 LOJA DE ITENS
          </button>
        </div>

        {/* Conteúdo baseado na aba ativa */}
        {abaAtiva === 'inventario' ? (
          <div>
            {inventario.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">📦</div>
                <div className="text-xl text-slate-400 font-bold mb-2">Inventário Vazio</div>
                <p className="text-slate-500 mb-6">Você ainda não possui nenhum item.</p>
                <button
                  onClick={() => setAbaAtiva('loja')}
                  className="group relative inline-block"
                >
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded blur opacity-50 group-hover:opacity-75 transition-all"></div>
                  <div className="relative px-6 py-3 bg-slate-950 rounded border border-amber-500/50 group-hover:border-amber-400 transition-all">
                    <span className="font-bold text-amber-400">Ir para a Loja</span>
                  </div>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {inventario.map((inventoryItem) => {
                  const item = inventoryItem.items;

                  return (
                    <div key={inventoryItem.id} className="relative group">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-lg blur opacity-50 group-hover:opacity-75 transition-all"></div>

                      <div className="relative bg-slate-950/90 backdrop-blur-xl border border-cyan-900/50 rounded-lg overflow-hidden">
                        {/* Header do card */}
                        <div className="bg-gradient-to-r from-slate-900/50 to-slate-800/50 px-4 py-3 border-b border-slate-700/50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-3xl">{item.icone}</span>
                              <div>
                                <div className="font-bold text-cyan-400">{item.nome}</div>
                                <div className="text-xs text-slate-500 font-mono uppercase">{item.raridade}</div>
                              </div>
                            </div>
                            <div className="bg-cyan-500/20 border border-cyan-500/50 rounded px-3 py-1">
                              <div className="text-sm font-bold text-cyan-400">x{inventoryItem.quantidade}</div>
                            </div>
                          </div>
                        </div>

                        {/* Corpo do card */}
                        <div className="p-4">
                          <p className="text-sm text-slate-300 mb-4 leading-relaxed">
                            {item.descricao}
                          </p>

                          <div className="mb-4 space-y-2">
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-500">Efeito:</span>
                              <span className="text-green-400 font-bold">
                                {item.efeito === 'cura_hp' ? `+${item.valor_efeito} HP` : item.efeito}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-500">Valor de venda:</span>
                              <span className="text-amber-400 font-bold">💰 {item.preco_venda}</span>
                            </div>
                          </div>

                          <button
                            onClick={() => setItemParaUsar(inventoryItem)}
                            disabled={usandoItem || !avatarAtivo}
                            className="w-full group/btn relative disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-cyan-500 rounded blur opacity-50 group-hover/btn:opacity-75 transition-all"></div>
                            <div className="relative px-4 py-3 bg-slate-950 rounded border border-green-500/50 group-hover/btn:border-green-400 transition-all">
                              <span className="font-bold text-green-400">
                                {!avatarAtivo ? '⚠️ Sem avatar ativo' : usandoItem ? 'Usando...' : '✨ Usar Item'}
                              </span>
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="mb-6 bg-slate-950/80 backdrop-blur-xl border border-amber-500/30 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">🏪</span>
                <span className="font-bold text-amber-400 text-lg">LOJA DE ITENS</span>
              </div>
              <p className="text-sm text-slate-400">
                Compre itens essenciais para suas aventuras. Mais itens serão adicionados em breve!
              </p>
            </div>

            {loadingLoja ? (
              <div className="text-center py-20">
                <div className="text-cyan-400 font-mono animate-pulse">Carregando loja...</div>
              </div>
            ) : itensLoja.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🏪</div>
                <div className="text-xl text-slate-400 font-bold mb-2">Loja Vazia</div>
                <p className="text-slate-500">Nenhum item disponível no momento.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {itensLoja.map((item) => {
                const itemNoInventario = inventario.find(inv => inv.items.nome === item.nome);
                const quantidadeAtual = itemNoInventario?.quantidade || 0;

                return (
                  <div key={item.id} className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-lg blur opacity-50 group-hover:opacity-75 transition-all"></div>

                    <div className="relative bg-slate-950/90 backdrop-blur-xl border border-amber-900/50 rounded-lg overflow-hidden">
                      {/* Header do card */}
                      <div className="bg-gradient-to-r from-amber-900/30 to-orange-900/30 px-4 py-3 border-b border-amber-700/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">{item.icone}</span>
                            <div>
                              <div className="font-bold text-amber-400">{item.nome}</div>
                              <div className="text-xs text-slate-500 font-mono uppercase">{item.raridade}</div>
                            </div>
                          </div>
                          <div className="bg-amber-500/20 border border-amber-500/50 rounded px-3 py-1">
                            <div className="text-sm font-bold text-amber-400">💰 {item.preco_compra}</div>
                          </div>
                        </div>
                      </div>

                      {/* Corpo do card */}
                      <div className="p-4">
                        <p className="text-sm text-slate-300 mb-4 leading-relaxed">
                          {item.descricao}
                        </p>

                        <div className="mb-4 space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500">Efeito:</span>
                            <span className="text-green-400 font-bold">
                              {item.efeito === 'cura_hp' ? `+${item.valor_efeito} HP` : item.efeito}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500">No inventário:</span>
                            <span className="text-cyan-400 font-bold">x{quantidadeAtual}</span>
                          </div>
                          {quantidadeAtual >= item.max_pilha && (
                            <div className="text-xs text-orange-400 font-bold text-center">
                              ⚠️ Quantidade máxima atingida
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => setItemParaComprar(item)}
                          disabled={comprandoItem || quantidadeAtual >= item.max_pilha || (stats?.moedas || 0) < item.preco_compra}
                          className="w-full group/btn relative disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded blur opacity-50 group-hover/btn:opacity-75 transition-all"></div>
                          <div className="relative px-4 py-3 bg-slate-950 rounded border border-amber-500/50 group-hover/btn:border-amber-400 transition-all">
                            <span className="font-bold text-amber-400">
                              {(stats?.moedas || 0) < item.preco_compra
                                ? '💰 Moedas insuficientes'
                                : quantidadeAtual >= item.max_pilha
                                  ? '📦 Inventário cheio'
                                  : comprandoItem
                                    ? 'Comprando...'
                                    : '🛒 Comprar'}
                            </span>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              </div>
            )}
          </div>
        )}

        {/* Botão Voltar */}
        <div className="mt-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="group relative"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-500/30 to-slate-600/30 rounded blur opacity-50 group-hover:opacity-75 transition-all"></div>
            <div className="relative px-6 py-3 bg-slate-950 rounded border border-slate-500/50 group-hover:border-slate-400 transition-all">
              <span className="font-bold text-slate-400 group-hover:text-slate-300">← Voltar ao Dashboard</span>
            </div>
          </button>
        </div>
      </div>

      {/* Modal Confirmar Uso */}
      {itemParaUsar && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => !usandoItem && setItemParaUsar(null)}
        >
          <div
            className="max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-green-500/30 to-cyan-500/30 rounded-lg blur opacity-75"></div>

              <div className="relative bg-slate-950/95 backdrop-blur-xl border border-green-900/50 rounded-lg overflow-hidden">
                <div className="p-4 text-center font-bold text-lg bg-gradient-to-r from-green-600 to-cyan-600 flex items-center justify-center gap-2">
                  <span className="text-2xl">{itemParaUsar.items.icone}</span>
                  <span>USAR ITEM</span>
                </div>

                <div className="p-6">
                  <div className="text-center mb-6">
                    <div className="text-xl font-bold text-green-400 mb-2">{itemParaUsar.items.nome}</div>
                    <p className="text-sm text-slate-400">{itemParaUsar.items.descricao}</p>
                  </div>

                  {avatarAtivo && (
                    <div className="mb-6 bg-slate-900/50 border border-slate-700/50 rounded-lg p-4">
                      <div className="text-xs text-slate-500 uppercase font-mono mb-2 text-center">Será usado em:</div>
                      <div className="text-center">
                        <div className="font-bold text-cyan-400">{avatarAtivo.nome}</div>
                        <div className="text-sm text-green-400 mt-1">
                          HP: {avatarAtivo.hp_atual !== null && avatarAtivo.hp_atual !== undefined
                            ? avatarAtivo.hp_atual
                            : avatarAtivo.resistencia * 10 + avatarAtivo.nivel * 5
                          } / {avatarAtivo.resistencia * 10 + avatarAtivo.nivel * 5}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => setItemParaUsar(null)}
                      disabled={usandoItem}
                      className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors disabled:opacity-50 font-bold"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => usarItem(itemParaUsar)}
                      disabled={usandoItem}
                      className="flex-1 group/btn relative disabled:opacity-50"
                    >
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-cyan-500 rounded blur opacity-50 group-hover/btn:opacity-75 transition-all"></div>
                      <div className="relative px-4 py-3 bg-slate-950 rounded border border-green-500/50 transition-all">
                        <span className="font-bold text-green-400">
                          {usandoItem ? 'Usando...' : 'Confirmar'}
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

      {/* Modal Confirmar Compra */}
      {itemParaComprar && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => !comprandoItem && setItemParaComprar(null)}
        >
          <div
            className="max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/30 to-orange-500/30 rounded-lg blur opacity-75"></div>

              <div className="relative bg-slate-950/95 backdrop-blur-xl border border-amber-900/50 rounded-lg overflow-hidden">
                <div className="p-4 text-center font-bold text-lg bg-gradient-to-r from-amber-600 to-orange-600 flex items-center justify-center gap-2">
                  <span className="text-2xl">{itemParaComprar.icone}</span>
                  <span>COMPRAR ITEM</span>
                </div>

                <div className="p-6">
                  <div className="text-center mb-6">
                    <div className="text-xl font-bold text-amber-400 mb-2">{itemParaComprar.nome}</div>
                    <p className="text-sm text-slate-400">{itemParaComprar.descricao}</p>
                  </div>

                  <div className="mb-6 space-y-3">
                    <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4">
                      <label className="block text-xs text-slate-500 uppercase font-mono mb-2">Quantidade:</label>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setQuantidadeCompra(Math.max(1, quantidadeCompra - 1))}
                          disabled={comprandoItem}
                          className="w-10 h-10 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-bold transition-colors disabled:opacity-50"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          max="99"
                          value={quantidadeCompra}
                          onChange={(e) => setQuantidadeCompra(Math.max(1, Math.min(99, parseInt(e.target.value) || 1)))}
                          disabled={comprandoItem}
                          className="flex-1 text-center bg-slate-800 border border-slate-700 rounded px-4 py-2 text-slate-100 font-bold disabled:opacity-50"
                        />
                        <button
                          onClick={() => setQuantidadeCompra(Math.min(99, quantidadeCompra + 1))}
                          disabled={comprandoItem}
                          className="w-10 h-10 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-bold transition-colors disabled:opacity-50"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="bg-slate-900/50 border border-amber-500/30 rounded-lg p-4">
                      <div className="flex justify-between mb-2">
                        <span className="text-slate-400">Preço unitário:</span>
                        <span className="text-amber-400 font-bold">💰 {itemParaComprar.preco_compra}</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-slate-400">Quantidade:</span>
                        <span className="text-cyan-400 font-bold">x{quantidadeCompra}</span>
                      </div>
                      <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent my-2"></div>
                      <div className="flex justify-between text-lg">
                        <span className="text-slate-300 font-bold">Total:</span>
                        <span className="text-amber-400 font-bold">💰 {itemParaComprar.preco_compra * quantidadeCompra}</span>
                      </div>
                    </div>

                    <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Suas moedas:</span>
                        <span className={`font-bold ${
                          (stats?.moedas || 0) >= (itemParaComprar.preco_compra * quantidadeCompra)
                            ? 'text-green-400'
                            : 'text-red-400'
                        }`}>
                          💰 {stats?.moedas || 0}
                        </span>
                      </div>
                      <div className="flex justify-between mt-2">
                        <span className="text-slate-400">Após compra:</span>
                        <span className={`font-bold ${
                          (stats?.moedas || 0) - (itemParaComprar.preco_compra * quantidadeCompra) >= 0
                            ? 'text-cyan-400'
                            : 'text-red-400'
                        }`}>
                          💰 {(stats?.moedas || 0) - (itemParaComprar.preco_compra * quantidadeCompra)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setItemParaComprar(null);
                        setQuantidadeCompra(1);
                      }}
                      disabled={comprandoItem}
                      className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors disabled:opacity-50 font-bold"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={comprarItem}
                      disabled={comprandoItem || (stats?.moedas || 0) < (itemParaComprar.preco_compra * quantidadeCompra)}
                      className="flex-1 group/btn relative disabled:opacity-50"
                    >
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded blur opacity-50 group-hover/btn:opacity-75 transition-all"></div>
                      <div className="relative px-4 py-3 bg-slate-950 rounded border border-amber-500/50 transition-all">
                        <span className="font-bold text-amber-400">
                          {comprandoItem ? 'Comprando...' : 'Confirmar Compra'}
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

      {/* Feedback Toast */}
      {mensagemFeedback && (
        <div className="fixed top-4 right-4 z-[100] animate-bounce-in">
          <div className={`relative group max-w-md ${
            mensagemFeedback.tipo === 'sucesso' ? 'text-green-400' : 'text-red-400'
          }`}>
            <div className={`absolute -inset-1 ${
              mensagemFeedback.tipo === 'sucesso'
                ? 'bg-gradient-to-r from-green-500/30 to-cyan-500/30'
                : 'bg-gradient-to-r from-red-500/30 to-orange-500/30'
            } rounded-lg blur opacity-75`}></div>

            <div className={`relative bg-slate-950/95 backdrop-blur-xl border ${
              mensagemFeedback.tipo === 'sucesso'
                ? 'border-green-500/50'
                : 'border-red-500/50'
            } rounded-lg p-4 shadow-2xl`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {mensagemFeedback.tipo === 'sucesso' ? '✅' : '⚠️'}
                </span>
                <span className="font-bold">{mensagemFeedback.texto}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes bounce-in {
          0% {
            transform: scale(0.3) translateY(-20px);
            opacity: 0;
          }
          50% {
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
        }

        .animate-bounce-in {
          animation: bounce-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
      `}</style>
    </div>
  );
}
