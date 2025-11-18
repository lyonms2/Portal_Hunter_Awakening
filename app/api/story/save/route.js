import { createClient } from "@/utils/supabase/server";
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

    // Check if progress already exists
    const { data: existing } = await supabase
      .from("story_progress")
      .select("*")
      .eq("user_id", userId)
      .single();

    const progressData = {
      user_id: userId,
      story_phase: storyPhase,
      scene_index: sceneIndex,
      player_choices: playerChoices || [],
      selected_element: selectedElement,
      avatar_name: avatarName,
      avatar_stats: avatarStats,
      completed_at: completed ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    };

    let result;

    if (existing) {
      // Update existing progress
      result = await supabase
        .from("story_progress")
        .update(progressData)
        .eq("user_id", userId)
        .select();
    } else {
      // Insert new progress
      result = await supabase
        .from("story_progress")
        .insert({
          ...progressData,
          created_at: new Date().toISOString()
        })
        .select();
    }

    if (result.error) {
      console.error("Erro ao salvar progresso:", result.error);
      return NextResponse.json(
        { error: "Erro ao salvar progresso", details: result.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      progress: result.data[0]
    });

  } catch (error) {
    console.error("Erro no save story:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor", details: error.message },
      { status: 500 }
    );
  }
}
