-- Deadline Tracker Schema
-- This migration creates the claim_dates table for tracking critical claim deadlines

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Claim deadlines table
CREATE TABLE IF NOT EXISTS claim_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id TEXT NOT NULL,
  event TEXT NOT NULL, -- e.g. Proof of Loss Due, Appraisal Deadline, Response Required
  date DATE NOT NULL,
  source TEXT, -- e.g. AI Parser, Manual Entry, Policy Document
  priority TEXT DEFAULT 'Medium' CHECK (priority IN ('High', 'Medium', 'Low')),
  notified BOOLEAN DEFAULT false,
  notes TEXT,
  inserted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_claim_dates_claim_id ON claim_dates(claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_dates_date ON claim_dates(date);
CREATE INDEX IF NOT EXISTS idx_claim_dates_priority ON claim_dates(priority);
CREATE INDEX IF NOT EXISTS idx_claim_dates_claim_date ON claim_dates(claim_id, date);
CREATE INDEX IF NOT EXISTS idx_claim_dates_notified ON claim_dates(notified);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_claim_dates_updated_at ON claim_dates;
CREATE TRIGGER update_claim_dates_updated_at
    BEFORE UPDATE ON claim_dates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE claim_dates IS 'Critical deadlines and important dates for claims';
COMMENT ON COLUMN claim_dates.event IS 'Description of the deadline event (e.g. Proof of Loss Due, Appraisal Deadline)';
COMMENT ON COLUMN claim_dates.source IS 'Source of the deadline (AI Parser, Manual Entry, Policy Document, etc.)';
COMMENT ON COLUMN claim_dates.priority IS 'Priority level: High, Medium, or Low';
COMMENT ON COLUMN claim_dates.notified IS 'Whether the user has been notified about this deadline';


