-- Phase 12: AI Console Database Migration
-- Creates all tables for AI Reasoning Console with versioning and audit logging

-- 1. ai_admins - Admin users with role-based access control
CREATE TABLE IF NOT EXISTS ai_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('superadmin', 'admin', 'editor')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create indexes for ai_admins
CREATE INDEX IF NOT EXISTS idx_ai_admins_user_id ON ai_admins(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_admins_email ON ai_admins(email);
CREATE INDEX IF NOT EXISTS idx_ai_admins_role ON ai_admins(role);

-- Enable RLS
ALTER TABLE ai_admins ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_admins
CREATE POLICY "admins can view admins"
  ON ai_admins FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ai_admins WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "superadmins can insert admins"
  ON ai_admins FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ai_admins 
      WHERE user_id = auth.uid() AND role = 'superadmin'
    )
  );

CREATE POLICY "superadmins can update admins"
  ON ai_admins FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM ai_admins 
      WHERE user_id = auth.uid() AND role = 'superadmin'
    )
  );

CREATE POLICY "superadmins can delete admins"
  ON ai_admins FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM ai_admins 
      WHERE user_id = auth.uid() AND role = 'superadmin'
    )
  );

-- 2. ai_prompt_versions - Versioned system prompts
CREATE TABLE IF NOT EXISTS ai_prompt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_name TEXT NOT NULL,
  version INTEGER NOT NULL,
  prompt TEXT NOT NULL,
  updated_by UUID REFERENCES auth.users(id),
  diff TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tool_name, version)
);

-- Create indexes for ai_prompt_versions
CREATE INDEX IF NOT EXISTS idx_ai_prompt_versions_tool_name ON ai_prompt_versions(tool_name);
CREATE INDEX IF NOT EXISTS idx_ai_prompt_versions_version ON ai_prompt_versions(version);
CREATE INDEX IF NOT EXISTS idx_ai_prompt_versions_created_at ON ai_prompt_versions(created_at);

-- Enable RLS
ALTER TABLE ai_prompt_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_prompt_versions
CREATE POLICY "admins read"
  ON ai_prompt_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ai_admins WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "admins write"
  ON ai_prompt_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ai_admins WHERE user_id = auth.uid()
    )
  );

-- 3. ai_ruleset_versions - Versioned rulesets
CREATE TABLE IF NOT EXISTS ai_ruleset_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ruleset_name TEXT NOT NULL,
  version INTEGER NOT NULL,
  rules JSONB NOT NULL,
  updated_by UUID REFERENCES auth.users(id),
  diff TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ruleset_name, version)
);

-- Create indexes for ai_ruleset_versions
CREATE INDEX IF NOT EXISTS idx_ai_ruleset_versions_ruleset_name ON ai_ruleset_versions(ruleset_name);
CREATE INDEX IF NOT EXISTS idx_ai_ruleset_versions_version ON ai_ruleset_versions(version);
CREATE INDEX IF NOT EXISTS idx_ai_ruleset_versions_created_at ON ai_ruleset_versions(created_at);

-- Enable RLS
ALTER TABLE ai_ruleset_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_ruleset_versions
CREATE POLICY "admins read"
  ON ai_ruleset_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ai_admins WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "admins write"
  ON ai_ruleset_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ai_admins WHERE user_id = auth.uid()
    )
  );

-- 4. ai_example_versions - Versioned few-shot examples
CREATE TABLE IF NOT EXISTS ai_example_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_name TEXT NOT NULL,
  version INTEGER NOT NULL,
  examples JSONB NOT NULL,
  updated_by UUID REFERENCES auth.users(id),
  diff TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tool_name, version)
);

-- Create indexes for ai_example_versions
CREATE INDEX IF NOT EXISTS idx_ai_example_versions_tool_name ON ai_example_versions(tool_name);
CREATE INDEX IF NOT EXISTS idx_ai_example_versions_version ON ai_example_versions(version);
CREATE INDEX IF NOT EXISTS idx_ai_example_versions_created_at ON ai_example_versions(created_at);

-- Enable RLS
ALTER TABLE ai_example_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_example_versions
CREATE POLICY "admins read"
  ON ai_example_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ai_admins WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "admins write"
  ON ai_example_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ai_admins WHERE user_id = auth.uid()
    )
  );

-- 5. ai_output_format_versions - Versioned output format schemas
CREATE TABLE IF NOT EXISTS ai_output_format_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_name TEXT NOT NULL,
  version INTEGER NOT NULL,
  output_format JSONB NOT NULL,
  updated_by UUID REFERENCES auth.users(id),
  diff TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tool_name, version)
);

-- Create indexes for ai_output_format_versions
CREATE INDEX IF NOT EXISTS idx_ai_output_format_versions_tool_name ON ai_output_format_versions(tool_name);
CREATE INDEX IF NOT EXISTS idx_ai_output_format_versions_version ON ai_output_format_versions(version);
CREATE INDEX IF NOT EXISTS idx_ai_output_format_versions_created_at ON ai_output_format_versions(created_at);

-- Enable RLS
ALTER TABLE ai_output_format_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_output_format_versions
CREATE POLICY "admins read"
  ON ai_output_format_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ai_admins WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "admins write"
  ON ai_output_format_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ai_admins WHERE user_id = auth.uid()
    )
  );

-- 6. ai_change_log - Global audit log for all AI console changes
CREATE TABLE IF NOT EXISTS ai_change_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL,
  tool TEXT,
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  before JSONB,
  after JSONB,
  diff TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for ai_change_log
CREATE INDEX IF NOT EXISTS idx_ai_change_log_action_type ON ai_change_log(action_type);
CREATE INDEX IF NOT EXISTS idx_ai_change_log_tool ON ai_change_log(tool);
CREATE INDEX IF NOT EXISTS idx_ai_change_log_user_id ON ai_change_log(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_change_log_timestamp ON ai_change_log(timestamp);

-- Enable RLS
ALTER TABLE ai_change_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_change_log
CREATE POLICY "admins read"
  ON ai_change_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ai_admins WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "system can insert change log"
  ON ai_change_log FOR INSERT
  WITH CHECK (true);

-- Migration complete
-- All tables created with proper indexes, RLS policies, and constraints


