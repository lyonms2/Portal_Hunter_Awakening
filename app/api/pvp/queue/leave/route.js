import { NextResponse } from 'next/server';
import { getSupabaseClientSafe } from "@/lib/supabase/serverClient";

export const dynamic = 'force-dynamic';

/**
 * POST /api/pvp/queue/leave
 * Remove jogador da fila de matchmaking
 * Body: { userId }
 */
export async function POST(request) {
  try {
    const supabase = getSupabaseClientSafe(true);
    if (!supabase) {
      return NextResponse.json({ error: 'Serviço temporariamente indisponível' }, { status: 503 });
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }

    // Remover da fila
    const { error: deleteError } = await supabase
      .from('pvp_matchmaking_queue')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Erro ao sair da fila:', deleteError);
      return NextResponse.json({ error: 'Erro ao sair da fila' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Removido da fila com sucesso'
    });

  } catch (error) {
    console.error('Erro no POST /api/pvp/queue/leave:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
