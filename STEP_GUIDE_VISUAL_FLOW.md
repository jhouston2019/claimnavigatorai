# Step-by-Step Claim Guide - Visual Flow Diagrams

## 1. Page Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     STEP-BY-STEP-CLAIM-GUIDE.HTML               │
│                         (6,192 lines)                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ HEADER SECTION (Lines 1-106)                               │ │
│  │ • Meta tags & title                                        │ │
│  │ • External CSS/JS dependencies                             │ │
│  │ • Authentication guard (DISABLED)                          │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ CSS STYLING (Lines 107-3122)                               │ │
│  │ • Design system variables                                  │ │
│  │ • Navigation styles                                        │ │
│  │ • Accordion styles                                         │ │
│  │ • Tool link styles                                         │ │
│  │ • Report section styles                                    │ │
│  │ • Modal styles                                             │ │
│  │ • Responsive media queries                                 │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ HTML BODY (Lines 3123-3481)                                │ │
│  │ ┌──────────────────────────────────────────────────────┐   │ │
│  │ │ Navigation Bar                                       │   │ │
│  │ └──────────────────────────────────────────────────────┘   │ │
│  │ ┌──────────────────────────────────────────────────────┐   │ │
│  │ │ Page Header + Progress Bar                          │   │ │
│  │ └──────────────────────────────────────────────────────┘   │ │
│  │ ┌──────────────────────────────────────────────────────┐   │ │
│  │ │ Claim Info Panel (Collapsible)                      │   │ │
│  │ └──────────────────────────────────────────────────────┘   │ │
│  │ ┌──────────────────────────────────────────────────────┐   │ │
│  │ │ Step Accordion Container                            │   │ │
│  │ │  ┌────────────────────────────────────────────────┐ │   │ │
│  │ │  │ Step 1: Upload Policy [In Progress]           │ │   │ │
│  │ │  │  (Content loaded by JavaScript)               │ │   │ │
│  │ │  └────────────────────────────────────────────────┘ │   │ │
│  │ │  ┌────────────────────────────────────────────────┐ │   │ │
│  │ │  │ Step 2: Understand Duties [Upcoming]          │ │   │ │
│  │ │  └────────────────────────────────────────────────┘ │   │ │
│  │ │  ┌────────────────────────────────────────────────┐ │   │ │
│  │ │  │ Step 3: Report Loss [Upcoming]                │ │   │ │
│  │ │  └────────────────────────────────────────────────┘ │   │ │
│  │ │  ... (Steps 4-14)                                   │   │ │
│  │ └──────────────────────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ JAVASCRIPT LOGIC (Lines 3482-6192)                         │ │
│  │ • Global functions                                         │ │
│  │ • stepData object (14 steps)                               │ │
│  │ • State management                                         │ │
│  │ • UI update functions                                      │ │
│  │ • Tool path mapping                                        │ │
│  │ • Event listeners                                          │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. User Interaction Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER JOURNEY                              │
└─────────────────────────────────────────────────────────────────┘

1. PAGE LOAD
   │
   ├─→ Authentication Check (Currently Disabled)
   │
   ├─→ Load Saved State from LocalStorage
   │   • currentStep
   │   • completedSteps
   │   • taskCompletion
   │   • claimInfo
   │
   ├─→ Render UI
   │   • Update progress bar
   │   • Update step statuses
   │   • Populate claim info panel
   │
   └─→ Auto-open Step 1 (if first visit)

2. USER CLICKS STEP 2 HEADER
   │
   ├─→ openStep(2) called
   │
   ├─→ Check if already active
   │   │
   │   ├─→ If YES: Close step (remove 'active' class)
   │   │
   │   └─→ If NO: Open step
   │       │
   │       ├─→ Add 'active' class
   │       │
   │       ├─→ loadStepContent(2)
   │       │   │
   │       │   ├─→ Get stepData[2]
   │       │   │
   │       │   ├─→ buildStepContent(2, data)
   │       │   │   │
   │       │   │   ├─→ Generate HTML:
   │       │   │   │   • Primary action section
   │       │   │   │   • Tool link
   │       │   │   │   • Report sections
   │       │   │   │   • Additional tools
   │       │   │   │   • Info note
   │       │   │   │
   │       │   │   └─→ Return HTML string
   │       │   │
   │       │   └─→ Inject HTML into .accordion-content
   │       │
   │       └─→ Update currentStep = 2

