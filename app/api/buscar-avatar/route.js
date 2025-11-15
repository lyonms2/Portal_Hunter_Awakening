import { NextResponse } from 'next/server';
import { getSupabaseClientSafe } from "@/lib/supabase/serverClient";

export const dynamic = 'force-dynamic';

/**
 * GET /api/buscar-avatar?avatarId=... OU ?userId=...
 * Busca dados de um avatar específico pelo ID ou busca avatar ativo do usuário
 */
export async function GET(request) {
  try {
    const supabase = getSupabaseClientSafe(true);
    if (!supabase) {
      return NextResponse.json({ error: 'Serviço temporariamente indisponível' }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const avatarId = searchParams.get('avatarId');
    const userId = searchParams.get('userId');

    if (!avatarId && !userId) {
      return NextResponse.json(
        { error: 'avatarId ou userId é obrigatório' },
        { status: 400 }
      );
    }

    let avatar;

    if (avatarId) {
      // Buscar por ID do avatar
      const { data, error } = await supabase
        .from('avatares')
        .select('*')
        .eq('id', avatarId)
        .single();

      if (error) {
        console.error('Erro ao buscar avatar por ID:', error);
        return NextResponse.json({ error: 'Avatar não encontrado' }, { status: 404 });
      }

      avatar = data;
    } else {
      // Buscar avatar ativo do usuário
      const { data, error } = await supabase
        .from('avatares')
        .select('*')
        .eq('user_id', userId)
        .eq('ativo', true)
        .single();

      if (error) {
        console.error('Erro ao buscar avatar ativo:', error);
        return NextResponse.json({ error: 'Avatar ativo não encontrado' }, { status: 404 });
      }

      avatar = data;
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
