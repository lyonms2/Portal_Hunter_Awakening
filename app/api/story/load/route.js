import { createClient } from "@/lib/supabase/serverClient";
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

    const chapter = 1; // Capítulo 1 por enquanto

    // Buscar progresso
    const { data: progressData, error: progressError } = await supabase
      .from("story_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("chapter", chapter)
      .single();

    // Buscar avatar
    const { data: avatarData } = await supabase
      .from("story_avatars")
      .select("*")
      .eq("user_id", userId)
      .single();

    // Buscar conquistas
    const { data: achievementsData } = await supabase
      .from("story_achievements")
      .select("*")
      .eq("user_id", userId);

    if (progressError) {
      // If no progress found, return null (not an error)
      if (progressError.code === "PGRST116") {
        return NextResponse.json({
          progress: null,
          avatar: null,
          achievements: []
        });
      }

      console.error("Erro ao carregar progresso:", progressError);
      return NextResponse.json(
        { error: "Erro ao carregar progresso", details: progressError.message },
        { status: 500 }
      );
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

