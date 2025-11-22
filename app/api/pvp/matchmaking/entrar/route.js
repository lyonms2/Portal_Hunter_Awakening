import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/firestore';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, avatarId, avatar, poderTotal, nomeJogador } = body;

    if (!userId || !avatarId || !avatar) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      );
    }

    // Remover entrada antiga do jogador na fila (se existir)
    const filaRef = collection(db, 'pvp_matchmaking_queue');
    const queryAntigo = query(filaRef, where('userId', '==', userId));
    const snapshotAntigo = await getDocs(queryAntigo);

    for (const docSnap of snapshotAntigo.docs) {
      await deleteDoc(docSnap.ref);
    }

    // Procurar oponente com poder similar (±30%)
    const poderMin = poderTotal * 0.7;
    const poderMax = poderTotal * 1.3;

    const queryOponentes = query(
      filaRef,
      where('poderTotal', '>=', poderMin),
      where('poderTotal', '<=', poderMax)
    );

    const snapshotOponentes = await getDocs(queryOponentes);

    // Filtrar oponentes válidos (não o próprio jogador)
    const oponentesValidos = snapshotOponentes.docs.filter(
      docSnap => docSnap.data().userId !== userId
    );

    if (oponentesValidos.length > 0) {
      // Match encontrado! Pegar o primeiro oponente disponível
      const oponenteDoc = oponentesValidos[0];
      const oponente = oponenteDoc.data();

      // Criar sala de batalha
      const matchesRef = collection(db, 'pvp_matches');
      const matchDoc = await addDoc(matchesRef, {
        jogador1: {
          userId: userId,
          nomeJogador: nomeJogador,
          avatar: avatar,
          avatarId: avatarId,
          poderTotal: poderTotal,
          pronto: false
        },
        jogador2: {
          userId: oponente.userId,
          nomeJogador: oponente.nomeJogador,
          avatar: oponente.avatar,
          avatarId: oponente.avatarId,
          poderTotal: oponente.poderTotal,
          pronto: false
        },
        status: 'aguardando',
        turno: 1,
        turnoAtual: 'jogador1',
        criado_em: serverTimestamp(),
        atualizado_em: serverTimestamp()
      });

      // Remover oponente da fila
      await deleteDoc(oponenteDoc.ref);

      // Atualizar flag de match para o oponente
      const notificacoesRef = collection(db, 'pvp_match_notifications');
      await addDoc(notificacoesRef, {
        userId: oponente.userId,
        matchId: matchDoc.id,
        oponente: {
          userId: userId,
          nome: nomeJogador,
          avatar: avatar
        },
        timestamp: serverTimestamp()
      });

      return NextResponse.json({
        success: true,
        matched: true,
        matchId: matchDoc.id,
        oponente: {
          oderId: oponente.userId,
          nome: oponente.nomeJogador,
          avatar: oponente.avatar
        }
      });
    }

    // Não encontrou oponente, adicionar à fila
    await addDoc(filaRef, {
      oderId,
      avatarId,
      avatar,
      poderTotal,
      nomeJogador,
      timestamp: serverTimestamp()
    });

    return NextResponse.json({
      success: true,
      matched: false,
      message: 'Adicionado à fila de matchmaking'
    });

  } catch (error) {
    console.error('Erro no matchmaking:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
