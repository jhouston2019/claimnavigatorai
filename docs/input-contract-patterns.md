# INPUT CONTRACT PATTERNS BY LAYER

## Purpose
This document defines the exact input structures required for each tool layer. These patterns enforce credibility and prevent tools from collapsing into generic "paste everything" interfaces.

---

## L1 — SYSTEM / TRACKING

**Rule:** No AI input fields. Structured forms only.

### Required Input Types:
- Date inputs (`<input type="date">`)
- Status selectors (`<select>` with predefined options)
- Category selectors
- Numeric fields for amounts
- Short text fields for names/identifiers
- Optional brief notes field (max 2-3 rows)

### Example (ALE Tracker):
```html
<input type="date" name="expenseDate" required />
<select name="expenseCategory" required>
  <option value="lodging">Lodging</option>
  <option value="meals">Meals</option>
  ...
</select>
<input type="number" name="amount" step="0.01" required />
<textarea name="notes" rows="2" placeholder="Brief notes..."></textarea>
```

### ❌ NOT ALLOWED:
- Large textareas for unstructured input
- "Paste your claim details here" fields
- AI analysis buttons

---

## L2 — CALCULATION / RULE ENGINE

**Rule:** Numeric inputs and deterministic selectors only.

### Required Input Types:
- Numeric inputs (`<input type="number">`)
- Date inputs for time-based calculations
- State/jurisdiction selectors
- Calculation method selectors
- Formula parameter inputs

### Example (Depreciation Calculator):
```html
<input type="text" name="itemDescription" required />
<input type="number" name="originalCost" step="0.01" required />
<input type="number" name="itemAge" step="0.1" required />
<input type="number" name="usefulLife" step="1" required />
<select name="depreciationMethod" required>
  <option value="straight-line">Straight Line</option>
  <option value="declining-balance">Declining Balance</option>
</select>
```

### ❌ NOT ALLOWED:
- Free-text explanation fields
- "Tell us about your situation" textareas
- AI analysis or generation

---

## L3 — ANALYSIS / DETECTION

**Rule:** Document uploads, selectors, and optional short context field (max 500 chars).

### Required Input Types:
- File upload for policy/estimate/scope (`<input type="file">`)
- Document type selector
- Claim type selector
- Loss category selector
- Optional context field (max 500 characters with counter)

### Example (Policy Intelligence Engine):
```html
<input type="file" name="policyUpload" accept=".pdf,.doc,.docx,.txt" required />
<select name="policyType" required>
  <option value="homeowners">Homeowners (HO-3)</option>
  <option value="condo">Condo (HO-6)</option>
  ...
</select>
<select name="claimType" required>
  <option value="water">Water Damage</option>
  <option value="fire">Fire Damage</option>
  ...
</select>
<textarea name="analysisContext" rows="3" maxlength="500" placeholder="Brief context (max 500 characters)..."></textarea>
<small>Character count: <span id="charCount">0</span>/500</small>
```

### ❌ NOT ALLOWED:
- Large unstructured textareas
- "Paste everything" fields
- Unlimited context fields

---

## L4 — DOCUMENT / COMMUNICATION

**Rule:** Claim metadata, document type, tone, jurisdiction. No large unstructured "paste everything" textarea.

### Required Input Types:
- Claim metadata fields (policyholder name, claim number, carrier)
- Document type selector
- Tone selector (professional, firm, assertive, collaborative)
- State/jurisdiction selector
- Specific document content field (labeled appropriately)

### Example (Carrier Response Engine):
```html
<input type="text" name="policyholderName" required placeholder="Enter policyholder name" />
<input type="text" name="claimNumber" required placeholder="Enter claim number" />
<input type="text" name="carrierName" required placeholder="Enter carrier name" />
<select name="documentType" required>
  <option value="information-request">Information Request Response</option>
  <option value="denial-rebuttal">Denial Rebuttal</option>
  ...
</select>
<select name="tone" required>
  <option value="professional">Professional</option>
  <option value="firm">Firm</option>
  ...
</select>
<select name="jurisdiction" required>
  <option value="AL">Alabama</option>
  <option value="AK">Alaska</option>
  ...
</select>
<textarea name="carrierLetter" rows="8" required placeholder="Paste the carrier's request or letter here..."></textarea>
```

### ❌ NOT ALLOWED:
- Generic "Input Data" textareas
- Unlabeled paste fields
- Missing metadata collection

---

## ENFORCEMENT CHECKLIST

For each tool, verify:

1. ✅ Input structure matches its layer's contract
2. ✅ No generic "Input Data" or "Enter information" textareas
3. ✅ All selectors have appropriate options
4. ✅ Numeric fields have proper step/min/max attributes
5. ✅ File uploads specify accepted formats
6. ✅ Optional fields are clearly marked
7. ✅ Character limits enforced where specified
8. ✅ Tools in different layers have visibly different inputs

---

## IMPLEMENTATION STATUS

### ✅ Completed (4 tools):
- **L1:** ALE Tracker
- **L2:** Depreciation Calculator
- **L3:** Policy Intelligence Engine
- **L4:** Carrier Response Engine

### 🔄 Remaining (72 tools):
See `/docs/tool-layer-map.md` for complete list by layer.

---

*Last Updated: January 2026*
*Status: IMPLEMENTATION IN PROGRESS*


