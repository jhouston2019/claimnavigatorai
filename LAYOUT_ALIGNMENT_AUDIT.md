# LAYOUT ALIGNMENT AUDIT REPORT
**Date:** December 22, 2025  
**Canonical Source:** Resource Center (`/app/resource-center.html`)  
**Audit Scope:** Advanced Tools Suite pages  
**Audit Type:** Layout-only (NO redesign, NO feature changes)

---

## 🔒 CANONICAL TRUTH (LOCKED)

**The Resource Center layout is the canonical layout.**  
**All Tools pages must conform to it exactly.**

---

## EXECUTIVE SUMMARY

**Status:** ⚠️ **CRITICAL LAYOUT MISALIGNMENT DETECTED**

The Advanced Tools pages use a **completely different visual system** than the Resource Center:
- Dark theme with background images vs. light minimal theme
- Different typography scale
- Different card styling (glassmorphism vs. flat cards)
- Different spacing system
- Different container widths
- Different grid layouts

**Ship-Blocker:** YES — Users will immediately perceive these as different products.

---

## 1. CRITICAL LAYOUT MISMATCHES (MUST FIX BEFORE LAUNCH)

### 1.1 Background & Color System
**Resource Center (Canonical):**
```css
background: #F5F7FA (light gray)
color: #0B1B34 (dark navy text)
No background images
```

**Tools Pages (Current):**
```css
background: linear-gradient(rgba(0, 0, 0, 0.85), rgba(0, 0, 0, 0.85)),
            url('/assets/images/backgrounds/paperwork6.jpeg')
color: #ffffff (white text)
Dark overlay + image
```

**Impact:** CRITICAL — Completely different visual identity  
**Fix:** Remove background images, use `#F5F7FA` background, switch to dark text

---

### 1.2 Container Max-Width
**Resource Center (Canonical):**
```css
.rc-container {
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 24px;
}
```

**Tools Pages (Current):**
```css
.tool-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem; /* 32px */
}
```

**Difference:** 80px wider, 8px more padding  
**Impact:** CRITICAL — Different content width creates visual incoherence  
**Fix:** Change to `max-width: 1120px; padding: 0 24px;`

---

### 1.3 Page Header Structure
**Resource Center (Canonical):**
```html
<section class="rc-hero">
  <div class="rc-container rc-hero-content">
    <div class="rc-hero-text">
      <p class="rc-hero-eyebrow">Resource Center</p>
      <h1 class="rc-hero-title">Claim Navigator Resource Center</h1>
      <p class="rc-hero-subtitle">Your central hub...</p>
      <div class="rc-hero-actions">
        <a href="..." class="rc-btn-primary">Start Claim Flow</a>
        <a href="..." class="rc-btn-secondary">Browse Resources</a>
      </div>
    </div>
  </div>
</section>
```

**Styles:**
```css
.rc-hero {
  background: #0B1B34;
  color: #ffffff;
  padding: 96px 0 88px;
}

.rc-hero-title {
  font-size: 42px;
  font-weight: 700;
  margin: 0 0 12px 0;
}

.rc-hero-subtitle {
  font-size: 18px;
  color: rgba(255,255,255,0.85);
  margin: 0 0 24px 0;
}
```

**Tools Pages (Current):**
```html
<div class="tool-header" style="max-width: 1000px; margin: 2rem auto;">
  <h1>Settlement Calculator Pro</h1>
  <p>Advanced settlement valuation tool...</p>
</div>
```

**Styles:**
```css
.tool-header {
  text-align: center;
  margin-bottom: 2rem;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.tool-header h1 {
  font-size: 2.5rem; /* 40px */
  font-weight: 700;
}

.tool-header p {
  font-size: 1.1rem; /* ~17.6px */
}
```

**Differences:**
- Tools use centered glassmorphic card vs. full-width dark hero
- Tools H1: 40px vs. Resource Center: 42px
- Tools subtitle: 17.6px vs. Resource Center: 18px
- Tools use inline styles (`style="..."`)
- Tools missing eyebrow text
- Tools missing action buttons
- Tools use glassmorphism vs. solid dark background

