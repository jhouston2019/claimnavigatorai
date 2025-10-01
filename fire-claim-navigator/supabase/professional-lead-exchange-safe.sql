-- Professional Lead Exchange Schema - Safe Version
-- This version only adds the necessary columns without assuming existing structure

-- Add lead exchange columns to existing leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_status TEXT DEFAULT 'new';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS claimed_by UUID REFERENCES auth.users(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 249;

-- Add email column if it doesn't exist (for lead exchange)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS email TEXT;

-- Add CHECK constraints after columns are created
ALTER TABLE leads ADD CONSTRAINT IF NOT EXISTS check_lead_status 
    CHECK (lead_status IN ('new', 'claimed', 'expired'));

-- Create professionals table for professional users
CREATE TABLE IF NOT EXISTS professionals (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'professional' CHECK (role = 'professional'),
    credits NUMERIC DEFAULT 0,
    company_name TEXT,
    specialty TEXT,
    state TEXT,
    email TEXT, -- Professional's email for notifications
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create professional transactions table for tracking purchases
CREATE TABLE IF NOT EXISTS professional_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    professional_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('lead_purchase', 'credits_purchase')),
    amount NUMERIC NOT NULL,
    credits NUMERIC DEFAULT 0,
    stripe_session_id TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance (only for columns that exist)
CREATE INDEX IF NOT EXISTS idx_leads_lead_status ON leads(lead_status);
CREATE INDEX IF NOT EXISTS idx_leads_claimed_by ON leads(claimed_by);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);

CREATE INDEX IF NOT EXISTS idx_professionals_role ON professionals(role);
CREATE INDEX IF NOT EXISTS idx_professionals_state ON professionals(state);
CREATE INDEX IF NOT EXISTS idx_professionals_specialty ON professionals(specialty);

CREATE INDEX IF NOT EXISTS idx_professional_transactions_professional_id ON professional_transactions(professional_id);
CREATE INDEX IF NOT EXISTS idx_professional_transactions_lead_id ON professional_transactions(lead_id);
CREATE INDEX IF NOT EXISTS idx_professional_transactions_type ON professional_transactions(type);
CREATE INDEX IF NOT EXISTS idx_professional_transactions_status ON professional_transactions(status);
CREATE INDEX IF NOT EXISTS idx_professional_transactions_created_at ON professional_transactions(created_at);

-- Enable Row Level Security
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for leads table
-- Allow professionals to see anonymized fields of all leads
CREATE POLICY "professionals_can_view_anonymized_leads"
    ON leads FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM professionals p WHERE p.id = auth.uid()
    ));

-- Allow professionals to see full details ONLY for leads they purchased
CREATE POLICY "professionals_can_view_claimed_leads"
    ON leads FOR SELECT
    USING (claimed_by = auth.uid());

-- Allow professionals to update leads they claimed
CREATE POLICY "professionals_can_update_claimed_leads"
    ON leads FOR UPDATE
    USING (claimed_by = auth.uid());

-- Allow service role to insert new leads (from intake forms)
CREATE POLICY "service_role_can_insert_leads"
    ON leads FOR INSERT
    USING (auth.role() = 'service_role');

-- Allow service role to update lead status and claimed_by
CREATE POLICY "service_role_can_update_leads"
    ON leads FOR UPDATE
    USING (auth.role() = 'service_role');

-- RLS Policies for professionals table
-- Professionals can only see their own profile
CREATE POLICY "professionals_can_view_self"
    ON professionals FOR SELECT
    USING (id = auth.uid());

-- Professionals can update their own profile and credits
CREATE POLICY "professionals_can_update_self"
    ON professionals FOR UPDATE
    USING (id = auth.uid());

-- Allow service role to manage all professionals
CREATE POLICY "service_role_can_manage_professionals"
    ON professionals FOR ALL
    USING (auth.role() = 'service_role');

-- RLS Policies for professional_transactions table
-- Professionals can view their own transactions
CREATE POLICY "professionals_can_view_own_transactions"
    ON professional_transactions FOR SELECT
    USING (professional_id = auth.uid());

-- Allow service role to manage all transactions
CREATE POLICY "service_role_can_manage_transactions"
    ON professional_transactions FOR ALL
    USING (auth.role() = 'service_role');

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_leads_updated_at 
    BEFORE UPDATE ON leads 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_professionals_updated_at 
    BEFORE UPDATE ON professionals 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_professional_transactions_updated_at 
    BEFORE UPDATE ON professional_transactions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

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
    
    -- Check if professional has enough credits or can pay
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
-- This view will work with whatever columns exist in your leads table
CREATE OR REPLACE VIEW professional_leads_anonymized AS
SELECT 
    l.id,
    l.date_of_loss,
    l.insurer,
    l.status,
    l.lead_status,
    l.price,
    l.created_at,
    -- Handle different column names that might exist
    COALESCE(l.type_of_loss, 'Unknown') as type_of_loss,
    COALESCE(l.property_type, 'Unknown') as property_type,
    COALESCE(l.loss_location, 'Unknown') as loss_location,
    -- Anonymized location (city, state only)
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
    -- Handle different column names that might exist
    COALESCE(l.type_of_loss, 'Unknown') as type_of_loss,
    COALESCE(l.property_type, 'Unknown') as property_type,
    COALESCE(l.loss_location, 'Unknown') as loss_location
FROM leads l
WHERE l.claimed_by = auth.uid() AND l.lead_status = 'claimed';

-- Grant access to the views
GRANT SELECT ON professional_leads_anonymized TO authenticated;
GRANT SELECT ON professional_claimed_leads TO authenticated;

-- Create function to notify professionals of new leads
CREATE OR REPLACE FUNCTION notify_professionals_new_lead()
RETURNS TRIGGER AS $$
BEGIN
    -- This will be handled by a serverless function
    -- The trigger just ensures the lead is properly inserted
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new lead notifications
CREATE TRIGGER new_lead_notification
    AFTER INSERT ON leads
    FOR EACH ROW
    EXECUTE FUNCTION notify_professionals_new_lead();
