# Compliance Subsystem QA Checklist

This document provides a comprehensive QA checklist for the Compliance subsystem, including the Compliance Engine, Health Score, Alerts, and Dashboard components.

## Test Environment Setup

- **Supabase**: Ensure `compliance_alerts`, `compliance_health_snapshots`, `compliance_engine_audits`, and `deadlines` tables exist
- **Netlify Functions**: Verify all functions are deployed:
  - `/netlify/functions/compliance-engine/analyze`
  - `/netlify/functions/compliance-engine/generate-alerts`
  - `/netlify/functions/compliance-engine/health-score`
  - `/netlify/functions/compliance-engine/apply-deadlines`
  - `/netlify/functions/compliance-engine/run-violation-check`
- **Authentication**: User must be logged in with valid Supabase session
- **Intake Data**: User should have completed intake form with state, carrier, and claim type

---

## 1. Engine & Health Score

### 1.1 Compliance Engine Analysis

**Test Case**: Run Compliance Engine on a simple claim scenario

**Steps**:
1. Navigate to `/app/resource-center/compliance-engine.html`
2. Fill in form:
   - State: `CA`
   - Carrier: `State Farm`
   - Claim Type: `Property`
   - Claim Reference: `TEST-001`
3. Add timeline summary: "Day 1: Loss occurred. Day 3: Reported claim. Day 15: Received acknowledgment."
4. Click "Run Compliance Audit"

**Expected Results**:
- ✅ Analysis completes without errors
- ✅ Results panel displays with sections:
  - Overall Summary
  - Timeline & Deadline Analysis
  - Compliance Findings
  - Potential Bad Faith Concerns
  - Carrier Behavior Patterns
  - Documentation & Evidence Gaps
  - Recommended Professional Next Steps
- ✅ No console errors
- ✅ PDF export button works

**Pass/Fail**: ☐ Pass ☐ Fail

**Notes**: _________________________________________________

---

### 1.2 Health Score Calculation

**Test Case**: Calculate health score for a claim

**Steps**:
1. Ensure user has some compliance alerts (create test alerts if needed)
2. Navigate to any page with compliance health widget (e.g., Compliance Engine page)
3. Widget should load automatically

