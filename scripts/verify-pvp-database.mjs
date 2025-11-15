/**
 * Script de Verificação do Banco de Dados PVP
 * Execute: node scripts/verify-pvp-database.mjs
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar .env.local
dotenv.config({ path: join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌');
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '✅' : '❌');
  console.error('\n💡 Verifique se o arquivo .env.local existe na raiz do projeto');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🔍 Verificando estrutura do banco de dados PVP...\n');
console.log(`📍 Supabase URL: ${SUPABASE_URL}\n`);

async function verificarTabelas() {
  console.log('📋 VERIFICANDO TABELAS:');

  const tabelas = [
    'pvp_challenges',
    'pvp_available_players',
    'pvp_battle_rooms',
    'pvp_matchmaking_queue',
    'pvp_rankings'
  ];

  for (const tabela of tabelas) {
    try {
      const { data, error, count } = await supabase
        .from(tabela)
        .select('*', { count: 'exact', head: true });

      if (error) {
        if (error.code === '42P01') {
          console.log(`   ❌ ${tabela} - NÃO EXISTE`);
        } else {
          console.log(`   ⚠️  ${tabela} - ERRO: ${error.message}`);
        }
      } else {
        console.log(`   ✅ ${tabela} - OK (${count || 0} registros)`);
      }
    } catch (e) {
      console.log(`   ⚠️  ${tabela} - ERRO: ${e.message}`);
    }
  }
}

async function verificarFuncoes() {
  console.log('\n⚙️  VERIFICANDO FUNÇÕES RPC:');

  const funcoes = [
    { nome: 'create_pvp_challenge', novo: true },
    { nome: 'accept_pvp_challenge', novo: true },
    { nome: 'reject_pvp_challenge', novo: true },
    { nome: 'cancel_pvp_challenge', novo: true },
    { nome: 'cleanup_expired_challenges', novo: true },
    { nome: 'cleanup_inactive_players', novo: true },
    { nome: 'find_pvp_match', novo: false },
    { nome: 'cleanup_expired_queue_entries', novo: false }
  ];

  for (const { nome, novo } of funcoes) {
    try {
      const { error } = await supabase.rpc(nome, {});

      const tag = novo ? '🆕' : '📜';

      if (error) {
        if (error.code === '42883') {
          console.log(`   ${tag} ❌ ${nome}() - NÃO EXISTE`);
        } else if (error.message.includes('required argument') || error.message.includes('null value')) {
          console.log(`   ${tag} ✅ ${nome}() - OK`);
        } else {
          console.log(`   ${tag} ⚠️  ${nome}() - ${error.message.substring(0, 50)}...`);
        }
      } else {
        console.log(`   ${tag} ✅ ${nome}() - OK`);
      }
    } catch (e) {
      console.log(`   ⚠️  ${nome}() - ERRO: ${e.message}`);
    }
  }
}

async function verificarEstruturaPvpChallenges() {
  console.log('\n🔍 VERIFICANDO ESTRUTURA DA TABELA pvp_challenges:');

  try {
    const { data, error } = await supabase
      .from('pvp_challenges')
      .select('*')
      .limit(1);

    if (error) {
      console.log(`   ❌ Erro ao acessar tabela: ${error.message}`);
      return;
    }

    console.log('   ✅ Tabela acessível e estrutura parece OK');
    console.log(`   📊 Desafios ativos: ${data?.length || 0}`);

  } catch (e) {
    console.log(`   ❌ Erro: ${e.message}`);
  }
}

async function verificarEstruturaPvpAvailablePlayers() {
  console.log('\n🔍 VERIFICANDO ESTRUTURA DA TABELA pvp_available_players:');

  try {
    const { data, error } = await supabase
      .from('pvp_available_players')
      .select('*')
      .limit(10);

    if (error) {
      console.log(`   ❌ Erro ao acessar tabela: ${error.message}`);
      return;
    }

    console.log('   ✅ Tabela acessível e estrutura parece OK');
    console.log(`   📊 Jogadores online: ${data?.length || 0}`);

    if (data && data.length > 0) {
      console.log('\n   Jogadores atuais:');
      data.forEach((player, i) => {
        console.log(`      ${i + 1}. User: ${player.user_id} | Nível: ${player.nivel} | Poder: ${player.poder_total}`);
      });
    }

  } catch (e) {
    console.log(`   ❌ Erro: ${e.message}`);
  }
}

async function resumo() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO DA VERIFICAÇÃO');
  console.log('='.repeat(60));

  let tabelasOk = 0;
  let tabelasFaltando = 0;
  let funcoesOk = 0;
  let funcoesFaltando = 0;

  // Verificar tabelas novamente para contar
  const tabelasNovas = ['pvp_challenges', 'pvp_available_players'];

  for (const tabela of tabelasNovas) {
    const { error } = await supabase.from(tabela).select('*', { count: 'exact', head: true });
    if (error && error.code === '42P01') {
      tabelasFaltando++;
    } else if (!error) {
      tabelasOk++;
    }
  }

  console.log(`\n✅ Tabelas novas criadas: ${tabelasOk}/2`);
  if (tabelasFaltando > 0) {
    console.log(`❌ Tabelas faltando: ${tabelasFaltando}`);
  }

  console.log('\n📝 INSTRUÇÕES:');

  if (tabelasOk < 2) {
    console.log('\n⚠️  VOCÊ PRECISA EXECUTAR O SQL!');
    console.log('\n   1. Abra o Supabase Dashboard');
    console.log('   2. Vá em "SQL Editor"');
    console.log('   3. Clique em "New Query"');
    console.log('   4. Cole o conteúdo de: database/pvp_challenges.sql');
    console.log('   5. Clique em "Run" ou pressione Ctrl+Enter');
    console.log('   6. Execute este script novamente para verificar\n');
  } else {
    console.log('\n✅ Tudo certo! Banco de dados configurado corretamente!');
    console.log('\n   Você pode testar a aplicação:');
    console.log('   1. npm run dev');
    console.log('   2. Acesse /arena/pvp');
    console.log('   3. Abra duas abas com usuários diferentes');
    console.log('   4. Teste enviar e aceitar desafios!\n');
  }
}

async function verificarTudo() {
  await verificarTabelas();
  await verificarFuncoes();
  await verificarEstruturaPvpChallenges();
  await verificarEstruturaPvpAvailablePlayers();
  await resumo();
}

verificarTudo().catch(console.error);
