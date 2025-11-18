import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId é obrigatório" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("story_progress")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      // If no progress found, return null (not an error)
      if (error.code === "PGRST116") {
        return NextResponse.json({
          progress: null
        });
      }

      console.error("Erro ao carregar progresso:", error);
      return NextResponse.json(
        { error: "Erro ao carregar progresso", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      progress: data
    });

  } catch (error) {
    console.error("Erro no load story:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor", details: error.message },
      { status: 500 }
    );
  }
}