3. USER CLICKS "USE: COMPLIANCE REVIEW TOOL"
   │
   ├─→ getToolPath('compliance-review')
   │   │
   │   └─→ Returns: 'app/tools/compliance-review.html'
   │
   ├─→ Browser navigates to tool page
   │
   ├─→ User interacts with tool
   │   • Uploads documents
   │   • AI analyzes
   │   • Report generated
   │
   ├─→ Tool saves output to localStorage/database
   │
   └─→ User clicks "Back to Step Guide"

4. USER RETURNS TO STEP GUIDE
   │
   ├─→ Page reloads
   │
   ├─→ loadSavedState() retrieves progress
   │
   ├─→ hasPrimaryToolOutput(2) checks for report
   │   │
   │   └─→ Returns: true (report exists)
   │
   └─→ "Acknowledge Step 2" button enabled

5. USER CLICKS "ACKNOWLEDGE STEP 2"
   │
   ├─→ acknowledgeStep(2) called
   │
   ├─→ Validate primary tool output exists
   │   │
   │   ├─→ If NO: Show alert "Cannot acknowledge"
   │   │
   │   └─→ If YES: Continue
   │
   ├─→ Update state:
   │   • completedSteps.push(2)
   │   • taskCompletion[2] = [true, true, true]
   │
   ├─→ Log to timeline (async):
   │   • Event type: 'step_completed'
   │   • Step ID: 2
   │   • Timestamp
   │
   ├─→ saveState() to localStorage
   │
   ├─→ Update UI:
   │   • Progress bar: 14% → 21%
   │   • Step 2 badge: "Upcoming" → "Completed"
   │   • Step 3 badge: "Upcoming" → "In Progress"
   │
   ├─→ Show alert: "✅ Step 2 Acknowledged!"
   │
   └─→ Auto-open Step 3 (after 500ms delay)

6. AUTO-SAVE (Every 30 seconds)
   │
   └─→ saveState() called automatically
       • Prevents data loss
       • Silent operation (no alert)
```

---

## 3. Step Data Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                        stepData OBJECT                           │
└─────────────────────────────────────────────────────────────────┘

stepData = {
  1: {
    ┌──────────────────────────────────────────────────────────┐
    │ METADATA                                                 │
    ├──────────────────────────────────────────────────────────┤
    │ • label: "STEP 1 OF 14"                                  │
    │ • title: "Upload your insurance policy..."              │
    │ • subtitle: "Upload your policy documents..."           │
    └──────────────────────────────────────────────────────────┘
    
    ┌──────────────────────────────────────────────────────────┐
    │ PRIMARY ACTION (Required)                                │
    ├──────────────────────────────────────────────────────────┤
    │ • title: "Upload Policy & Generate Analysis"            │
    │ • description: "Upload all policy documents..."         │
    │ • tool: {                                                │
    │     id: 'policy-uploader',                              │
    │     title: 'Upload Policy Documents',                   │
    │     classification: 'required'                          │
    │   }                                                      │
    └──────────────────────────────────────────────────────────┘
    
    ┌──────────────────────────────────────────────────────────┐
    │ REPORT SECTIONS (AI-Generated Output)                    │
    ├──────────────────────────────────────────────────────────┤
    │ • title: "Policy Intelligence Report"                   │
    │ • description: "System-generated analysis..."           │
    │ • viewTool: {                                            │
    │     id: 'policy-report-viewer',                         │
    │     title: 'View Policy Intelligence Report',           │
    │     classification: 'required'                          │
    │   }                                                      │
    │ • sections: [                                            │
    │     'Executive Summary',                                │
    │     'Covered Losses & Property',                        │
    │     'Coverage Limits & Sublimits',                      │
    │     'Endorsements & Riders',                            │
    │     'Exclusions & Restrictions',                        │
    │     'Loss Settlement Terms (ACV/RCV)',                  │
    │     'Policyholder Duties',                              │
    │     'Deadlines & Time Requirements',                    │
    │     'ALE Rules',                                         │
    │     'Contents Coverage Rules',                          │
    │     'Critical Risk Flags',                              │
    │     'Next Moves'                                         │
    │   ]                                                      │
    └──────────────────────────────────────────────────────────┘
    
    ┌──────────────────────────────────────────────────────────┐
    │ INFO NOTE                                                │
    ├──────────────────────────────────────────────────────────┤
    │ "Note: This policy analysis defines what is covered,    │
    │  how your claim will be paid, and which rules apply."   │
    └──────────────────────────────────────────────────────────┘
    
    ┌──────────────────────────────────────────────────────────┐
    │ ADDITIONAL TOOLS (Optional)                              │
    ├──────────────────────────────────────────────────────────┤
    │ • Coverage Q&A Chat                                      │
    │ • Coverage Clarification Request Letter                 │
    │ • Policy Interpretation Confirmation Letter             │
    │ • Download Policy Intelligence Report                   │
    └──────────────────────────────────────────────────────────┘
  },
  
  2: { ... },
  3: { ... },
  ...
  14: { ... }
}
```

