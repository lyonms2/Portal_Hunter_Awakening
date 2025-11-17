// ==================== SCRIPT: ADICIONAR COLUNA MERGE COUNT ====================
// Arquivo: /scripts/add-merge-count.js
// Execute com: node scripts/add-merge-count.js

const { getSupabaseServiceClient } = require('../lib/supabase/serverClient');

async function addMergeCountColumn() {
  console.log('🔍 Verificando estrutura da tabela avatares...\n');

  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    console.error('❌ Erro: Não foi possível conectar ao Supabase.');
    console.error('Verifique suas credenciais em .env.local\n');
    process.exit(1);
  }

  try {
    // 1. Verificar se a coluna merge_count já existe
    console.log('📋 Passo 1: Verificando se coluna merge_count existe...');

    const { data: avatares, error: selectError } = await supabase
      .from('avatares')
      .select('id, nome, merge_count')
      .limit(1);

    if (selectError) {
      if (selectError.message.includes('merge_count') || selectError.code === '42703') {
        console.log('⚠️  Coluna merge_count NÃO existe. Criando...\n');

        console.log('📝 Por favor, execute o seguinte SQL no Supabase Dashboard:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`
ALTER TABLE avatares
ADD COLUMN IF NOT EXISTS merge_count INTEGER DEFAULT 0 CHECK (merge_count >= 0 AND merge_count <= 8);

COMMENT ON COLUMN avatares.merge_count IS 'Quantidade de vezes que este avatar foi usado como base em merge (máximo 8)';

CREATE INDEX IF NOT EXISTS idx_avatares_merge_count ON avatares(merge_count);

UPDATE avatares SET merge_count = 0 WHERE merge_count IS NULL;
        `);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.log('📍 Como executar:');
        console.log('1. Acesse: https://supabase.com/dashboard');
        console.log('2. Vá para SQL Editor');
        console.log('3. Cole o SQL acima');
        console.log('4. Clique em Run\n');

        process.exit(1);
      } else {
        throw selectError;
      }
    }

    console.log('✅ Coluna merge_count já existe!\n');

    // 2. Verificar registros
    console.log('📋 Passo 2: Verificando registros...');

    const { data: todosAvatares, error: countError } = await supabase
      .from('avatares')
      .select('id, nome, merge_count');

    if (countError) throw countError;

    const semMerge = todosAvatares.filter(a => !a.merge_count || a.merge_count === 0);
    const comMerge = todosAvatares.filter(a => a.merge_count > 0);

    console.log(`📊 Total de avatares: ${todosAvatares.length}`);
    console.log(`🔢 Sem merges: ${semMerge.length}`);
    console.log(`🧬 Com merges: ${comMerge.length}\n`);

    if (comMerge.length > 0) {
      console.log('📄 Avatares com merges:');
      comMerge.forEach(a => {
        const chance = Math.max(100 - (a.merge_count * 7.5), 40);
        console.log(`  🧬 ${a.nome}: ${a.merge_count} merges (${chance}% chance de sucesso)`);
      });
      console.log();
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ VERIFICAÇÃO COMPLETA!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🎮 O sistema de merge count está pronto para uso!');
    console.log('💡 Mecânica: A cada merge, a chance de sucesso diminui até 40% (máx 8 merges).\n');

  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    console.error('Detalhes:', error);
    process.exit(1);
  }
}

// Executar
addMergeCountColumn().catch(console.error);
