# Document Generators - Quick Start Card

**🚀 Get Started in 30 Seconds**

---

## For Users

### How to Generate a Document

1. **Navigate** to the relevant step in your claim guide
2. **Click** on a document generator tool
3. **Fill** out the form (required fields marked with *)
4. **Click** "✨ Generate with AI"
5. **Wait** 3-5 seconds
6. **Copy** or **Download** your document

**That's it!** 🎉

---

## For Developers

### Quick Reference

**File:** `step-by-step-claim-guide.html`  
**Lines:** 5453-6033 (approx)  
**Endpoint:** `/netlify/functions/ai-document-generator`

### Add New Generator

```javascript
// 1. Add to documentGenerators object
'new-tool-id': {
  title: 'Tool Title',
  description: 'Description',
  fields: [
    { name: 'field1', label: 'Label', type: 'text', required: true }
  ]
}

// 2. Add to tool-registry.js
'new-tool-id': {
  url: '/step-by-step-claim-guide.html?step=X',
  engine: 'guide',
  mode: 'embedded',
  step: X
}

// 3. Add to stepData
additionalTools: [
  { id: 'new-tool-id', title: 'Tool Title' }
]
```

### Test

```javascript
// Open modal
window.openTool('new-tool-id', X);

// Check console
console.log(documentGenerators['new-tool-id']);
```

---

## Available Generators

| ID | Title | Step |
|----|-------|------|
| `carrier-submission-cover-letter-generator` | Carrier Submission Cover Letter | 10 |
| `coverage-clarification-letter` | Coverage Clarification Letter | 1 |
| `estimate-revision-request-generator` | Estimate Revision Request | 4 |
| `euo-sworn-statement-guide` | EUO Sworn Statement Guide | 2 |
| `followup-status-letter` | Follow-Up Status Letter | 11 |
| `policy-interpretation-letter` | Policy Interpretation Letter | 1 |
| `submission-confirmation-email` | Submission Confirmation Email | 11 |
| `supplement-cover-letter-generator` | Supplement Cover Letter | 13 |

---

## Common Issues

| Issue | Solution |
|-------|----------|
| Modal won't open | Check console, refresh page |
| Generation fails | Check API key, internet connection |
| Copy doesn't work | Use HTTPS, check browser permissions |
| Download fails | Allow pop-ups, check download folder |

---

## Documentation

- **Implementation Details:** `DOCUMENT_GENERATORS_AI_IMPLEMENTATION.md`
- **User Guide:** `DOCUMENT_GENERATORS_USER_GUIDE.md`
- **Testing Guide:** `DOCUMENT_GENERATORS_TESTING_GUIDE.md`
- **Summary:** `DOCUMENT_GENERATORS_SUMMARY.md`

---

## Key Functions

```javascript
// Open generator
openDocumentGenerator(toolId)

// Close modal
closeDocumentGenerator()

// Generate document
generateDocument(event, toolId)

// Copy to clipboard
copyToClipboard()

// Download document
downloadDocument(title)

// Reset form
resetForm()
```

---

## Support

**Questions?** Check the documentation files above.  
**Bugs?** Use bug report template in testing guide.  
**New features?** Submit enhancement request.

---

**Status:** ✅ Complete  
**Version:** 1.0  
**Date:** January 6, 2026



