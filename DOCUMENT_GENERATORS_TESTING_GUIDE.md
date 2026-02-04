# Document Generators - Testing Guide

**Comprehensive Testing Checklist for AI Document Generators**

---

## Pre-Testing Setup

### Requirements
- ✅ Local or staging environment running
- ✅ OpenAI API key configured in Netlify environment
- ✅ Netlify function `/netlify/functions/ai-document-generator` deployed
- ✅ Browser with JavaScript enabled
- ✅ Network connection for API calls

### Test Browser Matrix
Test in at least:
- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile Chrome (iOS/Android)

---

## Test Suite 1: Modal Functionality

### Test 1.1: Modal Opens Correctly
**Steps:**
1. Navigate to step-by-step-claim-guide.html
2. Open Step 10
3. Scroll to "Additional Tools"
4. Click "Carrier Submission Cover Letter Generator"

**Expected Result:**
- ✅ Modal appears with smooth animation
- ✅ Overlay is visible with blur effect
- ✅ Modal is centered on screen
- ✅ Title shows "Carrier Submission Cover Letter Generator"
- ✅ Form fields are visible

**Status:** [ ] Pass [ ] Fail

---

### Test 1.2: Modal Closes Correctly
**Steps:**
1. Open any document generator modal
2. Click the X button in top-right

**Expected Result:**
- ✅ Modal closes immediately
- ✅ No errors in console

**Repeat with:**
- Click on overlay (outside modal)
- Press ESC key (if implemented)

**Status:** [ ] Pass [ ] Fail

---

### Test 1.3: Multiple Modal Opens
**Steps:**
1. Open a document generator
2. Close it
3. Open a different document generator
4. Close it
5. Open the first one again

**Expected Result:**
- ✅ Each modal opens with correct content
- ✅ No content from previous modals
- ✅ No memory leaks or performance issues

**Status:** [ ] Pass [ ] Fail

---

## Test Suite 2: Form Validation

### Test 2.1: Required Field Validation
**Steps:**
1. Open "Carrier Submission Cover Letter Generator"
2. Leave all fields empty
3. Click "Generate with AI"

**Expected Result:**
- ✅ Browser shows validation message
- ✅ Form does not submit
- ✅ First empty required field is focused

**Status:** [ ] Pass [ ] Fail

---

### Test 2.2: Field Type Validation
**Test each field type:**

**Text Fields:**
- Enter valid text → Should accept
- Enter special characters → Should accept
- Leave empty (if required) → Should reject

**Date Fields:**
- Select valid date → Should accept
- Enter invalid format → Should reject
- Leave empty (if required) → Should reject

**Number Fields:**
- Enter valid number → Should accept
- Enter text → Should reject
- Enter negative (where inappropriate) → Should reject

**Email Fields:**
- Enter valid email → Should accept
- Enter invalid email → Should reject

**Select Fields:**
- Select an option → Should accept
- Leave on default "Select..." → Should reject (if required)

**Status:** [ ] Pass [ ] Fail

---

### Test 2.3: Optional Fields
**Steps:**
1. Open any generator with optional fields
2. Fill only required fields
3. Submit form

**Expected Result:**
- ✅ Form submits successfully
- ✅ AI generates document without optional data
- ✅ No errors about missing optional fields

**Status:** [ ] Pass [ ] Fail

---

## Test Suite 3: AI Generation

### Test 3.1: Successful Generation - Carrier Submission Cover Letter
**Steps:**
1. Open "Carrier Submission Cover Letter Generator"
2. Fill all required fields with test data:
   - Insurance Company: "State Farm"
   - Policy Number: "12345678"
   - Date of Loss: "2024-01-15"
   - Property Address: "123 Main St, Anytown, CA 90210"
   - Type of Loss: "Fire"
   - Documents Included: "Proof of Loss, 3 contractor estimates, 50 photos, receipts"
   - Total Claim Amount: "125000"
3. Click "Generate with AI"

