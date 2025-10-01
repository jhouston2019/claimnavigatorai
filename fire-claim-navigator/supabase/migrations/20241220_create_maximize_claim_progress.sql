-- Create maximize_claim_progress table for tracking user progress through the 7-step guide
CREATE TABLE IF NOT EXISTS maximize_claim_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  step_number int not null,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(user_id, step_number)
);

-- Add foreign key constraint to auth.users
ALTER TABLE maximize_claim_progress 
ADD CONSTRAINT fk_maximize_claim_progress_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_maximize_claim_progress_user_id ON maximize_claim_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_maximize_claim_progress_step_number ON maximize_claim_progress(step_number);
CREATE INDEX IF NOT EXISTS idx_maximize_claim_progress_completed ON maximize_claim_progress(completed);

-- Enable Row Level Security
ALTER TABLE maximize_claim_progress ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see only their own progress
CREATE POLICY "Users can view their own maximize claim progress" ON maximize_claim_progress
  FOR SELECT USING (auth.uid() = user_id);

-- Policy to allow users to insert their own progress
CREATE POLICY "Users can insert their own maximize claim progress" ON maximize_claim_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own progress
CREATE POLICY "Users can update their own maximize claim progress" ON maximize_claim_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy to allow users to delete their own progress
CREATE POLICY "Users can delete their own maximize claim progress" ON maximize_claim_progress
  FOR DELETE USING (auth.uid() = user_id);
