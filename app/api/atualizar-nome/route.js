import { getSupabaseClientSafe } from "@/lib/supabase/serverClient";

// MOVIDO PARA DENTRO DA FUNÇÃO: const supabase = getSupabaseClientSafe();

export const dynamic = 'force-dynamic';

export async function PUT(request) {
  console.log("=== ATUALIZAR NOME DE OPERAÇÃO ===");

  try {
    // Inicializar Supabase dentro da função
    const supabase = getSupabaseClientSafe(true);
    if (!supabase) {
      return Response.json(
        { message: "Serviço temporariamente indisponível" },
        { status: 503 }
      );
    }

    const { userId, nomeOperacao } = await request.json();

    if (!userId) {
      return Response.json(
        { message: "userId é obrigatório" },
        { status: 400 }
      );
    }

    if (!nomeOperacao || nomeOperacao.trim().length === 0) {
      return Response.json(
        { message: "Nome de operação não pode estar vazio" },
        { status: 400 }
      );
    }

    // Validar tamanho (máximo 30 caracteres)
    if (nomeOperacao.length > 30) {
      return Response.json(
        { message: "Nome de operação deve ter no máximo 30 caracteres" },
        { status: 400 }
      );
    }

    // Validar caracteres (apenas letras, números, espaços e alguns especiais)
    const regex = /^[a-zA-Z0-9À-ÿ\s\-_]+$/;
    if (!regex.test(nomeOperacao)) {
      return Response.json(
        { message: "Nome contém caracteres inválidos" },
        { status: 400 }
      );
    }

    console.log(`Atualizando nome para usuário ${userId}: "${nomeOperacao}"`);

    const { data, error } = await supabase
      .from('player_stats')
      .update({ nome_operacao: nomeOperacao.trim() })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error("Erro ao atualizar nome:", error);
      return Response.json(
        { message: "Erro ao atualizar nome: " + error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return Response.json(
        { message: "Jogador não encontrado" },
        { status: 404 }
      );
    }

    console.log("✅ Nome atualizado com sucesso:", data.nome_operacao);

    return Response.json({
      success: true,
      message: "Nome de operação atualizado com sucesso!",
      stats: data
    });

  } catch (error) {
    console.error("❌ ERRO:", error);
    return Response.json(
      { message: "Erro ao processar: " + error.message },
      { status: 500 }
    );
  }
}
