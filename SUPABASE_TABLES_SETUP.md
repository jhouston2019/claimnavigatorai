# Supabase Tables Setup Instructions

This document provides SQL instructions for creating the required Supabase tables for the Advanced Tools Suite.

## Required Tables

### 1. carrier_profiles

Stores insurance company profiles with claim handling practices and tactics.

```sql
CREATE TABLE IF NOT EXISTS carrier_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carrier_name TEXT NOT NULL,
  state TEXT,
  am_best_rating TEXT,
  known_tactics JSONB DEFAULT '[]'::jsonb,
  avg_response_time INTEGER,
  bad_faith_history JSONB DEFAULT '[]'::jsonb,
  state_restrictions JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for search
CREATE INDEX IF NOT EXISTS idx_carrier_profiles_name ON carrier_profiles(carrier_name);
CREATE INDEX IF NOT EXISTS idx_carrier_profiles_state ON carrier_profiles(state);
```

### 2. badfaith_events

Stores bad faith evidence events tracked by users.

```sql
CREATE TABLE IF NOT EXISTS badfaith_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  event TEXT NOT NULL,
  category TEXT NOT NULL,
  severity TEXT,
  file_url TEXT,
  ai_notes TEXT,
  score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_badfaith_events_user ON badfaith_events(user_id);
CREATE INDEX IF NOT EXISTS idx_badfaith_events_date ON badfaith_events(date);
CREATE INDEX IF NOT EXISTS idx_badfaith_events_category ON badfaith_events(category);
```

### 3. policy_comparisons

Stores policy comparison results.

```sql
CREATE TABLE IF NOT EXISTS policy_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  policy_a_url TEXT,
  policy_b_url TEXT,
  comparison_result JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_policy_comparisons_user ON policy_comparisons(user_id);
```

### 4. settlement_calculations

Stores settlement calculation history for users.

```sql
CREATE TABLE IF NOT EXISTS settlement_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  inputs JSONB NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_settlement_calculations_user ON settlement_calculations(user_id);
CREATE INDEX IF NOT EXISTS idx_settlement_calculations_created ON settlement_calculations(created_at);
```

## Row Level Security (RLS) Policies

Enable RLS and create policies for user data access:

```sql
-- Enable RLS
ALTER TABLE badfaith_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlement_calculations ENABLE ROW LEVEL SECURITY;

-- Bad faith events: users can only see their own events
CREATE POLICY "Users can view own bad faith events"
  ON badfaith_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bad faith events"
  ON badfaith_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bad faith events"
  ON badfaith_events FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy comparisons: users can only see their own comparisons
CREATE POLICY "Users can view own policy comparisons"
  ON policy_comparisons FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own policy comparisons"
  ON policy_comparisons FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Settlement calculations: users can only see their own calculations
CREATE POLICY "Users can view own settlement calculations"
  ON settlement_calculations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settlement calculations"
  ON settlement_calculations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Carrier profiles: public read access (no user-specific data)
ALTER TABLE carrier_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view carrier profiles"
  ON carrier_profiles FOR SELECT
  USING (true);
```

## Storage Bucket (Optional)

If you want to store uploaded files for bad faith evidence:

```sql
-- Create storage bucket (run in Supabase dashboard SQL editor)
INSERT INTO storage.buckets (id, name, public)
VALUES ('badfaith_evidence', 'badfaith_evidence', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: users can upload their own files
CREATE POLICY "Users can upload own evidence"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'badfaith_evidence' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own evidence"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'badfaith_evidence' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

## Verification

After running these SQL commands, verify the tables exist:

```sql
-- Check tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('carrier_profiles', 'badfaith_events', 'policy_comparisons', 'settlement_calculations');

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('carrier_profiles', 'badfaith_events', 'policy_comparisons', 'settlement_calculations');
```

### 5. regulatory_updates

Stores regulatory updates by state and category (Wave 2).

```sql
CREATE TABLE IF NOT EXISTS regulatory_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state TEXT NOT NULL,
  category TEXT,
  title TEXT NOT NULL,
  summary TEXT,
  full_text TEXT,
  ai_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_regulatory_updates_state ON regulatory_updates(state);
