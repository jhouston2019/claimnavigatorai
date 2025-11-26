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

### 21. contractor_estimate_interpretations

Stores interpretations of contractor estimates with line item analysis, missing scope detection, and ROM comparisons.

```sql
CREATE TABLE IF NOT EXISTS contractor_estimate_interpretations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  claim_id TEXT,
  estimate_total NUMERIC,
  rom_low NUMERIC,
  rom_high NUMERIC,
  rom_relation TEXT,
  loss_type TEXT,
  severity TEXT,
  areas TEXT[],
  line_items JSONB DEFAULT '[]'::jsonb,
  missing_scope JSONB DEFAULT '[]'::jsonb,
  recommendations JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_contractor_estimate_user_id ON contractor_estimate_interpretations(user_id);
CREATE INDEX IF NOT EXISTS idx_contractor_estimate_claim_id ON contractor_estimate_interpretations(claim_id);
CREATE INDEX IF NOT EXISTS idx_contractor_estimate_created ON contractor_estimate_interpretations(created_at);

-- RLS Policies
ALTER TABLE contractor_estimate_interpretations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own estimate interpretations"
  ON contractor_estimate_interpretations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own estimate interpretations"
  ON contractor_estimate_interpretations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own estimate interpretations"
  ON contractor_estimate_interpretations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own estimate interpretations"
  ON contractor_estimate_interpretations FOR DELETE
  USING (auth.uid() = user_id);
```

### 22. claim_checklist_tasks

Stores checklist tasks (both auto-generated and user-created) for claim management.

```sql
CREATE TABLE IF NOT EXISTS claim_checklist_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  claim_id TEXT NOT NULL,
  task_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  severity TEXT CHECK (severity IN ('critical', 'recommended', 'optional')),
  category TEXT,
  related_tool TEXT,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_claim_checklist_tasks_user_id ON claim_checklist_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_claim_checklist_tasks_claim_id ON claim_checklist_tasks(claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_checklist_tasks_task_id ON claim_checklist_tasks(task_id);
CREATE INDEX IF NOT EXISTS idx_claim_checklist_tasks_due_date ON claim_checklist_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_claim_checklist_tasks_completed ON claim_checklist_tasks(completed);

-- RLS Policies
ALTER TABLE claim_checklist_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own checklist tasks"
  ON claim_checklist_tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own checklist tasks"
  ON claim_checklist_tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own checklist tasks"
  ON claim_checklist_tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own checklist tasks"
  ON claim_checklist_tasks FOR DELETE
  USING (auth.uid() = user_id);
```

### 23. api_keys

Stores API keys for programmatic access.

```sql
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  permissions JSONB DEFAULT '{}'::jsonb,
  rate_limit INTEGER DEFAULT 100,
  active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys(key);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(active);

-- RLS Policies
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own API keys"
  ON api_keys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own API keys"
  ON api_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API keys"
  ON api_keys FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API keys"
  ON api_keys FOR DELETE
  USING (auth.uid() = user_id);
```

### 24. api_logs

Stores API request logs for monitoring and rate limiting.

```sql
CREATE TABLE IF NOT EXISTS api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  request_body JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_api_logs_user_id ON api_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_endpoint ON api_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_logs_created_at ON api_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_api_logs_user_endpoint_created ON api_logs(user_id, endpoint, created_at);

-- RLS Policies
ALTER TABLE api_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own API logs"
  ON api_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert API logs"
  ON api_logs FOR INSERT
  WITH CHECK (true);
```

### 25. api_rate_limits

Stores rate limit tracking for API keys and IP addresses.

```sql
CREATE TABLE IF NOT EXISTS api_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key TEXT,
  ip_address TEXT,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL,
  request_count INTEGER DEFAULT 0,
  blocked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_api_key ON api_rate_limits(api_key);
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_ip_address ON api_rate_limits(ip_address);
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_window_start ON api_rate_limits(window_start);
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_blocked_until ON api_rate_limits(blocked_until);

-- RLS Policies
ALTER TABLE api_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can manage rate limits"
  ON api_rate_limits FOR ALL
  USING (true)
  WITH CHECK (true);
```

### 26. api_event_logs

Stores detailed event logs for observability and monitoring.

```sql
CREATE TABLE IF NOT EXISTS api_event_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key TEXT,
  event_type TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  status TEXT NOT NULL,
  error_code TEXT,
  latency_ms INTEGER,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_api_event_logs_api_key ON api_event_logs(api_key);
CREATE INDEX IF NOT EXISTS idx_api_event_logs_endpoint ON api_event_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_event_logs_event_type ON api_event_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_api_event_logs_status ON api_event_logs(status);
CREATE INDEX IF NOT EXISTS idx_api_event_logs_created_at ON api_event_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_api_event_logs_api_key_created ON api_event_logs(api_key, created_at);

-- RLS Policies
ALTER TABLE api_event_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own event logs"
  ON api_event_logs FOR SELECT
  USING (
    api_key IN (
      SELECT key FROM api_keys WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert event logs"
  ON api_event_logs FOR INSERT
  WITH CHECK (true);
```

