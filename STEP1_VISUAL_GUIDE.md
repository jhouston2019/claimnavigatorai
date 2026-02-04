# Step 1 Policy Analyzer - Visual Guide

## 🎯 User Journey Visualization

```
┌─────────────────────────────────────────────────────────────────┐
│                    STEP 1: POLICY ANALYZER                       │
│                  policy-analyzer-complete.html                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ PHASE 1: UPLOAD DOCUMENTS                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  📋 Policy Analyzer & Intelligence Report                        │
│  Upload your insurance policy for comprehensive AI analysis      │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 📌 What to Upload: Upload your complete insurance policy  │ │
│  │ including declarations page, policy form, endorsements... │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                                                            │ │
│  │                         📄                                 │ │
│  │                                                            │ │
│  │         Drag & Drop Policy Documents Here                 │ │
│  │                                                            │ │
│  │              or click to browse                            │ │
│  │                                                            │ │
│  │    Supported: PDF, DOC, DOCX, TXT (Max 10MB per file)     │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  USER UPLOADS FILES                                              │
│  ↓                                                                │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 📄 Policy_Declarations.pdf              2.3 MB        ✕   │ │
│  │ 📄 Policy_Form_HO3.pdf                  1.8 MB        ✕   │ │
│  │ 📄 Endorsements.pdf                     0.5 MB        ✕   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  METADATA FORM APPEARS                                           │
│  ↓                                                                │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Policy Information                                         │ │
│  │                                                            │ │
│  │ Policy Number:    [HO-123456789_____________]              │ │
│  │                                                            │ │
│  │ Insurance Company: [State Farm_____________]               │ │
│  │                                                            │ │
│  │ Policy Type:      [HO-3 (Homeowners)    ▼]                │ │
│  │                                                            │ │
│  │ Type of Loss:     [Water Damage          ▼]                │ │
│  │                                                            │ │
│  │          [ 🤖 Analyze Policy with AI ]                     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

                              ↓ USER CLICKS ANALYZE

┌─────────────────────────────────────────────────────────────────┐
│ PHASE 2: AI ANALYSIS IN PROGRESS                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│                         ⟳ (spinning)                             │
│                                                                   │
│                  Analyzing your policy...                        │
│                                                                   │
│              Extracting text from PDFs                           │
│                                                                   │
│  Progress Messages (appear sequentially):                        │
│  • Reading policy documents...                                   │
│  • Extracting text from PDFs...                                  │
│  • Analyzing coverage limits...                                  │
│  • Identifying endorsements...                                   │
│  • Detecting exclusions and deadlines...                         │
│  • Generating intelligence report...                             │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

                              ↓ ANALYSIS COMPLETE

┌─────────────────────────────────────────────────────────────────┐
│ PHASE 3: INTELLIGENCE REPORT                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 📊 Policy Intelligence Report                              │ │
│  │                                                            │ │
│  │ Your HO-3 policy with State Farm provides comprehensive   │ │
│  │ coverage for your property. Based on your water damage    │ │
│  │ claim, we've identified the applicable coverages...       │ │
│  │                                                            │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │ │
│  │  │    6     │  │    5     │  │    6     │  │    4     │ │ │
│  │  │ Coverages│  │Endorsemts│  │Exclusions│  │Deadlines │ │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 🏠 Coverage Limits & Sublimits                             │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │ Coverage              │ Limit     │ Deductible│ Description│ │
│  ├───────────────────────┼───────────┼───────────┼────────────┤ │
│  │ Coverage A - Dwelling │ $350,000  │ $2,500    │ Covers ... │ │
│  │ Coverage B - Other... │ $35,000   │ $2,500    │ Covers ... │ │
│  │ Coverage C - Personal │ $262,500  │ $1,000    │ Covers ... │ │
│  │ Coverage D - Loss of  │ $70,000   │ N/A       │ Covers ... │ │
│  │ Coverage E - Liability│ $300,000  │ N/A       │ Covers ... │ │
│  │ Coverage F - Medical  │ $5,000    │ N/A       │ Covers ... │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 📝 Endorsements & Riders                                   │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │ ✓ Water Backup & Sump Discharge ($10,000 limit)           │ │
│  │ ✓ Replacement Cost Coverage on Contents                   │ │
│  │ ✓ Increased Jewelry Limit ($10,000)                       │ │
│  │ ✓ Home Computer Coverage ($5,000)                         │ │
│  │ ✓ Identity Theft Coverage ($25,000)                       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ ⚠️ Exclusions & Limitations                                │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │ ⚠️ Flood damage (separate flood policy required)          │ │
│  │ ⚠️ Earthquake damage                                       │ │
│  │ ⚠️ Mold damage exceeding $10,000                           │ │
│  │ ⚠️ Wear and tear, deterioration                            │ │
│  │ ⚠️ Intentional loss                                        │ │
│  │ ⚠️ War and nuclear hazard                                  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ ⏰ Policy Deadlines & Time Requirements                    │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │ Notice of Loss          As soon as practicable             │ │
│  │ Proof of Loss           Within 60 days of request          │ │
│  │ Lawsuit Filing          Within 2 years of loss             │ │
│  │ Mitigation Actions      Immediately                        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ ✅ Your Policyholder Duties                                │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │ ✓ Give prompt notice of loss                              │ │
│  │ ✓ Protect property from further damage                    │ │
│  │ ✓ Cooperate with insurance company investigation          │ │
│  │ ✓ Prepare inventory of damaged property                   │ │
│  │ ✓ Submit Proof of Loss when requested                     │ │
│  │ ✓ Allow inspection of damaged property                    │ │
│  │ ✓ Provide requested documentation                         │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  [ 📥 Download Report as PDF ]  [ 💾 Save to Claim File ]       │ │
│                                                                   │
│  [ ✓ Acknowledge & Continue to Step 2 → ]                       │ │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                        DATA FLOW                                  │
└──────────────────────────────────────────────────────────────────┘

USER UPLOADS FILES
    │
    ├─→ File Validation
    │   ├─→ Check file type (.pdf, .doc, .docx, .txt)
    │   ├─→ Check file size (< 10MB)
    │   └─→ Add to uploadedFiles array
    │
    ├─→ Display File List
    │   └─→ Show file name, size, remove button
    │
    └─→ Show Metadata Form
        └─→ Collect: policy number, company, type, claim type

USER CLICKS "ANALYZE POLICY"
    │
    ├─→ Validate Form
    │   └─→ Ensure all required fields filled
    │
    ├─→ Create FormData
    │   ├─→ Append files
    │   ├─→ Append metadata
    │   └─→ Prepare for API call
    │
    ├─→ Show Progress Indicator
    │   └─→ Display sequential progress messages
    │
    ├─→ Call AI Backend (PRODUCTION)
    │   │
    │   └─→ POST /.netlify/functions/ai-policy-review
    │       │
    │       ├─→ BACKEND PROCESSING:
    │       │   ├─→ Extract text from PDFs
    │       │   ├─→ Parse policy structure
    │       │   ├─→ Call OpenAI GPT-4
    │       │   ├─→ Use coverage-extraction-engine.js
    │       │   └─→ Structure response
    │       │
    │       └─→ Return JSON:
    │           {
    │             policyNumber,
    │             insuranceCompany,
    │             policyType,
    │             claimType,
    │             summary,
    │             coverages: [...],
    │             endorsements: [...],
    │             exclusions: [...],
    │             deadlines: [...],
    │             duties: [...]
    │           }
    │
    └─→ OR Use Mock Data (DEVELOPMENT)
        └─→ generateMockAnalysis()

RECEIVE ANALYSIS RESULT
    │
    ├─→ Store in analysisResult variable
    │
    ├─→ Save to LocalStorage
    │   └─→ saveClaimData('policyAnalysis', result)
    │
    ├─→ Hide Progress, Show Report
    │
    └─→ Render Report Sections
        │
        ├─→ Executive Summary
        │   ├─→ Display summary text
        │   └─→ Calculate & display stats
        │
        ├─→ Coverage Table
        │   └─→ Loop through coverages array
        │       └─→ Create table rows
        │
        ├─→ Endorsements
        │   └─→ Loop through endorsements array
        │       └─→ Create badge elements
        │
        ├─→ Exclusions
        │   └─→ Loop through exclusions array
        │       └─→ Create warning cards
        │
        ├─→ Deadlines
        │   └─→ Loop through deadlines array
        │       └─→ Create deadline cards
        │
        └─→ Duties
            └─→ Loop through duties array
                └─→ Create checklist items

USER ACTIONS
    │
    ├─→ Download PDF
    │   ├─→ Use jsPDF library
    │   ├─→ Format report content
    │   └─→ Save as PDF file
    │
    ├─→ Save to Database
    │   ├─→ Get Supabase client
    │   ├─→ Insert into policy_analyses table
    │   └─→ Show success message
    │
    └─→ Acknowledge & Continue
        ├─→ Mark step1_complete = true
        ├─→ Save to localStorage
        └─→ Navigate to step 2
```

