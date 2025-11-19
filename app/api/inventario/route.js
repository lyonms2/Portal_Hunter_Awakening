// ==================== API: INVENTÁRIO DO JOGADOR ====================
// Arquivo: /app/api/inventario/route.js

import { getDocuments, getDocument } from '@/lib/firebase/firestore';

export const dynamic = 'force-dynamic';

/**
 * GET - Buscar inventário do jogador
 */
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return Response.json(
        { message: "userId é obrigatório" },
        { status: 400 }
      );
    }

    // Buscar inventário do jogador no Firestore
    const inventarioItems = await getDocuments('player_inventory', {
      where: [['user_id', '==', userId]],
      orderBy: ['created_at', 'desc']
    });

    if (!inventarioItems || inventarioItems.length === 0) {
      return Response.json({
        inventario: [],
        total_itens: 0
      });
    }

    // Para cada item do inventário, buscar detalhes do item
    // (Firestore não suporta JOIN, então fazemos queries separadas)
    const inventarioCompleto = await Promise.all(
      inventarioItems.map(async (invItem) => {
        const itemDetails = await getDocument('items', invItem.item_id);

        return {
          id: invItem.id,
          quantidade: invItem.quantidade,
          created_at: invItem.created_at,
          updated_at: invItem.updated_at,
          items: itemDetails || null
        };
      })
    );

    // Filtrar itens que não têm detalhes (caso o item tenha sido deletado)
    const inventarioValido = inventarioCompleto.filter(item => item.items !== null);

    return Response.json({
      inventario: inventarioValido,
      total_itens: inventarioValido.length
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
    const body = await request.json();
    const { userId, itemId, inventoryItemId } = body;

    if (!userId || !itemId || !inventoryItemId) {
      return Response.json(
        { message: "Dados incompletos" },
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

    // Verificar se o item requer avatar ativo
    if (item.requer_avatar_ativo) {
      // Buscar avatar ativo no Firestore
      const avatares = await getDocuments('avatares', {
        where: [
          ['user_id', '==', userId],
          ['ativo', '==', true],
          ['vivo', '==', true]
        ]
      });

      if (!avatares || avatares.length === 0) {
        return Response.json(
          { message: "Você precisa ter um avatar ativo vivo para usar este item" },
          { status: 400 }
        );
      }

      const avatarAtivo = avatares[0];

      // PRIMEIRO: Verificar e validar item no inventário
      const inventoryItem = await getDocument('player_inventory', inventoryItemId);

      if (!inventoryItem || inventoryItem.user_id !== userId) {
        return Response.json(
          { message: "Item não encontrado no inventário" },
          { status: 404 }
        );
      }

      // SEGUNDO: Calcular efeito (mas NÃO aplicar ainda)
      let resultado = {};
      let novoHP, hpCurado, hpMaximo, novaExaustao, exaustaoReduzida;

      if (item.efeito === 'cura_hp') {
        // Calcular HP máximo
        hpMaximo = avatarAtivo.resistencia * 10 + avatarAtivo.nivel * 5;
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
        novoHP = Math.min(hpAtual + item.valor_efeito, hpMaximo);
        hpCurado = novoHP - hpAtual;

        resultado = {
          tipo: 'cura_hp',
          avatar: avatarAtivo.nome,
          hp_curado: hpCurado,
          hp_anterior: hpAtual,
          hp_novo: novoHP,
          hp_maximo: hpMaximo
        };
      } else if (item.efeito === 'cura_exaustao') {
        const exaustaoAtual = avatarAtivo.exaustao || 0;
        novaExaustao = Math.max(0, exaustaoAtual - item.valor_efeito);
        exaustaoReduzida = exaustaoAtual - novaExaustao;

        resultado = {
          tipo: 'cura_exaustao',
          avatar: avatarAtivo.nome,
          exaustao_reduzida: exaustaoReduzida,
          exaustao_anterior: exaustaoAtual,
          exaustao_nova: novaExaustao
        };
      }

      // TERCEIRO: Consumir item do inventário
      const { updateDocument, deleteDocument } = await import('@/lib/firebase/firestore');

      if (inventoryItem.quantidade > 1) {
        // Reduzir quantidade
        await updateDocument('player_inventory', inventoryItemId, {
          quantidade: inventoryItem.quantidade - 1,
          updated_at: new Date().toISOString()
        });
      } else {
        // Remover item do inventário
        await deleteDocument('player_inventory', inventoryItemId);
      }

      // QUARTO: Aplicar efeito no avatar (só depois de consumir o item!)
      if (item.efeito === 'cura_hp') {
        await updateDocument('avatares', avatarAtivo.id, {
          hp_atual: novoHP,
          updated_at: new Date().toISOString()
        });
      } else if (item.efeito === 'cura_exaustao') {
        await updateDocument('avatares', avatarAtivo.id, {
          exaustao: novaExaustao,
          updated_at: new Date().toISOString()
        });
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
      { message: "Erro ao processar requisição: " + error.message },
      { status: 500 }
    );
  }
}
