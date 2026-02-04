# Step 1 Layout Guide
## Complete Visual and Code Structure

---

## 📐 Overall Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: Upload your insurance policy for AI-powered       │
│          coverage analysis                                  │
│  [Accordion Header - Clickable]                            │
└─────────────────────────────────────────────────────────────┘
         │
         ▼ (When clicked, expands to show:)
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ Phase 1: Upload Your Policy Documents               │  │
│  │ • Declarations page                                  │  │
│  │ • Full policy contract                              │  │
│  │ • All endorsements/riders/amendments                │  │
│  │ [📤 Upload Policy Documents Button]                 │  │
│  │ Can't find your policy? Contact carrier...          │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ Phase 2: Review Your Coverage Intelligence Report   │  │
│  │                                                       │  │
│  │ 💰 Your Coverage Limits                             │  │
│  │ ✅ What's Covered                                    │  │
│  │ ❌ What's Excluded                                   │  │
│  │ ⏰ Critical Deadlines                                │  │
│  │ 📋 Your Duties                                       │  │
│  │ 🏠 How You'll Be Paid                                │  │
│  │                                                       │  │
│  │ [📊 View Sample Coverage Report Button]             │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ 🛡️ What This Prevents:                              │  │
│  │ ✓ Accepting a denial for something covered          │  │
│  │ ✓ Missing coverage for ALE or code upgrades         │  │
│  │ ✓ Agreeing to contradictory terms                   │  │
│  │ ✓ Missing critical filing deadlines                 │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  Why You Need This: Insurance companies know exactly...   │
│  (Small, gray text at bottom)                             │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ Completion Checklist:                                │  │
│  │ ☐ Policy documents uploaded                          │  │
│  │ ☐ Coverage report reviewed                           │  │
│  │ ☐ Coverage limits and deadlines documented           │  │
│  │                                                       │  │
│  │ [✓ I Understand My Coverage - Continue to Step 2]   │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 Color Palette

### Current Theme: **Light Gray & Navy**

| Element | Color | Hex Code |
|---------|-------|----------|
| Phase number circles | Light Gray | `#e5e7eb` |
| Action buttons | Light Gray | `#e5e7eb` |
| Button hover | Medium Gray | `#d1d5db` |
| "What This Prevents" background | Very Light Gray | `#f9fafb` |
| "What This Prevents" border | Light Gray | `#e5e7eb` |
| "What This Prevents" text | Medium Gray | `#6b7280` |
| "What This Prevents" title | Dark Gray | `#4b5563` |
| Checkmarks | Gray | `#9ca3af` |
| "Why You Need This" text | Light Gray | `#9ca3af` |
| "Why You Need This" title | Medium Gray | `#6b7280` |
| Phase cards background | White | `#ffffff` |
| Phase cards border | Light Gray | `#e5e7eb` |
| Main text | Navy Dark | `var(--navy-dark)` |

---

## 📦 Component Breakdown

### 1. **Process Phases Container**
```html
<div class="process-phases">
  <!-- Contains Phase 1 and Phase 2 cards -->
</div>
```

**Styling:**
- Display: Grid (2 columns on desktop, 1 column on mobile)
- Gap: 24px
- Margin bottom: 32px

---

### 2. **Phase Card (Phase 1: Upload)**
```html
<div class="phase-card phase-upload">
  <div class="phase-header">
    <span class="phase-number">1</span>
    <div>
      <h4>Upload Your Policy Documents</h4>
      <p>Get everything in one place</p>
    </div>
  </div>
  
  <div class="phase-content">
    <div class="upload-checklist">
      <div class="checklist-item">✓ Declarations page</div>
      <div class="checklist-item">✓ Full policy contract</div>
      <div class="checklist-item">✓ All endorsements/riders/amendments</div>
    </div>
    
    <button class="btn-phase-action">📤 Upload Policy Documents</button>
    
    <div class="phase-tip">
      <strong>Can't find your policy?</strong> Contact carrier...
    </div>
  </div>
</div>
```

**Styling:**
- Background: White (`#ffffff`)
- Border: 2px solid light gray (`#e5e7eb`)
- Border radius: 12px
- Padding: 24px
- Box shadow: Subtle (`0 2px 8px rgba(0,0,0,0.05)`)

**Phase Number Circle:**
- Size: 48px × 48px
- Background: Light gray (`#e5e7eb`)
- Border radius: 50% (circle)
- Font size: 24px
- Font weight: 700

**Upload Checklist Items:**
- Padding: 8px 0
- Font size: 14px
- Color: Navy dark

**Phase Action Button:**
- Width: 100%
- Padding: 16px 24px
- Background: Light gray (`#e5e7eb`)
- Border radius: 8px
- Font size: 15px
- Font weight: 700
- Hover: Medium gray (`#d1d5db`) with slight lift

**Phase Tip:**
- Background: Very light gray (`#f9fafb`)
- Border: 1px solid light gray (`#e5e7eb`)
- Border radius: 6px
- Padding: 12px
- Font size: 13px
- Margin top: 16px

