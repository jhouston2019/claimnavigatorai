-- Escalations table for storing negotiation scripts and escalation notices
CREATE TABLE IF NOT EXISTS escalations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('negotiation', 'escalation')),
    content JSONB NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_escalations_type ON escalations(type);
CREATE INDEX IF NOT EXISTS idx_escalations_user_id ON escalations(user_id);
CREATE INDEX IF NOT EXISTS idx_escalations_status ON escalations(status);
CREATE INDEX IF NOT EXISTS idx_escalations_created_at ON escalations(created_at);

-- Enable Row Level Security
ALTER TABLE escalations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own escalations" ON escalations
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own escalations" ON escalations
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own escalations" ON escalations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own escalations" ON escalations
    FOR DELETE USING (auth.uid() = user_id);

-- Service role can manage all escalations
CREATE POLICY "Service role can manage all escalations" ON escalations
    FOR ALL USING (auth.role() = 'service_role');

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_escalations_updated_at 
    BEFORE UPDATE ON escalations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
