-- ============================================================================
-- SISTEMA PVP - ESTRUTURA DE BANCO DE DADOS
-- ============================================================================
-- Este arquivo contém todas as tabelas necessárias para o sistema PvP completo
-- incluindo: Temporadas, Rankings, Leaderboard, Histórico e Recompensas
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TABELA: pvp_temporadas
-- Gerencia as temporadas do PvP (criadas automaticamente todo mês)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pvp_temporadas (
  id SERIAL PRIMARY KEY,
  temporada_id VARCHAR(7) NOT NULL UNIQUE, -- "2025-01", "2025-02", etc.
  nome VARCHAR(100) NOT NULL, -- "Temporada Jan/2025"
  data_inicio TIMESTAMP NOT NULL,
  data_fim TIMESTAMP NOT NULL,
  ativa BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),

  -- Índices
  CONSTRAINT temporada_id_format CHECK (temporada_id ~ '^\d{4}-\d{2}$')
);

-- Índice para buscar temporada ativa
CREATE INDEX idx_temporadas_ativa ON pvp_temporadas(ativa) WHERE ativa = true;
CREATE INDEX idx_temporadas_data_fim ON pvp_temporadas(data_fim DESC);

-- ----------------------------------------------------------------------------
-- TABELA: pvp_rankings
-- Armazena o ranking atual de cada jogador na temporada ativa
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pvp_rankings (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL, -- Referência para player_stats.user_id ou auth.users.id
  temporada_id VARCHAR(7) NOT NULL REFERENCES pvp_temporadas(temporada_id) ON DELETE CASCADE,

  -- Stats atuais
  fama INTEGER NOT NULL DEFAULT 1000,
  vitorias INTEGER NOT NULL DEFAULT 0,
  derrotas INTEGER NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0, -- Streak atual
  streak_maximo INTEGER NOT NULL DEFAULT 0, -- Maior streak da temporada

  -- Controle
  ultima_batalha TIMESTAMP,
  recompensas_recebidas BOOLEAN DEFAULT false,
  updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),

  -- Constraints
  UNIQUE(user_id, temporada_id), -- Um registro por jogador por temporada
  CONSTRAINT fama_min CHECK (fama >= 0),
  CONSTRAINT stats_positivos CHECK (vitorias >= 0 AND derrotas >= 0 AND streak >= 0)
);

-- Índices para performance
CREATE INDEX idx_rankings_user ON pvp_rankings(user_id);
CREATE INDEX idx_rankings_temporada ON pvp_rankings(temporada_id);
CREATE INDEX idx_rankings_fama ON pvp_rankings(fama DESC); -- Para leaderboard
CREATE INDEX idx_rankings_temporada_fama ON pvp_rankings(temporada_id, fama DESC); -- Composto para leaderboard por temporada

-- ----------------------------------------------------------------------------
-- TABELA: pvp_historico_temporadas
-- Armazena o histórico final de cada jogador em temporadas passadas
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pvp_historico_temporadas (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL, -- Referência para player_stats.user_id ou auth.users.id
  temporada_id VARCHAR(7) NOT NULL REFERENCES pvp_temporadas(temporada_id) ON DELETE CASCADE,

  -- Stats finais da temporada
  fama_final INTEGER NOT NULL,
  vitorias INTEGER NOT NULL,
  derrotas INTEGER NOT NULL,
  streak_maximo INTEGER NOT NULL DEFAULT 0,

  -- Ranking final
  posicao_final INTEGER, -- Posição final no leaderboard (1-100+)
  tier_final VARCHAR(20), -- "LENDARIO", "DIAMANTE", etc.

  -- Recompensas
  recompensas_recebidas BOOLEAN DEFAULT false,
  recompensas_json JSONB, -- Detalhes das recompensas: {moedas: 5000, fragmentos: 50, avatar: "lendario", titulo: "Campeão"}

  -- Controle
  data_encerramento TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),

  -- Constraints
  UNIQUE(user_id, temporada_id),
  CONSTRAINT posicao_positiva CHECK (posicao_final IS NULL OR posicao_final > 0)
);

