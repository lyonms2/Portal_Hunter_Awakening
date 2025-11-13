import { getSupabaseAnonClient } from '@/lib/supabase/serverClient';
import { validarStats } from '../../avatares/sistemas/statsSystem';

// MOVIDO PARA DENTRO DA FUNÇÃO: const supabase = getSupabaseAnonClient();

/**
 * Sistema de Ressurreição Balanceado
 * 
 * Penalidades:
 * - Stats reduzidos em 30% (não 50%)
 * - Vínculo reduzido em 50% (não zerado)
 * - XP reduzida em 30%
 * - Exaustão aumentada para 60 (Exausto)
 * - Marca da Morte permanente
 */

export async function POST(request) {
  console.log("=== INICIANDO RITUAL DE RESSURREIÇÃO ===");

  try {
    // Inicializar Supabase dentro da função
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

    // 1. Buscar avatar morto
    console.log("Buscando avatar morto...");
    const { data: avatar, error: avatarError } = await supabase
      .from('avatares')
      .select('*')
      .eq('id', avatarId)
      .eq('user_id', userId)
      .eq('vivo', false)
      .single();

    if (avatarError) {
      console.error("❌ Erro ao buscar avatar:", avatarError);
      return Response.json(
        { message: "Erro ao buscar avatar: " + avatarError.message },
        { status: 404 }
      );
    }

    if (!avatar) {
      console.log("❌ Avatar não encontrado");
      return Response.json(
        { message: "Avatar não encontrado ou não está morto" },
        { status: 404 }
      );
    }

    console.log("✅ Avatar encontrado:", avatar.nome);

    // Verificar se já tem marca da morte
    if (avatar.marca_morte) {
      console.log("⚠️ Avatar já possui Marca da Morte");
      return Response.json(
        { 
          message: "Este avatar já foi ressuscitado uma vez e carrega a Marca da Morte. Não pode ser ressuscitado novamente.",
          aviso: "A morte é permanente para aqueles marcados pelo Necromante."
        },
        { status: 400 }
      );
    }

    // 2. Calcular custo baseado na raridade
    const custos = {
      'Comum': { moedas: 500, fragmentos: 50 },
      'Raro': { moedas: 1000, fragmentos: 100 },
      'Lendário': { moedas: 1500, fragmentos: 150 }
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

    if (statsError) {
      console.error("❌ Erro ao buscar stats:", statsError);
      return Response.json(
        { message: "Erro ao buscar recursos: " + statsError.message },
        { status: 500 }
      );
    }

    if (!stats) {
      console.log("❌ Stats não encontrados");
      return Response.json(
        { message: "Jogador não encontrado" },
        { status: 404 }
      );
    }

    console.log("✅ Recursos do jogador:", stats);

    if (stats.moedas < custo.moedas || stats.fragmentos < custo.fragmentos) {
      console.log("❌ Recursos insuficientes");
      return Response.json(
        { 
          message: "Recursos insuficientes para o ritual de ressurreição",
          necessario: custo,
          atual: { moedas: stats.moedas, fragmentos: stats.fragmentos }
        },
        { status: 400 }
      );
    }

    // 4. CALCULAR PENALIDADES BALANCEADAS
    console.log("Calculando penalidades do ritual...");
    
    // Stats: -30% (mais justo que -50%)
    const statsReduzidos = {
      forca: Math.floor(avatar.forca * 0.7),
      agilidade: Math.floor(avatar.agilidade * 0.7),
      resistencia: Math.floor(avatar.resistencia * 0.7),
      foco: Math.floor(avatar.foco * 0.7)
    };

    // Validar se stats ainda estão dentro dos limites da raridade
    const validacao = validarStats(statsReduzidos, avatar.raridade);
    if (!validacao.valido) {
      console.log("⚠️ Stats fora dos limites, ajustando...");
      // Se ficaram abaixo do mínimo, ajustar para o mínimo da raridade
      const RANGES = {
        'Comum': { min: 5 },
        'Raro': { min: 10 },
        'Lendário': { min: 16 }
      };
      const minimo = RANGES[avatar.raridade].min;
      
      Object.keys(statsReduzidos).forEach(stat => {
        if (statsReduzidos[stat] < minimo) {
          statsReduzidos[stat] = minimo;
        }
      });
    }

    console.log("Stats após ressurreição:", statsReduzidos);

    // Vínculo: -50% (não zera completamente)
    const novoVinculo = Math.floor((avatar.vinculo || 0) * 0.5);
    console.log(`Vínculo: ${avatar.vinculo}% → ${novoVinculo}%`);

    // XP: -30% (perde parte da experiência)
    const novaXP = Math.floor((avatar.experiencia || 0) * 0.7);
    console.log(`XP: ${avatar.experiencia} → ${novaXP}`);

    // Exaustão: Sobe para 60 (estado Exausto)
    const novaExaustao = 60;
    console.log(`Exaustão: ${avatar.exaustao || 0} → ${novaExaustao} (EXAUSTO)`);

    // 5. Aplicar ressurreição
    console.log("Aplicando ritual de ressurreição...");
    const { error: updateAvatarError } = await supabase
      .from('avatares')
      .update({
        // Status
        vivo: true,
        ativo: false, // Não ativa automaticamente
        
        // Stats reduzidos
        forca: statsReduzidos.forca,
        agilidade: statsReduzidos.agilidade,
        resistencia: statsReduzidos.resistencia,
        foco: statsReduzidos.foco,
        
        // Penalidades
        vinculo: novoVinculo,
        experiencia: novaXP,
        exaustao: novaExaustao,
        
        // Marca permanente
        marca_morte: true
      })
      .eq('id', avatarId);

    if (updateAvatarError) {
      console.error("❌ Erro ao atualizar avatar:", updateAvatarError);
      return Response.json(
        { message: "Erro ao ressuscitar avatar: " + updateAvatarError.message },
        { status: 500 }
      );
    }

    console.log("✅ Avatar ressuscitado!");

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
        .from('ressurreicoes_historico')
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
          stats_depois: statsReduzidos,
          vinculo_antes: avatar.vinculo,
          vinculo_depois: novoVinculo,
          xp_antes: avatar.experiencia,
          xp_depois: novaXP
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

    const { data: avatarRessuscitado } = await supabase
      .from('avatares')
      .select('*')
      .eq('id', avatarId)
      .single();

    console.log("✅ RITUAL DE RESSURREIÇÃO COMPLETO!");

    // Calcular perdas para mostrar ao jogador
    const perdas = {
      stats_perdidos: {
        forca: avatar.forca - statsReduzidos.forca,
        agilidade: avatar.agilidade - statsReduzidos.agilidade,
        resistencia: avatar.resistencia - statsReduzidos.resistencia,
        foco: avatar.foco - statsReduzidos.foco
      },
      vinculo_perdido: (avatar.vinculo || 0) - novoVinculo,
      xp_perdida: (avatar.experiencia || 0) - novaXP,
      porcentagem_reducao: 30
    };

    return Response.json({
      success: true,
      message: "O ritual foi concluído. Seu avatar retornou do além, mas carrega cicatrizes profundas.",
      avatar: avatarRessuscitado,
      stats: statsAtualizados,
      custoUtilizado: custo,
      penalidades: {
        descricao: "O Necromante arrancou sua alma do vazio, mas o preço foi alto:",
        perdas: perdas,
        avisos: [
          "💀 Marca da Morte: Este avatar não pode ser ressuscitado novamente",
          `📉 Stats reduzidos em 30%`,
          `💔 Vínculo reduzido em 50% (${avatar.vinculo}% → ${novoVinculo}%)`,
          `📖 XP reduzida em 30% (${avatar.experiencia} → ${novaXP})`,
          `😰 Estado: EXAUSTO (60/100 exaustão)`,
          "⏳ Necessita descanso antes de combater"
        ]
      },
      lore: {
        antes: "A morte havia levado sua essência para o vazio...",
        depois: "Agora retorna, enfraquecido, mas vivo. A Marca da Morte queimará eternamente em sua alma."
      }
    });

  } catch (error) {
    console.error("❌ ERRO CRÍTICO NO RITUAL:", error);
    console.error("Stack:", error.stack);
    return Response.json(
      { 
        message: "O ritual falhou catastroficamente. Energias sombrias escaparam do controle.",
        erro_tecnico: error.message 
      },
      { status: 500 }
    );
  }
}
