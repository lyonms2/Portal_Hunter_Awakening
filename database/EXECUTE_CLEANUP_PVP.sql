-- ============================================================================
-- EXECUTAR NO SUPABASE SQL EDITOR
-- ============================================================================

-- Remover tabelas de PVP ao vivo
DROP TABLE IF EXISTS pvp_matchmaking_queue CASCADE;
DROP TABLE IF EXISTS pvp_battle_rooms CASCADE;
DROP TABLE IF EXISTS pvp_challenges CASCADE;
DROP TABLE IF EXISTS pvp_available_players CASCADE;

-- Remover funções de matchmaking
DROP FUNCTION IF EXISTS find_pvp_match(UUID, INT, INT, INT) CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_queue_entries() CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_battle_rooms() CASCADE;

-- Remover funções de desafios
DROP FUNCTION IF EXISTS create_pvp_challenge(UUID, UUID, INT, INT, INT, UUID, UUID, INT, INT, INT) CASCADE;
DROP FUNCTION IF EXISTS accept_pvp_challenge(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS reject_pvp_challenge(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS cancel_pvp_challenge(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_challenges() CASCADE;

-- Remover funções de jogadores disponíveis
DROP FUNCTION IF EXISTS cleanup_inactive_players() CASCADE;

-- Verificar o que sobrou
SELECT tablename FROM pg_tables
WHERE schemaname = 'public' AND tablename LIKE '%pvp%'
ORDER BY tablename;
