-- =====================================================
-- FINANCIAL EXPOSURE REPORTS - DATABASE SCHEMA
-- Stores structured financial exposure analysis
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. CLAIM_FINANCIAL_EXPOSURE_REPORTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.claim_financial_exposure_reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    claim_id UUID NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    
    -- Financial Exposure Summary
    total_projected_recovery NUMERIC(12,2) NOT NULL DEFAULT 0,
    rcv_delta_total NUMERIC(12,2) NOT NULL DEFAULT 0,
    acv_delta_total NUMERIC(12,2) NOT NULL DEFAULT 0,
    recoverable_depreciation_total NUMERIC(12,2) NOT NULL DEFAULT 0,
    
    -- O&P Exposure
    op_qualifies BOOLEAN DEFAULT FALSE,
    op_amount NUMERIC(12,2) DEFAULT 0,
    op_trades_detected TEXT[], -- Array of trade names
    op_trade_count INTEGER DEFAULT 0,
    op_reason TEXT,
    op_calculation JSONB,
    
    -- Category Breakdown (JSONB array)
    category_breakdown JSONB DEFAULT '[]'::jsonb,
    
    -- Structured Line Item Deltas (JSONB array)
    structured_line_item_deltas JSONB DEFAULT '[]'::jsonb,
    
    -- Negotiation Payload (JSONB)
    negotiation_payload JSONB,
    
    -- Negotiation Points (JSONB array)
    negotiation_points JSONB DEFAULT '[]'::jsonb,
    
    -- Validation Results
    validation_status TEXT CHECK (validation_status IN ('valid', 'warnings', 'errors')),
    validation_errors JSONB DEFAULT '[]'::jsonb,
    validation_warnings JSONB DEFAULT '[]'::jsonb,
    
    -- Metadata
    calculation_method TEXT DEFAULT 'deterministic',
    engine_version TEXT DEFAULT '1.0',
    processing_time_ms INTEGER,
    total_discrepancies_analyzed INTEGER,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint: one report per claim
    CONSTRAINT unique_financial_exposure_per_claim UNIQUE (claim_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_financial_exposure_claim_id ON public.claim_financial_exposure_reports(claim_id);
CREATE INDEX IF NOT EXISTS idx_financial_exposure_user_id ON public.claim_financial_exposure_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_exposure_op_qualifies ON public.claim_financial_exposure_reports(op_qualifies);
CREATE INDEX IF NOT EXISTS idx_financial_exposure_created_at ON public.claim_financial_exposure_reports(created_at);

-- =====================================================
-- 2. TRIGGERS FOR TIMESTAMPS
-- =====================================================
DROP TRIGGER IF EXISTS update_financial_exposure_updated_at ON public.claim_financial_exposure_reports;
CREATE TRIGGER update_financial_exposure_updated_at
    BEFORE UPDATE ON public.claim_financial_exposure_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 3. ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE public.claim_financial_exposure_reports ENABLE ROW LEVEL SECURITY;

-- Users can view their own reports
DROP POLICY IF EXISTS "Users can view their own financial exposure reports" ON public.claim_financial_exposure_reports;
CREATE POLICY "Users can view their own financial exposure reports" ON public.claim_financial_exposure_reports
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own reports
DROP POLICY IF EXISTS "Users can insert their own financial exposure reports" ON public.claim_financial_exposure_reports;
CREATE POLICY "Users can insert their own financial exposure reports" ON public.claim_financial_exposure_reports
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own reports
DROP POLICY IF EXISTS "Users can update their own financial exposure reports" ON public.claim_financial_exposure_reports;
CREATE POLICY "Users can update their own financial exposure reports" ON public.claim_financial_exposure_reports
    FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- 4. HELPER FUNCTIONS
-- =====================================================

-- Get total projected recovery for a claim
CREATE OR REPLACE FUNCTION get_total_projected_recovery(p_claim_id UUID)
RETURNS NUMERIC(12,2) AS $$
BEGIN
    RETURN (
        SELECT total_projected_recovery
        FROM public.claim_financial_exposure_reports
        WHERE claim_id = p_claim_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if O&P qualifies for a claim
CREATE OR REPLACE FUNCTION claim_qualifies_for_op(p_claim_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT COALESCE(op_qualifies, FALSE)
        FROM public.claim_financial_exposure_reports
        WHERE claim_id = p_claim_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get category exposure breakdown
CREATE OR REPLACE FUNCTION get_category_exposure(p_claim_id UUID)
RETURNS JSONB AS $$
BEGIN
    RETURN (
        SELECT category_breakdown
        FROM public.claim_financial_exposure_reports
        WHERE claim_id = p_claim_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get negotiation points sorted by priority
CREATE OR REPLACE FUNCTION get_negotiation_points(p_claim_id UUID)
RETURNS JSONB AS $$
DECLARE
    points JSONB;
BEGIN
    SELECT negotiation_points INTO points
    FROM public.claim_financial_exposure_reports
    WHERE claim_id = p_claim_id;
    
    -- Sort by priority: critical > high > medium > low
    -- (Sorting happens in application layer for now)
    
    RETURN COALESCE(points, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. COMMENTS
-- =====================================================
COMMENT ON TABLE public.claim_financial_exposure_reports IS 'Financial exposure analysis with RCV/ACV/Depreciation breakdown and O&P exposure';

COMMENT ON COLUMN public.claim_financial_exposure_reports.total_projected_recovery IS 'Total estimated recovery (RCV delta + O&P exposure)';
COMMENT ON COLUMN public.claim_financial_exposure_reports.rcv_delta_total IS 'Total RCV (Replacement Cost Value) delta';
COMMENT ON COLUMN public.claim_financial_exposure_reports.acv_delta_total IS 'Total ACV (Actual Cash Value) delta';
COMMENT ON COLUMN public.claim_financial_exposure_reports.recoverable_depreciation_total IS 'Total recoverable depreciation (RCV - ACV)';
COMMENT ON COLUMN public.claim_financial_exposure_reports.op_qualifies IS 'Whether claim qualifies for O&P (3+ distinct trades)';
COMMENT ON COLUMN public.claim_financial_exposure_reports.op_amount IS 'O&P exposure amount (if carrier missing O&P)';
COMMENT ON COLUMN public.claim_financial_exposure_reports.category_breakdown IS 'Array of category-level exposure objects';
COMMENT ON COLUMN public.claim_financial_exposure_reports.structured_line_item_deltas IS 'Array of line item delta objects for reconciliation table';
COMMENT ON COLUMN public.claim_financial_exposure_reports.negotiation_payload IS 'Complete negotiation-ready payload';

-- =====================================================
-- 6. GRANTS
-- =====================================================
GRANT ALL ON public.claim_financial_exposure_reports TO authenticated;