**Impact:** CRITICAL — Completely different header hierarchy  
**Fix:** Replace with `rc-hero` structure exactly

---

### 1.4 Card Component Styling
**Resource Center (Canonical):**
```css
.rc-card {
  background: #F0F4FA;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.04);
  border: 1px solid rgba(0,0,0,0.06);
  transition: all 0.2s ease;
}

.rc-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.08);
}
```

**Tools Pages (Current):**
```css
.card {
  background: rgba(255, 255, 255, 0.1) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  backdrop-filter: blur(8px) !important;
  padding: 2rem !important;
  border-radius: 1rem !important;
  margin-bottom: 2rem !important;
}
```

**Differences:**
- Tools use glassmorphism (transparent + blur) vs. solid light background
- Tools padding: 32px vs. Resource Center: 24px
- Tools border-radius: 16px (same) ✓
- Tools use `!important` overrides (bad practice)
- Tools missing hover transform
- Tools have `margin-bottom: 2rem` (should be handled by grid gap)

**Impact:** CRITICAL — Completely different card aesthetic  
**Fix:** Replace with `rc-card` styles exactly

---

### 1.5 Grid Layout
**Resource Center (Canonical):**
```css
.rc-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
}

@media (max-width: 1024px) {
  .rc-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
```

**Tools Pages (Current):**
```css
.tools-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem; /* 24px - SAME ✓ */
  padding: 0;
}
```

**Differences:**
- Tools missing `minmax(0, 1fr)` (can cause overflow issues)
- Tools have explicit `padding: 0` (unnecessary)
- Same gap ✓
- Same responsive breakpoint ✓

**Impact:** IMPORTANT — Minor technical difference, same visual result  
**Fix:** Use `minmax(0, 1fr)` for safety

---

### 1.6 Typography Scale
**Resource Center (Canonical):**
```css
/* Section Headers */
.rc-section-header h2 {
  font-size: 32px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.rc-section-header p {
  font-size: 16px;
  color: #475569;
  margin: 0;
}

/* Card Titles */
.rc-card h3 {
  font-size: 22px;
  font-weight: 600;
  margin: 0;
}

/* Card Body */
.rc-card p {
  font-size: 16px;
  color: #475569;
  margin: 0;
}

/* Card CTA */
.rc-card-cta {
  font-size: 14px;
  font-weight: 600;
  color: #2D5BFF;
}
```

**Tools Pages (Current):**
```css
/* Group Headers */
.tool-group h2 {
  font-size: 1.75rem; /* 28px */
  font-weight: 600;
}

/* Card Titles */
.card h3 {
  font-size: 1.25rem; /* 20px */
  font-weight: 600;
}

/* Card Body */
.card p {
  font-size: 1rem; /* 16px - SAME ✓ */
}
```

**Differences:**
- Tools H2: 28px vs. Resource Center: 32px (4px smaller)
- Tools H3: 20px vs. Resource Center: 22px (2px smaller)
- Tools body text: 16px (same) ✓
- Tools missing CTA styling

**Impact:** CRITICAL — Smaller headings create different visual hierarchy  
**Fix:** Match exact font sizes: H2=32px, H3=22px

---

### 1.7 Section Spacing
**Resource Center (Canonical):**
```css
.rc-section {
  padding: 80px 0;
}

.rc-section + .rc-section {
  padding-top: 0; /* Consecutive sections don't double-pad */
}
```

**Tools Pages (Current):**
```css
.tool-group {
  margin-bottom: 3rem; /* 48px */
}
```

**Differences:**
- Tools use `margin-bottom` vs. Resource Center uses `padding`
- Tools: 48px spacing vs. Resource Center: 80px spacing
- Tools missing consecutive section logic

**Impact:** IMPORTANT — Different vertical rhythm  
**Fix:** Use `padding: 80px 0` and add consecutive section rule

---

