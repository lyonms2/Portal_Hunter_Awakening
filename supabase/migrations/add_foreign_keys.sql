-- ==================== MIGRAÇÃO: ADICIONAR FOREIGN KEYS ====================
-- Arquivo: /supabase/migrations/add_foreign_keys.sql
-- Data: 2025-11-17
-- Descrição: Adiciona foreign keys para user_id nas tabelas avatares e player_stats
-- Issue: Corrige erro PGRST200 no mercado de avatares

-- ========== 1. ADICIONAR FOREIGN KEY EM AVATARES ==========
-- Garante que todo avatar pertence a um usuário válido
-- ON DELETE CASCADE: Se o usuário for deletado, seus avatares também são
ALTER TABLE public.avatares
ADD CONSTRAINT fk_avatares_user
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- ========== 2. ADICIONAR FOREIGN KEY EM PLAYER_STATS ==========
-- Garante que toda estatística pertence a um usuário válido
-- ON DELETE CASCADE: Se o usuário for deletado, suas estatísticas também são
ALTER TABLE public.player_stats
ADD CONSTRAINT fk_player_stats_user
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- ========== 3. CRIAR ÍNDICES PARA MELHOR PERFORMANCE ==========
-- Índices para acelerar consultas por user_id
CREATE INDEX IF NOT EXISTS idx_avatares_user_id ON public.avatares(user_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_user_id ON public.player_stats(user_id);

-- ========== 4. COMENTÁRIOS EXPLICATIVOS ==========
COMMENT ON CONSTRAINT fk_avatares_user ON public.avatares IS
'Foreign key para auth.users - garante que todo avatar pertence a um usuário válido';

COMMENT ON CONSTRAINT fk_player_stats_user ON public.player_stats IS
'Foreign key para auth.users - garante que toda estatística pertence a um usuário válido';

-- ========== 5. VERIFICAÇÃO ==========
-- Verifica se as foreign keys foram criadas corretamente
SELECT
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  confrelid::regclass AS referenced_table,
  a.attname AS column_name
FROM pg_constraint c
JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
WHERE conname IN ('fk_avatares_user', 'fk_player_stats_user');