---

## 4. Tool Path Mapping

```
┌─────────────────────────────────────────────────────────────────┐
│                    TOOL REGISTRY SYSTEM                          │
└─────────────────────────────────────────────────────────────────┘

getToolPath(toolId) → Returns file path

EXAMPLES:

┌─────────────────────────────────────┬──────────────────────────────────┐
│ Tool ID                             │ File Path                        │
├─────────────────────────────────────┼──────────────────────────────────┤
│ 'policy-uploader'                   │ app/tools/policy-uploader.html   │
│ 'policy-report-viewer'              │ app/tools/policy-report-viewer...│
│ 'compliance-review'                 │ app/tools/compliance-review.html │
│ 'fnol-generator'                    │ app/document-library/first-no... │
│ 'damage-documentation'              │ app/tools/damage-documentation...│
│ 'estimate-review'                   │ app/tools/estimate-review.html   │
│ 'estimate-comparison'               │ app/tools/estimate-comparison... │
│ 'coverage-alignment'                │ app/tools/coverage-alignment.html│
│ 'ale-tracker'                       │ app/tools/ale-tracker.html       │
│ 'contents-inventory'                │ app/tools/contents-inventory.html│
│ 'contents-valuation'                │ app/tools/contents-valuation.html│
│ 'claim-package-assembly'            │ app/tools/claim-package-assemb...│
│ 'claim-submitter'                   │ app/tools/claim-submitter.html   │
│ 'carrier-response'                  │ app/tools/carrier-response.html  │
│ 'supplement-analysis'               │ app/tools/supplement-analysis... │
└─────────────────────────────────────┴──────────────────────────────────┘

Total: 80+ tool mappings
```

---

## 5. State Management Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    STATE PERSISTENCE                             │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ LOCALSTORAGE: 'claimNavigatorState'                             │
├──────────────────────────────────────────────────────────────────┤
│ {                                                                │
│   currentStep: 2,                                                │
│   completedSteps: [1],                                           │
│   taskCompletion: {                                              │
│     1: [true, true, true],                                       │
│     2: [true, false, false]                                      │
│   },                                                             │
│   claimInfo: {                                                   │
│     claimNumber: "CLM-2024-089456",                              │
│     dateOfLoss: "November 15, 2024",                             │
│     daysSinceLoss: "45 days",                                    │
│     insurerName: "State Farm",                                   │
│     adjusterName: "Mike Johnson",                                │
│     claimStatus: "Active - Under Review"                         │
│   },                                                             │
│   lastSaved: "2025-01-07T10:30:45.123Z"                          │
│ }                                                                │
└──────────────────────────────────────────────────────────────────┘

