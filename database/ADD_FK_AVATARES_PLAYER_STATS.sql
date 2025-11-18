-- ===================================================================
-- ADICIONAR FOREIGN KEY ENTRE AVATARES E PLAYER_STATS
-- ===================================================================
-- Permite JOIN direto para queries mais eficientes
-- ===================================================================

-- Verificar se a FK já existe
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'avatares'
  AND ccu.table_name = 'player_stats';

-- Adicionar foreign key de avatares.user_id -> player_stats.user_id
-- Isso permite JOIN direto entre as tabelas
ALTER TABLE avatares
  DROP CONSTRAINT IF EXISTS fk_avatares_player_stats;

ALTER TABLE avatares
  ADD CONSTRAINT fk_avatares_player_stats
  FOREIGN KEY (user_id)
  REFERENCES player_stats(user_id)
  ON DELETE CASCADE
  ON UPDATE CASCADE;

COMMENT ON CONSTRAINT fk_avatares_player_stats ON avatares IS 'Permite JOIN direto com player_stats para queries otimizadas';

-- Criar índice se não existir (para performance do JOIN)
CREATE INDEX IF NOT EXISTS idx_avatares_user_id ON avatares(user_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_user_id ON player_stats(user_id);

-- Verificar se foi criada corretamente
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'avatares'
  AND ccu.table_name = 'player_stats';

-- Testar o JOIN
SELECT
  a.id,
  a.nome,
  a.em_venda,
  ps.nome_operacao as vendedor
FROM avatares a
JOIN player_stats ps ON a.user_id = ps.user_id
WHERE a.em_venda = true
LIMIT 5;
