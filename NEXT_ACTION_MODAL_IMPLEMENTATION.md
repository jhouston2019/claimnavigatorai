# Next Action Modal - Escalation System Implementation

## Overview

The Claim Command Center now features an intelligent, escalating Next Action Modal that guides users through the claim process with increasing urgency based on their behavior and time elapsed.

## ✅ Implementation Complete

### Core Features

1. **Automatic Modal Display**
   - Appears 500ms after page load
   - Identifies first incomplete step
   - Displays appropriate escalation level

2. **LocalStorage Persistence**
   - `claim_next_action_dismissals` - Tracks dismissal count
   - `claim_last_visit_timestamp` - Tracks last visit time
   - `claim_step_status` - Persists step completion state

3. **Time-Based Tracking**
   - Calculates days since last visit
   - Updates timestamp on each page load
   - First visit = 0 days (Tier 0)

4. **Escalation Logic**
   - 4 escalation tiers (0-3)
   - Based on BOTH dismissals AND days inactive
   - Resets to Tier 0 when step completed

## Escalation Tiers

### Tier 0 - First Visit / No Dismissals / < 2 Days
**Tone:** Firm, neutral

**Triggers:**
- First visit (no dismissals, < 2 days)
- Recently completed previous step

**Modal Behavior:**
- Standard "Next Action Required" header
- No escalation message block
- Base instruction only
- Close button (X) visible
- Click outside to dismiss
- "Dismiss for Now" link hidden

**Example:**
```
Next Action Required

You have not completed Step 1 — Review the Claim Process Guide.

Begin this step to continue building your claim properly.

[Start Step 1]
```

### Tier 1 - 1-2 Dismissals OR 2-4 Days Inactive
**Tone:** Direct

**Triggers:**
- 1-2 dismissals
- OR 2-4 days since last visit

**Modal Behavior:**
- Yellow escalation message block
- Close button (X) visible
- Click outside to dismiss
- "Dismiss for Now" link hidden

**Example:**
```
Next Action Required

You have not completed Step 2 — Review Your Policy.

┌─────────────────────────────────────────┐
│ Step 2 remains incomplete.              │
│                                         │
│ Delaying required steps slows           │
│ documentation and may affect claim      │
│ progress.                               │
└─────────────────────────────────────────┘

Upload your full insurance policy to begin coverage analysis.

[Start Step 2]
```

### Tier 2 - 3-4 Dismissals OR 5-7 Days Inactive
**Tone:** Financial risk emphasis

**Triggers:**
- 3-4 dismissals
- OR 5-7 days since last visit

**Modal Behavior:**
- Red escalation message block
- Shows days inactive if ≥5 days
- Close button (X) visible
- Click outside to dismiss
- "Dismiss for Now" link hidden

**Example (with 6 days inactive):**
```
Next Action Required

You have not completed Step 3 — Report the Loss Properly.

┌─────────────────────────────────────────┐
│ You have delayed Step 3.                │
│                                         │
│ Incomplete documentation increases the  │
│ risk of underpayment or extended review.│
│                                         │
│ It has been 6 days since your last     │
│ session.                                │
└─────────────────────────────────────────┘

Submit a clear, factual loss report to establish the scope of your claim.

[Start Step 3]
```

### Tier 3 - 5+ Dismissals OR 8+ Days Inactive
**Tone:** Strong directive, professional

**Triggers:**
- 5+ dismissals
- OR 8+ days since last visit

**Modal Behavior:**
- Dark red escalation message block
- Always shows days inactive
- Close button (X) HIDDEN
- Click outside DISABLED
- "Dismiss for Now" link VISIBLE (required)
- Adds "Proceed now." directive

