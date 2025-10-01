-- Document Access Log table for audit tracking
CREATE TABLE IF NOT EXISTS document_access_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id TEXT NOT NULL,
    user_id UUID NOT NULL,
    insured_name TEXT NOT NULL,
    policy_number TEXT NOT NULL,
    access_type TEXT NOT NULL CHECK (access_type IN ('download', 'view', 'generate')),
    accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_document_access_log_document_id ON document_access_log(document_id);
CREATE INDEX IF NOT EXISTS idx_document_access_log_user_id ON document_access_log(user_id);
CREATE INDEX IF NOT EXISTS idx_document_access_log_accessed_at ON document_access_log(accessed_at);
CREATE INDEX IF NOT EXISTS idx_document_access_log_policy_number ON document_access_log(policy_number);

-- Enable RLS (Row Level Security)
ALTER TABLE document_access_log ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view their own document access logs
CREATE POLICY "Users can view their own document access logs" ON document_access_log
    FOR SELECT USING (auth.uid() = user_id);

-- Policy to allow system to insert document access logs
CREATE POLICY "System can insert document access logs" ON document_access_log
    FOR INSERT WITH CHECK (true);

-- Policy to allow admin access (adjust based on your admin setup)
-- CREATE POLICY "Allow admin to view all document access logs" ON document_access_log
--     FOR ALL USING (auth.role() = 'admin');
