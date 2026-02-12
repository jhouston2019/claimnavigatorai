-- =====================================================
-- ESTIMATE REVIEW PRO ENGINE - DATABASE SCHEMA
-- Commercial-grade deterministic estimate comparison
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. CLAIM_ESTIMATE_LINE_ITEMS TABLE
-- Source of truth for all parsed line items
-- =====================================================
CREATE TABLE IF NOT EXISTS public.claim_estimate_line_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    claim_id UUID NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    document_id UUID REFERENCES public.claim_documents(id) ON DELETE SET NULL,
    
    -- Estimate metadata
    estimate_type TEXT NOT NULL CHECK (estimate_type IN ('contractor', 'carrier')),
    estimate_date DATE,
    estimator_name TEXT,
    
    -- Line item identification
    line_number INTEGER NOT NULL,
    page_number INTEGER,
    section TEXT, -- e.g., "Roofing", "Interior", "Electrical"
    category TEXT, -- e.g., "Labor", "Materials", "Equipment"
    
    -- Line item description
    description TEXT NOT NULL,
    description_normalized TEXT, -- Lowercase, trimmed, for matching
    
    -- Quantities and units
    quantity NUMERIC(10,2),
    unit TEXT, -- SF, LF, EA, SQ, HR, etc.
    
    -- Pricing
    unit_price NUMERIC(10,2),
    total NUMERIC(12,2) NOT NULL,
    
    -- Flags
    is_tax BOOLEAN DEFAULT FALSE,
    is_subtotal BOOLEAN DEFAULT FALSE,
    is_total BOOLEAN DEFAULT FALSE,
    is_overhead BOOLEAN DEFAULT FALSE,
    is_profit BOOLEAN DEFAULT FALSE,
    
    -- Parsing metadata
    raw_line_text TEXT,
    confidence_score NUMERIC(3,2), -- 0.00 to 1.00
    parsed_by TEXT DEFAULT 'regex', -- 'regex', 'ai', 'manual'
    
    -- Matching metadata
    matched_line_id UUID REFERENCES public.claim_estimate_line_items(id) ON DELETE SET NULL,
    match_confidence NUMERIC(3,2),
    match_method TEXT, -- 'exact', 'fuzzy', 'category', 'semantic', 'manual'
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique line numbers per estimate
    UNIQUE(claim_id, estimate_type, line_number)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_line_items_claim_id ON public.claim_estimate_line_items(claim_id);
CREATE INDEX IF NOT EXISTS idx_line_items_estimate_type ON public.claim_estimate_line_items(estimate_type);
CREATE INDEX IF NOT EXISTS idx_line_items_matched ON public.claim_estimate_line_items(matched_line_id);
CREATE INDEX IF NOT EXISTS idx_line_items_description_norm ON public.claim_estimate_line_items(description_normalized);
CREATE INDEX IF NOT EXISTS idx_line_items_category ON public.claim_estimate_line_items(category);
CREATE INDEX IF NOT EXISTS idx_line_items_section ON public.claim_estimate_line_items(section);