**Example (with 10 days inactive):**
```
Next Action Required

You have not completed Step 4 — Prepare for Recorded Statements.

┌─────────────────────────────────────────┐
│ Step 4 is still incomplete.             │
│                                         │
│ Your claim cannot be properly supported │
│ until this step is completed.           │
│                                         │
│ It has been 10 days since your last    │
│ session.                                │
│                                         │
│ Proceed now.                            │
└─────────────────────────────────────────┘

Review common questions and prepare clear answers before your recorded statement.

[Start Step 4]

Dismiss for Now
```

## User Flow

### Scenario 1: Compliant User
1. **Day 1:** User visits → Tier 0 modal → Completes Step 1
2. **Day 1:** Modal reappears → Tier 0 for Step 2 → User continues
3. **Day 2:** User returns → Tier 0 (< 2 days) → Completes Step 2
4. **Result:** Smooth progression, no escalation

### Scenario 2: Dismissive User
1. **Day 1:** User visits → Tier 0 modal → Dismisses (count: 1)
2. **Day 1:** User returns → Tier 1 modal → Dismisses (count: 2)
3. **Day 2:** User returns → Tier 1 modal → Dismisses (count: 3)
4. **Day 3:** User returns → Tier 2 modal → Dismisses (count: 4)
5. **Day 4:** User returns → Tier 2 modal → Dismisses (count: 5)
6. **Day 5:** User returns → **Tier 3 modal** → Must use "Dismiss for Now" link
7. **Result:** Escalating pressure, Tier 3 requires explicit dismissal

### Scenario 3: Inactive User
1. **Day 1:** User visits → Tier 0 modal → Dismisses
2. **Day 4:** User returns → Tier 1 modal (3 days) → Dismisses
3. **Day 9:** User returns → **Tier 3 modal** (8 days) → Cannot click outside
4. **Result:** Time-based escalation, strong directive to proceed

### Scenario 4: Step Completion Reset
1. **Day 1:** User dismisses 3 times (count: 3, Tier 2)
2. **Day 2:** User completes Step 1
3. **Day 2:** Modal shows Step 2 at **Tier 0** (reset)
4. **Result:** Dismissal count resets on completion

## Technical Implementation

### LocalStorage Keys
```javascript
const STORAGE_KEYS = {
  DISMISSALS: 'claim_next_action_dismissals',
  LAST_VISIT: 'claim_last_visit_timestamp',
  STEP_STATUS: 'claim_step_status'
};
```

### Escalation Determination
```javascript
function determineEscalationTier(dismissals, daysInactive) {
  if (dismissals >= 5 || daysInactive >= 8) return 3;
  if (dismissals >= 3 || daysInactive >= 5) return 2;
  if (dismissals >= 1 || daysInactive >= 2) return 1;
  return 0;
}
```

### Key Functions

**`initializeData()`**
- Loads step status from localStorage
- Calculates days since last visit
- Updates last visit timestamp
- Loads dismissal count

**`showNextActionModal()`**
- Finds next incomplete step
- Determines escalation tier
- Updates modal content
- Applies tier-specific behavior

**`dismissModal()`**
- Increments dismissal count
- Saves to localStorage
- Closes modal

**`continueToStep()`**
- Resets dismissal count to 0
- Saves to localStorage
- Scrolls to step
- Closes modal

**`markStepComplete(stepNumber)`**
- Updates step status
- Resets dismissal count to 0
- Saves to localStorage
- Shows next modal at Tier 0

## Visual Design

### Color Coding
- **Tier 0:** No escalation block
- **Tier 1:** Yellow background (`#fef3c7`), orange border (`#f59e0b`)
- **Tier 2:** Light red background (`#fee2e2`), red border (`#ef4444`)
- **Tier 3:** Light red background (`#fee2e2`), dark red border (`#dc2626`), bold text

### Modal Dimensions
- **Desktop:** 520px max-width, centered
- **Mobile:** Full-width minus 32px margins

### Responsive Behavior
- Font sizes reduce on mobile
- Buttons go full-width on mobile
- Escalation blocks maintain readability

## Testing the System

