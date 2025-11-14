// ==================== API: INVENTÁRIO DO JOGADOR ====================
// Arquivo: /app/api/inventario/route.js

import { getSupabaseClientSafe } from "@/lib/supabase/serverClient";

export const dynamic = 'force-dynamic';

/**
 * GET - Buscar inventário do jogador
 */
export async function GET(request) {
  try {
    const supabase = getSupabaseClientSafe(true);
    if (!supabase) {
      return Response.json(
        { message: "Serviço temporariamente indisponível" },
        { status: 503 }
      );
    }

    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return Response.json(
        { message: "userId é obrigatório" },
        { status: 400 }
      );
    }

    // Buscar inventário do jogador com informações completas dos itens
    const { data: inventario, error } = await supabase
      .from('player_inventory')
      .select(`
        id,
        quantidade,
        created_at,
        updated_at,
        items (
          id,
          nome,
          descricao,
          tipo,
          efeito,
          valor_efeito,
          preco_compra,
          preco_venda,
          raridade,
          icone,
          empilhavel,
          max_pilha,
          requer_avatar_ativo
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Erro ao buscar inventário:", error);
      return Response.json(
        { message: "Erro ao buscar inventário: " + error.message },
        { status: 500 }
      );
    }

    return Response.json({
      inventario: inventario || [],
      total_itens: inventario?.length || 0
    });

  } catch (error) {
    console.error("Erro no servidor:", error);
    return Response.json(
      { message: "Erro ao processar: " + error.message },
      { status: 500 }
    );
  }
}

/**
 * POST - Usar item do inventário
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
    const { userId, itemId, inventoryItemId } = body;

    if (!userId || !itemId || !inventoryItemId) {
      return Response.json(
        { message: "Dados incompletos" },
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

    // Verificar se o item requer avatar ativo
    if (item.requer_avatar_ativo) {
      const { data: avatarAtivo, error: avatarError } = await supabase
        .from('avatares')
        .select('*')
        .eq('user_id', userId)
        .eq('ativo', true)
        .eq('vivo', true)
        .single();

      if (avatarError || !avatarAtivo) {
        return Response.json(
          { message: "Você precisa ter um avatar ativo vivo para usar este item" },
          { status: 400 }
        );
      }

      // Processar efeito do item
      let resultado = {};

      if (item.efeito === 'cura_hp') {
        // Calcular HP máximo
        const hpMaximo = avatarAtivo.resistencia * 10 + avatarAtivo.nivel * 5;
        const hpAtual = avatarAtivo.hp_atual !== null && avatarAtivo.hp_atual !== undefined
          ? avatarAtivo.hp_atual
          : hpMaximo;

        // Verificar se já está com HP cheio
        if (hpAtual >= hpMaximo) {
          return Response.json(
            { message: "Avatar já está com HP cheio!" },
            { status: 400 }
          );
        }

        // Calcular novo HP (não pode passar do máximo)
        const novoHP = Math.min(hpAtual + item.valor_efeito, hpMaximo);
        const hpCurado = novoHP - hpAtual;

        // Atualizar HP do avatar
        const { error: updateError } = await supabase
          .from('avatares')
          .update({ hp_atual: novoHP })
          .eq('id', avatarAtivo.id);

        if (updateError) {
          console.error("Erro ao atualizar HP:", updateError);
          return Response.json(
            { message: "Erro ao aplicar efeito do item" },
            { status: 500 }
          );
        }

        resultado = {
          tipo: 'cura_hp',
          avatar: avatarAtivo.nome,
          hp_curado: hpCurado,
          hp_anterior: hpAtual,
          hp_novo: novoHP,
          hp_maximo: hpMaximo
        };
      } else if (item.efeito === 'cura_exaustao') {
        // Implementar cura de exaustão (futuro)
        const exaustaoAtual = avatarAtivo.exaustao || 0;
        const novaExaustao = Math.max(0, exaustaoAtual - item.valor_efeito);

        const { error: updateError } = await supabase
          .from('avatares')
          .update({ exaustao: novaExaustao })
          .eq('id', avatarAtivo.id);

        if (updateError) {
          console.error("Erro ao atualizar exaustão:", updateError);
          return Response.json(
            { message: "Erro ao aplicar efeito do item" },
            { status: 500 }
          );
        }

        resultado = {
          tipo: 'cura_exaustao',
          avatar: avatarAtivo.nome,
          exaustao_reduzida: exaustaoAtual - novaExaustao,
          exaustao_anterior: exaustaoAtual,
          exaustao_nova: novaExaustao
        };
      }

      // Consumir item do inventário
      const { data: inventoryItem, error: invError } = await supabase
        .from('player_inventory')
        .select('quantidade')
        .eq('id', inventoryItemId)
        .eq('user_id', userId)
        .single();

      if (invError || !inventoryItem) {
        return Response.json(
          { message: "Item não encontrado no inventário" },
          { status: 404 }
        );
      }

      if (inventoryItem.quantidade > 1) {
        // Reduzir quantidade
        await supabase
          .from('player_inventory')
          .update({
            quantidade: inventoryItem.quantidade - 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', inventoryItemId);
      } else {
        // Remover item do inventário
        await supabase
          .from('player_inventory')
          .delete()
          .eq('id', inventoryItemId);
      }

      return Response.json({
        sucesso: true,
        mensagem: `${item.nome} usado com sucesso!`,
        item: item.nome,
        resultado
      });
    }

    return Response.json(
      { message: "Tipo de item não suportado" },
      { status: 400 }
    );

  } catch (error) {
    console.error("Erro ao usar item:", error);
    return Response.json(
      { message: "Erro ao processar requisição" },
      { status: 500 }
    );
  }
}
