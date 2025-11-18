-- ===================================================================
-- ADICIONAR CONSTRAINTS PARA SISTEMA DE MERCADO
-- ===================================================================
-- Garante integridade dos dados e previne estados inválidos
-- ===================================================================

-- 1. GARANTIR QUE PREÇOS SEJAM VÁLIDOS QUANDO em_venda = true
-- Se está à venda, pelo menos um preço deve ser maior que 0
ALTER TABLE avatares
DROP CONSTRAINT IF EXISTS check_em_venda_preco;

ALTER TABLE avatares
ADD CONSTRAINT check_em_venda_preco
CHECK (
  (em_venda = false) OR
  (em_venda = true AND (
    COALESCE(preco_venda, 0) > 0 OR COALESCE(preco_fragmentos, 0) > 0
  ))
);

COMMENT ON CONSTRAINT check_em_venda_preco ON avatares IS 'Garante que avatares à venda tenham pelo menos um preço definido';

-- 2. GARANTIR QUE AVATARES MORTOS NÃO ESTEJAM À VENDA
ALTER TABLE avatares
DROP CONSTRAINT IF EXISTS check_venda_vivo;

ALTER TABLE avatares
ADD CONSTRAINT check_venda_vivo
CHECK (
  (vivo = false AND em_venda = false) OR
  vivo = true
);

COMMENT ON CONSTRAINT check_venda_vivo ON avatares IS 'Avatares mortos não podem estar à venda';

-- 3. GARANTIR QUE AVATARES COM MARCA DA MORTE NÃO ESTEJAM À VENDA
ALTER TABLE avatares
DROP CONSTRAINT IF EXISTS check_venda_marca_morte;

ALTER TABLE avatares
ADD CONSTRAINT check_venda_marca_morte
CHECK (
  (marca_morte = true AND em_venda = false) OR
  marca_morte = false OR marca_morte IS NULL
);

COMMENT ON CONSTRAINT check_venda_marca_morte ON avatares IS 'Avatares com marca da morte não podem estar à venda';

-- 4. GARANTIR QUE AVATAR ATIVO NÃO ESTEJA À VENDA
ALTER TABLE avatares
DROP CONSTRAINT IF EXISTS check_venda_ativo;

ALTER TABLE avatares
ADD CONSTRAINT check_venda_ativo
CHECK (
  (ativo = true AND em_venda = false) OR
  ativo = false OR ativo IS NULL
);

COMMENT ON CONSTRAINT check_venda_ativo ON avatares IS 'Avatar ativo não pode estar à venda';

-- 5. GARANTIR QUE PREÇOS SEJAM NULL QUANDO NÃO ESTÁ À VENDA
ALTER TABLE avatares
DROP CONSTRAINT IF EXISTS check_precos_null_quando_nao_venda;

ALTER TABLE avatares
ADD CONSTRAINT check_precos_null_quando_nao_venda
CHECK (
  (em_venda = true) OR
  (em_venda = false AND preco_venda IS NULL AND preco_fragmentos IS NULL)
);

COMMENT ON CONSTRAINT check_precos_null_quando_nao_venda ON avatares IS 'Preços devem ser NULL quando avatar não está à venda';

-- ===================================================================
-- CRIAR ÍNDICES PARA PERFORMANCE
-- ===================================================================

-- Índice composto para buscar avatares à venda
CREATE INDEX IF NOT EXISTS idx_avatares_em_venda_vivo
ON avatares(em_venda, vivo, marca_morte)
WHERE em_venda = true AND vivo = true AND (marca_morte IS NULL OR marca_morte = false);

COMMENT ON INDEX idx_avatares_em_venda_vivo IS 'Acelera queries de listagem de avatares à venda';

-- Índice para filtros de preço
CREATE INDEX IF NOT EXISTS idx_avatares_preco_venda
ON avatares(preco_venda)
WHERE em_venda = true AND preco_venda IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_avatares_preco_fragmentos
ON avatares(preco_fragmentos)
WHERE em_venda = true AND preco_fragmentos IS NOT NULL;

-- ===================================================================
-- TRIGGER: LIMPAR PREÇOS QUANDO AVATAR SAIR DE VENDA
-- ===================================================================

CREATE OR REPLACE FUNCTION limpar_precos_quando_nao_venda()
RETURNS TRIGGER AS $$
BEGIN
  -- Se em_venda mudou de true para false, limpar preços
  IF OLD.em_venda = true AND NEW.em_venda = false THEN
    NEW.preco_venda := NULL;
    NEW.preco_fragmentos := NULL;
  END IF;

  -- Se avatar morreu, tirar da venda
  IF OLD.vivo = true AND NEW.vivo = false THEN
    NEW.em_venda := false;
    NEW.preco_venda := NULL;
    NEW.preco_fragmentos := NULL;
  END IF;

  -- Se avatar recebeu marca da morte, tirar da venda
  IF (OLD.marca_morte IS NULL OR OLD.marca_morte = false) AND NEW.marca_morte = true THEN
    NEW.em_venda := false;
    NEW.preco_venda := NULL;
    NEW.preco_fragmentos := NULL;
  END IF;

  -- Se avatar foi ativado, tirar da venda
  IF OLD.ativo = false AND NEW.ativo = true THEN
    NEW.em_venda := false;
    NEW.preco_venda := NULL;
    NEW.preco_fragmentos := NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_limpar_precos ON avatares;

CREATE TRIGGER trigger_limpar_precos
  BEFORE UPDATE ON avatares
  FOR EACH ROW
  EXECUTE FUNCTION limpar_precos_quando_nao_venda();

COMMENT ON FUNCTION limpar_precos_quando_nao_venda IS 'Automaticamente limpa preços e remove da venda quando avatar morre, é ativado ou recebe marca da morte';

-- ===================================================================
-- VERIFICAÇÃO
-- ===================================================================

-- Listar todos os constraints da tabela avatares relacionados a venda
SELECT
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'avatares'::regclass
  AND conname LIKE '%venda%' OR conname LIKE '%preco%'
ORDER BY conname;

-- Verificar se há avatares em estado inválido
SELECT
  id,
  nome,
  em_venda,
  preco_venda,
  preco_fragmentos,
  vivo,
  ativo,
  marca_morte,
  CASE
    WHEN em_venda = true AND preco_venda IS NULL AND preco_fragmentos IS NULL THEN 'SEM PREÇO'
    WHEN em_venda = false AND (preco_venda IS NOT NULL OR preco_fragmentos IS NOT NULL) THEN 'PREÇO SEM VENDA'
    WHEN vivo = false AND em_venda = true THEN 'MORTO À VENDA'
    WHEN marca_morte = true AND em_venda = true THEN 'MARCA DA MORTE À VENDA'
    WHEN ativo = true AND em_venda = true THEN 'ATIVO À VENDA'
    ELSE 'OK'
  END AS status_validacao
FROM avatares
WHERE
  (em_venda = true AND preco_venda IS NULL AND preco_fragmentos IS NULL) OR
  (em_venda = false AND (preco_venda IS NOT NULL OR preco_fragmentos IS NOT NULL)) OR
  (vivo = false AND em_venda = true) OR
  (marca_morte = true AND em_venda = true) OR
  (ativo = true AND em_venda = true);
