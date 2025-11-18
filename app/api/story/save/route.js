import { createClient } from "@/lib/supabase/serverClient";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      userId,
      storyPhase,
      sceneIndex,
      playerChoices,
      selectedElement,
      avatarName,
      avatarStats,
      completed
    } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId é obrigatório" },
        { status: 400 }
      );
    }

    const chapter = 1; // Capítulo 1 por enquanto

    // Salvar/atualizar progresso
    const { data: existingProgress } = await supabase
      .from("story_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("chapter", chapter)
      .single();

    const progressData = {
      user_id: userId,
      chapter: chapter,
      story_phase: storyPhase,
      scene_index: sceneIndex,
      player_choices: playerChoices || [],
      completed_at: completed ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    };

    let progressResult;

    if (existingProgress) {
      progressResult = await supabase
        .from("story_progress")
        .update(progressData)
        .eq("user_id", userId)
        .eq("chapter", chapter)
        .select();
    } else {
      progressResult = await supabase
        .from("story_progress")
        .insert({
          ...progressData,
          created_at: new Date().toISOString()
        })
        .select();
    }

    if (progressResult.error) {
      console.error("Erro ao salvar progresso:", progressResult.error);
      return NextResponse.json(
        { error: "Erro ao salvar progresso", details: progressResult.error.message },
        { status: 500 }
      );
    }

    // Salvar/atualizar avatar se foi criado
    if (avatarName && avatarStats && selectedElement) {
      const { data: existingAvatar } = await supabase
        .from("story_avatars")
        .select("*")
        .eq("user_id", userId)
        .single();

      const avatarData = {
        user_id: userId,
        nome: avatarName,
        elemento: selectedElement.nome,
        vida: avatarStats.vida,
        ataque: avatarStats.ataque,
        defesa: avatarStats.defesa,
        velocidade: avatarStats.velocidade,
        nivel: avatarStats.nivel,
        vinculo: avatarStats.vinculo
      };

      if (existingAvatar) {
        await supabase
          .from("story_avatars")
          .update(avatarData)
          .eq("user_id", userId);
      } else {
        await supabase
          .from("story_avatars")
          .insert({
            ...avatarData,
            created_at: new Date().toISOString()
          });
      }
    }

    // Adicionar conquista se completou o capítulo
    if (completed) {
      const achievementData = {
        user_id: userId,
        achievement_id: 'primeiro_vinculo',
        achievement_name: 'Primeiro Vínculo'
      };

      await supabase
        .from("story_achievements")
        .insert(achievementData)
        .select();
    }

    return NextResponse.json({
      success: true,
      progress: progressResult.data[0]
    });

  } catch (error) {
    console.error("Erro no save story:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor", details: error.message },
      { status: 500 }
    );
  }
}

