import { getDocRef, executeTransaction, getDocuments, getDocument } from "@/lib/firebase/firestore";
import { getDoc, updateDoc, increment } from 'firebase/firestore';
import { getHunterRank, aplicarDescontoMercado } from '@/lib/hunter/hunterRankSystem';

export async function POST(request) {
  try {
    const { compradorId, avatarId } = await request.json();

    if (!compradorId || !avatarId) {
      return Response.json(
        { message: "Dados incompletos" },
        { status: 400 }
      );
    }

    // VERIFICAR LIMITE DE AVATARES ANTES DA TRANSAÇÃO
    const LIMITE_AVATARES = 15;
    const avatares = await getDocuments('avatares', {
      where: [['user_id', '==', compradorId]]
    });

    // Contar apenas avatares que não estão no memorial
    const avataresConta = (avatares || []).filter(av => !(av.marca_morte && !av.vivo)).length;

    if (avataresConta >= LIMITE_AVATARES) {
      return Response.json(
        {
          message: "Você atingiu o limite de 15 avatares! Sacrifique avatares inativos ou espere que morram em combate para liberar espaço.",
          limite: LIMITE_AVATARES,
          avatares_atuais: avataresConta,
          slots_disponiveis: 0
        },
        { status: 400 }
      );
    }

    // Buscar stats do comprador para obter o rank
    const compradorStats = await getDocument('player_stats', compradorId);
    const hunterRank = getHunterRank(compradorStats?.hunterRankXp || 0);

    // Executar compra em transação atômica
    const result = await executeTransaction(async (transaction) => {
      // 1. Buscar avatar
      const avatarRef = getDocRef('avatares', avatarId);
      const avatarDoc = await transaction.get(avatarRef);

      if (!avatarDoc.exists()) {
        throw new Error("Avatar não encontrado");
      }

      const avatar = { id: avatarDoc.id, ...avatarDoc.data() };

      // 2. Validações
      if (!avatar.em_venda) {
        throw new Error("Avatar não está mais à venda");
      }

      if (avatar.user_id === compradorId) {
        throw new Error("Você não pode comprar seu próprio avatar");
      }

      const precoMoedasOriginal = avatar.preco_venda || 0;
      const precoFragmentosOriginal = avatar.preco_fragmentos || 0;

      // Aplicar desconto do rank do cacador
      const precoMoedas = aplicarDescontoMercado(precoMoedasOriginal, hunterRank);
      const precoFragmentos = aplicarDescontoMercado(precoFragmentosOriginal, hunterRank);
      const descontoMoedas = precoMoedasOriginal - precoMoedas;

      // 3. Buscar dados do comprador
      const compradorRef = getDocRef('player_stats', compradorId);
      const compradorDoc = await transaction.get(compradorRef);

      if (!compradorDoc.exists()) {
        throw new Error("Comprador não encontrado");
      }

      const comprador = compradorDoc.data();

      // 4. Verificar saldo
      const saldoMoedas = comprador.moedas || 0;
      const saldoFragmentos = comprador.fragmentos || 0;

      if (precoMoedas > 0 && saldoMoedas < precoMoedas) {
        throw new Error(`Moedas insuficientes. Necessário: ${precoMoedas}, Disponível: ${saldoMoedas}`);
      }

      if (precoFragmentos > 0 && saldoFragmentos < precoFragmentos) {
        throw new Error(`Fragmentos insuficientes. Necessário: ${precoFragmentos}, Disponível: ${saldoFragmentos}`);
      }

      // 6. Calcular taxa (10% em moedas) - baseado no preco original
      const taxaMoedas = Math.floor(precoMoedasOriginal * 0.1);

      // 7. Buscar dados do vendedor
      const vendedorRef = getDocRef('player_stats', avatar.user_id);
      const vendedorDoc = await transaction.get(vendedorRef);

      if (!vendedorDoc.exists()) {
        throw new Error("Vendedor não encontrado");
      }

      // 8. Atualizar comprador (debitar)
      transaction.update(compradorRef, {
        moedas: increment(-precoMoedas),
        fragmentos: increment(-precoFragmentos)
      });

      // 9. Atualizar vendedor (creditar - taxa) - recebe valor original menos taxa
      const valorLiquidoMoedas = precoMoedasOriginal - taxaMoedas;
      transaction.update(vendedorRef, {
        moedas: increment(valorLiquidoMoedas),
        fragmentos: increment(precoFragmentosOriginal)
      });

      // 10. Transferir avatar
      transaction.update(avatarRef, {
        user_id: compradorId,
        em_venda: false,
        preco_venda: null,
        preco_fragmentos: null,
        ativo: false // Desativar ao comprar
      });

      // Retornar dados da compra
      return {
        avatar: {
          id: avatar.id,
          nome: avatar.nome,
          elemento: avatar.elemento,
          raridade: avatar.raridade
        },
        preco_moedas: precoMoedas,
        preco_fragmentos: precoFragmentos,
        preco_original: precoMoedasOriginal,
        desconto_moedas: descontoMoedas,
        taxa_moedas: taxaMoedas,
        saldo_moedas_restante: saldoMoedas - precoMoedas,
        saldo_fragmentos_restante: saldoFragmentos - precoFragmentos
      };
    });

    return Response.json({
      message: "Avatar comprado com sucesso!",
      ...result
    });

  } catch (error) {
    console.error("Erro ao processar compra:", error);

    // Mensagens de erro mais amigáveis
    let mensagemErro = "Erro ao processar compra";

    if (error.message.includes("não encontrado") || error.message.includes("não está à venda")) {
      mensagemErro = "Avatar não encontrado ou não está à venda";
    } else if (error.message.includes("próprio avatar")) {
      mensagemErro = "Você não pode comprar seu próprio avatar";
    } else if (error.message.includes("limite de 15 avatares")) {
      mensagemErro = "Você atingiu o limite de 15 avatares! Libere espaço antes de comprar.";
    } else if (error.message.includes("Moedas insuficientes")) {
      mensagemErro = error.message;
    } else if (error.message.includes("Fragmentos insuficientes")) {
      mensagemErro = error.message;
    }

    return Response.json(
      { message: mensagemErro, details: error.message },
      { status: 400 }
    );
  }
}
