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

## Notes

- All tables use UUID primary keys
- Timestamps are automatically managed
- RLS policies ensure users can only access their own data
- Carrier profiles and regulatory updates are publicly readable (no sensitive user data)
- JSONB fields allow flexible storage of structured data
- Indexes improve query performance

