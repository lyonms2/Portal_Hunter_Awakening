// ==================== API: LISTAR ITENS DA LOJA ====================
// Arquivo: /app/api/inventario/loja/route.js

import { getDocuments } from '@/lib/firebase/firestore';

export const dynamic = 'force-dynamic';

/**
 * GET - Listar todos os itens disponíveis na loja
 */
export async function GET(request) {
  try {
    // Buscar todos os itens disponíveis no Firestore
    const itens = await getDocuments('items', {
      orderBy: ['preco_compra', 'asc']
    });

    return Response.json({
      itens: itens || [],
      total: itens?.length || 0
    });

  } catch (error) {
    console.error("Erro no servidor:", error);
    return Response.json(
      { message: "Erro ao processar: " + error.message },
      { status: 500 }
    );
  }
}
