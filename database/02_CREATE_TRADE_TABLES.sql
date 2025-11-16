-- ===================================================================
-- SISTEMA DE TRADE - TABELAS PRINCIPAIS
-- ===================================================================
-- Sistema de marketplace para venda de avatares entre jogadores
-- ===================================================================

-- =====================================================
-- TABELA: trade_listings
-- =====================================================
-- Armazena anúncios de venda de avatares
CREATE TABLE IF NOT EXISTS trade_listings (
  -- Identificação
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Vendedor
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_username TEXT,

  -- Item à venda (apenas avatares por enquanto)
  avatar_id UUID NOT NULL REFERENCES avatares(id) ON DELETE CASCADE,

  -- Preço
  price_moedas INTEGER NOT NULL DEFAULT 0 CHECK (price_moedas >= 0),
  price_fragmentos INTEGER NOT NULL DEFAULT 0 CHECK (price_fragmentos >= 0),

  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold', 'cancelled', 'expired')),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  sold_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT price_must_be_set CHECK (price_moedas > 0 OR price_fragmentos > 0)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_trade_listings_seller ON trade_listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_trade_listings_avatar ON trade_listings(avatar_id);
CREATE INDEX IF NOT EXISTS idx_trade_listings_status ON trade_listings(status);
CREATE INDEX IF NOT EXISTS idx_trade_listings_created ON trade_listings(created_at DESC);

-- =====================================================
-- TABELA: trade_transactions
-- =====================================================
-- Histórico de transações completadas
CREATE TABLE IF NOT EXISTS trade_transactions (
  -- Identificação
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Referência ao listing
  listing_id UUID NOT NULL REFERENCES trade_listings(id) ON DELETE CASCADE,

  -- Partes envolvidas
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Item vendido
  avatar_id UUID NOT NULL,
  avatar_snapshot JSONB, -- Snapshot do avatar no momento da venda

  -- Valores da transação
  price_moedas INTEGER NOT NULL DEFAULT 0,
  price_fragmentos INTEGER NOT NULL DEFAULT 0,
  system_fee_moedas INTEGER NOT NULL DEFAULT 0,
  system_fee_fragmentos INTEGER NOT NULL DEFAULT 0,

  -- Status
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'refunded')),

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_trade_transactions_seller ON trade_transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_trade_transactions_buyer ON trade_transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_trade_transactions_created ON trade_transactions(created_at DESC);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_trade_listings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trade_listings_updated_at
  BEFORE UPDATE ON trade_listings
  FOR EACH ROW
  EXECUTE FUNCTION update_trade_listings_updated_at();

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

-- Verificar se as tabelas foram criadas
SELECT tablename, schemaname
FROM pg_tables
WHERE tablename LIKE 'trade_%'
  AND schemaname = 'public'
ORDER BY tablename;

-- Verificar constraints
SELECT
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_name LIKE 'trade_%'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_type;
