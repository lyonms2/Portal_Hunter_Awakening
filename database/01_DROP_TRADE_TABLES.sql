-- ===================================================================
-- DROP TODAS AS TABELAS DE TRADE
-- ===================================================================
-- Execute este SQL no Supabase SQL Editor para remover
-- completamente o sistema de trade antigo
-- ===================================================================

-- Drop tabelas na ordem correta (dependências primeiro)
DROP TABLE IF EXISTS trade_transactions CASCADE;
DROP TABLE IF EXISTS trade_offers CASCADE;
DROP TABLE IF EXISTS trade_listings CASCADE;

-- Verificar se foram removidas
SELECT tablename
FROM pg_tables
WHERE tablename LIKE 'trade_%'
  AND schemaname = 'public';

-- Se retornar vazio, sucesso!
