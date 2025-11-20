import { deleteDocument, getDocument, getDocuments, setDocument } from "@/lib/firebase/firestore";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

const MAX_RESETS = 2;

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId é obrigatório" },
        { status: 400 }
      );
    }

    // Check reset count
    const resetDocId = `${userId}_reset_count`;
    let resetData = await getDocument('story_resets', resetDocId);

    const currentResets = resetData?.count || 0;

    if (currentResets >= MAX_RESETS) {
      return NextResponse.json(
        {
          error: "Limite de resets atingido",
          message: `Você já usou seus ${MAX_RESETS} resets disponíveis.`,
          resets_used: currentResets,
          max_resets: MAX_RESETS
        },
        { status: 400 }
      );
    }

    // Delete all story data for this user from Firestore

    // 1. Delete progress (all chapters)
    try {
      const progressDocs = await getDocuments('story_progress', {
        where: [['user_id', '==', userId]]
      });

      for (const doc of progressDocs) {
        await deleteDocument('story_progress', doc.id);
      }
    } catch (error) {
      console.error("Erro ao deletar progresso:", error);
    }

    // 2. Delete avatar
    try {
      await deleteDocument('story_avatars', userId);
    } catch (error) {
      console.error("Erro ao deletar avatar:", error);
    }

    // 3. Delete achievements
    try {
      const achievementDocs = await getDocuments('story_achievements', {
        where: [['user_id', '==', userId]]
      });

      for (const doc of achievementDocs) {
        await deleteDocument('story_achievements', doc.id);
      }
    } catch (error) {
      console.error("Erro ao deletar conquistas:", error);
    }

    // 4. Increment reset count
    const newResetCount = currentResets + 1;
    await setDocument('story_resets', resetDocId, {
      user_id: userId,
      count: newResetCount,
      last_reset: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: "Progresso resetado com sucesso",
      resets_used: newResetCount,
      resets_remaining: MAX_RESETS - newResetCount
    });

  } catch (error) {
    console.error("Erro no reset story:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor", details: error.message },
      { status: 500 }
    );
  }
}
