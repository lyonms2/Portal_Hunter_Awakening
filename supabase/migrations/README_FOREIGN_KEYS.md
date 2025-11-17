# 🔧 Correção: Foreign Keys para Tabelas de Usuário

## 📋 Problema Identificado

**Erro:** `PGRST200 - Could not find a relationship between 'avatares' and 'user_id' in the schema cache`

**Local:** Mercado de Avatares (`/app/api/mercado/listar/route.js`)

**Causa:** As tabelas `avatares` e `player_stats` possuem a coluna `user_id`, mas não têm foreign keys definidas apontando para `auth.users(id)`. O PostgREST depende dessas relações explícitas para realizar JOINs automáticos.

---

## 🎯 Solução

Aplicar a migration `add_foreign_keys.sql` que adiciona as foreign keys necessárias.

---

## 📝 Como Aplicar a Migration

### **Opção 1: Via Supabase Dashboard (Recomendado)**

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto **Portal Hunter Awakening**
3. No menu lateral, clique em **SQL Editor**
4. Clique em **New Query**
5. Copie todo o conteúdo do arquivo `add_foreign_keys.sql`
6. Cole no editor SQL
7. Clique em **Run** (ou pressione `Ctrl+Enter`)
8. Aguarde a mensagem de sucesso ✅

### **Opção 2: Via Supabase CLI** (se instalado)

```bash
# No diretório raiz do projeto
npx supabase db push
```

Ou se tiver o CLI instalado globalmente:

```bash
supabase db push
```

---

## ✅ Verificação

Após aplicar a migration, execute no SQL Editor:

```sql
-- Verificar se as foreign keys foram criadas
SELECT
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  confrelid::regclass AS referenced_table,
  a.attname AS column_name
FROM pg_constraint c
JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
WHERE conname IN ('fk_avatares_user', 'fk_player_stats_user');
```

**Resultado esperado:**
```
constraint_name        | table_name    | referenced_table | column_name
-----------------------|---------------|------------------|-------------
fk_avatares_user       | avatares      | users            | user_id
fk_player_stats_user   | player_stats  | users            | user_id
```

---

## 🧪 Testar o Mercado

Após aplicar a migration:

1. Acesse a página `/mercado` no seu aplicativo
2. Verifique se os avatares são listados corretamente
3. Verifique se o nome do vendedor aparece (se houver avatares à venda)

**Antes da correção:**
- ❌ Erro 500: "Could not find a relationship..."

**Depois da correção:**
- ✅ Avatares listados com sucesso
- ✅ Nome do vendedor aparece corretamente via JOIN

---

## 📊 O que a Migration faz?

1. **Adiciona foreign key em `avatares.user_id`**
   - Garante que todo avatar pertence a um usuário válido
   - `ON DELETE CASCADE`: Se o usuário for deletado, seus avatares também são

2. **Adiciona foreign key em `player_stats.user_id`**
   - Garante que toda estatística pertence a um usuário válido
   - `ON DELETE CASCADE`: Se o usuário for deletado, suas estatísticas também são

3. **Cria índices para performance**
   - `idx_avatares_user_id`: Acelera consultas por usuário em avatares
   - `idx_player_stats_user_id`: Acelera consultas por usuário em estatísticas

4. **Permite JOINs automáticos no PostgREST**
   - O código pode usar sintaxe de JOIN do Supabase: `vendedor:user_id (nome)`
   - O PostgREST reconhece automaticamente a relação e faz o JOIN

---

## 🔍 Por que isso é importante?

### Integridade Referencial
- Garante que não existam avatares "órfãos" (sem dono)
- Previne dados inconsistentes no banco

### Performance
- Índices criados aceleram consultas por `user_id`
- JOINs automáticos são mais eficientes

### Funcionalidade do PostgREST
- Habilita a sintaxe de JOIN do Supabase no código
- Permite buscar dados relacionados em uma única query

### Exemplo prático
```javascript
// Antes: NÃO FUNCIONA (erro PGRST200)
const { data } = await supabase
  .from('avatares')
  .select(`
    *,
    vendedor:user_id (nome)
  `)

// Depois: FUNCIONA PERFEITAMENTE ✅
const { data } = await supabase
  .from('avatares')
  .select(`
    *,
    vendedor:user_id (nome)
  `)
```

---

## 📚 Referências

- **Arquivo da Migration:** `/supabase/migrations/add_foreign_keys.sql`
- **Código que usa o JOIN:** `/app/api/mercado/listar/route.js:30`
- **Schema Completo:** `/database/SUPABASE_SCHEMA_COMPLETE.md`
- **Issue:** Erro PGRST200 no mercado de avatares

---

**Data de Criação:** 2025-11-17
**Autor:** Claude Code Assistant
**Status:** ✅ Pronta para aplicação
