import { getSupabaseClientSafe } from "@/lib/supabase/serverClient";

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const supabase = getSupabaseClientSafe(true);
    if (!supabase) {
      return Response.json({ error: "Serviço indisponível" }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return Response.json({ error: "userId obrigatório" }, { status: 400 });
    }

    // BUSCAR avatares do usuário com ativo = FALSE
    const { data: avatares, error } = await supabase
      .from('avatares')
      .select('*')
      .eq('user_id', userId)
      .eq('ativo', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("[available-avatares] Erro:", error);
      return Response.json({ error: "Erro ao buscar avatares" }, { status: 500 });
    }

    return Response.json({
      avatares: avatares || [],
      count: avatares?.length || 0
    });

  } catch (error) {
    console.error("[available-avatares] Exception:", error);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  }
}
