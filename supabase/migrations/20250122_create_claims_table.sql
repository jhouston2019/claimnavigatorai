-- Create claims table if it doesn't exist
-- This migration creates the claims table for storing user insurance claims

CREATE TABLE IF NOT EXISTS claims (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL,
    date_of_loss DATE NOT NULL,
    type_of_loss TEXT NOT NULL,
    loss_location JSONB,
    insured_name TEXT NOT NULL,
    phone_number TEXT,
    policy_number TEXT NOT NULL,
    insurer TEXT NOT NULL,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'pending', 'settled', 'disputed', 'litigation', 'paid', 'active', 'completed', 'cancelled')),
    property_type TEXT CHECK (property_type IN ('residential', 'commercial', 'industrial')),
    stripe_session_id TEXT,
    stripe_payment_intent_id TEXT,
    amount_paid DECIMAL(10,2),
    currency TEXT DEFAULT 'usd',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    metadata JSONB
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_claims_user_id ON claims(user_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
CREATE INDEX IF NOT EXISTS idx_claims_type_of_loss ON claims(type_of_loss);
CREATE INDEX IF NOT EXISTS idx_claims_created_at ON claims(created_at);
CREATE INDEX IF NOT EXISTS idx_claims_policy_number ON claims(policy_number);

-- Enable Row Level Security
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own claims" ON claims;
DROP POLICY IF EXISTS "Users can insert their own claims" ON claims;
DROP POLICY IF EXISTS "Users can update their own claims" ON claims;
DROP POLICY IF EXISTS "Users can delete their own claims" ON claims;

-- RLS Policies for claims table
CREATE POLICY "Users can view their own claims" ON claims
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own claims" ON claims
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own claims" ON claims
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own claims" ON claims
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_claims_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_claims_updated_at_trigger ON claims;
CREATE TRIGGER update_claims_updated_at_trigger
    BEFORE UPDATE ON claims
    FOR EACH ROW
    EXECUTE FUNCTION update_claims_updated_at();

-- Add comment
COMMENT ON TABLE claims IS 'User insurance claims with full details and tracking';