CREATE INDEX IF NOT EXISTS idx_regulatory_updates_category ON regulatory_updates(category);
CREATE INDEX IF NOT EXISTS idx_regulatory_updates_created ON regulatory_updates(created_at);
```

### 6. appeal_packages

Stores appeal packages generated by users (Wave 2).

```sql
CREATE TABLE IF NOT EXISTS appeal_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  denial_text TEXT,
  appeal_json JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_appeal_packages_user ON appeal_packages(user_id);
CREATE INDEX IF NOT EXISTS idx_appeal_packages_created ON appeal_packages(created_at);
```

## Additional RLS Policies (Wave 2)

```sql
-- Enable RLS for new tables
ALTER TABLE regulatory_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE appeal_packages ENABLE ROW LEVEL SECURITY;

-- Regulatory updates: public read access
CREATE POLICY "Anyone can view regulatory updates"
  ON regulatory_updates FOR SELECT
  USING (true);

-- Appeal packages: users can only see their own
CREATE POLICY "Users can view own appeal packages"
  ON appeal_packages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own appeal packages"
  ON appeal_packages FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### 7. expert_witnesses

Stores expert witness profiles (Wave 3).

```sql
CREATE TABLE IF NOT EXISTS expert_witnesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  license_number TEXT,
  state TEXT,
  experience_years INTEGER,
  summary TEXT,
  contact_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_expert_witnesses_specialty ON expert_witnesses(specialty);
CREATE INDEX IF NOT EXISTS idx_expert_witnesses_state ON expert_witnesses(state);
CREATE INDEX IF NOT EXISTS idx_expert_witnesses_name ON expert_witnesses(name);
```

### 8. settlement_history

Stores historical settlement data (Wave 3).

```sql
CREATE TABLE IF NOT EXISTS settlement_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carrier TEXT,
  claim_type TEXT,
  state TEXT,
  initial_offer NUMERIC,
  final_payout NUMERIC,
  timeline_days INTEGER,
  dispute_method TEXT,
  data_source TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_settlement_history_carrier ON settlement_history(carrier);
CREATE INDEX IF NOT EXISTS idx_settlement_history_state ON settlement_history(state);
CREATE INDEX IF NOT EXISTS idx_settlement_history_claim_type ON settlement_history(claim_type);
```

### 9. communication_templates_index

Stores communication templates (Wave 3).

```sql
CREATE TABLE IF NOT EXISTS communication_templates_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL,
  category TEXT,
  template_content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_communication_templates_category ON communication_templates_index(category);
CREATE INDEX IF NOT EXISTS idx_communication_templates_name ON communication_templates_index(template_name);
```

### 10. expert_opinions

Stores expert opinions generated by users (Wave 3).

```sql
CREATE TABLE IF NOT EXISTS expert_opinions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  input_data JSONB,
  opinion_output JSONB,
  file_urls JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_expert_opinions_user ON expert_opinions(user_id);
CREATE INDEX IF NOT EXISTS idx_expert_opinions_created ON expert_opinions(created_at);
```

### 11. deadline_tracker_pro

Stores deadline tracking data for users (Wave 3).

```sql
CREATE TABLE IF NOT EXISTS deadline_tracker_pro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  carrier TEXT,
  state TEXT,
  events JSONB,
  analysis JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_deadline_tracker_pro_user ON deadline_tracker_pro(user_id);
CREATE INDEX IF NOT EXISTS idx_deadline_tracker_pro_state ON deadline_tracker_pro(state);
```

### 12. evidence_packages

Stores evidence packages for mediation/arbitration (Wave 3).

```sql
CREATE TABLE IF NOT EXISTS evidence_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dispute_type TEXT,
  files JSONB,
  tags JSONB,
  evidence_output JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_evidence_packages_user ON evidence_packages(user_id);
CREATE INDEX IF NOT EXISTS idx_evidence_packages_dispute_type ON evidence_packages(dispute_type);
```

## Additional RLS Policies (Wave 3)

