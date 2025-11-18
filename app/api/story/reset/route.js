import { getSupabaseAnonClient } from "@/lib/supabase/serverClient";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const supabase = getSupabaseAnonClient();
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId é obrigatório" },
        { status: 400 }
      );
    }

    // Delete all story data for this user
    // 1. Delete progress
    const { error: progressError } = await supabase
      .from("story_progress")
      .delete()
      .eq("user_id", userId);

    if (progressError) {
      console.error("Erro ao deletar progresso:", progressError);
    }

    // 2. Delete avatar
    const { error: avatarError } = await supabase
      .from("story_avatars")
      .delete()
      .eq("user_id", userId);

    if (avatarError) {
      console.error("Erro ao deletar avatar:", avatarError);
    }

    // 3. Delete achievements
    const { error: achievementsError } = await supabase
      .from("story_achievements")
      .delete()
      .eq("user_id", userId);

    if (achievementsError) {
      console.error("Erro ao deletar conquistas:", achievementsError);
    }

    return NextResponse.json({
      success: true,
      message: "Progresso resetado com sucesso"
    });

  } catch (error) {
    console.error("Erro no reset story:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor", details: error.message },
      { status: 500 }
    );
  }
}