---

## 🎨 Component Breakdown

```
┌──────────────────────────────────────────────────────────────────┐
│                     COMPONENT STRUCTURE                           │
└──────────────────────────────────────────────────────────────────┘

policy-analyzer-complete.html
│
├─ <head>
│  ├─ Meta tags
│  ├─ Title
│  ├─ External CSS (Inter font, tool-visual-alignment.css)
│  ├─ External JS (claimStorage.js)
│  └─ <style> (Custom styles for this tool)
│
└─ <body class="tool-page">
   │
   ├─ Tool Header
   │  ├─ h1: "📋 Policy Analyzer & Intelligence Report"
   │  └─ p: Subtitle
   │
   └─ Tool Content Area
      │
      ├─ SECTION 1: Upload Section (id="uploadSection")
      │  │
      │  ├─ Alert Box (What to Upload)
      │  │
      │  ├─ Upload Zone (id="uploadZone")
      │  │  ├─ Upload icon
      │  │  ├─ Drag & drop text
      │  │  └─ Hidden file input
      │  │
      │  ├─ File List (id="fileList")
      │  │  └─ File Items (dynamically generated)
      │  │     ├─ File icon
      │  │     ├─ File name
      │  │     ├─ File size
      │  │     └─ Remove button
      │  │
      │  └─ Metadata Form (id="metadataForm")
      │     ├─ Policy Number input
      │     ├─ Insurance Company input
      │     ├─ Policy Type dropdown
      │     ├─ Claim Type dropdown
      │     └─ Analyze button
      │
      ├─ SECTION 2: Analysis Progress (id="analysisSection")
      │  ├─ Progress spinner (animated)
      │  ├─ Progress text
      │  └─ Progress detail (changes during analysis)
      │
      ├─ SECTION 3: Report Display (id="reportSection")
      │  │
      │  ├─ Executive Summary Box
      │  │  ├─ Title
      │  │  ├─ Summary text
      │  │  └─ Stat Grid
      │  │     ├─ Coverages count
      │  │     ├─ Endorsements count
      │  │     ├─ Exclusions count
      │  │     └─ Deadlines count
      │  │
      │  ├─ Coverage Limits Section
      │  │  ├─ Section title with icon
      │  │  └─ Coverage table
      │  │     ├─ Table header
      │  │     └─ Table body (dynamically populated)
      │  │
      │  ├─ Endorsements Section
      │  │  ├─ Section title with icon
      │  │  └─ Endorsements list (badge elements)
      │  │
      │  ├─ Exclusions Section
      │  │  ├─ Section title with icon
      │  │  └─ Exclusions list (warning cards)
      │  │
      │  ├─ Deadlines Section
      │  │  ├─ Section title with icon
      │  │  └─ Deadlines list (deadline cards)
      │  │
      │  ├─ Duties Section
      │  │  ├─ Section title with icon
      │  │  └─ Duties list (checklist)
      │  │
      │  └─ Action Buttons
      │     ├─ Download PDF
      │     ├─ Save to Database
      │     └─ Acknowledge & Continue
      │
      └─ Back Button
         └─ Back to Claim Guide
```

