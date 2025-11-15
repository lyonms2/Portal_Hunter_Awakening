-- ============================================
-- FUNÇÃO DE ACEITAR DESAFIO (COM TRATAMENTO DE ERROS)
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
  v_error_msg TEXT;
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

  -- Verificar se os avatares existem
  IF NOT EXISTS (SELECT 1 FROM avatares WHERE id = v_challenge.challenger_avatar_id) THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'Avatar do desafiante não encontrado';
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM avatares WHERE id = v_challenge.challenged_avatar_id) THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'Avatar do desafiado não encontrado';
    RETURN;
  END IF;

  -- Criar sala de batalha
  v_match_id := gen_random_uuid();

  BEGIN
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

  EXCEPTION
    WHEN foreign_key_violation THEN
      GET STACKED DIAGNOSTICS v_error_msg = MESSAGE_TEXT;
      RETURN QUERY SELECT FALSE, NULL::UUID, 'Erro ao criar sala: ' || v_error_msg;
    WHEN unique_violation THEN
      RETURN QUERY SELECT FALSE, NULL::UUID, 'Sala já existe para este desafio';
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_error_msg = MESSAGE_TEXT;
      RETURN QUERY SELECT FALSE, NULL::UUID, 'Erro ao criar sala de batalha: ' || v_error_msg;
  END;
END;
$$ LANGUAGE plpgsql;
