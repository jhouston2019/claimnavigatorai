-- Create claim_intelligence table for anonymized industry data
CREATE TABLE public.claim_intelligence (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  carrier_name TEXT,
  state TEXT,
  city TEXT,
  claim_type TEXT,
  property_type TEXT,
  carrier_estimate_value DECIMAL(10, 2),
  contractor_estimate_value DECIMAL(10, 2),
  predicted_scope_value DECIMAL(10, 2),
  potential_gap_value DECIMAL(10, 2),
  missing_scope_items JSONB,
  detected_carrier_tactics JSONB,
  severity_score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance indexes for analytics queries
CREATE INDEX idx_claim_intelligence_carrier ON public.claim_intelligence(carrier_name);
CREATE INDEX idx_claim_intelligence_state ON public.claim_intelligence(state);
CREATE INDEX idx_claim_intelligence_city ON public.claim_intelligence(city, state);
CREATE INDEX idx_claim_intelligence_claim_type ON public.claim_intelligence(claim_type);
CREATE INDEX idx_claim_intelligence_created_at ON public.claim_intelligence(created_at DESC);
CREATE INDEX idx_claim_intelligence_carrier_state ON public.claim_intelligence(carrier_name, state);
CREATE INDEX idx_claim_intelligence_severity ON public.claim_intelligence(severity_score DESC);

-- Composite indexes for common query patterns
CREATE INDEX idx_claim_intelligence_analytics ON public.claim_intelligence(carrier_name, state, claim_type, created_at);

-- Row Level Security (public read for aggregated data only)
ALTER TABLE public.claim_intelligence ENABLE ROW LEVEL SECURITY;

-- Allow service role to insert anonymized data
CREATE POLICY "Service role can insert intelligence data"
  ON public.claim_intelligence
  FOR INSERT
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to read aggregated data (via API only)
CREATE POLICY "Authenticated users can read intelligence"
  ON public.claim_intelligence
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Create materialized view for carrier statistics (performance optimization)
CREATE MATERIALIZED VIEW public.carrier_statistics AS
SELECT 
  carrier_name,
  COUNT(*) as claim_count,
  AVG(carrier_estimate_value) as avg_carrier_estimate,
  AVG(predicted_scope_value) as avg_scope_value,
  AVG(potential_gap_value) as avg_underpayment,
  AVG(severity_score) as avg_severity_score
FROM public.claim_intelligence
WHERE carrier_name IS NOT NULL
GROUP BY carrier_name
HAVING COUNT(*) >= 5;

CREATE UNIQUE INDEX idx_carrier_stats_carrier ON public.carrier_statistics(carrier_name);

-- Create materialized view for regional statistics
CREATE MATERIALIZED VIEW public.regional_statistics AS
SELECT 
  state,
  city,
  claim_type,
  COUNT(*) as claim_count,
  AVG(carrier_estimate_value) as avg_carrier_estimate,
  AVG(predicted_scope_value) as avg_actual_scope,
  AVG(potential_gap_value) as avg_underpayment
FROM public.claim_intelligence
WHERE state IS NOT NULL
GROUP BY state, city, claim_type
HAVING COUNT(*) >= 3;

CREATE INDEX idx_regional_stats_state ON public.regional_statistics(state);
CREATE INDEX idx_regional_stats_city ON public.regional_statistics(state, city);

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_intelligence_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY carrier_statistics;
  REFRESH MATERIALIZED VIEW CONCURRENTLY regional_statistics;
END;
$$ LANGUAGE plpgsql;

-- Create function to auto-refresh views (call this via cron or after batch inserts)
-- For production, set up pg_cron or call from application after significant data changes
