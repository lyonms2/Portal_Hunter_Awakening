import { NextResponse } from 'next/server';
import { getDocument, getDocuments, createDocument, updateDocument, deleteDocument } from '@/lib/firebase/firestore';

export const dynamic = 'force-dynamic';

/**
 * GET /api/batalha/ativa
 * Verifica se o jogador tem uma batalha ativa (abandonada)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }

    // Buscar batalha ativa do jogador
    const batalhas = await getDocuments('batalhas_ativas', {
      where: [['user_id', '==', userId]]
    });

    if (!batalhas || batalhas.length === 0) {
      return NextResponse.json({ temBatalhaAtiva: false });
    }

    const batalha = batalhas[0];

    // Verificar se expirou (máximo 30 minutos)
    const agora = new Date();
    const iniciada = new Date(batalha.iniciada_em);
    const minutos = (agora - iniciada) / 1000 / 60;

    if (minutos > 30) {
      // Batalha expirada - aplicar penalidade e remover
      await deleteDocument('batalhas_ativas', batalha.id);

      return NextResponse.json({
        temBatalhaAtiva: false,
        batalhaExpirada: true,
        tipo: batalha.tipo,
        penalidade: batalha.penalidade
      });
    }

    return NextResponse.json({
      temBatalhaAtiva: true,
      batalha: {
        id: batalha.id,
        tipo: batalha.tipo,
        dados: batalha.dados,
        iniciada_em: batalha.iniciada_em
      }
    });

  } catch (error) {
    console.error('Erro ao verificar batalha ativa:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

/**
 * POST /api/batalha/ativa
 * Registra início de uma batalha ou finaliza
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, avatarId, acao, tipo, dados, penalidade } = body;

    if (!userId || !acao) {
      return NextResponse.json({ error: 'userId e acao são obrigatórios' }, { status: 400 });
    }

    if (acao === 'iniciar') {
      // Remover batalha ativa anterior (se houver)
      const anteriores = await getDocuments('batalhas_ativas', {
        where: [['user_id', '==', userId]]
      });

      for (const bat of anteriores || []) {
        await deleteDocument('batalhas_ativas', bat.id);
      }

      // Registrar nova batalha ativa
      const batalhaId = await createDocument('batalhas_ativas', {
        user_id: userId,
        avatar_id: avatarId,
        tipo: tipo, // 'treino', 'pvp', 'sobrevivencia'
        dados: dados || {},
        penalidade: penalidade || {
          hp_perdido: 20,
          exaustao: 10,
          derrota: true
        },
        iniciada_em: new Date().toISOString()
      });

      return NextResponse.json({
        success: true,
        batalhaId
      });

    } else if (acao === 'finalizar') {
      // Remover batalha ativa (finalizada normalmente)
      const batalhas = await getDocuments('batalhas_ativas', {
        where: [['user_id', '==', userId]]
      });

      for (const bat of batalhas || []) {
        await deleteDocument('batalhas_ativas', bat.id);
      }

      return NextResponse.json({ success: true });

    } else if (acao === 'aplicar_penalidade') {
      // Buscar batalha abandonada e aplicar penalidade
      const batalhas = await getDocuments('batalhas_ativas', {
        where: [['user_id', '==', userId]]
      });

      if (!batalhas || batalhas.length === 0) {
        return NextResponse.json({ success: true, message: 'Sem batalha para penalizar' });
      }

      const batalha = batalhas[0];
      const pen = batalha.penalidade || { hp_perdido: 20, exaustao: 10, derrota: true };

      // Aplicar penalidade no avatar
      if (batalha.avatar_id) {
        const avatar = await getDocument('avatares', batalha.avatar_id);

        if (avatar) {
          const novoHP = Math.max(0, (avatar.hp_atual || avatar.resistencia * 10) - pen.hp_perdido);
          const novaExaustao = Math.min(100, (avatar.exaustao || 0) + pen.exaustao);

          await updateDocument('avatares', batalha.avatar_id, {
            hp_atual: novoHP,
            exaustao: novaExaustao,
            vivo: novoHP > 0
          });
        }
      }

      // Remover batalha ativa
      await deleteDocument('batalhas_ativas', batalha.id);

      return NextResponse.json({
        success: true,
        penalidadeAplicada: pen
      });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });

  } catch (error) {
    console.error('Erro ao gerenciar batalha ativa:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