### 1.8 Button Styling
**Resource Center (Canonical):**
```css
.rc-btn-primary {
  background: #2D5BFF;
  color: #ffffff;
  padding: 14px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 16px;
  border: 2px solid transparent;
  transition: all 0.2s ease;
}

.rc-btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.08);
}
```

**Tools Pages (Current):**
```css
.btn-primary {
  background: #1e40af; /* Different blue! */
  color: #ffffff !important;
  padding: 0.75rem 1.5rem; /* 12px 24px */
  border-radius: 0.5rem; /* 8px - SAME ✓ */
  font-size: 1rem; /* 16px - SAME ✓ */
  font-weight: 600;
}

.btn-primary:hover {
  background: #1e3a8a;
  transform: translateY(-2px); /* More movement */
  box-shadow: 0 4px 12px rgba(30, 64, 175, 0.4);
}
```

**Differences:**
- Tools primary color: `#1e40af` vs. Resource Center: `#2D5BFF` (different blue!)
- Tools padding: 12px 24px vs. Resource Center: 14px 24px (2px less vertical)
- Tools hover transform: -2px vs. Resource Center: -1px (more aggressive)
- Tools use `!important` on color

**Impact:** CRITICAL — Different brand color  
**Fix:** Use `#2D5BFF` and match exact padding/hover

---

## 2. IMPORTANT INCONSISTENCIES (FIX IF TIME ALLOWS)

### 2.1 Font Family Declaration
**Resource Center:**
```css
font-family: 'Inter', sans-serif;
```

**Tools Pages:**
```css
font-family: 'Poppins', sans-serif;
/* Also loads Source Sans 3 */
```

**Impact:** IMPORTANT — Different typeface creates subtle visual difference  
**Fix:** Use Inter exclusively

---

### 2.2 Breadcrumb Navigation
**Resource Center:** Uses dropdown navigation in header  
**Tools Pages:** Uses inline breadcrumb in header

```html
<nav class="nav">
  <a href="/app/index.html">Home</a>
  <span>></span>
  <a href="/app/resource-center.html">Resource Center</a>
  <span>></span>
  <a href="/app/resource-center/advanced-tools/advanced-tools.html">Advanced Tools Suite</a>
  <span>></span>
  <span>Settlement Calculator Pro</span>
</nav>
```

**Impact:** IMPORTANT — Different navigation pattern  
**Fix:** Acceptable difference (breadcrumbs are appropriate for deep pages)

---

### 2.3 Icon Styling
**Resource Center:**
```css
.rc-card-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(13,27,52,0.08);
  font-weight: 700;
  font-size: 14px;
}
```

**Tools Pages:** No icon system

**Impact:** IMPORTANT — Missing visual element  
**Fix:** Add icon system to tool cards if applicable

---

## 3. ALREADY ALIGNED ✓

### 3.1 Border Radius
- Both use `16px` for cards ✓
- Both use `8px` for buttons ✓

### 3.2 Grid Gap
- Both use `24px` gap ✓

### 3.3 Responsive Breakpoints
- Both break to 2-col at 1024px ✓
- Both break to 1-col at 768px ✓

### 3.4 Card Body Text Size
- Both use `16px` for paragraph text ✓

### 3.5 Font Weight
- Both use `600` for headings ✓
- Both use `400` for body text ✓

---

## 4. CONCRETE FILE-LEVEL CHANGES NEEDED

### Phase 1: Create Shared Layout Component (CRITICAL)

**File:** `app/assets/css/advanced-tools-layout.css` (NEW FILE)

