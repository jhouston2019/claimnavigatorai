-- =====================================================
-- EXPERT REPORT ENGINE - DATABASE SCHEMA
-- Created: February 24, 2026
-- Purpose: Support expert report analysis capability
-- =====================================================

-- =====================================================
-- 1. UPDATE DOCUMENT TYPE ENUM
-- =====================================================

ALTER TABLE claim_documents 
DROP CONSTRAINT IF EXISTS claim_documents_document_type_check;

ALTER TABLE claim_documents
ADD CONSTRAINT claim_documents_document_type_check 
CHECK (document_type IN (
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
    'engineer_report',
    'expert_opinion',
    'appraisal_award',
    'moisture_report',
    'contractor_narrative',
    'roofing_consultant_report',
    'causation_report',
    'other'
));

-- =====================================================
-- 2. CREATE EXPERT REPORTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.claim_expert_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id UUID NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES public.claim_documents(id) ON DELETE CASCADE,
    
    -- Report Classification
    report_type TEXT NOT NULL CHECK (report_type IN (
        'engineer_report',
        'hygienist_report',
        'appraisal_award',
        'contractor_narrative',
        'roofing_consultant_report',
        'causation_report',
        'other_expert'
    )),
    classification_confidence NUMERIC CHECK (classification_confidence >= 0 AND classification_confidence <= 1),
    
    -- Expert Metadata
    expert_name TEXT,
    expert_credentials TEXT,
    expert_company TEXT,
    inspection_date DATE,
    report_date DATE,
    
    -- Causation Analysis
    causation_opinion TEXT CHECK (causation_opinion IN ('covered', 'not_covered', 'indeterminate', 'not_stated')),
    causation_confidence TEXT CHECK (causation_confidence IN ('strong', 'moderate', 'weak', 'none')),
    causation_statements JSONB,
    
    -- Extracted Content
    extracted_conclusions JSONB,
    extracted_limitations JSONB,
    extracted_recommendations JSONB,
    extracted_measurements JSONB,
    detected_sections JSONB,
    
    -- Bias Analysis
    bias_score NUMERIC CHECK (bias_score >= -1 AND bias_score <= 1),
    carrier_aligned_phrases JSONB,
    policyholder_aligned_phrases JSONB,
    
    -- Processing Metadata
    parsed_sentence_count INTEGER,
    negation_count INTEGER,
    conditional_count INTEGER,
    qualification_count INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. CREATE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_expert_reports_claim_id 
ON public.claim_expert_reports(claim_id);

CREATE INDEX IF NOT EXISTS idx_expert_reports_document_id 
ON public.claim_expert_reports(document_id);

CREATE INDEX IF NOT EXISTS idx_expert_reports_type 
ON public.claim_expert_reports(report_type);

CREATE INDEX IF NOT EXISTS idx_expert_reports_causation 
ON public.claim_expert_reports(causation_opinion);

CREATE INDEX IF NOT EXISTS idx_expert_reports_date 
ON public.claim_expert_reports(report_date);

-- =====================================================
-- 4. CREATE EXPERT REPORT CONTRADICTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.claim_expert_contradictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id UUID NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
    report_1_id UUID NOT NULL REFERENCES public.claim_expert_reports(id) ON DELETE CASCADE,
    report_2_id UUID NOT NULL REFERENCES public.claim_expert_reports(id) ON DELETE CASCADE,
    
    contradiction_type TEXT NOT NULL CHECK (contradiction_type IN (
        'causation_conflict',
        'damage_extent_conflict',
        'measurement_conflict',
        'timeline_conflict',
        'recommendation_conflict'
    )),
    
    severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
    
    report_1_statement TEXT,
    report_2_statement TEXT,
    
    conflict_description TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expert_contradictions_claim_id 
ON public.claim_expert_contradictions(claim_id);

-- =====================================================
-- 5. ROW LEVEL SECURITY POLICIES
-- =====================================================

ALTER TABLE public.claim_expert_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_expert_contradictions ENABLE ROW LEVEL SECURITY;

-- Users can only access their own expert reports
CREATE POLICY expert_reports_user_access ON public.claim_expert_reports
    FOR ALL
    USING (
        claim_id IN (
            SELECT id FROM public.claims WHERE user_id = auth.uid()
        )
    );

-- Users can only access contradictions for their claims
CREATE POLICY expert_contradictions_user_access ON public.claim_expert_contradictions
    FOR ALL
    USING (
        claim_id IN (
            SELECT id FROM public.claims WHERE user_id = auth.uid()
        )
    );

-- =====================================================
-- 6. GRANT PERMISSIONS
-- =====================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.claim_expert_reports TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.claim_expert_contradictions TO authenticated;
