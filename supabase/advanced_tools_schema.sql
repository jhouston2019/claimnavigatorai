-- Advanced Tools Supabase Schema
-- Tables for storing tool data and logs

-- Policy Analyses table
CREATE TABLE policy_analyses (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_email text NOT NULL,
  file_name text NOT NULL,
  file_size integer,
  file_type text,
  analysis_summary text,
  coverage_limits jsonb,
  exclusions jsonb,
  deadlines jsonb,
  endorsements jsonb,
  flagged_sections jsonb,
  ai_confidence decimal(3,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- State Rights table
CREATE TABLE state_rights (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_email text NOT NULL,
  state text NOT NULL,
  claim_type text NOT NULL,
  query_text text,
  response_data jsonb,
  statutory_timelines jsonb,
  unfair_claims_highlights jsonb,
  doi_complaint_process jsonb,
  created_at timestamptz DEFAULT now()
);

-- Settlement Comparisons table
CREATE TABLE settlement_comparisons (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_email text NOT NULL,
  insurer_offer decimal(12,2),
  contractor_estimate decimal(12,2),
  rom_estimate decimal(12,2),
  rom_range jsonb,
  percentage_difference decimal(5,2),
  ai_summary text,
  recommendation text,
  created_at timestamptz DEFAULT now()
);

-- Negotiations table
CREATE TABLE negotiations (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_email text NOT NULL,
  scenario_type text NOT NULL,
  context text,
  generated_script text,
  email_template text,
  phone_script text,
  ai_confidence decimal(3,2),
  created_at timestamptz DEFAULT now()
);

-- Escalations table
CREATE TABLE escalations (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_email text NOT NULL,
  escalation_type text NOT NULL,
  case_details text,
  generated_notice text,
  legal_tone boolean DEFAULT true,
  ai_confidence decimal(3,2),
  created_at timestamptz DEFAULT now()
);

-- Financial Calculations table
CREATE TABLE financial_calcs (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_email text NOT NULL,
  claim_value decimal(12,2),
  professional_fee_percent decimal(5,2),
  out_of_pocket_expenses decimal(12,2),
  projected_payout_with_professional decimal(12,2),
  projected_payout_without_professional decimal(12,2),
  net_benefit decimal(12,2),
  ai_recommendation text,
  created_at timestamptz DEFAULT now()
);

-- Claim Stage Progress table
CREATE TABLE claim_stage_progress (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_email text NOT NULL,
  claim_id text,
  current_stage text,
  stages_completed jsonb,
  ai_advice text,
  next_steps jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Evidence Organizer table
CREATE TABLE evidence_organizer (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_email text NOT NULL,
  file_name text NOT NULL,
  file_size integer,
  file_type text,
  ai_category text,
  ai_tags jsonb,
  file_path text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_policy_analyses_user_email ON policy_analyses(user_email);
CREATE INDEX idx_policy_analyses_created_at ON policy_analyses(created_at);

CREATE INDEX idx_state_rights_user_email ON state_rights(user_email);
CREATE INDEX idx_state_rights_state ON state_rights(state);
CREATE INDEX idx_state_rights_claim_type ON state_rights(claim_type);

CREATE INDEX idx_settlement_comparisons_user_email ON settlement_comparisons(user_email);
CREATE INDEX idx_settlement_comparisons_created_at ON settlement_comparisons(created_at);

CREATE INDEX idx_negotiations_user_email ON negotiations(user_email);
CREATE INDEX idx_negotiations_scenario_type ON negotiations(scenario_type);

CREATE INDEX idx_escalations_user_email ON escalations(user_email);
CREATE INDEX idx_escalations_escalation_type ON escalations(escalation_type);

CREATE INDEX idx_financial_calcs_user_email ON financial_calcs(user_email);
CREATE INDEX idx_financial_calcs_created_at ON financial_calcs(created_at);

CREATE INDEX idx_claim_stage_progress_user_email ON claim_stage_progress(user_email);
CREATE INDEX idx_claim_stage_progress_claim_id ON claim_stage_progress(claim_id);

CREATE INDEX idx_evidence_organizer_user_email ON evidence_organizer(user_email);
CREATE INDEX idx_evidence_organizer_ai_category ON evidence_organizer(ai_category);

-- Enable Row Level Security (RLS)
ALTER TABLE policy_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE state_rights ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlement_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE negotiations ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_calcs ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_stage_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_organizer ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user data access
CREATE POLICY "Users can view their own policy analyses" ON policy_analyses
  FOR SELECT USING (user_email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Users can insert their own policy analyses" ON policy_analyses
  FOR INSERT WITH CHECK (user_email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Users can view their own state rights" ON state_rights
  FOR SELECT USING (user_email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Users can insert their own state rights" ON state_rights
  FOR INSERT WITH CHECK (user_email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Users can view their own settlement comparisons" ON settlement_comparisons
  FOR SELECT USING (user_email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Users can insert their own settlement comparisons" ON settlement_comparisons
  FOR INSERT WITH CHECK (user_email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Users can view their own negotiations" ON negotiations
  FOR SELECT USING (user_email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Users can insert their own negotiations" ON negotiations
  FOR INSERT WITH CHECK (user_email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Users can view their own escalations" ON escalations
  FOR SELECT USING (user_email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Users can insert their own escalations" ON escalations
  FOR INSERT WITH CHECK (user_email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Users can view their own financial calculations" ON financial_calcs
  FOR SELECT USING (user_email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Users can insert their own financial calculations" ON financial_calcs
  FOR INSERT WITH CHECK (user_email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Users can view their own claim stage progress" ON claim_stage_progress
  FOR SELECT USING (user_email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Users can insert their own claim stage progress" ON claim_stage_progress
  FOR INSERT WITH CHECK (user_email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Users can update their own claim stage progress" ON claim_stage_progress
  FOR UPDATE USING (user_email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Users can view their own evidence" ON evidence_organizer
  FOR SELECT USING (user_email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Users can insert their own evidence" ON evidence_organizer
  FOR INSERT WITH CHECK (user_email = current_setting('request.jwt.claims', true)::json->>'email');