**Expected Result:**
- ✅ Loading spinner appears
- ✅ Loading message shows "Generating your document with AI..."
- ✅ After 3-5 seconds, success message appears
- ✅ Generated document is displayed
- ✅ Document includes:
  - Professional letterhead format
  - All provided information
  - Proper date formatting
  - Professional tone
  - Clear structure
  - No placeholder text like {{variable}}
- ✅ Action buttons appear (Copy, Download, Generate Another)

**Status:** [ ] Pass [ ] Fail

---

### Test 3.2: Generation for Each Document Type

Test AI generation for all 8 generators with appropriate test data:

#### 1. Carrier Submission Cover Letter
**Test Data:**
- Insurer: State Farm
- Policy: 12345678
- Loss Date: 2024-01-15
- Property: 123 Main St
- Loss Type: Fire
- Documents: Proof of Loss, estimates, photos
- Amount: $125,000

**Status:** [ ] Pass [ ] Fail

---

#### 2. Coverage Clarification Letter
**Test Data:**
- Insurer: Allstate
- Policy: 87654321
- Coverage Question: "Does my policy cover mold remediation?"
- Your Interpretation: "Policy covers resulting damage from covered peril"
- Requested Action: "Written confirmation of mold coverage"

**Status:** [ ] Pass [ ] Fail

---

#### 3. Estimate Revision Request
**Test Data:**
- Insurer: USAA
- Adjuster: John Smith
- Claim: CLM-2024-001
- Estimate Date: 2024-01-10
- Original Amount: $50,000
- Discrepancies: "Missing HVAC replacement, underpriced roofing materials"
- Evidence: "3 contractor estimates showing $75,000"

**Status:** [ ] Pass [ ] Fail

---

#### 4. EUO Sworn Statement Guide
**Test Data:**
- Insurer: Farmers
- Claim: CLM-2024-002
- EUO Date: 2024-02-15
- Loss Type: Water Damage
- Loss Date: 2024-01-05
- Key Facts: "Pipe burst in attic, discovered immediately, mitigation started same day"

**Status:** [ ] Pass [ ] Fail

---

#### 5. Follow-Up Status Letter
**Test Data:**
- Insurer: Liberty Mutual
- Claim: CLM-2024-003
- Submission Date: 2024-01-01
- Days Since: 21
- Pending Items: "Estimate review and payment authorization"
- State Deadline: "30 days per California regulations"

**Status:** [ ] Pass [ ] Fail

---

#### 6. Policy Interpretation Letter
**Test Data:**
- Insurer: Nationwide
- Policy: 11223344
- Policy Section: "Coverage A - Dwelling"
- Policy Language: "We will pay for direct physical loss to the property described in Coverage A"
- Your Interpretation: "This covers all structural damage from covered perils"
- Requested Action: "Confirm coverage for foundation repairs"

**Status:** [ ] Pass [ ] Fail

---

#### 7. Submission Confirmation Email
**Test Data:**
- Insurer: Progressive
- Claim: CLM-2024-004
- Submission Date: 2024-01-20
- Method: Certified Mail
- Tracking: 9400123456789
- Documents: "Complete claim package with 15 items"

**Status:** [ ] Pass [ ] Fail

---

#### 8. Supplement Cover Letter
**Test Data:**
- Insurer: Travelers
- Claim: CLM-2024-005
- Original Date: 2024-01-01
- Original Amount: $100,000
- Supplement Reason: "Additional hidden damage discovered during repairs"
- Supplement Amount: $25,000
- Total Revised: $125,000

**Status:** [ ] Pass [ ] Fail

---

### Test 3.3: Error Handling - Network Failure
**Steps:**
1. Open any generator
2. Fill form with valid data
3. Disconnect internet
4. Click "Generate with AI"

**Expected Result:**
- ✅ Error message appears
- ✅ Message is user-friendly
- ✅ "Try Again" button is available
- ✅ No console errors crash the page

**Status:** [ ] Pass [ ] Fail

---

### Test 3.4: Error Handling - API Failure
**Steps:**
1. Temporarily break API endpoint (or use invalid API key)
2. Open any generator
3. Fill form with valid data
4. Click "Generate with AI"