---

## 🎯 State Management

```
┌──────────────────────────────────────────────────────────────────┐
│                     STATE MANAGEMENT                              │
└──────────────────────────────────────────────────────────────────┘

GLOBAL VARIABLES
├─ uploadedFiles: []           // Array of File objects
└─ analysisResult: null        // Analysis result object

LOCALSTORAGE KEYS
├─ 'policyAnalysis'            // Full analysis result
├─ 'tool_policy-analyzer_complete'  // Completion flag
└─ 'step1_complete'            // Step completion flag

ANALYSIS RESULT STRUCTURE
{
  policyNumber: string,
  insuranceCompany: string,
  policyType: string,
  claimType: string,
  analyzedAt: ISO timestamp,
  summary: string,
  coverages: [
    {
      name: string,
      limit: string,
      deductible: string,
      description: string
    }
  ],
  endorsements: string[],
  exclusions: string[],
  deadlines: [
    {
      task: string,
      timeframe: string,
      critical: boolean
    }
  ],
  duties: string[]
}

STATE TRANSITIONS
┌─────────────┐
│   Initial   │  uploadedFiles = []
│             │  analysisResult = null
└──────┬──────┘
       │
       │ User uploads files
       ↓
┌─────────────┐
│  Files      │  uploadedFiles = [file1, file2, ...]
│  Uploaded   │  analysisResult = null
└──────┬──────┘
       │
       │ User clicks Analyze
       ↓
┌─────────────┐
│ Analyzing   │  uploadedFiles = [...]
│             │  analysisResult = null
└──────┬──────┘
       │
       │ Analysis complete
       ↓
┌─────────────┐
│  Report     │  uploadedFiles = [...]
│  Generated  │  analysisResult = {...}
└──────┬──────┘
       │
       │ User acknowledges
       ↓
┌─────────────┐
│  Complete   │  step1_complete = true
│             │  Navigate to Step 2
└─────────────┘
```

