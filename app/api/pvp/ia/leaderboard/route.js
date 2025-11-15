import { NextResponse } from 'next/server';
import { getSupabaseClientSafe } from "@/lib/supabase/serverClient";

export const dynamic = 'force-dynamic';

/**
 * GET /api/pvp/ia/leaderboard
 * Retorna o ranking de PVP IA ordenado por fama
 */
export async function GET(request) {
  try {
    const supabase = getSupabaseClientSafe(true);
    if (!supabase) {
      return NextResponse.json({ error: 'Serviço temporariamente indisponível' }, { status: 503 });
    }

    // Buscar top 100 rankings ordenados por fama
    const { data: rankings, error: rankingsError } = await supabase
      .from('pvp_rankings')
      .select('user_id, fama, vitorias, derrotas, streak')
      .order('fama', { ascending: false })
      .limit(100);

    if (rankingsError) {
      console.error('[LEADERBOARD] Erro ao buscar rankings:', rankingsError);
      return NextResponse.json({ error: 'Erro ao buscar rankings' }, { status: 500 });
    }

    // Buscar nomes dos usuários
    const userIds = rankings.map(r => r.user_id);
    const { data: usuarios } = await supabase
      .from('users')
      .select('id, nome')
      .in('id', userIds);

    // Criar mapa de userId -> nome
    const nomesMap = {};
    if (usuarios && usuarios.length > 0) {
      usuarios.forEach(user => {
        nomesMap[user.id] = user.nome || 'Caçador Misterioso';
      });
    }

    // Adicionar nomes aos rankings
    const rankingsComNomes = rankings.map(rank => ({
      ...rank,
      nome: nomesMap[rank.user_id] || 'Caçador Misterioso'
    }));

    return NextResponse.json({
      success: true,
      rankings: rankingsComNomes
    });

  } catch (error) {
    console.error('[LEADERBOARD] Erro:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
