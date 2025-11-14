import { NextResponse } from 'next/server';
import { getSupabaseClientSafe } from "@/lib/supabase/serverClient";

export const dynamic = 'force-dynamic';

/**
 * GET /api/pvp/temporada
 * Busca informações da temporada ativa
 */
export async function GET(request) {
  try {
    const supabase = getSupabaseClientSafe(true);
    if (!supabase) {
      return NextResponse.json({ error: 'Serviço temporariamente indisponível' }, { status: 503 });
    }

    const { data: temporada, error } = await supabase
      .from('pvp_temporadas')
      .select('*')
      .eq('ativa', true)
      .single();

    if (error) {
      console.error('Erro ao buscar temporada:', error);
      return NextResponse.json({ error: 'Erro ao buscar temporada' }, { status: 500 });
    }

    if (!temporada) {
      return NextResponse.json({ error: 'Nenhuma temporada ativa encontrada' }, { status: 404 });
    }

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
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * POST /api/pvp/temporada/criar
 * Cria uma nova temporada (admin only)
 */
export async function POST(request) {
  try {
    const supabase = getSupabaseClientSafe(true);
    if (!supabase) {
      return NextResponse.json({ error: 'Serviço temporariamente indisponível' }, { status: 503 });
    }

    // Chamar função do banco
    const { data, error } = await supabase
      .rpc('criar_nova_temporada');

    if (error) {
      console.error('Erro ao criar temporada:', error);
      return NextResponse.json({ error: 'Erro ao criar temporada' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Nova temporada criada com sucesso'
    });
  } catch (error) {
    console.error('Erro no POST /api/pvp/temporada/criar:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
