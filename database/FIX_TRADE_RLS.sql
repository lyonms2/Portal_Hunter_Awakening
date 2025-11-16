-- ===================================================================
-- FIX RLS PARA TRADE SYSTEM
-- ===================================================================
-- Este arquivo corrige as políticas RLS da tabela trade_listings
-- para permitir que as operações de compra e cancelamento funcionem.
--
-- PROBLEMA: APIs de buy e cancel não conseguem fazer UPDATE na tabela
-- devido a políticas RLS bloqueando as operações.
--
-- EXECUTE ESTE SQL NO SUPABASE SQL EDITOR
-- ===================================================================

-- 1. Desabilitar RLS temporariamente (se quiser testar)
-- ALTER TABLE trade_listings DISABLE ROW LEVEL SECURITY;

-- OU

-- 2. Adicionar políticas corretas (RECOMENDADO)

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "select_all_active_listings" ON trade_listings;
DROP POLICY IF EXISTS "insert_own_listing" ON trade_listings;
DROP POLICY IF EXISTS "update_own_listing" ON trade_listings;
DROP POLICY IF EXISTS "delete_own_listing" ON trade_listings;

-- Política 1: Qualquer um pode VER listings ativos
CREATE POLICY "select_all_active_listings"
ON trade_listings
FOR SELECT
USING (status = 'active');

-- Política 2: Usuário pode CRIAR seus próprios listings
CREATE POLICY "insert_own_listing"
ON trade_listings
FOR INSERT
WITH CHECK (auth.uid() = seller_id);

-- Política 3: QUALQUER UM pode fazer UPDATE (necessário para buy)
-- Alternativamente: apenas service_role pode fazer UPDATE
CREATE POLICY "update_any_listing"
ON trade_listings
FOR UPDATE
USING (true);

-- OU se preferir apenas o dono + service_role:
-- CREATE POLICY "update_own_or_service"
-- ON trade_listings
-- FOR UPDATE
-- USING (auth.uid() = seller_id OR auth.role() = 'service_role');

-- Política 4: Usuário pode DELETAR seus próprios listings
CREATE POLICY "delete_own_listing"
ON trade_listings
FOR DELETE
USING (auth.uid() = seller_id);

-- ===================================================================
-- VERIFICAR SE AS POLÍTICAS FORAM CRIADAS
-- ===================================================================
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'trade_listings';

-- ===================================================================
-- TESTE RÁPIDO
-- ===================================================================
-- Após aplicar as políticas, teste se consegue fazer UPDATE:

-- SELECT id, status FROM trade_listings LIMIT 1;
-- (copie um ID e teste abaixo)

-- UPDATE trade_listings
-- SET status = 'sold'
-- WHERE id = 'SEU_ID_AQUI';

-- Se der erro, o problema é RLS.
-- Se funcionar, o problema está resolvido!

-- ===================================================================
-- ALTERNATIVA: DESABILITAR RLS COMPLETAMENTE (NÃO RECOMENDADO)
-- ===================================================================
-- Se você confia 100% nas validações do backend:
-- ALTER TABLE trade_listings DISABLE ROW LEVEL SECURITY;

-- ===================================================================
-- NOTAS IMPORTANTES:
-- ===================================================================
-- 1. A política "update_any_listing" permite que QUALQUER usuário
--    autenticado faça UPDATE em QUALQUER listing.
--    Isso é necessário porque a operação de compra (buy) precisa
--    marcar o listing como 'sold' mesmo não sendo o dono.
--
-- 2. Se você estiver usando service_role no backend (getSupabaseClientSafe(true)),
--    o service_role IGNORA RLS por padrão. Se mesmo assim está falhando,
--    verifique se realmente está usando service_role e não anon key.
--
-- 3. Para verificar qual role está sendo usado, adicione no código:
--    const { data: { user } } = await supabase.auth.getUser();
--    console.log("Current user role:", user?.role);
--
-- ===================================================================
