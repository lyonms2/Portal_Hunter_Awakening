-- ============================================
-- TABELA DE FILA DE MATCHMAKING PVP AO VIVO
-- ============================================

-- Tabela para gerenciar a fila de jogadores procurando partida
CREATE TABLE IF NOT EXISTS pvp_matchmaking_queue (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  avatar_id BIGINT NOT NULL REFERENCES avatares(id) ON DELETE CASCADE,

  -- Stats do avatar para matchmaking
  nivel INT NOT NULL,
  poder_total INT NOT NULL, -- Soma de força + agilidade + resistência + foco
  fama INT NOT NULL DEFAULT 1000,

  -- Status da fila
  status VARCHAR(20) NOT NULL DEFAULT 'waiting', -- 'waiting', 'matched', 'in_battle'
  match_id UUID, -- ID da partida quando encontrar oponente
  opponent_user_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,

  -- Timestamps
  entered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  matched_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '2 minutes'), -- Expira após 2 minutos

  -- Constraints
  UNIQUE(user_id), -- Um jogador só pode estar na fila uma vez
  CHECK (status IN ('waiting', 'matched', 'in_battle'))
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_queue_status ON pvp_matchmaking_queue(status);
CREATE INDEX IF NOT EXISTS idx_queue_poder ON pvp_matchmaking_queue(poder_total) WHERE status = 'waiting';
CREATE INDEX IF NOT EXISTS idx_queue_nivel ON pvp_matchmaking_queue(nivel) WHERE status = 'waiting';
CREATE INDEX IF NOT EXISTS idx_queue_expires ON pvp_matchmaking_queue(expires_at) WHERE status = 'waiting';
CREATE INDEX IF NOT EXISTS idx_queue_match_id ON pvp_matchmaking_queue(match_id);

-- ============================================
-- TABELA DE SALAS DE BATALHA AO VIVO
-- ============================================

CREATE TABLE IF NOT EXISTS pvp_battle_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Jogadores
  player1_user_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  player1_avatar_id BIGINT NOT NULL REFERENCES avatares(id) ON DELETE CASCADE,
  player1_ready BOOLEAN DEFAULT FALSE,
  player1_connected BOOLEAN DEFAULT TRUE,
  player1_last_action TIMESTAMPTZ DEFAULT NOW(),

  player2_user_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  player2_avatar_id BIGINT NOT NULL REFERENCES avatares(id) ON DELETE CASCADE,
  player2_ready BOOLEAN DEFAULT FALSE,
  player2_connected BOOLEAN DEFAULT TRUE,
  player2_last_action TIMESTAMPTZ DEFAULT NOW(),

  -- Estado da batalha
  status VARCHAR(20) NOT NULL DEFAULT 'waiting', -- 'waiting', 'active', 'finished', 'cancelled'
  current_turn INT DEFAULT 1,
  current_player INT DEFAULT 1, -- 1 ou 2
  winner_user_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,

  -- Dados da batalha (JSON com histórico de ações)
  battle_data JSONB DEFAULT '{"rounds": [], "actions": []}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '15 minutes'),

  -- Constraints
  CHECK (status IN ('waiting', 'active', 'finished', 'cancelled')),
  CHECK (current_player IN (1, 2))
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_battle_rooms_status ON pvp_battle_rooms(status);
CREATE INDEX IF NOT EXISTS idx_battle_rooms_player1 ON pvp_battle_rooms(player1_user_id) WHERE status IN ('waiting', 'active');
CREATE INDEX IF NOT EXISTS idx_battle_rooms_player2 ON pvp_battle_rooms(player2_user_id) WHERE status IN ('waiting', 'active');

-- ============================================
-- FUNÇÕES DE LIMPEZA AUTOMÁTICA
-- ============================================

-- Limpar entradas expiradas da fila
CREATE OR REPLACE FUNCTION cleanup_expired_queue_entries()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM pvp_matchmaking_queue
  WHERE status = 'waiting' AND expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Limpar salas de batalha expiradas
CREATE OR REPLACE FUNCTION cleanup_expired_battle_rooms()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  UPDATE pvp_battle_rooms
  SET status = 'cancelled'
  WHERE status IN ('waiting', 'active') AND expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNÇÃO DE MATCHMAKING
-- ============================================

CREATE OR REPLACE FUNCTION find_pvp_match(
  p_user_id UUID,
  p_nivel INT,
  p_poder_total INT,
  p_fama INT
)
RETURNS TABLE (
  matched BOOLEAN,
  opponent_user_id UUID,
  opponent_avatar_id BIGINT,
  match_id UUID
) AS $$
DECLARE
  v_opponent RECORD;
  v_match_id UUID;
  v_poder_min INT;
  v_poder_max INT;
  v_nivel_min INT;
  v_nivel_max INT;
BEGIN
  -- Limpar entradas expiradas primeiro
  PERFORM cleanup_expired_queue_entries();

  -- Calcular faixas de matchmaking
  v_poder_min := GREATEST(0, p_poder_total - 50); -- ±50 de poder
  v_poder_max := p_poder_total + 50;
  v_nivel_min := GREATEST(1, p_nivel - 3); -- ±3 níveis
  v_nivel_max := p_nivel + 3;

  -- Buscar oponente compatível
  SELECT q.user_id, q.avatar_id
  INTO v_opponent
  FROM pvp_matchmaking_queue q
  WHERE q.status = 'waiting'
    AND q.user_id != p_user_id
    AND q.nivel BETWEEN v_nivel_min AND v_nivel_max
    AND q.poder_total BETWEEN v_poder_min AND v_poder_max
    AND q.expires_at > NOW()
  ORDER BY ABS(q.poder_total - p_poder_total) ASC, -- Mais próximo em poder
           ABS(q.fama - p_fama) ASC -- Depois por fama
  LIMIT 1;

  -- Se encontrou oponente, criar sala de batalha
  IF v_opponent.user_id IS NOT NULL THEN
    v_match_id := gen_random_uuid();

    -- Criar sala de batalha
    INSERT INTO pvp_battle_rooms (
      id,
      player1_user_id,
      player1_avatar_id,
      player2_user_id,
      player2_avatar_id,
      status
    ) VALUES (
      v_match_id,
      p_user_id,
      (SELECT avatar_id FROM pvp_matchmaking_queue WHERE user_id = p_user_id),
      v_opponent.user_id,
      v_opponent.avatar_id,
      'waiting'
    );

    -- Atualizar status de ambos na fila
    UPDATE pvp_matchmaking_queue
    SET status = 'matched',
        match_id = v_match_id,
        matched_at = NOW(),
        opponent_user_id = CASE
          WHEN user_id = p_user_id THEN v_opponent.user_id
          ELSE p_user_id
        END
    WHERE user_id IN (p_user_id, v_opponent.user_id);

    RETURN QUERY SELECT TRUE, v_opponent.user_id, v_opponent.avatar_id, v_match_id;
  ELSE
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::BIGINT, NULL::UUID;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMENTÁRIOS
-- ============================================

COMMENT ON TABLE pvp_matchmaking_queue IS 'Fila de jogadores procurando partida PvP ao vivo';
COMMENT ON TABLE pvp_battle_rooms IS 'Salas de batalha PvP em tempo real';
COMMENT ON FUNCTION find_pvp_match IS 'Encontra um oponente compatível e cria sala de batalha';