```css
/* Advanced Tools - Resource Center Layout Alignment */
/* Canonical source: Resource Center */

body.advanced-tools-page,
body.settlement-calculator-page,
body.fraud-scanner-page,
body.photo-analyzer-page {
  background: #F5F7FA !important;
  color: #0B1B34 !important;
  font-family: 'Inter', sans-serif !important;
  background-image: none !important;
}

body.advanced-tools-page *,
body.settlement-calculator-page *,
body.fraud-scanner-page *,
body.photo-analyzer-page * {
  color: #0B1B34 !important;
}

/* Hero Section - Match Resource Center exactly */
.tool-hero {
  background: #0B1B34;
  color: #ffffff;
  padding: 96px 0 88px;
}

.tool-hero-container {
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 24px;
}

.tool-hero-eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 12px;
  color: rgba(255,255,255,0.78);
}

.tool-hero-title {
  font-size: 42px;
  font-weight: 700;
  margin: 0 0 12px 0;
  color: #ffffff;
}

.tool-hero-subtitle {
  font-size: 18px;
  color: rgba(255,255,255,0.85);
  margin: 0 0 24px 0;
  max-width: 720px;
}

/* Main Container */
.tool-container {
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 24px;
}

.tool-section {
  padding: 80px 0;
}

.tool-section + .tool-section {
  padding-top: 0;
}

/* Section Headers */
.tool-section-header h2 {
  font-size: 32px;
  font-weight: 600;
  color: #0B1B34;
  margin: 0 0 8px 0;
}

.tool-section-header p {
  color: #475569;
  font-size: 16px;
  margin: 0 0 24px 0;
}

/* Card Grid */
.tool-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
}

@media (max-width: 1024px) {
  .tool-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .tool-grid {
    grid-template-columns: 1fr;
  }
}

/* Cards */
.tool-card,
.card {
  background: #F0F4FA;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.04);
  border: 1px solid rgba(0,0,0,0.06);
  transition: all 0.2s ease;
  text-decoration: none;
  color: #0B1B34;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 0;
}

.tool-card:hover,
.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.08);
}

.tool-card h3,
.card h3 {
  font-size: 22px;
  margin: 0;
  font-weight: 600;
  color: #0B1B34;
}

.tool-card p,
.card p {
  margin: 0;
  font-size: 16px;
  color: #475569;
}

/* Buttons */
.btn-primary {
  background: #2D5BFF;
  color: #ffffff;
  padding: 14px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 16px;
  border: 2px solid transparent;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.08);
}

.btn-secondary {
  border: 2px solid #2D5BFF;
  color: #2D5BFF;
  background: transparent;
  padding: 14px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 16px;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  cursor: pointer;
}

.btn-secondary:hover {
  transform: translateY(-1px);
  background: rgba(45,91,255,0.08);
  box-shadow: 0 6px 20px rgba(0,0,0,0.08);
}

/* Form Elements */
.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #0B1B34;
}

.form-group select,
.form-group input[type="number"],
.form-group input[type="text"],
.form-group textarea {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid rgba(0,0,0,0.12);
  border-radius: 8px;
  background: #ffffff;
  color: #0B1B34;
  font-size: 16px;
  font-family: 'Inter', sans-serif;
}

.form-group select:focus,
.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #2D5BFF;
  box-shadow: 0 0 0 3px rgba(45,91,255,0.1);
}

/* Results Panel */
.results-panel {
  display: none;
  margin-top: 2rem;
}

.results-panel.show {
  display: block;
}
```

---

### Phase 2: Update Individual Tool Pages (CRITICAL)

**Files to update:**
- `app/resource-center/advanced-tools/settlement-calculator-pro.html`
- `app/resource-center/advanced-tools/fraud-detection-scanner.html`
- `app/resource-center/advanced-tools/evidence-photo-analyzer.html`
- `app/resource-center/advanced-tools/policy-comparison-tool.html`
- `app/resource-center/advanced-tools/bad-faith-evidence-tracker.html`
- `app/resource-center/advanced-tools/insurance-profile-database.html`
- `app/resource-center/advanced-tools/regulatory-updates-monitor.html`
- (All 17 tool pages)

**Changes per file:**

1. **Replace `<head>` font imports:**
```html
<!-- REMOVE -->
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Source+Sans+3:wght@400;500;600&display=swap" rel="stylesheet">

<!-- ADD -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

2. **Add new stylesheet:**
```html
<link rel="stylesheet" href="/app/assets/css/advanced-tools-layout.css">
```

3. **Replace inline `<style>` blocks:**
```html
<!-- REMOVE entire <style> block with dark theme -->

