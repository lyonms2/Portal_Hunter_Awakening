-- ============================================================================
-- LIMPEZA DE CÓDIGO DE PVP AO VIVO - Portal Hunter Awakening
-- ============================================================================
-- Data: 2025-11-15
-- Descrição: Remove tabelas, funções e código relacionados à tentativa de
--            implementar PVP ao vivo (matchmaking, desafios, salas de batalha)
-- Motivo: Projeto pivotou para PVP IA. O sistema de PVP ao vivo não será usado.
-- IMPORTANTE: Execute este script com CUIDADO e faça BACKUP antes!
-- ============================================================================

-- ============================================================================
-- CONTEXTO
-- ============================================================================
/*
O projeto TENTOU implementar PVP ao vivo com:
- Matchmaking automático (fila de espera)
- Desafios entre jogadores (Request/Accept)
- Salas de batalha em tempo real
- Lista de jogadores disponíveis

Mas o projeto PIVOTOU para:
- PVP IA (contra inteligência artificial)
- Sistema de temporadas com premiação mensal
- Rankings e leaderboards

Este script remove TODO o código de PVP ao vivo, mantendo apenas:
- Sistema de temporadas (pvp_temporadas)
- Rankings (pvp_rankings)
- Histórico de temporadas (pvp_historico_temporadas)
- Títulos (pvp_titulos)
- Recompensas pendentes (pvp_recompensas_pendentes)
- Log de batalhas (pvp_batalhas_log)
- Views e funções de temporadas
*/

-- ============================================================================
-- SEÇÃO 1: REMOVER TABELAS DE PVP AO VIVO
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TABELA: pvp_matchmaking_queue
-- STATUS: ❌ CÓDIGO MORTO - PVP ao vivo não é mais usado
-- SEGURANÇA: ✅ ALTA - Sistema de matchmaking abandonado
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS pvp_matchmaking_queue CASCADE;
COMMENT ON DATABASE postgres IS 'Tabela pvp_matchmaking_queue removida - PVP ao vivo descontinuado';

-- ----------------------------------------------------------------------------
-- TABELA: pvp_battle_rooms
-- STATUS: ❌ CÓDIGO MORTO - PVP ao vivo não é mais usado
-- SEGURANÇA: ✅ ALTA - Salas de batalha em tempo real abandonadas
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS pvp_battle_rooms CASCADE;
COMMENT ON DATABASE postgres IS 'Tabela pvp_battle_rooms removida - PVP ao vivo descontinuado';

-- ----------------------------------------------------------------------------
-- TABELA: pvp_challenges
-- STATUS: ❌ CÓDIGO MORTO - PVP ao vivo não é mais usado
-- SEGURANÇA: ✅ ALTA - Sistema de desafios entre jogadores abandonado
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS pvp_challenges CASCADE;
COMMENT ON DATABASE postgres IS 'Tabela pvp_challenges removida - PVP ao vivo descontinuado';

-- ----------------------------------------------------------------------------
-- TABELA: pvp_available_players
-- STATUS: ❌ CÓDIGO MORTO - PVP ao vivo não é mais usado
-- SEGURANÇA: ✅ ALTA - Lista de jogadores disponíveis não é mais necessária
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS pvp_available_players CASCADE;
COMMENT ON DATABASE postgres IS 'Tabela pvp_available_players removida - PVP ao vivo descontinuado';


-- ============================================================================
-- SEÇÃO 2: REMOVER FUNÇÕES DE PVP AO VIVO
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Funções de Matchmaking (não usadas mais)
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS find_pvp_match(UUID, INT, INT, INT) CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_queue_entries() CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_battle_rooms() CASCADE;

