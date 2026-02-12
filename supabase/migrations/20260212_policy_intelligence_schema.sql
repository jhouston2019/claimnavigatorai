-- =====================================================
-- POLICY INTELLIGENCE ENGINE - EXPANDED SCHEMA
-- Commercial-grade form detection and coinsurance
-- =====================================================

-- =====================================================
-- 1. EXPAND CLAIM_POLICY_COVERAGE TABLE
-- =====================================================

-- Add policy type and form detection
ALTER TABLE public.claim_policy_coverage
ADD COLUMN IF NOT EXISTS policy_type TEXT CHECK (policy_type IN ('HO', 'DP', 'CP', 'BOP', 'OTHER')),
ADD COLUMN IF NOT EXISTS form_numbers JSONB DEFAULT '[]'::jsonb;

-- Add coinsurance fields
ALTER TABLE public.claim_policy_coverage
ADD COLUMN IF NOT EXISTS coinsurance_percent NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS agreed_value BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS functional_replacement_cost BOOLEAN DEFAULT FALSE;

-- Add blanket coverage
ALTER TABLE public.claim_policy_coverage
ADD COLUMN IF NOT EXISTS blanket_limit NUMERIC(12,2);

-- Add wind/hail deductible
ALTER TABLE public.claim_policy_coverage
ADD COLUMN IF NOT EXISTS wind_hail_deductible NUMERIC(12,2),
ADD COLUMN IF NOT EXISTS wind_hail_deductible_percent NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS percentage_deductible_flag BOOLEAN DEFAULT FALSE;

-- Add location schedules
ALTER TABLE public.claim_policy_coverage
ADD COLUMN IF NOT EXISTS per_location_schedule JSONB DEFAULT '[]'::jsonb;

-- Add vacancy clause
ALTER TABLE public.claim_policy_coverage
ADD COLUMN IF NOT EXISTS vacancy_clause BOOLEAN DEFAULT FALSE;

-- Add ordinance limit type
ALTER TABLE public.claim_policy_coverage
ADD COLUMN IF NOT EXISTS ordinance_law_limit_type TEXT CHECK (ordinance_law_limit_type IN ('percent', 'flat'));

-- Add commercial property limits
ALTER TABLE public.claim_policy_coverage
ADD COLUMN IF NOT EXISTS building_limit NUMERIC(12,2),
ADD COLUMN IF NOT EXISTS business_personal_property_limit NUMERIC(12,2),
ADD COLUMN IF NOT EXISTS loss_of_income_limit NUMERIC(12,2),
ADD COLUMN IF NOT EXISTS extra_expense_limit NUMERIC(12,2);

