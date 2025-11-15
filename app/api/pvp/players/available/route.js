import { NextResponse } from 'next/server';
import { getSupabaseClientSafe } from "@/lib/supabase/serverClient";

export const dynamic = 'force-dynamic';

/**
 * GET /api/pvp/players/available?userId=xxx
 * Lista jogadores disponíveis para PvP (exceto o próprio usuário)
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

    // Limpar jogadores inativos primeiro
    await supabase.rpc('cleanup_inactive_players');

    // Buscar jogadores disponíveis (exceto o próprio usuário)
    const { data: players, error } = await supabase
      .from('pvp_available_players')
      .select('*')
      .neq('user_id', userId)
      .eq('is_available', true)
      .gt('expires_at', new Date().toISOString())
      .order('nivel', { ascending: false })
      .limit(50); // Máximo 50 jogadores

    if (error) {
      console.error('Erro ao buscar jogadores disponíveis:', error);
      return NextResponse.json({ error: 'Erro ao buscar jogadores' }, { status: 500 });
    }

    // Buscar dados dos avatares
    const avatarIds = players.map(p => p.avatar_id);
    const { data: avatares } = await supabase
      .from('avatares')
      .select('id, nome, nivel, elemento, raridade, forca, agilidade, resistencia, foco, aparencia')
      .in('id', avatarIds);

    // Combinar dados
    const playersWithAvatars = players.map(player => {
      const avatar = avatares?.find(a => a.id === player.avatar_id);
      return {
        userId: player.user_id,
        avatarId: player.avatar_id,
        nivel: player.nivel,
        poderTotal: player.poder_total,
        fama: player.fama,
        avatar: avatar || null,
        joinedAt: player.joined_at
      };
    });

    return NextResponse.json({
      success: true,
      players: playersWithAvatars
    });

  } catch (error) {
    console.error('Erro no GET /api/pvp/players/available:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * POST /api/pvp/players/available
 * Adiciona/atualiza jogador na lista de disponíveis (heartbeat)
 * Body: { userId, avatarId, nivel, poderTotal, fama }
 */
export async function POST(request) {
  try {
    const supabase = getSupabaseClientSafe(true);
    if (!supabase) {
      return NextResponse.json({ error: 'Serviço temporariamente indisponível' }, { status: 503 });
    }

    const body = await request.json();
    const { userId, avatarId, nivel, poderTotal, fama } = body;

    if (!userId || !avatarId || !nivel || !poderTotal) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      );
    }

    // Inserir ou atualizar (upsert)
    const { error } = await supabase
      .from('pvp_available_players')
      .upsert({
        user_id: userId,
        avatar_id: avatarId,
        nivel: nivel,
        poder_total: poderTotal,
        fama: fama || 1000,
        is_available: true,
        last_heartbeat: new Date().toISOString(),
        expires_at: new Date(Date.now() + 2 * 60 * 1000).toISOString() // 2 minutos
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Erro ao atualizar disponibilidade:', error);
      return NextResponse.json({ error: 'Erro ao atualizar disponibilidade' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Disponibilidade atualizada'
    });

  } catch (error) {
    console.error('Erro no POST /api/pvp/players/available:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * DELETE /api/pvp/players/available?userId=xxx
 * Remove jogador da lista de disponíveis
 */
export async function DELETE(request) {
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

    await supabase
      .from('pvp_available_players')
      .delete()
      .eq('user_id', userId);

    return NextResponse.json({
      success: true,
      message: 'Removido da lista de disponíveis'
    });

  } catch (error) {
    console.error('Erro no DELETE /api/pvp/players/available:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
