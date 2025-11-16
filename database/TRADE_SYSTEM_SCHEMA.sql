-- =====================================================
-- SISTEMA DE TRADE - MERCADO DE AVATARES E ITENS
-- =====================================================
-- Estrutura completa do banco de dados para o sistema
-- de trocas entre jogadores (avatares e itens)
-- =====================================================

-- =====================================================
-- 1. TABELA: trade_listings (Ofertas de Venda)
-- =====================================================
-- Armazena todos os itens/avatares colocados à venda
CREATE TABLE IF NOT EXISTS trade_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Vendedor
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_username TEXT, -- Cache do nome do vendedor

  -- Tipo de item
  listing_type TEXT NOT NULL CHECK (listing_type IN ('avatar', 'item')),

  -- Referência ao item (apenas um será preenchido)
  avatar_id UUID REFERENCES avatares(id) ON DELETE CASCADE,
  item_id UUID REFERENCES inventario(id) ON DELETE CASCADE,

  -- Preço
  price_moedas INTEGER NOT NULL DEFAULT 0 CHECK (price_moedas >= 0),
  price_fragmentos INTEGER NOT NULL DEFAULT 0 CHECK (price_fragmentos >= 0),

  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold', 'cancelled', 'expired')),

  -- Destaque/Premium (para futuras features)
  is_featured BOOLEAN DEFAULT false,
  featured_until TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  sold_at TIMESTAMP WITH TIME ZONE,

  -- Constraints
  CONSTRAINT valid_price CHECK (price_moedas > 0 OR price_fragmentos > 0),
  CONSTRAINT valid_reference CHECK (
    (listing_type = 'avatar' AND avatar_id IS NOT NULL AND item_id IS NULL) OR
    (listing_type = 'item' AND item_id IS NOT NULL AND avatar_id IS NULL)
  )
);

-- Índices para performance
CREATE INDEX idx_trade_listings_seller ON trade_listings(seller_id);
CREATE INDEX idx_trade_listings_status ON trade_listings(status);
CREATE INDEX idx_trade_listings_type ON trade_listings(listing_type);
CREATE INDEX idx_trade_listings_avatar ON trade_listings(avatar_id) WHERE avatar_id IS NOT NULL;
CREATE INDEX idx_trade_listings_item ON trade_listings(item_id) WHERE item_id IS NOT NULL;
CREATE INDEX idx_trade_listings_created ON trade_listings(created_at DESC);
CREATE INDEX idx_trade_listings_price_moedas ON trade_listings(price_moedas) WHERE status = 'active';
CREATE INDEX idx_trade_listings_price_fragmentos ON trade_listings(price_fragmentos) WHERE status = 'active';

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_trade_listings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_trade_listings_updated_at
  BEFORE UPDATE ON trade_listings
  FOR EACH ROW
  EXECUTE FUNCTION update_trade_listings_updated_at();

-- =====================================================
-- 2. TABELA: trade_transactions (Histórico de Transações)
-- =====================================================
-- Registra todas as compras completadas
CREATE TABLE IF NOT EXISTS trade_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Referência ao listing
  listing_id UUID NOT NULL REFERENCES trade_listings(id) ON DELETE SET NULL,

  -- Partes envolvidas
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_username TEXT,
  buyer_username TEXT,

  -- Item vendido (cache de dados)
  listing_type TEXT NOT NULL,
  avatar_id UUID REFERENCES avatares(id) ON DELETE SET NULL,
  item_id UUID REFERENCES inventario(id) ON DELETE SET NULL,
  avatar_snapshot JSONB, -- Snapshot dos dados do avatar no momento da venda
  item_snapshot JSONB,   -- Snapshot dos dados do item no momento da venda

  -- Preço da transação
  price_moedas INTEGER NOT NULL DEFAULT 0,
  price_fragmentos INTEGER NOT NULL DEFAULT 0,

  -- Taxa do sistema (5% padrão)
  system_fee_moedas INTEGER NOT NULL DEFAULT 0,
  system_fee_fragmentos INTEGER NOT NULL DEFAULT 0,

  -- Status da transação
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'refunded', 'disputed')),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  refunded_at TIMESTAMP WITH TIME ZONE,

  -- Constraint
  CONSTRAINT different_users CHECK (seller_id != buyer_id)
);

-- Índices
CREATE INDEX idx_trade_transactions_seller ON trade_transactions(seller_id);
CREATE INDEX idx_trade_transactions_buyer ON trade_transactions(buyer_id);
CREATE INDEX idx_trade_transactions_listing ON trade_transactions(listing_id);
CREATE INDEX idx_trade_transactions_created ON trade_transactions(created_at DESC);
CREATE INDEX idx_trade_transactions_status ON trade_transactions(status);

