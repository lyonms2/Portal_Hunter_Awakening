import { getSupabaseClientSafe } from "@/lib/supabase/serverClient";

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    // Inicializar Supabase dentro da função (IGUAL ao meus-avatares)
    const supabase = getSupabaseClientSafe(true);
    if (!supabase) {
      return Response.json(
        { message: "Serviço temporariamente indisponível" },
        { status: 503 }
      );
    }

    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return Response.json(
        { message: "ID do usuário é obrigatório" },
        { status: 400 }
      );
    }

    // COPIAR EXATAMENTE o padrão que funciona em /api/meus-avatares
    const { data: avatares, error } = await supabase
      .from('avatares')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Erro ao buscar avatares:", error);
      return Response.json(
        { message: "Erro ao buscar avatares: " + error.message },
        { status: 500 }
      );
    }

    console.log(`[available-avatares] Total avatares do user: ${avatares?.length || 0}`);
    avatares?.forEach(av => {
      console.log(`  - ${av.nome}: ativo=${av.ativo} (${typeof av.ativo}), vivo=${av.vivo}, em_venda=${av.em_venda}`);
    });

    // Filtrar apenas avatares disponíveis para venda (inativos)
    const avataresFiltrados = (avatares || []).filter(av => {
      const ativoValue = av.ativo;
      const isInativo = ativoValue === false || ativoValue === 'false';
      console.log(`  ${isInativo ? '✓' : '✗'} ${av.nome}: ativo=${av.ativo}`);
      return isInativo;
    });

    console.log(`[available-avatares] Filtrados: ${avataresFiltrados.length} de ${avatares?.length || 0}`);

    return Response.json({
      avatares: avataresFiltrados,
      total: avataresFiltrados.length
    });
  } catch (error) {
    console.error("Erro no servidor:", error);
    return Response.json(
      { message: "Erro ao processar: " + error.message },
      { status: 500 }
    );
  }
}
