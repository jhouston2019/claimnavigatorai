# FILE AUDIT & CLEANUP REPORT
**Generated:** January 7, 2026  
**Scope:** app/tools/, netlify/functions/, app/assets/css/, app/assets/js/

---

## 🔴 CRITICAL ISSUES (blocking - fix before launch)

### 1. BROKEN FILE REFERENCE: claimStorage.js Path Mismatch
**Severity:** HIGH - Will cause runtime errors  
**Impact:** 81 HTML tool files affected  
**Issue:** All HTML tools reference `../storage/claimStorage.js` but file is at `storage/claimStorage.js` (root level)

**Affected Files:**
- All 81 HTML files in `app/tools/` directory

**Fix Required:**
```html
<!-- Current (BROKEN): -->
<script src="../storage/claimStorage.js"></script>

<!-- Should be: -->
<script src="../../storage/claimStorage.js"></script>
```

**Action:** Update all 81 HTML tool files to use correct relative path `../../storage/claimStorage.js`

---

### 2. DUPLICATE BACKEND FUNCTIONS: ai-response-agent vs aiResponseAgent
**Severity:** MEDIUM - Causes confusion, potential inconsistency  
**Issue:** Two different implementations of the same function

**Files:**
- `netlify/functions/ai-response-agent.js` (267 lines, Phase 5B hardened, uses prompt-hardening utils)
- `netlify/functions/aiResponseAgent.js` (325 lines, older implementation, different API contract)

**Usage:**
- `ai-response-agent.js` is called by:
  - `app/tools/carrier-response.html`
  - `app/tools/ai-response-agent.html`
  - `app/tools/coverage-qa-chat.html`
  - `app/tools/response-letter-generator.html`
  
- `aiResponseAgent.js` is called by:
  - `app/ai-response-agent.html` (legacy page)

**Recommendation:** Keep `ai-response-agent.js` (newer, hardened), deprecate `aiResponseAgent.js`

---

### 3. MISSING FILE: ai-tool-output-bridge.js
**Severity:** LOW - No references found  
**Issue:** Referenced in user query but doesn't exist in codebase  
**Actual File:** `app/assets/js/tool-output-bridge.js` (exists and is used)

**Status:** ✅ No issue - correct file exists

---

## 🟡 DUPLICATE FILES (should clean up)

### Backend Functions - Multiple Versions

#### 1. generate-document Family (6 files)
- ✅ **KEEP:** `netlify/functions/generate-document.js` (main, 338 lines)
- 🟡 **REVIEW:** `netlify/functions/generate-document-simple.js` (simpler version)
- 🟡 **REVIEW:** `netlify/functions/generate-document-public.js` (public API version)
- 🔴 **DELETE:** `netlify/functions/generate-document-backup.js` (backup copy - identical to main)
- 🔴 **DELETE:** `netlify/functions/generate-document-public-test.js` (test version)
- ⚠️ **EXTERNAL:** `app/document-generator-v2/netlify/functions/generate-document.js` (separate module)

**Recommendation:** Delete backup and test versions, keep main + public + simple for different use cases

---

#### 2. generate-response Family (3 files)
- ✅ **KEEP:** `netlify/functions/generate-response.js` (main)
- 🟡 **REVIEW:** `netlify/functions/generate-response-simple.js` (simpler version)
- 🟡 **REVIEW:** `netlify/functions/generate-response-public.js` (public API)

**Recommendation:** Keep all three if they serve different API contracts (authenticated vs public vs simple)

---

#### 3. ai-advisory Family (6 files)
- ✅ **KEEP:** `netlify/functions/ai-situational-advisory.js` (main, actively used)
- 🟡 **REVIEW:** `netlify/functions/ai-advisory-system.js`
- 🟡 **REVIEW:** `netlify/functions/ai-advisory-simple.js`
- 🟡 **REVIEW:** `netlify/functions/ai-advisory.js`
- 🔴 **DELETE:** `netlify/functions/test-ai-advisory.js` (test file)
- ⚠️ **LEGACY:** `netlify/functions/getAdvisory.js` (old naming convention)

**Recommendation:** Consolidate to 1-2 versions, delete test file

---

### CSS Files - Backup Versions

#### 1. style.css.backup-phase2-before-edit
**Location:** `app/assets/css/style.css.backup-phase2-before-edit`  
**Status:** 🔴 **DELETE** - Backup file from previous phase  
**Recommendation:** Remove after confirming current style.css works correctly

---

## 🟢 SAFE TO DELETE (cleanup recommended)

### Test & Development Files

1. **Backend Test Files:**
   - `netlify/functions/test-ai-advisory.js`
   - `netlify/functions/test-deploy.js`
   - `netlify/functions/test-monitoring.js`
   - `netlify/functions/test-simple.js`
   - `netlify/functions/generate-document-public-test.js`
   - `netlify/functions/monitoring-self-test.js`
   - `netlify/functions/monitoring/monitoring-self-test.js`