---

### 3. **Phase Card (Phase 2: Review Report)**
```html
<div class="phase-card phase-review">
  <div class="phase-header">
    <span class="phase-number">2</span>
    <div>
      <h4>Review Your Coverage Intelligence Report</h4>
      <p>Understand exactly what you're covered for</p>
    </div>
  </div>
  
  <div class="phase-content">
    <p class="phase-intro">Once uploaded, you'll get a plain-English report that tells you:</p>
    
    <div class="report-highlights">
      <div class="highlight-item">
        <span class="highlight-icon">💰</span>
        <div>
          <strong>Your Coverage Limits</strong>
          <span>Maximum amounts you can claim...</span>
        </div>
      </div>
      <!-- 5 more highlight items -->
    </div>
    
    <button class="btn-phase-action">📊 View Sample Coverage Report</button>
  </div>
</div>
```

**Report Highlights:**
- Display: Grid
- Gap: 12px
- Margin: 20px 0

**Highlight Item:**
- Display: Flex
- Align items: Start
- Gap: 12px
- Padding: 12px
- Background: Very light gray (`#f9fafb`)
- Border: 1px solid light gray (`#e5e7eb`)
- Border radius: 8px
- Transition: All 0.2s ease
- Hover: Border changes to navy, subtle shadow

**Highlight Icon:**
- Font size: 28px
- Flex shrink: 0

**Highlight Text:**
- Strong (title): 15px, font-weight 600, navy dark
- Span (description): 13px, secondary text color

---

### 4. **"What This Prevents" Box**
```html
<div class="prevents-box">
  <strong>🛡️ What This Prevents:</strong>
  <ul>
    <li>Accepting a denial for something that's actually covered</li>
    <li>Missing coverage for additional living expenses or code upgrades</li>
    <li>Agreeing to terms that contradict your policy language</li>
    <li>Missing critical filing deadlines you didn't know existed</li>
  </ul>
</div>
```

**Styling:**
- Background: Very light gray (`#f9fafb`)
- Border: 2px solid light gray (`#e5e7eb`)
- Border radius: 8px
- Padding: 20px
- Margin bottom: 32px

**Title (strong):**
- Display: Block
- Font size: 16px
- Font weight: 700
- Color: Dark gray (`#4b5563`)
- Margin bottom: 12px

**List Items:**
- Padding: 8px 0 8px 28px
- Position: Relative
- Font size: 14px
- Color: Medium gray (`#6b7280`)
- Line height: 1.5

**Checkmark (before):**
- Content: "✓"
- Position: Absolute
- Left: 0
- Color: Gray (`#9ca3af`)
- Font weight: Bold
- Font size: 16px

---

### 5. **"Why You Need This" (Bottom)**
```html
<div class="value-statement-bottom">
  <strong>Why You Need This:</strong>
  Insurance companies know exactly what your policy says...
</div>
```

**Styling:**
- Background: Transparent
- Border: None
- Padding: 16px 0
- Margin: 24px 0
- Font size: 12px
- Line height: 1.5
- Color: Light gray (`#9ca3af`)
- Text align: Left

**Title (strong):**
- Display: Inline
- Margin right: 4px
- Font size: 12px
- Font weight: 600
- Color: Medium gray (`#6b7280`)

---

### 6. **Completion Checklist**
```html
<div class="step-completion">
  <div class="completion-checklist">
    <div class="completion-item" onclick="toggleCompletion(this)">
      <span class="completion-checkbox"></span>
      <span>Policy documents uploaded</span>
    </div>
    <!-- 2 more items -->
  </div>
  
  <button class="btn-complete-step" onclick="completeAndNext(1)">
    ✓ I Understand My Coverage - Continue to Step 2
  </button>
</div>
```

**Completion Checklist:**
- Display: Flex
- Flex direction: Column
- Gap: 12px
- Margin bottom: 24px

**Completion Item:**
- Display: Flex
- Align items: Center
- Gap: 12px
- Padding: 12px
- Background: Very light gray (`#f9fafb`)
- Border: 2px solid light gray (`#e5e7eb`)
- Border radius: 8px
- Cursor: Pointer
- Transition: All 0.2s ease

**Completion Checkbox:**
- Width: 24px
- Height: 24px
- Border: 2px solid medium gray (`#9ca3af`)
- Border radius: 4px
- Display: Flex
- Align items: Center
- Justify content: Center
- Transition: All 0.2s ease

**Checked State:**
- Background: Navy primary
- Border color: Navy primary
- Content: "✓" (white)

**Complete Step Button:**
- Width: 100%
- Padding: 18px 24px
- Background: Navy primary
- Color: White
- Border: None
- Border radius: 8px
- Font size: 16px
- Font weight: 700
- Cursor: Pointer
- Transition: All 0.2s ease
- Hover: Darker navy, slight lift

---

