CREATE TABLE IF NOT EXISTS public.claims (
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

CREATE INDEX IF NOT EXISTS idx_claims_user_id ON public.claims(user_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON public.claims(status);
CREATE INDEX IF NOT EXISTS idx_claims_type_of_loss ON public.claims(type_of_loss);
CREATE INDEX IF NOT EXISTS idx_claims_created_at ON public.claims(created_at);
CREATE INDEX IF NOT EXISTS idx_claims_policy_number ON public.claims(policy_number);

ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own claims" ON public.claims;
DROP POLICY IF EXISTS "Users can insert their own claims" ON public.claims;
DROP POLICY IF EXISTS "Users can update their own claims" ON public.claims;
DROP POLICY IF EXISTS "Users can delete their own claims" ON public.claims;

CREATE POLICY "Users can view their own claims" ON public.claims
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own claims" ON public.claims
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own claims" ON public.claims
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own claims" ON public.claims
    FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION update_claims_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_claims_updated_at_trigger ON public.claims;
CREATE TRIGGER update_claims_updated_at_trigger
    BEFORE UPDATE ON public.claims
    FOR EACH ROW
    EXECUTE FUNCTION update_claims_updated_at();

COMMENT ON TABLE public.claims IS 'User insurance claims with full details and tracking';
