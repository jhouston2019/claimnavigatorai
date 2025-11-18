-- Fix claim_financials table schema for Statement of Loss
-- This migration ensures the correct schema exists for the Statement of Loss tool
--
-- WARNING: This will drop the existing claim_financials table if it exists
-- If you have important data, back it up first!
-- Since the error indicates the table doesn't exist, this should be safe to run.

-- Drop the table if it exists with the wrong schema
-- We'll recreate it with the correct schema below
DROP TABLE IF EXISTS claim_financials CASCADE;

-- Create the correct claim_financials table for Statement of Loss ledger
CREATE TABLE claim_financials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id TEXT NOT NULL,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('payment', 'invoice', 'expense', 'supplement', 'depreciation')),
  description TEXT NOT NULL,
  source TEXT,
  amount NUMERIC(12,2) NOT NULL,
  date TIMESTAMPTZ DEFAULT NOW(),
  running_balance NUMERIC(12,2),
  inserted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_claim_financials_claim_id ON claim_financials(claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_financials_entry_type ON claim_financials(entry_type);
CREATE INDEX IF NOT EXISTS idx_claim_financials_date ON claim_financials(date DESC);
CREATE INDEX IF NOT EXISTS idx_claim_financials_claim_date ON claim_financials(claim_id, date DESC);

-- Create or replace the aggregated totals view
CREATE OR REPLACE VIEW running_statement_of_loss AS
SELECT 
  claim_id,
  SUM(CASE WHEN entry_type = 'payment' THEN amount ELSE 0 END) as total_payments,
  SUM(CASE WHEN entry_type = 'invoice' THEN amount ELSE 0 END) as total_invoices,
  SUM(CASE WHEN entry_type = 'expense' THEN amount ELSE 0 END) as total_expenses,
  SUM(CASE WHEN entry_type = 'supplement' THEN amount ELSE 0 END) as total_supplements,
  SUM(CASE WHEN entry_type = 'depreciation' THEN amount ELSE 0 END) as total_depreciation,
  SUM(amount) as total_all,
  COUNT(*) as total_entries,
  MIN(date) as first_entry_date,
  MAX(date) as last_entry_date
FROM claim_financials
GROUP BY claim_id;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_claim_financials_updated_at ON claim_financials;
CREATE TRIGGER update_claim_financials_updated_at
    BEFORE UPDATE ON claim_financials
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE claim_financials IS 'Financial ledger entries for Statement of Loss tracking';
COMMENT ON VIEW running_statement_of_loss IS 'Aggregated totals view for Statement of Loss calculations';

-- Note: RLS is not enabled by default
-- Netlify functions use service role key which bypasses RLS
-- If you need user-level access, enable RLS and create appropriate policies