**Expected Result:**
- ✅ Error message appears
- ✅ Message indicates generation failed
- ✅ "Try Again" button available
- ✅ Form data is preserved

**Status:** [ ] Pass [ ] Fail

---

### Test 3.5: Long Generation Time
**Steps:**
1. Open generator with complex fields
2. Fill with extensive data (long text in all fields)
3. Click "Generate with AI"

**Expected Result:**
- ✅ Loading state persists
- ✅ No timeout errors (wait up to 30 seconds)
- ✅ Document eventually generates
- ✅ All input data is included in output

**Status:** [ ] Pass [ ] Fail

---

## Test Suite 4: User Actions

### Test 4.1: Copy to Clipboard
**Steps:**
1. Generate any document successfully
2. Click "📋 Copy to Clipboard"
3. Open a text editor
4. Paste (Ctrl+V or Cmd+V)

**Expected Result:**
- ✅ Success alert appears
- ✅ Full document text is copied
- ✅ Formatting is preserved (line breaks, etc.)
- ✅ No extra characters or HTML tags

**Status:** [ ] Pass [ ] Fail

---

### Test 4.2: Download Document
**Steps:**
1. Generate any document successfully
2. Click "📥 Download as PDF"

**Expected Result:**
- ✅ File download initiates
- ✅ Filename includes document type and date
- ✅ File contains full document text
- ✅ File is readable in text editor
- ✅ Alert confirms download

**Status:** [ ] Pass [ ] Fail

---

### Test 4.3: Generate Another
**Steps:**
1. Generate a document successfully
2. Click "🔄 Generate Another"

**Expected Result:**
- ✅ Output area clears
- ✅ Form resets to empty
- ✅ Modal stays open
- ✅ Can fill form again and generate new document

**Status:** [ ] Pass [ ] Fail

---

### Test 4.4: Cancel/Close After Generation
**Steps:**
1. Generate a document successfully
2. Close modal (X button or overlay click)
3. Reopen same generator

**Expected Result:**
- ✅ Modal opens with fresh form
- ✅ Previous generation is cleared
- ✅ No cached data

**Status:** [ ] Pass [ ] Fail

---

## Test Suite 5: UI/UX

### Test 5.1: Responsive Design - Desktop
**Test at:**
- 1920x1080 (Full HD)
- 1366x768 (Laptop)
- 1024x768 (Small laptop)

**Expected Result:**
- ✅ Modal fits on screen
- ✅ All fields are visible
- ✅ Text is readable
- ✅ Buttons are accessible
- ✅ No horizontal scrolling

**Status:** [ ] Pass [ ] Fail

---

### Test 5.2: Responsive Design - Mobile
**Test at:**
- 375x667 (iPhone SE)
- 390x844 (iPhone 12/13)
- 412x915 (Android)

**Expected Result:**
- ✅ Modal adapts to screen size
- ✅ Form fields stack vertically
- ✅ Text is readable without zooming
- ✅ Buttons are tap-friendly (min 44x44px)
- ✅ Keyboard doesn't break layout

**Status:** [ ] Pass [ ] Fail

---

### Test 5.3: Accessibility - Keyboard Navigation
**Steps:**
1. Open modal
2. Use Tab key to navigate through fields
3. Use Enter to submit
4. Use Esc to close (if implemented)

**Expected Result:**
- ✅ Tab order is logical
- ✅ All interactive elements are reachable
- ✅ Focus indicators are visible
- ✅ Enter submits form
- ✅ Esc closes modal

**Status:** [ ] Pass [ ] Fail

---

### Test 5.4: Accessibility - Screen Reader
**Test with:**
- NVDA (Windows)
- JAWS (Windows)
- VoiceOver (Mac/iOS)

**Expected Result:**
- ✅ Labels are announced
- ✅ Required fields are indicated
- ✅ Error messages are announced
- ✅ Success messages are announced
- ✅ Button purposes are clear

**Status:** [ ] Pass [ ] Fail

---

### Test 5.5: Visual Design
**Verify:**
- ✅ Colors match design system
- ✅ Fonts are consistent
- ✅ Spacing is appropriate
- ✅ Animations are smooth
- ✅ Loading spinner is visible
- ✅ Success/error states are clear
- ✅ No visual glitches

