-- ==================== MIGRAÇÃO: SISTEMA DE INVENTÁRIO ====================
-- Arquivo: /supabase/migrations/create_inventory_system.sql
-- Data: 2025-11-14
-- Descrição: Cria tabelas para sistema de inventário de itens

-- ========== TABELA: ITEMS (CATÁLOGO DE ITENS DO JOGO) ==========
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  tipo VARCHAR(50) NOT NULL, -- 'consumivel', 'equipamento', 'material', etc
  efeito VARCHAR(50), -- 'cura_hp', 'cura_exaustao', 'buff_temporario', etc
  valor_efeito INTEGER, -- quantidade de HP curado, % de exaustão removida, etc
  preco_compra INTEGER NOT NULL DEFAULT 0, -- preço em moedas
  preco_venda INTEGER NOT NULL DEFAULT 0, -- valor de venda
  raridade VARCHAR(20) DEFAULT 'Comum', -- Comum, Raro, Lendário
  icone VARCHAR(10) DEFAULT '📦', -- emoji do item
  empilhavel BOOLEAN DEFAULT true, -- pode empilhar no inventário
  max_pilha INTEGER DEFAULT 99, -- máximo de itens por pilha
  requer_avatar_ativo BOOLEAN DEFAULT false, -- precisa ter avatar ativo para usar
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_items_tipo ON items(tipo);
CREATE INDEX IF NOT EXISTS idx_items_raridade ON items(raridade);

-- ========== TABELA: PLAYER_INVENTORY (INVENTÁRIO DOS JOGADORES) ==========
CREATE TABLE IF NOT EXISTS player_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  quantidade INTEGER NOT NULL DEFAULT 1 CHECK (quantidade > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, item_id) -- Um jogador só pode ter uma entrada por item (empilhável)
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_player_inventory_user_id ON player_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_player_inventory_item_id ON player_inventory(item_id);

-- ========== INSERIR ITEM INICIAL: POÇÃO DE VIDA ==========
INSERT INTO items (
  nome,
  descricao,
  tipo,
  efeito,
  valor_efeito,
  preco_compra,
  preco_venda,
  raridade,
  icone,
  empilhavel,
  max_pilha,
  requer_avatar_ativo
) VALUES (
  'Poção de Vida',
  'Uma poção mágica que restaura 50 HP do avatar ativo. Essencial para caçadores em missões perigosas.',
  'consumivel',
  'cura_hp',
  50,
  100, -- custa 100 moedas
  30,  -- vende por 30 moedas
  'Comum',
  '🧪',
  true,
  99,
  true -- requer avatar ativo para usar
) ON CONFLICT DO NOTHING;

-- ========== COMENTÁRIOS EXPLICATIVOS ==========
COMMENT ON TABLE items IS 'Catálogo de todos os itens disponíveis no jogo';
COMMENT ON TABLE player_inventory IS 'Inventário individual de cada jogador';
COMMENT ON COLUMN items.efeito IS 'Tipo de efeito: cura_hp, cura_exaustao, buff_temporario, etc';
COMMENT ON COLUMN items.valor_efeito IS 'Valor numérico do efeito (HP curado, % exaustão removida, etc)';
COMMENT ON COLUMN player_inventory.quantidade IS 'Quantidade de itens empilhados';

-- ========== VERIFICAÇÃO ==========
SELECT
  'ITEMS' as tabela,
  COUNT(*) as total_registros
FROM items
UNION ALL
SELECT
  'PLAYER_INVENTORY' as tabela,
  COUNT(*) as total_registros
FROM player_inventory;