<!-- KEEP only tool-specific styles (sliders, specific UI elements) -->
```

4. **Replace hero header structure:**
```html
<!-- REMOVE -->
<div class="tool-header" style="max-width: 1000px; margin: 2rem auto;">
  <h1>Settlement Calculator Pro</h1>
  <p>Advanced settlement valuation tool...</p>
</div>

<!-- REPLACE WITH -->
<section class="tool-hero">
  <div class="tool-hero-container">
    <p class="tool-hero-eyebrow">Advanced Tools</p>
    <h1 class="tool-hero-title">Settlement Calculator Pro</h1>
    <p class="tool-hero-subtitle">Advanced settlement valuation tool that factors in policy limits, depreciation, replacement costs, and legal precedents.</p>
  </div>
</section>
```

5. **Update main container:**
```html
<!-- CHANGE -->
<main class="tool-container">

<!-- TO -->
<main class="tool-container" style="padding-top: 80px;">
```

6. **Update body class:**
```html
<!-- Keep existing body class, but ensure new CSS overrides it -->
<body class="settlement-calculator-page">
```

---

### Phase 3: Update Advanced Tools Hub Page

**File:** `app/resource-center/advanced-tools/advanced-tools.html`

**Changes:**

1. **Already uses light theme** ✓ (Keep as-is)

2. **Update container width:**
```css
/* Line 56 */
.tools-container {
  max-width: 1120px; /* Was 1200px */
  margin: 0 auto;
  padding: 0 24px; /* Was 2rem */
}
```

3. **Update section headers:**
```css
/* Line 67 */
.tool-group h2 {
  font-size: 32px; /* Was 1.75rem (28px) */
  font-weight: 600;
  margin-bottom: 24px; /* Was 1.5rem */
}
```

4. **Update card titles:**
```css
/* Line 350 */
body.advanced-tools-page .card h3 {
  font-size: 22px; /* Was 1.25rem (20px) */
  font-weight: 600;
}
```

5. **Update button colors:**
```css
/* Line 419 */
body.advanced-tools-page .btn-primary {
  background: #2D5BFF; /* Was #0055ff */
}

body.advanced-tools-page .btn-primary:hover {
  background: #1e40af;
}
```

---

## 5. IMPLEMENTATION PRIORITY

### MUST FIX (Ship Blockers):
1. ✅ Background color system (dark → light)
2. ✅ Container max-width (1200px → 1120px)
3. ✅ Hero header structure (glassmorphic card → full-width dark hero)
4. ✅ Card styling (glassmorphism → flat light cards)
5. ✅ Typography scale (H2: 28px → 32px, H3: 20px → 22px)
6. ✅ Button primary color (#1e40af → #2D5BFF)
7. ✅ Font family (Poppins → Inter)

### SHOULD FIX (Important):
8. ✅ Section spacing (48px → 80px)
9. ✅ Button padding (12px → 14px vertical)
10. ✅ Grid `minmax()` syntax

### NICE TO HAVE:
11. Icon system for tool cards
12. Consistent CTA styling

---

## 6. TESTING CHECKLIST

After implementing changes, verify:

- [ ] All tool pages use `#F5F7FA` background (no images)
- [ ] All tool pages use dark text on light background
- [ ] Hero sections are full-width dark navy (`#0B1B34`)
- [ ] Hero titles are 42px
- [ ] Section headers are 32px
- [ ] Card titles are 22px
- [ ] Container max-width is 1120px
- [ ] Cards use flat light background (`#F0F4FA`)
- [ ] Primary buttons use `#2D5BFF`
- [ ] All pages use Inter font
- [ ] Grid gaps are 24px
- [ ] Section padding is 80px vertical
- [ ] Hover states match (translateY -2px for cards, -1px for buttons)

---

## 7. ESTIMATED EFFORT

**Time to implement:** 2-3 hours

**Breakdown:**
- Create `advanced-tools-layout.css`: 30 min
- Update 17 tool pages (hero + head): 1.5 hours (5 min each)
- Update hub page: 15 min
- Testing & QA: 30 min

