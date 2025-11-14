// ==================== API: ATUALIZAR AVATAR ====================
// Arquivo: /app/api/atualizar-avatar/route.js

import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase/serverClient';
import { processarGanhoXP } from '@/app/avatares/sistemas/progressionSystem';
import { getNivelVinculo } from '@/app/avatares/sistemas/bondSystem';

export async function POST(request) {
  try {
    const { avatarId, experiencia, exaustao, vinculo, hp_atual, nivel, forca, agilidade, resistencia, foco } = await request.json();

    if (!avatarId) {
      return NextResponse.json(
        { message: 'avatarId é obrigatório' },
        { status: 400 }
      );
    }

    // Inicializar Supabase dentro da função
    const supabase = getSupabaseServiceClient();

    // Buscar avatar atual
    const { data: avatarAtual, error: fetchError } = await supabase
      .from('avatares')
      .select('*')
      .eq('id', avatarId)
      .single();

    if (fetchError || !avatarAtual) {
      console.error('Erro ao buscar avatar:', fetchError);
      return NextResponse.json(
        { message: 'Avatar não encontrado' },
        { status: 404 }
      );
    }

    // === PROCESSAR XP E LEVEL UP ===
    let levelUpData = null;
    let novoNivel = avatarAtual.nivel;
    let novaExperiencia = avatarAtual.experiencia || 0;

    if (experiencia && experiencia > 0) {
      const resultadoXP = processarGanhoXP(avatarAtual, experiencia);
      
      novoNivel = resultadoXP.nivelAtual;
      novaExperiencia = resultadoXP.xpAtual;

      if (resultadoXP.levelUps > 0) {
        levelUpData = {
          levelUp: true,
          nivelAnterior: resultadoXP.nivelAnterior,
          novoNivel: resultadoXP.nivelAtual,
          levelUps: resultadoXP.levelUps,
          statsNovos: resultadoXP.statsNovos,
          recompensas: resultadoXP.recompensas,
          mensagens: resultadoXP.mensagens
        };

        // Atualizar stats se subiu de nível
        const { forca, agilidade, resistencia, foco } = resultadoXP.statsNovos;
        
        await supabase
          .from('avatares')
          .update({
            forca,
            agilidade,
            resistencia,
            foco
          })
          .eq('id', avatarId);
      }
    }

    // === PROCESSAR EXAUSTÃO ===
    const novaExaustao = Math.min(100, (avatarAtual.exaustao || 0) + (exaustao || 0));

    // === PROCESSAR VÍNCULO ===
    let novoVinculo = avatarAtual.vinculo || 0;
    let nivelVinculo = null;
    let mudouNivelVinculo = false;

    if (vinculo !== undefined && vinculo !== null) {
      const vinculoAnterior = avatarAtual.vinculo || 0;
      const nivelAnterior = getNivelVinculo(vinculoAnterior);

      novoVinculo = Math.max(0, Math.min(100, vinculoAnterior + vinculo));
      nivelVinculo = getNivelVinculo(novoVinculo);

      mudouNivelVinculo = nivelAnterior.nome !== nivelVinculo.nome;

      console.log('Vínculo atualizado:', {
        anterior: vinculoAnterior,
        ganho: vinculo,
        novo: novoVinculo,
        nivel: nivelVinculo.nome,
        mudouNivel: mudouNivelVinculo
      });
    }

    // === ATUALIZAR AVATAR NO BANCO ===
    const updates = {
      nivel: novoNivel,
      experiencia: novaExperiencia,
      exaustao: novaExaustao,
      updated_at: new Date().toISOString()
    };

    // Só atualizar vínculo se foi explicitamente enviado no payload
    if (vinculo !== undefined && vinculo !== null) {
      updates.vinculo = novoVinculo;
    }

    // Só atualizar hp_atual se foi explicitamente enviado no payload
    if (hp_atual !== undefined && hp_atual !== null) {
      updates.hp_atual = hp_atual;
    }

    console.log('🔄 Atualizando avatar no banco:', {
      avatarId,
      updates,
      vinculoAnterior: avatarAtual.vinculo,
      vinculoNovo: novoVinculo,
      ganhoVinculo: vinculo
    });

    const { data: avatarAtualizado, error: updateError } = await supabase
      .from('avatares')
      .update(updates)
      .eq('id', avatarId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Erro ao atualizar avatar:', updateError);
      console.error('Detalhes do erro:', {
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        code: updateError.code
      });
      return NextResponse.json(
        { message: 'Erro ao atualizar avatar', erro: updateError.message },
        { status: 500 }
      );
    }

    console.log('✅ Avatar atualizado com sucesso:', {
      id: avatarAtualizado.id,
      nivel: avatarAtualizado.nivel,
      experiencia: avatarAtualizado.experiencia,
      vinculo: avatarAtualizado.vinculo,
      exaustao: avatarAtualizado.exaustao
    });

    // === RESPOSTA ===
    return NextResponse.json({
      sucesso: true,
      avatar: avatarAtualizado,
      ganhos: {
        experiencia: experiencia || 0,
        exaustao: exaustao || 0,
        vinculo: vinculo || 0
      },
      vinculo: novoVinculo,
      nivelVinculo: nivelVinculo ? {
        nome: nivelVinculo.nome,
        emoji: nivelVinculo.emoji,
        descricao: nivelVinculo.descricao,
        mudouNivel: mudouNivelVinculo
      } : null,
      ...levelUpData
    });

  } catch (error) {
    console.error('Erro na API atualizar-avatar:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor', erro: error.message },
      { status: 500 }
    );
  }
}
