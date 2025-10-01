-- Professional Lead Exchange Schema - Separate Table Version
-- This version creates a separate table instead of altering the existing leads table

-- Create a separate table for lead exchange data
CREATE TABLE IF NOT EXISTS lead_exchange_data (
    lead_id UUID PRIMARY KEY,
    lead_status TEXT DEFAULT 'new',
    claimed_by UUID,
    price NUMERIC DEFAULT 249,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create professionals table
CREATE TABLE IF NOT EXISTS professionals (
    id UUID PRIMARY KEY,
    role TEXT DEFAULT 'professional',
    credits NUMERIC DEFAULT 0,
    company_name TEXT,
    specialty TEXT,
    state TEXT,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create professional transactions table
CREATE TABLE IF NOT EXISTS professional_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    professional_id UUID,
    lead_id UUID,
    type TEXT,
    amount NUMERIC,
    credits NUMERIC,
    stripe_session_id TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create basic indexes
CREATE INDEX IF NOT EXISTS idx_lead_exchange_lead_status ON lead_exchange_data(lead_status);
CREATE INDEX IF NOT EXISTS idx_lead_exchange_claimed_by ON lead_exchange_data(claimed_by);
CREATE INDEX IF NOT EXISTS idx_professionals_role ON professionals(role);
CREATE INDEX IF NOT EXISTS idx_professionals_state ON professionals(state);

-- Enable Row Level Security
ALTER TABLE lead_exchange_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_transactions ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies
CREATE POLICY "professionals_can_view_anonymized_leads"
    ON lead_exchange_data FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM professionals p WHERE p.id = auth.uid()
    ));

CREATE POLICY "professionals_can_view_claimed_leads"
    ON lead_exchange_data FOR SELECT
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
CREATE POLICY "service_role_can_insert_lead_exchange"
    ON lead_exchange_data FOR INSERT
    USING (auth.role() = 'service_role');

CREATE POLICY "service_role_can_update_lead_exchange"
    ON lead_exchange_data FOR UPDATE
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
    SELECT * INTO lead_record FROM lead_exchange_data WHERE lead_id = p_lead_id AND lead_status = 'new';
    
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
    UPDATE lead_exchange_data 
    SET 
        lead_status = 'claimed',
        claimed_by = p_professional_id,
        updated_at = NOW()
    WHERE lead_id = p_lead_id;
    
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
GRANT SELECT ON lead_exchange_data TO authenticated;
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
    led.lead_status,
    led.price,
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
LEFT JOIN lead_exchange_data led ON l.id = led.lead_id
WHERE led.lead_status = 'new';

-- Create view for professional's claimed leads
CREATE OR REPLACE VIEW professional_claimed_leads AS
SELECT 
    l.id,
    l.insured_name,
    l.phone_number as phone,
    led.email,
    l.date_of_loss,
    l.insurer,
    l.status,
    led.lead_status,
    led.price,
    l.created_at,
    l.updated_at,
    COALESCE(l.type_of_loss, 'Unknown') as type_of_loss,
    COALESCE(l.property_type, 'Unknown') as property_type,
    COALESCE(l.loss_location, 'Unknown') as loss_location
FROM leads l
LEFT JOIN lead_exchange_data led ON l.id = led.lead_id
WHERE led.claimed_by = auth.uid() AND led.lead_status = 'claimed';

-- Grant access to the views
GRANT SELECT ON professional_leads_anonymized TO authenticated;
GRANT SELECT ON professional_claimed_leads TO authenticated;

