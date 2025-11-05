-- ClaimNavigator Agent Logs and Reminders Schema
-- This migration creates tables for the CN Agent (AI Copilot) feature

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create agent_logs table for tracking agent activity
CREATE TABLE IF NOT EXISTS agent_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT NOT NULL,
    claim_id TEXT NOT NULL,
    action TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('success', 'error', 'pending')),
    details JSONB DEFAULT '{}',
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for agent_logs
CREATE INDEX IF NOT EXISTS idx_agent_logs_user_id ON agent_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_claim_id ON agent_logs(claim_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_action ON agent_logs(action);
CREATE INDEX IF NOT EXISTS idx_agent_logs_timestamp ON agent_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_agent_logs_status ON agent_logs(status);

-- Create claim_reminders table if it doesn't exist
CREATE TABLE IF NOT EXISTS claim_reminders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT NOT NULL,
    claim_id TEXT NOT NULL,
    message TEXT NOT NULL,
    due_date TIMESTAMPTZ,
    sent BOOLEAN DEFAULT FALSE,
    priority TEXT DEFAULT 'High' CHECK (priority IN ('Critical', 'High', 'Medium', 'Low')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for claim_reminders
CREATE INDEX IF NOT EXISTS idx_claim_reminders_user_id ON claim_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_claim_reminders_claim_id ON claim_reminders(claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_reminders_due_date ON claim_reminders(due_date);
CREATE INDEX IF NOT EXISTS idx_claim_reminders_sent ON claim_reminders(sent);
CREATE INDEX IF NOT EXISTS idx_claim_reminders_priority ON claim_reminders(priority);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for claim_reminders updated_at
DROP TRIGGER IF EXISTS update_claim_reminders_updated_at ON claim_reminders;
CREATE TRIGGER update_claim_reminders_updated_at
    BEFORE UPDATE ON claim_reminders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE agent_logs IS 'Logs all activities performed by the ClaimNavigator Agent (AI Copilot)';
COMMENT ON TABLE claim_reminders IS 'Reminders and alerts created by the ClaimNavigator Agent for users';

COMMENT ON COLUMN agent_logs.action IS 'Action performed: email_draft, email_send, create_alert, detect_deadline, detect_payment, detect_invoice';
COMMENT ON COLUMN agent_logs.status IS 'Status of the action: success, error, or pending';
COMMENT ON COLUMN agent_logs.details IS 'JSON object containing action-specific details and results';

COMMENT ON COLUMN claim_reminders.priority IS 'Priority level: Critical, High, Medium, or Low';
COMMENT ON COLUMN claim_reminders.sent IS 'Whether the reminder notification has been sent';


