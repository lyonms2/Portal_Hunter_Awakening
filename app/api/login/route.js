import { getSupabaseAnonClient } from "@/lib/supabase/serverClient";

// MOVIDO PARA DENTRO DA FUNÇÃO: const supabase = getSupabaseAnonClient();

export async function POST(request) {
  try {
    // Inicializar Supabase dentro da função
    const supabase = getSupabaseAnonClient();
    const { email, senha } = await request.json();

    // Validação básica
    if (!email || !senha) {
      return Response.json(
        { message: "Email e senha são obrigatórios" },
        { status: 400 }
      );
    }

    // Tentar fazer login
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error) {
      console.error("Erro no login:", error);
      return Response.json(
        { message: "Credenciais inválidas. Verifique email e senha." },
        { status: 401 }
      );
    }

    // Login bem-sucedido
    return Response.json({
      message: "Portal aberto com sucesso, caçador!",
      user: {
        id: data.user.id,
        email: data.user.email,
      },
      session: data.session,
    });

  } catch (error) {
    console.error("Erro no servidor:", error);
    return Response.json(
      { message: "Erro ao processar login. Tente novamente." },
      { status: 500 }
    );
  }
}
