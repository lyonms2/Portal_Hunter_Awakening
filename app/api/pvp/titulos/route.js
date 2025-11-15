import { NextResponse } from 'next/server';
import { getSupabaseClientSafe } from "@/lib/supabase/serverClient";

export const dynamic = 'force-dynamic';

/**
 * GET /api/pvp/titulos?userId=xxx
 * Busca títulos conquistados pelo jogador
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

    // Buscar títulos do jogador
    const { data: titulos, error } = await supabase
      .from('pvp_titulos')
      .select(`
        *,
        temporada:pvp_temporadas!pvp_titulos_temporada_id_fkey(
          temporada_id,
          nome
        )
      `)
      .eq('user_id', userId)
      .order('data_conquista', { ascending: false });

    if (error) {
      console.error('[TITULOS] Erro ao buscar:', error);
      return NextResponse.json({ error: 'Erro ao buscar títulos' }, { status: 500 });
    }

    // Buscar título ativo
    const tituloAtivo = titulos?.find(t => t.ativo) || null;

    return NextResponse.json({
      success: true,
      titulos: titulos || [],
      tituloAtivo,
      total: titulos?.length || 0
    });
  } catch (error) {
    console.error('[TITULOS] Erro interno:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * POST /api/pvp/titulos/ativar
 * Ativa/desativa um título
 * Body: { userId, tituloId }
 */
export async function POST(request) {
  try {
    const supabase = getSupabaseClientSafe(true);
    if (!supabase) {
      return NextResponse.json({ error: 'Serviço temporariamente indisponível' }, { status: 503 });
    }

    const body = await request.json();
    const { userId, tituloId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }

    // Se tituloId for null, desativa todos os títulos
    if (!tituloId) {
      const { error } = await supabase
        .from('pvp_titulos')
        .update({ ativo: false })
        .eq('user_id', userId);

      if (error) {
        console.error('[TITULOS] Erro ao desativar todos:', error);
        return NextResponse.json({ error: 'Erro ao desativar títulos' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Títulos desativados'
      });
    }

    // Verificar se título pertence ao jogador
    const { data: titulo, error: errorVerificar } = await supabase
      .from('pvp_titulos')
      .select('*')
      .eq('id', tituloId)
      .eq('user_id', userId)
      .single();

    if (errorVerificar || !titulo) {
      return NextResponse.json({ error: 'Título não encontrado' }, { status: 404 });
    }

    // Desativar todos os títulos do jogador primeiro
    const { error: errorDesativar } = await supabase
      .from('pvp_titulos')
      .update({ ativo: false })
      .eq('user_id', userId);

    if (errorDesativar) {
      console.error('[TITULOS] Erro ao desativar:', errorDesativar);
      return NextResponse.json({ error: 'Erro ao desativar títulos' }, { status: 500 });
    }

    // Ativar o título selecionado
    const { error: errorAtivar } = await supabase
      .from('pvp_titulos')
      .update({ ativo: true })
      .eq('id', tituloId);

    if (errorAtivar) {
      console.error('[TITULOS] Erro ao ativar:', errorAtivar);
      return NextResponse.json({ error: 'Erro ao ativar título' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Título ativado com sucesso',
      titulo
    });
  } catch (error) {
    console.error('[TITULOS] Erro interno:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
