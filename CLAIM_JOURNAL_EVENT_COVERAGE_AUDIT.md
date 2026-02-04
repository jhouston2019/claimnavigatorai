# CLAIM JOURNAL EVENT COVERAGE AUDIT

**Date**: January 7, 2026  
**Auditor**: AI Assistant  
**Status**: AUDIT COMPLETE - AWAITING FIX AUTHORIZATION

---

## ARTIFACT 1: CANONICAL EVENT LIST (LOCKED)

### A. CLAIM LIFECYCLE

| Event ID | Event Name | Required |
|----------|-----------|----------|
| A.1 | Claim Created | YES |
| A.2 | Claim Reopened | YES |
| A.3 | Claim Closed | YES |
| A.4 | Claim Status Changed | YES |

### B. STEP PROGRESSION

| Event ID | Event Name | Required |
|----------|-----------|----------|
| B.1 | Step Started | YES |
| B.2 | Step Completed | YES |
| B.3 | Step Revisited/Edited | NO (not tracked) |

### C. TOOL USAGE

| Event ID | Event Name | Required |
|----------|-----------|----------|
| C.1 | AI Tool Executed | YES |
| C.2 | AI Tool Output Generated | YES |
| C.3 | Document Generator Executed | YES |
| C.4 | Document Generator Output | YES |
| C.5 | Advanced Tool Executed | YES |
| C.6 | Advanced Tool Output | YES |

### D. DOCUMENTS

| Event ID | Event Name | Required |
|----------|-----------|----------|
| D.1 | Document Generated (System) | YES |
| D.2 | Document Uploaded (User) | YES |
| D.3 | Document Updated/Replaced | YES |
| D.4 | Document Deleted | NO (not allowed) |

### E. SUBMISSIONS (CRITICAL)

| Event ID | Event Name | Required |
|----------|-----------|----------|
| E.1 | Submission Prepared | YES |
| E.2 | Submission Sent | YES |
| E.3 | Submission Resent | YES |
| E.4 | Submission Failed | YES |

### F. FINANCIAL EVENTS (CRITICAL)

| Event ID | Event Name | Required |
|----------|-----------|----------|
| F.1 | Carrier Payment Recorded | YES |
| F.2 | Partial Payment Recorded | YES |
| F.3 | Additional Payment Recorded | YES |
| F.4 | Payment Reversal/Adjustment | YES |

### G. DEADLINES

| Event ID | Event Name | Required |
|----------|-----------|----------|
| G.1 | Deadline Created | YES |
| G.2 | Deadline Updated | YES |
| G.3 | Deadline Missed | YES |
| G.4 | Deadline Completed | YES |

### H. USER ACTIONS

| Event ID | Event Name | Required |
|----------|-----------|----------|
| H.1 | User Note Added | YES |
| H.2 | User Note Edited | NO (not allowed - append-only) |

---

## ARTIFACT 2: EVENT COVERAGE MAPPING TABLE

### A. CLAIM LIFECYCLE

| Event Name | Source File(s) | Trigger Condition | Logged? | Where Logged |
|------------|---------------|-------------------|---------|--------------|
| **A.1** Claim Created | `netlify/functions/create-claim.js` | POST to create-claim endpoint | **NO** | NOT LOGGED |
| **A.2** Claim Reopened | NOT FOUND | Status change to 'active' from 'completed' | **NO** | NOT LOGGED |
| **A.3** Claim Closed | NOT FOUND | Status change to 'completed' or 'cancelled' | **NO** | NOT LOGGED |
| **A.4** Claim Status Changed | `supabase/claims-licensing-schema.sql` | UPDATE claims SET status | **NO** | NOT LOGGED |

### B. STEP PROGRESSION

| Event Name | Source File(s) | Trigger Condition | Logged? | Where Logged |
|------------|---------------|-------------------|---------|--------------|
| **B.1** Step Started | `step-by-step-claim-guide.html` | User clicks step accordion | **NO** | NOT LOGGED |
| **B.2** Step Completed | `step-by-step-claim-guide.html` | Step marked complete (22 occurrences found) | **NO** | NOT LOGGED |
| **B.3** Step Revisited/Edited | N/A | Not tracked | N/A | N/A |

### C. TOOL USAGE

