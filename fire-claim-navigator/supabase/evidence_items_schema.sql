-- Create evidence_items table
CREATE TABLE IF NOT EXISTS evidence_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  file_path TEXT NOT NULL,
  filename TEXT,
  category TEXT NOT NULL CHECK (category IN ('Structure', 'Contents', 'ALE', 'Medical')),
  ai_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_evidence_items_user_id ON evidence_items(user_id);

-- Create index on category for filtering
CREATE INDEX IF NOT EXISTS idx_evidence_items_category ON evidence_items(category);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_evidence_items_created_at ON evidence_items(created_at);

-- Enable Row Level Security
ALTER TABLE evidence_items ENABLE ROW LEVEL SECURITY;

-- Create policy for users to only see their own evidence items
CREATE POLICY "Users can view their own evidence items" ON evidence_items
  FOR SELECT USING (auth.uid() = user_id);

-- Create policy for users to insert their own evidence items
CREATE POLICY "Users can insert their own evidence items" ON evidence_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy for users to update their own evidence items
CREATE POLICY "Users can update their own evidence items" ON evidence_items
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policy for users to delete their own evidence items
CREATE POLICY "Users can delete their own evidence items" ON evidence_items
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_evidence_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_evidence_items_updated_at
  BEFORE UPDATE ON evidence_items
  FOR EACH ROW
  EXECUTE FUNCTION update_evidence_items_updated_at();
