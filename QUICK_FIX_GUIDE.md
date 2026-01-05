# 🔧 CLAIM NAVIGATOR - QUICK FIX GUIDE

**Problem:** All 12 primary tools return 404 errors  
**Impact:** System completely non-functional  
**Solution:** Choose one of two options below

---

## OPTION A: QUICK REMAP (1-2 hours)

### Step 1: Update Tool Routing

**File:** `step-by-step-claim-guide.html`  
**Line:** 3887  
**Replace this:**

```javascript
function openTool(toolId, stepNum) {
  // Route to Resource Center with query params
  const step = stepNum || currentStep;
  const returnUrl = encodeURIComponent('/step-guide');
  window.location.href = `/resource-center/${toolId}?step=${step}&return=${returnUrl}`;
}
```

**With this:**

```javascript
function openTool(toolId, stepNum) {
  // Map tool IDs to existing pages
  const toolMap = {
    'policy-intelligence-engine': '/app/claim-analysis-tools/policy.html',
    'compliance-review': '/app/claim-analysis-tools/policy.html',
    'compliance-auto-import': '/app/claim-analysis-tools/policy.html',
    'damage-documentation': '/app/claim-analysis-tools/damage.html',
    'damage-report-engine': '/app/claim-analysis-tools/damage.html',
    'estimate-review': '/app/claim-analysis-tools/estimates.html',
    'estimate-comparison': '/app/claim-analysis-tools/estimates.html',
    'ale-tracker': '/app/evidence-organizer.html',
    'contents-inventory': '/app/evidence-organizer.html',
    'contents-valuation': '/app/claim-analysis-tools/settlement.html',
    'coverage-alignment': '/app/claim-analysis-tools/policy.html',
    'claim-package-assembly': '/app/document-generator-v2/document-generator.html',
    'submission-method': '/app/document-generator-v2/document-generator.html',
    'claim-submitter': '/app/document-generator-v2/document-generator.html',
    'carrier-response': '/app/ai-response-agent.html',
    'supplement-analysis': '/app/claim-analysis-tools/settlement.html',
    
    // Supporting tools
    'policy-uploader': '/app/claim-analysis-tools/policy.html',
    'policy-report-viewer': '/app/claim-analysis-tools/policy.html',
    'step1-acknowledgment': '/step-by-step-claim-guide.html',
    'step2-acknowledgment': '/step-by-step-claim-guide.html',
    'step3-acknowledgment': '/step-by-step-claim-guide.html',
    'step11-acknowledgment': '/step-by-step-claim-guide.html'
  };
  
  const step = stepNum || currentStep;
  const returnUrl = encodeURIComponent('/step-by-step-claim-guide.html');
  const targetUrl = toolMap[toolId];
  
  if (!targetUrl) {
    console.error(`Tool ID "${toolId}" not found in toolMap`);
    alert(`Tool "${toolId}" is not yet available. Please contact support.`);
    return;
  }
  
  window.location.href = `${targetUrl}?step=${step}&return=${returnUrl}&toolId=${toolId}`;
}
```

### Step 2: Add Tool Return Handler

**File:** `step-by-step-claim-guide.html`  
**Find this section (around line 4970):**

```javascript
// Load saved state from storage
function loadSavedState() {
  const state = getClaimData('claimNavigatorState');
  // ... existing code
}
```

**Add this AFTER the loadSavedState function:**

```javascript
// Initialize page
window.addEventListener('DOMContentLoaded', function() {
  loadSavedState();
  handleToolReturn(); // Add this line
  updateUI();
});
```

### Step 3: Add Step 11 Primary Tool

**File:** `step-by-step-claim-guide.html`  
**Line:** 4938  
**Find this:**

```javascript
const primaryToolIds = {
  1: 'policy-intelligence-engine',
  2: 'compliance-review',
  3: 'damage-documentation',
  4: 'estimate-review',
  5: 'estimate-comparison',
  6: 'ale-tracker',
  7: 'contents-inventory',
  8: 'contents-valuation',
  9: 'coverage-alignment',
  10: 'claim-package-assembly',
  12: 'carrier-response',
  13: 'supplement-analysis'
};
```

**Change to this:**

```javascript
const primaryToolIds = {
  1: 'policy-intelligence-engine',
  2: 'compliance-review',
  3: 'damage-documentation',
  4: 'estimate-review',
  5: 'estimate-comparison',
  6: 'ale-tracker',
  7: 'contents-inventory',
  8: 'contents-valuation',
  9: 'coverage-alignment',
  10: 'claim-package-assembly',
  11: 'claim-submitter', // ADD THIS LINE
  12: 'carrier-response',
  13: 'supplement-analysis'
};
```

### Step 4: Test

1. Open `step-by-step-claim-guide.html`
2. Click Step 1 → Click "Use: AI Policy Intelligence Engine"
3. Verify it loads `/app/claim-analysis-tools/policy.html` (not 404)
4. Repeat for Steps 2-13

**Done!** This gets the system minimally functional.

---

## OPTION B: BUILD DEDICATED TOOLS (5-7 days)

### Overview

Create 12 dedicated tool pages at the expected URLs.

### Required Tool Pages

Create these files:

```
/app/resource-center/policy-intelligence-engine/index.html
/app/resource-center/compliance-review/index.html
/app/resource-center/damage-documentation/index.html
/app/resource-center/estimate-review/index.html
/app/resource-center/estimate-comparison/index.html
/app/resource-center/ale-tracker/index.html
/app/resource-center/contents-inventory/index.html
/app/resource-center/contents-valuation/index.html
/app/resource-center/coverage-alignment/index.html
/app/resource-center/claim-package-assembly/index.html
/app/resource-center/carrier-response/index.html
/app/resource-center/supplement-analysis/index.html
```

### Tool Template

Each tool must follow this pattern:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Policy Intelligence Engine - Claim Navigator</title>
  <script src="/storage/claimStorage.js"></script>
</head>
<body>
  <h1>Policy Intelligence Engine</h1>
  
  <!-- Tool interface here -->
  
  <button id="generateReport">Generate Report</button>
  
  <script>
    // Get query params
    const urlParams = new URLSearchParams(window.location.search);
    const stepNum = urlParams.get('step');
    const returnUrl = urlParams.get('return');
    
    document.getElementById('generateReport').addEventListener('click', function() {
      // Generate report
      const report = {
        reportType: 'Policy_Intelligence_Report',
        timestamp: new Date().toISOString(),
        summary: 'Policy analysis complete.',
        sections: {
          coveredLosses: { /* ... */ },
          coverageLimits: { /* ... */ },
          // ... etc
        }
      };
      
      // Save to localStorage
      const key = `claim_step_${stepNum}_policy-intelligence-engine_output`;
      saveClaimData(key, report);
      
      // Return to step guide
      window.location.href = decodeURIComponent(returnUrl) + '.html';
    });
  </script>
</body>
</html>
```

### Report Schemas

Each tool must generate a report matching this structure:

```javascript
{
  reportType: 'Report_Name',
  timestamp: '2026-01-03T10:30:00Z',
  summary: 'Brief summary for display in step guide',
  sections: {
    // Tool-specific sections
  }
}
```

**Report Types:**
1. `Policy_Intelligence_Report`
2. `Compliance_Status_Report`
3. `Damage_Documentation_Report`
4. `Estimate_Quality_Report`
5. `Estimate_Comparison_Report`
6. `ALE_Compliance_Report`
7. `Inventory_Completeness_Report`
8. `Contents_Valuation_Report`
9. `Coverage_Alignment_Report`
10. `Claim_Package_Readiness_Report`
11. `Submission_Confirmation_Report`
12. `Carrier_Response_Analysis_Report`
13. `Supplement_Strategy_Report`

---

## TESTING CHECKLIST

After implementing either option, verify:

- [ ] Step 1 tool button loads page (not 404)
- [ ] Step 2 tool button loads page (not 404)
- [ ] Step 3 tool button loads page (not 404)
- [ ] Step 4 tool button loads page (not 404)
- [ ] Step 5 tool button loads page (not 404)
- [ ] Step 6 tool button loads page (not 404)
- [ ] Step 7 tool button loads page (not 404)
- [ ] Step 8 tool button loads page (not 404)
- [ ] Step 9 tool button loads page (not 404)
- [ ] Step 10 tool button loads page (not 404)
- [ ] Step 11 tool button loads page (not 404)
- [ ] Step 12 tool button loads page (not 404)
- [ ] Step 13 tool button loads page (not 404)
- [ ] Tool generates report
- [ ] Report appears in step guide after return
- [ ] PDF export works
- [ ] DOC export works
- [ ] Progress persists after page refresh

---

## COMMON ISSUES

### Issue: "No report data available to export"

**Cause:** Tool didn't save output to localStorage  
**Fix:** Verify tool saves data with correct key format:
```javascript
const key = `claim_step_${stepNum}_${toolId}_output`;
saveClaimData(key, reportData);
```

### Issue: Tool loads but doesn't return to step guide

**Cause:** Return URL not implemented  
**Fix:** Add return button/logic:
```javascript
const returnUrl = new URLSearchParams(window.location.search).get('return');
window.location.href = decodeURIComponent(returnUrl) + '.html';
```

### Issue: Report doesn't appear in step after return

**Cause:** `handleToolReturn()` not called on page load  
**Fix:** Add to DOMContentLoaded event (see Step 2 above)

### Issue: Cross-step imports don't work

**Cause:** Prior step reports not generated  
**Fix:** Complete prior steps first, verify reports exist in localStorage

---

## VERIFICATION

After implementing fixes, the system should:

1. ✅ Load all 13 steps without errors
2. ✅ Navigate to tools without 404 errors
3. ✅ Generate reports for each step
4. ✅ Display reports in step guide
5. ✅ Export reports as PDF/DOC
6. ✅ Persist data across page refreshes
7. ✅ Import prior step data correctly
8. ✅ Allow progression through all 13 steps

**Current Status:** 0/8 passing  
**After Fix:** Should be 8/8 passing

---

## RECOMMENDATION

**Start with Option A** (Quick Remap) to get system functional immediately.

**Then migrate to Option B** (Dedicated Tools) for production-grade implementation.

---

## SUPPORT

If issues persist after implementing these fixes:

1. Check browser console for JavaScript errors
2. Verify localStorage is enabled
3. Check that all referenced files exist
4. Verify query parameters are passed correctly
5. Test in incognito/private mode (clears cache)

---

**Last Updated:** January 3, 2026  
**See Also:** `CLAIM_NAVIGATOR_SYSTEM_AUDIT_REPORT.md` for detailed analysis

