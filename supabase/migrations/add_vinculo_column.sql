-- ==================== MIGRAÇÃO: ADICIONAR COLUNA VÍNCULO ====================
-- Arquivo: /supabase/migrations/add_vinculo_column.sql
-- Data: 2025-11-13
-- Descrição: Adiciona coluna vinculo à tabela avatares para sistema de vínculo

-- Adicionar coluna vinculo (0-100)
ALTER TABLE avatares
ADD COLUMN IF NOT EXISTS vinculo INTEGER DEFAULT 0 CHECK (vinculo >= 0 AND vinculo <= 100);

-- Comentário explicativo
COMMENT ON COLUMN avatares.vinculo IS 'Nível de vínculo entre caçador e avatar (0-100). Afeta stats em combate e desbloqueia habilidades cooperativas.';

-- Criar índice para melhorar performance de queries que filtram por vínculo
CREATE INDEX IF NOT EXISTS idx_avatares_vinculo ON avatares(vinculo);

-- Atualizar avatares existentes para garantir valor padrão
UPDATE avatares SET vinculo = 0 WHERE vinculo IS NULL;

-- Verificação
SELECT
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'avatares' AND column_name = 'vinculo';