SAVE TRIGGERS:
• User clicks "Save Progress"
• User acknowledges step
• Auto-save every 30 seconds
• Window beforeunload event
• User edits claim info

LOAD TRIGGERS:
• Page load (DOMContentLoaded)
• User returns from tool page
```

---

## 6. Data Cascade Between Steps

```
┌─────────────────────────────────────────────────────────────────┐
│                    STEP DEPENDENCIES                             │
└─────────────────────────────────────────────────────────────────┘

STEP 1: Policy Upload
  │
  ├─→ Outputs: Policy Intelligence Report
  │   • Coverage limits
  │   • Endorsements
  │   • Policyholder duties
  │   • ALE rules
  │   • Contents rules
  │
  └─→ Feeds into:
      ├─→ STEP 2: Compliance Review (imports duties)
      ├─→ STEP 7: Coverage Alignment (imports limits)
      ├─→ STEP 8: ALE Tracker (imports ALE rules)
      ├─→ STEP 9: Contents Inventory (imports contents rules)
      └─→ STEP 10: Contents Valuation (imports settlement terms)

STEP 4: Damage Documentation
  │
  ├─→ Outputs: Damage Documentation Report
  │   • Structural damage photos
  │   • Contents damage photos
  │   • Cause of loss evidence
  │
  └─→ Feeds into:
      ├─→ STEP 5: Estimate Review (validates scope)
      ├─→ STEP 6: Estimate Comparison (validates completeness)
      └─→ STEP 11: Claim Package (includes evidence)

STEP 5: Contractor Estimate
  │
  ├─→ Outputs: Estimate Quality Report
  │   • Scope of work
  │   • Line items
  │   • Pricing
  │
  └─→ Feeds into:
      ├─→ STEP 6: Estimate Comparison (baseline for comparison)
      ├─→ STEP 11: Claim Package (includes estimate)
      └─→ STEP 14: Supplement Analysis (baseline for underpayment)

STEP 6: Estimate Comparison
  │
  ├─→ Outputs: Estimate Comparison Report
  │   • Discrepancies
  │   • Scope gaps
  │   • Pricing deltas
  │
  └─→ Feeds into:
      ├─→ STEP 11: Claim Package (includes comparison)
      ├─→ STEP 12: Negotiation (talking points)
      └─→ STEP 14: Supplement Analysis (identifies underpayment)

STEP 9: Contents Inventory
  │
  ├─→ Outputs: Inventory Completeness Report
  │   • Room-by-room list
  │   • Item descriptions
  │   • Quantities
  │
  └─→ Feeds into:
      ├─→ STEP 10: Contents Valuation (items to value)
      └─→ STEP 11: Claim Package (includes inventory)

STEP 10: Contents Valuation
  │
  ├─→ Outputs: Contents Valuation Report
  │   • RCV totals
  │   • ACV totals
  │   • Depreciation
  │
  └─→ Feeds into:
      ├─→ STEP 11: Claim Package (includes valuation)
      └─→ STEP 14: Supplement Analysis (baseline for underpayment)

STEPS 1-10: All Reports
  │
  └─→ Feed into:
      └─→ STEP 11: Claim Package Assembly
          • Compiles all reports
          • Evaluates completeness
          • Generates submission package
