import { NextResponse } from 'next/server';
import { getSupabaseClientSafe } from "@/lib/supabase/serverClient";

export const dynamic = 'force-dynamic';

/**
 * GET /api/pvp/recompensas?userId=xxx
 * Busca recompensas pendentes do jogador
 */
export async function GET(request) {
  try {
    const supabase = getSupabaseClientSafe(true);
    if (!supabase) {
      return NextResponse.json({ error: 'Serviço temporariamente indisponível' }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }

    // Buscar recompensas pendentes (não coletadas)
    const { data: recompensas, error } = await supabase
      .from('pvp_recompensas_pendentes')
      .select(`
        *,
        temporada:pvp_temporadas!pvp_recompensas_pendentes_temporada_id_fkey(
          temporada_id,
          nome,
          data_fim
        )
      `)
      .eq('user_id', userId)
      .eq('coletada', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[RECOMPENSAS] Erro ao buscar:', error);
      return NextResponse.json({ error: 'Erro ao buscar recompensas' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      recompensas: recompensas || [],
      total: recompensas?.length || 0
    });
  } catch (error) {
    console.error('[RECOMPENSAS] Erro interno:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