-- Índices
CREATE INDEX idx_historico_user ON pvp_historico_temporadas(user_id);
CREATE INDEX idx_historico_temporada ON pvp_historico_temporadas(temporada_id);
CREATE INDEX idx_historico_user_data ON pvp_historico_temporadas(user_id, data_encerramento DESC);

-- ----------------------------------------------------------------------------
-- TABELA: pvp_batalhas_log
-- Log completo de todas as batalhas PvP (opcional, para estatísticas)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pvp_batalhas_log (
  id SERIAL PRIMARY KEY,
  temporada_id VARCHAR(7) NOT NULL REFERENCES pvp_temporadas(temporada_id) ON DELETE CASCADE,

  -- Jogadores
  jogador1_id UUID NOT NULL, -- Referência para player_stats.user_id ou auth.users.id
  jogador2_id UUID NOT NULL, -- Referência para player_stats.user_id ou auth.users.id

  -- Stats antes da batalha
  jogador1_fama_antes INTEGER NOT NULL,
  jogador2_fama_antes INTEGER NOT NULL,
  jogador1_streak_antes INTEGER NOT NULL DEFAULT 0,
  jogador2_streak_antes INTEGER NOT NULL DEFAULT 0,

  -- Resultado
  vencedor_id UUID, -- Referência para player_stats.user_id ou auth.users.id
  duracao_rodadas INTEGER NOT NULL,

  -- Mudanças pós-batalha
  jogador1_fama_ganho INTEGER NOT NULL, -- Pode ser negativo
  jogador2_fama_ganho INTEGER NOT NULL,

  -- Recompensas
  jogador1_recompensas JSONB, -- {xp: 150, moedas: 120, fama: 25, vinculo: 3, exaustao: 15}
  jogador2_recompensas JSONB,

  -- Flags especiais
  foi_upset BOOLEAN DEFAULT false, -- Se houve upset (rank inferior venceu)
  diferenca_fama INTEGER, -- Diferença de fama entre os jogadores

  -- Controle
  data_batalha TIMESTAMP DEFAULT NOW(),

  -- Constraints
  CONSTRAINT jogadores_diferentes CHECK (jogador1_id != jogador2_id)
);

-- Índices para análises
CREATE INDEX idx_batalhas_jogador1 ON pvp_batalhas_log(jogador1_id);
CREATE INDEX idx_batalhas_jogador2 ON pvp_batalhas_log(jogador2_id);
CREATE INDEX idx_batalhas_temporada ON pvp_batalhas_log(temporada_id);
CREATE INDEX idx_batalhas_data ON pvp_batalhas_log(data_batalha DESC);
CREATE INDEX idx_batalhas_vencedor ON pvp_batalhas_log(vencedor_id);

-- ----------------------------------------------------------------------------
-- TABELA: pvp_titulos
-- Títulos permanentes conquistados pelos jogadores
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pvp_titulos (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL, -- Referência para player_stats.user_id ou auth.users.id

  -- Informações do título
  titulo_id VARCHAR(50) NOT NULL, -- "campeao_2025_01", "vice_campeao_2025_02", etc.
  titulo_nome VARCHAR(100) NOT NULL, -- "Campeão", "Vice-Campeão", "Elite Top 10"
  titulo_icone VARCHAR(10), -- Emoji do título

  -- Origem
  temporada_id VARCHAR(7) NOT NULL REFERENCES pvp_temporadas(temporada_id) ON DELETE CASCADE,
  posicao_conquistada INTEGER NOT NULL, -- Posição que conquistou o título

  -- Controle
  ativo BOOLEAN DEFAULT true, -- Se o título está sendo exibido
  data_conquista TIMESTAMP DEFAULT NOW(),

  -- Constraints
  UNIQUE(user_id, titulo_id)
);

-- Índices
CREATE INDEX idx_titulos_user ON pvp_titulos(user_id);
CREATE INDEX idx_titulos_temporada ON pvp_titulos(temporada_id);
CREATE INDEX idx_titulos_ativo ON pvp_titulos(user_id, ativo) WHERE ativo = true;

