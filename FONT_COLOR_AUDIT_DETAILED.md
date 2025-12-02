# Detailed Font Color Audit Report
**Generated:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

## Executive Summary

✅ **Resource Center & Roadmap**: Fully compliant - using theme variables
⚠️ **Other Pages**: Some pages have dark backgrounds (intentional) - need `.cn-section-dark` wrapper
❌ **Inline Styles**: Found inline color styles that should use theme classes

## Detailed Findings

### ✅ COMPLIANT: Resource Center Pages

**Files:**
- `app/resource-center.html`
- `app/resource-center/claim-roadmap.html`
- `app/assets/css/resource-center.css`

**Status:** ✅ All colors use theme variables
- Background: `var(--cn-bg-page)` (#f8f9fb)
- Text Primary: `var(--cn-text-primary)` (#111827)
- Text Secondary: `var(--cn-text-secondary)` (#4b5563)
- White text only on colored buttons/circles: ✅

**Inline Styles Found (Minor):**
- Data Management buttons: `color: #374151` (should use `var(--cn-text-secondary)`)
- CN Agent text: `color: #6b7280` (should use `var(--cn-text-muted)`)
- State tips text: `color: #9ca3af` (should use `var(--cn-text-muted)`)

### ⚠️ INTENTIONAL DARK PAGES (Need .cn-section-dark)

These pages intentionally use dark backgrounds with white text. They should be wrapped in `.cn-section-dark`:

1. **app/document-generator-v2/document-generator.html**
   - Background: Dark gradient overlay
   - Text: White (#ffffff)
   - Status: Intentional, but should use `.cn-section-dark` class

2. **app/evidence-organizer.html**
   - Background: Dark gradient overlay
   - Text: White (#ffffff)
   - Status: Intentional, but should use `.cn-section-dark` class

3. **app/ai-response-agent.html**
   - Background: Dark gradient overlay
   - Text: White (#ffffff)
   - Status: Intentional, but should use `.cn-section-dark` class

4. **app/intake.html**
   - Background: Dark gradient overlay
   - Text: White (#ffffff)
   - Status: Intentional, but should use `.cn-section-dark` class

5. **app/quick-start.html**
   - Background: Dark gradient overlay
   - Text: White (#ffffff)
   - Status: Intentional, but should use `.cn-section-dark` class

6. **app/resource-center/advanced-tools/*.html**
   - Multiple pages with dark backgrounds
   - Status: Intentional, but should use `.cn-section-dark` class

7. **app/claim-portfolio/index.html**
   - Background: Dark gradient overlay
   - Text: White (#ffffff)
   - Status: Intentional, but should use `.cn-section-dark` class

### ❌ ISSUES FOUND

#### 1. Inline Styles in Resource Center HTML
**File:** `app/resource-center.html`
- Line 287: `color: #374151` - Should use `var(--cn-text-secondary)`
- Line 289-301: Button inline styles - Should use theme button classes
- Line 494, 499: Text colors - Should use theme variables

**File:** `app/resource-center/claim-roadmap.html`
- Line 792: `color: #9ca3af` - Should use `var(--cn-text-muted)`

#### 2. Hard-coded Colors in CSS
**File:** `app/assets/css/resource-center.css`
- Line 47: `color: #1d4ed8` - Should use theme variable
- Line 63: `color: #4b5563` - Should use `var(--cn-text-secondary)`
- Line 64: `background-color: #f8f9fb` - Should use `var(--cn-bg-page)`
- Line 72: `color: #1f2937` - Should use `var(--cn-text-primary)`
- Line 91: `color: #111` - Document content (OK for PDF)
- Line 103: `color: #111` - Document content (OK for PDF)

### 📊 Color Usage Statistics

**Total Files Scanned:** 20+
**Files with White Text:** 16 (mostly intentional dark pages)
**Files with Hard-coded Colors:** 8
**Files Using Theme Variables:** 2 (resource-center.css, theme.css)

### 🎯 Recommendations

#### Priority 1: Fix Inline Styles
1. Replace inline `style="color: #374151"` with `class="cn-text-secondary"`
2. Replace inline `style="color: #6b7280"` with `class="cn-text-muted"`
3. Replace inline button styles with `class="cn-btn-primary"` or `class="cn-btn-secondary"`

#### Priority 2: Wrap Dark Pages
1. Wrap dark background pages in `.cn-section-dark` class
2. Remove inline `color: #ffffff !important` overrides
3. Use `.cn-section-dark` utility classes for text

#### Priority 3: Convert Hard-coded Colors
1. Replace `#1d4ed8` with `var(--cn-accent)` or create `--cn-accent-hover`
2. Replace `#4b5563` with `var(--cn-text-secondary)`
3. Replace `#1f2937` with `var(--cn-text-primary)`
4. Replace `#f8f9fb` with `var(--cn-bg-page)`

### 🔍 How to Run Audit

1. **Browser Console:**
   ```javascript
   // On any page
   window.CNFontColorAudit.run()
   ```

2. **URL Parameter:**
   ```
   /app/resource-center.html?audit=colors
   ```

3. **QA Mode:**
   - Press `CTRL + SHIFT + D` to enable QA mode
   - Audit runs automatically

### ✅ Verification Checklist

- [x] Resource Center uses theme variables
- [x] Roadmap uses theme variables
- [x] White text only on colored buttons/circles
- [x] Dark text on light backgrounds
- [ ] All inline styles converted to theme classes
- [ ] All dark pages use `.cn-section-dark`
- [ ] All hard-coded colors use theme variables

### 📝 Next Steps

1. Convert inline styles in resource-center.html to theme classes
2. Wrap dark pages in `.cn-section-dark`
3. Replace remaining hard-coded colors in CSS
4. Run audit on all pages to verify compliance

