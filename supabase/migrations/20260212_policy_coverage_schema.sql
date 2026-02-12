-- =====================================================
-- POLICY REVIEW ENGINE v2 - DATABASE SCHEMA
-- Structured coverage extraction and trigger integration
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. CLAIM_POLICY_COVERAGE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.claim_policy_coverage (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    claim_id UUID NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE UNIQUE,
    user_id UUID NOT NULL,
    
    -- Coverage Limits
    dwelling_limit NUMERIC(12,2),
    other_structures_limit NUMERIC(12,2),
    contents_limit NUMERIC(12,2),
    ale_limit NUMERIC(12,2),
    
    -- Deductible
    deductible NUMERIC(12,2),
    deductible_type TEXT, -- 'flat' | 'percentage'
    
    -- Settlement Type
    settlement_type TEXT CHECK (settlement_type IN ('ACV', 'RCV', 'MIXED')),
    
    -- Ordinance & Law
    ordinance_law_percent NUMERIC(5,2),
    ordinance_law_limit NUMERIC(12,2),
    
    -- Endorsements (Boolean Flags)
    matching_endorsement BOOLEAN DEFAULT FALSE,
    cosmetic_exclusion BOOLEAN DEFAULT FALSE,
    roof_acv_endorsement BOOLEAN DEFAULT FALSE,
    replacement_cost_endorsement BOOLEAN DEFAULT FALSE,
    named_peril_policy BOOLEAN DEFAULT FALSE,
    open_peril_policy BOOLEAN DEFAULT FALSE,
    
    -- Sublimits
    water_sublimit NUMERIC(12,2),
    mold_sublimit NUMERIC(12,2),
    sewer_backup_sublimit NUMERIC(12,2),
    
    -- Special Endorsements (JSONB)
    special_endorsements JSONB DEFAULT '[]'::jsonb,
    
    -- Exclusions (JSONB)
    exclusion_flags JSONB DEFAULT '{}'::jsonb,
    
    -- Parsing Metadata
    raw_policy_text_hash TEXT,
    parsed_by TEXT DEFAULT 'regex', -- 'regex' | 'ai' | 'manual'
    ai_confidence NUMERIC(3,2),
    parsing_duration_ms INTEGER,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on claim_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_policy_coverage_claim_id ON public.claim_policy_coverage(claim_id);
CREATE INDEX IF NOT EXISTS idx_policy_coverage_hash ON public.claim_policy_coverage(raw_policy_text_hash);

-- =====================================================
-- 2. POLICY COVERAGE TRIGGERS TABLE
-- Cross-reference with estimate engine
-- =====================================================
CREATE TABLE IF NOT EXISTS public.claim_policy_triggers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    claim_id UUID NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    policy_coverage_id UUID REFERENCES public.claim_policy_coverage(id) ON DELETE CASCADE,
    
    -- Trigger Types
    ordinance_trigger BOOLEAN DEFAULT FALSE,
    ordinance_trigger_amount NUMERIC(12,2),
    ordinance_trigger_note TEXT,
    
    matching_trigger BOOLEAN DEFAULT FALSE,
    matching_trigger_note TEXT,
    
    depreciation_trigger BOOLEAN DEFAULT FALSE,
    depreciation_trigger_note TEXT,
    
    sublimit_trigger BOOLEAN DEFAULT FALSE,
    sublimit_trigger_type TEXT, -- 'water' | 'mold' | 'sewer'
    sublimit_trigger_amount NUMERIC(12,2),
    sublimit_trigger_note TEXT,
    
    settlement_type_trigger BOOLEAN DEFAULT FALSE,
    settlement_type_trigger_note TEXT,
    
    -- Metadata
    triggers_calculated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_policy_triggers_claim_id ON public.claim_policy_triggers(claim_id);

-- =====================================================
-- 3. TRIGGERS FOR TIMESTAMPS
-- =====================================================
DROP TRIGGER IF EXISTS update_policy_coverage_updated_at ON public.claim_policy_coverage;
CREATE TRIGGER update_policy_coverage_updated_at
    BEFORE UPDATE ON public.claim_policy_coverage
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_policy_triggers_updated_at ON public.claim_policy_triggers;
CREATE TRIGGER update_policy_triggers_updated_at
    BEFORE UPDATE ON public.claim_policy_triggers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 4. ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE public.claim_policy_coverage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_policy_triggers ENABLE ROW LEVEL SECURITY;

-- Policy Coverage Policies
DROP POLICY IF EXISTS "Users can view their own policy coverage" ON public.claim_policy_coverage;
CREATE POLICY "Users can view their own policy coverage" ON public.claim_policy_coverage
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own policy coverage" ON public.claim_policy_coverage;
CREATE POLICY "Users can insert their own policy coverage" ON public.claim_policy_coverage
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own policy coverage" ON public.claim_policy_coverage;
CREATE POLICY "Users can update their own policy coverage" ON public.claim_policy_coverage
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy Triggers Policies
DROP POLICY IF EXISTS "Users can view their own policy triggers" ON public.claim_policy_triggers;
CREATE POLICY "Users can view their own policy triggers" ON public.claim_policy_triggers
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own policy triggers" ON public.claim_policy_triggers;
CREATE POLICY "Users can insert their own policy triggers" ON public.claim_policy_triggers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own policy triggers" ON public.claim_policy_triggers;
CREATE POLICY "Users can update their own policy triggers" ON public.claim_policy_triggers
    FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- 5. HELPER FUNCTIONS
-- =====================================================

-- Calculate total coverage available
CREATE OR REPLACE FUNCTION calculate_total_coverage(p_claim_id UUID)
RETURNS NUMERIC(12,2) AS $$
BEGIN
    RETURN (
        SELECT 
            COALESCE(dwelling_limit, 0) +
            COALESCE(other_structures_limit, 0) +
            COALESCE(contents_limit, 0) +
            COALESCE(ale_limit, 0)
        FROM public.claim_policy_coverage
        WHERE claim_id = p_claim_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if ordinance coverage applies
CREATE OR REPLACE FUNCTION has_ordinance_coverage(p_claim_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT ordinance_law_percent > 0
        FROM public.claim_policy_coverage
        WHERE claim_id = p_claim_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get effective coverage limit for category
CREATE OR REPLACE FUNCTION get_coverage_limit(p_claim_id UUID, p_category TEXT)
RETURNS NUMERIC(12,2) AS $$
BEGIN
    RETURN (
        SELECT CASE
            WHEN p_category IN ('Roofing', 'Siding', 'Structural', 'Foundation') THEN dwelling_limit
            WHEN p_category IN ('Contents', 'Personal Property') THEN contents_limit
            WHEN p_category IN ('ALE', 'Living Expenses') THEN ale_limit
            ELSE dwelling_limit
        END
        FROM public.claim_policy_coverage
        WHERE claim_id = p_claim_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. COMMENTS
-- =====================================================
COMMENT ON TABLE public.claim_policy_coverage IS 'Structured policy coverage data extracted from policy documents';
COMMENT ON TABLE public.claim_policy_triggers IS 'Policy-based triggers for estimate and supplement integration';

COMMENT ON COLUMN public.claim_policy_coverage.raw_policy_text_hash IS 'SHA256 hash of policy text to prevent reprocessing';
COMMENT ON COLUMN public.claim_policy_coverage.parsed_by IS 'Extraction method: regex (deterministic), ai (fallback), or manual';
COMMENT ON COLUMN public.claim_policy_coverage.special_endorsements IS 'Array of special endorsement objects';
COMMENT ON COLUMN public.claim_policy_coverage.exclusion_flags IS 'Object of exclusion flags and details';

-- =====================================================
-- END OF MIGRATION
-- =====================================================
