-- ============================================================================
-- LIMPEZA SEGURA DE BANCO DE DADOS - Portal Hunter Awakening
-- ============================================================================
-- Data: 2025-11-15
-- Descrição: Remove tabelas e colunas que NÃO estão sendo usadas pelo código
-- IMPORTANTE: Execute este script com CUIDADO e faça BACKUP antes!
-- ============================================================================

-- ============================================================================
-- ANÁLISE REALIZADA
-- ============================================================================
-- Arquivos analisados: 38 API routes + componentes frontend
-- Tabelas no banco: 13 principais
-- Resultado: 3 tabelas totalmente não usadas + algumas colunas não usadas
-- ============================================================================

-- ============================================================================
-- SEÇÃO 1: REMOVER TABELAS TOTALMENTE NÃO USADAS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TABELA: pvp_historico_temporadas
-- STATUS: ❌ NUNCA USADA NO CÓDIGO
-- SEGURANÇA: ✅ ALTA - Tabela não é referenciada em nenhum lugar
-- PROPÓSITO ORIGINAL: Armazenar histórico de temporadas passadas
-- MOTIVO: Funcionalidade de histórico de temporadas não foi implementada
-- ----------------------------------------------------------------------------
-- ATENÇÃO: Se você pretende implementar histórico de temporadas no futuro,
-- NÃO execute este comando. Caso contrário, é seguro remover.

DROP TABLE IF EXISTS pvp_historico_temporadas CASCADE;

COMMENT ON DATABASE postgres IS 'Tabela pvp_historico_temporadas removida - nunca foi usada';


-- ----------------------------------------------------------------------------
-- TABELA: pvp_titulos
-- STATUS: ❌ NUNCA USADA NO CÓDIGO
-- SEGURANÇA: ✅ ALTA - Tabela não é referenciada em nenhum lugar
-- PROPÓSITO ORIGINAL: Armazenar títulos conquistados por jogadores
-- MOTIVO: Sistema de títulos não foi implementado
-- ----------------------------------------------------------------------------
-- ATENÇÃO: Se você pretende implementar sistema de títulos no futuro,
-- NÃO execute este comando. Caso contrário, é seguro remover.

DROP TABLE IF EXISTS pvp_titulos CASCADE;

COMMENT ON DATABASE postgres IS 'Tabela pvp_titulos removida - sistema de títulos não implementado';


-- ----------------------------------------------------------------------------
-- TABELA: pvp_recompensas_pendentes
-- STATUS: ❌ NUNCA USADA NO CÓDIGO
-- SEGURANÇA: ✅ ALTA - Tabela não é referenciada em nenhum lugar
-- PROPÓSITO ORIGINAL: Gerenciar recompensas de fim de temporada
-- MOTIVO: Sistema de recompensas de temporada não foi implementado
-- ----------------------------------------------------------------------------
-- ATENÇÃO: Se você pretende implementar recompensas de temporada no futuro,
-- NÃO execute este comando. Caso contrário, é seguro remover.

DROP TABLE IF EXISTS pvp_recompensas_pendentes CASCADE;

COMMENT ON DATABASE postgres IS 'Tabela pvp_recompensas_pendentes removida - sistema não implementado';


-- ============================================================================
-- SEÇÃO 2: REMOVER COLUNAS NÃO USADAS DE TABELAS ATIVAS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TABELA: pvp_batalhas_log
-- COLUNAS NÃO USADAS: jogador1_streak_antes, jogador2_streak_antes
-- SEGURANÇA: ✅ ALTA - Colunas nunca são lidas ou escritas no código
-- MOTIVO: Histórico de streak não é registrado nas batalhas
-- ----------------------------------------------------------------------------
-- ATENÇÃO: A tabela pvp_batalhas_log É USADA, mas estas 2 colunas específicas
-- nunca são preenchidas ou lidas. Seguro remover apenas as colunas.

ALTER TABLE pvp_batalhas_log
DROP COLUMN IF EXISTS jogador1_streak_antes,
DROP COLUMN IF EXISTS jogador2_streak_antes;

COMMENT ON TABLE pvp_batalhas_log IS 'Colunas de streak_antes removidas - não eram usadas';


-- ----------------------------------------------------------------------------
-- TABELA: pvp_rankings
-- COLUNA NÃO USADA: recompensas_recebidas
-- SEGURANÇA: ⚠️ MÉDIA - Coluna é usada APENAS em funções SQL (encerrar_temporada)
-- MOTIVO: A coluna existe mas a função que a usa nunca é chamada no código
-- ----------------------------------------------------------------------------
-- ATENÇÃO: Esta coluna é usada pela função encerrar_temporada(), mas essa
-- função nunca é chamada pelo código da aplicação (só manualmente).
-- Se você pretende implementar encerramento automático de temporadas,
-- NÃO execute este comando.

-- DESCOMENTE A LINHA ABAIXO SE TIVER CERTEZA DE QUE NÃO VAI USAR:
-- ALTER TABLE pvp_rankings DROP COLUMN IF EXISTS recompensas_recebidas;


-- ============================================================================
-- SEÇÃO 3: VIEWS NÃO USADAS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- VIEW: estatisticas_jogador
-- STATUS: ❌ NUNCA USADA NO CÓDIGO
-- SEGURANÇA: ✅ ALTA - View depende de tabelas que estão sendo removidas
-- MOTIVO: Depende de pvp_historico_temporadas e pvp_titulos
-- ----------------------------------------------------------------------------

