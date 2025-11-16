-- ===================================================================
-- ADICIONAR FOREIGN KEY ENTRE TRADE_LISTINGS E AVATARES
-- ===================================================================

-- 1. Verificar se a foreign key já existe
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
  AND tc.table_name = 'trade_listings';

-- 2. Adicionar foreign key se não existir
-- Isso permite que o Supabase faça JOIN corretamente
ALTER TABLE trade_listings
  ADD CONSTRAINT fk_trade_listings_avatar
  FOREIGN KEY (avatar_id)
  REFERENCES avatares(id)
  ON DELETE CASCADE;

-- 3. Verificar se foi criada
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
  AND tc.table_name = 'trade_listings';

-- 4. Testar o JOIN agora
SELECT
  tl.id,
  tl.avatar_id,
  tl.seller_id,
  tl.status,
  a.id as avatar_real_id,
  a.nome as avatar_nome
FROM trade_listings tl
LEFT JOIN avatares a ON tl.avatar_id = a.id
WHERE tl.status = 'active';
