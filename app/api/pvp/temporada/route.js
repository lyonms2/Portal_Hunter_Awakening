import { NextResponse } from 'next/server';
import { getDocuments } from '@/lib/firebase/firestore';

export const dynamic = 'force-dynamic';

/**
 * GET /api/pvp/temporada
 * Busca informações da temporada ativa
 */
export async function GET(request) {
  try {
    const temporadas = await getDocuments('pvp_temporadas', {
      where: [['ativa', '==', true]]
    });

    if (!temporadas || temporadas.length === 0) {
      return NextResponse.json({ error: 'Nenhuma temporada ativa encontrada' }, { status: 404 });
    }

    const temporada = temporadas[0];

    // Calcular dias restantes
    const dataFim = new Date(temporada.data_fim);
    const agora = new Date();
    const diasRestantes = Math.ceil((dataFim - agora) / (1000 * 60 * 60 * 24));

    return NextResponse.json({
      success: true,
      temporada: {
        id: temporada.temporada_id,
        nome: temporada.nome,
        dataInicio: temporada.data_inicio,
        dataFim: temporada.data_fim,
        diasRestantes: Math.max(0, diasRestantes),
        ativa: temporada.ativa
      }
    });
  } catch (error) {
    console.error('Erro no GET /api/pvp/temporada:', error);
    return NextResponse.json({ error: 'Erro interno do servidor: ' + error.message }, { status: 500 });
  }
}

// POST removido - funcionalidade de criar temporada deve ser migrada para Firebase Cloud Functions