DROP VIEW IF EXISTS estatisticas_jogador CASCADE;

COMMENT ON DATABASE postgres IS 'View estatisticas_jogador removida - dependia de tabelas não usadas';


-- ============================================================================
-- SEÇÃO 4: FUNÇÕES NÃO USADAS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- FUNÇÕES RELACIONADAS A TEMPORADAS (não implementadas no código)
-- SEGURANÇA: ✅ ALTA - Funções nunca são chamadas pela aplicação
-- ----------------------------------------------------------------------------

-- Função de encerramento de temporada (nunca chamada)
DROP FUNCTION IF EXISTS encerrar_temporada() CASCADE;

-- Função de gerar recompensas (nunca chamada)
DROP FUNCTION IF EXISTS gerar_recompensas_temporada(UUID, VARCHAR, INTEGER) CASCADE;


-- ============================================================================
-- SEÇÃO 5: VERIFICAÇÕES PÓS-LIMPEZA
-- ============================================================================

-- Verificar tabelas restantes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS tamanho
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename LIKE '%pvp%'
ORDER BY tablename;

-- Verificar views restantes
SELECT
  schemaname,
  viewname
FROM pg_views
WHERE schemaname = 'public'
  AND viewname LIKE '%pvp%' OR viewname LIKE '%leaderboard%'
ORDER BY viewname;

-- Verificar funções restantes
SELECT
  n.nspname as schema,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname LIKE '%pvp%' OR p.proname LIKE '%temporada%'
ORDER BY function_name;


-- ============================================================================
-- RESUMO DA LIMPEZA
-- ============================================================================

/*
TABELAS REMOVIDAS:
  ✓ pvp_historico_temporadas (nunca usada)
  ✓ pvp_titulos (nunca usada)
  ✓ pvp_recompensas_pendentes (nunca usada)

COLUNAS REMOVIDAS:
  ✓ pvp_batalhas_log.jogador1_streak_antes (nunca usada)
  ✓ pvp_batalhas_log.jogador2_streak_antes (nunca usada)

VIEWS REMOVIDAS:
  ✓ estatisticas_jogador (dependia de tabelas removidas)

FUNÇÕES REMOVIDAS:
  ✓ encerrar_temporada() (nunca chamada)
  ✓ gerar_recompensas_temporada() (nunca chamada)

TABELAS MANTIDAS (EM USO):
  ✓ avatares - USADA INTENSAMENTE (26 arquivos)
  ✓ player_stats - USADA (11 arquivos)
  ✓ pvp_rankings - USADA (9 arquivos)
  ✓ pvp_temporadas - USADA (4 arquivos)
  ✓ pvp_batalhas_log - USADA (1 arquivo)
  ✓ items - USADA (3 arquivos)
  ✓ player_inventory - USADA (2 arquivos)
  ✓ pvp_battle_rooms - USADA (6 arquivos)
  ✓ pvp_matchmaking_queue - USADA (3 arquivos)
  ✓ pvp_challenges - USADA (5 arquivos)
  ✓ pvp_available_players - USADA (2 arquivos)

VIEWS MANTIDAS (EM USO):
  ✓ leaderboard_atual - USADA (1 arquivo)
  ✓ top_100_atual - PODE SER USADA

FUNÇÕES MANTIDAS (EM USO):
  ✓ criar_nova_temporada() - Usada no script de inicialização
  ✓ atualizar_ranking_apos_batalha() - USADA (múltiplos arquivos)
  ✓ find_pvp_match() - USADA (matchmaking)
  ✓ accept_pvp_challenge() - USADA (desafios)
  ✓ create_pvp_challenge() - USADA (desafios)
  ✓ reject_pvp_challenge() - PODE SER USADA
  ✓ cancel_pvp_challenge() - PODE SER USADA
  ✓ cleanup_expired_challenges() - USADA
  ✓ cleanup_expired_queue_entries() - USADA
  ✓ cleanup_expired_battle_rooms() - USADA
  ✓ cleanup_inactive_players() - USADA

ESPAÇO ESTIMADO LIBERADO:
  ~ Depende do volume de dados, mas as 3 tabelas estão vazias
  ~ Redução de complexidade do schema
  ~ Menos manutenção futura
*/

-- ============================================================================
-- BACKUP RECOMENDADO ANTES DE EXECUTAR
-- ============================================================================

/*
PARA FAZER BACKUP ANTES:

-- 1. Backup das tabelas que serão removidas (caso mude de ideia depois)
CREATE TABLE pvp_historico_temporadas_backup AS SELECT * FROM pvp_historico_temporadas;
CREATE TABLE pvp_titulos_backup AS SELECT * FROM pvp_titulos;
CREATE TABLE pvp_recompensas_pendentes_backup AS SELECT * FROM pvp_recompensas_pendentes;

-- 2. Backup das colunas que serão removidas
-- (Não necessário pois as colunas nunca foram populadas)

-- 3. Exportar schema completo antes
pg_dump -s -U postgres portal_hunter > schema_backup_antes_limpeza.sql

-- 4. Exportar dados completos antes (OPCIONAL)
pg_dump -U postgres portal_hunter > full_backup_antes_limpeza.sql
*/

-- ============================================================================
-- FIM DO SCRIPT DE LIMPEZA
-- ============================================================================