## 📱 Responsive Breakpoints

### Desktop (> 768px)
- Process phases: 2 columns (side by side)
- Phase cards: Full width within column
- Report highlights: Single column within card

### Mobile (≤ 768px)
- Process phases: 1 column (stacked)
- Phase cards: Full width
- Font sizes slightly reduced
- Padding adjusted for smaller screens

---

## 🔧 JavaScript Functions

### 1. **navigateToUpload(uploadType)**
```javascript
function navigateToUpload(uploadType) {
  window.location.href = 'app/tools/policy-analyzer-complete.html';
}
```
- Navigates to policy upload tool
- Called by "Upload Policy Documents" button

### 2. **toggleCompletion(element)**
```javascript
function toggleCompletion(element) {
  element.classList.toggle('checked');
  saveState();
  
  const allChecked = document.querySelectorAll('.completion-item.checked').length === 
                     document.querySelectorAll('.completion-item').length;
  
  if (allChecked) {
    const completeBtn = document.querySelector('.btn-complete-step');
    completeBtn.style.animation = 'pulse 1s ease-in-out';
  }
}
```
- Toggles checkbox state
- Saves to localStorage
- Animates complete button when all checked

### 3. **completeAndNext(stepNum)**
```javascript
function completeAndNext(stepNum) {
  saveClaimData(`step_${stepNum}_complete`, true);
  saveClaimData(`step_${stepNum}_completion_date`, new Date().toISOString());
  
  // Open next step
  openStep(stepNum + 1);
  
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
```
- Marks step as complete
- Saves completion date
- Opens next step
- Scrolls to top

---

## 📊 Key Metrics

- **Total Components:** 6 major sections
- **Interactive Elements:** 2 buttons + 3 checkboxes
- **Color Palette:** 10 distinct colors (gray scale + navy)
- **Font Sizes:** 5 sizes (12px, 13px, 14px, 15px, 16px)
- **Spacing System:** 8px base unit (8, 12, 16, 20, 24, 32px)

---

## 🎯 Design Principles

1. **Clarity:** Clear visual hierarchy with numbered phases
2. **Subtlety:** Gray tones instead of bright colors for professional look
3. **Guidance:** Step-by-step instructions with visual checklists
4. **Benefit-focused:** Each section explains "what you get"
5. **Progressive disclosure:** Information revealed as needed
6. **Mobile-first:** Responsive design that works on all devices

---

## 📝 Content Strategy

### Tone
- **Empowering:** "You need to know what you're entitled to"
- **Direct:** "Contact carrier and demand a certified copy"
- **Educational:** Explains why each action matters
- **Protective:** "What This Prevents" section

### Key Messages
1. Knowledge is power in insurance claims
2. Insurance companies have information advantage
3. Understanding your policy is foundational
4. Each action prevents specific problems

---

## 🔗 Navigation Flow

```
Step 1 Accordion (Closed)
         ↓ (Click)
Step 1 Content (Expanded)
         ↓
Phase 1: Upload Policy
         ↓ (Click Upload Button)
Policy Analyzer Tool (app/tools/policy-analyzer-complete.html)
         ↓ (Upload & Analyze)
         ← (Back to Claim Guide)
Step 1 Content
         ↓
Phase 2: Review Report
         ↓ (Click View Report Button)
Policy Report Demo (app/tools/policy-analyzer-demo.html)
         ↓ (Review)
         ← (Back to Claim Guide)
Step 1 Content
         ↓
Check all completion items
         ↓
Click "I Understand My Coverage - Continue to Step 2"
         ↓
Step 2 Opens (Step 1 closes)
```

---

## 🎨 Visual Hierarchy

1. **Primary:** Phase headers with large numbers
2. **Secondary:** Section titles and button text
3. **Tertiary:** Descriptions and list items
4. **Quaternary:** Helper text and tips
5. **Minimal:** "Why You Need This" at bottom

---

## ✅ Accessibility Features

- Semantic HTML structure
- Clear focus states on interactive elements
- Sufficient color contrast (gray text on white background)
- Keyboard navigation support
- Screen reader friendly labels
- Touch-friendly button sizes (minimum 44px)

---

## 📦 File References

**Main File:**
- `step-by-step-claim-guide.html` (lines ~3850-3977)

**Related Tools:**
- `app/tools/policy-analyzer-complete.html` - Upload tool
- `app/tools/policy-analyzer-demo.html` - Report viewer

**CSS Styles:**
- Located in `<style>` section of step-by-step-claim-guide.html
- Lines ~3050-3350 (Step 1 Enhanced Styles)

---

## 🚀 Future Enhancements

1. Add progress indicator within Phase 2
2. Animate phase transitions
3. Add tooltips for complex terms
4. Include sample policy screenshots
5. Add video tutorial option
6. Implement auto-save for checklist state
7. Add estimated time to complete

---

*Last Updated: January 7, 2026*
*Version: 2.0 (Gray Theme)*


