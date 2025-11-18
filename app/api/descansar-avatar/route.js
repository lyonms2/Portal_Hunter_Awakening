// ==================== API: DESCANSAR AVATAR ====================
// Arquivo: /app/api/descansar-avatar/route.js

import { NextResponse } from 'next/server';
import { getDocument, updateDocument } from '@/lib/firebase/firestore';
import { processarRecuperacao, getNivelExaustao } from '@/app/avatares/sistemas/exhaustionSystem';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  console.log("=== AVATAR DESCANSANDO ===");

  try {
    const { avatarId, horasDescanso } = await request.json();

    if (!avatarId) {
      return NextResponse.json(
        { message: 'avatarId é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar avatar atual no Firestore
    const avatar = await getDocument('avatares', avatarId);

    if (!avatar) {
      console.error('Avatar não encontrado:', avatarId);
      return NextResponse.json(
        { message: 'Avatar não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se avatar está vivo
    if (!avatar.vivo) {
      return NextResponse.json(
        { message: 'Avatar morto não pode descansar. Visite o Necromante.' },
        { status: 400 }
      );
    }

    const exaustaoAtual = avatar.exaustao || 0;
    const nivelAntes = getNivelExaustao(exaustaoAtual);

    // Se já está descansado, não precisa descansar
    if (exaustaoAtual === 0) {
      return NextResponse.json({
        sucesso: true,
        mensagem: 'Seu avatar já está completamente descansado! 💚',
        avatar: avatar,
        ja_descansado: true
      });
    }

    // Calcular horas de descanso (padrão: 1 hora)
    const horas = horasDescanso || 1;

    // Processar recuperação
    const totalmenteInativo = true; // Avatar desativado descansa mais rápido
    const resultado = processarRecuperacao(exaustaoAtual, horas, totalmenteInativo, false);

    console.log('📊 Resultado do descanso:', {
      antes: resultado.exaustao_anterior,
      depois: resultado.exaustao_nova,
      recuperacao: resultado.recuperacao,
      nivel_antes: resultado.nivel_anterior.nome,
      nivel_depois: resultado.nivel_novo.nome
    });

    // Atualizar avatar no Firestore
    await updateDocument('avatares', avatarId, {
      exaustao: resultado.exaustao_nova,
      updated_at: new Date().toISOString()
    });

    // Buscar avatar atualizado
    const avatarAtualizado = await getDocument('avatares', avatarId);

    console.log('✅ Avatar descansou com sucesso!');

    // Mensagens personalizadas baseadas no resultado
    let mensagem = resultado.mensagem;
    const mensagensAdicionais = [];

    if (resultado.mudou_nivel) {
      if (resultado.nivel_novo.nome === 'DESCANSADO') {
        mensagensAdicionais.push('🎉 Seu avatar está completamente revigorado!');
      } else if (resultado.nivel_novo.nome === 'ALERTA') {
        mensagensAdicionais.push('✨ Muito melhor! Mais um pouco de descanso e estará perfeito.');
      } else if (resultado.nivel_anterior.nome === 'COLAPSADO') {
        mensagensAdicionais.push('💫 Seu avatar acordou do colapso! Continue descansando.');
      }
    }

    // Calcular tempo adicional necessário para descanso completo
    const tempoCompleto = resultado.exaustao_nova > 0
      ? Math.ceil(resultado.exaustao_nova / 15) // 15 pontos por hora descansando
      : 0;

    return NextResponse.json({
      sucesso: true,
      mensagem,
      mensagens_adicionais: mensagensAdicionais,
      avatar: avatarAtualizado,
      recuperacao: {
        exaustao_antes: resultado.exaustao_anterior,
        exaustao_depois: resultado.exaustao_nova,
        pontos_recuperados: resultado.recuperacao,
        nivel_antes: {
          nome: nivelAntes.nome,
          emoji: nivelAntes.emoji,
          cor: nivelAntes.cor
        },
        nivel_depois: {
          nome: resultado.nivel_novo.nome,
          emoji: resultado.nivel_novo.emoji,
          cor: resultado.nivel_novo.cor
        },
        mudou_nivel: resultado.mudou_nivel,
        horas_descansadas: horas,
        horas_para_completo: tempoCompleto
      },
      lore: resultado.nivel_novo.nome === 'DESCANSADO'
        ? 'Seu avatar se sente revigorado, pronto para enfrentar qualquer desafio!'
        : resultado.nivel_novo.nome === 'ALERTA'
        ? 'As energias voltam a fluir pelo corpo do avatar.'
        : resultado.nivel_novo.nome === 'CANSADO'
        ? 'O peso das batalhas ainda é sentido, mas a força retorna aos poucos.'
        : 'Aos poucos, a consciência retorna. O avatar ainda precisa de descanso.'
    });

  } catch (error) {
    console.error('❌ Erro na API descansar-avatar:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor', erro: error.message },
      { status: 500 }
    );
  }
}
