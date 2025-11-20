import { NextResponse } from 'next/server';
import { getDocuments, getDocument, updateDocument } from '@/lib/firebase/firestore';

export const dynamic = 'force-dynamic';

/**
 * GET /api/pvp/titulos?userId=xxx
 * Busca títulos conquistados pelo jogador
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }

    // Buscar títulos do jogador no Firestore
    const titulosItems = await getDocuments('pvp_titulos', {
      where: [['user_id', '==', userId]],
      orderBy: ['data_conquista', 'desc']
    });

    // Para cada título, buscar detalhes da temporada
    // (Firestore não suporta JOIN, então fazemos queries separadas)
    const titulos = await Promise.all(
      (titulosItems || []).map(async (titulo) => {
        const temporada = await getDocument('pvp_temporadas', titulo.temporada_id);

        return {
          ...titulo,
          temporada: temporada ? {
            temporada_id: temporada.temporada_id,
            nome: temporada.nome
          } : null
        };
      })
    );

    // Buscar título ativo
    const tituloAtivo = titulos?.find(t => t.ativo) || null;

    return NextResponse.json({
      success: true,
      titulos: titulos || [],
      tituloAtivo,
      total: titulos?.length || 0
    });
  } catch (error) {
    console.error('[TITULOS] Erro interno:', error);
    return NextResponse.json({ error: 'Erro interno do servidor: ' + error.message }, { status: 500 });
  }
}

/**
 * POST /api/pvp/titulos/ativar
 * Ativa/desativa um título
 * Body: { userId, tituloId }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, tituloId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }

    // Se tituloId for null, desativa todos os títulos
    if (!tituloId) {
      const titulos = await getDocuments('pvp_titulos', {
        where: [['user_id', '==', userId]]
      });

      // Desativar todos os títulos
      await Promise.all(
        (titulos || []).map(titulo =>
          updateDocument('pvp_titulos', titulo.id, { ativo: false })
        )
      );

      return NextResponse.json({
        success: true,
        message: 'Títulos desativados'
      });
    }

    // Verificar se título pertence ao jogador
    const titulo = await getDocument('pvp_titulos', tituloId);

    if (!titulo || titulo.user_id !== userId) {
      return NextResponse.json({ error: 'Título não encontrado' }, { status: 404 });
    }

    // Desativar todos os títulos do jogador primeiro
    const titulos = await getDocuments('pvp_titulos', {
      where: [['user_id', '==', userId]]
    });

    await Promise.all(
      (titulos || []).map(t =>
        updateDocument('pvp_titulos', t.id, { ativo: false })
      )
    );

    // Ativar o título selecionado
    await updateDocument('pvp_titulos', tituloId, { ativo: true });

    return NextResponse.json({
      success: true,
      message: 'Título ativado com sucesso',
      titulo
    });
  } catch (error) {
    console.error('[TITULOS] Erro interno:', error);
    return NextResponse.json({ error: 'Erro interno do servidor: ' + error.message }, { status: 500 });
  }
}
