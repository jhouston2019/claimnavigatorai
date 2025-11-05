-- Claim Journal Schema
-- This migration creates the claim_journal table for tracking claim activity timeline

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Claim journal entries table
CREATE TABLE IF NOT EXISTS claim_journal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id TEXT NOT NULL,
  user_id TEXT,
  entry_title TEXT NOT NULL,
  entry_body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_claim_journal_claim_id ON claim_journal(claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_journal_user_id ON claim_journal(user_id);
CREATE INDEX IF NOT EXISTS idx_claim_journal_created_at ON claim_journal(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_claim_journal_claim_created ON claim_journal(claim_id, created_at DESC);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_claim_journal_updated_at ON claim_journal;
CREATE TRIGGER update_claim_journal_updated_at
    BEFORE UPDATE ON claim_journal
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE claim_journal IS 'Timeline of claim activity, events, calls, submissions, and progress notes';
COMMENT ON COLUMN claim_journal.entry_title IS 'Brief title or summary of the journal entry';
COMMENT ON COLUMN claim_journal.entry_body IS 'Detailed description of the event or activity';