---

## 🔧 Function Reference

```
┌──────────────────────────────────────────────────────────────────┐
│                     KEY FUNCTIONS                                 │
└──────────────────────────────────────────────────────────────────┘

INITIALIZATION
├─ DOMContentLoaded
│  ├─ setupUploadZone()
│  └─ loadSavedAnalysis()

UPLOAD HANDLING
├─ setupUploadZone()           // Sets up drag & drop
├─ handleFiles(files)          // Processes uploaded files
├─ renderFileList()            // Displays file list
├─ removeFile(index)           // Removes a file
└─ formatFileSize(bytes)       // Formats file size display

ANALYSIS
├─ analyzePolicy()             // Main analysis function
├─ updateProgress(message)     // Updates progress text
├─ sleep(ms)                   // Async delay utility
└─ generateMockAnalysis()      // Creates mock data (dev only)

REPORT DISPLAY
├─ displayReport(result)       // Renders full report
└─ loadSavedAnalysis()         // Loads saved analysis

ACTIONS
├─ exportPDF()                 // Exports report as PDF
├─ saveToDatabase()            // Saves to Supabase
├─ acknowledgeAndContinue()    // Marks complete & navigates
└─ goBack()                    // Returns to step guide

UTILITIES
├─ saveClaimData(key, value)   // Saves to localStorage
└─ getClaimData(key)           // Retrieves from localStorage
```

---

## 📱 Responsive Behavior

```
┌──────────────────────────────────────────────────────────────────┐
│                     RESPONSIVE DESIGN                             │
└──────────────────────────────────────────────────────────────────┘

DESKTOP (> 768px)
├─ Upload zone: Full width, 3rem padding
├─ Stat grid: 4 columns
├─ Coverage table: Full table display
├─ Action buttons: Horizontal row
└─ All sections: Full width

TABLET (481px - 768px)
├─ Upload zone: Full width, 2rem padding
├─ Stat grid: 2 columns
├─ Coverage table: Horizontal scroll
├─ Action buttons: Horizontal row (smaller)
└─ All sections: Full width

MOBILE (< 480px)
├─ Upload zone: Full width, 1.5rem padding
├─ Stat grid: 1 column (stacked)
├─ Coverage table: Vertical cards
├─ Action buttons: Vertical stack
└─ All sections: Full width, reduced padding
```

---

## 🎨 Color Scheme

