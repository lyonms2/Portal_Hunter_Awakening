import { NextResponse } from 'next/server';
import { getDocument, updateDocument } from '@/lib/firebase/firestore';

export const dynamic = 'force-dynamic';

/**
 * POST /api/renomear-avatar
 *
 * Permite o caçador renomear seu avatar
 *
 * Body: {
 *   userId: string,
 *   avatarId: string,
 *   novoNome: string
 * }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, avatarId, novoNome } = body;

    console.log('[RENOMEAR AVATAR]', { userId, avatarId, novoNome });

    // Validações básicas
    if (!userId || !avatarId || !novoNome) {
      return NextResponse.json(
        { error: 'userId, avatarId e novoNome são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar nome
    const nomeValidado = novoNome.trim();

    if (nomeValidado.length < 3) {
      return NextResponse.json(
        { error: 'O nome deve ter no mínimo 3 caracteres' },
        { status: 400 }
      );
    }

    if (nomeValidado.length > 30) {
      return NextResponse.json(
        { error: 'O nome deve ter no máximo 30 caracteres' },
        { status: 400 }
      );
    }

    // Validar caracteres (permitir letras, números, espaços, hífens, apóstrofos)
    const regexNomeValido = /^[a-zA-ZÀ-ÿ0-9\s'\-]+$/;
    if (!regexNomeValido.test(nomeValidado)) {
      return NextResponse.json(
        { error: 'O nome contém caracteres inválidos. Use apenas letras, números, espaços, hífens e apóstrofos' },
        { status: 400 }
      );
    }

    // Buscar avatar no Firestore
    const avatar = await getDocument('avatares', avatarId);

    if (!avatar) {
      console.error('[RENOMEAR AVATAR] Avatar não encontrado:', avatarId);
      return NextResponse.json(
        { error: 'Avatar não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o avatar pertence ao usuário
    if (avatar.user_id !== userId) {
      console.error('[RENOMEAR AVATAR] Avatar não pertence ao usuário:', { userId, avatarUserId: avatar.user_id });
      return NextResponse.json(
        { error: 'Este avatar não pertence a você' },
        { status: 403 }
      );
    }

    // Guardar nome antigo para log
    const nomeAntigo = avatar.nome;

    // Atualizar nome no Firestore
    await updateDocument('avatares', avatarId, {
      nome: nomeValidado,
      updated_at: new Date().toISOString()
    });

    console.log('[RENOMEAR AVATAR] Avatar renomeado com sucesso:', {
      avatarId,
      nomeAntigo,
      novoNome: nomeValidado
    });

    // Buscar avatar atualizado
    const avatarAtualizado = await getDocument('avatares', avatarId);

    return NextResponse.json({
      success: true,
      message: `Avatar renomeado de "${nomeAntigo}" para "${nomeValidado}"`,
      avatar: avatarAtualizado,
      nomeAntigo,
      novoNome: nomeValidado
    });

  } catch (error) {
    console.error('[RENOMEAR AVATAR] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
