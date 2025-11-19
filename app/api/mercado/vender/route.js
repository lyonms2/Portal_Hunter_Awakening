import { getDocument, updateDocument } from "@/lib/firebase/firestore";

export async function POST(request) {
  try {
    const { userId, avatarId, precoMoedas, precoFragmentos } = await request.json();

    if (!userId || !avatarId) {
      return Response.json(
        { message: "Dados incompletos" },
        { status: 400 }
      );
    }

    // Normalizar valores (undefined/null/0 para 0)
    const moedasValor = parseInt(precoMoedas) || 0;
    const fragmentosValor = parseInt(precoFragmentos) || 0;

    // Validar que pelo menos um preço foi definido e é maior que zero
    if (moedasValor === 0 && fragmentosValor === 0) {
      return Response.json(
        { message: "Defina um preço em moedas e/ou fragmentos (mínimo 1)" },
        { status: 400 }
      );
    }

    // Validar limites de moedas (1 a 10.000)
    if (moedasValor < 0 || moedasValor > 10000) {
      return Response.json(
        { message: "Moedas devem estar entre 0 e 10.000" },
        { status: 400 }
      );
    }

    // Validar limites de fragmentos (0 a 500)
    if (fragmentosValor < 0 || fragmentosValor > 500) {
      return Response.json(
        { message: "Fragmentos devem estar entre 0 e 500" },
        { status: 400 }
      );
    }

    // Validar preço mínimo (se definido, deve ser >= 1)
    if (moedasValor > 0 && moedasValor < 1) {
      return Response.json(
        { message: "Preço mínimo em moedas: 1" },
        { status: 400 }
      );
    }

    if (fragmentosValor > 0 && fragmentosValor < 1) {
      return Response.json(
        { message: "Preço mínimo em fragmentos: 1" },
        { status: 400 }
      );
    }

    // Buscar avatar do Firestore
    const avatar = await getDocument('avatares', avatarId);

    if (!avatar || avatar.user_id !== userId) {
      return Response.json(
        { message: "Avatar não encontrado" },
        { status: 404 }
      );
    }

    // Validações
    if (avatar.ativo) {
      return Response.json(
        { message: "Não é possível vender o avatar ativo" },
        { status: 400 }
      );
    }

    if (!avatar.vivo) {
      return Response.json(
        { message: "Não é possível vender avatares mortos" },
        { status: 400 }
      );
    }

    if (avatar.marca_morte) {
      return Response.json(
        { message: "Não é possível vender avatares com Marca da Morte" },
        { status: 400 }
      );
    }

    if (avatar.em_venda) {
      return Response.json(
        { message: "Este avatar já está à venda" },
        { status: 400 }
      );
    }

    // Colocar à venda no Firestore
    await updateDocument('avatares', avatarId, {
      em_venda: true,
      preco_venda: moedasValor > 0 ? moedasValor : null,
      preco_fragmentos: fragmentosValor > 0 ? fragmentosValor : null
    });

    return Response.json({
      message: "Avatar colocado à venda com sucesso!",
      avatar_id: avatarId,
      preco_moedas: moedasValor,
      preco_fragmentos: fragmentosValor
    });

  } catch (error) {
    console.error("Erro:", error);
    return Response.json(
      { message: "Erro ao processar requisição" },
      { status: 500 }
    );
  }
}

// Cancelar venda
export async function DELETE(request) {
  try {
    const { userId, avatarId } = await request.json();

    if (!userId || !avatarId) {
      return Response.json(
        { message: "Dados incompletos" },
        { status: 400 }
      );
    }

    // Verificar se o avatar pertence ao usuário
    const avatar = await getDocument('avatares', avatarId);

    if (!avatar || avatar.user_id !== userId) {
      return Response.json(
        { message: "Avatar não encontrado" },
        { status: 404 }
      );
    }

    // Remover da venda no Firestore
    await updateDocument('avatares', avatarId, {
      em_venda: false,
      preco_venda: null,
      preco_fragmentos: null
    });

    return Response.json({
      message: "Venda cancelada com sucesso!"
    });

  } catch (error) {
    console.error("Erro:", error);
    return Response.json(
      { message: "Erro ao processar requisição" },
      { status: 500 }
    );
  }
}
