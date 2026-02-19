-- =====================================================
-- ENFORCEMENT LAYERS DATABASE SCHEMA
-- Tables for code upgrades, coverage conflicts, carrier patterns, and supplement packets
-- =====================================================

-- =====================================================
-- TABLE: claim_enforcement_reports
-- Stores comprehensive enforcement layer analysis
-- =====================================================
CREATE TABLE IF NOT EXISTS claim_enforcement_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- TOTAL RECOVERY (WITH ENFORCEMENT)
  total_projected_recovery_with_enforcement NUMERIC(12,2) NOT NULL DEFAULT 0,
  base_exposure NUMERIC(12,2) NOT NULL DEFAULT 0,
  code_upgrade_exposure NUMERIC(12,2) NOT NULL DEFAULT 0,
  coverage_adjustment_exposure NUMERIC(12,2) NOT NULL DEFAULT 0,
  
  -- CODE UPGRADES
  code_upgrade_flags JSONB DEFAULT '[]'::jsonb,
  code_upgrade_flag_count INTEGER DEFAULT 0,
  
  -- COVERAGE CONFLICTS
  coverage_conflicts JSONB DEFAULT '[]'::jsonb,
  coverage_conflict_count INTEGER DEFAULT 0,
  
  -- CARRIER PATTERNS
  carrier_pattern_flags JSONB DEFAULT '[]'::jsonb,
  carrier_pattern_count INTEGER DEFAULT 0,
  carrier_severity_score INTEGER DEFAULT 0,
  carrier_risk_level TEXT CHECK (carrier_risk_level IN ('low', 'medium', 'high', 'critical')),
  carrier_name TEXT,
  
  -- METADATA
  engine_version TEXT DEFAULT '1.0',
  calculation_method TEXT DEFAULT 'deterministic',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- CONSTRAINTS
  UNIQUE(claim_id)
);

-- Indexes
CREATE INDEX idx_enforcement_reports_claim ON claim_enforcement_reports(claim_id);
CREATE INDEX idx_enforcement_reports_user ON claim_enforcement_reports(user_id);
CREATE INDEX idx_enforcement_reports_carrier ON claim_enforcement_reports(carrier_name);
CREATE INDEX idx_enforcement_reports_risk ON claim_enforcement_reports(carrier_risk_level);

-- RLS Policies
ALTER TABLE claim_enforcement_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own enforcement reports"
  ON claim_enforcement_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own enforcement reports"
  ON claim_enforcement_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own enforcement reports"
  ON claim_enforcement_reports FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own enforcement reports"
  ON claim_enforcement_reports FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- TABLE: claim_supplement_packets
-- Stores generated supplement packets
-- =====================================================
CREATE TABLE IF NOT EXISTS claim_supplement_packets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- SUPPLEMENT DATA
  supplement_packet JSONB NOT NULL,
  total_supplement_request NUMERIC(12,2) NOT NULL DEFAULT 0,
  format TEXT DEFAULT 'json' CHECK (format IN ('json', 'html', 'pdf-ready', 'supplement-ready')),
  
  -- METADATA
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- CONSTRAINTS
  UNIQUE(claim_id)
);

-- Indexes
CREATE INDEX idx_supplement_packets_claim ON claim_supplement_packets(claim_id);
CREATE INDEX idx_supplement_packets_user ON claim_supplement_packets(user_id);
CREATE INDEX idx_supplement_packets_format ON claim_supplement_packets(format);

-- RLS Policies
ALTER TABLE claim_supplement_packets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own supplement packets"
  ON claim_supplement_packets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own supplement packets"
  ON claim_supplement_packets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own supplement packets"
  ON claim_supplement_packets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own supplement packets"
  ON claim_supplement_packets FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get enforcement report by claim_id
CREATE OR REPLACE FUNCTION get_enforcement_report(p_claim_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT to_jsonb(cer.*) INTO result
  FROM claim_enforcement_reports cer
  WHERE cer.claim_id = p_claim_id
    AND cer.user_id = auth.uid();
  
  RETURN result;
END;
$$;

-- Function to get supplement packet by claim_id
CREATE OR REPLACE FUNCTION get_supplement_packet(p_claim_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT to_jsonb(csp.*) INTO result
  FROM claim_supplement_packets csp
  WHERE csp.claim_id = p_claim_id
    AND csp.user_id = auth.uid();
  
  RETURN result;
END;
$$;

-- Function to get carrier pattern statistics
CREATE OR REPLACE FUNCTION get_carrier_pattern_stats(p_carrier_name TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'carrier_name', p_carrier_name,
    'total_claims', COUNT(*),
    'avg_severity_score', AVG(carrier_severity_score),
    'risk_level_distribution', jsonb_object_agg(carrier_risk_level, risk_count),
    'avg_pattern_count', AVG(carrier_pattern_count)
  ) INTO result
  FROM (
    SELECT 
      carrier_risk_level,
      COUNT(*) as risk_count,
      carrier_severity_score,
      carrier_pattern_count
    FROM claim_enforcement_reports
    WHERE carrier_name = p_carrier_name
      AND user_id = auth.uid()
    GROUP BY carrier_risk_level, carrier_severity_score, carrier_pattern_count
  ) stats;
  
  RETURN result;
END;
$$;

-- =====================================================
-- UPDATE TRIGGERS
-- =====================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_enforcement_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforcement_reports_updated_at
  BEFORE UPDATE ON claim_enforcement_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_enforcement_reports_updated_at();

CREATE TRIGGER supplement_packets_updated_at
  BEFORE UPDATE ON claim_supplement_packets
  FOR EACH ROW
  EXECUTE FUNCTION update_enforcement_reports_updated_at();

-- =====================================================
-- GRANTS
-- =====================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON claim_enforcement_reports TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON claim_supplement_packets TO authenticated;

GRANT EXECUTE ON FUNCTION get_enforcement_report(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_supplement_packet(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_carrier_pattern_stats(TEXT) TO authenticated;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE claim_enforcement_reports IS 'Stores enforcement layer analysis including code upgrades, coverage conflicts, and carrier patterns';
COMMENT ON TABLE claim_supplement_packets IS 'Stores generated supplement packets in various formats';

COMMENT ON COLUMN claim_enforcement_reports.total_projected_recovery_with_enforcement IS 'Total recovery including base exposure + code upgrades + coverage adjustments';
COMMENT ON COLUMN claim_enforcement_reports.code_upgrade_flags IS 'Array of code upgrade requirements detected';
COMMENT ON COLUMN claim_enforcement_reports.coverage_conflicts IS 'Array of policy coverage conflicts detected';
COMMENT ON COLUMN claim_enforcement_reports.carrier_pattern_flags IS 'Array of systemic carrier behavior patterns detected';
COMMENT ON COLUMN claim_enforcement_reports.carrier_severity_score IS 'Cumulative severity score for carrier patterns (higher = worse)';
COMMENT ON COLUMN claim_enforcement_reports.carrier_risk_level IS 'Overall risk level: low, medium, high, critical';

COMMENT ON COLUMN claim_supplement_packets.supplement_packet IS 'Complete supplement packet JSON with all sections';
COMMENT ON COLUMN claim_supplement_packets.format IS 'Output format: json, html, pdf-ready, or supplement-ready';
