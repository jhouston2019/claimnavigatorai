-- Complete Document System Setup for Supabase
-- Run this SQL in your Supabase SQL Editor

-- 1. Drop existing documents table if it exists (to start fresh)
DROP TABLE IF EXISTS documents CASCADE;

-- 2. Create documents table with proper schema
CREATE TABLE documents (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  label text NOT NULL,
  description text,
  language text NOT NULL CHECK (language IN ('en', 'es')),
  template_path text NOT NULL,
  sample_path text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Create indexes for better performance
CREATE INDEX idx_documents_language ON documents(language);
CREATE INDEX idx_documents_slug ON documents(slug);
CREATE INDEX idx_documents_label ON documents(label);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for public read access
CREATE POLICY "Anyone can view documents" ON documents
  FOR SELECT USING (true);

-- 6. Create storage bucket for documents (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- 7. Create storage policies for documents bucket
CREATE POLICY "Anyone can view documents" ON storage.objects
  FOR SELECT USING (bucket_id = 'documents');

CREATE POLICY "Service role can upload documents" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Service role can update documents" ON storage.objects
  FOR UPDATE USING (bucket_id = 'documents');

CREATE POLICY "Service role can delete documents" ON storage.objects
  FOR DELETE USING (bucket_id = 'documents');

-- 8. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON documents TO anon, authenticated;
GRANT USAGE ON SCHEMA storage TO anon, authenticated;

-- 9. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 10. Create trigger to automatically update updated_at
CREATE TRIGGER update_documents_updated_at 
  BEFORE UPDATE ON documents 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 11. Insert a test document to verify everything works
INSERT INTO documents (slug, label, description, language, template_path, sample_path)
VALUES (
  'test-document',
  'Test Document',
  'This is a test document to verify the system is working',
  'en',
  'test-template.pdf',
  'test-sample.pdf'
);

-- 12. Verify the setup
SELECT 
  'Documents table created successfully' as status,
  COUNT(*) as document_count
FROM documents;

-- 13. Check storage bucket
SELECT 
  'Storage bucket status' as status,
  name,
  public
FROM storage.buckets 
WHERE id = 'documents';

-- Success message
SELECT 'Document system setup complete! Next steps:
1. Upload PDF files to the "documents" storage bucket
2. Run the populate-documents function to add all document metadata
3. Test document access in the Response Center' as next_steps;
