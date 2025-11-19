import { NextResponse } from 'next/server';
import { getDocument, updateDocument } from '@/lib/firebase/firestore';

export const dynamic = 'force-dynamic';

/**
 * POST /api/pvp/recompensas/coletar
 * Coleta recompensas de fim de temporada
 * Body: { userId, recompensaId }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, recompensaId } = body;

    if (!userId || !recompensaId) {
      return NextResponse.json({ error: 'userId e recompensaId são obrigatórios' }, { status: 400 });
    }

    // Buscar recompensa no Firestore
    const recompensa = await getDocument('pvp_recompensas_pendentes', recompensaId);

    if (!recompensa || recompensa.user_id !== userId || recompensa.coletada) {
      return NextResponse.json({ error: 'Recompensa não encontrada ou já coletada' }, { status: 404 });
    }

    console.log('[COLETAR RECOMPENSA] Coletando:', {
      moedas: recompensa.moedas,
      fragmentos: recompensa.fragmentos,
      avatar_lendario: recompensa.avatar_lendario,
      avatar_raro: recompensa.avatar_raro
    });

    // Buscar stats atuais do jogador
    const stats = await getDocument('player_stats', userId);

    if (!stats) {
      console.error('[COLETAR RECOMPENSA] Erro ao buscar stats');
      return NextResponse.json({ error: 'Erro ao buscar stats do jogador' }, { status: 500 });
    }

    // Calcular novos valores
    const novasMoedas = (stats.moedas || 0) + (recompensa.moedas || 0);
    const novosFragmentos = (stats.fragmentos || 0) + (recompensa.fragmentos || 0);

    // Atualizar moedas e fragmentos do jogador
    await updateDocument('player_stats', userId, {
      moedas: novasMoedas,
      fragmentos: novosFragmentos,
      updated_at: new Date().toISOString()
    });

    // Marcar recompensa como coletada
    await updateDocument('pvp_recompensas_pendentes', recompensaId, {
      coletada: true,
      data_coleta: new Date().toISOString()
    });

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
    return NextResponse.json({ error: 'Erro interno do servidor: ' + error.message }, { status: 500 });
  }
}
