-- Professional Lead Exchange Schema - Basic Version
-- This version only adds the essential columns one by one

-- Add lead exchange columns to existing leads table (one by one)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_status TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS claimed_by UUID;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS price NUMERIC;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS email TEXT;

-- Set default values after adding columns
UPDATE leads SET lead_status = 'new' WHERE lead_status IS NULL;
UPDATE leads SET price = 249 WHERE price IS NULL;

-- Create professionals table for professional users
CREATE TABLE IF NOT EXISTS professionals (
    id UUID PRIMARY KEY,
    role TEXT,
    credits NUMERIC,
    company_name TEXT,
    specialty TEXT,
    state TEXT,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create professional transactions table for tracking purchases
CREATE TABLE IF NOT EXISTS professional_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    professional_id UUID,
    lead_id UUID,
    type TEXT,
    amount NUMERIC,
    credits NUMERIC,
    stripe_session_id TEXT,
    status TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Set default values
UPDATE professionals SET role = 'professional' WHERE role IS NULL;
UPDATE professionals SET credits = 0 WHERE credits IS NULL;
UPDATE professional_transactions SET status = 'pending' WHERE status IS NULL;
UPDATE professional_transactions SET credits = 0 WHERE credits IS NULL;

-- Create basic indexes
CREATE INDEX IF NOT EXISTS idx_leads_lead_status ON leads(lead_status);
CREATE INDEX IF NOT EXISTS idx_leads_claimed_by ON leads(claimed_by);
CREATE INDEX IF NOT EXISTS idx_professionals_role ON professionals(role);
CREATE INDEX IF NOT EXISTS idx_professionals_state ON professionals(state);

-- Enable Row Level Security
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_transactions ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies
CREATE POLICY "professionals_can_view_anonymized_leads"
    ON leads FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM professionals p WHERE p.id = auth.uid()
    ));

CREATE POLICY "professionals_can_view_claimed_leads"
    ON leads FOR SELECT
    USING (claimed_by = auth.uid());

CREATE POLICY "professionals_can_view_self"
    ON professionals FOR SELECT
    USING (id = auth.uid());

CREATE POLICY "professionals_can_update_self"
    ON professionals FOR UPDATE
    USING (id = auth.uid());

CREATE POLICY "professionals_can_view_own_transactions"
    ON professional_transactions FOR SELECT
    USING (professional_id = auth.uid());

-- Service role policies
CREATE POLICY "service_role_can_insert_leads"
    ON leads FOR INSERT
    USING (auth.role() = 'service_role');

CREATE POLICY "service_role_can_update_leads"
    ON leads FOR UPDATE
    USING (auth.role() = 'service_role');

CREATE POLICY "service_role_can_manage_professionals"
    ON professionals FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "service_role_can_manage_transactions"
    ON professional_transactions FOR ALL
    USING (auth.role() = 'service_role');

-- Create function to handle lead purchase
CREATE OR REPLACE FUNCTION purchase_lead(
    p_lead_id UUID,
    p_professional_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    lead_record RECORD;
    professional_record RECORD;
BEGIN
    -- Get the lead details
    SELECT * INTO lead_record FROM leads WHERE id = p_lead_id AND lead_status = 'new';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Lead not found or already claimed';
    END IF;
    
    -- Get the professional details
    SELECT * INTO professional_record FROM professionals WHERE id = p_professional_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Professional not found';
    END IF;
    
    -- Check if professional has enough credits
    IF professional_record.credits < lead_record.price THEN
        RAISE EXCEPTION 'Insufficient credits';
    END IF;
    
    -- Update the lead
    UPDATE leads 
    SET 
        lead_status = 'claimed',
        claimed_by = p_professional_id,
        updated_at = NOW()
    WHERE id = p_lead_id;
    
    -- Deduct credits from professional
    UPDATE professionals 
    SET 
        credits = credits - lead_record.price,
        updated_at = NOW()
    WHERE id = p_professional_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to add credits to professional
CREATE OR REPLACE FUNCTION add_credits(
    p_professional_id UUID,
    p_credits NUMERIC
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE professionals 
    SET 
        credits = credits + p_credits,
        updated_at = NOW()
    WHERE id = p_professional_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Professional not found';
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON leads TO authenticated;
GRANT SELECT ON professionals TO authenticated;
GRANT SELECT ON professional_transactions TO authenticated;
GRANT EXECUTE ON FUNCTION purchase_lead TO authenticated;
GRANT EXECUTE ON FUNCTION add_credits TO authenticated;

-- Create view for professional dashboard - anonymized leads
CREATE OR REPLACE VIEW professional_leads_anonymized AS
SELECT 
    l.id,
    l.date_of_loss,
    l.insurer,
    l.status,
    l.lead_status,
    l.price,
    l.created_at,
    COALESCE(l.type_of_loss, 'Unknown') as type_of_loss,
    COALESCE(l.property_type, 'Unknown') as property_type,
    COALESCE(l.loss_location, 'Unknown') as loss_location,
    CASE 
        WHEN l.loss_location ~ ',' THEN 
            TRIM(SPLIT_PART(l.loss_location, ',', 2)) || ', ' || TRIM(SPLIT_PART(l.loss_location, ',', 1))
        ELSE COALESCE(l.loss_location, 'Unknown')
    END as location_display
FROM leads l
WHERE l.lead_status = 'new';

-- Create view for professional's claimed leads
CREATE OR REPLACE VIEW professional_claimed_leads AS
SELECT 
    l.id,
    l.insured_name,
    l.phone_number as phone,
    l.email,
    l.date_of_loss,
    l.insurer,
    l.status,
    l.lead_status,
    l.price,
    l.created_at,
    l.updated_at,
    COALESCE(l.type_of_loss, 'Unknown') as type_of_loss,
    COALESCE(l.property_type, 'Unknown') as property_type,
    COALESCE(l.loss_location, 'Unknown') as loss_location
FROM leads l
WHERE l.claimed_by = auth.uid() AND l.lead_status = 'claimed';

-- Grant access to the views
GRANT SELECT ON professional_leads_anonymized TO authenticated;
GRANT SELECT ON professional_claimed_leads TO authenticated;

