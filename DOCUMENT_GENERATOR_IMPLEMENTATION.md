# Document Generator Implementation

## Overview

The Document Generator is a comprehensive AI-powered system that allows users to generate professional insurance claim documents. It supports 10 different document types in both English and Spanish, with PDF and DOCX export capabilities.

## Features

### ✅ **Complete Implementation**

- **10 Document Types**: Proof of Loss, Appeal Letter, Demand Letter, Damage Inventory, Claim Timeline, Repair Cost Worksheet, Out-of-Pocket Expenses, Appraisal Demand, Delay Complaint, Coverage Clarification
- **Bilingual Support**: English and Spanish with locale persistence
- **AI Generation**: OpenAI GPT-4 integration with document-specific prompts
- **File Export**: PDF and DOCX generation with professional formatting
- **Storage**: Supabase integration for file storage and metadata
- **Rate Limiting**: 2 documents/month for free users, unlimited for subscribers
- **Validation**: Comprehensive Zod schema validation for all forms
- **UI Components**: Accessible tabbed interface with form management

## Architecture

### Backend Components

```
netlify/functions/
├── generateDocument.js          # Main document generation endpoint
└── utils/
    └── auth.js                  # Authentication utilities

lib/
├── validation/
│   └── schemas.js               # Zod validation schemas
├── ai/
│   └── generate.js              # OpenAI integration
├── files/
│   ├── pdf.js                   # PDF generation
│   └── docx.js                 # DOCX generation
├── stripe/
│   └── subscription.js          # Subscription checking
└── supabase/
    ├── storage.js               # File storage operations
    └── documents.js             # Document metadata operations
```

### Frontend Components

```
app/
└── document-generator.html      # Main document generator page

components/DocGen/
├── Tabs.js                      # Tab navigation component
├── FormShell.js                # Form wrapper with validation
└── forms/
    └── ProofOfLossForm.js       # Example form component
```

### Database Schema

```sql
-- Documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  doc_type TEXT NOT NULL,
  lang TEXT NOT NULL CHECK (lang IN ('en','es')),
  input_json JSONB NOT NULL,
  html_excerpt TEXT NOT NULL,
  pdf_path TEXT NOT NULL,
  docx_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('generated-docs', 'generated-docs', false, 52428800, 
        ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']);
```

## Document Types

### 1. Proof of Loss
- **Fields**: Policyholder info, claim details, damage description, estimated values
- **Output**: Formal statement with signature section and totals table

### 2. Appeal Letter
- **Fields**: Denial details, supporting facts, evidence list, requested action
- **Output**: Business letter format with point-by-point rebuttal

### 3. Demand Letter
- **Fields**: Offer amounts, supporting docs, response deadline
- **Output**: Formal demand with evidence gap analysis

### 4. Damage Inventory Sheet
- **Fields**: Itemized list with condition, quantity, costs
- **Output**: Detailed table with category subtotals

### 5. Claim Timeline/Diary
- **Fields**: Chronological entries with actors, events, notes
- **Output**: Timeline table with missed deadline flags

### 6. Repair/Replacement Cost Worksheet
- **Fields**: Room/area breakdown with labor and materials
- **Output**: Trade summary with subtotals and grand total

### 7. Out-of-Pocket Expense Log
- **Fields**: Expense entries with categories, vendors, amounts
- **Output**: Detailed table with category breakdown

### 8. Appraisal Demand Letter
- **Fields**: Policy clause reference, nominated umpire, dispute basis
- **Output**: Formal appraisal clause invocation

### 9. Notice of Delay Complaint
- **Fields**: Submission dates, statutory deadlines, follow-up history
- **Output**: Cites state prompt pay laws with timeline documentation

### 10. Coverage Clarification Request
- **Fields**: Specific provisions, factual context, targeted questions
- **Output**: Professional inquiry requesting written coverage position

## API Endpoints

### POST /.netlify/functions/generateDocument

