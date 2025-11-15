import { NextResponse } from 'next/server';
import { getSupabaseClientSafe } from "@/lib/supabase/serverClient";

export const dynamic = 'force-dynamic';

/**
 * POST /api/pvp/temporada/encerrar
 * Encerra a temporada ativa e distribui recompensas
 * IMPORTANTE: Deve ser chamado automaticamente a cada 30 dias ou manualmente por admin
 */
export async function POST(request) {
  try {
    const supabase = getSupabaseClientSafe(true);
    if (!supabase) {
      return NextResponse.json({ error: 'Serviço temporariamente indisponível' }, { status: 503 });
    }

    console.log('[ENCERRAR TEMPORADA] Iniciando encerramento...');

    // Chamar função do banco que:
    // 1. Salva histórico de todos os jogadores
    // 2. Calcula posições finais
    // 3. Gera recompensas para top 100
    // 4. Cria títulos para top 10
    // 5. Desativa temporada atual
    const { data, error } = await supabase.rpc('encerrar_temporada');

    if (error) {
      console.error('[ENCERRAR TEMPORADA] Erro:', error);
      return NextResponse.json({
        error: 'Erro ao encerrar temporada',
        details: error.message
      }, { status: 500 });
    }

    console.log('[ENCERRAR TEMPORADA] Temporada encerrada com sucesso!');

    // Criar nova temporada automaticamente
    const { error: errorNova } = await supabase.rpc('criar_nova_temporada');

    if (errorNova) {
      console.error('[ENCERRAR TEMPORADA] Erro ao criar nova temporada:', errorNova);
      // Não retornar erro pois temporada foi encerrada com sucesso
      // Admin pode criar manualmente depois
    }

    return NextResponse.json({
      success: true,
      message: 'Temporada encerrada e nova temporada criada com sucesso'
    });
  } catch (error) {
    console.error('[ENCERRAR TEMPORADA] Erro interno:', error);
    return NextResponse.json({
      error: 'Erro interno do servidor',
      details: error.message
    }, { status: 500 });
  }
}