**Recommendation:** Keep only if used in CI/CD pipeline, otherwise delete

---

2. **Mock Data Generators:**
   - `netlify/functions/generate-mock-monitoring-data.js`
   - `netlify/functions/generate-full-monitoring-data.js`
   - `netlify/functions/generate-corrected-monitoring-data.js`
   - `netlify/functions/monitoring-insert-test-data.js`

**Recommendation:** Delete after production monitoring is stable

---

3. **Backup Files:**
   - `netlify/functions/generate-document-backup.js`
   - `app/assets/css/style.css.backup-phase2-before-edit`
   - `app/statement-of-loss.html.backup-phase2-before-edit`
   - `app/state-rights.html.backup-phase2-before-edit`

**Recommendation:** Delete all backup files (version control handles this)

---

4. **Population/Setup Scripts:**
   - `netlify/functions/populate-documents.js`
   - `netlify/functions/populate-documents-github.js`
   - `netlify/functions/populate-documents-from-json.js`
   - `netlify/functions/populate-documents-bilingual.js`
   - `netlify/functions/populate-documents-corrected.js`

**Recommendation:** Keep one canonical version, delete others

---

## 📊 ORPHANED BACKEND FUNCTIONS

### Functions NOT Called by Any Tool

**Analysis Method:** Searched all app/ files for `.netlify/functions/` references

#### Potentially Orphaned (needs verification):

1. **Document Management:**
   - `get-doc.js` - May be called dynamically
   - `get-template.js` - May be used by document generator
   - `generateDocument.js` (camelCase version) - Legacy?

2. **Claim Management:**
   - `create-claim.js` - May be called from dashboard
   - `update-claim.js` - May be called from dashboard
   - `get-claim.js` - May be called dynamically
   - `analyze-claim.js` - May be legacy
   - `analyze-claim-public.js` - Public API version

3. **Payment/Stripe:**
   - `checkout.js` - May be called from payment flow
   - `create-checkout-session.js` - Stripe integration
   - `stripe-webhook.js` - Webhook handler (called by Stripe)
   - `check-payment-status.js` - May be called dynamically

4. **Utilities:**
   - `diagnose-supabase.js` - Admin/debug tool
   - `audit-health.js` - Admin/monitoring tool
   - `build-insurer-cache.js` - Background job?
   - `text-extract.js` - May be called by upload handlers

5. **Legacy/Deprecated:**
   - `policyAnalyzer.js` (camelCase) - Old version of ai-policy-review?
   - `getAdvisory.js` (camelCase) - Old version of ai-advisory?
   - `rom-estimate.js` - Replaced by ai-rom-estimator?
   - `settlement-comparison.js` - Not found in tools
   - `financial-impact-calculator.js` - Not found in tools
   - `professional-marketplace.js` - Not found in tools

**Recommendation:** Audit each function to determine if:
- Called dynamically (keep)
- Used by admin/background jobs (keep)
- Legacy/unused (delete)

---

## ✅ VERIFIED WORKING

### Core Files Present & Correctly Referenced

✅ **CSS Files:**
- `app/assets/css/style.css` - EXISTS
- `app/assets/css/tool-visual-alignment.css` - EXISTS (referenced by all 81 tools)
- `app/assets/css/structured-tool-outputs.css` - EXISTS (referenced by 15+ tools)

✅ **JavaScript Controllers:**
- `app/assets/js/controllers/ai-tool-controller.js` - EXISTS (main controller)
- `app/assets/js/controllers/index.js` - EXISTS (exports controllers)
- `app/assets/js/controllers/document-generator-controller.js` - EXISTS
- `app/assets/js/controllers/workflow-view-controller.js` - EXISTS
- `app/assets/js/controllers/reference-library-controller.js` - EXISTS

✅ **JavaScript Utilities:**
- `app/assets/js/tool-output-bridge.js` - EXISTS
- `app/assets/js/tool-registry.js` - EXISTS (referenced by all tools)
- `storage/claimStorage.js` - EXISTS (but path reference is broken in tools)

✅ **Backend Functions (Actively Used):**
- `ai-response-agent.js` - Used by 4 tools
- `ai-estimate-comparison.js` - Used by 13+ tools
- `ai-policy-review.js` - Used by 8+ tools
- `ai-situational-advisory.js` - Used by 6+ tools
- `ai-rom-estimator.js` - Used by 6+ tools
- `ai-negotiation-advisor.js` - Used by 2 tools
- `ai-damage-assessment.js` - Used by 2 tools
- `ai-evidence-check.js` - Used by 3 tools
- `calculate-deadline.js` - Used by deadline-calculator tool
- `calculate-depreciation.js` - Used by depreciation-calculator tool

