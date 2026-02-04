-- Claim Success Protocol Progress Tracking
-- Stores user progress through the 7-step protocol

-- Create protocol_progress table
CREATE TABLE IF NOT EXISTS protocol_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_step integer NOT NULL DEFAULT 1,
  completed_steps integer[] DEFAULT ARRAY[]::integer[],
  step_progress jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_protocol_progress_user_id ON protocol_progress(user_id);

-- Enable Row Level Security
ALTER TABLE protocol_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only read their own progress
CREATE POLICY "Users can view own protocol progress"
  ON protocol_progress
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own progress
CREATE POLICY "Users can insert own protocol progress"
  ON protocol_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own progress
CREATE POLICY "Users can update own protocol progress"
  ON protocol_progress
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own progress
CREATE POLICY "Users can delete own protocol progress"
  ON protocol_progress
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_protocol_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS protocol_progress_updated_at ON protocol_progress;
CREATE TRIGGER protocol_progress_updated_at
  BEFORE UPDATE ON protocol_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_protocol_progress_updated_at();

-- Comments
COMMENT ON TABLE protocol_progress IS 'Tracks user progress through the 7-step Claim Success Protocol';
COMMENT ON COLUMN protocol_progress.current_step IS 'Current step user is on (1-7)';
COMMENT ON COLUMN protocol_progress.completed_steps IS 'Array of completed step numbers';
COMMENT ON COLUMN protocol_progress.step_progress IS 'JSON object tracking completion criteria for each step';