```

---

## 7. UI Component Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                    VISUAL HIERARCHY                              │
└─────────────────────────────────────────────────────────────────┘

GLOBAL HEADER (Sticky)
├─→ Brand Logo
├─→ Navigation Menu
│   ├─→ Dashboard
│   ├─→ Resources
│   ├─→ Tools (Dropdown)
│   └─→ Document Library (Dropdown)
└─→ User Account (if logged in)

PAGE HEADER
├─→ Title: "Claim Management Center"
├─→ Subtitle: "Step-by-step claim management..."
└─→ Disclaimer Text

PROGRESS BAR (Quiet)
├─→ Text: "Step 2 of 14"
└─→ Visual Bar: [███░░░░░░░░░░░] 14%

CLAIM INFO PANEL (Collapsible)
├─→ Header
│   ├─→ Title: "Your Claim Information"
│   ├─→ Summary: "CLM-2024-089456 • State Farm"
│   ├─→ Edit Button
│   └─→ Toggle Icon: ▼
└─→ Content (when expanded)
    ├─→ Claim Details Grid
    │   ├─→ Claim Number
    │   ├─→ Insurance Company
    │   ├─→ Claim Status
    │   ├─→ Date of Loss
    │   ├─→ Days Since Loss
    │   └─→ Adjuster Name
    └─→ Deadline Alert

STEP ACCORDION
├─→ Step 1 (Accordion Item)
│   ├─→ Header (Always Visible)
│   │   ├─→ Step Number Badge: "1"
│   │   ├─→ Title: "Upload your insurance policy..."
│   │   ├─→ Subtitle: "Upload your policy documents..."
│   │   ├─→ Status Badge: "In Progress"
│   │   └─→ Toggle Arrow: ▼
│   └─→ Content (Visible when expanded)
│       ├─→ Primary Action Container
│       │   ├─→ Title: "Upload Policy & Generate Analysis"
│       │   ├─→ Description
│       │   └─→ Tool Link: [→ Use: Upload Policy Documents [required]]
│       ├─→ Report Sections Container
│       │   ├─→ Title: "Policy Intelligence Report"
│       │   ├─→ Description
│       │   ├─→ View Tool Link
│       │   └─→ Sections List (12 items)
│       ├─→ Info Note
│       └─→ Additional Tools (4 items)
├─→ Step 2 (Accordion Item)
│   └─→ ... (same structure)
├─→ Step 3 (Accordion Item)
│   └─→ ... (same structure)
...
└─→ Step 14 (Accordion Item)
    └─→ ... (same structure)

POST-CLAIM SECTION (Hidden until Step 10 complete)
├─→ Title: "Your Claim File Is Now a Permanent Asset"
├─→ Description
└─→ Action Buttons
    ├─→ Download Complete Claim File
    └─→ View Archived Documents
```

---

## 8. Event Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    EVENT LISTENERS                               │
└─────────────────────────────────────────────────────────────────┘

USER ACTION                  EVENT HANDLER              RESULT
─────────────────────────────────────────────────────────────────
Click step header       →    openStep(stepNum)    →    Toggle accordion
Click tool link         →    getToolPath(id)      →    Navigate to tool
Click Edit button       →    editClaimInfo()      →    Show prompts
Click Acknowledge       →    acknowledgeStep(n)   →    Mark complete
Press Ctrl+S            →    saveProgress()       →    Manual save
Press Arrow Right       →    nextStep()           →    Navigate forward
Press Arrow Left        →    previousStep()       →    Navigate back
Window beforeunload     →    saveState()          →    Auto-save
30-second timer         →    saveState()          →    Auto-save
DOMContentLoaded        →    initialize()         →    Load state & render

INTERNAL EVENTS
─────────────────────────────────────────────────────────────────
State change            →    updateUI()           →    Re-render interface
Step completed          →    updateProgressIndicator() → Update progress bar
Step completed          →    addTimelineEvent()   →    Log to timeline
Tool output saved       →    hasPrimaryToolOutput() → Enable Acknowledge
```

---

## 9. Critical Code Paths

```
┌─────────────────────────────────────────────────────────────────┐
│                    KEY FUNCTIONS                                 │
└─────────────────────────────────────────────────────────────────┘

1. PAGE INITIALIZATION
   DOMContentLoaded
   └─→ loadSavedState()
       ├─→ getClaimData('claimNavigatorState')
       ├─→ Parse JSON
       ├─→ Populate variables (currentStep, completedSteps, etc.)
       └─→ Update DOM elements with claim info
   
   └─→ updateUI()
       ├─→ updateProgressIndicator()
       │   ├─→ calculateProgress()
       │   ├─→ Update progress bar width
       │   └─→ Update progress text
       ├─→ updateStepStatuses()
       │   └─→ Update badge text (In Progress/Upcoming/Completed)
       └─→ highlightCurrentStep()
           └─→ Add visual emphasis to active step

