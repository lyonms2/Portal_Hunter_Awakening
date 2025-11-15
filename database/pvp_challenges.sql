-- ============================================
-- SISTEMA DE DESAFIOS PVP (Request/Accept)
-- ============================================
-- Nova abordagem: jogadores escolhem oponentes e enviam desafios
-- Em vez de matchmaking automático com polling

-- Tabela de desafios PvP pendentes
CREATE TABLE IF NOT EXISTS pvp_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Jogador que enviou o desafio
  challenger_user_id UUID NOT NULL,
  challenger_avatar_id UUID NOT NULL REFERENCES avatares(id) ON DELETE CASCADE,

  -- Jogador desafiado
  challenged_user_id UUID NOT NULL,
  challenged_avatar_id UUID NOT NULL REFERENCES avatares(id) ON DELETE CASCADE,

  -- Status do desafio
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'rejected', 'expired', 'cancelled'

  -- Dados para matchmaking (validação)
  challenger_nivel INT NOT NULL,
  challenger_poder INT NOT NULL,
  challenger_fama INT NOT NULL DEFAULT 1000,

  challenged_nivel INT NOT NULL,
  challenged_poder INT NOT NULL,
  challenged_fama INT NOT NULL DEFAULT 1000,

  -- Match ID quando aceito
  match_id UUID,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '5 minutes'), -- Expira em 5 minutos

  -- Constraints
  CHECK (status IN ('pending', 'accepted', 'rejected', 'expired', 'cancelled')),
  CHECK (challenger_user_id != challenged_user_id) -- Não pode desafiar a si mesmo
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_challenges_challenger ON pvp_challenges(challenger_user_id) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_challenges_challenged ON pvp_challenges(challenged_user_id) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_challenges_status ON pvp_challenges(status);
CREATE INDEX IF NOT EXISTS idx_challenges_expires ON pvp_challenges(expires_at) WHERE status = 'pending';

-- ============================================
-- TABELA DE JOGADORES DISPONÍVEIS PARA PVP
-- ============================================
-- Registra quando um jogador está online e disponível para receber desafios

