# CONFIRMATION BYPASS TEST PROMPT

Use this prompt after authentication bypasses have been fixed to verify the system is safe to launch.

---

## CURSOR PROMPT — CONFIRMATION BYPASS TEST (POST-FIX VERIFICATION)

**Context**
Authentication bypasses have been removed from:
- `app/claim-journal.html`
- `step-by-step-claim-guide.html`
- `workflow-tool.html`

This is a verification-only task to confirm all bypasses are resolved.

---

## SCOPE (STRICT)

✅ **Allowed:**
- Read source code to verify guards are active
- Verify no bypass code remains
- Check authentication flow is intact
- Confirm redirect logic is correct

❌ **Not Allowed:**
- Making any code changes
- Adding new features
- Refactoring
- Performance optimization

---

## VERIFICATION CHECKLIST

Run through this checklist and report results:

### **1. Source Code Verification**

**Check for bypass code:**
```bash
grep -r "TEMPORARILY DISABLED\|OVERRIDE.*Force\|bypassed for local testing" app/ --include="*.html"
```

**Expected Result:** No matches found

**Check for commented auth guards:**
```bash
grep -r "ORIGINAL AUTH CODE (DISABLED)" . --include="*.html"
```

**Expected Result:** No matches found

---

### **2. Claim Journal Verification**

**File:** `app/claim-journal.html`

**Verify:**
- [ ] Line ~17 contains: `<script src="/app/assets/js/access-guard.js"></script>`
- [ ] No bypass code present (lines 17-23 in original)
- [ ] No "TEMPORARILY DISABLED" comments
- [ ] No "OVERRIDE" code
- [ ] access-guard.js loads before page content

**Expected Auth Flow:**
1. Page loads → content hidden
2. access-guard.js executes
3. Checks authentication
4. Checks active claim
5. If pass → show content
6. If fail → redirect to login or paywall

---

### **3. Claim Management Center Verification**

**File:** `step-by-step-claim-guide.html`

**Verify:**
- [ ] Lines ~25-91 contain inline authentication guard
- [ ] Guard starts with: `document.documentElement.style.visibility = 'hidden'`
- [ ] Guard checks: CNAuth, user, Supabase client, active claim
- [ ] Guard redirects on failure
- [ ] Guard shows page on success
- [ ] No bypass code present (lines 25-31 in original)
- [ ] No "TEMPORARILY DISABLED" comments
- [ ] No "OVERRIDE" code

**Expected Auth Flow:**
1. Page loads → content hidden immediately
2. Inline guard executes
3. Waits for CNAuth system (max 5 seconds)
4. Checks user authentication
5. Waits for Supabase client (max 5 seconds)
6. Queries database for active claim
7. If pass → show content
8. If fail → redirect to login or paywall

---

### **4. Workflow Tool Verification**

**File:** `workflow-tool.html`

**Verify:**
- [ ] Line ~21 contains: `<script src="/app/assets/js/access-guard.js"></script>`
- [ ] No bypass code present (lines 20-27 in original)
- [ ] No "TEMPORARILY DISABLED" comments
- [ ] No "OVERRIDE" code
- [ ] access-guard.js loads before page content

**Expected Auth Flow:**
1. Page loads → content hidden
2. access-guard.js executes
3. Checks authentication
4. Checks active claim
5. If pass → show content
6. If fail → redirect to login or paywall

---

### **5. Access Guard Implementation Verification**

**File:** `app/assets/js/access-guard.js`

**Verify:**
- [ ] File exists and is accessible
- [ ] Implements FAIL CLOSED logic (deny by default)
- [ ] Hides content immediately: `document.documentElement.style.visibility = 'hidden'`
- [ ] Waits for CNAuth system
- [ ] Checks user authentication
- [ ] Waits for Supabase client
- [ ] Queries database for active claim
- [ ] Redirects to login if no user
- [ ] Redirects to paywall if no active claim
- [ ] Redirects to access-denied on error
- [ ] Shows content only if all checks pass

---

### **6. Paywall Enforcement Verification**

**File:** `app/assets/js/paywall-enforcement.js`

**Verify:**
- [ ] Implements FAIL CLOSED logic (deny by default)
- [ ] Checks user authentication
- [ ] Checks Supabase client availability
- [ ] Queries database for active claim
- [ ] Redirects to login if no user
- [ ] Redirects to paywall if no active claim
- [ ] Redirects to access-denied on error
- [ ] Returns true only if all checks pass
- [ ] No "fail open" logic present

---

### **7. Redirect Target Verification**

**Verify these files exist:**
- [ ] `/app/login.html` - Login page
- [ ] `/paywall/locked.html` - Paywall page
- [ ] `/app/access-denied.html` - Access denied page

**Verify redirect logic:**
- [ ] Login page redirects back to original page after successful login
- [ ] Paywall page offers payment option
- [ ] Access denied page provides clear error message

---

### **8. Edge Case Verification**

**Check for potential bypasses:**

**Direct URL Access:**
- [ ] No query parameter bypasses (e.g., `?bypass=true`)
- [ ] No hash fragment bypasses (e.g., `#bypass`)
- [ ] No special route bypasses (e.g., `/admin/bypass`)

**JavaScript Bypasses:**
- [ ] No `window.bypassAuth` variables
- [ ] No `localStorage` bypass flags
- [ ] No `sessionStorage` bypass flags
- [ ] No console command bypasses

**Timing Bypasses:**
- [ ] Guards execute before page content loads
- [ ] No race conditions where content loads before guard
- [ ] No async issues where guard can be skipped

---

## OUTPUT REQUIREMENTS

Produce a report with the following sections:

### **1. VERIFICATION SUMMARY**

Table format:
| Check | Status | Notes |
|-------|--------|-------|
| Source code scan | PASS/FAIL | Details |
| Claim Journal | PASS/FAIL | Details |
| Claim Management Center | PASS/FAIL | Details |
| Workflow Tool | PASS/FAIL | Details |
| Access Guard | PASS/FAIL | Details |
| Paywall Enforcement | PASS/FAIL | Details |
| Redirect Targets | PASS/FAIL | Details |
| Edge Cases | PASS/FAIL | Details |

---

### **2. ISSUES FOUND (IF ANY)**

For each issue:
- What was found
- File and line number
- Severity (Critical/High/Medium/Low)
- Recommended action

---

### **3. SAFE-TO-LAUNCH DECLARATION**

One of:
- ✅ **All checks passed — SAFE TO LAUNCH**
- ❌ **Issues found — NOT SAFE TO LAUNCH**

No ambiguity.

---

## HARD RULES

- Treat any remaining bypass as a launch blocker
- Do NOT make code changes (verification only)
- Do NOT assume intent — verify actual code
- Report exactly what is found

---

## STOP CONDITION

After producing the report:

**STOP**

If all checks passed:
- Declare: **"SAFE TO LAUNCH"**
- Provide final launch checklist

If any checks failed:
- Declare: **"NOT SAFE TO LAUNCH"**
- List specific issues to fix
- Await instruction: **"Fix remaining issues"**

---

**END OF PROMPT**

