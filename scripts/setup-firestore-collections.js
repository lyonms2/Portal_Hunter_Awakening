// ==================== SCRIPT: SETUP FIRESTORE COLLECTIONS ====================
// Arquivo: /scripts/setup-firestore-collections.js
// Execute com: node scripts/setup-firestore-collections.js
//
// Este script verifica e cria as collections necessárias no Firestore

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, setDoc, addDoc } = require('firebase/firestore');

// Configuração do Firebase (usando variáveis de ambiente)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Collections necessárias para o sistema
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

// Temporada PvP inicial
const DEFAULT_TEMPORADA = {
  temporada_id: 1,
  nome: 'Temporada 1',
  data_inicio: new Date().toISOString(),
  data_fim: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias
  ativa: true,
  created_at: new Date().toISOString()
};

async function main() {
  console.log('🔥 SETUP FIRESTORE COLLECTIONS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Verificar variáveis de ambiente
  if (!firebaseConfig.projectId) {
    console.error('❌ Erro: Variáveis de ambiente do Firebase não configuradas!');
    console.error('Configure as variáveis NEXT_PUBLIC_FIREBASE_* no seu .env.local\n');
    process.exit(1);
  }

  console.log(`📋 Project ID: ${firebaseConfig.projectId}\n`);

  // Inicializar Firebase
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  console.log('📊 Verificando collections existentes...\n');

  const existingCollections = [];
  const missingCollections = [];

  // Verificar cada collection
  for (const collectionName of REQUIRED_COLLECTIONS) {
    try {
      const colRef = collection(db, collectionName);
      const snapshot = await getDocs(colRef);

      if (snapshot.empty) {
        missingCollections.push(collectionName);
        console.log(`⚠️  ${collectionName}: VAZIA (0 documentos)`);
      } else {
        existingCollections.push(collectionName);
        console.log(`✅ ${collectionName}: ${snapshot.size} documentos`);
      }
    } catch (error) {
      missingCollections.push(collectionName);
      console.log(`❌ ${collectionName}: ERRO - ${error.message}`);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log(`📊 Resumo: ${existingCollections.length}/${REQUIRED_COLLECTIONS.length} collections com dados\n`);

  if (missingCollections.length > 0) {
    console.log('📝 Collections vazias/faltando:');
    missingCollections.forEach(c => console.log(`   - ${c}`));
    console.log();

    // Perguntar se deseja criar dados iniciais
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise(resolve => {
      rl.question('🔧 Deseja criar dados iniciais? (s/n): ', resolve);
    });
    rl.close();

    if (answer.toLowerCase() === 's') {
      console.log('\n🔧 Criando dados iniciais...\n');

      // Criar items da loja
      if (missingCollections.includes('items')) {
        console.log('📦 Criando itens da loja...');
        for (const item of DEFAULT_ITEMS) {
          await setDoc(doc(db, 'items', item.id), {
            ...item,
            created_at: new Date().toISOString()
          });
          console.log(`   ✅ ${item.nome}`);
        }
        console.log();
      }

      // Criar temporada PvP inicial
      if (missingCollections.includes('pvp_temporadas')) {
        console.log('🏆 Criando temporada PvP inicial...');
        await setDoc(doc(db, 'pvp_temporadas', '1'), DEFAULT_TEMPORADA);
        console.log(`   ✅ ${DEFAULT_TEMPORADA.nome}`);
        console.log();
      }

      console.log('✅ Dados iniciais criados com sucesso!\n');
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ VERIFICAÇÃO COMPLETA!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('💡 Próximos passos:');
  console.log('1. Se precisar migrar dados do Supabase, exporte como JSON');
  console.log('2. Use o Firebase Console para importar os dados');
  console.log('3. Ou crie um script personalizado para migração\n');

  process.exit(0);
}

main().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
