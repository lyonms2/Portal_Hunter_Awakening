-- ===================================================================
-- LIMPEZA COMPLETA DO SISTEMA DE TRADE
-- ===================================================================
-- Este script remove TODOS os dados relacionados ao sistema de trade
-- Use com cuidado!
-- ===================================================================

-- 1. Deletar todas as transações
DELETE FROM trade_transactions;

-- 2. Deletar todas as ofertas
DELETE FROM trade_offers;

-- 3. Deletar todos os listings
DELETE FROM trade_listings;

-- 4. Verificar se as tabelas estão vazias
SELECT 'trade_listings' as tabela, COUNT(*) as total FROM trade_listings
UNION ALL
SELECT 'trade_offers' as tabela, COUNT(*) as total FROM trade_offers
UNION ALL
SELECT 'trade_transactions' as tabela, COUNT(*) as total FROM trade_transactions;

-- 5. Reset dos sequences (IDs) se necessário
-- ALTER SEQUENCE trade_listings_id_seq RESTART WITH 1;
-- ALTER SEQUENCE trade_offers_id_seq RESTART WITH 1;
-- ALTER SEQUENCE trade_transactions_id_seq RESTART WITH 1;

-- ===================================================================
-- VERIFICAÇÃO DE AVATARES
-- ===================================================================
-- Mostrar todos os avatares atualmente no banco:
SELECT
  id,
  user_id,
  nome,
  raridade,
  elemento,
  nivel,
  vivo,
  ativo
FROM avatares
ORDER BY created_at DESC;

-- ===================================================================
-- NOTA: Após executar este script:
-- 1. Faça deploy da aplicação novamente
-- 2. Limpe o cache do navegador (Ctrl+Shift+Del)
-- 3. Abra uma janela anônima para testar
-- 4. Verifique os logs do servidor no console
-- ===================================================================
