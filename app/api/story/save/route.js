import { getDocument, setDocument, createDocument } from "@/lib/firebase/firestore";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();

    const {
      userId,
      storyPhase,
      sceneIndex,
      playerChoices,
      selectedElement,
      avatarName,
      avatarStats,
      avatarVisual,
      completed
    } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId é obrigatório" },
        { status: 400 }
      );
    }

    const chapter = 1; // Capítulo 1 por enquanto

    // Salvar/atualizar progresso no Firestore
    const progressDocId = `${userId}_chapter${chapter}`;
    const progressData = {
      user_id: userId,
      chapter: chapter,
      story_phase: storyPhase,
      scene_index: sceneIndex,
      player_choices: playerChoices || [],
      completed_at: completed ? new Date().toISOString() : null
    };

    await setDocument('story_progress', progressDocId, progressData);

    // Salvar/atualizar avatar se foi criado
    if (avatarName && avatarStats && selectedElement) {
      const avatarData = {
        user_id: userId,
        nome: avatarName,
        elemento: selectedElement.nome,
        vida: avatarStats.vida,
        ataque: avatarStats.ataque,
        defesa: avatarStats.defesa,
        velocidade: avatarStats.velocidade,
        nivel: avatarStats.nivel,
        vinculo: avatarStats.vinculo,
        // Visual properties for avatar image generation
        corPele: avatarVisual?.corPele || '#F5D0C5',
        corCabelo: avatarVisual?.corCabelo || '#8B4513',
        tipoCabelo: avatarVisual?.tipoCabelo || 'short',
        corOlhos: avatarVisual?.corOlhos || '#8B4513',
        corRoupa: avatarVisual?.corRoupa || '#4A5568'
      };

      await setDocument('story_avatars', userId, avatarData);
    }

    // Adicionar conquista se completou o capítulo
    if (completed) {
      const achievementDocId = `${userId}_primeiro_vinculo`;
      const achievementData = {
        user_id: userId,
        achievement_id: 'primeiro_vinculo',
        achievement_name: 'Primeiro Vínculo'
      };

      try {
        await createDocument('story_achievements', achievementData, achievementDocId);
      } catch (error) {
        // Conquista já existe, ignorar
        console.log("Conquista já desbloqueada");
      }
    }

    return NextResponse.json({
      success: true,
      progress: progressData
    });

  } catch (error) {
    console.error("Erro no save story:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor", details: error.message },
      { status: 500 }
    );
  }
}
