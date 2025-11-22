import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/firestore';
import { collection, query, where, getDocs, deleteDoc, orderBy, limit } from 'firebase/firestore';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se há notificação de match
    const notificacoesRef = collection(db, 'pvp_match_notifications');
    const queryNotificacao = query(
      notificacoesRef,
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(1)
    );

    const snapshot = await getDocs(queryNotificacao);

    if (snapshot.empty) {
      return NextResponse.json({
        matched: false
      });
    }

    const notificacao = snapshot.docs[0].data();
    const notificacaoId = snapshot.docs[0].id;

    // Remover notificação após leitura
    await deleteDoc(snapshot.docs[0].ref);

    return NextResponse.json({
      matched: true,
      matchId: notificacao.matchId,
      oponente: notificacao.oponente
    });

  } catch (error) {
    console.error('Erro ao verificar match:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