2. STEP EXPANSION
   User clicks step header
   └─→ openStep(stepNum)
       ├─→ Get accordion item by data-step attribute
       ├─→ Check if already active
       ├─→ Toggle 'active' class
       └─→ loadStepContent(stepNum)
           ├─→ Check if content already loaded
           ├─→ Get stepData[stepNum]
           ├─→ buildStepContent(stepNum, data)
           │   ├─→ Generate primary action HTML
           │   ├─→ Generate report sections HTML
           │   ├─→ Generate info note HTML
           │   └─→ Generate additional tools HTML
           └─→ Inject HTML into .accordion-content

3. STEP COMPLETION
   User clicks "Acknowledge Step"
   └─→ acknowledgeStep(stepNum)
       ├─→ Validate: hasPrimaryToolOutput(stepNum)
       │   └─→ Check localStorage for report data
       ├─→ Update completedSteps array
       ├─→ Update taskCompletion object
       ├─→ Log to timeline (async)
       │   └─→ import timeline-autosync.js
       │       └─→ addTimelineEvent({...})
       ├─→ saveState()
       │   └─→ saveClaimData('claimNavigatorState', state)
       ├─→ updateUI()
       ├─→ Show success alert
       └─→ Auto-open next step (setTimeout 500ms)

4. STATE PERSISTENCE
   saveState()
   └─→ Serialize state object:
       {
         currentStep,
         completedSteps,
         taskCompletion,
         claimInfo: {
           claimNumber: DOM.getElementById('claimNumber').textContent,
           dateOfLoss: DOM.getElementById('dateOfLoss').textContent,
           ...
         },
         lastSaved: new Date().toISOString()
       }
   └─→ saveClaimData('claimNavigatorState', state)
       └─→ localStorage.setItem('claimNavigatorState', JSON.stringify(state))
```

---

## 10. Rendering Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                    HTML GENERATION FLOW                          │
└─────────────────────────────────────────────────────────────────┘

buildStepContent(stepNum, data)
│
├─→ Check data.primaryAction exists
│   │
│   ├─→ Generate Critical Warning (if data.isCritical)
│   │   └─→ <div class="step-critical-warning">...</div>
│   │
│   ├─→ Generate Primary Action Container
│   │   ├─→ <div class="primary-action-container">
│   │   ├─→   <h3>{data.primaryAction.title}</h3>
│   │   ├─→   <p>{data.primaryAction.description}</p>
│   │   └─→   <a href="{toolPath}" class="task-tool-inline">
│   │         └─→ → Use: {tool.title} [classification]
│   │
│   ├─→ Generate Report Sections Container
│   │   ├─→ <div class="report-sections-container">
│   │   ├─→   <h3>{data.reportSections.title}</h3>
│   │   ├─→   <p>{data.reportSections.description}</p>
│   │   ├─→   <a href="{viewToolPath}">View: {viewTool.title}</a>
│   │   └─→   <ul>
│   │         ├─→ <li>Executive Summary</li>
│   │         ├─→ <li>Covered Losses & Property</li>
│   │         └─→ ... (all sections)
│   │
│   └─→ Generate Info Note
│       └─→ <div class="step-info-note">
│           └─→ ℹ️ {data.infoNote}
│
└─→ Return complete HTML string
    │
    └─→ Injected into .accordion-content div
```

---

## Conclusion

This visual documentation shows how the `step-by-step-claim-guide.html` file orchestrates a complex workflow through:

1. **Structured Data** (stepData object)
2. **Dynamic Rendering** (buildStepContent function)
3. **State Persistence** (localStorage)
4. **Event-Driven Updates** (user interactions)
5. **Tool Integration** (getToolPath registry)
6. **Progress Tracking** (completion states)
7. **Data Cascade** (step dependencies)

The architecture allows for flexible step management while maintaining a consistent user experience across all 14 claim steps.


