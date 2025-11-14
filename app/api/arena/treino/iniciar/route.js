// ==================== API: INICIAR TREINO ====================
// Arquivo: /app/api/arena/treino/iniciar/route.js

import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase/serverClient';
import { inicializarBatalha } from '@/lib/arena/batalhaEngine';
import { selecionarHabilidadesIniciais } from '@/app/avatares/sistemas/abilitiesSystem';
import { gerarStatsBalanceados } from '@/app/avatares/sistemas/statsSystem';
import { aplicarPenalidadesExaustao } from '@/app/avatares/sistemas/exhaustionSystem';

/**
 * Gera um avatar inimigo para treino
 */
function gerarAvatarInimigo(nivel, dificuldade) {
  const elementos = ['Fogo', 'Água', 'Terra', 'Vento', 'Eletricidade', 'Sombra', 'Luz'];
  const elemento = elementos[Math.floor(Math.random() * elementos.length)];
  
  // Raridade baseada na dificuldade
  let raridade;
  switch (dificuldade) {
    case 'facil':
      raridade = 'Comum';
      break;
    case 'normal':
      raridade = Math.random() < 0.7 ? 'Comum' : 'Raro';
      break;
    case 'dificil':
      raridade = Math.random() < 0.5 ? 'Raro' : 'Comum';
      break;
    case 'mestre':
      raridade = Math.random() < 0.6 ? 'Lendário' : 'Raro';
      break;
    default:
      raridade = 'Comum';
  }
  
  // Gerar stats
  const stats = gerarStatsBalanceados(raridade, elemento);
  
  // Gerar habilidades
  const habilidades = selecionarHabilidadesIniciais(elemento, raridade);
  
  return {
    id: `ia_${Date.now()}`,
    nome: `${elemento} Selvagem`,
    elemento,
    raridade,
    nivel,
    ...stats,
    habilidades,
    vivo: true,
    vinculo: 0,
    exaustao: 0
  };
}

export async function POST(request) {
  try {
    const { userId, avatarId, dificuldade } = await request.json();

    if (!userId || !avatarId || !dificuldade) {
      return NextResponse.json(
        { message: 'Dados incompletos' },
        { status: 400 }
      );
    }

    // Inicializar Supabase dentro da função
    const supabase = getSupabaseServiceClient();

    // Buscar avatar do jogador
    const { data: avatar, error: avatarError } = await supabase
      .from('avatares')
      .select('*')
      .eq('id', avatarId)
      .eq('user_id', userId)
      .single();

    if (avatarError || !avatar) {
      return NextResponse.json(
        { message: 'Avatar não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se pode lutar
    if (!avatar.vivo) {
      return NextResponse.json(
        { message: 'Avatar está morto!' },
        { status: 400 }
      );
    }

    if (avatar.exaustao >= 100) {
      return NextResponse.json(
        { message: 'Avatar está colapsado! Precisa descansar.' },
        { status: 400 }
      );
    }

    // Garantir que o avatar do jogador tenha habilidades COMPLETAS
    // Verificar se habilidades estão incompletas (sem efeitos_status ou custo_energia)
    const habilidadesIncompletas = !avatar.habilidades ||
      avatar.habilidades.length === 0 ||
      !avatar.habilidades[0].custo_energia ||
      !avatar.habilidades[0].efeitos_status;

    if (habilidadesIncompletas) {
      console.log('⚠️ Habilidades incompletas detectadas. Regenerando...');
      avatar.habilidades = selecionarHabilidadesIniciais(avatar.elemento, avatar.raridade);

      // Atualizar no banco para corrigir permanentemente
      await supabase
        .from('avatares')
        .update({
          habilidades: avatar.habilidades.map(hab => ({
            nome: hab.nome,
            descricao: hab.descricao,
            tipo: hab.tipo,
            raridade: hab.raridade,
            elemento: hab.elemento,
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
          }))
        })
        .eq('id', avatar.id);

      console.log('✅ Habilidades atualizadas no banco:', avatar.habilidades.map(h => h.nome));
    }

    // Aplicar penalidades de exaustão aos stats do avatar ANTES de entrar em batalha
    const statsBase = {
      forca: avatar.forca,
      agilidade: avatar.agilidade,
      resistencia: avatar.resistencia,
      foco: avatar.foco
    };
    const statsComPenalidades = aplicarPenalidadesExaustao(statsBase, avatar.exaustao || 0);

    // Atualizar stats do avatar com penalidades aplicadas
    const avatarComPenalidades = {
      ...avatar,
      forca: statsComPenalidades.forca,
      agilidade: statsComPenalidades.agilidade,
      resistencia: statsComPenalidades.resistencia,
      foco: statsComPenalidades.foco
    };

    // Gerar inimigo
    const inimigo = gerarAvatarInimigo(avatar.nivel, dificuldade);

    // Inicializar batalha com stats já penalizados
    const estadoBatalha = inicializarBatalha(avatarComPenalidades, inimigo, dificuldade);
    
    // Salvar estado da batalha no localStorage/sessionStorage
    // (Por enquanto, retorna o estado para o frontend gerenciar)
    
    return NextResponse.json({
      sucesso: true,
      batalha: estadoBatalha
    });
    
  } catch (error) {
    console.error('Erro ao iniciar treino:', error);
    return NextResponse.json(
      { message: 'Erro ao iniciar treino', erro: error.message },
      { status: 500 }
    );
  }
}