-- =====================================================
-- 2. UPDATE CLAIM_ESTIMATE_DISCREPANCIES TABLE
-- Add references to line items
-- =====================================================
ALTER TABLE public.claim_estimate_discrepancies 
ADD COLUMN IF NOT EXISTS contractor_line_id UUID REFERENCES public.claim_estimate_line_items(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS carrier_line_id UUID REFERENCES public.claim_estimate_line_items(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS match_confidence NUMERIC(3,2),
ADD COLUMN IF NOT EXISTS match_method TEXT;

-- Update existing columns to be more precise
ALTER TABLE public.claim_estimate_discrepancies 
ALTER COLUMN contractor_quantity TYPE NUMERIC(10,2),
ALTER COLUMN carrier_quantity TYPE NUMERIC(10,2),
ALTER COLUMN contractor_unit_price TYPE NUMERIC(10,2),
ALTER COLUMN carrier_unit_price TYPE NUMERIC(10,2),
ALTER COLUMN contractor_total TYPE NUMERIC(12,2),
ALTER COLUMN carrier_total TYPE NUMERIC(12,2),
ALTER COLUMN difference_amount TYPE NUMERIC(12,2);

-- Add computed columns
ALTER TABLE public.claim_estimate_discrepancies
ADD COLUMN IF NOT EXISTS quantity_delta NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS unit_price_delta NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS percentage_difference NUMERIC(5,2);

-- Create index on line item references
CREATE INDEX IF NOT EXISTS idx_discrepancies_contractor_line ON public.claim_estimate_discrepancies(contractor_line_id);
CREATE INDEX IF NOT EXISTS idx_discrepancies_carrier_line ON public.claim_estimate_discrepancies(carrier_line_id);

-- =====================================================
-- 3. CLAIM_ESTIMATE_METADATA TABLE
-- Store estimate-level information
-- =====================================================
CREATE TABLE IF NOT EXISTS public.claim_estimate_metadata (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    claim_id UUID NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    document_id UUID REFERENCES public.claim_documents(id) ON DELETE SET NULL,
    
    estimate_type TEXT NOT NULL CHECK (estimate_type IN ('contractor', 'carrier')),
    
    -- Estimate details
    estimate_number TEXT,
    estimate_date DATE,
    estimator_name TEXT,
    estimator_company TEXT,
    
    -- Totals from estimate
    subtotal NUMERIC(12,2),
    tax_amount NUMERIC(12,2),
    tax_rate NUMERIC(5,2),
    overhead_amount NUMERIC(12,2),
    profit_amount NUMERIC(12,2),
    grand_total NUMERIC(12,2),
    
    -- Parsing statistics
    total_lines_parsed INTEGER,
    lines_with_quantities INTEGER,
    lines_with_prices INTEGER,
    parse_success_rate NUMERIC(5,2),
    
    -- Processing metadata
    parsed_at TIMESTAMPTZ,
    parsing_duration_ms INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(claim_id, estimate_type)
);

CREATE INDEX IF NOT EXISTS idx_estimate_metadata_claim_id ON public.claim_estimate_metadata(claim_id);
CREATE INDEX IF NOT EXISTS idx_estimate_metadata_type ON public.claim_estimate_metadata(estimate_type);

-- =====================================================
-- 4. CLAIM_ESTIMATE_COMPARISON TABLE
-- Store comparison results
-- =====================================================
CREATE TABLE IF NOT EXISTS public.claim_estimate_comparison (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    claim_id UUID NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE UNIQUE,
    user_id UUID NOT NULL,
    
    contractor_metadata_id UUID REFERENCES public.claim_estimate_metadata(id) ON DELETE CASCADE,
    carrier_metadata_id UUID REFERENCES public.claim_estimate_metadata(id) ON DELETE CASCADE,
    
    -- Comparison statistics
    total_contractor_lines INTEGER,
    total_carrier_lines INTEGER,
    matched_lines INTEGER,
    unmatched_contractor_lines INTEGER,
    unmatched_carrier_lines INTEGER,
    
    -- Match quality
    exact_matches INTEGER,
    fuzzy_matches INTEGER,
    category_matches INTEGER,
    semantic_matches INTEGER,
    average_match_confidence NUMERIC(3,2),
    
    -- Financial totals (deterministic)
    contractor_total NUMERIC(12,2),
    carrier_total NUMERIC(12,2),
    total_discrepancies INTEGER,
    total_discrepancy_amount NUMERIC(12,2),
    underpayment_amount NUMERIC(12,2), -- SUM(difference WHERE difference > 0)
    overpayment_amount NUMERIC(12,2),  -- SUM(difference WHERE difference < 0)
    
    -- Category breakdowns
    category_breakdown JSONB,
    
    -- Processing metadata
    comparison_method TEXT DEFAULT 'deterministic',
    comparison_version TEXT DEFAULT '1.0',
    compared_at TIMESTAMPTZ DEFAULT NOW(),
    processing_duration_ms INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_estimate_comparison_claim_id ON public.claim_estimate_comparison(claim_id);

-- =====================================================
-- 5. TRIGGERS
-- =====================================================

-- Update updated_at on line items
DROP TRIGGER IF EXISTS update_line_items_updated_at ON public.claim_estimate_line_items;
CREATE TRIGGER update_line_items_updated_at
    BEFORE UPDATE ON public.claim_estimate_line_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at on metadata
DROP TRIGGER IF EXISTS update_estimate_metadata_updated_at ON public.claim_estimate_metadata;
CREATE TRIGGER update_estimate_metadata_updated_at
    BEFORE UPDATE ON public.claim_estimate_metadata
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at on comparison
DROP TRIGGER IF EXISTS update_estimate_comparison_updated_at ON public.claim_estimate_comparison;
CREATE TRIGGER update_estimate_comparison_updated_at
    BEFORE UPDATE ON public.claim_estimate_comparison
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. HELPER FUNCTIONS
-- =====================================================

-- Calculate underpayment deterministically
CREATE OR REPLACE FUNCTION calculate_underpayment(p_claim_id UUID)
RETURNS NUMERIC(12,2) AS $$
BEGIN
    RETURN (
        SELECT COALESCE(SUM(difference_amount), 0)
        FROM public.claim_estimate_discrepancies
        WHERE claim_id = p_claim_id
        AND difference_amount > 0
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Calculate overpayment deterministically
CREATE OR REPLACE FUNCTION calculate_overpayment(p_claim_id UUID)
RETURNS NUMERIC(12,2) AS $$
BEGIN
    RETURN (
        SELECT COALESCE(ABS(SUM(difference_amount)), 0)
        FROM public.claim_estimate_discrepancies
        WHERE claim_id = p_claim_id
        AND difference_amount < 0
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get unmatched contractor lines
CREATE OR REPLACE FUNCTION get_unmatched_contractor_lines(p_claim_id UUID)
RETURNS TABLE (
    id UUID,
    line_number INTEGER,
    description TEXT,
    quantity NUMERIC(10,2),
    unit TEXT,
    unit_price NUMERIC(10,2),
    total NUMERIC(12,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.id,
        l.line_number,
        l.description,
        l.quantity,
        l.unit,
        l.unit_price,
        l.total
    FROM public.claim_estimate_line_items l
    WHERE l.claim_id = p_claim_id
    AND l.estimate_type = 'contractor'
    AND l.matched_line_id IS NULL
    AND l.is_subtotal = FALSE
    AND l.is_total = FALSE
    ORDER BY l.line_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get unmatched carrier lines
CREATE OR REPLACE FUNCTION get_unmatched_carrier_lines(p_claim_id UUID)
RETURNS TABLE (
    id UUID,
    line_number INTEGER,
    description TEXT,
    quantity NUMERIC(10,2),
    unit TEXT,
    unit_price NUMERIC(10,2),
    total NUMERIC(12,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.id,
        l.line_number,
        l.description,
        l.quantity,
        l.unit,
        l.unit_price,
        l.total
    FROM public.claim_estimate_line_items l
    WHERE l.claim_id = p_claim_id
    AND l.estimate_type = 'carrier'
    AND l.matched_line_id IS NULL
    AND l.is_subtotal = FALSE
    AND l.is_total = FALSE
    ORDER BY l.line_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.claim_estimate_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_estimate_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_estimate_comparison ENABLE ROW LEVEL SECURITY;

-- Line items policies
DROP POLICY IF EXISTS "Users can view their own line items" ON public.claim_estimate_line_items;
CREATE POLICY "Users can view their own line items" ON public.claim_estimate_line_items
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own line items" ON public.claim_estimate_line_items;
CREATE POLICY "Users can insert their own line items" ON public.claim_estimate_line_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own line items" ON public.claim_estimate_line_items;
CREATE POLICY "Users can update their own line items" ON public.claim_estimate_line_items
    FOR UPDATE USING (auth.uid() = user_id);

-- Metadata policies
DROP POLICY IF EXISTS "Users can view their own estimate metadata" ON public.claim_estimate_metadata;
CREATE POLICY "Users can view their own estimate metadata" ON public.claim_estimate_metadata
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own estimate metadata" ON public.claim_estimate_metadata;
CREATE POLICY "Users can insert their own estimate metadata" ON public.claim_estimate_metadata
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own estimate metadata" ON public.claim_estimate_metadata;
CREATE POLICY "Users can update their own estimate metadata" ON public.claim_estimate_metadata
    FOR UPDATE USING (auth.uid() = user_id);

-- Comparison policies
DROP POLICY IF EXISTS "Users can view their own comparisons" ON public.claim_estimate_comparison;
CREATE POLICY "Users can view their own comparisons" ON public.claim_estimate_comparison
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own comparisons" ON public.claim_estimate_comparison;
CREATE POLICY "Users can insert their own comparisons" ON public.claim_estimate_comparison
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own comparisons" ON public.claim_estimate_comparison;
CREATE POLICY "Users can update their own comparisons" ON public.claim_estimate_comparison
    FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- 8. AI DECISION TRACE LOGGING
-- =====================================================
CREATE TABLE IF NOT EXISTS public.claim_ai_decision_traces (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    claim_id UUID NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    match_type TEXT, -- 'semantic'
    
    contractor_line INTEGER,
    contractor_description TEXT,
    carrier_line INTEGER,
    carrier_description TEXT,
    
    ai_confidence NUMERIC(3,2),
    ai_reason TEXT,
    ai_model TEXT,
    
    processing_time_ms INTEGER,
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    total_tokens INTEGER,
    
    raw_ai_response JSONB,
    
    status TEXT DEFAULT 'success', -- 'success' | 'failed'
    error TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_traces_claim_id ON public.claim_ai_decision_traces(claim_id);
CREATE INDEX IF NOT EXISTS idx_ai_traces_timestamp ON public.claim_ai_decision_traces(timestamp);

-- RLS for AI traces
ALTER TABLE public.claim_ai_decision_traces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own AI traces" ON public.claim_ai_decision_traces;
CREATE POLICY "Users can view their own AI traces" ON public.claim_ai_decision_traces
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own AI traces" ON public.claim_ai_decision_traces;
CREATE POLICY "Users can insert their own AI traces" ON public.claim_ai_decision_traces
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 9. COMMENTS
-- =====================================================

COMMENT ON TABLE public.claim_estimate_line_items IS 'Parsed line items from contractor and carrier estimates - source of truth';
COMMENT ON TABLE public.claim_estimate_metadata IS 'Estimate-level metadata and totals';
COMMENT ON TABLE public.claim_estimate_comparison IS 'Deterministic comparison results with match statistics';
COMMENT ON TABLE public.claim_ai_decision_traces IS 'Audit log of AI semantic matching decisions for legal/technical protection';

COMMENT ON COLUMN public.claim_estimate_line_items.description_normalized IS 'Normalized description for deterministic matching';
COMMENT ON COLUMN public.claim_estimate_line_items.confidence_score IS 'Parser confidence (0.00-1.00)';
COMMENT ON COLUMN public.claim_estimate_line_items.parsed_by IS 'Parser method: regex, ai, or manual';
COMMENT ON COLUMN public.claim_estimate_line_items.match_method IS 'How this line was matched: exact, fuzzy, category, semantic, manual';

-- =====================================================
-- END OF MIGRATION
-- =====================================================