---

## 8. RISK ASSESSMENT

**Risk Level:** LOW

**Why:**
- Changes are purely CSS/HTML structure
- No JavaScript logic changes
- No backend changes
- No feature changes
- Easy to revert if needed

**Validation:**
- Side-by-side visual comparison before/after
- Test on desktop, tablet, mobile
- Verify all links still work
- Verify all forms still function

---

## CONCLUSION

The Advanced Tools pages use a **fundamentally different visual design system** than the Resource Center. This creates immediate user distrust and makes the product feel "bolted together."

**The fix is straightforward:**
1. Remove dark theme + background images
2. Match exact layout measurements from Resource Center
3. Use shared CSS file for consistency

**This is NOT a redesign** — it's layout alignment to a pre-existing canonical source.

**Ship impact:** This MUST be fixed before launch. Users will notice immediately.

---

## APPENDIX: SIDE-BY-SIDE COMPARISON

### Resource Center (Canonical)
```
┌─────────────────────────────────────────────┐
│ ███████████ DARK HERO ███████████████████   │ #0B1B34
│ EYEBROW TEXT (14px)                         │
│ Page Title (42px, white)                    │
│ Subtitle (18px, white 85%)                  │
│ [Button] [Button]                           │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│ LIGHT BACKGROUND #F5F7FA                    │
│                                             │
│ Section Header (32px)                       │
│ Subtitle (16px)                             │
│                                             │
│ ┌──────┐ ┌──────┐ ┌──────┐                 │
│ │ Card │ │ Card │ │ Card │  #F0F4FA        │
│ │ 24px │ │ 24px │ │ 24px │  padding        │
│ │ pad  │ │ pad  │ │ pad  │  16px radius    │
│ └──────┘ └──────┘ └──────┘                 │
│                                             │
│ max-width: 1120px                           │
│ gap: 24px                                   │
└─────────────────────────────────────────────┘
```

### Tools Pages (Current - WRONG)
```
┌─────────────────────────────────────────────┐
│ ░░░░░ DARK BACKGROUND IMAGE ░░░░░░░░░░░░░   │ Dark + Image
│                                             │
│ ┌───────────────────────────────────────┐   │
│ │ Glassmorphic Header Card              │   │ rgba(255,255,255,0.1)
│ │ Page Title (40px, white)              │   │ backdrop-filter: blur
│ │ Subtitle (17.6px, white)              │   │
│ └───────────────────────────────────────┘   │
│                                             │
│ ┌───────────────────────────────────────┐   │
│ │ Glassmorphic Card                     │   │ rgba(255,255,255,0.1)
│ │ 32px padding                          │   │ backdrop-filter: blur
│ │ White text                            │   │
│ └───────────────────────────────────────┘   │
│                                             │
│ max-width: 1200px                           │
└─────────────────────────────────────────────┘
```

**Visual difference is IMMEDIATELY APPARENT.**

---

**END OF AUDIT**





✅ CURSOR FINAL AUDIT PROMPT — CLAIM NAVIGATOR SYSTEM VERIFICATION

You are performing a full-system audit of the Claim Navigator site.

This is NOT a refactor.
This is NOT a redesign.
This is a verification-only pass.

Do not change behavior unless a failure is detected.
If something is missing, broken, or inconsistent, report it explicitly and propose the minimal corrective change.

🔒 AUDIT OBJECTIVE

Confirm that Claim Navigator is:

Fully functional end-to-end

Tool-connected at every step

Producing authoritative, expert-grade outputs

Exportable and persistent

Free of dead links, broken routing, or logic regressions

This is an expert operating system, not a consumer app.

1️⃣ STEP GUIDE STRUCTURE AUDIT (ALL 13 STEPS)

Verify for each step (1–13):

Step title matches canonical name

Subtitle clearly states purpose and consequence

Tasks intro text is present

Acknowledgment button exists

No steps are missing or duplicated

Step order is correct

No lock-step visibility gating exists

Steps remain navigable after acknowledgment where specified (ongoing steps)

