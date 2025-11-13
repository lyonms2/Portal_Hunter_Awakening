# Migrações do Banco de Dados

## Como Executar Migrações

### Método 1: Via Supabase Dashboard (Recomendado)

1. Acesse o **Supabase Dashboard** do seu projeto
2. Vá para **SQL Editor** no menu lateral
3. Abra o arquivo `add_vinculo_column.sql`
4. Cole o conteúdo completo no editor
5. Clique em **Run** para executar

### Método 2: Via Supabase CLI

```bash
# Se você tem Supabase CLI instalado
supabase db push

# Ou execute diretamente
supabase db execute --file supabase/migrations/add_vinculo_column.sql
```

### Método 3: Via SQL direto (PostgreSQL)

```bash
psql -h <seu-host>.supabase.co -U postgres -d postgres -f supabase/migrations/add_vinculo_column.sql
```

---

## Migração Atual: add_vinculo_column.sql

**O que faz:**
- Adiciona coluna `vinculo` (INTEGER, 0-100) à tabela `avatares`
- Define valor padrão como 0
- Adiciona constraint para garantir valores entre 0-100
- Cria índice para melhorar performance
- Atualiza registros existentes

**Por que é necessária:**
Sistema de vínculo implementado mas a coluna não existia no banco, causando perda de dados.

**Impacto:**
- ✅ Sem downtime
- ✅ Não quebra código existente
- ✅ Dados existentes preservados (vinculo = 0)

---

## Verificação Pós-Migração

Execute esta query para confirmar que funcionou:

```sql
-- Verificar coluna vinculo
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'avatares' AND column_name = 'vinculo';

-- Ver alguns registros
SELECT id, nome, nivel, vinculo, exaustao
FROM avatares
LIMIT 5;
```

Resultado esperado:
```
column_name | data_type | column_default | is_nullable
------------|-----------|----------------|------------
vinculo     | integer   | 0              | NO
```

---

## Rollback (se necessário)

Se precisar reverter a migração:

```sql
-- ATENÇÃO: Isso remove a coluna e todos os dados de vínculo!
ALTER TABLE avatares DROP COLUMN IF EXISTS vinculo;
DROP INDEX IF EXISTS idx_avatares_vinculo;
```

---

## Próximas Migrações

Futuras adições planejadas:
- [ ] Histórico de vínculo (`vinculo_historico` table)
- [ ] Eventos de vínculo (`vinculo_eventos` table)
- [ ] Achievements relacionados a vínculo