**Request Body:**
```json
{
  "docType": "proof-of-loss",
  "lang": "en",
  "input": {
    "policyholderName": "John Doe",
    "address": "123 Main St",
    "email": "john@example.com",
    "phone": "555-123-4567",
    "policyNumber": "POL-123",
    "claimNumber": "CLM-456",
    "dateOfLoss": "2024-01-15",
    "lossType": "fire",
    "damageDescription": "Kitchen fire...",
    "estimatedValueStructure": 50000,
    "estimatedValueContents": 25000,
    "deductible": 1000,
    "attachmentsSummary": "Photos and reports"
  }
}
```

**Response:**
```json
{
  "success": true,
  "html": "<h1>Proof of Loss</h1>...",
  "pdfUrl": "https://signed-url-to-pdf",
  "docxUrl": "https://signed-url-to-docx",
  "docId": "uuid-of-document"
}
```

## Usage Limits

- **Free Users**: 2 documents per month
- **Subscribers**: Unlimited documents
- **Rate Limiting**: 20 requests per hour per user
- **File Size**: 50MB limit per document

## Security Features

- **Authentication**: JWT token validation for all requests
- **Authorization**: User-scoped data access with RLS policies
- **Input Validation**: Comprehensive Zod schema validation
- **Rate Limiting**: IP and user-based request limiting
- **File Sanitization**: HTML content sanitization
- **Secure Storage**: Private file storage with signed URLs

## Localization

### Supported Languages
- **English (en)**: Default language
- **Spanish (es)**: Full translation support

### Locale Files
- `locales/en.json`: English translations
- `locales/es.json`: Spanish translations

### Features
- Language toggle with localStorage persistence
- Form labels and validation messages
- Generated document content
- UI text and help content

## Testing

### Test Script
```bash
node scripts/test-document-generator.js
```

### Test Coverage
- ✅ Validation schemas for all 10 document types
- ✅ AI document generation (English/Spanish)
- ✅ PDF and DOCX file generation
- ✅ Form validation and error handling
- ✅ Authentication and authorization
- ✅ Rate limiting and usage tracking

## Deployment Checklist

### Environment Variables
```bash
OPENAI_API_KEY=your_openai_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
STRIPE_SECRET_KEY=your_stripe_secret
```

### Database Setup
1. Run Supabase migration: `supabase/migrations/20241201_create_documents_table.sql`
2. Verify storage bucket creation
3. Test RLS policies

### Netlify Functions
1. Deploy all functions to `/netlify/functions/`
2. Verify environment variables
3. Test function endpoints

### Frontend
1. Deploy HTML page to `/app/document-generator.html`
2. Deploy components to `/components/DocGen/`
3. Deploy locale files to `/locales/`

## File Structure

```
Claim Navigator/
├── app/
│   └── document-generator.html
├── components/DocGen/
│   ├── Tabs.js
│   ├── FormShell.js
│   └── forms/
│       └── ProofOfLossForm.js
├── lib/
│   ├── validation/schemas.js
│   ├── ai/generate.js
│   ├── files/pdf.js
│   ├── files/docx.js
│   ├── stripe/subscription.js
│   └── supabase/
│       ├── storage.js
│       └── documents.js
├── locales/
│   ├── en.json
│   └── es.json
├── netlify/functions/
│   └── generateDocument.js
├── scripts/
│   └── test-document-generator.js
└── supabase/migrations/
    └── 20241201_create_documents_table.sql
```

## Performance Considerations

- **AI Generation**: ~3-5 seconds per document
- **File Generation**: ~1-2 seconds for PDF/DOCX
- **Storage Upload**: ~2-3 seconds for file upload
- **Total Response Time**: ~6-10 seconds per document

## Error Handling

- **Validation Errors**: 400 with detailed field errors
- **Authentication Errors**: 401 with clear message
- **Rate Limit Errors**: 402 with upgrade prompt
- **Generation Errors**: 500 with user-friendly message
- **Network Errors**: Retry logic with exponential backoff

## Future Enhancements

- [ ] Additional document types
- [ ] Template customization
- [ ] Batch document generation
- [ ] Document collaboration features
- [ ] Advanced formatting options
- [ ] Integration with external services

## Support

For technical support or questions about the Document Generator implementation, please refer to the main project documentation or contact the development team.
