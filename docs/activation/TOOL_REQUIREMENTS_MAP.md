# Claim Navigator Tool Requirements Map
**Generated:** 2025-01-27  
**Purpose:** Complete mapping of all tool pages, their inputs, functions, and integration requirements

---

## TOOL PAGES IDENTIFIED

### 1. AI Response Agent
**File:** `/app/ai-response-agent.html`
**Status:** ✅ Exists
**Inputs:**
- Claim type (select)
- Insurer name (text)
- Denial letter text / Lowball offer / Delay description (textarea)
- Tone selector (professional, firm, escalation, attorney-style)
- User info (auto-filled from intake)

**AI Function:** `netlify/functions/ai-response-agent.js`
**Output:** JSON with `subject`, `body`, `next_steps`
**DB Writes:** `documents` table (type: 'response_letter')
**PDF Output:** ✅ Required
**File Storage:** Optional (upload denial letter PDF)
**Controller:** `app/assets/js/tools/ai-response-agent.js`

---

### 2. Document Generator
**File:** `/app/document-generator-v2/document-generator.html`
**Status:** ✅ Exists
**Inputs:**
- Template type (dropdown)
- Dynamic form fields based on template
- User inputs (JSON)

**AI Function:** `netlify/functions/ai-document-generator.js`
**Output:** `document_text`, `subject_line`
**DB Writes:** `documents` table
**PDF Output:** ✅ Required
**File Storage:** None
**Controller:** `app/assets/js/tools/document-generator.js`

---

### 3. Statement of Loss (Proof of Loss)
**File:** `/app/statement-of-loss.html`
**Status:** ✅ Exists
**Inputs:**
- Insured name
- Policy number
- Date of loss
- Loss location
- Line items table (description, quantity, unit cost, total)

**AI Function:** `netlify/functions/ai-document-generator.js` (template_type: "proof_of_loss")
**Output:** Complete proof of loss document
**DB Writes:** `documents` table (type: 'proof_of_loss')
**PDF Output:** ✅ Required
**File Storage:** None
**Controller:** `app/assets/js/tools/statement-of-loss.js`

---

### 4. Evidence Organizer
**File:** `/app/evidence-organizer.html`
**Status:** ✅ Exists
**Inputs:**
- File uploads (PDF, DOCX, JPG, PNG, MP4)
- Category (estimate, invoice, photo, email, receipt)
- Notes (textarea)
- Related document ID (optional)

**AI Function:** `netlify/functions/ai-evidence-auto-tagger.js` (optional auto-tagging)
**Output:** Evidence items with metadata
**DB Writes:** `evidence_items` table
**PDF Output:** Evidence report (optional)
**File Storage:** ✅ Required - Supabase Storage bucket `evidence/`
**Controller:** `app/assets/js/tools/evidence-organizer.js`

---

### 5. Coverage Decoder
**File:** `/app/resource-center/coverage-decoder.html`
**Status:** ✅ Exists
**Inputs:**
- Policy text (textarea) OR policy file upload

**AI Function:** `netlify/functions/ai-coverage-decoder.js`
**Output:** JSON with `summary`, `limits`, `deductibles`, `exclusions`, `deadlines`
**DB Writes:** `policy_summaries` table
**PDF Output:** Coverage summary PDF (optional)
**File Storage:** Policy file upload to `policies/` bucket (optional)
**Controller:** `app/assets/js/tools/coverage-decoder.js`

---

### 6. Timeline & Deadlines
**File:** `/app/timeline.html` + `/app/deadlines.html`
**Status:** ✅ Exists
**Inputs:**
- Date of Loss
- Notice of Claim date
- Denial letter date
- Last payment date
- Inspection dates
- Other key dates

**AI Function:** `netlify/functions/ai-timeline-analyzer.js`
**Output:** Suggested deadlines array
**DB Writes:** `deadlines` table
**PDF Output:** Timeline PDF (optional)
**File Storage:** None
**Controller:** `app/assets/js/tools/deadlines-tracker.js`

---

### 7. ROM Estimator
**File:** `/app/rom-tool.html`
**Status:** ✅ Exists
**Inputs:**
- Damage Category (select: fire, water, roof, contents, structural)
- Severity Level (select: minor, moderate, severe, total_loss)
- Square Feet Affected (number)

**AI Function:** `netlify/functions/ai-rom-estimator.js`
**Output:** Estimate range, explanation, breakdown
**DB Writes:** `rom_estimates` table (if exists) or `documents` table
**PDF Output:** ✅ Required
**File Storage:** None
**Controller:** `app/assets/js/tools/rom-estimator.js`

---

### 8. Claim Stage Tracker
**File:** `/app/claim-stage-tracker.html`
**Status:** ✅ Exists
**Inputs:**
- Current stage (select)
- Stage notes
- Stage dates

**AI Function:** None (tracking only)
**Output:** Stage visualization
**DB Writes:** `claim_stages` table (if exists) or custom tracking
**PDF Output:** Stage report (optional)
**File Storage:** None
**Controller:** `app/assets/js/tools/claim-stage-tracker.js`

---

### 9. Policy Review & Coverage Analysis
**File:** `/app/claim-analysis-tools/policy.html`
**Status:** ✅ Exists
**Inputs:**
- Policy text (textarea)
- Policy type (select)
- Jurisdiction (select)

