import { NextResponse } from 'next/server';
import { getDocuments, getDocument } from '@/lib/firebase/firestore';

export const dynamic = 'force-dynamic';

/**
 * GET /api/pvp/ia/oponentes?poder=X&userId=Y
 * Busca avatares de outros players com poder similar para batalhas IA
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const poder = parseInt(searchParams.get('poder'));
    const userId = searchParams.get('userId');

    console.log('[OPONENTES IA] Parâmetros recebidos:', { poder, userId });

    if (!poder) {
      return NextResponse.json({ error: 'Poder é obrigatório' }, { status: 400 });
    }

    if (!userId) {
      console.error('[OPONENTES IA] userId não fornecido!');
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }

    // Calcular range de poder (±30%)
    const poderMin = Math.floor(poder * 0.7);
    const poderMax = Math.ceil(poder * 1.3);

    console.log(`[OPONENTES IA] Buscando avatares com poder entre ${poderMin} e ${poderMax}`);
    console.log(`[OPONENTES IA] EXCLUINDO avatares do userId: ${userId}`);

    // Buscar TODOS os avatares vivos do Firestore
    const avatares = await getDocuments('avatares', {
      where: [
        ['vivo', '==', true],
        ['user_id', '!=', userId] // Excluir próprio usuário
      ]
    });

    console.log(`[OPONENTES IA] Avatares encontrados no Firestore: ${avatares?.length || 0}`);

    if (!avatares || avatares.length === 0) {
      console.log('[OPONENTES IA] Nenhum avatar encontrado no Firestore');
      return NextResponse.json({
        success: true,
        oponentes: [],
        filtros: {
          poderMin,
          poderMax,
          encontrados: 0,
          seuUserId: userId
        }
      });
    }

    // Calcular poder total e filtrar por range
    const avataresFiltrados = avatares
      .map(avatar => {
        const poderTotal = (avatar.forca || 0) + (avatar.agilidade || 0) + (avatar.resistencia || 0) + (avatar.foco || 0);
        return { ...avatar, poderTotal };
      })
      .filter(avatar => {
        // DUPLA VERIFICAÇÃO: Garantir que não é do próprio usuário
        if (avatar.user_id === userId) {
          console.warn('[OPONENTES IA] AVISO: Avatar do próprio usuário quase passou!', avatar.nome);
          return false;
        }
        return avatar.poderTotal >= poderMin && avatar.poderTotal <= poderMax;
      })
      .sort(() => Math.random() - 0.5) // Randomizar ordem
      .slice(0, 12); // Pegar apenas 12

    console.log(`[OPONENTES IA] Encontrados ${avataresFiltrados.length} oponentes após filtro`);

    // Buscar nomes dos caçadores da collection player_stats
    const userIds = [...new Set(avataresFiltrados.map(a => a.user_id))];

    const nomesMap = {};
    for (const uid of userIds) {
      const playerStats = await getDocument('player_stats', uid);
      if (playerStats) {
        nomesMap[uid] = playerStats.nome_operacao || 'Caçador Misterioso';
      }
    }

    console.log('[OPONENTES IA] Nomes mapeados:', Object.keys(nomesMap).length);

    const oponentesFormatados = avataresFiltrados
      .filter(avatar => avatar.user_id !== userId) // VERIFICAÇÃO TRIPLA
      .map((avatar) => ({
        avatar: {
          id: avatar.id,
          nome: avatar.nome,
          nivel: avatar.nivel,
          elemento: avatar.elemento,
          raridade: avatar.raridade,
          forca: avatar.forca,
          agilidade: avatar.agilidade,
          resistencia: avatar.resistencia,
          foco: avatar.foco,
          habilidades: avatar.habilidades || [],
          experiencia: avatar.experiencia || 0
        },
        poderTotal: avatar.poderTotal,
        cacadorNome: nomesMap[avatar.user_id] || 'Caçador Misterioso',
        userId: avatar.user_id
      }));

    console.log(`[OPONENTES IA] Retornando ${oponentesFormatados.length} oponentes finais`);

    return NextResponse.json({
      success: true,
      oponentes: oponentesFormatados,
      filtros: {
        poderMin,
        poderMax,
        encontrados: oponentesFormatados.length,
        seuUserId: userId
      }
    });

  } catch (error) {
    console.error('[OPONENTES IA] Erro:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
