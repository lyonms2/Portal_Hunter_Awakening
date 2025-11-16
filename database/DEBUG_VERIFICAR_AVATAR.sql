-- Verificar se o avatar do listing existe
SELECT
  'Avatar na tabela avatares' as tipo,
  id,
  nome,
  user_id,
  vivo,
  ativo
FROM avatares
WHERE id = '920fae5b-fe73-423a-accf-2471f81cd383';

-- Verificar o listing
SELECT
  'Listing na tabela trade_listings' as tipo,
  id,
  avatar_id,
  seller_id,
  status
FROM trade_listings
WHERE id = '5ca1dc82-ec6c-4e83-850e-49dffc630e0d';

-- Verificar TODOS os avatares do seller
SELECT
  'Todos avatares do seller' as tipo,
  id,
  nome,
  user_id,
  vivo,
  ativo
FROM avatares
WHERE user_id = 'f2f0a466-f6a8-43ac-945b-80e6fd1f4591';
