-- ============================================
-- MODO PVE/HISTÓRIA - TABELAS SEPARADAS
-- Sistema completamente independente do resto do jogo
-- ============================================

-- Tabela de avatares do modo história (separada dos avatares principais)
CREATE TABLE IF NOT EXISTS story_avatars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  elemento TEXT NOT NULL,
  vida INTEGER NOT NULL,
  ataque INTEGER NOT NULL,
  defesa INTEGER NOT NULL,
  velocidade INTEGER NOT NULL,
  nivel INTEGER NOT NULL DEFAULT 1,
  vinculo INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id) -- Um avatar por usuário no modo história
);

-- Tabela de progresso da história
CREATE TABLE IF NOT EXISTS story_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  chapter INTEGER NOT NULL DEFAULT 1,
  story_phase TEXT NOT NULL DEFAULT 'prologo',
  scene_index INTEGER NOT NULL DEFAULT 0,
  player_choices JSONB DEFAULT '[]'::jsonb,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, chapter) -- Um progresso por usuário por capítulo
);

-- Tabela de conquistas do modo história
CREATE TABLE IF NOT EXISTS story_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  achievement_id TEXT NOT NULL,
  achievement_name TEXT NOT NULL,
  unlocked_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_story_avatars_user_id ON story_avatars(user_id);
CREATE INDEX IF NOT EXISTS idx_story_progress_user_id ON story_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_story_progress_chapter ON story_progress(user_id, chapter);
CREATE INDEX IF NOT EXISTS idx_story_achievements_user_id ON story_achievements(user_id);

-- RLS Policies - Segurança
ALTER TABLE story_avatars ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_achievements ENABLE ROW LEVEL SECURITY;

-- Policies para story_avatars
DROP POLICY IF EXISTS "Users can view own story avatars" ON story_avatars;
CREATE POLICY "Users can view own story avatars"
  ON story_avatars FOR SELECT
  USING (true); -- Todos podem ver (user_id é verificado na aplicação)

DROP POLICY IF EXISTS "Users can insert own story avatars" ON story_avatars;
CREATE POLICY "Users can insert own story avatars"
  ON story_avatars FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own story avatars" ON story_avatars;
CREATE POLICY "Users can update own story avatars"
  ON story_avatars FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Users can delete own story avatars" ON story_avatars;
CREATE POLICY "Users can delete own story avatars"
  ON story_avatars FOR DELETE
  USING (true);

-- Policies para story_progress
DROP POLICY IF EXISTS "Users can view own story progress" ON story_progress;
CREATE POLICY "Users can view own story progress"
  ON story_progress FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert own story progress" ON story_progress;
CREATE POLICY "Users can insert own story progress"
  ON story_progress FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own story progress" ON story_progress;
CREATE POLICY "Users can update own story progress"
  ON story_progress FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Users can delete own story progress" ON story_progress;
CREATE POLICY "Users can delete own story progress"
  ON story_progress FOR DELETE
  USING (true);

-- Policies para story_achievements
DROP POLICY IF EXISTS "Users can view own story achievements" ON story_achievements;
CREATE POLICY "Users can view own story achievements"
  ON story_achievements FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert own story achievements" ON story_achievements;
CREATE POLICY "Users can insert own story achievements"
  ON story_achievements FOR INSERT
  WITH CHECK (true);

-- Function para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_story_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para story_progress
DROP TRIGGER IF EXISTS update_story_progress_timestamp ON story_progress;
CREATE TRIGGER update_story_progress_timestamp
  BEFORE UPDATE ON story_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_story_progress_updated_at();
