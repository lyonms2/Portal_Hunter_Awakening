-- =====================================================
-- CORRIGIR SINCRONIZAÇÃO DA COLUNA em_venda
-- =====================================================
-- Este script corrige avatares que têm listings ativos
-- mas estão marcados como em_venda=false

-- 1. Marcar como em_venda=true todos os avatares com listings ativos
UPDATE avatares
SET em_venda = true
WHERE id IN (
  SELECT avatar_id
  FROM trade_listings
  WHERE status = 'active'
)
AND em_venda = false;

-- 2. Marcar como em_venda=false todos os avatares SEM listings ativos
UPDATE avatares
SET em_venda = false
WHERE id NOT IN (
  SELECT avatar_id
  FROM trade_listings
  WHERE status = 'active'
)
AND em_venda = true;

-- 3. Verificar resultado
SELECT
  a.id,
  a.nome,
  a.em_venda,
  a.vivo,
  a.ativo,
  a.marca_morte,
  (SELECT COUNT(*) FROM trade_listings WHERE avatar_id = a.id AND status = 'active') as listings_ativos
FROM avatares a
WHERE a.em_venda = true OR EXISTS (
  SELECT 1 FROM trade_listings WHERE avatar_id = a.id AND status = 'active'
)
ORDER BY a.created_at DESC;