-- ----------------------------------------------------------------------------
-- TABELA: pvp_recompensas_pendentes
-- Recompensas de fim de temporada que ainda não foram coletadas
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pvp_recompensas_pendentes (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL, -- Referência para player_stats.user_id ou auth.users.id
  temporada_id VARCHAR(7) NOT NULL REFERENCES pvp_temporadas(temporada_id) ON DELETE CASCADE,

  -- Recompensas
  moedas INTEGER NOT NULL DEFAULT 0,
  fragmentos INTEGER NOT NULL DEFAULT 0,
  avatar_lendario BOOLEAN DEFAULT false,
  avatar_raro BOOLEAN DEFAULT false,
  titulo_id VARCHAR(50), -- ID do título a ser concedido

  -- Status
  coletada BOOLEAN DEFAULT false,
  data_coleta TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),

  -- Constraints
  UNIQUE(user_id, temporada_id)
);

-- Índices
CREATE INDEX idx_recompensas_user ON pvp_recompensas_pendentes(user_id);
CREATE INDEX idx_recompensas_pendentes ON pvp_recompensas_pendentes(user_id, coletada) WHERE coletada = false;

-- ============================================================================
-- VIEWS ÚTEIS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- VIEW: leaderboard_atual
-- Leaderboard da temporada ativa com todas as informações
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW leaderboard_atual AS
SELECT
  ROW_NUMBER() OVER (ORDER BY r.fama DESC, r.vitorias DESC, r.derrotas ASC) AS posicao,
  r.user_id,
  ps.nome_operacao AS nome_usuario,
  r.fama,
  r.vitorias,
  r.derrotas,
  r.streak,
  r.streak_maximo,
  CASE
    WHEN (r.vitorias + r.derrotas) > 0
    THEN ROUND((r.vitorias::NUMERIC / (r.vitorias + r.derrotas)) * 100, 0)
    ELSE 0
  END AS win_rate,
  t.temporada_id,
  t.nome AS temporada_nome,
  r.ultima_batalha
FROM pvp_rankings r
LEFT JOIN player_stats ps ON r.user_id = ps.user_id
JOIN pvp_temporadas t ON r.temporada_id = t.temporada_id
WHERE t.ativa = true
ORDER BY r.fama DESC, r.vitorias DESC, r.derrotas ASC;

-- ----------------------------------------------------------------------------
-- VIEW: top_100_atual
-- Top 100 jogadores da temporada ativa
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW top_100_atual AS
SELECT * FROM leaderboard_atual
LIMIT 100;

-- ----------------------------------------------------------------------------
-- VIEW: estatisticas_jogador
-- Estatísticas completas de um jogador (todas as temporadas)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW estatisticas_jogador AS
SELECT
  ps.user_id,
  ps.nome_operacao AS nome,

  -- Stats da temporada atual
  COALESCE(r.fama, 1000) AS fama_atual,
  COALESCE(r.vitorias, 0) AS vitorias_temporada_atual,
  COALESCE(r.derrotas, 0) AS derrotas_temporada_atual,
  COALESCE(r.streak, 0) AS streak_atual,

  -- Stats totais de todas as temporadas
  COALESCE(r.vitorias, 0) + COALESCE(SUM(h.vitorias), 0) AS vitorias_total,
  COALESCE(r.derrotas, 0) + COALESCE(SUM(h.derrotas), 0) AS derrotas_total,

  -- Melhor desempenho histórico
  GREATEST(COALESCE(r.fama, 0), COALESCE(MAX(h.fama_final), 0)) AS melhor_fama,
  GREATEST(COALESCE(r.streak_maximo, 0), COALESCE(MAX(h.streak_maximo), 0)) AS melhor_streak,
  MIN(h.posicao_final) AS melhor_posicao, -- Menor número = melhor posição

  -- Temporadas jogadas
  COUNT(h.id) AS temporadas_jogadas,

  -- Títulos
  COUNT(DISTINCT t.id) AS total_titulos

FROM player_stats ps
LEFT JOIN pvp_rankings r ON ps.user_id = r.user_id AND r.temporada_id = (SELECT temporada_id FROM pvp_temporadas WHERE ativa = true LIMIT 1)
LEFT JOIN pvp_historico_temporadas h ON ps.user_id = h.user_id
LEFT JOIN pvp_titulos t ON ps.user_id = t.user_id
GROUP BY ps.user_id, ps.nome_operacao, r.fama, r.vitorias, r.derrotas, r.streak, r.streak_maximo;

