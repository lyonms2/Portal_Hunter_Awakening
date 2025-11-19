// ==================== API: SETUP FIRESTORE COLLECTIONS ====================
// Arquivo: /app/api/admin/setup-collections/route.js
// Acesse: GET /api/admin/setup-collections para verificar
// Acesse: POST /api/admin/setup-collections para criar dados iniciais

import { NextResponse } from 'next/server';
import {
  getDocuments,
  createDocument,
  getDocument
} from '@/lib/firebase/firestore';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export const dynamic = 'force-dynamic';

// Collections necessárias
const REQUIRED_COLLECTIONS = [
  'items',
  'player_stats',
  'player_inventory',
  'avatares',
  'pvp_rankings',
  'pvp_temporadas',
  'pvp_historico_temporadas',
  'pvp_titulos',
  'pvp_recompensas_pendentes',
  'pvp_battle_rooms',
  'pvp_queue',
  'story_progress'
];

// Itens padrão da loja
const DEFAULT_ITEMS = [
  {
    id: 'pocao_vida_pequena',
    nome: 'Poção de Vida Pequena',
    descricao: 'Restaura 30 HP do avatar',
    tipo: 'consumivel',
    efeito: 'hp',
    valor_efeito: 30,
    preco_compra: 50,
    max_stack: 99,
    icone: '🧪'
  },
  {
    id: 'pocao_vida_media',
    nome: 'Poção de Vida Média',
    descricao: 'Restaura 60 HP do avatar',
    tipo: 'consumivel',
    efeito: 'hp',
    valor_efeito: 60,
    preco_compra: 100,
    max_stack: 99,
    icone: '🧪'
  },
  {
    id: 'pocao_vida_grande',
    nome: 'Poção de Vida Grande',
    descricao: 'Restaura 100 HP do avatar',
    tipo: 'consumivel',
    efeito: 'hp',
    valor_efeito: 100,
    preco_compra: 200,
    max_stack: 99,
    icone: '🧪'
  },
  {
    id: 'tonico_energia',
    nome: 'Tônico de Energia',
    descricao: 'Reduz 20 pontos de exaustão',
    tipo: 'consumivel',
    efeito: 'exaustao',
    valor_efeito: -20,
    preco_compra: 75,
    max_stack: 99,
    icone: '⚡'
  },
  {
    id: 'elixir_vitalidade',
    nome: 'Elixir de Vitalidade',
    descricao: 'Reduz 50 pontos de exaustão',
    tipo: 'consumivel',
    efeito: 'exaustao',
    valor_efeito: -50,
    preco_compra: 150,
    max_stack: 99,
    icone: '✨'
  },
  {
    id: 'cristal_restauracao',
    nome: 'Cristal de Restauração',
    descricao: 'Restaura 50 HP e reduz 30 de exaustão',
    tipo: 'consumivel',
    efeito: 'ambos',
    valor_hp: 50,
    valor_exaustao: -30,
    preco_compra: 300,
    max_stack: 50,
    icone: '💎'
  }
];

/**
 * GET - Verificar status das collections
 */
export async function GET(request) {
  try {
    const results = {
      status: 'ok',
      collections: {},
      summary: {
        total: REQUIRED_COLLECTIONS.length,
        withData: 0,
        empty: 0
      }
    };

    for (const collectionName of REQUIRED_COLLECTIONS) {
      try {
        const colRef = collection(db, collectionName);
        const snapshot = await getDocs(colRef);

        results.collections[collectionName] = {
          exists: true,
          count: snapshot.size,
          status: snapshot.size > 0 ? '✅' : '⚠️ VAZIA'
        };

        if (snapshot.size > 0) {
          results.summary.withData++;
        } else {
          results.summary.empty++;
        }
      } catch (error) {
        results.collections[collectionName] = {
          exists: false,
          count: 0,
          status: '❌ ERRO',
          error: error.message
        };
        results.summary.empty++;
      }
    }

    return NextResponse.json(results);

  } catch (error) {
    console.error('Erro ao verificar collections:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar collections: ' + error.message },
      { status: 500 }
    );
  }
}

/**
 * POST - Criar dados iniciais
 * Body: { createItems: true, createTemporada: true }
 */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { createItems = true, createTemporada = true } = body;

    const results = {
      itemsCreated: [],
      temporadaCreated: false,
      errors: []
    };

    // Criar itens da loja
    if (createItems) {
      for (const item of DEFAULT_ITEMS) {
        try {
          // Verificar se já existe
          const existing = await getDocument('items', item.id);
          if (!existing) {
            await createDocument('items', {
              nome: item.nome,
              descricao: item.descricao,
              tipo: item.tipo,
              efeito: item.efeito,
              valor_efeito: item.valor_efeito,
              valor_hp: item.valor_hp,
              valor_exaustao: item.valor_exaustao,
              preco_compra: item.preco_compra,
              max_stack: item.max_stack,
              icone: item.icone
            }, item.id);
            results.itemsCreated.push(item.nome);
          }
        } catch (error) {
          results.errors.push(`Item ${item.nome}: ${error.message}`);
        }
      }
    }

    // Criar temporada PvP inicial
    if (createTemporada) {
      try {
        const existing = await getDocument('pvp_temporadas', '1');
        if (!existing) {
          await createDocument('pvp_temporadas', {
            temporada_id: 1,
            nome: 'Temporada 1',
            data_inicio: new Date().toISOString(),
            data_fim: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            ativa: true
          }, '1');
          results.temporadaCreated = true;
        }
      } catch (error) {
        results.errors.push(`Temporada: ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Dados iniciais criados!',
      ...results
    });

  } catch (error) {
    console.error('Erro ao criar dados iniciais:', error);
    return NextResponse.json(
      { error: 'Erro ao criar dados iniciais: ' + error.message },
      { status: 500 }
    );
  }
}