```
┌──────────────────────────────────────────────────────────────────┐
│                     COLOR PALETTE                                 │
└──────────────────────────────────────────────────────────────────┘

PRIMARY COLORS
├─ Navy Primary:    #0B2545  (Headers, buttons)
├─ Navy Dark:       #0B2545  (Text)
├─ Teal Primary:    #17BEBB  (Accents, stats)
└─ Teal Hover:      #13a09d  (Hover states)

BACKGROUND COLORS
├─ White:           #ffffff  (Cards, page)
├─ Light Gray:      #f9fafb  (Upload zone)
├─ Very Light:      #f7f9fc  (Table headers, stat cards)
└─ Gradient:        linear-gradient(135deg, #0B2545, #123A63)

BORDER COLORS
├─ Light:           #e5e7eb  (Cards, table)
├─ Medium:          #d1d5db  (Upload zone)
└─ Dark:            #9ca3af  (Emphasis)

TEXT COLORS
├─ Primary:         #1f2937  (Body text)
├─ Secondary:       #6b7280  (Subtitles)
└─ Muted:           #9ca3af  (Help text)

SEMANTIC COLORS
├─ Success:         #34d399  (Endorsements)
├─ Warning:         #fbbf24  (Deadlines)
├─ Error:           #ef4444  (Exclusions)
└─ Info:            #60a5fa  (Info boxes)
```

---

## ✅ Testing Checklist

```
┌──────────────────────────────────────────────────────────────────┐
│                     TESTING GUIDE                                 │
└──────────────────────────────────────────────────────────────────┘

UPLOAD FUNCTIONALITY
☐ Drag & drop single file
☐ Drag & drop multiple files
☐ Click to browse single file
☐ Click to browse multiple files
☐ File type validation (reject .exe, .zip, etc.)
☐ File size validation (reject > 10MB)
☐ Remove file functionality
☐ File list display accuracy
☐ Upload zone visual feedback (dragover)

FORM VALIDATION
☐ Empty policy number (should alert)
☐ Empty insurance company (should alert)
☐ Empty policy type (should alert)
☐ All fields filled (should proceed)
☐ Form persists after upload

ANALYSIS PROGRESS
☐ Progress indicator appears
☐ Spinner animates
☐ Progress messages update sequentially
☐ Upload section hides
☐ Progress completes successfully

REPORT DISPLAY
☐ Executive summary renders
☐ Stats calculate correctly
☐ Coverage table populates
☐ All 6 coverages display
☐ Endorsements display as badges
☐ Exclusions display as warnings
☐ Deadlines display with timeframes
☐ Duties display as checklist
☐ All sections visible

ACTIONS
☐ Download PDF button clickable
☐ Save to database button clickable
☐ Acknowledge & continue button works
☐ Navigation to Step 2 successful
☐ Back button returns to guide

STATE PERSISTENCE
☐ Analysis saves to localStorage
☐ Page reload shows saved analysis
☐ Completion flag set correctly
☐ State survives browser refresh

RESPONSIVE DESIGN
☐ Desktop layout (> 768px)
☐ Tablet layout (481-768px)
☐ Mobile layout (< 480px)
☐ Table scrolls on mobile
☐ Buttons stack on mobile

EDGE CASES
☐ No files uploaded (should alert)
☐ Partial form filled (should alert)
☐ Analysis error handling
☐ Network error handling
☐ Invalid file format
☐ Corrupted PDF
☐ Empty PDF
☐ Very large file (> 10MB)
```

---

## 🚀 Deployment Checklist

```
┌──────────────────────────────────────────────────────────────────┐
│                     DEPLOYMENT STEPS                              │
└──────────────────────────────────────────────────────────────────┘

PRE-DEPLOYMENT
☐ Test with mock data
☐ Verify all sections render
☐ Test on multiple browsers
☐ Test on mobile devices
☐ Review console for errors
☐ Validate HTML/CSS

INTEGRATION
☐ Connect to AI backend API
☐ Test with real policy PDFs
☐ Verify text extraction works
☐ Validate AI response format
☐ Test error handling
☐ Add retry logic

DATABASE
☐ Create policy_analyses table
☐ Set up RLS policies
☐ Test save functionality
☐ Test load functionality
☐ Verify data integrity

PDF EXPORT
☐ Implement jsPDF logic
☐ Test PDF generation
☐ Verify PDF formatting
☐ Test download functionality
☐ Validate PDF content

PRODUCTION
☐ Update tool registry
☐ Test end-to-end flow
☐ Monitor error logs
☐ Collect user feedback
☐ Optimize performance
☐ Document known issues

POST-DEPLOYMENT
☐ Monitor usage analytics
☐ Track completion rates
☐ Gather user feedback
☐ Identify improvements
☐ Plan enhancements
```

This visual guide provides a complete picture of how the Policy Analyzer tool works, from user interaction to data flow to component structure!


