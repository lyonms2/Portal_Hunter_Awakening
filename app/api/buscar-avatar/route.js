import { NextResponse } from 'next/server';
import { getDocument, getDocuments } from '@/lib/firebase/firestore';

export const dynamic = 'force-dynamic';

/**
 * GET /api/buscar-avatar?avatarId=... OU ?userId=...
 * Busca dados de um avatar específico pelo ID ou busca avatar ativo do usuário
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const avatarId = searchParams.get('avatarId');
    const userId = searchParams.get('userId');

    if (!avatarId && !userId) {
      return NextResponse.json(
        { error: 'avatarId ou userId é obrigatório' },
        { status: 400 }
      );
    }

    let avatar;

    if (avatarId) {
      // Buscar por ID do avatar no Firestore
      avatar = await getDocument('avatares', avatarId);

      if (!avatar) {
        console.error('Avatar não encontrado:', avatarId);
        return NextResponse.json({ error: 'Avatar não encontrado' }, { status: 404 });
      }
    } else {
      // Buscar avatar ativo do usuário no Firestore
      const avatares = await getDocuments('avatares', {
        where: [
          ['user_id', '==', userId],
          ['ativo', '==', true]
        ]
      });

      if (!avatares || avatares.length === 0) {
        console.error('Avatar ativo não encontrado para usuário:', userId);
        return NextResponse.json({ error: 'Avatar ativo não encontrado' }, { status: 404 });
      }

      avatar = avatares[0];
    }

    return NextResponse.json({
      success: true,
      avatar: avatar
    });

  } catch (error) {
    console.error('Erro no GET /api/buscar-avatar:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
