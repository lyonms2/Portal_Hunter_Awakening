import { loginUser } from "@/lib/firebase/auth";

export async function POST(request) {
  try {
    const { email, senha } = await request.json();

    // Validação básica
    if (!email || !senha) {
      return Response.json(
        { message: "Email e senha são obrigatórios" },
        { status: 400 }
      );
    }

    // Tentar fazer login com Firebase
    const result = await loginUser(email, senha);

    if (!result.success) {
      return Response.json(
        { message: result.error || "Credenciais inválidas. Verifique email e senha." },
        { status: 401 }
      );
    }

    // Login bem-sucedido
    return Response.json({
      message: "Portal aberto com sucesso, caçador!",
      user: {
        id: result.user.id,
        email: result.user.email,
        displayName: result.user.displayName
      }
    });

  } catch (error) {
    console.error("Erro no servidor:", error);
    return Response.json(
      { message: "Erro ao processar login. Tente novamente." },
      { status: 500 }
    );
  }
}
