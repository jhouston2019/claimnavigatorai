# Shared Controllers - Functional Contract Implementation

## Overview

This directory contains four shared controllers that implement the functional contracts defined in Phase 3A. These controllers enable placeholder tools to be activated through configuration alone, eliminating the need to build 77 tools individually.

## Architecture

```
Placeholder Tool HTML
        ↓
Configuration Object
        ↓
Shared Controller (1 of 4)
        ↓
Shared Engines (Auth, Autofill, Storage, etc.)
        ↓
Backend Functions (Netlify)
        ↓
Database (Supabase)
```

## Controllers

### 1. Document Generator Controller
**File:** `document-generator-controller.js`  
**Contract:** DOCUMENT_GENERATOR  
**Purpose:** Generate AI-powered documents from templates

**Configuration:**
```javascript
import { DocumentGeneratorController } from './controllers/index.js';

DocumentGeneratorController.initTool({
  toolId: 'carrier-submission-cover-letter',
  toolName: 'Carrier Submission Cover Letter Generator',
  templateType: 'carrier_submission_cover_letter',
  backendFunction: '/.netlify/functions/ai-document-generator', // optional
  timelineEventType: 'document_generated' // optional
});
```

**Required DOM Elements:**
- `[data-tool-form]` or `<form>` - Form containing input fields
- `[data-tool-output]` or `#output` - Output area for generated document
- Optional: `[data-export-pdf]`, `[data-export-docx]`, `[data-copy-clipboard]`

**Features:**
- Auto-fills form from intake data
- Calls AI document generation backend
- Renders formatted document
- Exports to PDF/DOCX
- Saves to database
- Adds timeline event

---

### 2. AI Tool Controller
**File:** `ai-tool-controller.js`  
**Contract:** AI_TOOL  
**Purpose:** Run AI analysis, calculations, and recommendations

**Configuration:**
```javascript
import { AIToolController } from './controllers/index.js';

AIToolController.initTool({
  toolId: 'comparable-item-finder',
  toolName: 'Comparable Item Finder',
  backendFunction: '/.netlify/functions/ai-comparable-items',
  inputFields: ['itemDescription', 'estimatedValue'], // optional
  outputFormat: 'structured', // 'structured', 'calculation', 'text'
  supabaseTable: 'documents', // optional
  timelineEventType: 'ai_analysis' // optional
});
```

**Required DOM Elements:**
- `[data-analyze-btn]` or `#analyzeBtn` - Analyze/Calculate button
- `[data-tool-output]` or `#output` - Output area for results
- Optional: `[data-export-pdf]`, `[data-copy-clipboard]`

**Output Formats:**
- **structured**: Sections with headings (summary, recommendations, details)
- **calculation**: Numeric result with breakdown
- **text**: Simple text response

**Features:**
- Collects input data
- Validates required fields
- Calls AI backend function
- Renders formatted results
- Exports to PDF
- Saves to database
- Adds timeline event

---

### 3. Workflow View Controller
**File:** `workflow-view-controller.js`  
**Contract:** WORKFLOW_VIEW  
**Purpose:** Manage CRUD operations for tracked data

**Configuration:**
```javascript
import { WorkflowViewController } from './controllers/index.js';

WorkflowViewController.initTool({
  toolId: 'ale-tracker',
  toolName: 'ALE Tracker',
  supabaseTable: 'ale_expenses',
  fields: [
    { name: 'date', type: 'date', label: 'Date', required: true },
    { name: 'category', type: 'select', label: 'Category', options: ['Hotel', 'Food', 'Transport'], required: true },
    { name: 'amount', type: 'number', label: 'Amount', required: true },
    { name: 'description', type: 'textarea', label: 'Description', required: false }
  ],
  viewType: 'table', // 'table', 'cards', 'timeline'
  timelineEventType: 'workflow_update' // optional
});
```

**Required DOM Elements:**
- `[data-tool-table]` or `#recordsContainer` - Container for records
- `[data-create-btn]` or `#addBtn` - Add new record button
- Optional: `[data-summary-stats]`, `[data-search-input]`, `[data-refresh-btn]`

**View Types:**
- **table**: Traditional table with rows and columns
- **cards**: Card-based layout
- **timeline**: Chronological timeline view

**Features:**
- Loads records from Supabase
- Renders in selected view type
- Create/Update/Delete operations
- Search and filter
- Summary statistics
- Auto-refresh

---

### 4. Reference Library Controller
**File:** `reference-library-controller.js`  
**Contract:** REFERENCE_LIBRARY  
**Purpose:** Enhance static reference pages with helpers

**Configuration:**
```javascript
import { ReferenceLibraryController } from './controllers/index.js';

ReferenceLibraryController.initTool({
  toolId: 'euo-sworn-statement-guide',
  toolName: 'EUO Sworn Statement Guide',
  enableSearch: true, // optional
  trackPageView: true, // optional
  requireAuth: false // optional
});
```

**Required DOM Elements:**
- None required (works with any HTML content)
- Optional: `[data-search-input]` for search functionality

