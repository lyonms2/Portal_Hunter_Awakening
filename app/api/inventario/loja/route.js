// ==================== API: LISTAR ITENS DA LOJA ====================
// Arquivo: /app/api/inventario/loja/route.js

import { getSupabaseClientSafe } from "@/lib/supabase/serverClient";

export const dynamic = 'force-dynamic';

/**
 * GET - Listar todos os itens disponíveis na loja
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

    // Buscar todos os itens disponíveis
    const { data: itens, error } = await supabase
      .from('items')
      .select('*')
      .order('preco_compra', { ascending: true });

    if (error) {
      console.error("Erro ao buscar itens:", error);
      return Response.json(
        { message: "Erro ao buscar itens: " + error.message },
        { status: 500 }
      );
    }

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