---

## 📊 STATISTICS

### HTML Tools
- **Total HTML tools:** 81
- **Tools with broken claimStorage.js reference:** 81 (100%)
- **Tools with correct CSS references:** 81 (100%)
- **Tools with correct JS controller imports:** 17+ verified

### Backend Functions
- **Total backend functions:** 185 files
- **Actively used by tools:** ~25 functions
- **Duplicate versions identified:** 15+ files
- **Test/mock files:** 7+ files
- **Backup files:** 4 files
- **Potentially orphaned:** 20+ functions (needs verification)

### CSS Files
- **Total CSS files:** 29
- **Backup files:** 1 (style.css.backup-phase2-before-edit)
- **Core files verified:** 3/3

### Duplicate Files
- **Backend function duplicates:** 15+ files
- **CSS backups:** 1 file
- **HTML backups:** 2 files
- **Total files safe to delete:** 18-25 files

---

## 🔧 PRIORITY FIX RECOMMENDATIONS

### Priority 1 (MUST FIX - Blocking Issues)

#### Fix 1: Update claimStorage.js Path in All Tools
**Impact:** Critical - affects all 81 tools  
**Effort:** Medium (bulk find/replace)  
**Command:**
```bash
# Find and replace in all tool files
find app/tools -name "*.html" -exec sed -i 's|../storage/claimStorage.js|../../storage/claimStorage.js|g' {} \;
```

**Manual verification needed for:**
- `app/tools/carrier-response.html`
- `app/tools/ai-response-agent.html`
- (and 79 others)

---

### Priority 2 (SHOULD FIX - Reduces Confusion)

#### Fix 2: Consolidate ai-response-agent Functions
**Action:**
1. Keep `ai-response-agent.js` (newer, Phase 5B hardened)
2. Rename `aiResponseAgent.js` to `aiResponseAgent.deprecated.js`
3. Update `app/ai-response-agent.html` to use new function
4. Delete deprecated file after migration

---

#### Fix 3: Delete Backup Files
**Action:** Remove all backup files:
```bash
rm app/assets/css/style.css.backup-phase2-before-edit
rm app/statement-of-loss.html.backup-phase2-before-edit
rm app/state-rights.html.backup-phase2-before-edit
rm netlify/functions/generate-document-backup.js
```

---

#### Fix 4: Clean Up Test Files
**Action:** Remove test files not used in CI/CD:
```bash
rm netlify/functions/test-*.js
rm netlify/functions/generate-document-public-test.js
rm netlify/functions/generate-*-monitoring-data.js
rm netlify/functions/monitoring-insert-test-data.js
```

---

### Priority 3 (NICE TO FIX - Cleanup)

#### Fix 5: Consolidate Advisory Functions
**Action:**
1. Audit which advisory functions are actually used
2. Keep 1-2 versions (main + public API)
3. Delete unused versions
4. Update documentation

---

#### Fix 6: Audit Orphaned Functions
**Action:**
1. Review list of potentially orphaned functions
2. Check if called dynamically or by admin tools
3. Add deprecation notices to unused functions
4. Schedule deletion after 30-day grace period

---

## 🎯 ESTIMATED CLEANUP IMPACT

### Files to Delete (Safe)
- **Backup files:** 4 files
- **Test files:** 7-10 files
- **Mock data generators:** 4 files
- **Duplicate functions:** 5-8 files
- **Total:** ~20-26 files

### Files to Review (Needs Analysis)
- **Potentially orphaned functions:** 20+ files
- **Duplicate function families:** 15 files
- **Total:** ~35 files

### Files to Fix (Update References)
- **HTML tools with broken paths:** 81 files
- **Total:** 81 files

---

## 📋 NEXT STEPS

1. ✅ **Immediate (Before Launch):**
   - Fix claimStorage.js path in all 81 HTML tools
   - Consolidate ai-response-agent functions
   - Delete backup files

2. ⏰ **Short Term (Within 1 Week):**
   - Delete test files not in CI/CD
   - Clean up mock data generators
   - Consolidate advisory functions

3. 📅 **Medium Term (Within 1 Month):**
   - Audit all orphaned functions
   - Update documentation
   - Create function deprecation policy

---

## 🔍 VALIDATION CHECKLIST

After fixes are applied:

- [ ] All 81 HTML tools load without console errors
- [ ] claimStorage.js is accessible from all tools
- [ ] All CSS files load correctly
- [ ] AI tool controller initializes properly
- [ ] Backend functions respond correctly
- [ ] No 404 errors in browser console
- [ ] No broken imports in JavaScript
- [ ] All critical user flows work end-to-end

---

**Report Generated By:** Codebase Audit System  
**Last Updated:** January 7, 2026  
**Status:** ✅ Audit Complete - Fixes Required