| Event Name | Source File(s) | Trigger Condition | Logged? | Where Logged |
|------------|---------------|-------------------|---------|--------------|
| **C.1** AI Tool Executed | `app/assets/js/controllers/ai-tool-controller.js:121-267` | handleAnalyze() called | **YES** | `claim_timeline` via addTimelineEvent() line 228 |
| **C.2** AI Tool Output Generated | `app/assets/js/controllers/ai-tool-controller.js:210-221` | saveToClaimJournal() called | **YES** | `journal_entries` table line 211 |
| **C.3** Document Generator Executed | `app/assets/js/controllers/document-generator-controller.js:133-268` | handleGenerate() called | **YES** | `claim_timeline` via addTimelineEvent() line 229 |
| **C.4** Document Generator Output | `app/assets/js/controllers/document-generator-controller.js:211-222` | saveToClaimJournal() called | **YES** | `journal_entries` table line 212 |
| **C.5** Advanced Tool Executed | `app/assets/js/advanced-tools/*.js` | Various tool handlers | **PARTIAL** | Some tools call addTimelineEvent(), not all |
| **C.6** Advanced Tool Output | `app/assets/js/advanced-tools/*.js` | Tool completion | **PARTIAL** | Inconsistent across tools |

### D. DOCUMENTS

| Event Name | Source File(s) | Trigger Condition | Logged? | Where Logged |
|------------|---------------|-------------------|---------|--------------|
| **D.1** Document Generated (System) | `app/assets/js/controllers/document-generator-controller.js:228-240` | Document generation complete | **YES** | `claim_timeline` via addTimelineEvent() |
| **D.2** Document Uploaded (User) | `app/assets/js/tools/evidence-organizer.js:182` | File upload complete | **YES** | `claim_timeline` via addEvidenceTimelineEvent() |
| **D.2b** Document Uploaded (API) | `netlify/functions/api/evidence-upload.js:84-108` | API evidence upload | **YES** | `claim_timeline` direct insert line 92 |
| **D.3** Document Updated/Replaced | NOT FOUND | Document update action | **NO** | NOT LOGGED |
| **D.4** Document Deleted | N/A | Not allowed | N/A | N/A |

### E. SUBMISSIONS (CRITICAL)

| Event Name | Source File(s) | Trigger Condition | Logged? | Where Logged |
|------------|---------------|-------------------|---------|--------------|
| **E.1** Submission Prepared | NOT FOUND | Submission package created | **NO** | NOT LOGGED |
| **E.2** Submission Sent | `app/assets/js/fnol-wizard.js:563-603` | FNOL submitted | **YES** | `claim_journal` table via addToClaimJournal() |
| **E.2b** Submission Sent | `app/assets/js/fnol-wizard.js:608-633` | FNOL submitted | **YES** | `claim_timeline` via addToTimeline() |
| **E.2c** Submission Sent | `netlify/functions/fnol-submit.js:510-531` | FNOL backend processing | **YES** | `fnol_submissions` table line 512 |
| **E.2d** Submission Sent | `app/api/event-bus.js:27-31` | fnol.created event | **YES** | `claim_timeline` via event bus |
| **E.3** Submission Resent | NOT FOUND | Resubmission action | **NO** | NOT LOGGED |
| **E.4** Submission Failed | NOT FOUND | Submission error | **NO** | NOT LOGGED |

### F. FINANCIAL EVENTS (CRITICAL)

| Event Name | Source File(s) | Trigger Condition | Logged? | Where Logged |
|------------|---------------|-------------------|---------|--------------|
| **F.1** Carrier Payment Recorded | `supabase/migrations/20250101_statement_of_loss_schema.sql` | INSERT into claim_financials | **NO** | Table exists, no timeline integration |
| **F.2** Partial Payment Recorded | `supabase/migrations/20250101_statement_of_loss_schema.sql` | INSERT into claim_financials | **NO** | Table exists, no timeline integration |
| **F.3** Additional Payment Recorded | `supabase/migrations/20250101_statement_of_loss_schema.sql` | INSERT into claim_financials | **NO** | Table exists, no timeline integration |
| **F.4** Payment Reversal/Adjustment | `supabase/migrations/20250101_statement_of_loss_schema.sql` | INSERT into claim_financials | **NO** | Table exists, no timeline integration |
| **F.5** Payment via CN Agent | `netlify/functions/run-agent.js:569-809` | detect_payment action | **NOT CONFIRMED** | CN Agent logs to agent_logs, timeline unclear |

### G. DEADLINES