-- ============================================================================
-- FUNÇÕES ÚTEIS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- FUNÇÃO: criar_nova_temporada()
-- Cria uma nova temporada automaticamente (rodar todo dia 1 do mês)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION criar_nova_temporada()
RETURNS void AS $$
DECLARE
  v_temporada_id VARCHAR(7);
  v_nome VARCHAR(100);
  v_data_inicio TIMESTAMP;
  v_data_fim TIMESTAMP;
  v_mes_nome TEXT[] := ARRAY['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
BEGIN
  -- Desativar temporada anterior
  UPDATE pvp_temporadas SET ativa = false WHERE ativa = true;

  -- Calcular dados da nova temporada
  v_data_inicio := DATE_TRUNC('month', NOW());
  v_data_fim := DATE_TRUNC('month', NOW() + INTERVAL '1 month') - INTERVAL '1 second';
  v_temporada_id := TO_CHAR(NOW(), 'YYYY-MM');
  v_nome := 'Temporada ' || v_mes_nome[EXTRACT(MONTH FROM NOW())::INT] || '/' || EXTRACT(YEAR FROM NOW());

  -- Criar nova temporada
  INSERT INTO pvp_temporadas (temporada_id, nome, data_inicio, data_fim, ativa)
  VALUES (v_temporada_id, v_nome, v_data_inicio, v_data_fim, true);

  RAISE NOTICE 'Nova temporada criada: % (%)', v_nome, v_temporada_id;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- FUNÇÃO: encerrar_temporada()
-- Encerra a temporada atual e salva histórico de todos os jogadores
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION encerrar_temporada()
RETURNS void AS $$
DECLARE
  v_temporada_id VARCHAR(7);
  v_jogador RECORD;
  v_posicao INTEGER;
BEGIN
  -- Buscar temporada ativa
  SELECT temporada_id INTO v_temporada_id
  FROM pvp_temporadas
  WHERE ativa = true
  LIMIT 1;

  IF v_temporada_id IS NULL THEN
    RAISE EXCEPTION 'Nenhuma temporada ativa encontrada!';
  END IF;

  -- Para cada jogador, salvar histórico
  FOR v_jogador IN
    SELECT
      user_id,
      fama,
      vitorias,
      derrotas,
      streak_maximo,
      (SELECT COUNT(*) + 1 FROM pvp_rankings r2
       WHERE r2.temporada_id = v_temporada_id
       AND r2.fama > r1.fama) AS posicao_final
    FROM pvp_rankings r1
    WHERE temporada_id = v_temporada_id
    AND (vitorias > 0 OR derrotas > 0) -- Só salvar quem jogou
  LOOP
    -- Determinar tier final
    DECLARE
      v_tier VARCHAR(20);
    BEGIN
      v_tier := CASE
        WHEN v_jogador.fama >= 3500 THEN 'LENDARIO'
        WHEN v_jogador.fama >= 2500 THEN 'DIAMANTE'
        WHEN v_jogador.fama >= 1800 THEN 'PLATINA'
        WHEN v_jogador.fama >= 1400 THEN 'OURO'
        WHEN v_jogador.fama >= 1200 THEN 'PRATA'
        ELSE 'BRONZE'
      END;

      -- Inserir histórico
      INSERT INTO pvp_historico_temporadas (
        user_id, temporada_id, fama_final, vitorias, derrotas,
        streak_maximo, posicao_final, tier_final, data_encerramento
      )
      VALUES (
        v_jogador.user_id, v_temporada_id, v_jogador.fama,
        v_jogador.vitorias, v_jogador.derrotas, v_jogador.streak_maximo,
        v_jogador.posicao_final, v_tier, NOW()
      );

      -- Gerar recompensas se estiver no top 100
      IF v_jogador.posicao_final <= 100 THEN
        PERFORM gerar_recompensas_temporada(v_jogador.user_id, v_temporada_id, v_jogador.posicao_final);
      END IF;
    END;
  END LOOP;

  -- Desativar temporada
  UPDATE pvp_temporadas SET ativa = false WHERE temporada_id = v_temporada_id;

  RAISE NOTICE 'Temporada % encerrada com sucesso!', v_temporada_id;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- FUNÇÃO: gerar_recompensas_temporada()
-- Gera recompensas de fim de temporada baseado na posição
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION gerar_recompensas_temporada(
  p_user_id UUID,
  p_temporada_id VARCHAR(7),
  p_posicao INTEGER
)
RETURNS void AS $$
DECLARE
  v_moedas INTEGER := 0;
  v_fragmentos INTEGER := 0;
  v_avatar_lendario BOOLEAN := false;
  v_avatar_raro BOOLEAN := false;
  v_titulo_id VARCHAR(50);
BEGIN
  -- Calcular recompensas baseado na posição
  IF p_posicao = 1 THEN
    v_moedas := 5000;
    v_fragmentos := 50;
    v_avatar_lendario := true;
    v_titulo_id := 'campeao_' || p_temporada_id;
  ELSIF p_posicao <= 3 THEN
    v_moedas := 3000;
    v_fragmentos := 30;
    v_avatar_raro := true;
    v_titulo_id := CASE p_posicao
      WHEN 2 THEN 'vice_campeao_' || p_temporada_id
      WHEN 3 THEN 'terceiro_lugar_' || p_temporada_id
    END;
  ELSIF p_posicao <= 10 THEN
    v_moedas := 1500;
    v_fragmentos := 20;
    v_titulo_id := 'elite_top10_' || p_temporada_id;
  ELSIF p_posicao <= 50 THEN
    v_moedas := 800;
    v_fragmentos := 10;
  ELSIF p_posicao <= 100 THEN
    v_moedas := 400;
    v_fragmentos := 5;
  END IF;

  -- Inserir recompensas pendentes
  INSERT INTO pvp_recompensas_pendentes (
    user_id, temporada_id, moedas, fragmentos,
    avatar_lendario, avatar_raro, titulo_id
  )
  VALUES (
    p_user_id, p_temporada_id, v_moedas, v_fragmentos,
    v_avatar_lendario, v_avatar_raro, v_titulo_id
  );

  -- Criar título se aplicável
  IF v_titulo_id IS NOT NULL THEN
    DECLARE
      v_titulo_nome VARCHAR(100);
      v_titulo_icone VARCHAR(10);
    BEGIN
      v_titulo_nome := CASE p_posicao
        WHEN 1 THEN 'Campeão'
        WHEN 2 THEN 'Vice-Campeão'
        WHEN 3 THEN '3º Lugar'
        ELSE 'Elite Top 10'
      END;

      v_titulo_icone := CASE p_posicao
        WHEN 1 THEN '👑'
        WHEN 2 THEN '🥈'
        WHEN 3 THEN '🥉'
        ELSE '⭐'
      END;

      INSERT INTO pvp_titulos (
        user_id, titulo_id, titulo_nome, titulo_icone,
        temporada_id, posicao_conquistada
      )
      VALUES (
        p_user_id, v_titulo_id, v_titulo_nome, v_titulo_icone,
        p_temporada_id, p_posicao
      );
    END;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- FUNÇÃO: atualizar_ranking_apos_batalha()
-- Atualiza o ranking de ambos os jogadores após uma batalha
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION atualizar_ranking_apos_batalha(
  p_temporada_id VARCHAR(7),
  p_jogador1_id UUID,
  p_jogador2_id UUID,
  p_vencedor_id UUID,
  p_jogador1_fama_ganho INTEGER,
  p_jogador2_fama_ganho INTEGER
)
RETURNS void AS $$
BEGIN
  -- Atualizar jogador 1
  UPDATE pvp_rankings
  SET
    fama = GREATEST(0, fama + p_jogador1_fama_ganho),
    vitorias = CASE WHEN p_vencedor_id = p_jogador1_id THEN vitorias + 1 ELSE vitorias END,
    derrotas = CASE WHEN p_vencedor_id != p_jogador1_id THEN derrotas + 1 ELSE derrotas END,
    streak = CASE WHEN p_vencedor_id = p_jogador1_id THEN streak + 1 ELSE 0 END,
    streak_maximo = CASE
      WHEN p_vencedor_id = p_jogador1_id AND (streak + 1) > streak_maximo
      THEN streak + 1
      ELSE streak_maximo
    END,
    ultima_batalha = NOW(),
    updated_at = NOW()
  WHERE user_id = p_jogador1_id AND temporada_id = p_temporada_id;

  -- Atualizar jogador 2
  UPDATE pvp_rankings
  SET
    fama = GREATEST(0, fama + p_jogador2_fama_ganho),
    vitorias = CASE WHEN p_vencedor_id = p_jogador2_id THEN vitorias + 1 ELSE vitorias END,
    derrotas = CASE WHEN p_vencedor_id != p_jogador2_id THEN derrotas + 1 ELSE derrotas END,
    streak = CASE WHEN p_vencedor_id = p_jogador2_id THEN streak + 1 ELSE 0 END,
    streak_maximo = CASE
      WHEN p_vencedor_id = p_jogador2_id AND (streak + 1) > streak_maximo
      THEN streak + 1
      ELSE streak_maximo
    END,
    ultima_batalha = NOW(),
    updated_at = NOW()
  WHERE user_id = p_jogador2_id AND temporada_id = p_temporada_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger para criar registro de ranking quando jogador entra na temporada pela primeira vez
CREATE OR REPLACE FUNCTION criar_ranking_inicial()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir registro inicial se não existir
  INSERT INTO pvp_rankings (user_id, temporada_id, fama, vitorias, derrotas, streak)
  SELECT NEW.user_id, t.temporada_id, 1000, 0, 0, 0
  FROM pvp_temporadas t
  WHERE t.ativa = true
  ON CONFLICT (user_id, temporada_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Não aplicar trigger por enquanto (seria em alguma tabela de "entrou no PvP")
-- CREATE TRIGGER trigger_criar_ranking_inicial
-- AFTER INSERT ON alguma_tabela
-- FOR EACH ROW EXECUTE FUNCTION criar_ranking_inicial();

-- ============================================================================
-- DADOS INICIAIS
-- ============================================================================

-- Criar primeira temporada (ajuste a data conforme necessário)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pvp_temporadas LIMIT 1) THEN
    PERFORM criar_nova_temporada();
  END IF;
END $$;

-- ============================================================================
-- ÍNDICES ADICIONAIS PARA PERFORMANCE
-- ============================================================================

-- Índice para buscar recompensas pendentes de um jogador
CREATE INDEX IF NOT EXISTS idx_recompensas_user_pendente
ON pvp_recompensas_pendentes(user_id)
WHERE coletada = false;

-- Índice para ordenação do leaderboard
CREATE INDEX IF NOT EXISTS idx_rankings_leaderboard
ON pvp_rankings(temporada_id, fama DESC, vitorias DESC, derrotas ASC);

-- ============================================================================
-- COMENTÁRIOS DAS TABELAS
-- ============================================================================

COMMENT ON TABLE pvp_temporadas IS 'Gerencia as temporadas mensais do PvP';
COMMENT ON TABLE pvp_rankings IS 'Ranking atual de cada jogador na temporada ativa';
COMMENT ON TABLE pvp_historico_temporadas IS 'Histórico de desempenho de jogadores em temporadas passadas';
COMMENT ON TABLE pvp_batalhas_log IS 'Log completo de todas as batalhas PvP para estatísticas';
COMMENT ON TABLE pvp_titulos IS 'Títulos permanentes conquistados pelos jogadores';
COMMENT ON TABLE pvp_recompensas_pendentes IS 'Recompensas de fim de temporada aguardando coleta';

COMMENT ON VIEW leaderboard_atual IS 'Leaderboard completo da temporada ativa';
COMMENT ON VIEW top_100_atual IS 'Top 100 jogadores da temporada ativa';
COMMENT ON VIEW estatisticas_jogador IS 'Estatísticas completas de cada jogador (todas as temporadas)';

-- ============================================================================
-- FIM DO ARQUIVO
-- ============================================================================
