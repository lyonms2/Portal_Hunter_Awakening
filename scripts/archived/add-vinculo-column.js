// ==================== SCRIPT: ADICIONAR COLUNA VÍNCULO ====================
// Arquivo: /scripts/add-vinculo-column.js
// Execute com: node scripts/add-vinculo-column.js

const { getSupabaseServiceClient } = require('../lib/supabase/serverClient');

async function addVinculoColumn() {
  console.log('🔍 Verificando estrutura da tabela avatares...\n');

  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    console.error('❌ Erro: Não foi possível conectar ao Supabase.');
    console.error('Verifique suas credenciais em .env.local\n');
    process.exit(1);
  }

  try {
    // 1. Verificar se a coluna vinculo já existe
    console.log('📋 Passo 1: Verificando se coluna vinculo existe...');

    const { data: avatares, error: selectError } = await supabase
      .from('avatares')
      .select('id, nome, vinculo')
      .limit(1);

    if (selectError) {
      if (selectError.message.includes('vinculo') || selectError.code === '42703') {
        console.log('⚠️  Coluna vinculo NÃO existe. Criando...\n');

        console.log('📝 Por favor, execute o seguinte SQL no Supabase Dashboard:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`
ALTER TABLE avatares
ADD COLUMN IF NOT EXISTS vinculo INTEGER DEFAULT 0 CHECK (vinculo >= 0 AND vinculo <= 100);

COMMENT ON COLUMN avatares.vinculo IS 'Nível de vínculo entre caçador e avatar (0-100)';

CREATE INDEX IF NOT EXISTS idx_avatares_vinculo ON avatares(vinculo);

UPDATE avatares SET vinculo = 0 WHERE vinculo IS NULL;
        `);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.log('📍 Como executar:');
        console.log('1. Acesse: https://supabase.com/dashboard');
        console.log('2. Vá para SQL Editor');
        console.log('3. Cole o SQL acima');
        console.log('4. Clique em Run\n');

        console.log('💡 Ou use o arquivo: supabase/migrations/add_vinculo_column.sql\n');

        process.exit(1);
      } else {
        throw selectError;
      }
    }

    console.log('✅ Coluna vinculo já existe!\n');

    // 2. Verificar registros sem vínculo (NULL ou 0)
    console.log('📋 Passo 2: Verificando registros...');

    const { data: todosAvatares, error: countError } = await supabase
      .from('avatares')
      .select('id, nome, vinculo');

    if (countError) throw countError;

    const semVinculo = todosAvatares.filter(a => !a.vinculo || a.vinculo === 0);

    console.log(`📊 Total de avatares: ${todosAvatares.length}`);
    console.log(`🔢 Com vínculo = 0: ${semVinculo.length}`);
    console.log(`💚 Com vínculo > 0: ${todosAvatares.length - semVinculo.length}\n`);

    // 3. Mostrar alguns exemplos
    if (todosAvatares.length > 0) {
      console.log('📄 Exemplos de avatares:');
      todosAvatares.slice(0, 5).forEach(a => {
        const emoji = a.vinculo > 0 ? '💚' : '⚪';
        console.log(`  ${emoji} ${a.nome}: vínculo = ${a.vinculo || 0}`);
      });
      console.log();
    }

    // 4. Teste de update
    console.log('📋 Passo 3: Testando update de vínculo...');

    if (todosAvatares.length > 0) {
      const testeAvatar = todosAvatares[0];
      const novoVinculo = (testeAvatar.vinculo || 0) + 1;

      const { data: updated, error: updateError } = await supabase
        .from('avatares')
        .update({ vinculo: novoVinculo })
        .eq('id', testeAvatar.id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Erro ao testar update:', updateError.message);
        throw updateError;
      }

      if (updated.vinculo === novoVinculo) {
        console.log(`✅ Update funcionando! ${testeAvatar.nome}: ${testeAvatar.vinculo || 0} → ${novoVinculo}`);

        // Reverter teste
        await supabase
          .from('avatares')
          .update({ vinculo: testeAvatar.vinculo || 0 })
          .eq('id', testeAvatar.id);

        console.log('✅ Teste revertido com sucesso\n');
      } else {
        console.error('⚠️  Warning: Update não salvou o valor esperado');
        console.error(`Esperado: ${novoVinculo}, Recebido: ${updated.vinculo}\n`);
      }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ VERIFICAÇÃO COMPLETA!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🎮 O sistema de vínculo está pronto para uso!');
    console.log('💡 Execute um treino para testar o ganho de vínculo.\n');

  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    console.error('Detalhes:', error);
    process.exit(1);
  }
}

// Executar
addVinculoColumn().catch(console.error);