| Event Name | Source File(s) | Trigger Condition | Logged? | Where Logged |
|------------|---------------|-------------------|---------|--------------|
| **G.1** Deadline Created | `app/assets/js/tools/deadlines-tracker.js:288-314` | Deadline detected/added | **YES** | `claim_timeline` via addTimelineEvent() line 296 |
| **G.1b** Deadline Created | `app/api/event-bus.js:51-56` | deadline.detected event | **YES** | `claim_timeline` via event bus |
| **G.1c** Deadline Created | `app/timeline.html:229-236` | Compliance deadline added | **YES** | `claim_timeline_deadlines` table |
| **G.2** Deadline Updated | NOT FOUND | Deadline modification | **NO** | NOT LOGGED |
| **G.3** Deadline Missed | NOT FOUND | Deadline past due | **NO** | NOT LOGGED |
| **G.4** Deadline Completed | NOT FOUND | Deadline marked complete | **NO** | NOT LOGGED |

### H. USER ACTIONS

| Event Name | Source File(s) | Trigger Condition | Logged? | Where Logged |
|------------|---------------|-------------------|---------|--------------|
| **H.1** User Note Added | `app/assets/js/tools/claim-journal.js:59-73` | Manual journal entry | **YES** | `documents` table as journal_entry type |
| **H.1b** User Note Added | `app/assets/js/tools/claim-journal.js:78-101` | Manual journal entry | **YES** | `claim_timeline` via addJournalTimelineEvent() |
| **H.2** User Note Edited | N/A | Not allowed (append-only) | N/A | N/A |

---

## ARTIFACT 3: GAP / SHIP-BLOCKER LIST

### 🚨 SHIP BLOCKERS (MUST FIX BEFORE LAUNCH)

#### **SB-1: CLAIM LIFECYCLE NOT LOGGED**
- **Event**: Claim Created (A.1)
- **What Occurs**: User creates claim via `create-claim.js` endpoint
- **Why Dangerous**: 
  - **Legal**: No audit trail of claim initiation
  - **Audit**: Cannot prove when claim was filed
  - **UX**: Journal shows activity without showing claim creation
- **Severity**: **SHIP BLOCKER**
- **Source**: `netlify/functions/create-claim.js:130`
- **Fix Required**: Add timeline event after claim INSERT

#### **SB-2: CLAIM STATUS CHANGES NOT LOGGED**
- **Events**: Claim Reopened (A.2), Claim Closed (A.3), Claim Status Changed (A.4)
- **What Occurs**: Claim status updated in database
- **Why Dangerous**:
  - **Legal**: No record of claim lifecycle transitions
  - **Audit**: Cannot prove when claim was settled/closed
  - **UX**: Missing critical milestones in journal
- **Severity**: **SHIP BLOCKER**
- **Source**: No status change handler found
- **Fix Required**: Add trigger or application-level logging for status changes

#### **SB-3: STEP COMPLETION NOT LOGGED**
- **Event**: Step Completed (B.2)
- **What Occurs**: User completes step in step-by-step guide (22 instances found)
- **Why Dangerous**:
  - **Legal**: No proof of policyholder due diligence
  - **Audit**: Cannot demonstrate claim process followed
  - **UX**: Major workflow milestones missing from journal
- **Severity**: **SHIP BLOCKER**
- **Source**: `step-by-step-claim-guide.html` (step completion handlers)
- **Fix Required**: Add timeline event on step completion

#### **SB-4: FINANCIAL EVENTS NOT LOGGED TO TIMELINE**
- **Events**: All F.* events (F.1-F.4)
- **What Occurs**: Payments recorded in `claim_financials` table
- **Why Dangerous**:
  - **Legal**: No timeline proof of payment receipt
  - **Audit**: Financial events isolated from claim narrative
  - **UX**: Payments don't appear in chronological journal
- **Severity**: **SHIP BLOCKER**
- **Source**: `supabase/migrations/20250101_statement_of_loss_schema.sql`
- **Fix Required**: Add timeline event when inserting into claim_financials

#### **SB-5: SUBMISSION FAILURES NOT LOGGED**
- **Event**: Submission Failed (E.4)
- **What Occurs**: FNOL or document submission fails
- **Why Dangerous**:
  - **Legal**: No record of attempted submissions
  - **Audit**: Cannot prove policyholder tried to submit
  - **UX**: User may not realize submission failed
- **Severity**: **SHIP BLOCKER**
- **Source**: Error handlers in submission flows
- **Fix Required**: Add timeline event on submission error

---

### ⚠️ HIGH PRIORITY (SHOULD FIX BEFORE LAUNCH)

#### **H-1: SUBMISSION PREPARATION NOT LOGGED**
- **Event**: Submission Prepared (E.1)
- **What Occurs**: User assembles submission package
- **Why Dangerous**:
  - **Audit**: Gap between document creation and submission
  - **UX**: Missing intermediate milestone
- **Severity**: **HIGH**
- **Fix Required**: Add event when submission package created