**Status:** [ ] Pass [ ] Fail

---

## Test Suite 6: Integration

### Test 6.1: Tool Registry Integration
**Steps:**
1. Check tool-registry.js
2. Verify all 8 generators are registered
3. Verify correct step associations

**Expected Result:**
- ✅ All 8 tools in registry
- ✅ Correct URL paths
- ✅ Engine set to 'guide'
- ✅ Mode set to 'embedded'
- ✅ Step numbers correct

**Status:** [ ] Pass [ ] Fail

---

### Test 6.2: Step Data Integration
**Steps:**
1. Check stepData object in HTML
2. Verify generators appear in correct steps
3. Verify titles match

**Expected Result:**
- ✅ Tools in additionalTools arrays
- ✅ Correct step placement
- ✅ Titles match exactly

**Status:** [ ] Pass [ ] Fail

---

### Test 6.3: Function Override
**Steps:**
1. Open browser console
2. Type: `window.openTool('carrier-submission-cover-letter-generator', 10)`
3. Press Enter

**Expected Result:**
- ✅ Modal opens (not page redirect)
- ✅ Correct generator loads
- ✅ No console errors

**Test with non-generator tool:**
```javascript
window.openTool('policy-intelligence-engine', 1)
```

**Expected Result:**
- ✅ Original behavior (redirect or other action)
- ✅ No modal opens

**Status:** [ ] Pass [ ] Fail

---

## Test Suite 7: Performance

### Test 7.1: Modal Load Time
**Steps:**
1. Click generator tool
2. Measure time until modal fully visible

**Expected Result:**
- ✅ Modal appears in < 100ms
- ✅ Animation is smooth (60fps)
- ✅ No layout shift

**Status:** [ ] Pass [ ] Fail

---

### Test 7.2: AI Generation Time
**Steps:**
1. Fill form with typical data
2. Click generate
3. Measure time until result appears

**Expected Result:**
- ✅ Response in 3-5 seconds (typical)
- ✅ Maximum 10 seconds
- ✅ Loading state throughout

**Status:** [ ] Pass [ ] Fail

---

### Test 7.3: Memory Usage
**Steps:**
1. Open and close modal 10 times
2. Generate documents 5 times
3. Check browser memory usage

**Expected Result:**
- ✅ No significant memory increase
- ✅ No memory leaks
- ✅ Performance stays consistent

**Status:** [ ] Pass [ ] Fail

---

## Test Suite 8: Edge Cases

### Test 8.1: Very Long Input
**Steps:**
1. Fill textarea with 5000+ characters
2. Generate document

**Expected Result:**
- ✅ Form accepts long input
- ✅ AI processes successfully
- ✅ Output includes all content
- ✅ No truncation

**Status:** [ ] Pass [ ] Fail

---

### Test 8.2: Special Characters
**Steps:**
1. Enter special characters: `<>&"'`
2. Enter emojis: 🏠🔥💧
3. Enter accented characters: àéîöü
4. Generate document

**Expected Result:**
- ✅ All characters accepted
- ✅ No XSS vulnerabilities
- ✅ Characters appear correctly in output
- ✅ No encoding issues

**Status:** [ ] Pass [ ] Fail

---

### Test 8.3: Rapid Clicking
**Steps:**
1. Fill form
2. Click "Generate with AI" 5 times rapidly

**Expected Result:**
- ✅ Only one request is sent
- ✅ Button disables during generation
- ✅ No duplicate documents
- ✅ No errors

**Status:** [ ] Pass [ ] Fail

---

### Test 8.4: Browser Back Button
**Steps:**
1. Open modal
2. Generate document
3. Click browser back button

**Expected Result:**
- ✅ Modal closes OR
- ✅ Page behavior is appropriate
- ✅ No broken state

**Status:** [ ] Pass [ ] Fail

---

## Test Suite 9: Cross-Browser

### Test 9.1: Chrome/Edge
**Version:** Latest
**All Test Suites:** Run 1-8

**Status:** [ ] Pass [ ] Fail