-- =====================================================
-- 3. TABELA: trade_offers (Sistema de Ofertas)
-- =====================================================
-- Para negociações (contraofertas) - Feature futura
CREATE TABLE IF NOT EXISTS trade_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Referência ao listing
  listing_id UUID NOT NULL REFERENCES trade_listings(id) ON DELETE CASCADE,

  -- Ofertante
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  buyer_username TEXT,

  -- Oferta
  offer_moedas INTEGER NOT NULL DEFAULT 0 CHECK (offer_moedas >= 0),
  offer_fragmentos INTEGER NOT NULL DEFAULT 0 CHECK (offer_fragmentos >= 0),

  -- Troca (opcional - trocar avatar por avatar)
  trade_avatar_id UUID REFERENCES avatares(id) ON DELETE SET NULL,
  trade_item_id UUID REFERENCES inventario(id) ON DELETE SET NULL,

  -- Mensagem (opcional)
  message TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled', 'expired')),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  responded_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT valid_offer CHECK (
    offer_moedas > 0 OR offer_fragmentos > 0 OR
    trade_avatar_id IS NOT NULL OR trade_item_id IS NOT NULL
  )
);

-- Índices
CREATE INDEX idx_trade_offers_listing ON trade_offers(listing_id);
CREATE INDEX idx_trade_offers_buyer ON trade_offers(buyer_id);
CREATE INDEX idx_trade_offers_status ON trade_offers(status);
CREATE INDEX idx_trade_offers_created ON trade_offers(created_at DESC);

-- =====================================================
-- 4. TABELA: trade_reputation (Sistema de Reputação)
-- =====================================================
-- Avaliações de vendedores/compradores
CREATE TABLE IF NOT EXISTS trade_reputation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Transação relacionada
  transaction_id UUID NOT NULL UNIQUE REFERENCES trade_transactions(id) ON DELETE CASCADE,

  -- Avaliador e avaliado
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewed_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Avaliação (1-5 estrelas)
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),

  -- Comentário (opcional)
  comment TEXT,

  -- Tipo (vendedor ou comprador)
  review_type TEXT NOT NULL CHECK (review_type IN ('seller', 'buyer')),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT different_users_rep CHECK (reviewer_id != reviewed_id)
);

-- Índices
CREATE INDEX idx_trade_reputation_reviewed ON trade_reputation(reviewed_id);
CREATE INDEX idx_trade_reputation_reviewer ON trade_reputation(reviewer_id);
CREATE INDEX idx_trade_reputation_rating ON trade_reputation(rating);
CREATE INDEX idx_trade_reputation_created ON trade_reputation(created_at DESC);

-- =====================================================
-- 5. TABELA: trade_favorites (Lista de Desejos)
-- =====================================================
-- Jogadores podem favoritar listings
CREATE TABLE IF NOT EXISTS trade_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES trade_listings(id) ON DELETE CASCADE,

  -- Alertas de preço
  alert_price_moedas INTEGER,
  alert_price_fragmentos INTEGER,
  notify_on_price_drop BOOLEAN DEFAULT false,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, listing_id)
);

-- Índices
CREATE INDEX idx_trade_favorites_user ON trade_favorites(user_id);
CREATE INDEX idx_trade_favorites_listing ON trade_favorites(listing_id);

-- =====================================================
-- 6. VIEW: trade_user_stats (Estatísticas de Usuários)
-- =====================================================
-- View para estatísticas de trade de cada usuário
CREATE OR REPLACE VIEW trade_user_stats AS
SELECT
  u.id as user_id,

  -- Vendas
  COUNT(DISTINCT t_sell.id) as total_sales,
  COALESCE(SUM(CASE WHEN t_sell.status = 'completed' THEN t_sell.price_moedas ELSE 0 END), 0) as total_moedas_earned,
  COALESCE(SUM(CASE WHEN t_sell.status = 'completed' THEN t_sell.price_fragmentos ELSE 0 END), 0) as total_fragmentos_earned,

  -- Compras
  COUNT(DISTINCT t_buy.id) as total_purchases,
  COALESCE(SUM(CASE WHEN t_buy.status = 'completed' THEN t_buy.price_moedas ELSE 0 END), 0) as total_moedas_spent,
  COALESCE(SUM(CASE WHEN t_buy.status = 'completed' THEN t_buy.price_fragmentos ELSE 0 END), 0) as total_fragmentos_spent,

  -- Reputação
  COALESCE(AVG(r.rating), 0) as avg_rating,
  COUNT(DISTINCT r.id) as total_reviews,

  -- Listings ativos
  COUNT(DISTINCT l.id) as active_listings

FROM auth.users u
LEFT JOIN trade_transactions t_sell ON t_sell.seller_id = u.id
LEFT JOIN trade_transactions t_buy ON t_buy.buyer_id = u.id
LEFT JOIN trade_reputation r ON r.reviewed_id = u.id
LEFT JOIN trade_listings l ON l.seller_id = u.id AND l.status = 'active'
GROUP BY u.id;

-- =====================================================
-- 7. FUNÇÕES AUXILIARES
-- =====================================================