**Features:**
- Tracks page views in analytics
- Client-side search/filter
- Smooth scroll navigation
- Back to top button
- Print helper
- Active section highlighting

---

## Shared Engines

All controllers automatically leverage these shared engines:

### Authentication Engine
- `requireAuth()` - Enforces authentication
- `checkPaymentStatus()` - Checks payment access
- `getAuthToken()` - Retrieves auth token
- `getSupabaseClient()` - Gets Supabase client

### Autofill Engine
- `autofillForm()` - Auto-fills form fields
- `getIntakeData()` - Retrieves intake data

### Storage Engine
- `uploadToStorage()` - Uploads files to Supabase storage
- `uploadMultipleFiles()` - Batch file upload
- `extractTextFromFile()` - Extracts text from PDFs/DOCX

### Tool Output Bridge
- `saveAndReturn()` - Saves output and navigates
- `getToolParams()` - Retrieves tool parameters
- `getReportName()` - Generates report name

### Timeline Sync Engine
- `addTimelineEvent()` - Logs event to claim timeline

### UI Helpers
- `window.CNLoading` - Loading indicators
- `window.CNError` - Error messages
- `window.CNNotification` - Success messages
- `window.CNPaywall` - Payment required modal

---

## Implementation Strategy

### Phase 3D: Wire Placeholder Tools

For each placeholder tool in `/app/tools/`:

1. **Add script tag to HTML:**
```html
<script type="module">
  import { AIToolController } from '../assets/js/controllers/index.js';
  
  AIToolController.initTool({
    toolId: 'comparable-item-finder',
    toolName: 'Comparable Item Finder',
    backendFunction: '/.netlify/functions/ai-comparable-items',
    outputFormat: 'structured'
  });
</script>
```

2. **Add required DOM elements:**
```html
<div data-tool-output id="output" style="display: none;">
  <!-- Results will be rendered here -->
</div>
```

3. **Test functionality:**
- User can input data
- Analysis runs successfully
- Results display correctly
- Export functions work
- Data persists to database

### Batch Implementation

Instead of implementing 77 tools individually:

1. Group tools by contract type (35 AI_TOOL, 33 WORKFLOW_VIEW, etc.)
2. Create configuration JSON for each group
3. Apply controller wiring in batch
4. Test one tool per group to validate
5. Deploy all at once

---

## Backend Requirements

### Netlify Functions

Each AI_TOOL and DOCUMENT_GENERATOR requires a corresponding Netlify function:

**Example: AI Tool Function**
```javascript
// netlify/functions/ai-comparable-items.js
exports.handler = async (event, context) => {
  const { itemDescription, estimatedValue } = JSON.parse(event.body);
  
  // Call OpenAI API
  const analysis = await callOpenAI({
    prompt: `Find comparable items for: ${itemDescription}`,
    context: { estimatedValue }
  });
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      data: {
        summary: analysis.summary,
        recommendations: analysis.recommendations,
        comparables: analysis.comparables
      }
    })
  };
};
```

### Supabase Tables

Each WORKFLOW_VIEW requires a Supabase table:

**Example: ALE Tracker Table**
```sql
CREATE TABLE ale_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  date DATE NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE ale_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own expenses"
  ON ale_expenses
  FOR ALL
  USING (auth.uid() = user_id);
```

---

## Testing

### Unit Testing
```javascript
// Test controller initialization
import { AIToolController } from './controllers/index.js';

test('AIToolController initializes correctly', async () => {
  const config = {
    toolId: 'test-tool',
    toolName: 'Test Tool',
    backendFunction: '/test'
  };
  
  await AIToolController.initTool(config);
  expect(console.log).toHaveBeenCalledWith(expect.stringContaining('initialized successfully'));
});
```

### Integration Testing
1. Load tool page
2. Verify authentication check
3. Input test data
4. Trigger analysis/generation
5. Verify output rendering
6. Check database persistence
7. Test export functionality

---

## Troubleshooting

### Controller not initializing
- Check console for errors
- Verify import path is correct
- Ensure DOM elements exist
- Check authentication status

### Backend function not called
- Verify `backendFunction` path is correct
- Check auth token is valid
- Inspect network tab for request
- Check backend function logs

### Data not persisting
- Verify Supabase table exists
- Check RLS policies allow access
- Ensure user is authenticated
- Check for database errors in console

### Export not working
- Verify jsPDF library is loaded
- Check for export button elements
- Ensure `window._currentDocument` or `window._currentAnalysis` is set
- Check browser console for errors

---

## Next Steps

**Phase 3D:** Wire all 77 placeholder tools using these controllers
**Phase 3E:** Create backend functions for new AI tools
**Phase 3F:** Create Supabase tables for new workflow views
**Phase 4:** Test and validate all tools
**Phase 5:** Deploy to production

---

## Support

For questions or issues:
1. Check console logs for detailed error messages
2. Verify configuration matches contract requirements
3. Test with existing functional tools as reference
4. Review Phase 3A functional contracts document