```sql
-- Enable RLS for new tables
ALTER TABLE expert_witnesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlement_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_templates_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_opinions ENABLE ROW LEVEL SECURITY;
ALTER TABLE deadline_tracker_pro ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_packages ENABLE ROW LEVEL SECURITY;

-- Expert witnesses: public read access
CREATE POLICY "Anyone can view expert witnesses"
  ON expert_witnesses FOR SELECT
  USING (true);

-- Settlement history: public read access (anonymized data)
CREATE POLICY "Anyone can view settlement history"
  ON settlement_history FOR SELECT
  USING (true);

-- Communication templates: public read access
CREATE POLICY "Anyone can view communication templates"
  ON communication_templates_index FOR SELECT
  USING (true);

-- Expert opinions: users can only see their own
CREATE POLICY "Users can view own expert opinions"
  ON expert_opinions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expert opinions"
  ON expert_opinions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Deadline tracker: users can only see their own
CREATE POLICY "Users can view own deadline tracker data"
  ON deadline_tracker_pro FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own deadline tracker data"
  ON deadline_tracker_pro FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own deadline tracker data"
  ON deadline_tracker_pro FOR UPDATE
  USING (auth.uid() = user_id);

-- Evidence packages: users can only see their own
CREATE POLICY "Users can view own evidence packages"
  ON evidence_packages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own evidence packages"
  ON evidence_packages FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### 13. ai_tool_configs

Stores AI configuration for advanced tools (AI Training Dataset System).

```sql
CREATE TABLE IF NOT EXISTS ai_tool_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_slug TEXT NOT NULL UNIQUE,
  config_json JSONB NOT NULL,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_ai_tool_configs_slug ON ai_tool_configs(tool_slug);
```

### 14. ai_rulesets

Stores AI rulesets for high-risk domains (AI Training Dataset System).

```sql
CREATE TABLE IF NOT EXISTS ai_rulesets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ruleset_name TEXT NOT NULL UNIQUE,
  ruleset_json JSONB NOT NULL,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_ai_rulesets_name ON ai_rulesets(ruleset_name);
```

### 15. ai_examples

Stores example prompts and responses for AI training (AI Training Dataset System).

```sql
CREATE TABLE IF NOT EXISTS ai_examples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_slug TEXT NOT NULL,
  example_type TEXT NOT NULL,
  input_example JSONB,
  output_example JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ai_examples_tool_slug ON ai_examples(tool_slug);
CREATE INDEX IF NOT EXISTS idx_ai_examples_type ON ai_examples(example_type);
```

## Additional RLS Policies (AI Training Dataset System)

```sql
-- Enable RLS for new tables
ALTER TABLE ai_tool_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_rulesets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_examples ENABLE ROW LEVEL SECURITY;

-- AI configs: public read access (no sensitive user data)
CREATE POLICY "Anyone can view AI tool configs"
  ON ai_tool_configs FOR SELECT
  USING (true);

-- AI rulesets: public read access (no sensitive user data)
CREATE POLICY "Anyone can view AI rulesets"
  ON ai_rulesets FOR SELECT
  USING (true);

-- AI examples: public read access (no sensitive user data)
CREATE POLICY "Anyone can view AI examples"
  ON ai_examples FOR SELECT
  USING (true);
```

### 16. compliance_engine_audits

Stores audit logs for Compliance Engine analyses.

```sql
CREATE TABLE IF NOT EXISTS compliance_engine_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  claim_reference TEXT,
  state TEXT NOT NULL,
  carrier TEXT NOT NULL,
  claim_type TEXT NOT NULL,
  input_summary TEXT,
  result_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_compliance_engine_audits_user ON compliance_engine_audits(user_id);
CREATE INDEX IF NOT EXISTS idx_compliance_engine_audits_state ON compliance_engine_audits(state);
CREATE INDEX IF NOT EXISTS idx_compliance_engine_audits_carrier ON compliance_engine_audits(carrier);
CREATE INDEX IF NOT EXISTS idx_compliance_engine_audits_created ON compliance_engine_audits(created_at);
```

### 17. compliance_alerts

Stores compliance alerts generated by the Auto-Alerts System.

```sql
CREATE TABLE IF NOT EXISTS compliance_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  claim_id UUID,
  session_id TEXT,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('high', 'medium', 'low')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  recommended_action TEXT,
  state_rule TEXT,
  category TEXT,
  related_timeline_event TEXT,
  alert_data JSONB,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_compliance_alerts_user ON compliance_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_compliance_alerts_claim ON compliance_alerts(claim_id);
CREATE INDEX IF NOT EXISTS idx_compliance_alerts_resolved ON compliance_alerts(resolved_at);
CREATE INDEX IF NOT EXISTS idx_compliance_alerts_severity ON compliance_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_compliance_alerts_created ON compliance_alerts(created_at DESC);
```

## Additional RLS Policies (Compliance Alerts)

```sql
-- Enable RLS for compliance_alerts
ALTER TABLE compliance_alerts ENABLE ROW LEVEL SECURITY;

