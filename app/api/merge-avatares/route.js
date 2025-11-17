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

    const { userId, avatarBaseId, avatarSacrificioId } = await request.json();

    // Validações básicas
    if (!userId || !avatarBaseId || !avatarSacrificioId) {
      return Response.json(
        { message: "userId, avatarBaseId e avatarSacrificioId são obrigatórios" },
        { status: 400 }
      );
    }

    if (avatarBaseId === avatarSacrificioId) {
      return Response.json(
        { message: "Não é possível fundir um avatar com ele mesmo" },
        { status: 400 }
      );
    }

    // 1. Buscar avatar base
    const { data: avatarBase, error: baseError } = await supabase
      .from('avatares')
      .select('*')
      .eq('id', avatarBaseId)
      .eq('user_id', userId)
      .single();

    if (baseError || !avatarBase) {
      return Response.json(
        { message: "Avatar base não encontrado ou não pertence a você" },
        { status: 404 }
      );
    }

    // 2. Buscar avatar sacrifício
    const { data: avatarSacrificio, error: sacrificioError } = await supabase
      .from('avatares')
      .select('*')
      .eq('id', avatarSacrificioId)
      .eq('user_id', userId)
      .single();

    if (sacrificioError || !avatarSacrificio) {
      return Response.json(
        { message: "Avatar de sacrifício não encontrado ou não pertence a você" },
        { status: 404 }
      );
    }

    // 3. Validar que ambos estão vivos e inativos
    if (!avatarBase.vivo || avatarBase.ativo) {
      return Response.json(
        { message: "Avatar base deve estar vivo e inativo" },
        { status: 400 }
      );
    }

    if (!avatarSacrificio.vivo || avatarSacrificio.ativo) {
      return Response.json(
        { message: "Avatar de sacrifício deve estar vivo e inativo" },
        { status: 400 }
      );
    }

    // 3.5. Verificar limite de merges (máximo 8)
    const mergeCount = avatarBase.merge_count || 0;
    if (mergeCount >= 8) {
      return Response.json(
        { message: "Este avatar atingiu o limite máximo de fusões (8)" },
        { status: 400 }
      );
    }

    // 3.6. Calcular chance de sucesso baseada em merge_count
    // 0 merges: 100%, 1: 92.5%, 2: 85%, 3: 77.5%, 4: 70%, 5: 62.5%, 6: 55%, 7: 47.5%, 8: 40%
    const chanceBase = 100;
    const reducaoPorMerge = 7.5;
    const chanceMinima = 40;
    const chanceSucesso = Math.max(chanceBase - (mergeCount * reducaoPorMerge), chanceMinima);

    // 3.7. Rolar para ver se o merge é bem sucedido
    const roll = Math.random() * 100;
    const mergeSuccessful = roll <= chanceSucesso;

    // 4. Calcular custo
    const nivelTotal = avatarBase.nivel + avatarSacrificio.nivel;
    const multiplicador = avatarBase.raridade === 'Lendário' ? 2 :
                          avatarBase.raridade === 'Raro' ? 1.5 : 1;

    const custoMoedas = Math.floor(nivelTotal * 100 * multiplicador);
    const custoFragmentos = Math.floor(nivelTotal * 10 * multiplicador);

    // 5. Buscar stats do player
    const { data: playerStats, error: statsError } = await supabase
      .from('player_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (statsError || !playerStats) {
      return Response.json(
        { message: "Erro ao carregar estatísticas do jogador" },
        { status: 500 }
      );
    }

    // 6. Verificar se tem saldo
    if (playerStats.moedas < custoMoedas) {
      return Response.json(
        { message: `Moedas insuficientes. Você tem ${playerStats.moedas}, precisa de ${custoMoedas}` },
        { status: 400 }
      );
    }

    if (playerStats.fragmentos < custoFragmentos) {
      return Response.json(
        { message: `Fragmentos insuficientes. Você tem ${playerStats.fragmentos}, precisa de ${custoFragmentos}` },
        { status: 400 }
      );
    }

    // 7. Calcular ganhos de stats (30% do sacrifício)
    const ganhoForca = Math.floor(avatarSacrificio.forca * 0.3);
    const ganhoAgilidade = Math.floor(avatarSacrificio.agilidade * 0.3);
    const ganhoResistencia = Math.floor(avatarSacrificio.resistencia * 0.3);
    const ganhoFoco = Math.floor(avatarSacrificio.foco * 0.3);

    // 8. Rolar chance de transmutação de elemento (30% se elementos forem diferentes)
    let elementoTransmutado = false;
    let novoElemento = avatarBase.elemento;

    if (avatarBase.elemento !== avatarSacrificio.elemento) {
      const roll = Math.random();
      if (roll < 0.3) { // 30% de chance
        elementoTransmutado = true;
        novoElemento = avatarSacrificio.elemento;
      }
    }

    // 9. Preparar dados para atualização
    let updateData = {
      merge_count: mergeCount + 1, // Sempre incrementa, mesmo se falhar
      updated_at: new Date().toISOString()
    };

    // 10. Se o merge foi bem sucedido, aplicar ganhos de stats
    if (mergeSuccessful) {
      const novaForca = avatarBase.forca + ganhoForca;
      const novaAgilidade = avatarBase.agilidade + ganhoAgilidade;
      const novaResistencia = avatarBase.resistencia + ganhoResistencia;
      const novoFoco = avatarBase.foco + ganhoFoco;

      updateData = {
        ...updateData,
        forca: novaForca,
        agilidade: novaAgilidade,
        resistencia: novaResistencia,
        foco: novoFoco,
        elemento: novoElemento
      };
    }

    // 11. Atualizar avatar base
    const { error: updateBaseError } = await supabase
      .from('avatares')
      .update(updateData)
      .eq('id', avatarBaseId);

    if (updateBaseError) {
      console.error("Erro ao atualizar avatar base:", updateBaseError);
      return Response.json(
        { message: "Erro ao atualizar avatar base" },
        { status: 500 }
      );
    }

    // 11. Marcar avatar de sacrifício como morto
    const { error: killSacrificeError } = await supabase
      .from('avatares')
      .update({
        vivo: false,
        hp_atual: 0,
        marca_morte: true,
        ativo: false
      })
      .eq('id', avatarSacrificioId);

    if (killSacrificeError) {
      console.error("Erro ao sacrificar avatar:", killSacrificeError);
      return Response.json(
        { message: "Erro ao processar sacrifício" },
        { status: 500 }
      );
    }

    // 12. Deduzir custos do player
    const { error: updateStatsError } = await supabase
      .from('player_stats')
      .update({
        moedas: playerStats.moedas - custoMoedas,
        fragmentos: playerStats.fragmentos - custoFragmentos
      })
      .eq('user_id', userId);

    if (updateStatsError) {
      console.error("Erro ao deduzir custos:", updateStatsError);
      return Response.json(
        { message: "Erro ao processar pagamento" },
        { status: 500 }
      );
    }

    // 13. Buscar avatar base atualizado para retornar
    const { data: avatarAtualizado, error: finalError } = await supabase
      .from('avatares')
      .select('*')
      .eq('id', avatarBaseId)
      .single();

    if (finalError) {
      console.error("Erro ao buscar avatar atualizado:", finalError);
    }

    // 14. Retornar resultado da fusão
    return Response.json({
      message: mergeSuccessful ? "Fusão realizada com sucesso!" : "A fusão falhou! O avatar sacrificado foi perdido, mas o base está intacto.",
      resultado: {
        avatarBase: avatarAtualizado || avatarBase,
        avatarSacrificio: avatarSacrificio,
        sucesso: mergeSuccessful,
        chanceSucesso: chanceSucesso,
        mergeCount: mergeCount + 1,
        ganhos: mergeSuccessful ? {
          forca: ganhoForca,
          agilidade: ganhoAgilidade,
          resistencia: ganhoResistencia,
          foco: ganhoFoco
        } : {
          forca: 0,
          agilidade: 0,
          resistencia: 0,
          foco: 0
        },
        mudouElemento: mergeSuccessful && elementoTransmutado,
        elementoOriginal: avatarBase.elemento,
        elementoNovo: mergeSuccessful ? novoElemento : avatarBase.elemento,
        custos: {
          moedas: custoMoedas,
          fragmentos: custoFragmentos
        }
      }
    });

  } catch (error) {
    console.error("Erro no servidor:", error);
    return Response.json(
      { message: "Erro ao processar: " + error.message },
      { status: 500 }
    );
  }
}