-- ----------------------------------------------------------------------------
-- Funções de Desafios (não usadas mais)
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS create_pvp_challenge(UUID, UUID, INT, INT, INT, UUID, UUID, INT, INT, INT) CASCADE;
DROP FUNCTION IF EXISTS accept_pvp_challenge(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS reject_pvp_challenge(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS cancel_pvp_challenge(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_challenges() CASCADE;

-- ----------------------------------------------------------------------------
-- Funções de Jogadores Disponíveis (não usadas mais)
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS cleanup_inactive_players() CASCADE;


-- ============================================================================
-- SEÇÃO 3: TABELAS QUE PERMANECEM (SISTEMA DE TEMPORADAS E IA)
-- ============================================================================

/*
✅ MANTIDAS - Tabelas do sistema de temporadas (usadas pelo PVP IA):

1. pvp_temporadas
   - Gerencia temporadas mensais
   - Usada para definir período de premiação (30 dias)

2. pvp_rankings
   - Rankings atuais de cada jogador na temporada
   - Atualizado após cada batalha de PVP IA

3. pvp_historico_temporadas
   - Histórico de desempenho em temporadas passadas
   - Será usado quando temporada encerrar (30 dias)

4. pvp_titulos
   - Títulos conquistados pelos jogadores
   - Será usado no sistema de premiação

5. pvp_recompensas_pendentes
   - Recompensas de fim de temporada
   - Será usado para distribuir premiação mensal

6. pvp_batalhas_log
   - Log de todas as batalhas (IA e futuras)
   - Usado para estatísticas e histórico

7. leaderboard_atual (VIEW)
   - Leaderboard da temporada ativa
   - Usado na tela de rankings

8. top_100_atual (VIEW)
   - Top 100 jogadores
   - Usado para exibir melhores jogadores

9. estatisticas_jogador (VIEW)
   - Estatísticas completas do jogador
   - Usado para perfil e progressão
*/

-- ============================================================================
-- SEÇÃO 4: FUNÇÕES QUE PERMANECEM (SISTEMA DE TEMPORADAS)
-- ============================================================================

/*
✅ MANTIDAS - Funções do sistema de temporadas:

1. criar_nova_temporada()
   - Cria nova temporada a cada 30 dias
   - CRÍTICA para sistema de premiação

2. encerrar_temporada()
   - Encerra temporada e salva histórico
   - SERÁ USADA para distribuir premiação mensal

3. gerar_recompensas_temporada()
   - Gera recompensas baseadas na posição
   - SERÁ USADA no encerramento de temporada

4. atualizar_ranking_apos_batalha()
   - Atualiza ranking após batalhas
   - USADA ATIVAMENTE pelo PVP IA

5. criar_ranking_inicial() (TRIGGER FUNCTION)
   - Cria registro inicial de ranking
   - Pode ser útil no futuro
*/

-- ============================================================================
-- SEÇÃO 5: VERIFICAÇÕES PÓS-LIMPEZA
-- ============================================================================

-- Verificar tabelas restantes relacionadas a PVP
SELECT
  tablename,
  pg_size_pretty(pg_total_relation_size('public.' || tablename)) AS tamanho
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename LIKE '%pvp%'
ORDER BY tablename;

-- Verificar funções restantes relacionadas a PVP
SELECT
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND (p.proname LIKE '%pvp%' OR p.proname LIKE '%temporada%' OR p.proname LIKE '%ranking%')
ORDER BY function_name;


-- ============================================================================
-- RESUMO DA LIMPEZA
-- ============================================================================

/*
❌ REMOVIDAS - Tabelas de PVP ao vivo:
  ✓ pvp_matchmaking_queue (matchmaking automático)
  ✓ pvp_battle_rooms (salas de batalha em tempo real)
  ✓ pvp_challenges (desafios entre jogadores)
  ✓ pvp_available_players (lista de jogadores online)

❌ REMOVIDAS - Funções de PVP ao vivo:
  ✓ find_pvp_match() (matchmaking)
  ✓ cleanup_expired_queue_entries()
  ✓ cleanup_expired_battle_rooms()
  ✓ create_pvp_challenge()
  ✓ accept_pvp_challenge()
  ✓ reject_pvp_challenge()
  ✓ cancel_pvp_challenge()
  ✓ cleanup_expired_challenges()
  ✓ cleanup_inactive_players()

✅ MANTIDAS - Tabelas do sistema de temporadas:
  ✓ pvp_temporadas (temporadas mensais)
  ✓ pvp_rankings (rankings atuais)
  ✓ pvp_historico_temporadas (histórico de temporadas)
  ✓ pvp_titulos (títulos conquistados)
  ✓ pvp_recompensas_pendentes (premiação mensal)
  ✓ pvp_batalhas_log (log de batalhas IA)

✅ MANTIDAS - Views:
  ✓ leaderboard_atual
  ✓ top_100_atual
  ✓ estatisticas_jogador

✅ MANTIDAS - Funções de temporadas:
  ✓ criar_nova_temporada()
  ✓ encerrar_temporada()
  ✓ gerar_recompensas_temporada()
  ✓ atualizar_ranking_apos_batalha()
  ✓ criar_ranking_inicial()

PRÓXIMOS PASSOS:
  1. Executar este SQL no Supabase
  2. Remover arquivos de código (API routes e componentes)
  3. Implementar sistema de encerramento automático de temporada (30 dias)
  4. Implementar distribuição de premiação mensal
*/

-- ============================================================================
-- BACKUP RECOMENDADO ANTES DE EXECUTAR
-- ============================================================================

/*
PARA FAZER BACKUP ANTES:

-- 1. Exportar schema completo antes
pg_dump -s -U postgres portal_hunter > schema_backup_antes_cleanup_pvp.sql

-- 2. Exportar dados das tabelas que serão removidas (OPCIONAL)
pg_dump -t pvp_matchmaking_queue -t pvp_battle_rooms -t pvp_challenges -t pvp_available_players \
  -U postgres portal_hunter > backup_tabelas_pvp_ao_vivo.sql

-- 3. Exportar dados completos (OPCIONAL, mas recomendado)
pg_dump -U postgres portal_hunter > full_backup_antes_cleanup_pvp.sql
*/

-- ============================================================================
-- FIM DO SCRIPT DE LIMPEZA
-- ============================================================================
