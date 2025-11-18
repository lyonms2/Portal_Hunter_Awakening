-- Create story_progress table to save player progress in Story Mode
CREATE TABLE IF NOT EXISTS story_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  story_phase TEXT NOT NULL DEFAULT 'prologo',
  scene_index INTEGER NOT NULL DEFAULT 0,
  player_choices JSONB DEFAULT '[]'::jsonb,
  selected_element JSONB,
  avatar_name TEXT,
  avatar_stats JSONB,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_story_progress_user_id ON story_progress(user_id);

-- RLS Policies
ALTER TABLE story_progress ENABLE ROW LEVEL SECURITY;

-- Users can only read their own progress
CREATE POLICY "Users can view own story progress"
  ON story_progress FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own progress
CREATE POLICY "Users can insert own story progress"
  ON story_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own progress
CREATE POLICY "Users can update own story progress"
  ON story_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own progress (for reset)
CREATE POLICY "Users can delete own story progress"
  ON story_progress FOR DELETE
  USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_story_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function
CREATE TRIGGER update_story_progress_timestamp
  BEFORE UPDATE ON story_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_story_progress_updated_at();
