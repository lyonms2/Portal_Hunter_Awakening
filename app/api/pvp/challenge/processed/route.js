import { NextResponse } from 'next/server';
import { getSupabaseClientSafe } from "@/lib/supabase/serverClient";

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/pvp/challenge/processed?challengeId=xxx
 * Deleta um desafio aceito após o desafiante entrar na batalha
 */
export async function DELETE(request) {
  try {
    const supabase = getSupabaseClientSafe(true);
    if (!supabase) {
      return NextResponse.json({ error: 'Serviço temporariamente indisponível' }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const challengeId = searchParams.get('challengeId');

    if (!challengeId) {
      return NextResponse.json({ error: 'challengeId é obrigatório' }, { status: 400 });
    }

    // Deletar o desafio aceito
    const { error } = await supabase
      .from('pvp_challenges')
      .delete()
      .eq('id', challengeId)
      .eq('status', 'accepted');

    if (error) {
      console.error('Erro ao deletar desafio processado:', error);
      return NextResponse.json({ error: 'Erro ao deletar desafio' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Desafio processado e removido'
    });

  } catch (error) {
    console.error('Erro no DELETE /api/pvp/challenge/processed:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
