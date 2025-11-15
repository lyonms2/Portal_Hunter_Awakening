import { NextResponse } from 'next/server';
import { getSupabaseClientSafe } from "@/lib/supabase/serverClient";

export const dynamic = 'force-dynamic';

/**
 * POST /api/pvp/challenge/reject
 * Rejeita um desafio PvP recebido
 * Body: { challengeId, userId }
 */
export async function POST(request) {
  try {
    const supabase = getSupabaseClientSafe(true);
    if (!supabase) {
      return NextResponse.json({ error: 'Serviço temporariamente indisponível' }, { status: 503 });
    }

    const body = await request.json();
    const { challengeId, userId } = body;

    if (!challengeId || !userId) {
      return NextResponse.json(
        { error: 'challengeId e userId são obrigatórios' },
        { status: 400 }
      );
    }

    console.log('❌ Rejeitando desafio PvP:', { challengeId, userId });

    // Chamar função do banco para rejeitar desafio
    const { data, error } = await supabase
      .rpc('reject_pvp_challenge', {
        p_challenge_id: challengeId,
        p_user_id: userId
      });

    if (error) {
      console.error('Erro ao rejeitar desafio:', error);
      return NextResponse.json({ error: 'Erro ao rejeitar desafio' }, { status: 500 });
    }

    const result = data[0];

    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: result.message
      }, { status: 400 });
    }

    console.log('✅ Desafio rejeitado com sucesso');

    return NextResponse.json({
      success: true,
      message: result.message
    });

  } catch (error) {
    console.error('Erro no POST /api/pvp/challenge/reject:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
