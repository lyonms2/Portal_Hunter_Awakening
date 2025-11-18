// ==================== API: ATUALIZAR STATS DO JOGADOR ====================
// Arquivo: /app/api/atualizar-stats/route.js

import { NextResponse } from 'next/server';
import { getDocument, updateDocument } from '@/lib/firebase/firestore';

export const dynamic = 'force-dynamic';

/**
 * POST /api/atualizar-stats
 * Adiciona moedas e/ou fragmentos ao jogador
 *
 * Body: {
 *   userId: string,
 *   moedas?: number,
 *   fragmentos?: number
 * }
 */
export async function POST(request) {
  try {
    const { userId, moedas, fragmentos } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { message: 'userId é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar stats atuais no Firestore
    const statsAtuais = await getDocument('player_stats', userId);

    if (!statsAtuais) {
      console.error('Stats do jogador não encontrados:', userId);
      return NextResponse.json(
        { message: 'Jogador não encontrado' },
        { status: 404 }
      );
    }

    // Calcular novos valores
    const novasMoedas = (statsAtuais.moedas || 0) + (moedas || 0);
    const novosFragmentos = (statsAtuais.fragmentos || 0) + (fragmentos || 0);

    // Atualizar no Firestore
    await updateDocument('player_stats', userId, {
      moedas: novasMoedas,
      fragmentos: novosFragmentos,
      updated_at: new Date().toISOString()
    });

    // Buscar stats atualizados
    const statsAtualizados = await getDocument('player_stats', userId);

    return NextResponse.json({
      sucesso: true,
      stats: statsAtualizados,
      ganhos: {
        moedas: moedas || 0,
        fragmentos: fragmentos || 0
      }
    });

  } catch (error) {
    console.error('Erro na API atualizar-stats:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor', erro: error.message },
      { status: 500 }
    );
  }
}
