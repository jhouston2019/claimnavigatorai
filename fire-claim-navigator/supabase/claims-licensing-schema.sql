-- Enhanced Claims Table for Per-Claim Licensing
-- This replaces the existing claims table with a more comprehensive structure

-- Drop existing claims table if it exists (be careful in production!)
-- DROP TABLE IF EXISTS claims CASCADE;

-- Create enhanced claims table
CREATE TABLE IF NOT EXISTS claims (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    policy_number TEXT NOT NULL,
    insured_name TEXT NOT NULL,
    insurer TEXT NOT NULL,
    date_of_loss DATE NOT NULL,
    type_of_loss TEXT NOT NULL,
    loss_location TEXT NOT NULL,
    property_type TEXT NOT NULL,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'paid', 'active', 'completed', 'cancelled')),
    stripe_session_id TEXT,
    stripe_payment_intent_id TEXT,
    amount_paid DECIMAL(10,2),
    currency TEXT DEFAULT 'usd',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ, -- Optional: set expiration date for claim access
    metadata JSONB -- Store additional claim-specific data
);

-- Create claim access logs table for audit tracking
CREATE TABLE IF NOT EXISTS claim_access_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
    document_id TEXT, -- Document slug or AI-generated document identifier
    action TEXT NOT NULL CHECK (action IN ('viewed', 'generated', 'downloaded', 'accessed')),
    document_type TEXT, -- 'template', 'ai_generated', 'sample'
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB -- Store additional context like document size, processing time, etc.
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_claims_user_id ON claims(user_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
CREATE INDEX IF NOT EXISTS idx_claims_stripe_session_id ON claims(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_claims_created_at ON claims(created_at);

CREATE INDEX IF NOT EXISTS idx_claim_access_logs_user_id ON claim_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_claim_access_logs_claim_id ON claim_access_logs(claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_access_logs_timestamp ON claim_access_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_claim_access_logs_action ON claim_access_logs(action);

-- Enable Row Level Security
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_access_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for claims table
CREATE POLICY "Users can view their own claims" ON claims
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own claims" ON claims
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own claims" ON claims
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own claims" ON claims
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for claim_access_logs table
CREATE POLICY "Users can view their own access logs" ON claim_access_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own access logs" ON claim_access_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin policies (assuming you have an admin role or service role)
CREATE POLICY "Service role can manage all claims" ON claims
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all access logs" ON claim_access_logs
    FOR ALL USING (auth.role() = 'service_role');

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_claims_updated_at 
    BEFORE UPDATE ON claims 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to log claim access
CREATE OR REPLACE FUNCTION log_claim_access(
    p_claim_id UUID,
    p_document_id TEXT,
    p_action TEXT,
    p_document_type TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO claim_access_logs (
        user_id,
        claim_id,
        document_id,
        action,
        document_type,
        ip_address,
        user_agent,
        metadata
    ) VALUES (
        auth.uid(),
        p_claim_id,
        p_document_id,
        p_action,
        p_document_type,
        inet_client_addr(),
        current_setting('request.headers', true)::json->>'user-agent',
        p_metadata
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON claims TO authenticated;
GRANT ALL ON claim_access_logs TO authenticated;
GRANT EXECUTE ON FUNCTION log_claim_access TO authenticated;

-- Create view for claim summary (useful for dashboards)
CREATE OR REPLACE VIEW claim_summary AS
SELECT 
    c.id,
    c.user_id,
    c.policy_number,
    c.insured_name,
    c.insurer,
    c.date_of_loss,
    c.type_of_loss,
    c.loss_location,
    c.property_type,
    c.status,
    c.amount_paid,
    c.currency,
    c.created_at,
    c.updated_at,
    c.expires_at,
    COUNT(cal.id) as access_count,
    MAX(cal.timestamp) as last_accessed
FROM claims c
LEFT JOIN claim_access_logs cal ON c.id = cal.claim_id
GROUP BY c.id, c.user_id, c.policy_number, c.insured_name, c.insurer, 
         c.date_of_loss, c.type_of_loss, c.loss_location, c.property_type, 
         c.status, c.amount_paid, c.currency, c.created_at, c.updated_at, c.expires_at;

-- Grant access to the view
GRANT SELECT ON claim_summary TO authenticated;