❗ Flag any step where:

Content does not match system-driven pattern

Copy is vague, optional, or conversational

Expert authority language is missing

2️⃣ PRIMARY TOOL VALIDATION (CRITICAL)

For each step with a primary tool, verify:

Step	Primary Tool ID
1	policy-intelligence
2	compliance-review
3	damage-documentation
4	estimate-review
5	estimate-comparison
6	ale-tracker
7	contents-inventory
8	contents-valuation
9	coverage-alignment
10	claim-package-assembly
12	carrier-response
13	supplement-analysis

Confirm:

Tool button routes correctly

Route includes ?step= and return= parameters

Tool page loads

Tool produces output

Output persists on return

Output renders inside step

Output unlocks acknowledgment

Export buttons appear only after output exists

❗ Flag any step where:

Primary tool is missing

Tool ID mismatch exists

Output does not persist

Acknowledgment unlocks without report

3️⃣ SUPPORTING TOOLS AUDIT

For every supporting tool listed:

Route resolves

Tool page loads

Output is generated

Output persists

Output rehydrates on reload

Output renders under primary report

Output does NOT unlock step completion

❗ Flag:

Dead links

Tools that overwrite primary output

Tools that incorrectly block progression

4️⃣ REPORT OUTPUT & SCHEMA AUDIT

For each primary report, verify:

Output follows required schema

Sections are present and populated

Language is assertive and expert-level

No conversational phrases (“you may want to”, “consider”, “it might be”)

No hallucinated legal advice

Explicit determinations are made where required

Risk flags are present when applicable

❗ Flag any report that:

Reads like chat output

Lacks conclusions

Uses optional or speculative language

Is missing required schema fields

5️⃣ EXPORT FUNCTIONALITY AUDIT (PDF / DOC)

For all steps with reports:

PDF export works

DOC export works

Filename format is correct

Report content matches on-screen output

Metadata present (step, date, report name)

No blank pages or formatting breaks

❗ Flag:

Broken export buttons

Empty exports

Incorrect file names

Missing sections

6️⃣ CROSS-STEP CONTEXT AUDIT

Verify correct read-only context imports:

Step 2 imports Step 1

Step 5 references Step 4

Step 6 imports ALE rules from Step 1

Step 8 imports Step 7 inventory

Step 9 imports Steps 1–8

Step 10 imports Steps 1–9

Step 12 imports Steps 1, 2, 9, 10

Step 13 imports Steps 5, 8, 9, 10, 12

❗ Flag:

Missing context

Incorrect dependency

Circular dependency

Editable prior data

7️⃣ PERSISTENCE AUDIT

Verify:

Tool outputs persist across navigation

Outputs persist after refresh

Re-running tools overwrites prior output cleanly

No data collisions between steps

localStorage keys are step-scoped

No accidental clearing of outputs

❗ Flag:

Data loss

Output bleed between steps

Broken rehydration logic

8️⃣ UI & UX INTEGRITY AUDIT

Confirm:

No layout regressions

No broken toggles

Dropdowns expand/collapse correctly

Reports are visually distinguishable

Primary vs supporting outputs clearly differentiated

No overlapping buttons or hidden content

❗ Flag:

Broken JS handlers

Visual regressions

Accessibility failures that block use

9️⃣ AUTHORITY & POSITIONING CHECK

Evaluate globally:

Does the system feel like an expert operating system?

Would this output stand up in front of an adjuster or attorney?

Does any language undermine authority?

❗ Flag any copy or behavior that:

Feels consumer-grade

Feels instructional instead of authoritative

Sounds like a chatbot

10️⃣ FINAL REPORT

Produce:

✅ Passed checks

❌ Failed checks (with file + line reference)

🔧 Minimal corrective actions (only if needed)

Do not refactor unless failure is confirmed.
Do not add features.
Do not redesign.

🎯 SUCCESS CONDITION

If all checks pass, explicitly state:

“Claim Navigator passes full system audit and is ready for real-world claim usage.”

Stop execution after report is generated.