**Expected Results**:
- ✅ Health score displays as number between 0-100
- ✅ Status label shows: "Good", "Watch", "Elevated Risk", or "Critical"
- ✅ Color coding matches status:
  - Good: Green (#10b981)
  - Watch: Amber (#f59e0b)
  - Elevated Risk: Orange (#f97316)
  - Critical: Red (#ef4444)
- ✅ Key factors list shows top 3 factors
- ✅ Disclaimer text: "Compliance Health Indicator, not legal advice."
- ✅ "View Full Compliance Dashboard" button links correctly

**Pass/Fail**: ☐ Pass ☐ Fail

**Notes**: _________________________________________________

---

### 1.3 Health Score API Direct Test

**Test Case**: Test health-score function directly via API

**Steps**:
1. Use Postman or curl to POST to `/.netlify/functions/compliance-engine/health-score`
2. Body:
```json
{
  "state": "CA",
  "carrier": "State Farm",
  "claimType": "Property",
  "claimId": "test-claim-123"
}
```
3. Include Authorization header with valid token

**Expected Results**:
- ✅ Returns 200 status
- ✅ Response includes:
  - `score`: number 0-100
  - `status`: "good" | "watch" | "elevated-risk" | "critical"
  - `factors`: array of strings
  - `recommendations`: array of strings
  - `disclaimer`: string
- ✅ No runtime errors in Netlify logs

**Pass/Fail**: ☐ Pass ☐ Fail

**Notes**: _________________________________________________

---

## 2. UI & Integrations

### 2.1 Compliance Engine Page

**Test Case**: Full page functionality

**Steps**:
1. Navigate to `/app/resource-center/compliance-engine.html`
2. Verify all sections load
3. Test form submission
4. Test file upload
5. Test event log modal

**Expected Results**:
- ✅ Page loads without console errors
- ✅ Compliance Health Widget appears at top
- ✅ All form fields are functional
- ✅ File upload works (drag & drop and click)
- ✅ Event modal opens/closes correctly
- ✅ Results display correctly after submission
- ✅ PDF export works
- ✅ All collapsible sections expand/collapse

**Pass/Fail**: ☐ Pass ☐ Fail

**Notes**: _________________________________________________

---

### 2.2 Health Widget on Multiple Pages

**Test Case**: Widget appears and functions on all target pages

**Pages to Test**:
1. Compliance Engine (`/app/resource-center/compliance-engine.html`)
2. Deadlines Tool (`/app/deadlines.html`)
3. Claim Stage Tracker (if HTML page exists)

**Expected Results**:
- ✅ Widget container exists on each page
- ✅ Widget loads and displays score
- ✅ Score is a valid number (0-100)
- ✅ Status label is one of: Good, Watch, Elevated Risk, Critical
- ✅ Color coding matches status
- ✅ No console errors
- ✅ Widget handles missing intake data gracefully

**Pass/Fail**: ☐ Pass ☐ Fail

**Notes**: _________________________________________________

---

### 2.3 Deadlines Tool Integration

**Test Case**: Deadlines tool shows compliance-fed deadlines

**Steps**:
1. Navigate to `/app/deadlines.html`
2. Ensure intake data is complete
3. Click "Refresh Deadlines from Compliance Engine" (if button exists)
4. Verify deadlines appear

**Expected Results**:
- ✅ Compliance Health Widget appears above deadlines list
- ✅ Deadlines load from database
- ✅ Compliance Engine refresh button works (if present)
- ✅ Deadlines show correct dates and priorities
- ✅ No console errors

**Pass/Fail**: ☐ Pass ☐ Fail

**Notes**: _________________________________________________

---

### 2.4 Stage Tracker Integration

**Test Case**: Stage tracker shows compliance notes per stage

**Steps**:
1. Navigate to claim stage tracker page
2. Update a stage
3. Verify compliance notes panel appears

**Expected Results**:
- ✅ Compliance Health Widget appears (if container exists)
- ✅ Stage updates trigger compliance check
- ✅ Compliance notes panel displays for current stage
- ✅ Notes include overall summary, violations, recommended actions
- ✅ Link to full compliance report works

**Pass/Fail**: ☐ Pass ☐ Fail

**Notes**: _________________________________________________

---

## 3. Alerts & Dashboard

### 3.1 Alert Generation

**Test Case**: Creating a violation scenario generates alerts

**Steps**:
1. Create a test scenario:
   - Add a deadline that's already passed
   - Or: Add an event indicating carrier delay
2. Trigger alert generation (via Evidence Organizer, Deadlines, or Bad Faith Tracker)
3. Check Alert Center

**Expected Results**:
- ✅ Alert is generated with appropriate severity
- ✅ Alert appears in Alert Center
- ✅ Alert has correct title, description, recommended action
- ✅ Alert is stored in `compliance_alerts` table
- ✅ Alert badge count updates

**Pass/Fail**: ☐ Pass ☐ Fail

**Notes**: _________________________________________________

---

### 3.2 Alert Badge

**Test Case**: Alert badge shows correct count

**Steps**:
1. Create multiple alerts (high, medium, low severity)
2. Navigate to any page with navigation header
3. Check alert badge

**Expected Results**:
- ✅ Badge appears in navigation (if script is included)
- ✅ Badge shows correct count of active alerts
- ✅ Badge hides when count is 0
- ✅ Badge links to `/app/resource-center/compliance-alerts.html`
- ✅ Badge updates when alerts are resolved

**Pass/Fail**: ☐ Pass ☐ Fail

**Notes**: _________________________________________________

---

### 3.3 Alert Center

**Test Case**: Alert center loads and functions correctly

**Steps**:
1. Navigate to `/app/resource-center/compliance-alerts.html`
2. Verify alerts load
3. Test filtering
4. Test sorting
5. Test resolving an alert
6. Test viewing alert details
7. Test PDF export

**Expected Results**:
- ✅ Page loads without errors
- ✅ Statistics show correct counts (high, medium, low, resolved)
- ✅ Active alerts display correctly
- ✅ Filters work (all, high, medium, low, deadline, documentation, etc.)
- ✅ Sorting works (by date, by severity)
- ✅ Resolve button marks alert as resolved
- ✅ Alert details modal shows full information
- ✅ PDF export generates valid PDF file
- ✅ "Add to Journal" works
- ✅ "Sync to Timeline" works

**Pass/Fail**: ☐ Pass ☐ Fail

**Notes**: _________________________________________________

---

### 3.4 PDF Alert Report

**Test Case**: Generate PDF report for an alert

**Steps**:
1. Navigate to Alert Center
2. Click "View Details" on an alert
3. Click "Generate PDF Report"

**Expected Results**:
- ✅ PDF downloads successfully
- ✅ PDF contains:
  - Alert title
  - Severity badge
  - Date
  - Description
  - Rule violated
  - Recommended action
  - Related timeline event (if applicable)
  - Category
  - Footer with generation date
- ✅ PDF is properly formatted
- ✅ No console errors

**Pass/Fail**: ☐ Pass ☐ Fail

**Notes**: _________________________________________________

---

### 3.5 Compliance Dashboard

**Test Case**: Dashboard section on Compliance Engine page

**Steps**:
1. Navigate to `/app/resource-center/compliance-engine.html`
2. Run a compliance audit
3. Check if dashboard section appears

**Expected Results**:
- ✅ Dashboard section appears after analysis
- ✅ Shows statistics:
  - Active Alerts count
  - High Severity count
  - Total Deadlines count
  - Upcoming (7 days) count
- ✅ "Open Alert Center" button links correctly
- ✅ Statistics are accurate

**Pass/Fail**: ☐ Pass ☐ Fail

**Notes**: _________________________________________________

---

## 4. Data Persistence

### 4.1 Compliance Alerts Storage

**Test Case**: Alerts are stored in Supabase

**Steps**:
1. Generate an alert (via any integrated tool)
2. Check Supabase `compliance_alerts` table

**Expected Results**:
- ✅ Alert record exists in table
- ✅ All fields populated correctly:
  - `user_id`
  - `alert_type`
  - `severity`
  - `title`
  - `description`
  - `recommended_action`
  - `state_rule`
  - `category`
  - `created_at`
- ✅ `resolved_at` is NULL for active alerts
- ✅ RLS policies allow user to see their own alerts

**Pass/Fail**: ☐ Pass ☐ Fail

**Notes**: _________________________________________________

---

### 4.2 Health Score Snapshots

**Test Case**: Health score snapshots are stored

**Steps**:
1. Trigger health score calculation (via widget or API)
2. Check Supabase `compliance_health_snapshots` table

**Expected Results**:
- ✅ Snapshot record exists in table
- ✅ All fields populated:
  - `user_id`
  - `claim_id` (if provided)
  - `state`
  - `carrier`
  - `claim_type`
  - `score` (0-100)
  - `status` (good/watch/elevated-risk/critical)
  - `factors` (JSONB array)
  - `recommendations` (JSONB array)
  - `created_at`
- ✅ RLS policies allow user to see their own snapshots

**Pass/Fail**: ☐ Pass ☐ Fail

**Notes**: _________________________________________________

---

### 4.3 RLS Policy Validation

**Test Case**: Row Level Security works correctly

**Steps**:
1. Create alerts as User A
2. Log in as User B
3. Attempt to view User A's alerts

**Expected Results**:
- ✅ User B cannot see User A's alerts
- ✅ User B cannot modify User A's alerts
- ✅ User B can only see their own alerts
- ✅ No errors in console (should fail silently or return empty)

**Pass/Fail**: ☐ Pass ☐ Fail

**Notes**: _________________________________________________

---

## 5. Error Handling & Edge Cases

### 5.1 Missing Intake Data

**Test Case**: Widget handles missing intake data

**Steps**:
1. Clear intake data (or use new session)
2. Navigate to page with health widget

**Expected Results**:
- ✅ Widget shows message: "Complete intake form to view compliance health score."
- ✅ No console errors
- ✅ Page still functions normally

**Pass/Fail**: ☐ Pass ☐ Fail

**Notes**: _________________________________________________

---

### 5.2 Network Errors

**Test Case**: Handle API failures gracefully

**Steps**:
1. Disable network (or block API calls)
2. Attempt to load health widget
3. Attempt to run compliance audit

**Expected Results**:
- ✅ Widget shows error message: "Unable to load compliance health score. Please try again later."
- ✅ Compliance Engine shows error message
- ✅ No unhandled exceptions
- ✅ User can retry

**Pass/Fail**: ☐ Pass ☐ Fail

**Notes**: _________________________________________________

---

### 5.3 Empty States

**Test Case**: Handle empty data gracefully

**Steps**:
1. Use account with no alerts, no deadlines
2. Check all pages

**Expected Results**:
- ✅ Alert Center shows "No active alerts"
- ✅ Health score shows 100 (perfect score)
- ✅ Dashboard shows 0 counts
- ✅ No errors or broken UI

**Pass/Fail**: ☐ Pass ☐ Fail

**Notes**: _________________________________________________

---

## 6. Performance

### 6.1 Widget Load Time

**Test Case**: Health widget loads quickly

**Steps**:
1. Open browser DevTools Network tab
2. Navigate to page with widget
3. Measure load time

**Expected Results**:
- ✅ Widget loads within 2 seconds
- ✅ API call completes within 1 second
- ✅ No unnecessary API calls

**Pass/Fail**: ☐ Pass ☐ Fail

**Notes**: _________________________________________________

---

### 6.2 Alert Polling

**Test Case**: Alert polling doesn't cause performance issues

**Steps**:
1. Open Alert Center
2. Leave page open for 5 minutes
3. Check network tab

**Expected Results**:
- ✅ Polling occurs every 30 seconds (not more frequent)
- ✅ Polling stops when page is hidden
- ✅ No memory leaks
- ✅ No excessive API calls

**Pass/Fail**: ☐ Pass ☐ Fail

**Notes**: _________________________________________________

---

## Summary

**Total Test Cases**: 20+

**Passed**: ☐ ___

**Failed**: ☐ ___

**Blocked**: ☐ ___

**Overall Status**: ☐ Pass ☐ Fail ☐ Needs Work

**Critical Issues Found**: _________________________________________________

**Recommendations**: _________________________________________________

---

## Notes

- All tests should be run in a staging/test environment first
- Use test data that doesn't affect production
- Document any browser-specific issues
- Test on mobile devices for responsive design
- Verify accessibility (keyboard navigation, screen readers)


