-- Complete Appeal Builder Database Setup
-- Run this SQL in your Supabase SQL Editor to set up the entire Appeal Builder system

-- 1. Add appeals column to entitlements table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'entitlements' 
        AND column_name = 'appeals'
    ) THEN
        ALTER TABLE entitlements ADD COLUMN appeals jsonb DEFAULT '[]';
        COMMENT ON COLUMN entitlements.appeals IS 'Array of appeal objects with status, usage, and purchase information';
    END IF;
END $$;

-- 2. Create appeal-documents storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'appeal-documents',
    'appeal-documents',
    false,
    10485760, -- 10MB limit
    ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- 3. Create RLS policies for appeal-documents bucket
-- Allow users to upload their own appeal documents
CREATE POLICY "Users can upload their own appeal documents" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'appeal-documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view their own appeal documents
CREATE POLICY "Users can view their own appeal documents" ON storage.objects
FOR SELECT USING (
    bucket_id = 'appeal-documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own appeal documents
CREATE POLICY "Users can delete their own appeal documents" ON storage.objects
FOR DELETE USING (
    bucket_id = 'appeal-documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow service role to manage all appeal documents (for backend operations)
CREATE POLICY "Service role can manage all appeal documents" ON storage.objects
FOR ALL USING (
    bucket_id = 'appeal-documents' 
    AND auth.role() = 'service_role'
);

-- 4. Create index on appeals column for better performance
CREATE INDEX IF NOT EXISTS idx_entitlements_appeals ON entitlements USING GIN (appeals);

-- 5. Create webhook_errors table for debugging (if it doesn't exist)
CREATE TABLE IF NOT EXISTS webhook_errors (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_type text NOT NULL,
    session_id text,
    error_message text NOT NULL,
    error_stack text,
    metadata jsonb,
    created_at timestamptz DEFAULT now()
);

-- 6. Create transactions table for payment logging (if it doesn't exist)
CREATE TABLE IF NOT EXISTS transactions (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_email text NOT NULL,
    product text NOT NULL,
    amount numeric(10,2) NOT NULL,
    affiliateid text,
    payout_status text DEFAULT 'pending',
    stripe_session_id text,
    created_at timestamptz DEFAULT now()
);

-- 7. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_email ON transactions(user_email);
CREATE INDEX IF NOT EXISTS idx_transactions_stripe_session_id ON transactions(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_webhook_errors_session_id ON webhook_errors(session_id);
CREATE INDEX IF NOT EXISTS idx_webhook_errors_created_at ON webhook_errors(created_at);

-- 8. Add comments to tables
COMMENT ON TABLE entitlements IS 'User entitlements including credits, appeals, and other premium features';
COMMENT ON TABLE transactions IS 'Payment transaction log for all purchases including appeals';
COMMENT ON TABLE webhook_errors IS 'Error log for webhook processing failures';

-- 9. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON entitlements TO anon, authenticated;
GRANT ALL ON transactions TO anon, authenticated;
GRANT USAGE ON SCHEMA storage TO anon, authenticated;

-- 10. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 11. Create trigger for entitlements table
DROP TRIGGER IF EXISTS update_entitlements_updated_at ON entitlements;
CREATE TRIGGER update_entitlements_updated_at
    BEFORE UPDATE ON entitlements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 12. Verify setup
SELECT 
    'Setup Complete' as status,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'entitlements' AND column_name = 'appeals') as appeals_column_exists,
    (SELECT COUNT(*) FROM storage.buckets WHERE id = 'appeal-documents') as storage_bucket_exists,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%appeal%') as rls_policies_count;