### 27. ai_admins

Stores admin users with role-based access control for AI console.

```sql
CREATE TABLE IF NOT EXISTS ai_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('superadmin', 'admin', 'editor')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ai_admins_user_id ON ai_admins(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_admins_email ON ai_admins(email);
CREATE INDEX IF NOT EXISTS idx_ai_admins_role ON ai_admins(role);

-- RLS Policies
ALTER TABLE ai_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all admins"
  ON ai_admins FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ai_admins WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Superadmins can manage admins"
  ON ai_admins FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM ai_admins 
      WHERE user_id = auth.uid() AND role = 'superadmin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ai_admins 
      WHERE user_id = auth.uid() AND role = 'superadmin'
    )
  );
```

### 28. ai_prompt_versions

Stores versioned prompts for AI tools.

```sql
CREATE TABLE IF NOT EXISTS ai_prompt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_name TEXT NOT NULL,
  version INTEGER NOT NULL,
  prompt TEXT NOT NULL,
  updated_by UUID REFERENCES auth.users(id),
  diff TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tool_name, version)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ai_prompt_versions_tool_name ON ai_prompt_versions(tool_name);
CREATE INDEX IF NOT EXISTS idx_ai_prompt_versions_version ON ai_prompt_versions(version);
CREATE INDEX IF NOT EXISTS idx_ai_prompt_versions_created_at ON ai_prompt_versions(created_at);

-- RLS Policies
ALTER TABLE ai_prompt_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage prompt versions"
  ON ai_prompt_versions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM ai_admins WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ai_admins WHERE user_id = auth.uid()
    )
  );
```

### 29. ai_ruleset_versions

Stores versioned rulesets for AI tools.

```sql
CREATE TABLE IF NOT EXISTS ai_ruleset_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ruleset_name TEXT NOT NULL,
  version INTEGER NOT NULL,
  rules JSONB NOT NULL,
  updated_by UUID REFERENCES auth.users(id),
  diff TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(ruleset_name, version)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ai_ruleset_versions_ruleset_name ON ai_ruleset_versions(ruleset_name);
CREATE INDEX IF NOT EXISTS idx_ai_ruleset_versions_version ON ai_ruleset_versions(version);
CREATE INDEX IF NOT EXISTS idx_ai_ruleset_versions_created_at ON ai_ruleset_versions(created_at);

-- RLS Policies
ALTER TABLE ai_ruleset_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage ruleset versions"
  ON ai_ruleset_versions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM ai_admins WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ai_admins WHERE user_id = auth.uid()
    )
  );
```

### 30. ai_example_versions

Stores versioned few-shot examples for AI tools.

```sql
CREATE TABLE IF NOT EXISTS ai_example_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_name TEXT NOT NULL,
  version INTEGER NOT NULL,
  examples JSONB NOT NULL,
  updated_by UUID REFERENCES auth.users(id),
  diff TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tool_name, version)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ai_example_versions_tool_name ON ai_example_versions(tool_name);
CREATE INDEX IF NOT EXISTS idx_ai_example_versions_version ON ai_example_versions(version);
CREATE INDEX IF NOT EXISTS idx_ai_example_versions_created_at ON ai_example_versions(created_at);

-- RLS Policies
ALTER TABLE ai_example_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage example versions"
  ON ai_example_versions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM ai_admins WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ai_admins WHERE user_id = auth.uid()
    )
  );
```

### 31. ai_output_format_versions

Stores versioned output format schemas for AI tools.

```sql
CREATE TABLE IF NOT EXISTS ai_output_format_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_name TEXT NOT NULL,
  version INTEGER NOT NULL,
  output_format JSONB NOT NULL,
  updated_by UUID REFERENCES auth.users(id),
  diff TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tool_name, version)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ai_output_format_versions_tool_name ON ai_output_format_versions(tool_name);
CREATE INDEX IF NOT EXISTS idx_ai_output_format_versions_version ON ai_output_format_versions(version);
CREATE INDEX IF NOT EXISTS idx_ai_output_format_versions_created_at ON ai_output_format_versions(created_at);

-- RLS Policies
ALTER TABLE ai_output_format_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage output format versions"
  ON ai_output_format_versions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM ai_admins WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ai_admins WHERE user_id = auth.uid()
    )
  );
```

### 32. ai_change_log

Global audit log for all AI console changes.

```sql
CREATE TABLE IF NOT EXISTS ai_change_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL,
  tool TEXT,
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  before JSONB,
  after JSONB,
  diff TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ai_change_log_action_type ON ai_change_log(action_type);
CREATE INDEX IF NOT EXISTS idx_ai_change_log_tool ON ai_change_log(tool);
CREATE INDEX IF NOT EXISTS idx_ai_change_log_user_id ON ai_change_log(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_change_log_timestamp ON ai_change_log(timestamp);

-- RLS Policies
ALTER TABLE ai_change_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view change log"
  ON ai_change_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ai_admins WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert change log"
  ON ai_change_log FOR INSERT
  WITH CHECK (true);
```

