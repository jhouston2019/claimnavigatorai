-- Claim Navigator Phase 4 SaaS Schema
-- Complete database schema for production SaaS platform
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. USERS PROFILE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users_profile (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own profile" ON users_profile
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users_profile
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON users_profile
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================
-- 2. DOCUMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'response_letter', 'proof_of_loss', 'demand_letter', 'appeal_letter', etc.
  title TEXT NOT NULL,
  content TEXT, -- Full document text
  metadata JSONB DEFAULT '{}', -- Additional structured data (subject, tone, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);

-- Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own documents" ON documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents" ON documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents" ON documents
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents" ON documents
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 3. EVIDENCE ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS evidence_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  category TEXT NOT NULL, -- 'estimate', 'invoice', 'photo', 'email', 'receipt', 'contract', etc.
  file_url TEXT, -- Supabase Storage URL
  file_name TEXT,
  file_size INTEGER,
  mime_type TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_evidence_user_id ON evidence_items(user_id);
CREATE INDEX IF NOT EXISTS idx_evidence_document_id ON evidence_items(document_id);
CREATE INDEX IF NOT EXISTS idx_evidence_category ON evidence_items(category);

-- Enable RLS
ALTER TABLE evidence_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own evidence" ON evidence_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own evidence" ON evidence_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own evidence" ON evidence_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own evidence" ON evidence_items
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 4. POLICY SUMMARIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS policy_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  raw_policy_url TEXT, -- Supabase Storage URL if uploaded
  summary_json JSONB NOT NULL, -- Structured summary: {coverage, limits, deductibles, exclusions, deadlines}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_policy_summaries_user_id ON policy_summaries(user_id);
CREATE INDEX IF NOT EXISTS idx_policy_summaries_created_at ON policy_summaries(created_at DESC);

-- Enable RLS
ALTER TABLE policy_summaries ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own policy summaries" ON policy_summaries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own policy summaries" ON policy_summaries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own policy summaries" ON policy_summaries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own policy summaries" ON policy_summaries
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 5. DEADLINES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS deadlines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL, -- 'Proof of Loss Due', 'Appeal Deadline', etc.
  date DATE NOT NULL,
  source TEXT, -- 'state_law', 'policy', 'carrier_letter', 'ai_suggested'
  related_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  completed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_deadlines_user_id ON deadlines(user_id);
CREATE INDEX IF NOT EXISTS idx_deadlines_date ON deadlines(date);
CREATE INDEX IF NOT EXISTS idx_deadlines_completed ON deadlines(completed);

-- Enable RLS
ALTER TABLE deadlines ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own deadlines" ON deadlines
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own deadlines" ON deadlines
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own deadlines" ON deadlines
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own deadlines" ON deadlines
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 6. PAYMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_checkout_session_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL, -- 'pending', 'completed', 'failed', 'canceled'
  plan TEXT, -- 'claim_navigator_toolkit'
  amount_paid INTEGER, -- in cents
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_session ON payments(stripe_checkout_session_id);

-- Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can insert/update (via webhook)
-- Note: Service role bypasses RLS, so webhook can insert/update

-- ============================================
-- 7. HELPER FUNCTIONS
-- ============================================

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users_profile (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_profile_updated_at
  BEFORE UPDATE ON users_profile
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_policy_summaries_updated_at
  BEFORE UPDATE ON policy_summaries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. STORAGE BUCKETS (Run in Supabase Dashboard)
-- ============================================
-- Note: Storage buckets must be created via Supabase Dashboard or API
-- Required buckets:
-- 1. 'evidence' - Public read, authenticated write
-- 2. 'documents' - Private, authenticated read/write
-- 3. 'policies' - Private, authenticated read/write

-- ============================================
-- END OF SCHEMA
-- ============================================



