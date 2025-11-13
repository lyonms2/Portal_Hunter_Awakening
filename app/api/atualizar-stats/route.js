// ==================== API: ATUALIZAR STATS DO JOGADOR ====================
// Arquivo: /app/api/atualizar-stats/route.js

import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase/serverClient';

// MOVIDO PARA DENTRO DA FUNÇÃO: const supabase = getSupabaseServiceClient();

export async function POST(request) {
  try {
    // Inicializar Supabase dentro da função
    const supabase = getSupabaseServiceClient();
    const { userId, moedas, fragmentos } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { message: 'userId é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar stats atuais
    const { data: statsAtuais, error: fetchError } = await supabase
      .from('player_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      console.error('Erro ao buscar stats:', fetchError);
      return NextResponse.json(
        { message: 'Erro ao buscar stats do jogador' },
        { status: 500 }
      );
    }

    // Calcular novos valores
    const novasMoedas = (statsAtuais.moedas || 0) + (moedas || 0);
    const novosFragmentos = (statsAtuais.fragmentos || 0) + (fragmentos || 0);

    // Atualizar no banco
    const { data, error: updateError } = await supabase
      .from('player_stats')
      .update({
        moedas: novasMoedas,
        fragmentos: novosFragmentos,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Erro ao atualizar stats:', updateError);
      return NextResponse.json(
        { message: 'Erro ao atualizar stats' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      sucesso: true,
      stats: data,
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