-- Users can view their own alerts
CREATE POLICY "Users can view own compliance alerts"
  ON compliance_alerts FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own alerts
CREATE POLICY "Users can insert own compliance alerts"
  ON compliance_alerts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own alerts
CREATE POLICY "Users can update own compliance alerts"
  ON compliance_alerts FOR UPDATE
  USING (auth.uid() = user_id);
```

### 18. compliance_health_snapshots

Stores historical compliance health score snapshots.

```sql
CREATE TABLE IF NOT EXISTS compliance_health_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  claim_id TEXT,
  state TEXT NOT NULL,
  carrier TEXT NOT NULL,
  claim_type TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  status TEXT NOT NULL CHECK (status IN ('good', 'watch', 'elevated-risk', 'critical')),
  factors JSONB DEFAULT '[]'::jsonb,
  recommendations JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_compliance_health_snapshots_user ON compliance_health_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_compliance_health_snapshots_claim ON compliance_health_snapshots(claim_id);
CREATE INDEX IF NOT EXISTS idx_compliance_health_snapshots_created ON compliance_health_snapshots(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_compliance_health_snapshots_status ON compliance_health_snapshots(status);
```

## Additional RLS Policies (Compliance Health Snapshots)

```sql
-- Enable RLS for compliance_health_snapshots
ALTER TABLE compliance_health_snapshots ENABLE ROW LEVEL SECURITY;

-- Users can view their own health snapshots
CREATE POLICY "Users can view own health snapshots"
  ON compliance_health_snapshots FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own health snapshots
CREATE POLICY "Users can insert own health snapshots"
  ON compliance_health_snapshots FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

Stores audit logs for Compliance Engine analyses.

```sql
CREATE TABLE IF NOT EXISTS compliance_engine_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  claim_reference TEXT,
  state TEXT NOT NULL,
  carrier TEXT NOT NULL,
  claim_type TEXT NOT NULL,
  input_summary TEXT,
  result_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_compliance_engine_audits_user ON compliance_engine_audits(user_id);
CREATE INDEX IF NOT EXISTS idx_compliance_engine_audits_state ON compliance_engine_audits(state);
CREATE INDEX IF NOT EXISTS idx_compliance_engine_audits_carrier ON compliance_engine_audits(carrier);
CREATE INDEX IF NOT EXISTS idx_compliance_engine_audits_created ON compliance_engine_audits(created_at);
```

## Additional RLS Policies (Compliance Engine)

```sql
-- Enable RLS for compliance_engine_audits
ALTER TABLE compliance_engine_audits ENABLE ROW LEVEL SECURITY;

-- Users can view their own audit logs
CREATE POLICY "Users can view own compliance audits"
  ON compliance_engine_audits FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Users can insert their own audit logs
CREATE POLICY "Users can insert own compliance audits"
  ON compliance_engine_audits FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
```

### 20. claim_timeline

Stores auto-synced timeline events from various sources (FNOL, Compliance, Evidence, Journal, Advanced Tools).

```sql
CREATE TABLE IF NOT EXISTS claim_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  claim_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_date DATE NOT NULL,
  source TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_claim_timeline_claim_id ON claim_timeline(claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_timeline_event_date ON claim_timeline(event_date);
CREATE INDEX IF NOT EXISTS idx_claim_timeline_source ON claim_timeline(source);
CREATE INDEX IF NOT EXISTS idx_claim_timeline_event_type ON claim_timeline(event_type);
CREATE INDEX IF NOT EXISTS idx_claim_timeline_user_id ON claim_timeline(user_id);

-- RLS Policies
ALTER TABLE claim_timeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own timeline events"
  ON claim_timeline FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own timeline events"
  ON claim_timeline FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own timeline events"
  ON claim_timeline FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own timeline events"
  ON claim_timeline FOR DELETE
  USING (auth.uid() = user_id);
```

## Notes

- All tables use UUID primary keys
- Timestamps are automatically managed
- RLS policies ensure users can only access their own data
- Carrier profiles, regulatory updates, expert witnesses, settlement history, communication templates, and AI configs/rules/examples are publicly readable (no sensitive user data)
- JSONB fields allow flexible storage of structured data
- Indexes improve query performance
- Compliance Engine audits allow NULL user_id for anonymous usage tracking

