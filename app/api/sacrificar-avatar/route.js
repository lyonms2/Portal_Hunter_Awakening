import { getSupabaseClientSafe } from "@/lib/supabase/serverClient";

export async function POST(request) {
  try {
    const supabase = getSupabaseClientSafe(true);
    if (!supabase) {
      return Response.json(
        { message: "Serviço temporariamente indisponível" },
        { status: 503 }
      );
    }

    const { userId, avatarId } = await request.json();

    if (!userId || !avatarId) {
      return Response.json(
        { message: "userId e avatarId são obrigatórios" },
        { status: 400 }
      );
    }

    // Verificar se o avatar pertence ao usuário
    const { data: avatar, error: avatarError } = await supabase
      .from('avatares')
      .select('*')
      .eq('id', avatarId)
      .eq('user_id', userId)
      .single();

    if (avatarError || !avatar) {
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
    const { error: updateError } = await supabase
      .from('avatares')
      .update({
        vivo: false,
        hp_atual: 0,
        marca_morte: true, // Marca da morte - vai pro memorial
        ativo: false
      })
      .eq('id', avatarId);

    if (updateError) {
      console.error("Erro ao sacrificar avatar:", updateError);
      return Response.json(
        { message: "Erro ao sacrificar avatar" },
        { status: 500 }
      );
    }

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
