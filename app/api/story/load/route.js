import { getDocument, getDocuments } from "@/lib/firebase/firestore";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId é obrigatório" },
        { status: 400 }
      );
    }

    const chapter = 1; // Capítulo 1 por enquanto

    // Buscar progresso do Firestore
    const progressDocId = `${userId}_chapter${chapter}`;
    const progressData = await getDocument('story_progress', progressDocId);

    // Buscar avatar do Firestore
    const avatarData = await getDocument('story_avatars', userId);

    // Buscar conquistas do Firestore
    const achievementsData = await getDocuments('story_achievements', {
      where: [['user_id', '==', userId]]
    });

    // Se não há progresso, retornar null
    if (!progressData) {
      return NextResponse.json({
        progress: null,
        avatar: null,
        achievements: []
      });
    }

    // Montar resposta com dados do progresso e avatar
    const response = {
      progress: progressData,
      avatar: avatarData,
      achievements: achievementsData || []
    };

    // Adicionar dados do avatar ao progresso para compatibilidade
    if (avatarData && progressData) {
      response.progress.selected_element = {
        id: avatarData.elemento.toLowerCase(),
        nome: avatarData.elemento
      };
      response.progress.avatar_name = avatarData.nome;
      response.progress.avatar_stats = {
        vida: avatarData.vida,
        ataque: avatarData.ataque,
        defesa: avatarData.defesa,
        velocidade: avatarData.velocidade,
        nivel: avatarData.nivel,
        vinculo: avatarData.vinculo
      };
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error("Erro no load story:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor", details: error.message },
      { status: 500 }
    );
  }
}
