import { NextResponse } from 'next/server';
import { getSupabaseClientSafe } from "@/lib/supabase/serverClient";

export const dynamic = 'force-dynamic';

/**
 * GET /api/pvp/battle/debug?matchId=xxx
 * Debug endpoint - verifica se sala existe sem validações
 */
export async function GET(request) {
  try {
    const supabase = getSupabaseClientSafe(true);
    if (!supabase) {
      return NextResponse.json({ error: 'Serviço temporariamente indisponível' }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get('matchId');

    if (!matchId) {
      return NextResponse.json({ error: 'matchId é obrigatório' }, { status: 400 });
    }

    console.log('[DEBUG] Buscando sala:', matchId);

    // Buscar sala de batalha (sem validações)
    const { data: room, error: roomError } = await supabase
      .from('pvp_battle_rooms')
      .select('*')
      .eq('id', matchId)
      .single();

    if (roomError) {
      console.log('[DEBUG] Erro ao buscar sala:', roomError);
      return NextResponse.json({
        exists: false,
        error: roomError.message,
        code: roomError.code,
        details: roomError.details
      });
    }

    if (!room) {
      console.log('[DEBUG] Sala não encontrada');
      return NextResponse.json({
        exists: false,
        message: 'Sala não existe no banco de dados'
      });
    }

    console.log('[DEBUG] Sala encontrada:', room);
    return NextResponse.json({
      exists: true,
      room: {
        id: room.id,
        status: room.status,
        player1_user_id: room.player1_user_id,
        player2_user_id: room.player2_user_id,
        player1_ready: room.player1_ready,
        player2_ready: room.player2_ready,
        created_at: room.created_at,
        expires_at: room.expires_at
      },
      fullRoom: room
    });

  } catch (error) {
    console.error('[DEBUG] Erro no debug endpoint:', error);
    return NextResponse.json({
      error: 'Erro interno do servidor',
      message: error.message
    }, { status: 500 });
  }
}