## Notes

- All tables use UUID primary keys
- Timestamps are automatically managed
- RLS policies ensure users can only access their own data
- Carrier profiles, regulatory updates, expert witnesses, settlement history, communication templates, and AI configs/rules/examples are publicly readable (no sensitive user data)
- JSONB fields allow flexible storage of structured data
- Indexes improve query performance
- Compliance Engine audits allow NULL user_id for anonymous usage tracking
- Admin tables (27-32) require admin role for access
- Version tables support up to 30 versions per tool (enforced in application logic)

### 33. system_errors

Stores system errors for monitoring and debugging.

```sql
CREATE TABLE IF NOT EXISTS system_errors (
  id BIGSERIAL PRIMARY KEY,
  tool_name TEXT,
  error_code TEXT,
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  context JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_system_errors_tool_name ON system_errors(tool_name);
CREATE INDEX IF NOT EXISTS idx_system_errors_error_code ON system_errors(error_code);
CREATE INDEX IF NOT EXISTS idx_system_errors_created_at ON system_errors(created_at);

-- RLS Policies
ALTER TABLE system_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view system errors"
  ON system_errors FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ai_admins WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert errors"
  ON system_errors FOR INSERT
  WITH CHECK (true);
```

### 34. system_events

Stores system events for monitoring and analytics.

```sql
CREATE TABLE IF NOT EXISTS system_events (
  id BIGSERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  source TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_system_events_event_type ON system_events(event_type);
CREATE INDEX IF NOT EXISTS idx_system_events_source ON system_events(source);
CREATE INDEX IF NOT EXISTS idx_system_events_created_at ON system_events(created_at);

-- RLS Policies
ALTER TABLE system_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view system events"
  ON system_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ai_admins WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert events"
  ON system_events FOR INSERT
  WITH CHECK (true);
```

### 35. api_usage_logs

Stores detailed API usage logs with token tracking.

```sql
CREATE TABLE IF NOT EXISTS api_usage_logs (
  id BIGSERIAL PRIMARY KEY,
  api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
  endpoint TEXT NOT NULL,
  status INTEGER NOT NULL,
  latency_ms INTEGER,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_api_key_id ON api_usage_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_endpoint ON api_usage_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_status ON api_usage_logs(status);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_created_at ON api_usage_logs(created_at);

-- RLS Policies
ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage logs"
  ON api_usage_logs FOR SELECT
  USING (
    api_key_id IN (
      SELECT id FROM api_keys WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all usage logs"
  ON api_usage_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ai_admins WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert usage logs"
  ON api_usage_logs FOR INSERT
  WITH CHECK (true);
```

### 36. ai_cost_tracking

Tracks AI token usage and costs per tool.

```sql
CREATE TABLE IF NOT EXISTS ai_cost_tracking (
  id BIGSERIAL PRIMARY KEY,
  tool_name TEXT NOT NULL,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  cost NUMERIC(10, 6) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ai_cost_tracking_tool_name ON ai_cost_tracking(tool_name);
CREATE INDEX IF NOT EXISTS idx_ai_cost_tracking_created_at ON ai_cost_tracking(created_at);

-- RLS Policies
ALTER TABLE ai_cost_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view cost tracking"
  ON ai_cost_tracking FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ai_admins WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert cost tracking"
  ON ai_cost_tracking FOR INSERT
  WITH CHECK (true);
```

### 37. rate_limit_logs

Logs rate limit status for monitoring.

```sql
CREATE TABLE IF NOT EXISTS rate_limit_logs (
  id BIGSERIAL PRIMARY KEY,
  api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
  remaining INTEGER NOT NULL,
  limit_value INTEGER NOT NULL,
  reset_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_api_key_id ON rate_limit_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_created_at ON rate_limit_logs(created_at);

-- RLS Policies
ALTER TABLE rate_limit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rate limit logs"
  ON rate_limit_logs FOR SELECT
  USING (
    api_key_id IN (
      SELECT id FROM api_keys WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all rate limit logs"
  ON rate_limit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ai_admins WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert rate limit logs"
  ON rate_limit_logs FOR INSERT
  WITH CHECK (true);
```

## Notes

- All tables use UUID primary keys
- Timestamps are automatically managed
- RLS policies ensure users can only access their own data
- Carrier profiles, regulatory updates, expert witnesses, settlement history, communication templates, and AI configs/rules/examples are publicly readable (no sensitive user data)
- JSONB fields allow flexible storage of structured data
- Indexes improve query performance
- Compliance Engine audits allow NULL user_id for anonymous usage tracking
- Admin tables (27-32) require admin role for access
- Version tables support up to 30 versions per tool (enforced in application logic)
- Monitoring tables (33-37) require admin role for viewing, system can insert

