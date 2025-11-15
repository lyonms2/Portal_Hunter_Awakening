import { NextResponse } from 'next/server';
import { getSupabaseClientSafe } from "@/lib/supabase/serverClient";

export const dynamic = 'force-dynamic';

/**
 * GET /api/buscar-avatar?avatarId=...
 * Busca dados de um avatar específico pelo ID
 */
export async function GET(request) {
  try {
    const supabase = getSupabaseClientSafe(true);
    if (!supabase) {
      return NextResponse.json({ error: 'Serviço temporariamente indisponível' }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const avatarId = searchParams.get('avatarId');

    if (!avatarId) {
      return NextResponse.json(
        { error: 'avatarId é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar avatar no banco
    const { data: avatar, error } = await supabase
      .from('avatares')
      .select('*')
      .eq('id', avatarId)
      .single();

    if (error) {
      console.error('Erro ao buscar avatar:', error);
      return NextResponse.json({ error: 'Avatar não encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      avatar: avatar
    });

  } catch (error) {
    console.error('Erro no GET /api/buscar-avatar:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
