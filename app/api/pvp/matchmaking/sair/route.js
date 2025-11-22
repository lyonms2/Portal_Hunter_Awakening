import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/firestore';
import { collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      );
    }

    // Remover jogador da fila
    const filaRef = collection(db, 'pvp_matchmaking_queue');
    const queryFila = query(filaRef, where('userId', '==', userId));
    const snapshot = await getDocs(queryFila);

    for (const docSnap of snapshot.docs) {
      await deleteDoc(docSnap.ref);
    }

    return NextResponse.json({
      success: true,
      message: 'Removido da fila de matchmaking'
    });

  } catch (error) {
    console.error('Erro ao sair da fila:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
