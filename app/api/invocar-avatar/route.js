import { getDocument, getDocuments, createDocument, updateDocument } from "@/lib/firebase/firestore";

// Importar sistemas
import { ELEMENTOS, aplicarBonusElemental } from '../../avatares/sistemas/elementalSystem';
import { gerarStatsBalanceados } from '../../avatares/sistemas/statsSystem';
import { selecionarHabilidadesIniciais } from '../../avatares/sistemas/abilitiesSystem';
import { gerarNomeCompleto, gerarDescricaoNarrativa } from '../../avatares/sistemas/loreSystem';
import { getHunterRank, aplicarBonusInvocacao, calcularXpFeito, verificarPromocao } from '@/lib/hunter/hunterRankSystem';

// ==================== FUNÇÕES DE GERAÇÃO ====================

function escolherAleatorio(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Determina raridade baseado em probabilidades balanceadas
 * Primeira invocação sempre é Comum
 * Aplica bônus do rank do caçador
 */
function determinarRaridade(primeiraInvocacao = false, hunterRank = null) {
  if (primeiraInvocacao) {
    return 'Comum';
  }

  // Chances base: 70% Comum, 28% Raro, 2% Lendário
  let chancesBase = {
    comum: 0.70,
    raro: 0.28,
    lendario: 0.02
  };

  // Aplicar bônus do rank do caçador
  if (hunterRank) {
    chancesBase = aplicarBonusInvocacao(chancesBase, hunterRank);
  }

  const rand = Math.random();

  // Verificar do mais raro para o mais comum
  if (rand < chancesBase.lendario) return 'Lendário';
  if (rand < chancesBase.lendario + chancesBase.raro) return 'Raro';
  return 'Comum';
}

/**
 * Gera um avatar completo usando todos os sistemas
 */
function gerarAvatarCompleto(primeiraInvocacao = false, hunterRank = null) {
  console.log("=== GERANDO AVATAR COM NOVOS SISTEMAS ===");

  // 1. DETERMINAR RARIDADE (com bônus do rank)
  const raridade = determinarRaridade(primeiraInvocacao, hunterRank);
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
    const { userId } = await request.json();

    if (!userId) {
      return Response.json(
        { message: "ID do usuário é obrigatório" },
        { status: 400 }
      );
    }

    console.log("Buscando stats do jogador:", userId);

    // Buscar stats do jogador do Firestore
    const stats = await getDocument('player_stats', userId);

    if (!stats) {
      console.error("Jogador não encontrado");
      return Response.json(
        { message: "Jogador não encontrado. Inicialize o jogador primeiro." },
        { status: 404 }
      );
    }

    console.log("Stats encontrados:", stats);

    // Verificar se é primeira invocação
    const ehPrimeiraInvocacao = stats.primeira_invocacao;
    const custoMoedas = ehPrimeiraInvocacao ? 0 : 250;
    const custoFragmentos = ehPrimeiraInvocacao ? 0 : 5;

    console.log("Primeira invocação?", ehPrimeiraInvocacao);
    console.log("Custo:", custoMoedas, "moedas");

    // Verificar recursos
    if (!ehPrimeiraInvocacao && (stats.moedas < custoMoedas || stats.fragmentos < custoFragmentos)) {
      return Response.json(
        {
          message: stats.moedas < custoMoedas
            ? "Moedas insuficientes para invocação"
            : "Fragmentos insuficientes para invocação",
          recursos_necessarios: { moedas: custoMoedas, fragmentos: custoFragmentos },
          recursos_atuais: { moedas: stats.moedas, fragmentos: stats.fragmentos }
        },
        { status: 400 }
      );
    }

    // Verificar limite de avatares (avatares no memorial não contam)
    console.log("Verificando limite de avatares...");
    const avatares = await getDocuments('avatares', {
      where: [['user_id', '==', userId]]
    });

    if (!avatares) {
      console.error("Erro ao contar avatares");
      return Response.json(
        { message: "Erro ao verificar limite de avatares" },
        { status: 500 }
      );
    }

    // Contar apenas avatares que não estão no memorial (vivos OU mortos sem marca_morte)
    const LIMITE_AVATARES = 15;
    const avataresConta = avatares.filter(av => !(av.marca_morte && !av.vivo)).length;

    console.log(`Avatares contados: ${avataresConta}/${LIMITE_AVATARES}`);

    if (avataresConta >= LIMITE_AVATARES) {
      console.log("❌ Limite de avatares atingido!");
      return Response.json(
        {
          message: "Você atingiu o limite de 15 avatares! Sacrifique avatares inativos ou espere que morram em combate para liberar espaço.",
          limite: LIMITE_AVATARES,
          avatares_atuais: avataresConta,
          slots_disponiveis: 0
        },
        { status: 400 }
      );
    }

    console.log("Gerando avatar com sistemas integrados...");

    // Obter rank do caçador para aplicar bônus
    const hunterRank = getHunterRank(stats.hunterRankXp || 0);
    console.log(`Hunter Rank: ${hunterRank.nome} (${stats.hunterRankXp || 0} XP)`);

    // GERAR AVATAR COM TODOS OS SISTEMAS
    const avatarGerado = gerarAvatarCompleto(ehPrimeiraInvocacao, hunterRank);
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

    // Inserir avatar no Firestore (sem especificar ID, deixar Firestore gerar)
    const avatarId = await createDocument('avatares', avatarGerado);

    if (!avatarId) {
      console.error("Erro ao inserir avatar");
      return Response.json(
        { message: "Erro ao criar avatar" },
        { status: 500 }
      );
    }

    const avatar = { id: avatarId, ...avatarGerado };

    console.log("Avatar inserido no banco com ID:", avatar.id);

    // Atualizar recursos do jogador no Firestore
    const novosMoedas = stats.moedas - custoMoedas;
    const novosFragmentos = stats.fragmentos - custoFragmentos;

    // Calcular XP de rank ganho por invocar avatar
    const xpGanho = calcularXpFeito('AVATAR_INVOCADO');
    const xpAnterior = stats.hunterRankXp || 0;
    const novoHunterRankXp = xpAnterior + xpGanho;

    // Verificar promoção de rank
    const promocao = verificarPromocao(xpAnterior, novoHunterRankXp);

    try {
      await updateDocument('player_stats', userId, {
        moedas: novosMoedas,
        fragmentos: novosFragmentos,
        hunterRankXp: novoHunterRankXp,
        primeira_invocacao: false
      });
    } catch (updateError) {
      console.error("Erro ao atualizar stats:", updateError);
      // Não retornar erro aqui, avatar já foi criado
    }

    console.log("Stats atualizados. Novas moedas:", novosMoedas);

    // Registrar no histórico (se a coleção existir)
    try {
      await createDocument('invocacoes_historico', {
        user_id: userId,
        avatar_id: avatar.id,
        custo_moedas: custoMoedas,
        custo_fragmentos: custoFragmentos,
        gratuita: ehPrimeiraInvocacao,
        raridade: avatar.raridade,
        elemento: avatar.elemento
      });
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
      hunterRank: {
        xpGanho,
        xpTotal: novoHunterRankXp,
        rank: getHunterRank(novoHunterRankXp),
        promocao: promocao.promovido ? promocao : null
      },
      sistemas_aplicados: {
        elemental: true,
        stats: true,
        abilities: true,
        lore: true,
        progression: true,
        bond: true,
        exhaustion: true,
        hunterRank: true
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