-- =====================================================
-- 2. CREATE COINSURANCE VALIDATION TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.claim_coinsurance_validation (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    claim_id UUID NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    policy_coverage_id UUID REFERENCES public.claim_policy_coverage(id) ON DELETE CASCADE,
    
    -- Coinsurance Data
    coinsurance_percent NUMERIC(5,2),
    building_limit NUMERIC(12,2),
    estimated_replacement_cost NUMERIC(12,2),
    required_limit NUMERIC(12,2),
    shortfall NUMERIC(12,2),
    
    -- Risk Flags
    coinsurance_penalty_risk BOOLEAN DEFAULT FALSE,
    penalty_percentage NUMERIC(5,2),
    
    -- Metadata
    validation_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coinsurance_claim_id ON public.claim_coinsurance_validation(claim_id);

-- =====================================================
-- 3. EXPAND POLICY TRIGGERS TABLE
-- =====================================================

-- Add commercial-specific triggers
ALTER TABLE public.claim_policy_triggers
ADD COLUMN IF NOT EXISTS coinsurance_penalty_trigger BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS coinsurance_penalty_note TEXT,
ADD COLUMN IF NOT EXISTS percentage_deductible_trigger BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS percentage_deductible_amount NUMERIC(12,2),
ADD COLUMN IF NOT EXISTS blanket_coverage_trigger BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS blanket_coverage_note TEXT,
ADD COLUMN IF NOT EXISTS vacancy_trigger BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS vacancy_trigger_note TEXT,
ADD COLUMN IF NOT EXISTS functional_replacement_trigger BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS functional_replacement_note TEXT;

-- =====================================================
-- 4. TRIGGERS FOR TIMESTAMPS
-- =====================================================

DROP TRIGGER IF EXISTS update_coinsurance_validation_updated_at ON public.claim_coinsurance_validation;
CREATE TRIGGER update_coinsurance_validation_updated_at
    BEFORE UPDATE ON public.claim_coinsurance_validation
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.claim_coinsurance_validation ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own coinsurance validation" ON public.claim_coinsurance_validation;
CREATE POLICY "Users can view their own coinsurance validation" ON public.claim_coinsurance_validation
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own coinsurance validation" ON public.claim_coinsurance_validation;
CREATE POLICY "Users can insert their own coinsurance validation" ON public.claim_coinsurance_validation
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own coinsurance validation" ON public.claim_coinsurance_validation;
CREATE POLICY "Users can update their own coinsurance validation" ON public.claim_coinsurance_validation
    FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- 6. HELPER FUNCTIONS
-- =====================================================

-- Calculate coinsurance penalty
CREATE OR REPLACE FUNCTION calculate_coinsurance_penalty(
    p_building_limit NUMERIC,
    p_coinsurance_percent NUMERIC,
    p_replacement_cost NUMERIC
)
RETURNS TABLE(
    required_limit NUMERIC,
    shortfall NUMERIC,
    penalty_risk BOOLEAN,
    penalty_percentage NUMERIC
) AS $$
DECLARE
    v_required_limit NUMERIC;
    v_shortfall NUMERIC;
    v_penalty_percentage NUMERIC;
BEGIN
    -- Calculate required limit
    v_required_limit := p_replacement_cost * (p_coinsurance_percent / 100);
    
    -- Calculate shortfall
    v_shortfall := GREATEST(0, v_required_limit - p_building_limit);
    
    -- Calculate penalty percentage
    IF v_shortfall > 0 THEN
        v_penalty_percentage := (p_building_limit / v_required_limit) * 100;
    ELSE
        v_penalty_percentage := 100;
    END IF;
    
    RETURN QUERY SELECT
        v_required_limit,
        v_shortfall,
        (v_shortfall > 0)::BOOLEAN,
        v_penalty_percentage;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Calculate percentage deductible amount
CREATE OR REPLACE FUNCTION calculate_percentage_deductible(
    p_building_limit NUMERIC,
    p_deductible_percent NUMERIC
)
RETURNS NUMERIC AS $$
BEGIN
    RETURN p_building_limit * (p_deductible_percent / 100);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get policy form type
CREATE OR REPLACE FUNCTION get_policy_form_type(p_claim_id UUID)
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT policy_type
        FROM public.claim_policy_coverage
        WHERE claim_id = p_claim_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if coinsurance applies
CREATE OR REPLACE FUNCTION has_coinsurance_clause(p_claim_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT COALESCE(coinsurance_percent, 0) > 0
        FROM public.claim_policy_coverage
        WHERE claim_id = p_claim_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. COMMENTS
-- =====================================================

COMMENT ON COLUMN public.claim_policy_coverage.policy_type IS 'Policy form type: HO (homeowner), DP (dwelling), CP (commercial property), BOP (businessowners)';
COMMENT ON COLUMN public.claim_policy_coverage.form_numbers IS 'Array of ISO form numbers detected (e.g., ["HO 00 03", "CP 00 10"])';
COMMENT ON COLUMN public.claim_policy_coverage.coinsurance_percent IS 'Coinsurance percentage (e.g., 80, 90, 100)';
COMMENT ON COLUMN public.claim_policy_coverage.agreed_value IS 'Agreed Value endorsement waives coinsurance';
COMMENT ON COLUMN public.claim_policy_coverage.functional_replacement_cost IS 'Functional replacement cost endorsement';
COMMENT ON COLUMN public.claim_policy_coverage.blanket_limit IS 'Blanket coverage limit across multiple locations';
COMMENT ON COLUMN public.claim_policy_coverage.percentage_deductible_flag IS 'Deductible is percentage of building limit';
COMMENT ON COLUMN public.claim_policy_coverage.per_location_schedule IS 'Array of location-specific limits';
COMMENT ON COLUMN public.claim_policy_coverage.vacancy_clause IS 'Vacancy clause present (may void coverage)';

COMMENT ON TABLE public.claim_coinsurance_validation IS 'Coinsurance penalty risk calculation and validation';

-- =====================================================
-- END OF MIGRATION
-- =====================================================