CREATE TABLE IF NOT EXISTS pvp_available_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  avatar_id UUID NOT NULL REFERENCES avatares(id) ON DELETE CASCADE,

  -- Stats do avatar (para exibição)
  nivel INT NOT NULL,
  poder_total INT NOT NULL,
  fama INT NOT NULL DEFAULT 1000,

  -- Status
  is_available BOOLEAN DEFAULT TRUE, -- Se está aceitando desafios

  -- Timestamps
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_heartbeat TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- Atualizado periodicamente
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '2 minutes'), -- Expira se não atualizar

  -- Constraints
  UNIQUE(user_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_available_players_active ON pvp_available_players(user_id) WHERE is_available = TRUE AND expires_at > NOW();
CREATE INDEX IF NOT EXISTS idx_available_players_poder ON pvp_available_players(poder_total) WHERE is_available = TRUE;
CREATE INDEX IF NOT EXISTS idx_available_players_nivel ON pvp_available_players(nivel) WHERE is_available = TRUE;

-- ============================================
-- FUNÇÕES DE LIMPEZA AUTOMÁTICA
-- ============================================

-- Limpar desafios expirados
CREATE OR REPLACE FUNCTION cleanup_expired_challenges()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  UPDATE pvp_challenges
  SET status = 'expired'
  WHERE status = 'pending' AND expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Limpar jogadores inativos da lista de disponíveis
CREATE OR REPLACE FUNCTION cleanup_inactive_players()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM pvp_available_players
  WHERE expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNÇÃO DE CRIAR DESAFIO
-- ============================================

CREATE OR REPLACE FUNCTION create_pvp_challenge(
  p_challenger_user_id UUID,
  p_challenger_avatar_id UUID,
  p_challenger_nivel INT,
  p_challenger_poder INT,
  p_challenger_fama INT,
  p_challenged_user_id UUID,
  p_challenged_avatar_id UUID,
  p_challenged_nivel INT,
  p_challenged_poder INT,
  p_challenged_fama INT
)
RETURNS TABLE (
  success BOOLEAN,
  challenge_id UUID,
  message TEXT
) AS $$
DECLARE
  v_challenge_id UUID;
  v_existing_challenge RECORD;
BEGIN
  -- Limpar desafios expirados primeiro
  PERFORM cleanup_expired_challenges();

  -- Validar: não pode desafiar a si mesmo
  IF p_challenger_user_id = p_challenged_user_id THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'Você não pode desafiar a si mesmo';
    RETURN;
  END IF;

  -- Verificar se já existe um desafio pendente entre esses jogadores
  SELECT * INTO v_existing_challenge
  FROM pvp_challenges
  WHERE status = 'pending'
    AND (
      (challenger_user_id = p_challenger_user_id AND challenged_user_id = p_challenged_user_id)
      OR
      (challenger_user_id = p_challenged_user_id AND challenged_user_id = p_challenger_user_id)
    )
  LIMIT 1;

  IF v_existing_challenge.id IS NOT NULL THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'Já existe um desafio pendente entre vocês';
    RETURN;
  END IF;

  -- Verificar se o desafiado está disponível
  IF NOT EXISTS (
    SELECT 1 FROM pvp_available_players
    WHERE user_id = p_challenged_user_id
      AND is_available = TRUE
      AND expires_at > NOW()
  ) THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'Jogador não está mais disponível';
    RETURN;
  END IF;

  -- Criar o desafio
  INSERT INTO pvp_challenges (
    challenger_user_id,
    challenger_avatar_id,
    challenged_user_id,
    challenged_avatar_id,
    challenger_nivel,
    challenger_poder,
    challenger_fama,
    challenged_nivel,
    challenged_poder,
    challenged_fama,
    status
  ) VALUES (
    p_challenger_user_id,
    p_challenger_avatar_id,
    p_challenged_user_id,
    p_challenged_avatar_id,
    p_challenger_nivel,
    p_challenger_poder,
    p_challenger_fama,
    p_challenged_nivel,
    p_challenged_poder,
    p_challenged_fama,
    'pending'
  ) RETURNING id INTO v_challenge_id;

  RETURN QUERY SELECT TRUE, v_challenge_id, 'Desafio criado com sucesso';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNÇÃO DE ACEITAR DESAFIO
-- ============================================

CREATE OR REPLACE FUNCTION accept_pvp_challenge(
  p_challenge_id UUID,
  p_user_id UUID
)
RETURNS TABLE (
  success BOOLEAN,
  match_id UUID,
  message TEXT
) AS $$
DECLARE
  v_challenge RECORD;
  v_match_id UUID;
BEGIN
  -- Buscar o desafio
  SELECT * INTO v_challenge
  FROM pvp_challenges
  WHERE id = p_challenge_id AND status = 'pending';

  IF v_challenge.id IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'Desafio não encontrado ou já foi respondido';
    RETURN;
  END IF;

  -- Validar que é o jogador desafiado
  IF v_challenge.challenged_user_id != p_user_id THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'Você não pode aceitar este desafio';
    RETURN;
  END IF;

  -- Verificar se o desafio não expirou
  IF v_challenge.expires_at < NOW() THEN
    UPDATE pvp_challenges SET status = 'expired' WHERE id = p_challenge_id;
    RETURN QUERY SELECT FALSE, NULL::UUID, 'Este desafio expirou';
    RETURN;
  END IF;

  -- Criar sala de batalha
  v_match_id := gen_random_uuid();

  INSERT INTO pvp_battle_rooms (
    id,
    player1_user_id,
    player1_avatar_id,
    player2_user_id,
    player2_avatar_id,
    status
  ) VALUES (
    v_match_id,
    v_challenge.challenger_user_id,
    v_challenge.challenger_avatar_id,
    v_challenge.challenged_user_id,
    v_challenge.challenged_avatar_id,
    'waiting'
  );

  -- Atualizar desafio como aceito
  UPDATE pvp_challenges
  SET status = 'accepted',
      match_id = v_match_id,
      responded_at = NOW()
  WHERE id = p_challenge_id;

  -- Remover ambos jogadores da lista de disponíveis
  DELETE FROM pvp_available_players
  WHERE user_id IN (v_challenge.challenger_user_id, v_challenge.challenged_user_id);

  RETURN QUERY SELECT TRUE, v_match_id, 'Desafio aceito! Sala de batalha criada';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNÇÃO DE REJEITAR DESAFIO
-- ============================================

CREATE OR REPLACE FUNCTION reject_pvp_challenge(
  p_challenge_id UUID,
  p_user_id UUID
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_challenge RECORD;
BEGIN
  -- Buscar o desafio
  SELECT * INTO v_challenge
  FROM pvp_challenges
  WHERE id = p_challenge_id AND status = 'pending';

  IF v_challenge.id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Desafio não encontrado ou já foi respondido';
    RETURN;
  END IF;

  -- Validar que é o jogador desafiado
  IF v_challenge.challenged_user_id != p_user_id THEN
    RETURN QUERY SELECT FALSE, 'Você não pode rejeitar este desafio';
    RETURN;
  END IF;

  -- Atualizar desafio como rejeitado
  UPDATE pvp_challenges
  SET status = 'rejected',
      responded_at = NOW()
  WHERE id = p_challenge_id;

  RETURN QUERY SELECT TRUE, 'Desafio rejeitado';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNÇÃO DE CANCELAR DESAFIO (pelo desafiante)
-- ============================================

CREATE OR REPLACE FUNCTION cancel_pvp_challenge(
  p_challenge_id UUID,
  p_user_id UUID
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_challenge RECORD;
BEGIN
  -- Buscar o desafio
  SELECT * INTO v_challenge
  FROM pvp_challenges
  WHERE id = p_challenge_id AND status = 'pending';

  IF v_challenge.id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Desafio não encontrado ou já foi respondido';
    RETURN;
  END IF;

  -- Validar que é o desafiante
  IF v_challenge.challenger_user_id != p_user_id THEN
    RETURN QUERY SELECT FALSE, 'Você não pode cancelar este desafio';
    RETURN;
  END IF;

  -- Atualizar desafio como cancelado
  UPDATE pvp_challenges
  SET status = 'cancelled',
      responded_at = NOW()
  WHERE id = p_challenge_id;

  RETURN QUERY SELECT TRUE, 'Desafio cancelado';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMENTÁRIOS
-- ============================================

COMMENT ON TABLE pvp_challenges IS 'Sistema de desafios PvP (Request/Accept) - jogadores escolhem oponentes';
COMMENT ON TABLE pvp_available_players IS 'Jogadores online disponíveis para receber desafios';
COMMENT ON FUNCTION create_pvp_challenge IS 'Cria um novo desafio PvP entre dois jogadores';
COMMENT ON FUNCTION accept_pvp_challenge IS 'Aceita um desafio e cria sala de batalha';
COMMENT ON FUNCTION reject_pvp_challenge IS 'Rejeita um desafio recebido';
COMMENT ON FUNCTION cancel_pvp_challenge IS 'Cancela um desafio enviado (apenas desafiante)';
