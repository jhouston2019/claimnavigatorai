-- Add appeals column to entitlements table if it doesn't exist
-- This migration adds support for the Appeal Builder pay-per-appeal system

-- Check if the appeals column exists, if not add it
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

-- Create appeal-documents storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'appeal-documents',
    'appeal-documents',
    false,
    10485760, -- 10MB limit
    ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for appeal-documents bucket
CREATE POLICY "Users can upload their own appeal documents" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'appeal-documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own appeal documents" ON storage.objects
FOR SELECT USING (
    bucket_id = 'appeal-documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own appeal documents" ON storage.objects
FOR DELETE USING (
    bucket_id = 'appeal-documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create index on appeals column for better performance
CREATE INDEX IF NOT EXISTS idx_entitlements_appeals ON entitlements USING GIN (appeals);

-- Add comment to the entitlements table
COMMENT ON TABLE entitlements IS 'User entitlements including credits, appeals, and other premium features';
