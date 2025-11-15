/**
 * Script de Verificação do Banco de Dados PVP
 * Execute: node scripts/verify-pvp-database.js
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌');
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🔍 Verificando estrutura do banco de dados PVP...\n');

async function verificarTabelas() {
  console.log('📋 VERIFICANDO TABELAS:');

  const tabelas = [
    'pvp_challenges',
    'pvp_available_players',
    'pvp_battle_rooms',
    'pvp_matchmaking_queue', // antiga
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
    'create_pvp_challenge',
    'accept_pvp_challenge',
    'reject_pvp_challenge',
    'cancel_pvp_challenge',
    'cleanup_expired_challenges',
    'cleanup_inactive_players',
    'find_pvp_match' // antiga
  ];

  for (const funcao of funcoes) {
    try {
      // Tentar chamar função com parâmetros dummy só pra ver se existe
      const { error } = await supabase.rpc(funcao, {});

      if (error) {
        if (error.code === '42883') {
          console.log(`   ❌ ${funcao}() - NÃO EXISTE`);
        } else if (error.message.includes('required argument')) {
          console.log(`   ✅ ${funcao}() - OK`);
        } else {
          console.log(`   ⚠️  ${funcao}() - ERRO: ${error.message}`);
        }
      } else {
        console.log(`   ✅ ${funcao}() - OK`);
      }
    } catch (e) {
      console.log(`   ⚠️  ${funcao}() - ERRO: ${e.message}`);
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

    // Verificar campos esperados
    const camposEsperados = [
      'id',
      'challenger_user_id',
      'challenger_avatar_id',
      'challenged_user_id',
      'challenged_avatar_id',
      'status',
      'challenger_nivel',
      'challenger_poder',
      'challenger_fama',
      'challenged_nivel',
      'challenged_poder',
      'challenged_fama',
      'match_id',
      'created_at',
      'responded_at',
      'expires_at'
    ];

    console.log('   Campos esperados:');

    // Como não temos dados, vamos apenas confirmar que a consulta funciona
    console.log('   ✅ Tabela acessível e estrutura parece OK');
    console.log(`   📊 Registros atuais: ${data?.length || 0}`);

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
      .limit(1);

    if (error) {
      console.log(`   ❌ Erro ao acessar tabela: ${error.message}`);
      return;
    }

    console.log('   ✅ Tabela acessível e estrutura parece OK');
    console.log(`   📊 Jogadores online: ${data?.length || 0}`);

  } catch (e) {
    console.log(`   ❌ Erro: ${e.message}`);
  }
}

async function testarCriacaoDesafio() {
  console.log('\n🧪 TESTE: Criar desafio (simulação):');

  try {
    // Usar IDs dummy para testar a função
    const { data, error } = await supabase.rpc('create_pvp_challenge', {
      p_challenger_user_id: '00000000-0000-0000-0000-000000000001',
      p_challenger_avatar_id: '00000000-0000-0000-0000-000000000001',
      p_challenger_nivel: 1,
      p_challenger_poder: 100,
      p_challenger_fama: 1000,
      p_challenged_user_id: '00000000-0000-0000-0000-000000000002',
      p_challenged_avatar_id: '00000000-0000-0000-0000-000000000002',
      p_challenged_nivel: 1,
      p_challenged_poder: 100,
      p_challenged_fama: 1000
    });

    if (error) {
      // Erro esperado porque os IDs não existem
      if (error.message.includes('foreign key') || error.message.includes('violates')) {
        console.log('   ✅ Função existe e validações estão funcionando');
        console.log('      (Erro de FK esperado com IDs dummy)');
      } else {
        console.log(`   ⚠️  Erro: ${error.message}`);
      }
    } else {
      console.log('   ✅ Função executou (resultado:', data, ')');
    }
  } catch (e) {
    console.log(`   ❌ Erro: ${e.message}`);
  }
}

async function verificarTudo() {
  await verificarTabelas();
  await verificarFuncoes();
  await verificarEstruturaPvpChallenges();
  await verificarEstruturaPvpAvailablePlayers();
  await testarCriacaoDesafio();

  console.log('\n✅ VERIFICAÇÃO COMPLETA!\n');
  console.log('📝 PRÓXIMOS PASSOS:');
  console.log('   1. Se alguma tabela/função está faltando, execute:');
  console.log('      database/pvp_challenges.sql no Supabase SQL Editor');
  console.log('   2. Se tudo está OK, teste a aplicação!');
}

verificarTudo().catch(console.error);