### Test Dismissal Escalation
1. Open browser DevTools → Console
2. Run: `localStorage.setItem('claim_next_action_dismissals', '3')`
3. Refresh page → Should see Tier 2 modal
4. Run: `localStorage.setItem('claim_next_action_dismissals', '5')`
5. Refresh page → Should see Tier 3 modal (no X button)

### Test Time-Based Escalation
1. Open browser DevTools → Console
2. Set timestamp to 6 days ago:
   ```javascript
   const sixDaysAgo = Date.now() - (6 * 24 * 60 * 60 * 1000);
   localStorage.setItem('claim_last_visit_timestamp', sixDaysAgo.toString());
   ```
3. Refresh page → Should see Tier 2 modal with "It has been 6 days..."
4. Set timestamp to 10 days ago:
   ```javascript
   const tenDaysAgo = Date.now() - (10 * 24 * 60 * 60 * 1000);
   localStorage.setItem('claim_last_visit_timestamp', tenDaysAgo.toString());
   ```
5. Refresh page → Should see Tier 3 modal

### Reset System
```javascript
localStorage.removeItem('claim_next_action_dismissals');
localStorage.removeItem('claim_last_visit_timestamp');
localStorage.removeItem('claim_step_status');
```

## Professional Tone Guidelines

### ✅ Appropriate Language
- "Step X remains incomplete"
- "Delaying required steps slows documentation"
- "Incomplete documentation increases risk"
- "Your claim cannot be properly supported"
- "Proceed now"

### ❌ Avoided Language
- "You're falling behind!" (emotional)
- "Your claim is at risk!" (dramatic)
- "Act now or lose money!" (aggressive)
- "Last chance!" (threatening)

## Completion Modal

When all 18 steps are complete:

```
Claim Steps Complete

All steps have been completed.

Review your Financial Summary and confirm final payment.

[View Financial Summary]
```

- No escalation logic
- Redirects to Financial Summary page
- Close button visible
- Professional congratulatory tone

## File Structure

### Modified Files
- `/claim-command-center.html`
  - Added escalation CSS
  - Updated modal HTML structure
  - Implemented escalation JavaScript logic
  - Added localStorage persistence

### CSS Classes Added
- `.modal-escalation-message`
- `.modal-escalation-message.tier-2`
- `.modal-escalation-message.tier-3`
- `.modal-days-inactive`
- `.modal-dismiss-link`
- `.modal-overlay.tier-3`

### JavaScript Functions Added
- `initializeData()`
- `saveStepStatus()`
- `determineEscalationTier()`
- `getEscalationMessage()`
- `dismissModal()`
- `continueToStep()`

## Production Readiness

✅ **Complete Features:**
- Escalation logic (4 tiers)
- Time-based tracking
- Dismissal counting
- LocalStorage persistence
- Step completion tracking
- Progress counter updates
- Smooth scrolling to steps
- Responsive design
- Professional tone
- Tier 3 modal lockdown

✅ **No Backend Required:**
- Pure client-side implementation
- LocalStorage for persistence
- Mock step status
- Ready for backend integration later

✅ **Browser Compatibility:**
- Modern browsers (ES6+)
- LocalStorage support required
- Smooth scroll behavior

## Next Steps (Future Backend Integration)

When ready to connect to backend:

1. Replace localStorage with API calls
2. Store dismissal count in user profile
3. Track last visit timestamp server-side
4. Persist step completion to database
5. Add analytics tracking for escalation tiers
6. Implement email notifications at Tier 3

## Summary

The Next Action Modal now provides intelligent, escalating guidance that:
- Respects user autonomy (Tier 0-2)
- Applies appropriate pressure (Tier 1-2)
- Enforces critical action (Tier 3)
- Maintains professional tone throughout
- Resets on positive behavior (step completion)
- Persists across sessions (localStorage)
- Adapts to user patterns (dismissals + time)

The system is production-ready, fully functional, and requires no backend at this stage.
