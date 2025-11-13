import { getSupabaseClientSafe } from "@/lib/supabase/serverClient";

// MOVIDO PARA DENTRO DA FUNÇÃO: const supabase = getSupabaseClientSafe();

export async function POST(request) {
  try {
    // Inicializar Supabase dentro da função
    const supabase = getSupabaseClientSafe(true);
    if (!supabase) {
      return Response.json(
        { message: "Serviço temporariamente indisponível" },
        { status: 503 }
      );
    }

    const { userId } = await request.json();

    if (!userId) {
      return Response.json(
        { message: "ID do usuário é obrigatório" },
        { status: 400 }
      );
    }

    console.log("Inicializando jogador:", userId);

    // Verificar se já existe
    const { data: existing, error: selectError } = await supabase
      .from('player_stats')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (selectError) {
      console.error("Erro ao buscar stats:", selectError);
    }

    if (existing) {
      console.log("Jogador já existe:", existing);
      return Response.json({
        message: "Jogador já inicializado",
        stats: existing
      });
    }

    console.log("Criando novo jogador...");

    // Criar stats iniciais
    const { data: stats, error } = await supabase
      .from('player_stats')
      .insert([{
        user_id: userId,
        moedas: 500,
        fragmentos: 0,
        divida: 0,
        ranking: 'F',
        missoes_completadas: 0,
        primeira_invocacao: true
      }])
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar stats:", error);
      return Response.json(
        { message: "Erro ao inicializar jogador: " + error.message },
        { status: 500 }
      );
    }

    console.log("Jogador criado com sucesso:", stats);

    return Response.json({
      message: "Jogador inicializado com sucesso!",
      stats
    });

  } catch (error) {
    console.error("Erro no servidor:", error);
    return Response.json(
      { message: "Erro ao processar: " + error.message },
      { status: 500 }
    );
  }
}
