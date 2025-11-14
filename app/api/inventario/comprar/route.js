// ==================== API: COMPRAR ITEM ====================
// Arquivo: /app/api/inventario/comprar/route.js

import { getSupabaseClientSafe } from "@/lib/supabase/serverClient";

export const dynamic = 'force-dynamic';

/**
 * POST - Comprar item para o inventário
 */
export async function POST(request) {
  try {
    const supabase = getSupabaseClientSafe(true);
    if (!supabase) {
      return Response.json(
        { message: "Serviço temporariamente indisponível" },
        { status: 503 }
      );
    }

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

    // Buscar informações do item
    const { data: item, error: itemError } = await supabase
      .from('items')
      .select('*')
      .eq('id', itemId)
      .single();

    if (itemError || !item) {
      return Response.json(
        { message: "Item não encontrado" },
        { status: 404 }
      );
    }

    // Calcular custo total
    const custoTotal = item.preco_compra * quantidade;

    // Buscar stats do jogador
    const { data: stats, error: statsError } = await supabase
      .from('player_stats')
      .select('moedas')
      .eq('user_id', userId)
      .single();

    if (statsError || !stats) {
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
    const { data: inventoryItem, error: invError } = await supabase
      .from('player_inventory')
      .select('*')
      .eq('user_id', userId)
      .eq('item_id', itemId)
      .single();

    if (invError && invError.code !== 'PGRST116') { // PGRST116 = not found
      console.error("Erro ao verificar inventário:", invError);
      return Response.json(
        { message: "Erro ao verificar inventário" },
        { status: 500 }
      );
    }

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

      // Atualizar quantidade no inventário
      const { error: updateInvError } = await supabase
        .from('player_inventory')
        .update({
          quantidade: novaQuantidade,
          updated_at: new Date().toISOString()
        })
        .eq('id', inventoryItem.id);

      if (updateInvError) {
        console.error("Erro ao atualizar inventário:", updateInvError);
        return Response.json(
          { message: "Erro ao adicionar item ao inventário" },
          { status: 500 }
        );
      }

      // Deduzir moedas
      const { error: updateStatsError } = await supabase
        .from('player_stats')
        .update({ moedas: stats.moedas - custoReal })
        .eq('user_id', userId);

      if (updateStatsError) {
        console.error("Erro ao atualizar moedas:", updateStatsError);
        return Response.json(
          { message: "Erro ao processar pagamento" },
          { status: 500 }
        );
      }

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
      // Adicionar novo item ao inventário
      const { error: insertError } = await supabase
        .from('player_inventory')
        .insert({
          user_id: userId,
          item_id: itemId,
          quantidade: quantidade
        });

      if (insertError) {
        console.error("Erro ao adicionar item:", insertError);
        return Response.json(
          { message: "Erro ao adicionar item ao inventário" },
          { status: 500 }
        );
      }

      // Deduzir moedas
      const { error: updateStatsError } = await supabase
        .from('player_stats')
        .update({ moedas: stats.moedas - custoTotal })
        .eq('user_id', userId);

      if (updateStatsError) {
        console.error("Erro ao atualizar moedas:", updateStatsError);
        return Response.json(
          { message: "Erro ao processar pagamento" },
          { status: 500 }
        );
      }

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
      { message: "Erro ao processar compra" },
      { status: 500 }
    );
  }
}
