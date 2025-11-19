import { NextResponse } from 'next/server';
import { getDocuments, getDocument } from '@/lib/firebase/firestore';

export const dynamic = 'force-dynamic';

/**
 * GET /api/pvp/recompensas?userId=xxx
 * Busca recompensas pendentes do jogador
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }

    // Buscar recompensas pendentes (não coletadas) no Firestore
    const recompensasItems = await getDocuments('pvp_recompensas_pendentes', {
      where: [
        ['user_id', '==', userId],
        ['coletada', '==', false]
      ],
      orderBy: [['created_at', 'desc']]
    });

    // Para cada recompensa, buscar detalhes da temporada
    // (Firestore não suporta JOIN, então fazemos queries separadas)
    const recompensas = await Promise.all(
      (recompensasItems || []).map(async (recompensa) => {
        const temporada = await getDocument('pvp_temporadas', recompensa.temporada_id);

        return {
          ...recompensa,
          temporada: temporada ? {
            temporada_id: temporada.temporada_id,
            nome: temporada.nome,
            data_fim: temporada.data_fim
          } : null
        };
      })
    );

    return NextResponse.json({
      success: true,
      recompensas: recompensas || [],
      total: recompensas?.length || 0
    });
  } catch (error) {
    console.error('[RECOMPENSAS] Erro interno:', error);
    return NextResponse.json({ error: 'Erro interno do servidor: ' + error.message }, { status: 500 });
  }
}