---

### Test 9.2: Firefox
**Version:** Latest
**All Test Suites:** Run 1-8

**Status:** [ ] Pass [ ] Fail

---

### Test 9.3: Safari
**Version:** Latest
**All Test Suites:** Run 1-8

**Known Issues:**
- Clipboard API may require user gesture
- Date picker format may differ

**Status:** [ ] Pass [ ] Fail

---

### Test 9.4: Mobile Chrome (Android)
**All Test Suites:** Run 1-8 (focus on 5.2)

**Status:** [ ] Pass [ ] Fail

---

### Test 9.5: Mobile Safari (iOS)
**All Test Suites:** Run 1-8 (focus on 5.2)

**Status:** [ ] Pass [ ] Fail

---

## Test Suite 10: Security

### Test 10.1: XSS Prevention
**Steps:**
1. Enter script tags in fields: `<script>alert('XSS')</script>`
2. Generate document
3. View output

**Expected Result:**
- ✅ Script tags are escaped or removed
- ✅ No alert appears
- ✅ No script execution

**Status:** [ ] Pass [ ] Fail

---

### Test 10.2: SQL Injection Prevention
**Steps:**
1. Enter SQL: `'; DROP TABLE users; --`
2. Generate document

**Expected Result:**
- ✅ Treated as text
- ✅ No database errors
- ✅ Document generates normally

**Status:** [ ] Pass [ ] Fail

---

### Test 10.3: API Key Exposure
**Steps:**
1. Open browser dev tools
2. Generate document
3. Check Network tab
4. Check Console
5. Check Page source

**Expected Result:**
- ✅ API key not visible in requests
- ✅ API key not in console logs
- ✅ API key not in page source
- ✅ API calls go through Netlify function

**Status:** [ ] Pass [ ] Fail

---

## Bug Report Template

If you find a bug, document it using this template:

```markdown
## Bug Report

**Bug ID:** [Unique ID]
**Date Found:** [Date]
**Tester:** [Your Name]
**Severity:** [Critical / High / Medium / Low]

### Environment
- Browser: [Browser name and version]
- OS: [Operating system]
- Device: [Desktop / Mobile / Tablet]
- Screen Size: [Resolution]

### Test Case
- Test Suite: [Number and name]
- Test Number: [Specific test]

### Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Step 3]

### Expected Result
[What should happen]

### Actual Result
[What actually happened]

### Screenshots
[Attach screenshots if applicable]

### Console Errors
[Copy any console errors]

### Additional Notes
[Any other relevant information]
```

---

## Sign-Off Checklist

Before marking as production-ready:

- [ ] All Test Suites completed
- [ ] All critical bugs fixed
- [ ] All high-priority bugs fixed
- [ ] Medium/low bugs documented
- [ ] Cross-browser testing complete
- [ ] Mobile testing complete
- [ ] Accessibility testing complete
- [ ] Performance benchmarks met
- [ ] Security review passed
- [ ] Documentation complete
- [ ] User guide created
- [ ] Training materials prepared

---

## Test Results Summary

**Test Date:** _______________  
**Tester:** _______________  
**Environment:** _______________

| Test Suite | Tests Passed | Tests Failed | Pass Rate |
|-----------|--------------|--------------|-----------|
| 1. Modal Functionality | __ / __ | __ | __% |
| 2. Form Validation | __ / __ | __ | __% |
| 3. AI Generation | __ / __ | __ | __% |
| 4. User Actions | __ / __ | __ | __% |
| 5. UI/UX | __ / __ | __ | __% |
| 6. Integration | __ / __ | __ | __% |
| 7. Performance | __ / __ | __ | __% |
| 8. Edge Cases | __ / __ | __ | __% |
| 9. Cross-Browser | __ / __ | __ | __% |
| 10. Security | __ / __ | __ | __% |
| **TOTAL** | **__ / __** | **__** | **__%** |

**Overall Status:** [ ] PASS [ ] FAIL

**Sign-Off:** _______________  
**Date:** _______________

---

**Last Updated:** January 6, 2026  
**Version:** 1.0



