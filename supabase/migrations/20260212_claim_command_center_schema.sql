-- =====================================================
-- CLAIM COMMAND CENTER DATABASE SCHEMA
-- Complete database structure for AI-powered claim execution system
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. CLAIMS TABLE (Enhanced)
-- =====================================================
-- Note: claims table already exists, adding missing columns only

ALTER TABLE public.claims 
ADD COLUMN IF NOT EXISTS claim_number TEXT,
ADD COLUMN IF NOT EXISTS loss_date DATE,
ADD COLUMN IF NOT EXISTS adjuster_name TEXT,
ADD COLUMN IF NOT EXISTS adjuster_phone TEXT,
ADD COLUMN IF NOT EXISTS adjuster_email TEXT;

CREATE INDEX IF NOT EXISTS idx_claims_claim_number ON public.claims(claim_number);
CREATE INDEX IF NOT EXISTS idx_claims_loss_date ON public.claims(loss_date);

-- =====================================================
-- 2. CLAIM_STEPS TABLE
-- Tracks completion status of each step in the command center
-- =====================================================
CREATE TABLE IF NOT EXISTS public.claim_steps (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    claim_id UUID NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    step_number INTEGER NOT NULL CHECK (step_number BETWEEN 1 AND 18),
    status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'skipped')),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(claim_id, step_number)
);

