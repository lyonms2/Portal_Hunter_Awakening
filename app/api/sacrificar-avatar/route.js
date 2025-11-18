import { getDocument, updateDocument } from '@/lib/firebase/firestore';

export const dynamic = 'force-dynamic';

/**
 * POST /api/sacrificar-avatar
 *
 * Sacrifica um avatar permanentemente, enviando-o ao Memorial Eterno.
 * O avatar é marcado como morto COM marca da morte.
 *
 * Validações:
 * - Avatar deve pertencer ao usuário
 * - Avatar não pode estar ativo
 */
export async function POST(request) {
  try {
    const { userId, avatarId } = await request.json();

    if (!userId || !avatarId) {
      return Response.json(
        { message: "userId e avatarId são obrigatórios" },
        { status: 400 }
      );
    }

    // Verificar se o avatar pertence ao usuário no Firestore
    const avatar = await getDocument('avatares', avatarId);

    if (!avatar || avatar.user_id !== userId) {
      return Response.json(
        { message: "Avatar não encontrado ou não pertence a você" },
        { status: 404 }
      );
    }

    // Não pode sacrificar avatar ativo
    if (avatar.ativo) {
      return Response.json(
        { message: "Não é possível sacrificar o avatar ativo" },
        { status: 400 }
      );
    }

    // Sacrificar avatar: marcar como morto COM marca da morte (vai pro memorial)
    await updateDocument('avatares', avatarId, {
      vivo: false,
      hp_atual: 0,
      marca_morte: true, // Marca da morte - vai pro memorial
      ativo: false,
      updated_at: new Date().toISOString()
    });

    return Response.json({
      message: `${avatar.nome} foi sacrificado e enviado ao Memorial Eterno...`
    });

  } catch (error) {
    console.error("Erro no servidor:", error);
    return Response.json(
      { message: "Erro ao processar: " + error.message },
      { status: 500 }
    );
  }
}
