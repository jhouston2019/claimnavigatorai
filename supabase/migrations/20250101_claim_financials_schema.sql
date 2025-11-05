-- Claim Financials Schema for Statement of Loss
-- This migration creates the claim_financials table if it doesn't exist

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create claim_financials table
CREATE TABLE IF NOT EXISTS claim_financials (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    claim_id UUID NOT NULL,
    user_id TEXT NOT NULL,
    property_damage DECIMAL(12,2) DEFAULT 0,
    contents_damage DECIMAL(12,2) DEFAULT 0,
    additional_living_expenses DECIMAL(12,2) DEFAULT 0,
    business_interruption DECIMAL(12,2) DEFAULT 0,
    other_expenses DECIMAL(12,2) DEFAULT 0,
    total_claim_amount DECIMAL(12,2) DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create claim_dates table (alternative to claim_timeline_deadlines if needed)
CREATE TABLE IF NOT EXISTS claim_dates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    claim_id UUID NOT NULL,
    user_id TEXT NOT NULL,
    date_type TEXT NOT NULL CHECK (date_type IN ('deadline', 'payment', 'inspection', 'hearing', 'other')),
    date_value TIMESTAMPTZ NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Critical', 'High', 'Medium', 'Low')),
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    source_document TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_claim_financials_claim_id ON claim_financials(claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_financials_user_id ON claim_financials(user_id);
CREATE INDEX IF NOT EXISTS idx_claim_dates_claim_id ON claim_dates(claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_dates_user_id ON claim_dates(user_id);
CREATE INDEX IF NOT EXISTS idx_claim_dates_date_value ON claim_dates(date_value);
CREATE INDEX IF NOT EXISTS idx_claim_dates_claim_date ON claim_dates(claim_id, date_value);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_claim_financials_updated_at ON claim_financials;
CREATE TRIGGER update_claim_financials_updated_at
    BEFORE UPDATE ON claim_financials
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_claim_dates_updated_at ON claim_dates;
CREATE TRIGGER update_claim_dates_updated_at
    BEFORE UPDATE ON claim_dates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE claim_financials IS 'Financial breakdown for Statement of Loss generation';
COMMENT ON TABLE claim_dates IS 'Important dates and deadlines for claims';


