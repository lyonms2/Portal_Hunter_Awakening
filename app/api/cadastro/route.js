import { getSupabaseAnonClient } from "@/lib/supabase/serverClient";

// MOVIDO PARA DENTRO DA FUNÇÃO: const supabase = getSupabaseAnonClient();

export async function POST(request) {
  try {
    // Inicializar Supabase dentro da função
    const supabase = getSupabaseAnonClient();
    const { email, senha, confirmaSenha } = await request.json();

    // Validações
    if (!email || !senha || !confirmaSenha) {
      return Response.json(
        { message: "Todos os campos são obrigatórios" },
        { status: 400 }
      );
    }

    if (senha !== confirmaSenha) {
      return Response.json(
        { message: "As senhas não coincidem" },
        { status: 400 }
      );
    }

    if (senha.length < 6) {
      return Response.json(
        { message: "A senha deve ter no mínimo 6 caracteres" },
        { status: 400 }
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return Response.json(
        { message: "Email inválido" },
        { status: 400 }
      );
    }

    // Criar usuário
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/login`,
      }
    });

    if (error) {
      console.error("Erro no cadastro:", error);
      
      // Tratar erros específicos
      if (error.message.includes('already registered')) {
        return Response.json(
          { message: "Este email já está cadastrado" },
          { status: 409 }
        );
      }
      
      return Response.json(
        { message: "Erro ao criar conta: " + error.message },
        { status: 400 }
      );
    }

    // Cadastro bem-sucedido
    return Response.json({
      message: "Caçador registrado com sucesso! Verifique seu email para confirmar a conta.",
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    });

  } catch (error) {
    console.error("Erro no servidor:", error);
    return Response.json(
      { message: "Erro ao processar cadastro. Tente novamente." },
      { status: 500 }
    );
  }
}
