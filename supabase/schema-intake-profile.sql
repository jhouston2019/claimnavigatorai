-- Intake Profile Table
-- Stores user claim intake information for auto-filling tools

CREATE TABLE IF NOT EXISTS intake_profile (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  insured_name TEXT,
  insurer_name TEXT,
  claim_number TEXT,
  policy_number TEXT,
  date_of_loss DATE,
  property_address TEXT,
  property_city TEXT,
  property_state TEXT,
  property_zip TEXT,
  carrier_contact_name TEXT,
  carrier_contact_email TEXT,
  carrier_contact_phone TEXT,
  claim_type TEXT, -- fire, water, wind, hail, etc.
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_intake_profile_user_id ON intake_profile(user_id);

-- Enable RLS
ALTER TABLE intake_profile ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own intake profile" ON intake_profile
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own intake profile" ON intake_profile
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own intake profile" ON intake_profile
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own intake profile" ON intake_profile
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_intake_profile_updated_at
  BEFORE UPDATE ON intake_profile
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();



