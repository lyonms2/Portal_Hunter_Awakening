import { NextResponse } from 'next/server';
import { getSupabaseClientSafe } from "@/lib/supabase/serverClient";

export const dynamic = 'force-dynamic';

/**
 * POST /api/pvp/ia/finalizar
 * Finaliza batalha PVP IA e atualiza stats do jogador
 */
export async function POST(request) {
  try {
    const supabase = getSupabaseClientSafe(true);
    if (!supabase) {
      return NextResponse.json({ error: 'Serviço temporariamente indisponível' }, { status: 503 });
    }

    const body = await request.json();
    const { userId, avatarId, vitoria, famaGanha, vinculoGanho, exaustaoGanha, avatarMorreu } = body;

    console.log('[PVP IA FINALIZAR]', { userId, avatarId, vitoria, famaGanha, vinculoGanho, exaustaoGanha, avatarMorreu });

    // 1. Atualizar ranking PVP (fama)
    const { data: rankingAtual } = await supabase
      .from('pvp_rankings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (rankingAtual) {
      // Atualizar existente
      const novaFama = Math.max(0, (rankingAtual.fama || 1000) + famaGanha);
      const novasVitorias = vitoria ? rankingAtual.vitorias + 1 : rankingAtual.vitorias;
      const novasDerrotas = !vitoria ? rankingAtual.derrotas + 1 : rankingAtual.derrotas;
      const novoStreak = vitoria ? (rankingAtual.streak || 0) + 1 : 0;

      await supabase
        .from('pvp_rankings')
        .update({
          fama: novaFama,
          vitorias: novasVitorias,
          derrotas: novasDerrotas,
          streak: novoStreak,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
    } else {
      // Criar novo
      await supabase
        .from('pvp_rankings')
        .insert({
          user_id: userId,
          fama: Math.max(0, 1000 + famaGanha),
          vitorias: vitoria ? 1 : 0,
          derrotas: vitoria ? 0 : 1,
          streak: vitoria ? 1 : 0
        });
    }

    // 2. Atualizar avatar
    const { data: avatar } = await supabase
      .from('avatares')
      .select('vinculo, exaustao')
      .eq('id', avatarId)
      .single();

    if (avatar) {
      const novoVinculo = Math.min(100, (avatar.vinculo || 0) + vinculoGanho);
      const novaExaustao = Math.min(100, (avatar.exaustao || 0) + exaustaoGanha);

      const updates = {
        vinculo: novoVinculo,
        exaustao: novaExaustao,
        updated_at: new Date().toISOString()
      };

      // Se morreu, marcar como morto
      if (avatarMorreu) {
        updates.vivo = false;
        updates.marca_morte = true;
        updates.hp_atual = 0;
      }

      await supabase
        .from('avatares')
        .update(updates)
        .eq('id', avatarId);
    }

    return NextResponse.json({
      success: true,
      message: 'Resultado da batalha salvo com sucesso'
    });

  } catch (error) {
    console.error('[PVP IA FINALIZAR] Erro:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