#### **H-2: SUBMISSION RESEND NOT LOGGED**
- **Event**: Submission Resent (E.3)
- **What Occurs**: User resends failed/rejected submission
- **Why Dangerous**:
  - **Audit**: Cannot track resubmission attempts
  - **UX**: Duplicate submissions not explained
- **Severity**: **HIGH**
- **Fix Required**: Add timeline event on resubmission

#### **H-3: DEADLINE LIFECYCLE INCOMPLETE**
- **Events**: Deadline Updated (G.2), Deadline Missed (G.3), Deadline Completed (G.4)
- **What Occurs**: Deadline status changes
- **Why Dangerous**:
  - **Legal**: Cannot prove deadline compliance
  - **Audit**: Incomplete deadline tracking
  - **UX**: Deadlines appear but never resolve
- **Severity**: **HIGH**
- **Fix Required**: Add timeline events for deadline state changes

#### **H-4: DOCUMENT UPDATES NOT LOGGED**
- **Event**: Document Updated/Replaced (D.3)
- **What Occurs**: User replaces or updates existing document
- **Why Dangerous**:
  - **Audit**: Cannot track document version history
  - **UX**: Document changes invisible
- **Severity**: **HIGH**
- **Fix Required**: Add timeline event on document update

---

### ℹ️ MEDIUM PRIORITY (NICE TO HAVE)

#### **M-1: STEP STARTED NOT LOGGED**
- **Event**: Step Started (B.1)
- **What Occurs**: User begins working on a step
- **Why Dangerous**:
  - **UX**: Cannot show in-progress work
  - **Analytics**: Cannot track step engagement
- **Severity**: **MEDIUM**
- **Fix Required**: Add timeline event on step open

#### **M-2: ADVANCED TOOLS INCONSISTENT**
- **Events**: Advanced Tool Executed (C.5), Advanced Tool Output (C.6)
- **What Occurs**: Some advanced tools log, others don't
- **Why Dangerous**:
  - **Audit**: Incomplete tool usage record
  - **UX**: Some tool usage invisible
- **Severity**: **MEDIUM**
- **Fix Required**: Standardize timeline logging across all advanced tools

---

## SUMMARY STATISTICS

### Coverage by Category

| Category | Events Defined | Events Logged | Coverage % | Ship Blockers |
|----------|---------------|---------------|------------|---------------|
| **A. Claim Lifecycle** | 4 | 0 | 0% | 2 |
| **B. Step Progression** | 2 | 0 | 0% | 1 |
| **C. Tool Usage** | 6 | 4 | 67% | 0 |
| **D. Documents** | 3 | 2 | 67% | 0 |
| **E. Submissions** | 4 | 1 | 25% | 2 |
| **F. Financial Events** | 4 | 0 | 0% | 1 |
| **G. Deadlines** | 4 | 1 | 25% | 0 |
| **H. User Actions** | 1 | 1 | 100% | 0 |
| **TOTAL** | **28** | **9** | **32%** | **6** |

### Ship Blocker Summary

- **Total Ship Blockers**: 6
- **High Priority**: 4
- **Medium Priority**: 2

### Critical Gaps

1. **Claim lifecycle completely unlogged** (0% coverage)
2. **Step progression completely unlogged** (0% coverage)
3. **Financial events completely unlogged** (0% coverage)
4. **Submission lifecycle incomplete** (25% coverage)
5. **Deadline lifecycle incomplete** (25% coverage)

---

## AUDIT CONCLUSION

**Status**: ❌ **NOT READY FOR LAUNCH**

**Critical Issues**: 6 ship blockers identified

**Recommendation**: **DO NOT LAUNCH** until all ship blockers are resolved.

### Legal Risk Assessment

- **HIGH RISK**: No claim lifecycle audit trail
- **HIGH RISK**: No financial event timeline
- **HIGH RISK**: No step completion proof
- **MEDIUM RISK**: Incomplete submission tracking
- **MEDIUM RISK**: Incomplete deadline tracking

### Next Steps

1. **STOP**: Do not proceed with launch
2. **REVIEW**: Review this audit with stakeholders
3. **AUTHORIZE**: Obtain explicit authorization to implement fixes
4. **FIX**: Implement fixes for all 6 ship blockers
5. **VERIFY**: Re-audit after fixes implemented
6. **LAUNCH**: Only after 100% ship blocker resolution

---

## AUDIT COMPLETE

**Awaiting instruction**: "Implement fixes for the ship blockers."

**DO NOT PROCEED** with code modifications until explicitly authorized.



