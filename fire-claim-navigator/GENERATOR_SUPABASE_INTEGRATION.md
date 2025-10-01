# Document Generator → Supabase Hookup

This implementation provides automatic saving of generated documents to Supabase with PDF and DOCX conversion.

## Files Created

### Core Files
- `/lib/generatorHandler.ts` - Main handler with TypeScript support
- `/lib/generatorHandler.js` - JavaScript version for browser use
- `/lib/documents.ts` - TypeScript Supabase integration
- `/lib/documents.js` - JavaScript Supabase integration

### Integration Files
- `/lib/generatorIntegration.ts` - TypeScript integration class
- `/lib/generatorIntegration.js` - JavaScript integration class
- `/lib/generator-integration-simple.js` - Simple browser-compatible version
- `/lib/generator-integration-example.html` - Integration examples

## Dependencies Added

```bash
npm install jspdf html-docx-js
```

## How to Use

### Option 1: Simple Integration (Recommended)

1. **Add the script to your document-generator.html:**

```html
<script src="./lib/generator-integration-simple.js"></script>
```

2. **Replace the existing `handleFormSubmit` method in your DocumentGenerator class:**

```javascript
async handleFormSubmit(data) {
  try {
    this.showLoading(true);
    this.hideResultPanel();
    
    // Use the new enhanced handler
    await window.handleGenerateAndSaveEnhanced({
      docType: this.currentDocType,
      lang: this.currentLocale,
      inputJson: data
    });

    // Show success message and redirect
    alert('Document generated and saved! Check your Documents page.');
    window.location.href = '/my-documents.html';
    
  } catch (error) {
    console.error('Document generation error:', error);
    
    if (error.message?.includes('limit') || error.message?.includes('quota')) {
      this.showUpgradeRequired({ limit: 2 });
    } else {
      this.showError(error.message || 'An unexpected error occurred. Please try again.');
    }
  } finally {
    this.showLoading(false);
  }
}
```

### Option 2: TypeScript Integration

1. **Import the handler in your TypeScript files:**

```typescript
import { handleGenerateAndSave } from '@/lib/generatorHandler';

async function onGenerateClick() {
  try {
    await handleGenerateAndSave({
      docType: 'denial_letter',
      lang: 'en',
      inputJson: { /* whatever form values */ },
    });
    alert('Document saved! Check your Documents page.');
  } catch (e) {
    alert('Failed to generate: ' + (e as any).message);
  }
}
```

## What It Does

1. **AI Generation**: Calls your existing `/.netlify/functions/generate-response` endpoint
2. **Format Conversion**: Converts HTML to PDF and DOCX using client-side libraries
3. **Supabase Storage**: Uploads files to Supabase Storage bucket `generated-docs`
4. **Database Record**: Creates a record in the `documents` table with metadata
5. **User Experience**: Shows success message and redirects to documents page

## Database Schema

The system expects a `documents` table with this structure:

```sql
CREATE TABLE documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  doc_type text NOT NULL,
  lang text NOT NULL CHECK (lang IN ('en','es')),
  input_json jsonb NOT NULL,
  html_excerpt text NOT NULL,
  pdf_path text NOT NULL,
  docx_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

## Storage Setup

The system uses a Supabase Storage bucket called `generated-docs` with this structure:
```
generated-docs/
  {user_id}/
    {doc_type}_{timestamp}.pdf
    {doc_type}_{timestamp}.docx
```

## Environment Variables

Make sure these are set in your environment:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` (for client-side)
- `SUPABASE_SERVICE_ROLE_KEY` (for server-side)

## Error Handling

The integration includes comprehensive error handling for:
- Authentication failures
- File upload errors
- Database insertion errors
- AI generation failures
- User quota limits

## Benefits

✅ **Automatic Saving**: Every generated document is automatically saved to Supabase  
✅ **Multiple Formats**: PDF and DOCX versions are created and stored  
✅ **User Isolation**: Each user's documents are stored in their own folder  
✅ **Metadata Tracking**: Full input data and excerpts are preserved  
✅ **Easy Integration**: Drop-in replacement for existing form submission  
✅ **Backward Compatible**: Falls back to original method if needed  

## Testing

1. Generate a document using the enhanced form
2. Check that it appears in your Documents page
3. Verify PDF and DOCX downloads work
4. Confirm the document is saved in Supabase Storage

## Troubleshooting

- **Authentication errors**: Ensure user is logged in to Supabase
- **Upload failures**: Check Supabase Storage bucket permissions
- **Database errors**: Verify the `documents` table exists and has correct schema
- **Conversion errors**: Ensure `jspdf` and `html-docx-js` are properly installed
