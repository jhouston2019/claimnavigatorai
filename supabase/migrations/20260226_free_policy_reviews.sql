-- =====================================================
-- FREE POLICY REVIEWS TRACKING
-- Track usage for 1-per-email limit on landing page
-- =====================================================

CREATE TABLE IF NOT EXISTS public.free_policy_reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT NOT NULL,
    client_ip TEXT,
    policy_type TEXT,
    jurisdiction TEXT,
    analysis_result JSONB,
    duration_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on email for fast lookups (1-per-email check)
CREATE INDEX IF NOT EXISTS idx_free_policy_reviews_email ON public.free_policy_reviews(email);

-- Create index on client_ip + created_at for rate limiting
CREATE INDEX IF NOT EXISTS idx_free_policy_reviews_ip_time ON public.free_policy_reviews(client_ip, created_at);

-- Create index on created_at for analytics
CREATE INDEX IF NOT EXISTS idx_free_policy_reviews_created_at ON public.free_policy_reviews(created_at);

-- Add comment
COMMENT ON TABLE public.free_policy_reviews IS 'Tracks free policy review usage for landing page lead magnet (1 per email limit)';