-- Função para cancelar listing expirado automaticamente
CREATE OR REPLACE FUNCTION expire_old_listings()
RETURNS void AS $$
BEGIN
  UPDATE trade_listings
  SET status = 'expired'
  WHERE status = 'active'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Função para calcular taxa do sistema (5%)
CREATE OR REPLACE FUNCTION calculate_system_fee(amount INTEGER)
RETURNS INTEGER AS $$
BEGIN
  RETURN FLOOR(amount * 0.05);
END;
$$ LANGUAGE plpgsql;

-- Função para verificar se avatar pode ser vendido
CREATE OR REPLACE FUNCTION can_sell_avatar(p_avatar_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  avatar_record RECORD;
  active_listing_exists BOOLEAN;
BEGIN
  -- Verificar se avatar existe e pertence ao usuário
  SELECT * INTO avatar_record
  FROM avatares
  WHERE id = p_avatar_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Não pode vender avatar morto com marca da morte
  IF NOT avatar_record.vivo AND avatar_record.marca_morte THEN
    RETURN false;
  END IF;

  -- Não pode vender avatar ativo
  IF avatar_record.ativo THEN
    RETURN false;
  END IF;

  -- Verificar se já existe listing ativo para este avatar
  SELECT EXISTS(
    SELECT 1 FROM trade_listings
    WHERE avatar_id = p_avatar_id
      AND status = 'active'
  ) INTO active_listing_exists;

  IF active_listing_exists THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. POLICIES RLS (Row Level Security)
-- =====================================================

-- Habilitar RLS nas tabelas
ALTER TABLE trade_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_reputation ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_favorites ENABLE ROW LEVEL SECURITY;

-- Policies para trade_listings
CREATE POLICY "Todos podem ver listings ativos"
  ON trade_listings FOR SELECT
  USING (status = 'active' OR auth.uid() = seller_id);

CREATE POLICY "Usuários podem criar seus próprios listings"
  ON trade_listings FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Vendedores podem atualizar seus listings"
  ON trade_listings FOR UPDATE
  USING (auth.uid() = seller_id);

CREATE POLICY "Vendedores podem deletar seus listings"
  ON trade_listings FOR DELETE
  USING (auth.uid() = seller_id);

-- Policies para trade_transactions
CREATE POLICY "Usuários veem suas próprias transações"
  ON trade_transactions FOR SELECT
  USING (auth.uid() = seller_id OR auth.uid() = buyer_id);

-- Policies para trade_offers
CREATE POLICY "Vendedor e ofertante veem ofertas"
  ON trade_offers FOR SELECT
  USING (
    auth.uid() = buyer_id OR
    auth.uid() IN (SELECT seller_id FROM trade_listings WHERE id = listing_id)
  );

CREATE POLICY "Usuários podem criar ofertas"
  ON trade_offers FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

-- Policies para trade_reputation
CREATE POLICY "Todos podem ver reputações"
  ON trade_reputation FOR SELECT
  USING (true);

CREATE POLICY "Usuários podem avaliar suas transações"
  ON trade_reputation FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

-- Policies para trade_favorites
CREATE POLICY "Usuários veem seus próprios favoritos"
  ON trade_favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários gerenciam seus favoritos"
  ON trade_favorites FOR ALL
  USING (auth.uid() = user_id);

-- =====================================================
-- 9. DADOS INICIAIS / CONFIGURAÇÕES
-- =====================================================

-- Tabela de configurações do sistema de trade
CREATE TABLE IF NOT EXISTS trade_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO trade_config (key, value, description) VALUES
  ('system_fee_percentage', '0.05', 'Taxa do sistema em transações (5%)'),
  ('listing_duration_days', '30', 'Duração padrão de um listing em dias'),
  ('offer_duration_days', '7', 'Duração padrão de uma oferta em dias'),
  ('max_active_listings_per_user', '20', 'Máximo de listings ativos por usuário'),
  ('min_avatar_level_to_sell', '1', 'Nível mínimo do avatar para venda'),
  ('featured_listing_cost_moedas', '1000', 'Custo para destacar listing'),
  ('allow_avatar_trades', 'true', 'Permitir troca de avatares'),
  ('allow_item_trades', 'true', 'Permitir troca de itens')
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- FIM DO SCHEMA
-- =====================================================

-- Comentários nas tabelas
COMMENT ON TABLE trade_listings IS 'Ofertas de venda de avatares e itens';
COMMENT ON TABLE trade_transactions IS 'Histórico completo de todas as transações';
COMMENT ON TABLE trade_offers IS 'Sistema de ofertas e contraofertas';
COMMENT ON TABLE trade_reputation IS 'Avaliações de vendedores e compradores';
COMMENT ON TABLE trade_favorites IS 'Lista de desejos dos jogadores';
COMMENT ON TABLE trade_config IS 'Configurações do sistema de trade';
