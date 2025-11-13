import { getSupabaseClientSafe } from "@/lib/supabase/serverClient";

// Importar sistemas
import { ELEMENTOS, aplicarBonusElemental } from '../../avatares/sistemas/elementalSystem';
import { gerarStatsBalanceados } from '../../avatares/sistemas/statsSystem';
import { selecionarHabilidadesIniciais } from '../../avatares/sistemas/abilitiesSystem';
import { gerarNomeCompleto, gerarDescricaoNarrativa } from '../../avatares/sistemas/loreSystem';

// MOVIDO PARA DENTRO DA FUNÇÃO: const supabase = getSupabaseClientSafe();

// ==================== FUNÇÕES DE GERAÇÃO ====================

function escolherAleatorio(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Determina raridade baseado em probabilidades balanceadas
 * Primeira invocação sempre é Comum
 */
function determinarRaridade(primeiraInvocacao = false) {
  if (primeiraInvocacao) {
    return 'Comum';
  }

  const rand = Math.random() * 100;
  
  // 70% Comum, 28% Raro, 2% Lendário
  if (rand < 70) return 'Comum';
  if (rand < 98) return 'Raro';
  return 'Lendário';
}

/**
 * Gera um avatar completo usando todos os sistemas
 */
function gerarAvatarCompleto(primeiraInvocacao = false) {
  console.log("=== GERANDO AVATAR COM NOVOS SISTEMAS ===");
  
  // 1. DETERMINAR RARIDADE
  const raridade = determinarRaridade(primeiraInvocacao);
  console.log(`Raridade: ${raridade}`);
  
  // 2. ESCOLHER ELEMENTO ALEATÓRIO
  const elementosDisponiveis = Object.values(ELEMENTOS);
  const elemento = escolherAleatorio(elementosDisponiveis);
  console.log(`Elemento: ${elemento}`);
  
  // 3. GERAR NOME COM LORE SYSTEM
  const nome = gerarNomeCompleto(elemento, raridade);
  console.log(`Nome: ${nome}`);
  
  // 4. GERAR DESCRIÇÃO NARRATIVA
  const descricao = gerarDescricaoNarrativa(elemento, raridade);
  console.log(`Descrição: ${descricao.substring(0, 50)}...`);
  
  // 5. GERAR STATS BALANCEADOS
  const statsBase = gerarStatsBalanceados(raridade, elemento);
  console.log(`Stats base gerados:`, statsBase);
  
  // 6. APLICAR BÔNUS ELEMENTAL (já aplicado no gerarStatsBalanceados)
  const stats = statsBase;
  
  // 7. SELECIONAR HABILIDADES
  const habilidades = selecionarHabilidadesIniciais(elemento, raridade);
  console.log(`Habilidades selecionadas: ${habilidades.length}`);
  
  // 8. MONTAR AVATAR COMPLETO
  const avatar = {
    nome,
    descricao,
    elemento,
    raridade,
    nivel: 1,
    experiencia: 0,
    vinculo: 0,
    exaustao: 0, // Novo sistema de exaustão
    
    // Stats
    forca: stats.forca,
    agilidade: stats.agilidade,
    resistencia: stats.resistencia,
    foco: stats.foco,
    
    // Habilidades (salvar objeto completo para funcionar em batalha)
    habilidades: habilidades.map(hab => ({
      nome: hab.nome,
      descricao: hab.descricao,
      tipo: hab.tipo,
      raridade: hab.raridade,
      elemento: hab.elemento,
      // Campos críticos para batalha
      custo_energia: hab.custo_energia,
      cooldown: hab.cooldown,
      dano_base: hab.dano_base,
      multiplicador_stat: hab.multiplicador_stat,
      stat_primario: hab.stat_primario,
      efeitos_status: hab.efeitos_status || [],
      alvo: hab.alvo,
      area: hab.area,
      num_alvos: hab.num_alvos,
      chance_acerto: hab.chance_acerto,
      chance_efeito: hab.chance_efeito,
      duracao_efeito: hab.duracao_efeito,
      nivel_minimo: hab.nivel_minimo,
      vinculo_minimo: hab.vinculo_minimo
    })),
    
    // Status
    vivo: true,
    ativo: false,
    marca_morte: false // Garantir que seja boolean
    
    // ❌ REMOVIDO: primeira_invocacao (metadado não vai pro banco)
    // ❌ REMOVIDO: data_invocacao (usando created_at do banco)
  };
  
  console.log("Avatar completo gerado!");
  return avatar;
}

// ==================== API ROUTE ====================

export async function POST(request) {
  console.log("=== INICIANDO INVOCAÇÃO COM SISTEMAS INTEGRADOS ===");

  try {
    // Inicializar Supabase dentro da função
    const supabase = getSupabaseClientSafe(true);
    if (!supabase) {
      return Response.json(
        { message: "Serviço temporariamente indisponível" },
        { status: 503 }
      );
    }

    const { userId } = await request.json();

    if (!userId) {
      return Response.json(
        { message: "ID do usuário é obrigatório" },
        { status: 400 }
      );
    }

    console.log("Buscando stats do jogador:", userId);

    // Buscar stats do jogador
    const { data: stats, error: statsError } = await supabase
      .from('player_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (statsError || !stats) {
      console.error("Erro ao buscar stats:", statsError);
      return Response.json(
        { message: "Jogador não encontrado. Inicialize o jogador primeiro." },
        { status: 404 }
      );
    }

    console.log("Stats encontrados:", stats);

    // Verificar se é primeira invocação
    const ehPrimeiraInvocacao = stats.primeira_invocacao;
    const custoMoedas = ehPrimeiraInvocacao ? 0 : 100;
    const custoFragmentos = ehPrimeiraInvocacao ? 0 : 0;

    console.log("Primeira invocação?", ehPrimeiraInvocacao);
    console.log("Custo:", custoMoedas, "moedas");

    // Verificar recursos
    if (!ehPrimeiraInvocacao && stats.moedas < custoMoedas) {
      return Response.json(
        { 
          message: "Moedas insuficientes para invocação",
          recursos_necessarios: { moedas: custoMoedas, fragmentos: custoFragmentos },
          recursos_atuais: { moedas: stats.moedas, fragmentos: stats.fragmentos }
        },
        { status: 400 }
      );
    }

    console.log("Gerando avatar com sistemas integrados...");

    // GERAR AVATAR COM TODOS OS SISTEMAS
    const avatarGerado = gerarAvatarCompleto(ehPrimeiraInvocacao);
    avatarGerado.user_id = userId;
    // ❌ REMOVIDO: avatarGerado.data_invocacao (coluna não existe no banco)

    console.log("Avatar gerado:", {
      nome: avatarGerado.nome,
      raridade: avatarGerado.raridade,
      elemento: avatarGerado.elemento,
      stats: {
        forca: avatarGerado.forca,
        agilidade: avatarGerado.agilidade,
        resistencia: avatarGerado.resistencia,
        foco: avatarGerado.foco
      },
      habilidades: avatarGerado.habilidades.length
    });

    // Inserir avatar no banco
    const { data: avatar, error: avatarError } = await supabase
      .from('avatares')
      .insert([avatarGerado])
      .select()
      .single();

    if (avatarError) {
      console.error("Erro ao inserir avatar:", avatarError);
      return Response.json(
        { message: "Erro ao criar avatar: " + avatarError.message },
        { status: 500 }
      );
    }

    console.log("Avatar inserido no banco com ID:", avatar.id);

    // Atualizar recursos do jogador
    const novosMoedas = stats.moedas - custoMoedas;
    const novosFragmentos = stats.fragmentos - custoFragmentos;

    const { error: updateError } = await supabase
      .from('player_stats')
      .update({
        moedas: novosMoedas,
        fragmentos: novosFragmentos,
        primeira_invocacao: false
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error("Erro ao atualizar stats:", updateError);
      // Não retornar erro aqui, avatar já foi criado
    }

    console.log("Stats atualizados. Novas moedas:", novosMoedas);

    // Registrar no histórico (se a tabela existir)
    try {
      await supabase
        .from('invocacoes_historico')
        .insert([{
          user_id: userId,
          avatar_id: avatar.id,
          custo_moedas: custoMoedas,
          custo_fragmentos: custoFragmentos,
          gratuita: ehPrimeiraInvocacao,
          raridade: avatar.raridade,
          elemento: avatar.elemento
        }]);
    } catch (error) {
      console.log("Erro ao registrar histórico (ignorado):", error.message);
      // Não bloqueia a invocação se histórico falhar
    }

    // Mensagem especial baseada na raridade
    let mensagemEspecial = "";
    if (avatar.raridade === 'Lendário') {
      mensagemEspecial = "🌟 INVOCAÇÃO LENDÁRIA! Uma entidade primordial atendeu ao seu chamado!";
    } else if (avatar.raridade === 'Raro') {
      mensagemEspecial = "✨ Invocação rara! Um guardião experiente se apresenta!";
    } else {
      mensagemEspecial = ehPrimeiraInvocacao 
        ? "🎉 Primeira invocação concluída! Este é o início de uma grande jornada."
        : "Avatar invocado com sucesso!";
    }

    console.log("✅ Invocação concluída com sucesso!");

    return Response.json({
      message: mensagemEspecial,
      avatar: {
        ...avatar,
        // Adicionar informações extras para o frontend
        total_stats: avatar.forca + avatar.agilidade + avatar.resistencia + avatar.foco,
        primeira_invocacao: ehPrimeiraInvocacao
      },
      custos: {
        moedas: custoMoedas,
        fragmentos: custoFragmentos,
        gratuita: ehPrimeiraInvocacao
      },
      recursos_restantes: {
        moedas: novosMoedas,
        fragmentos: novosFragmentos
      },
      sistemas_aplicados: {
        elemental: true,
        stats: true,
        abilities: true,
        lore: true,
        progression: true,
        bond: true,
        exhaustion: true
      }
    });

  } catch (error) {
    console.error("❌ ERRO CRÍTICO:", error);
    return Response.json(
      { message: "Erro ao processar invocação: " + error.message },
      { status: 500 }
    );
  }
}
