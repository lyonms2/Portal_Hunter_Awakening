import { getSupabaseClientSafe } from "@/lib/supabase/serverClient";
import { processarRecuperacao } from "@/app/avatares/sistemas/exhaustionSystem";

// MOVIDO PARA DENTRO DA FUNÇÃO: const supabase = getSupabaseClientSafe();

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    // Inicializar Supabase dentro da função
    const supabase = getSupabaseClientSafe(true);
    if (!supabase) {
      return Response.json(
        { message: "Serviço temporariamente indisponível" },
        { status: 503 }
      );
    }

    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return Response.json(
        { message: "ID do usuário é obrigatório" },
        { status: 400 }
      );
    }

    const { data: avatares, error } = await supabase
      .from('avatares')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Erro ao buscar avatares:", error);
      return Response.json(
        { message: "Erro ao buscar avatares: " + error.message },
        { status: 500 }
      );
    }

    // ==================== RECUPERAÇÃO PASSIVA DE EXAUSTÃO ====================
    // Para cada avatar vivo e inativo, calcular recuperação baseada em tempo real
    const avataresAtualizados = [];
    const agora = new Date();

    for (const avatar of (avatares || [])) {
      // Só processar avatares vivos com exaustão > 0
      if (!avatar.vivo || (avatar.exaustao || 0) === 0) {
        avataresAtualizados.push(avatar);
        continue;
      }

      // Calcular tempo decorrido desde última atualização
      const ultimaAtualizacao = new Date(avatar.updated_at);
      const minutosPassados = Math.floor((agora - ultimaAtualizacao) / (1000 * 60));

      // Só processar se passou pelo menos 5 minutos
      if (minutosPassados < 5) {
        avataresAtualizados.push(avatar);
        continue;
      }

      const horasPassadas = minutosPassados / 60;
      const exaustaoAtual = avatar.exaustao || 0;

      // Avatar ATIVO não recupera (está em uso)
      // Avatar INATIVO recupera mais devagar (8 pontos/hora)
      const taxaRecuperacao = avatar.ativo ? 0 : 8; // pontos por hora
      const recuperacao = Math.floor(taxaRecuperacao * horasPassadas);

      if (recuperacao > 0) {
        const novaExaustao = Math.max(0, exaustaoAtual - recuperacao);

        console.log(`🌙 Recuperação passiva - Avatar ${avatar.nome}:`, {
          exaustao_antes: exaustaoAtual,
          exaustao_depois: novaExaustao,
          minutos_passados: minutosPassados,
          recuperacao_aplicada: recuperacao
        });

        // Atualizar no banco
        const { data: avatarAtualizado, error: updateError } = await supabase
          .from('avatares')
          .update({
            exaustao: novaExaustao,
            updated_at: agora.toISOString()
          })
          .eq('id', avatar.id)
          .select()
          .single();

        if (!updateError && avatarAtualizado) {
          avataresAtualizados.push(avatarAtualizado);
        } else {
          avataresAtualizados.push(avatar);
        }
      } else {
        avataresAtualizados.push(avatar);
      }
    }

    return Response.json({
      avatares: avataresAtualizados,
      total: avataresAtualizados.length
    });
  } catch (error) {
    console.error("Erro no servidor:", error);
    return Response.json(
      { message: "Erro ao processar: " + error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    // Inicializar Supabase dentro da função
    const supabase = getSupabaseClientSafe(true);
    if (!supabase) {
      return Response.json(
        { message: "Serviço temporariamente indisponível" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { userId, avatarId } = body;

    if (!userId || !avatarId) {
      return Response.json(
        { message: "userId e avatarId são obrigatórios" },
        { status: 400 }
      );
    }

    // Verificar se o avatar existe, pertence ao usuário e está vivo
    const { data: avatarToActivate, error: checkError } = await supabase
      .from('avatares')
      .select('*')
      .eq('id', avatarId)
      .eq('user_id', userId)
      .single();

    if (checkError || !avatarToActivate) {
      return Response.json(
        { message: "Avatar não encontrado ou não pertence ao usuário" },
        { status: 404 }
      );
    }

    if (!avatarToActivate.vivo) {
      return Response.json(
        { message: "Não é possível ativar um avatar destruído" },
        { status: 400 }
      );
    }

    // Desativar todos os avatares do usuário
    const { error: deactivateError } = await supabase
      .from('avatares')
      .update({ ativo: false })
      .eq('user_id', userId);

    if (deactivateError) {
      console.error("Erro ao desativar avatares:", deactivateError);
      return Response.json(
        { message: "Erro ao desativar avatares: " + deactivateError.message },
        { status: 500 }
      );
    }

    // Ativar o avatar escolhido
    const { data: avatarAtivado, error: activateError } = await supabase
      .from('avatares')
      .update({ ativo: true })
      .eq('id', avatarId)
      .select()
      .single();

    if (activateError || !avatarAtivado) {
      console.error("Erro ao ativar avatar:", activateError);
      return Response.json(
        { message: "Erro ao ativar avatar" },
        { status: 500 }
      );
    }

    // Buscar todos os avatares atualizados
    const { data: todosAvatares } = await supabase
      .from('avatares')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return Response.json({
      success: true,
      message: "Avatar ativado com sucesso!",
      avatar: avatarAtivado,
      avatares: todosAvatares || []
    });

  } catch (error) {
    console.error("Erro crítico:", error);
    return Response.json(
      { message: "Erro ao processar requisição" },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    // Inicializar Supabase dentro da função
    const supabase = getSupabaseClientSafe(true);
    if (!supabase) {
      return Response.json(
        { message: "Serviço temporariamente indisponível" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { userId, avatarId } = body;

    if (!userId || !avatarId) {
      return Response.json(
        { message: "userId e avatarId são obrigatórios" },
        { status: 400 }
      );
    }

    // Verificar se o avatar pertence ao usuário
    const { data: avatar, error: checkError } = await supabase
      .from('avatares')
      .select('*')
      .eq('id', avatarId)
      .eq('user_id', userId)
      .single();

    if (checkError || !avatar) {
      return Response.json(
        { message: "Avatar não encontrado" },
        { status: 404 }
      );
    }

    // Deletar o avatar
    const { error: deleteError } = await supabase
      .from('avatares')
      .delete()
      .eq('id', avatarId);

    if (deleteError) {
      console.error("Erro ao deletar avatar:", deleteError);
      return Response.json(
        { message: "Erro ao deletar avatar" },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      message: "Avatar removido com sucesso"
    });

  } catch (error) {
    console.error("Erro ao deletar:", error);
    return Response.json(
      { message: "Erro ao processar requisição" },
      { status: 500 }
    );
  }
}
