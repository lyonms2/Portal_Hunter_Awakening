import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId é obrigatório" },
        { status: 400 }
      );
    }

    // Delete the user's story progress
    const { error } = await supabase
      .from("story_progress")
      .delete()
      .eq("user_id", userId);

    if (error) {
      console.error("Erro ao resetar progresso:", error);
      return NextResponse.json(
        { error: "Erro ao resetar progresso", details: error.message },
        { status: 500 }
      );
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
