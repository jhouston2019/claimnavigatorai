# Supabase Storage Configuration for Claim Command Center

## Storage Bucket Setup

### 1. Create Storage Bucket

In the Supabase Dashboard, create a new storage bucket:

**Bucket Name:** `claim-documents`

**Settings:**
- Public: `false` (private bucket)
- File size limit: `15 MB`
- Allowed MIME types: 
  - `application/pdf`
  - `image/jpeg`
  - `image/png`
  - `image/gif`
  - `image/webp`
  - `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (DOCX)
  - `application/msword` (DOC)

### 2. Storage Policies

Apply the following Row Level Security (RLS) policies to the `claim-documents` bucket:

#### Policy 1: Users can upload their own claim documents

```sql
CREATE POLICY "Users can upload claim documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'claim-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

#### Policy 2: Users can view their own claim documents

```sql
CREATE POLICY "Users can view their own claim documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'claim-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

#### Policy 3: Users can update their own claim documents

```sql
CREATE POLICY "Users can update their own claim documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'claim-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

#### Policy 4: Users can delete their own claim documents

```sql
CREATE POLICY "Users can delete their own claim documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'claim-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

### 3. Folder Structure

Documents are organized by user and claim:

```
claim-documents/
├── {user_id}/
│   ├── {claim_id}/
│   │   ├── policies/
│   │   │   └── policy_2024-02-12.pdf
│   │   ├── estimates/
│   │   │   ├── contractor_estimate.pdf
│   │   │   └── carrier_estimate.pdf
│   │   ├── settlements/
│   │   │   └── settlement_letter.pdf
│   │   ├── releases/
│   │   │   └── release_document.pdf
│   │   ├── photos/
│   │   │   ├── damage_photo_1.jpg
│   │   │   └── damage_photo_2.jpg
│   │   ├── invoices/
│   │   │   └── contractor_invoice.pdf
│   │   ├── receipts/
│   │   │   └── material_receipt.pdf
│   │   └── correspondence/
│   │       └── letter_to_adjuster.pdf
```

### 4. File Upload Function

Use this helper function to upload files with proper path structure:

```javascript
/**
 * Upload document to Supabase Storage
 * @param {File} file - File object to upload
 * @param {string} userId - User ID
 * @param {string} claimId - Claim ID
 * @param {string} documentType - Type of document (policy, estimate, etc.)
 * @returns {Promise<{url: string, path: string}>}
 */
async function uploadClaimDocument(file, userId, claimId, documentType) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  // Validate file size (15MB max)
  if (file.size > 15 * 1024 * 1024) {
    throw new Error('File size exceeds 15MB limit');
  }
  
  // Validate file type
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword'
  ];
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error('File type not allowed');
  }
  
  // Generate unique filename
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const fileName = `${timestamp}_${sanitizedName}`;
  
  // Determine subfolder based on document type
  const subfolderMap = {
    'policy': 'policies',
    'contractor_estimate': 'estimates',
    'carrier_estimate': 'estimates',
    'settlement_letter': 'settlements',
    'release': 'releases',
    'photo': 'photos',
    'invoice': 'invoices',
    'receipt': 'receipts',
    'correspondence': 'correspondence',
    'supplement': 'correspondence',
    'proof_of_loss': 'correspondence',
    'other': 'other'
  };
  
  const subfolder = subfolderMap[documentType] || 'other';
  const filePath = `${userId}/${claimId}/${subfolder}/${fileName}`;
  
  // Upload file
  const { data, error } = await supabase.storage
    .from('claim-documents')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }
  
  // Get public URL (signed URL for private bucket)
  const { data: urlData } = await supabase.storage
    .from('claim-documents')
    .createSignedUrl(filePath, 3600); // 1 hour expiry
  
  return {
    url: urlData.signedUrl,
    path: filePath,
    publicUrl: `${SUPABASE_URL}/storage/v1/object/public/claim-documents/${filePath}`
  };
}
```

### 5. Generate Signed URLs for Processing

When passing documents to AI APIs, generate signed URLs with appropriate expiry:

```javascript
/**
 * Generate signed URL for document processing
 * @param {string} storagePath - Storage path from database
 * @param {number} expirySeconds - URL expiry in seconds (default 3600)
 * @returns {Promise<string>}
 */
async function getSignedUrlForProcessing(storagePath, expirySeconds = 3600) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  const { data, error } = await supabase.storage
    .from('claim-documents')
    .createSignedUrl(storagePath, expirySeconds);
  
  if (error) {
    throw new Error(`Failed to generate signed URL: ${error.message}`);
  }
  
  return data.signedUrl;
}
```

### 6. Security Best Practices

1. **Always validate file types** on both client and server
2. **Enforce file size limits** (15MB max)
3. **Use signed URLs** for private documents
4. **Set appropriate expiry times** on signed URLs
5. **Sanitize filenames** to prevent path traversal attacks
6. **Verify claim ownership** before allowing document access
7. **Log all upload/download operations** for audit trail

### 7. Database Integration

When a file is uploaded, create a record in the `claim_documents` table:

```javascript
const { data: document, error } = await supabase
  .from('claim_documents')
  .insert({
    claim_id: claimId,
    user_id: userId,
    document_type: documentType,
    file_name: file.name,
    file_url: signedUrl,
    file_size: file.size,
    mime_type: file.type,
    storage_path: storagePath,
    step_number: stepNumber,
    description: description
  })
  .select()
  .single();
```

### 8. Cleanup Policy

Implement a cleanup policy for expired or deleted claims:

```sql
-- Function to delete claim documents when claim is deleted
CREATE OR REPLACE FUNCTION delete_claim_documents()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete all storage objects for this claim
  -- Note: This requires a separate cleanup job or Edge Function
  -- to actually delete files from storage
  PERFORM storage.delete_object(
    'claim-documents',
    storage_path
  )
  FROM claim_documents
  WHERE claim_id = OLD.id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to clean up documents when claim is deleted
DROP TRIGGER IF EXISTS cleanup_claim_documents ON claims;
CREATE TRIGGER cleanup_claim_documents
  BEFORE DELETE ON claims
  FOR EACH ROW
  EXECUTE FUNCTION delete_claim_documents();
```

### 9. Testing Storage Setup

Test the storage configuration with this checklist:

- [ ] Create bucket `claim-documents`
- [ ] Apply all RLS policies
- [ ] Test file upload as authenticated user
- [ ] Test file download with signed URL
- [ ] Verify file size limit enforcement
- [ ] Verify MIME type restrictions
- [ ] Test cross-user access prevention
- [ ] Test file deletion
- [ ] Verify folder structure creation

### 10. Environment Variables

Ensure these environment variables are set:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Complete Setup Script

Run this SQL script in Supabase SQL Editor to set up everything:

```sql
-- Create storage bucket (if not exists via Dashboard)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'claim-documents',
  'claim-documents',
  false,
  15728640, -- 15MB in bytes
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Apply RLS policies
CREATE POLICY "Users can upload claim documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'claim-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their own claim documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'claim-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own claim documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'claim-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own claim documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'claim-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

## Done!

Your Supabase Storage is now configured for the Claim Command Center.
