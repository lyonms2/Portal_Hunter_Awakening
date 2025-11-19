// ==================== API: COMPRAR ITEM ====================
// Arquivo: /app/api/inventario/comprar/route.js

import { getDocument, getDocuments, updateDocument, createDocument } from '@/lib/firebase/firestore';

export const dynamic = 'force-dynamic';

/**
 * POST - Comprar item para o inventário
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, itemId, quantidade = 1 } = body;

    if (!userId || !itemId) {
      return Response.json(
        { message: "Dados incompletos" },
        { status: 400 }
      );
    }

    if (quantidade < 1 || quantidade > 99) {
      return Response.json(
        { message: "Quantidade inválida (1-99)" },
        { status: 400 }
      );
    }

    // Buscar informações do item no Firestore
    const item = await getDocument('items', itemId);

    if (!item) {
      return Response.json(
        { message: "Item não encontrado" },
        { status: 404 }
      );
    }

    // Calcular custo total
    const custoTotal = item.preco_compra * quantidade;

    // Buscar stats do jogador no Firestore
    const stats = await getDocument('player_stats', userId);

    if (!stats) {
      return Response.json(
        { message: "Stats do jogador não encontradas" },
        { status: 404 }
      );
    }

    // Verificar se tem moedas suficientes
    if (stats.moedas < custoTotal) {
      return Response.json(
        {
          message: "Moedas insuficientes",
          moedas_necessarias: custoTotal,
          moedas_atuais: stats.moedas,
          diferenca: custoTotal - stats.moedas
        },
        { status: 400 }
      );
    }

    // Verificar se já tem o item no inventário
    const inventoryItems = await getDocuments('player_inventory', {
      where: [
        ['user_id', '==', userId],
        ['item_id', '==', itemId]
      ]
    });

    const inventoryItem = inventoryItems && inventoryItems.length > 0 ? inventoryItems[0] : null;

    // Se já tem o item e é empilhável, aumentar quantidade
    if (inventoryItem && item.empilhavel) {
      const novaQuantidade = Math.min(
        inventoryItem.quantidade + quantidade,
        item.max_pilha
      );

      if (novaQuantidade === inventoryItem.quantidade) {
        return Response.json(
          { message: `Você já tem o máximo de ${item.nome} (${item.max_pilha})` },
          { status: 400 }
        );
      }

      const quantidadeComprada = novaQuantidade - inventoryItem.quantidade;
      const custoReal = item.preco_compra * quantidadeComprada;

      // PRIMEIRO: Deduzir moedas (se falhar aqui, nada aconteceu ainda)
      await updateDocument('player_stats', userId, {
        moedas: stats.moedas - custoReal,
        updated_at: new Date().toISOString()
      });

      // SEGUNDO: Atualizar quantidade no inventário (só depois de pagar!)
      await updateDocument('player_inventory', inventoryItem.id, {
        quantidade: novaQuantidade,
        updated_at: new Date().toISOString()
      });

      return Response.json({
        sucesso: true,
        mensagem: `${quantidadeComprada}x ${item.nome} adicionado ao inventário!`,
        item: {
          nome: item.nome,
          icone: item.icone,
          quantidade_comprada: quantidadeComprada,
          quantidade_total: novaQuantidade,
          custo: custoReal
        },
        moedas_restantes: stats.moedas - custoReal
      });

    } else {
      // PRIMEIRO: Deduzir moedas (se falhar aqui, nada aconteceu ainda)
      await updateDocument('player_stats', userId, {
        moedas: stats.moedas - custoTotal,
        updated_at: new Date().toISOString()
      });

      // SEGUNDO: Adicionar novo item ao inventário (só depois de pagar!)
      await createDocument('player_inventory', {
        user_id: userId,
        item_id: itemId,
        quantidade: quantidade,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      return Response.json({
        sucesso: true,
        mensagem: `${quantidade}x ${item.nome} adicionado ao inventário!`,
        item: {
          nome: item.nome,
          icone: item.icone,
          quantidade_comprada: quantidade,
          custo: custoTotal
        },
        moedas_restantes: stats.moedas - custoTotal
      });
    }

  } catch (error) {
    console.error("Erro ao comprar item:", error);
    return Response.json(
      { message: "Erro ao processar compra: " + error.message },
      { status: 500 }
    );
  }
}
