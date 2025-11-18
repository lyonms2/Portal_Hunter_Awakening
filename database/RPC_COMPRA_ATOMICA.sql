-- ===================================================================
-- RPC FUNCTION: COMPRA ATÔMICA DE AVATAR
-- ===================================================================
-- Esta função garante que a compra seja completamente atômica:
-- - Transfere avatar
-- - Deduz recursos do comprador
-- - Adiciona recursos ao vendedor
-- - Registra transação
-- Tudo em uma única transação PostgreSQL (ACID)
-- ===================================================================

CREATE OR REPLACE FUNCTION executar_compra_avatar(
  p_avatar_id UUID,
  p_comprador_id UUID,
  p_preco_moedas INTEGER DEFAULT 0,
  p_preco_fragmentos INTEGER DEFAULT 0
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_avatar RECORD;
  v_vendedor_id UUID;
  v_stats_comprador RECORD;
  v_stats_vendedor RECORD;
  v_taxa_moedas INTEGER;
  v_valor_vendedor_moedas INTEGER;
  v_valor_vendedor_fragmentos INTEGER;
  v_avatares_comprador INTEGER;
  v_resultado JSON;
BEGIN
  -- 1. BUSCAR AVATAR E VALIDAR
  SELECT * INTO v_avatar
  FROM avatares
  WHERE id = p_avatar_id
    AND em_venda = true
    AND vivo = true
    AND (marca_morte IS NULL OR marca_morte = false)
  FOR UPDATE; -- Lock pessimista para evitar compras simultâneas

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Avatar não encontrado ou não está à venda';
  END IF;

  v_vendedor_id := v_avatar.user_id;

  -- 2. VALIDAR QUE NÃO É O PRÓPRIO VENDEDOR
  IF v_vendedor_id = p_comprador_id THEN
    RAISE EXCEPTION 'Você não pode comprar seu próprio avatar';
  END IF;

  -- 3. BUSCAR STATS DO COMPRADOR
  SELECT * INTO v_stats_comprador
  FROM player_stats
  WHERE user_id = p_comprador_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Dados do comprador não encontrados';
  END IF;

  -- 4. VERIFICAR LIMITE DE AVATARES DO COMPRADOR
  SELECT COUNT(*) INTO v_avatares_comprador
  FROM avatares
  WHERE user_id = p_comprador_id
    AND vivo = true
    AND (marca_morte IS NULL OR marca_morte = false);

  IF v_avatares_comprador >= 15 THEN
    RAISE EXCEPTION 'Você atingiu o limite de 15 avatares! Libere espaço antes de comprar.';
  END IF;

  -- 5. VALIDAR PREÇOS
  IF p_preco_moedas != COALESCE(v_avatar.preco_venda, 0) THEN
    RAISE EXCEPTION 'Preço de moedas não corresponde ao anúncio';
  END IF;

  IF p_preco_fragmentos != COALESCE(v_avatar.preco_fragmentos, 0) THEN
    RAISE EXCEPTION 'Preço de fragmentos não corresponde ao anúncio';
  END IF;

  -- 6. VERIFICAR SE COMPRADOR TEM RECURSOS SUFICIENTES
  IF v_stats_comprador.moedas < p_preco_moedas THEN
    RAISE EXCEPTION 'Moedas insuficientes! Necessário: %, Você tem: %', p_preco_moedas, v_stats_comprador.moedas;
  END IF;

  IF v_stats_comprador.fragmentos < p_preco_fragmentos THEN
    RAISE EXCEPTION 'Fragmentos insuficientes! Necessário: %, Você tem: %', p_preco_fragmentos, v_stats_comprador.fragmentos;
  END IF;

  -- 7. BUSCAR STATS DO VENDEDOR
  SELECT * INTO v_stats_vendedor
  FROM player_stats
  WHERE user_id = v_vendedor_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Dados do vendedor não encontrados';
  END IF;

  -- 8. CALCULAR TAXAS (5% em moedas, sem taxa em fragmentos)
  v_taxa_moedas := FLOOR(p_preco_moedas * 0.05);
  v_valor_vendedor_moedas := p_preco_moedas - v_taxa_moedas;
  v_valor_vendedor_fragmentos := p_preco_fragmentos; -- Sem taxa para fragmentos

  -- 9. TRANSFERIR AVATAR PARA COMPRADOR
  UPDATE avatares
  SET
    user_id = p_comprador_id,
    em_venda = false,
    preco_venda = NULL,
    preco_fragmentos = NULL,
    ativo = false,
    vinculo = 0,
    exaustao = 0
  WHERE id = p_avatar_id;

  -- 10. DEDUZIR RECURSOS DO COMPRADOR
  UPDATE player_stats
  SET
    moedas = moedas - p_preco_moedas,
    fragmentos = fragmentos - p_preco_fragmentos,
    updated_at = NOW()
  WHERE user_id = p_comprador_id;

  -- 11. ADICIONAR RECURSOS AO VENDEDOR
  UPDATE player_stats
  SET
    moedas = moedas + v_valor_vendedor_moedas,
    fragmentos = fragmentos + v_valor_vendedor_fragmentos,
    updated_at = NOW()
  WHERE user_id = v_vendedor_id;

  -- 12. REGISTRAR TRANSAÇÃO NO HISTÓRICO
  INSERT INTO mercado_transacoes (
    avatar_id,
    vendedor_id,
    comprador_id,
    preco_moedas,
    preco_fragmentos,
    taxa_moedas,
    valor_vendedor_moedas,
    valor_vendedor_fragmentos
  ) VALUES (
    p_avatar_id,
    v_vendedor_id,
    p_comprador_id,
    p_preco_moedas,
    p_preco_fragmentos,
    v_taxa_moedas,
    v_valor_vendedor_moedas,
    v_valor_vendedor_fragmentos
  );

  -- 13. RETORNAR RESULTADO
  v_resultado := json_build_object(
    'sucesso', true,
    'avatar', json_build_object(
      'id', v_avatar.id,
      'nome', v_avatar.nome,
      'raridade', v_avatar.raridade,
      'elemento', v_avatar.elemento,
      'nivel', v_avatar.nivel
    ),
    'preco_moedas', p_preco_moedas,
    'preco_fragmentos', p_preco_fragmentos,
    'taxa_moedas', v_taxa_moedas,
    'saldo_moedas_restante', v_stats_comprador.moedas - p_preco_moedas,
    'saldo_fragmentos_restante', v_stats_comprador.fragmentos - p_preco_fragmentos
  );

  RETURN v_resultado;

EXCEPTION
  WHEN OTHERS THEN
    -- Em caso de qualquer erro, toda a transação é revertida automaticamente
    RAISE EXCEPTION 'Erro ao processar compra: %', SQLERRM;
END;
$$;

-- ===================================================================
-- COMENTÁRIOS E PERMISSÕES
-- ===================================================================

COMMENT ON FUNCTION executar_compra_avatar IS 'Executa compra de avatar de forma atômica (ACID). Garante que avatar, moedas e fragmentos sejam transferidos de forma segura ou toda a operação é revertida.';

-- Revogar permissões públicas e dar apenas para authenticated users
REVOKE ALL ON FUNCTION executar_compra_avatar FROM PUBLIC;
GRANT EXECUTE ON FUNCTION executar_compra_avatar TO authenticated;

-- ===================================================================
-- TESTE DA FUNÇÃO
-- ===================================================================
-- Para testar, execute:
-- SELECT executar_compra_avatar(
--   '<avatar_id>'::UUID,
--   '<comprador_id>'::UUID,
--   1000, -- preco_moedas
--   0     -- preco_fragmentos
-- );
