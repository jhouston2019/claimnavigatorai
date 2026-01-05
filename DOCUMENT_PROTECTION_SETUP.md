# Document Protection System Setup Guide

This guide explains how to set up comprehensive claimant protection for all document outputs in Claim Navigator.

## Overview

The document protection system ensures that all PDF documents (both AI-generated and template-based) include claimant information headers, footers, watermarks, and unique document IDs for audit tracking.

## Features

### 1. Universal PDF Protection
- **Headers**: Claimant info on every page
- **Footers**: "Generated for [Name] – Not transferable"
- **Watermarks**: Semi-transparent diagonal text
- **Document IDs**: Unique hash-based identifiers
- **Audit Logging**: Track all document access

### 2. Protected Information
- Insured Name
- Policy Number
- Insurance Company
- Date of Loss
- Loss Location (formatted address)
- Property Type
- Claim Status

## Setup Instructions

### 1. Database Setup

Run the document access log schema:

```sql
-- Execute the contents of supabase/document-access-log-schema.sql
```

Or use Supabase CLI:
```bash
supabase db reset
```

### 2. Environment Variables

Ensure these are set in your Netlify environment:

```
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. File Structure

The following files have been created:

```
├── netlify/functions/utils/pdf-protection.js (new - core protection utility)
├── netlify/functions/protected-document-download.js (new - Supabase PDF protection)
├── netlify/functions/generate-protected-document.js (new - AI document protection)
├── assets/js/document-protection.js (new - client-side utilities)
├── supabase/document-access-log-schema.sql (new - audit logging schema)
└── DOCUMENT_PROTECTION_SETUP.md (new - this file)
```

### 4. Integration Steps

#### A. Update Existing AI Document Generation

Replace direct PDF generation with protected generation:

```javascript
// OLD: Direct PDF generation
const pdfBuffer = await generatePDF(content);

// NEW: Protected PDF generation
const { protectedPdf, documentId } = await addClaimantProtection(pdfBuffer, claimantInfo);
```

#### B. Update Document Download Links

Replace direct Supabase storage links with protected endpoints:

```html
<!-- OLD: Direct download -->
<a href="/documents/template.pdf">Download Template</a>

<!-- NEW: Protected download -->
<a href="#" data-document-slug="template" onclick="downloadProtectedDocument('template', userId, 'Template')">Download Template</a>
```

#### C. Include Client-Side Script

Add the document protection script to your pages:

```html
<script src="/assets/js/document-protection.js"></script>
```

### 5. Usage Examples

#### Download Protected Template Document

```javascript
// Get claimant info and download protected document
const claimantInfo = await getClaimantInfo(userId);
const result = await downloadProtectedDocument('proof-of-loss', userId, 'Proof of Loss');
```

#### Generate Protected AI Document

```javascript
// Generate AI document with protection
const result = await generateProtectedDocument(
  'demand-letter',
  aiGeneratedContent,
  claimantInfo,
  userId
);
```

### 6. Document ID System

Each protected document gets a unique ID:
- **Format**: 16-character uppercase hash
- **Based on**: user_id + policy_number + timestamp
- **Purpose**: Audit tracking and document identification

### 7. Audit Logging

All document access is logged in the `document_access_log` table:
- Document ID
- User ID
- Access type (download, view, generate)
- Timestamp
- IP address (optional)
- User agent (optional)

## Security Features

### 1. No Raw Document Access
- All Supabase-stored PDFs are protected before serving
- AI-generated documents are protected before download
- Raw originals are never served directly

### 2. Claimant Information Protection
- Headers include all essential claim details
- Watermarks prevent unauthorized use
- Document IDs enable tracking

### 3. Audit Trail
- Complete access logging
- User-specific document tracking
- Timestamp and metadata recording

## Testing

### 1. Test Protected Downloads
1. Navigate to document library
2. Click any document download link
3. Verify PDF includes:
   - Header with claimant info
   - Footer with "Not transferable" message
   - Watermark
   - Document ID at bottom

### 2. Test AI Document Generation
1. Generate an AI document
2. Download the result
3. Verify same protection features

### 3. Test Audit Logging
1. Download/generate documents
2. Check `document_access_log` table in Supabase
3. Verify entries are created with correct metadata

## Troubleshooting

### Common Issues

1. **PDF Protection Fails**
   - Check pdf-lib dependency is installed
   - Verify claimant info is complete
   - Check console for error messages

2. **Document Downloads Fail**
   - Verify Supabase storage bucket exists
   - Check document paths in database
   - Ensure user authentication is working

3. **Audit Logging Issues**
   - Check database permissions
   - Verify RLS policies are correct
   - Check Supabase connection

### Debug Steps

1. Check Netlify function logs
2. Verify environment variables
3. Test Supabase connections
4. Check browser console for client-side errors

## Future Enhancements

Potential improvements:
- DOCX document protection
- Advanced watermarking options
- Document expiration dates
- Digital signatures
- Enhanced audit reporting
- Bulk document protection

## Compliance Notes

This system helps ensure:
- Document traceability
- User accountability
- Audit compliance
- Data protection
- Professional document presentation

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review Netlify function logs
3. Verify database schema
4. Test with sample documents