**AI Function:** `netlify/functions/ai-policy-review.js`
**Output:** Coverage summary, exclusions, recommendations
**DB Writes:** `policy_summaries` table
**PDF Output:** ✅ Required
**File Storage:** Policy file upload (optional)
**Controller:** `app/assets/js/tools/claim-analysis-policy-review.js`

---

### 10. Damage Assessment Calculator
**File:** `/app/claim-analysis-tools/damage.html`
**Status:** ✅ Exists
**Inputs:**
- Damage description (textarea)
- Damage areas (checkboxes)
- Damage table (rows with item, description, cost)
- Photos upload

**AI Function:** `netlify/functions/ai-damage-assessment.js`
**Output:** Damage assessment report, cost breakdown
**DB Writes:** `documents` table (type: 'damage_assessment')
**PDF Output:** ✅ Required
**File Storage:** Photo uploads to `evidence/` bucket
**Controller:** `app/assets/js/tools/claim-analysis-damage.js`

---

### 11. Estimate Review & Comparison
**File:** `/app/claim-analysis-tools/estimates.html`
**Status:** ✅ Exists
**Inputs:**
- Estimate files upload (PDF, DOC, DOCX, TXT, XLSX)
- Comparison criteria

**AI Function:** `netlify/functions/ai-estimate-comparison.js`
**Output:** Comparison report, discrepancies, recommendations
**DB Writes:** `documents` table (type: 'estimate_comparison')
**PDF Output:** ✅ Required
**File Storage:** Estimate files to `evidence/` bucket
**Controller:** `app/assets/js/tools/claim-analysis-estimate.js`

---

### 12. Business Interruption Calculator
**File:** `/app/claim-analysis-tools/business.html`
**Status:** ✅ Exists
**Inputs:**
- Business name
- Interruption start/end dates
- Monthly revenue
- Extra expenses
- Business type

**AI Function:** `netlify/functions/ai-business-interruption.js`
**Output:** BI calculation, lost revenue, extra expenses
**DB Writes:** `documents` table (type: 'business_interruption')
**PDF Output:** ✅ Required
**File Storage:** None
**Controller:** `app/assets/js/tools/claim-analysis-business-interruption.js`

---

### 13. Settlement Analysis & Negotiation
**File:** `/app/claim-analysis-tools/settlement.html`
**Status:** ✅ Exists
**Inputs:**
- Settlement offer amount
- Claim value estimate
- Policy limits
- Negotiation strategy preferences

**AI Function:** `netlify/functions/ai-negotiation-advisor.js`
**Output:** Settlement analysis, negotiation strategy, counter-offer recommendations
**DB Writes:** `documents` table (type: 'settlement_analysis')
**PDF Output:** ✅ Required
**File Storage:** None
**Controller:** `app/assets/js/tools/claim-analysis-negotiation.js`

---

### 14. Situational Advisory
**File:** `/app/situational-advisory.html`
**Status:** ✅ Exists
**Inputs:**
- Situation description (textarea)
- Claim type
- Current status

**AI Function:** `netlify/functions/ai-situational-advisory.js`
**Output:** Advisory response, recommendations, next steps
**DB Writes:** `documents` table (type: 'advisory')
**PDF Output:** ✅ Required
**File Storage:** None
**Controller:** `app/assets/js/tools/situational-advisory.js`

---

### 15. Claim Journal
**File:** `/app/claim-journal.html`
**Status:** ✅ Exists
**Inputs:**
- Journal entry date
- Entry type (call, email, submission, inspection, etc.)
- Entry description
- Related documents

**AI Function:** None (tracking only)
**Output:** Journal entries list
**DB Writes:** `claim_journal` table (if exists) or `documents` table
**PDF Output:** Journal export (optional)
**File Storage:** Document attachments (optional)
**Controller:** `app/assets/js/tools/claim-journal.js`

---

## SHARED REQUIREMENTS

### Intake Profile Fields (Auto-fill)
- Insured name
- Insurer name
- Claim number
- Policy number
- Date of loss
- Property address
- Carrier contact info
- Email

### Common Functions Needed
1. **Auth Check:** `requireAuth()` from `auth.js`
2. **Payment Check:** `checkPaymentStatus()` from `auth.js`
3. **File Upload:** `uploadToStorage()` from `storage.js`
4. **PDF Generation:** `generatePDF()` calls `/.netlify/functions/generate-pdf.js`
5. **Save to DB:** Direct Supabase client calls
6. **Autofill:** `loadIntakeProfile()` from `autofill.js`

### Database Tables Used
- `intake_profile` - User intake data
- `documents` - All generated documents
- `evidence_items` - Uploaded evidence files
- `policy_summaries` - Policy analysis results
- `deadlines` - Deadline tracking
- `rom_estimates` - ROM estimates (if table exists)
- `claim_stages` - Stage tracking (if table exists)
- `claim_journal` - Journal entries (if table exists)

### Storage Buckets
- `evidence/` - Evidence files, photos, documents
- `documents/` - Generated PDFs
- `policies/` - Policy documents

---

## INTEGRATION PRIORITY

### High Priority (Core Tools)
1. AI Response Agent
2. Document Generator
3. Statement of Loss
4. Evidence Organizer
5. Coverage Decoder

### Medium Priority (Analysis Tools)
6. Policy Review
7. Damage Assessment
8. Estimate Comparison
9. Business Interruption
10. Settlement Analysis

### Lower Priority (Tracking Tools)
11. Timeline & Deadlines
12. ROM Estimator
13. Claim Stage Tracker
14. Situational Advisory
15. Claim Journal

---

**END OF TOOL REQUIREMENTS MAP**



