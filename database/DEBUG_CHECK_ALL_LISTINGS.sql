-- Verificar TODOS os listings ativos no banco
SELECT
  id,
  seller_id,
  seller_username,
  avatar_id,
  price_moedas,
  price_fragmentos,
  status,
  created_at
FROM trade_listings
WHERE status = 'active'
ORDER BY created_at DESC;

-- Verificar se existem listings para o userId específico
SELECT
  id,
  seller_id,
  seller_username,
  avatar_id,
  status
FROM trade_listings
WHERE seller_id = '454550e9-eaa2-403e-9439-1889822e1956'
  AND status = 'active';

-- Verificar todos os avatares desse usuário
SELECT
  id,
  nome,
  user_id,
  vivo,
  ativo,
  marca_morte
FROM avatares
WHERE user_id = '454550e9-eaa2-403e-9439-1889822e1956';
