import { getSupabaseAnonClient } from '@/lib/supabase/serverClient';
import { validarStats } from '../../avatares/sistemas/statsSystem';

/**
 * Sistema de Purificação - Remove Marca da Morte
 *
 * Benefícios:
 * - Remove marca_morte (avatar pode morrer e ser ressuscitado novamente)
 * - Restaura 50% dos stats perdidos na ressurreição (+15% dos stats atuais)
 * - Restaura 50% do vínculo perdido (+25% do vínculo atual)
 * - Reduz exaustão para 30 (Cansado)
 *
 * Custo: 2x o custo de ressurreição
 */

export async function POST(request) {
  console.log("=== INICIANDO RITUAL DE PURIFICAÇÃO ===");

  try {
    const supabase = getSupabaseAnonClient();
    const { userId, avatarId } = await request.json();
    console.log("Dados recebidos:", { userId, avatarId });

    if (!userId || !avatarId) {
      console.log("❌ Dados incompletos");
      return Response.json(
        { message: "Dados incompletos" },
        { status: 400 }
      );
    }

    // 1. Buscar avatar vivo com marca da morte
    console.log("Buscando avatar marcado...");
    const { data: avatar, error: avatarError } = await supabase
      .from('avatares')
      .select('*')
      .eq('id', avatarId)
      .eq('user_id', userId)
      .eq('vivo', true) // Deve estar vivo
      .eq('marca_morte', true) // Deve ter marca da morte
      .single();

    if (avatarError || !avatar) {
      console.error("❌ Erro ao buscar avatar:", avatarError);
      return Response.json(
        { message: "Avatar não encontrado ou não possui Marca da Morte" },
        { status: 404 }
      );
    }

    console.log("✅ Avatar encontrado:", avatar.nome);

    // 2. Calcular custo baseado na raridade (2x ressurreição)
    const custos = {
      'Comum': { moedas: 1000, fragmentos: 100 },
      'Raro': { moedas: 2000, fragmentos: 200 },
      'Lendário': { moedas: 3000, fragmentos: 300 }
    };

    const custo = custos[avatar.raridade] || custos['Comum'];
    console.log("Custo do ritual:", custo);

    // 3. Verificar se jogador tem recursos
    console.log("Buscando recursos do jogador...");
    const { data: stats, error: statsError } = await supabase
      .from('player_stats')
      .select('moedas, fragmentos')
      .eq('user_id', userId)
      .single();

    if (statsError || !stats) {
      console.error("❌ Erro ao buscar stats:", statsError);
      return Response.json(
        { message: "Erro ao buscar recursos: " + (statsError?.message || "Stats não encontrados") },
        { status: 500 }
      );
    }

    console.log("✅ Recursos do jogador:", stats);

    if (stats.moedas < custo.moedas || stats.fragmentos < custo.fragmentos) {
      console.log("❌ Recursos insuficientes");
      return Response.json(
        {
          message: "Recursos insuficientes para o ritual de purificação",
          necessario: custo,
          atual: { moedas: stats.moedas, fragmentos: stats.fragmentos }
        },
        { status: 400 }
      );
    }

    // 4. CALCULAR MELHORIAS (Restaura 50% do que foi perdido)
    console.log("Calculando melhorias da purificação...");

    // Stats: +15% (50% dos 30% perdidos na ressurreição)
    const statsRestaurados = {
      forca: Math.floor(avatar.forca * 1.15),
      agilidade: Math.floor(avatar.agilidade * 1.15),
      resistencia: Math.floor(avatar.resistencia * 1.15),
      foco: Math.floor(avatar.foco * 1.15)
    };

    // Validar se stats ainda estão dentro dos limites da raridade
    const validacao = validarStats(statsRestaurados, avatar.raridade);
    if (!validacao.valido) {
      console.log("⚠️ Stats fora dos limites, ajustando...");
      const RANGES = {
        'Comum': { max: 10 },
        'Raro': { max: 16 },
        'Lendário': { max: 25 }
      };
      const maximo = RANGES[avatar.raridade].max;

      Object.keys(statsRestaurados).forEach(stat => {
        if (statsRestaurados[stat] > maximo) {
          statsRestaurados[stat] = maximo;
        }
      });
    }

    console.log("Stats após purificação:", statsRestaurados);

    // Vínculo: +25% (50% dos 50% perdidos)
    const novoVinculo = Math.min(100, Math.floor((avatar.vinculo || 0) * 1.25));
    console.log(`Vínculo: ${avatar.vinculo}% → ${novoVinculo}%`);

    // Exaustão: Reduz para 30 (Cansado - um estado razoável)
    const novaExaustao = 30;
    console.log(`Exaustão: ${avatar.exaustao || 0} → ${novaExaustao} (CANSADO)`);

    // 5. Aplicar purificação
    console.log("Aplicando ritual de purificação...");
    const { error: updateAvatarError } = await supabase
      .from('avatares')
      .update({
        // Stats restaurados
        forca: statsRestaurados.forca,
        agilidade: statsRestaurados.agilidade,
        resistencia: statsRestaurados.resistencia,
        foco: statsRestaurados.foco,

        // Melhorias
        vinculo: novoVinculo,
        exaustao: novaExaustao,

        // Remover marca da morte (PODE SER RESSUSCITADO NOVAMENTE!)
        marca_morte: false
      })
      .eq('id', avatarId);

    if (updateAvatarError) {
      console.error("❌ Erro ao atualizar avatar:", updateAvatarError);
      return Response.json(
        { message: "Erro ao purificar avatar: " + updateAvatarError.message },
        { status: 500 }
      );
    }

    console.log("✅ Avatar purificado!");

    // 6. Deduzir recursos do jogador
    console.log("Deduzindo recursos do jogador...");
    const { error: updateStatsError } = await supabase
      .from('player_stats')
      .update({
        moedas: stats.moedas - custo.moedas,
        fragmentos: stats.fragmentos - custo.fragmentos
      })
      .eq('user_id', userId);

    if (updateStatsError) {
      console.error("❌ Erro ao deduzir recursos:", updateStatsError);
      return Response.json(
        { message: "Erro ao deduzir recursos: " + updateStatsError.message },
        { status: 500 }
      );
    }

    console.log("✅ Recursos deduzidos!");

    // 7. Registrar no histórico (se a tabela existir)
    try {
      await supabase
        .from('purificacoes_historico')
        .insert([{
          user_id: userId,
          avatar_id: avatarId,
          custo_moedas: custo.moedas,
          custo_fragmentos: custo.fragmentos,
          stats_antes: {
            forca: avatar.forca,
            agilidade: avatar.agilidade,
            resistencia: avatar.resistencia,
            foco: avatar.foco
          },
          stats_depois: statsRestaurados,
          vinculo_antes: avatar.vinculo,
          vinculo_depois: novoVinculo,
          exaustao_antes: avatar.exaustao,
          exaustao_depois: novaExaustao
        }]);
      console.log("✅ Histórico registrado");
    } catch (error) {
      console.log("⚠️ Histórico não registrado (tabela pode não existir)");
    }

    // 8. Buscar dados atualizados
    console.log("Buscando dados atualizados...");
    const { data: statsAtualizados } = await supabase
      .from('player_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    const { data: avatarPurificado } = await supabase
      .from('avatares')
      .select('*')
      .eq('id', avatarId)
      .single();

    console.log("✅ RITUAL DE PURIFICAÇÃO COMPLETO!");

    // Calcular ganhos para mostrar ao jogador
    const ganhos = {
      stats_ganhos: {
        forca: statsRestaurados.forca - avatar.forca,
        agilidade: statsRestaurados.agilidade - avatar.agilidade,
        resistencia: statsRestaurados.resistencia - avatar.resistencia,
        foco: statsRestaurados.foco - avatar.foco
      },
      vinculo_ganho: novoVinculo - (avatar.vinculo || 0),
      exaustao_reduzida: (avatar.exaustao || 0) - novaExaustao,
      porcentagem_melhoria: 15
    };

    return Response.json({
      success: true,
      message: "O ritual foi concluído. Seu avatar foi purificado e renovado.",
      avatar: avatarPurificado,
      stats: statsAtualizados,
      custoUtilizado: custo,
      melhorias: {
        descricao: "O Purificador canalizou luz sagrada e restaurou a essência do seu avatar:",
        ganhos: ganhos,
        avisos: [
          "✨ Marca da Morte REMOVIDA: Avatar pode ser ressuscitado novamente se morrer",
          `📈 Stats aumentados em ~15% (Força +${ganhos.stats_ganhos.forca}, Agilidade +${ganhos.stats_ganhos.agilidade}, Resistência +${ganhos.stats_ganhos.resistencia}, Foco +${ganhos.stats_ganhos.foco})`,
          `💖 Vínculo aumentado em ${ganhos.vinculo_ganho}% (${avatar.vinculo}% → ${novoVinculo}%)`,
          `😌 Exaustão reduzida para 30 (CANSADO)`,
          "🌟 Avatar está renovado e mais forte!"
        ]
      },
      lore: {
        antes: "A Marca da Morte queimava em sua alma, enfraquecendo-o...",
        depois: "Agora a luz da purificação brilha em você. A maldição foi quebrada e sua força retornou."
      }
    });

  } catch (error) {
    console.error("❌ ERRO CRÍTICO NO RITUAL:", error);
    console.error("Stack:", error.stack);
    return Response.json(
      {
        message: "O ritual falhou. Energias luminosas escaparam do controle.",
        erro_tecnico: error.message
      },
      { status: 500 }
    );
  }
}
