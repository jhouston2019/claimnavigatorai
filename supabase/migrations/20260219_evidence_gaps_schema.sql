-- =====================================================
-- EVIDENCE GAPS & PROOF REQUIREMENTS SCHEMA
-- Tracks missing documentation and proof requirements
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE: claim_evidence_gaps
-- Tracks missing documentation and proof items
-- =====================================================
CREATE TABLE IF NOT EXISTS public.claim_evidence_gaps (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    claim_id UUID NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    
    -- Gap identification
    gap_type TEXT NOT NULL CHECK (gap_type IN (
        'contractor_estimate_missing',
        'carrier_estimate_missing',
        'moisture_report_missing',
        'code_documentation_missing',
        'damage_photo_missing',
        'causation_explanation_missing',
        'pricing_support_missing',
        'code_citation_missing',
        'contractor_narrative_missing',
        'high_value_delta_undocumented'
    )),
    
    -- Description and context
    description TEXT NOT NULL,
    line_item_reference TEXT, -- Reference to specific line item if applicable
    delta_amount NUMERIC(12,2), -- Associated financial exposure
    
    -- Severity
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    
    -- Status
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_evidence_gaps_claim_id ON public.claim_evidence_gaps(claim_id);
CREATE INDEX IF NOT EXISTS idx_evidence_gaps_resolved ON public.claim_evidence_gaps(resolved);
CREATE INDEX IF NOT EXISTS idx_evidence_gaps_severity ON public.claim_evidence_gaps(severity);
CREATE INDEX IF NOT EXISTS idx_evidence_gaps_type ON public.claim_evidence_gaps(gap_type);

-- =====================================================
-- TABLE: claim_escalation_status
-- Tracks escalation recommendations and activity
-- =====================================================
CREATE TABLE IF NOT EXISTS public.claim_escalation_status (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    claim_id UUID NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE UNIQUE,
    user_id UUID NOT NULL,
    
    -- Escalation level
    escalation_level INTEGER DEFAULT 0 CHECK (escalation_level BETWEEN 0 AND 3),
    -- 0 = no escalation needed
    -- 1 = supervisor escalation
    -- 2 = DOI complaint
    -- 3 = appraisal clause trigger
    
    -- Escalation triggers
    underpayment_amount NUMERIC(12,2),
    underpayment_threshold NUMERIC(12,2) DEFAULT 5000.00,
    days_since_supplement INTEGER,
    days_since_last_response INTEGER,
    supplement_submitted_date DATE,
    last_carrier_response_date DATE,
    
    -- Escalation recommendation
    recommendation TEXT,
    template_type TEXT CHECK (template_type IN ('supervisor', 'doi_complaint', 'appraisal_demand', 'none')),
    
    -- Activity tracking
    escalation_sent BOOLEAN DEFAULT FALSE,
    escalation_sent_date DATE,
    
    -- Metadata
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_escalation_status_claim_id ON public.claim_escalation_status(claim_id);
CREATE INDEX IF NOT EXISTS idx_escalation_status_level ON public.claim_escalation_status(escalation_level);
CREATE INDEX IF NOT EXISTS idx_escalation_status_sent ON public.claim_escalation_status(escalation_sent);

-- =====================================================
-- TRIGGERS FOR TIMESTAMPS
-- =====================================================
DROP TRIGGER IF EXISTS update_evidence_gaps_updated_at ON public.claim_evidence_gaps;
CREATE TRIGGER update_evidence_gaps_updated_at
    BEFORE UPDATE ON public.claim_evidence_gaps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_escalation_status_updated_at ON public.claim_escalation_status;
CREATE TRIGGER update_escalation_status_updated_at
    BEFORE UPDATE ON public.claim_escalation_status
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE public.claim_evidence_gaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_escalation_status ENABLE ROW LEVEL SECURITY;

-- Evidence gaps policies
DROP POLICY IF EXISTS "Users can view their own evidence gaps" ON public.claim_evidence_gaps;
CREATE POLICY "Users can view their own evidence gaps" ON public.claim_evidence_gaps
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own evidence gaps" ON public.claim_evidence_gaps;
CREATE POLICY "Users can insert their own evidence gaps" ON public.claim_evidence_gaps
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own evidence gaps" ON public.claim_evidence_gaps;
CREATE POLICY "Users can update their own evidence gaps" ON public.claim_evidence_gaps
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own evidence gaps" ON public.claim_evidence_gaps;
CREATE POLICY "Users can delete their own evidence gaps" ON public.claim_evidence_gaps
    FOR DELETE USING (auth.uid() = user_id);

-- Escalation status policies
DROP POLICY IF EXISTS "Users can view their own escalation status" ON public.claim_escalation_status;
CREATE POLICY "Users can view their own escalation status" ON public.claim_escalation_status
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own escalation status" ON public.claim_escalation_status;
CREATE POLICY "Users can insert their own escalation status" ON public.claim_escalation_status
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own escalation status" ON public.claim_escalation_status;
CREATE POLICY "Users can update their own escalation status" ON public.claim_escalation_status
    FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Get unresolved high-severity evidence gaps
CREATE OR REPLACE FUNCTION get_critical_evidence_gaps(p_claim_id UUID)
RETURNS TABLE (
    id UUID,
    gap_type TEXT,
    description TEXT,
    severity TEXT,
    delta_amount NUMERIC(12,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        g.id,
        g.gap_type,
        g.description,
        g.severity,
        g.delta_amount
    FROM public.claim_evidence_gaps g
    WHERE g.claim_id = p_claim_id
      AND g.resolved = FALSE
      AND g.severity IN ('high', 'critical')
    ORDER BY 
        CASE g.severity
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2
            ELSE 3
        END,
        g.delta_amount DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Count unresolved evidence gaps by severity
CREATE OR REPLACE FUNCTION count_evidence_gaps(p_claim_id UUID)
RETURNS JSONB AS $$
BEGIN
    RETURN (
        SELECT jsonb_build_object(
            'total', COUNT(*),
            'critical', COUNT(*) FILTER (WHERE severity = 'critical'),
            'high', COUNT(*) FILTER (WHERE severity = 'high'),
            'medium', COUNT(*) FILTER (WHERE severity = 'medium'),
            'low', COUNT(*) FILTER (WHERE severity = 'low')
        )
        FROM public.claim_evidence_gaps
        WHERE claim_id = p_claim_id
          AND resolved = FALSE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update evidence gap resolution status
CREATE OR REPLACE FUNCTION resolve_evidence_gap(p_gap_id UUID, p_resolution_notes TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.claim_evidence_gaps
    SET 
        resolved = TRUE,
        resolved_at = NOW(),
        resolution_notes = p_resolution_notes
    WHERE id = p_gap_id
      AND user_id = auth.uid();
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GRANTS
-- =====================================================
GRANT ALL ON public.claim_evidence_gaps TO authenticated;
GRANT ALL ON public.claim_escalation_status TO authenticated;

GRANT EXECUTE ON FUNCTION get_critical_evidence_gaps(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION count_evidence_gaps(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION resolve_evidence_gap(UUID, TEXT) TO authenticated;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE public.claim_evidence_gaps IS 'Tracks missing documentation and proof requirements for claim recovery';
COMMENT ON TABLE public.claim_escalation_status IS 'Tracks escalation recommendations based on claim activity and response times';

COMMENT ON COLUMN public.claim_evidence_gaps.gap_type IS 'Type of missing evidence or documentation';
COMMENT ON COLUMN public.claim_evidence_gaps.delta_amount IS 'Financial exposure associated with this gap';
COMMENT ON COLUMN public.claim_evidence_gaps.severity IS 'Priority level: low, medium, high, critical';
COMMENT ON COLUMN public.claim_evidence_gaps.resolved IS 'Whether this gap has been addressed';

COMMENT ON COLUMN public.claim_escalation_status.escalation_level IS '0=none, 1=supervisor, 2=DOI, 3=appraisal';
COMMENT ON COLUMN public.claim_escalation_status.template_type IS 'Which escalation template to generate';
COMMENT ON COLUMN public.claim_escalation_status.days_since_supplement IS 'Days since last supplement submission';
COMMENT ON COLUMN public.claim_escalation_status.days_since_last_response IS 'Days since last carrier response';

-- =====================================================
-- END OF MIGRATION
-- =====================================================