CREATE INDEX IF NOT EXISTS idx_claim_steps_claim_id ON public.claim_steps(claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_steps_user_id ON public.claim_steps(user_id);
CREATE INDEX IF NOT EXISTS idx_claim_steps_status ON public.claim_steps(status);

-- =====================================================
-- 3. CLAIM_DOCUMENTS TABLE
-- Stores uploaded documents with metadata
-- =====================================================
CREATE TABLE IF NOT EXISTS public.claim_documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    claim_id UUID NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    document_type TEXT NOT NULL CHECK (document_type IN (
        'policy', 
        'contractor_estimate', 
        'carrier_estimate', 
        'settlement_letter',
        'release',
        'photo',
        'invoice',
        'receipt',
        'correspondence',
        'supplement',
        'proof_of_loss',
        'other'
    )),
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    storage_path TEXT NOT NULL,
    step_number INTEGER CHECK (step_number BETWEEN 1 AND 18),
    description TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_claim_documents_claim_id ON public.claim_documents(claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_documents_user_id ON public.claim_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_claim_documents_type ON public.claim_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_claim_documents_step ON public.claim_documents(step_number);

-- =====================================================
-- 4. CLAIM_OUTPUTS TABLE
-- Stores AI-generated analysis outputs
-- =====================================================
CREATE TABLE IF NOT EXISTS public.claim_outputs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    claim_id UUID NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    step_number INTEGER NOT NULL CHECK (step_number BETWEEN 1 AND 18),
    output_type TEXT NOT NULL CHECK (output_type IN (
        'policy_analysis',
        'estimate_comparison',
        'supplement_letter',
        'settlement_analysis',
        'release_analysis',
        'demand_letter',
        'code_analysis',
        'financial_summary'
    )),
    output_json JSONB NOT NULL,
    input_document_ids UUID[],
    ai_model TEXT,
    processing_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_claim_outputs_claim_id ON public.claim_outputs(claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_outputs_user_id ON public.claim_outputs(user_id);
CREATE INDEX IF NOT EXISTS idx_claim_outputs_type ON public.claim_outputs(output_type);
CREATE INDEX IF NOT EXISTS idx_claim_outputs_step ON public.claim_outputs(step_number);
CREATE INDEX IF NOT EXISTS idx_claim_outputs_json ON public.claim_outputs USING GIN (output_json);

-- =====================================================
-- 5. CLAIM_FINANCIAL_SUMMARY TABLE
-- Tracks all financial aspects of the claim
-- =====================================================
CREATE TABLE IF NOT EXISTS public.claim_financial_summary (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    claim_id UUID NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE UNIQUE,
    user_id UUID NOT NULL,
    
    -- Contractor vs Carrier Totals
    contractor_total NUMERIC(12,2) DEFAULT 0,
    carrier_total NUMERIC(12,2) DEFAULT 0,
    underpayment_estimate NUMERIC(12,2) DEFAULT 0,
    
    -- Depreciation Tracking
    depreciation_withheld NUMERIC(12,2) DEFAULT 0,
    depreciation_recovered NUMERIC(12,2) DEFAULT 0,
    depreciation_outstanding NUMERIC(12,2) DEFAULT 0,
    
    -- Payment Breakdown
    acv_paid NUMERIC(12,2) DEFAULT 0,
    rcv_total NUMERIC(12,2) DEFAULT 0,
    deductible_applied NUMERIC(12,2) DEFAULT 0,
    
    -- Category Totals
    structure_total NUMERIC(12,2) DEFAULT 0,
    contents_total NUMERIC(12,2) DEFAULT 0,
    ale_total NUMERIC(12,2) DEFAULT 0,
    code_upgrade_total NUMERIC(12,2) DEFAULT 0,
    
    -- Supplement Tracking
    supplement_count INTEGER DEFAULT 0,
    supplement_total NUMERIC(12,2) DEFAULT 0,
    supplement_approved NUMERIC(12,2) DEFAULT 0,
    supplement_pending NUMERIC(12,2) DEFAULT 0,
    
    -- Final Settlement
    final_settlement_amount NUMERIC(12,2) DEFAULT 0,
    total_paid_to_date NUMERIC(12,2) DEFAULT 0,
    outstanding_balance NUMERIC(12,2) DEFAULT 0,
    
    currency TEXT DEFAULT 'USD',
    last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_claim_financial_summary_claim_id ON public.claim_financial_summary(claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_financial_summary_user_id ON public.claim_financial_summary(user_id);

-- =====================================================
-- 6. CLAIM_ESTIMATE_DISCREPANCIES TABLE
-- Detailed line-item discrepancies between estimates
-- =====================================================
CREATE TABLE IF NOT EXISTS public.claim_estimate_discrepancies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    claim_id UUID NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    output_id UUID REFERENCES public.claim_outputs(id) ON DELETE CASCADE,
    
    discrepancy_type TEXT NOT NULL CHECK (discrepancy_type IN (
        'missing_item',
        'quantity_difference',
        'pricing_difference',
        'material_difference',
        'scope_omission'
    )),
    
    line_item_description TEXT NOT NULL,
    contractor_quantity NUMERIC(10,2),
    carrier_quantity NUMERIC(10,2),
    contractor_unit_price NUMERIC(10,2),
    carrier_unit_price NUMERIC(10,2),
    contractor_total NUMERIC(12,2),
    carrier_total NUMERIC(12,2),
    difference_amount NUMERIC(12,2),
    
    category TEXT,
    notes TEXT,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_claim_estimate_discrepancies_claim_id ON public.claim_estimate_discrepancies(claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_estimate_discrepancies_type ON public.claim_estimate_discrepancies(discrepancy_type);
CREATE INDEX IF NOT EXISTS idx_claim_estimate_discrepancies_resolved ON public.claim_estimate_discrepancies(resolved);

-- =====================================================
-- 7. CLAIM_POLICY_COVERAGE TABLE
-- Extracted policy coverage details
-- =====================================================
CREATE TABLE IF NOT EXISTS public.claim_policy_coverage (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    claim_id UUID NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE UNIQUE,
    user_id UUID NOT NULL,
    output_id UUID REFERENCES public.claim_outputs(id) ON DELETE SET NULL,
    
    -- Coverage Limits
    dwelling_limit NUMERIC(12,2),
    contents_limit NUMERIC(12,2),
    ale_limit NUMERIC(12,2),
    ordinance_law_limit NUMERIC(12,2),
    
    -- Deductible
    deductible_amount NUMERIC(12,2),
    deductible_type TEXT CHECK (deductible_type IN ('flat', 'percentage', 'hurricane', 'wind_hail')),
    
    -- Settlement Type
    settlement_type TEXT CHECK (settlement_type IN ('ACV', 'RCV', 'Functional_RCV')),
    
    -- Special Provisions
    ordinance_law_coverage BOOLEAN DEFAULT FALSE,
    code_upgrade_coverage BOOLEAN DEFAULT FALSE,
    matching_coverage BOOLEAN DEFAULT FALSE,
    
    -- Exclusions and Limitations
    exclusions JSONB,
    limitations JSONB,
    endorsements JSONB,
    
    -- Risk Flags
    risk_notes TEXT[],
    
    extracted_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_claim_policy_coverage_claim_id ON public.claim_policy_coverage(claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_policy_coverage_settlement_type ON public.claim_policy_coverage(settlement_type);

-- =====================================================
-- 8. CLAIM_GENERATED_DOCUMENTS TABLE
-- AI-generated documents (letters, supplements, etc.)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.claim_generated_documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    claim_id UUID NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    output_id UUID REFERENCES public.claim_outputs(id) ON DELETE SET NULL,
    
    document_type TEXT NOT NULL CHECK (document_type IN (
        'supplement_letter',
        'demand_letter',
        'escalation_letter',
        'negotiation_letter',
        'depreciation_request',
        'proof_of_loss'
    )),
    
    title TEXT NOT NULL,
    content_html TEXT NOT NULL,
    content_markdown TEXT,
    
    -- Generation Metadata
    template_version TEXT,
    ai_model TEXT,
    
    -- Status
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'reviewed', 'sent', 'archived')),
    sent_at TIMESTAMPTZ,
    
    -- File Export
    pdf_url TEXT,
    docx_url TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_claim_generated_documents_claim_id ON public.claim_generated_documents(claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_generated_documents_type ON public.claim_generated_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_claim_generated_documents_status ON public.claim_generated_documents(status);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables
DROP TRIGGER IF EXISTS update_claim_steps_updated_at ON public.claim_steps;
CREATE TRIGGER update_claim_steps_updated_at
    BEFORE UPDATE ON public.claim_steps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_claim_documents_updated_at ON public.claim_documents;
CREATE TRIGGER update_claim_documents_updated_at
    BEFORE UPDATE ON public.claim_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_claim_outputs_updated_at ON public.claim_outputs;
CREATE TRIGGER update_claim_outputs_updated_at
    BEFORE UPDATE ON public.claim_outputs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_claim_financial_summary_updated_at ON public.claim_financial_summary;
CREATE TRIGGER update_claim_financial_summary_updated_at
    BEFORE UPDATE ON public.claim_financial_summary
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_claim_estimate_discrepancies_updated_at ON public.claim_estimate_discrepancies;
CREATE TRIGGER update_claim_estimate_discrepancies_updated_at
    BEFORE UPDATE ON public.claim_estimate_discrepancies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_claim_policy_coverage_updated_at ON public.claim_policy_coverage;
CREATE TRIGGER update_claim_policy_coverage_updated_at
    BEFORE UPDATE ON public.claim_policy_coverage
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_claim_generated_documents_updated_at ON public.claim_generated_documents;
CREATE TRIGGER update_claim_generated_documents_updated_at
    BEFORE UPDATE ON public.claim_generated_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.claim_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_financial_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_estimate_discrepancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_policy_coverage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_generated_documents ENABLE ROW LEVEL SECURITY;

-- Claim Steps Policies
DROP POLICY IF EXISTS "Users can view their own claim steps" ON public.claim_steps;
CREATE POLICY "Users can view their own claim steps" ON public.claim_steps
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own claim steps" ON public.claim_steps;
CREATE POLICY "Users can insert their own claim steps" ON public.claim_steps
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own claim steps" ON public.claim_steps;
CREATE POLICY "Users can update their own claim steps" ON public.claim_steps
    FOR UPDATE USING (auth.uid() = user_id);

-- Claim Documents Policies
DROP POLICY IF EXISTS "Users can view their own claim documents" ON public.claim_documents;
CREATE POLICY "Users can view their own claim documents" ON public.claim_documents
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own claim documents" ON public.claim_documents;
CREATE POLICY "Users can insert their own claim documents" ON public.claim_documents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own claim documents" ON public.claim_documents;
CREATE POLICY "Users can update their own claim documents" ON public.claim_documents
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own claim documents" ON public.claim_documents;
CREATE POLICY "Users can delete their own claim documents" ON public.claim_documents
    FOR DELETE USING (auth.uid() = user_id);

-- Claim Outputs Policies
DROP POLICY IF EXISTS "Users can view their own claim outputs" ON public.claim_outputs;
CREATE POLICY "Users can view their own claim outputs" ON public.claim_outputs
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own claim outputs" ON public.claim_outputs;
CREATE POLICY "Users can insert their own claim outputs" ON public.claim_outputs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Claim Financial Summary Policies
DROP POLICY IF EXISTS "Users can view their own claim financial summary" ON public.claim_financial_summary;
CREATE POLICY "Users can view their own claim financial summary" ON public.claim_financial_summary
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own claim financial summary" ON public.claim_financial_summary;
CREATE POLICY "Users can insert their own claim financial summary" ON public.claim_financial_summary
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own claim financial summary" ON public.claim_financial_summary;
CREATE POLICY "Users can update their own claim financial summary" ON public.claim_financial_summary
    FOR UPDATE USING (auth.uid() = user_id);

-- Claim Estimate Discrepancies Policies
DROP POLICY IF EXISTS "Users can view their own claim discrepancies" ON public.claim_estimate_discrepancies;
CREATE POLICY "Users can view their own claim discrepancies" ON public.claim_estimate_discrepancies
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own claim discrepancies" ON public.claim_estimate_discrepancies;
CREATE POLICY "Users can insert their own claim discrepancies" ON public.claim_estimate_discrepancies
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own claim discrepancies" ON public.claim_estimate_discrepancies;
CREATE POLICY "Users can update their own claim discrepancies" ON public.claim_estimate_discrepancies
    FOR UPDATE USING (auth.uid() = user_id);

-- Claim Policy Coverage Policies
DROP POLICY IF EXISTS "Users can view their own claim policy coverage" ON public.claim_policy_coverage;
CREATE POLICY "Users can view their own claim policy coverage" ON public.claim_policy_coverage
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own claim policy coverage" ON public.claim_policy_coverage;
CREATE POLICY "Users can insert their own claim policy coverage" ON public.claim_policy_coverage
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own claim policy coverage" ON public.claim_policy_coverage;
CREATE POLICY "Users can update their own claim policy coverage" ON public.claim_policy_coverage
    FOR UPDATE USING (auth.uid() = user_id);

-- Claim Generated Documents Policies
DROP POLICY IF EXISTS "Users can view their own generated documents" ON public.claim_generated_documents;
CREATE POLICY "Users can view their own generated documents" ON public.claim_generated_documents
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own generated documents" ON public.claim_generated_documents;
CREATE POLICY "Users can insert their own generated documents" ON public.claim_generated_documents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own generated documents" ON public.claim_generated_documents;
CREATE POLICY "Users can update their own generated documents" ON public.claim_generated_documents
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own generated documents" ON public.claim_generated_documents;
CREATE POLICY "Users can delete their own generated documents" ON public.claim_generated_documents
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to calculate financial summary
CREATE OR REPLACE FUNCTION calculate_claim_financial_summary(p_claim_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.claim_financial_summary
    SET
        underpayment_estimate = GREATEST(0, contractor_total - carrier_total),
        depreciation_outstanding = GREATEST(0, depreciation_withheld - depreciation_recovered),
        outstanding_balance = GREATEST(0, final_settlement_amount - total_paid_to_date),
        last_calculated_at = NOW()
    WHERE claim_id = p_claim_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to initialize claim steps
CREATE OR REPLACE FUNCTION initialize_claim_steps(p_claim_id UUID, p_user_id UUID)
RETURNS void AS $$
DECLARE
    v_step INTEGER;
BEGIN
    FOR v_step IN 1..18 LOOP
        INSERT INTO public.claim_steps (claim_id, user_id, step_number, status)
        VALUES (p_claim_id, p_user_id, v_step, 'not_started')
        ON CONFLICT (claim_id, step_number) DO NOTHING;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to initialize financial summary
CREATE OR REPLACE FUNCTION initialize_claim_financial_summary(p_claim_id UUID, p_user_id UUID)
RETURNS void AS $$
BEGIN
    INSERT INTO public.claim_financial_summary (claim_id, user_id)
    VALUES (p_claim_id, p_user_id)
    ON CONFLICT (claim_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE public.claim_steps IS 'Tracks completion status of 18 command center steps per claim';
COMMENT ON TABLE public.claim_documents IS 'Stores uploaded documents with Supabase Storage URLs';
COMMENT ON TABLE public.claim_outputs IS 'AI-generated analysis outputs stored as structured JSON';
COMMENT ON TABLE public.claim_financial_summary IS 'Comprehensive financial tracking for each claim';
COMMENT ON TABLE public.claim_estimate_discrepancies IS 'Line-item discrepancies between contractor and carrier estimates';
COMMENT ON TABLE public.claim_policy_coverage IS 'Extracted policy coverage details from AI analysis';
COMMENT ON TABLE public.claim_generated_documents IS 'AI-generated letters and documents';

-- =====================================================
-- GRANT PERMISSIONS (if needed for service role)
-- =====================================================
-- These are typically handled by Supabase automatically
-- but included for completeness

GRANT ALL ON public.claim_steps TO authenticated;
GRANT ALL ON public.claim_documents TO authenticated;
GRANT ALL ON public.claim_outputs TO authenticated;
GRANT ALL ON public.claim_financial_summary TO authenticated;
GRANT ALL ON public.claim_estimate_discrepancies TO authenticated;
GRANT ALL ON public.claim_policy_coverage TO authenticated;
GRANT ALL ON public.claim_generated_documents TO authenticated;

-- =====================================================
-- END OF MIGRATION
-- =====================================================
