# Evidence Organizer Implementation

## Overview
The Evidence Organizer is a comprehensive system for uploading, categorizing, and managing insurance claim evidence files with AI-powered categorization and organization.

## Features Implemented

### 1. User Interface
- **Location**: `/response-center/evidence-organizer` tab in the Response Center
- **Upload Zone**: Drag-and-drop file upload with visual feedback
- **AI Categorization Panel**: Shows real-time AI analysis results
- **Categorized Display**: Evidence organized by Structure, Contents, ALE, and Medical categories
- **Package Generation**: Compile all evidence into a single ZIP file

### 2. Backend Functions

#### `categorizeEvidence.js`
- Handles file uploads to Supabase storage
- Uses OpenAI GPT-4 for intelligent categorization
- Categories: Structure, Contents, ALE, Medical
- Stores metadata in `evidence_items` table

#### `getEvidenceItems.js`
- Retrieves user's evidence items from database
- Returns categorized list for display

#### `downloadEvidence.js`
- Downloads individual evidence files
- Secure access control per user

#### `deleteEvidence.js`
- Removes evidence files from storage and database
- User can only delete their own files

#### `generateEvidencePackage.js`
- Creates organized ZIP package
- Files organized by category folders
- Includes metadata and summary document

### 3. Database Schema

#### `evidence_items` Table
```sql
CREATE TABLE evidence_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  file_path TEXT NOT NULL,
  filename TEXT,
  category TEXT NOT NULL CHECK (category IN ('Structure', 'Contents', 'ALE', 'Medical')),
  ai_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### Supabase Storage
- **Bucket**: `evidence-uploads` (private)
- **File Size Limit**: 50MB
- **Allowed Types**: Images, PDFs, Documents
- **Security**: Row Level Security enabled

### 4. AI Categorization Logic

The system uses OpenAI GPT-4 to analyze uploaded files and categorize them:

- **Structure**: Building damage, structural issues, roof damage, foundation problems
- **Contents**: Personal property, furniture, electronics, clothing, household items  
- **ALE**: Additional Living Expenses, temporary housing, meals, transportation costs
- **Medical**: Medical bills, injury documentation, treatment records

### 5. Security Features

- **Authentication**: JWT token validation for all operations
- **Authorization**: Users can only access their own evidence
- **File Validation**: Type and size restrictions
- **RLS Policies**: Database-level security

### 6. User Experience

#### Upload Process
1. Drag files to upload zone or click to select
2. Files are automatically uploaded to Supabase storage
3. AI analyzes and categorizes each file
4. Results displayed in real-time panel
5. Files organized in categorized sections

#### Evidence Management
- View all evidence by category
- Download individual files
- Delete unwanted files
- Generate complete evidence package

#### Package Generation
- Creates organized ZIP file
- Files sorted by category folders
- Includes metadata and summary
- Professional presentation for insurance claims

## Setup Instructions

### 1. Database Setup
Run the SQL schema in `supabase/evidence_items_schema.sql`:
```bash
# Via Supabase CLI
supabase db reset
# Or apply via Supabase Dashboard
```

### 2. Storage Bucket Setup
Execute the setup function:
```bash
curl -X POST https://your-site.netlify.app/.netlify/functions/setup-evidence-system
```

### 3. Environment Variables
Ensure these are set in Netlify:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`

### 4. Dependencies
The following packages are required:
- `@supabase/supabase-js`
- `openai`
- `jszip`

## File Structure

```
netlify/functions/
├── categorizeEvidence.js      # Main upload & categorization
├── getEvidenceItems.js        # Retrieve user evidence
├── downloadEvidence.js        # Download individual files
├── deleteEvidence.js          # Delete evidence files
├── generateEvidencePackage.js # Create ZIP package
└── setup-evidence-system.js  # Initial setup

supabase/
└── evidence_items_schema.sql  # Database schema

app/
└── response-center.html       # UI implementation
```

## Usage Examples

### Upload Evidence
```javascript
// Files are automatically categorized by AI
const files = document.getElementById('evidence-file-input').files;
// Files uploaded and categorized automatically
```

### Generate Package
```javascript
// Creates organized ZIP with all evidence
generateEvidencePackage();
```

### Access Evidence
```javascript
// Load user's evidence items
loadExistingEvidence();
```

## Technical Details

### AI Categorization Prompt
The system uses a structured prompt to ensure consistent categorization:

```
Analyze this insurance claim evidence file and categorize it into one of these categories:
- Structure: Building damage, structural issues, roof damage, foundation problems
- Contents: Personal property, furniture, electronics, clothing, household items
- ALE: Additional Living Expenses, temporary housing, meals, transportation costs
- Medical: Medical bills, injury documentation, treatment records
```

### File Processing
1. Files uploaded to Supabase storage
2. AI analyzes file metadata and content
3. Results stored in database with user association
4. Real-time UI updates with categorization

### Package Generation
1. Retrieves all user evidence items
2. Downloads files from storage
3. Organizes into category folders
4. Creates metadata files
5. Generates summary document
6. Compresses into ZIP file

## Production Considerations

### Performance
- File size limits prevent storage issues
- Async processing for large files
- Efficient database queries with indexes

### Security
- All operations require authentication
- Row Level Security prevents data leaks
- File type validation prevents malicious uploads

### Scalability
- Supabase storage scales automatically
- Database indexes optimize queries
- CDN delivery for file downloads

## Future Enhancements

1. **Advanced AI Analysis**: Extract text from images using OCR
2. **Document Processing**: Parse PDF content for better categorization
3. **Collaboration**: Share evidence packages with professionals
4. **Integration**: Connect with claim management systems
5. **Analytics**: Track evidence usage and effectiveness

## Support

For issues or questions:
1. Check the browser console for errors
2. Verify environment variables are set
3. Ensure Supabase setup is complete
4. Test with small files first

The Evidence Organizer provides a complete solution for managing insurance claim evidence with AI-powered organization and professional presentation capabilities.
