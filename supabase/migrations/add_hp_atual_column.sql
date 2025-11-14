-- ==================== MIGRAÇÃO: ADICIONAR COLUNA HP_ATUAL ====================
-- Arquivo: /supabase/migrations/add_hp_atual_column.sql
-- Data: 2025-11-14
-- Descrição: Adiciona coluna hp_atual à tabela avatares para persistir estado de HP entre batalhas

-- Adicionar coluna hp_atual (pode ser NULL - se NULL, significa HP cheio)
ALTER TABLE avatares
ADD COLUMN IF NOT EXISTS hp_atual INTEGER DEFAULT NULL CHECK (hp_atual IS NULL OR hp_atual >= 0);

-- Comentário explicativo
COMMENT ON COLUMN avatares.hp_atual IS 'HP atual do avatar. Se NULL, avatar está com HP cheio (hp_maximo). Persiste entre batalhas e modos de jogo.';

-- Criar índice para melhorar performance de queries que filtram por avatares com HP baixo
CREATE INDEX IF NOT EXISTS idx_avatares_hp_atual ON avatares(hp_atual) WHERE hp_atual IS NOT NULL;

-- Verificação
SELECT
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'avatares' AND column_name = 'hp_atual';
