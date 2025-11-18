import { registerUser } from "@/lib/firebase/auth";
import { createDocument } from "@/lib/firebase/firestore";

export async function POST(request) {
  try {
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

    // Criar usuário no Firebase Auth
    const result = await registerUser(email, senha);

    if (!result.success) {
      return Response.json(
        { message: result.error || "Erro ao criar conta" },
        { status: 400 }
      );
    }

    // Criar documento do jogador no Firestore
    try {
      await createDocument('player_stats', {
        user_id: result.user.id,
        email: result.user.email,
        moedas: 5000,
        fragmentos: 500,
        divida: 0,
        ranking: 'F',
        missoes_completadas: 0,
        primeira_invocacao: false,
        nome_operacao: null
      }, result.user.id);
    } catch (firestoreError) {
      console.error("Erro ao criar player_stats:", firestoreError);
      // Usuário foi criado no Auth, mas falhou ao criar documento
      // Não retornar erro pois o usuário existe
    }

    // Cadastro bem-sucedido
    return Response.json({
      message: "Caçador registrado com sucesso!",
      user: {
        id: result.user.id,
        email: result.user.email
      }
    });

  } catch (error) {
    console.error("Erro no servidor:", error);
    return Response.json(
      { message: "Erro ao processar cadastro. Tente novamente." },
      { status: 500 }
    );
  }
}
