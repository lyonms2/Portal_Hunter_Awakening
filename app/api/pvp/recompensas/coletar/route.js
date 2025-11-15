import { NextResponse } from 'next/server';
import { getSupabaseClientSafe } from "@/lib/supabase/serverClient";

export const dynamic = 'force-dynamic';

/**
 * POST /api/pvp/recompensas/coletar
 * Coleta recompensas de fim de temporada
 * Body: { userId, recompensaId }
 */
export async function POST(request) {
  try {
    const supabase = getSupabaseClientSafe(true);
    if (!supabase) {
      return NextResponse.json({ error: 'Serviço temporariamente indisponível' }, { status: 503 });
    }

    const body = await request.json();
    const { userId, recompensaId } = body;

    if (!userId || !recompensaId) {
      return NextResponse.json({ error: 'userId e recompensaId são obrigatórios' }, { status: 400 });
    }

    // Buscar recompensa
    const { data: recompensa, error: errorBuscar } = await supabase
      .from('pvp_recompensas_pendentes')
      .select('*')
      .eq('id', recompensaId)
      .eq('user_id', userId)
      .eq('coletada', false)
      .single();

    if (errorBuscar || !recompensa) {
      return NextResponse.json({ error: 'Recompensa não encontrada ou já coletada' }, { status: 404 });
    }

    console.log('[COLETAR RECOMPENSA] Coletando:', {
      moedas: recompensa.moedas,
      fragmentos: recompensa.fragmentos,
      avatar_lendario: recompensa.avatar_lendario,
      avatar_raro: recompensa.avatar_raro
    });

    // Buscar stats atuais do jogador
    const { data: stats, error: errorStats } = await supabase
      .from('player_stats')
      .select('moedas, fragmentos')
      .eq('user_id', userId)
      .single();

    if (errorStats) {
      console.error('[COLETAR RECOMPENSA] Erro ao buscar stats:', errorStats);
      return NextResponse.json({ error: 'Erro ao buscar stats do jogador' }, { status: 500 });
    }

    // Calcular novos valores
    const novasMoedas = (stats.moedas || 0) + (recompensa.moedas || 0);
    const novosFragmentos = (stats.fragmentos || 0) + (recompensa.fragmentos || 0);

    // Atualizar moedas e fragmentos do jogador
    const { error: errorAtualizar } = await supabase
      .from('player_stats')
      .update({
        moedas: novasMoedas,
        fragmentos: novosFragmentos
      })
      .eq('user_id', userId);

    if (errorAtualizar) {
      console.error('[COLETAR RECOMPENSA] Erro ao atualizar stats:', errorAtualizar);
      return NextResponse.json({ error: 'Erro ao atualizar stats' }, { status: 500 });
    }

    // Marcar recompensa como coletada
    const { error: errorMarcar } = await supabase
      .from('pvp_recompensas_pendentes')
      .update({
        coletada: true,
        data_coleta: new Date().toISOString()
      })
      .eq('id', recompensaId);

    if (errorMarcar) {
      console.error('[COLETAR RECOMPENSA] Erro ao marcar como coletada:', errorMarcar);
      // Não retornar erro pois recursos já foram dados
    }

    // Se ganhou avatar lendário ou raro, retornar flag para mostrar modal
    const ganhouAvatar = recompensa.avatar_lendario || recompensa.avatar_raro;
    const raridadeAvatar = recompensa.avatar_lendario ? 'Lendário' :
                           recompensa.avatar_raro ? 'Raro' : null;

    return NextResponse.json({
      success: true,
      recompensa: {
        moedas: recompensa.moedas,
        fragmentos: recompensa.fragmentos,
        avatar_lendario: recompensa.avatar_lendario,
        avatar_raro: recompensa.avatar_raro,
        ganhouAvatar,
        raridadeAvatar
      },
      novosValores: {
        moedas: novasMoedas,
        fragmentos: novosFragmentos
      },
      message: 'Recompensas coletadas com sucesso!'
    });
  } catch (error) {
    console.error('[COLETAR RECOMPENSA] Erro interno:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
