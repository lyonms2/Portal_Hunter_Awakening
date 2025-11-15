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

    // Buscar nomes dos usuários da coluna nome_operacao
    const userIds = rankings.map(r => r.user_id);

    // Buscar usuários do Supabase Auth
    const { data: authUsers } = await supabase.auth.admin.listUsers();

    // Criar mapa de userId -> nome (da coluna nome_operacao)
    const nomesMap = {};
    if (authUsers && authUsers.users && authUsers.users.length > 0) {
      authUsers.users.forEach(authUser => {
        if (userIds.includes(authUser.id)) {
          // Tentar pegar nome_operacao dos metadados ou usar email
          const nomeOperacao = authUser.user_metadata?.nome_operacao;
          if (nomeOperacao) {
            nomesMap[authUser.id] = nomeOperacao;
          } else {
            // Fallback: extrair do email
            const email = authUser.email;
            const username = email ? email.split('@')[0] : 'Misterioso';
            nomesMap[authUser.id] = username.charAt(0).toUpperCase() + username.slice(1);
          }
        }
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
