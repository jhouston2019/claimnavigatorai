# Font Color Audit Report
Generated: $(date)

## Summary

This audit scans for font color contrast issues across the ClaimNavigator AI codebase.

## Audit Criteria

✅ **GOOD**: Dark text on light backgrounds, White text on colored buttons/circles
❌ **BAD**: White text on light backgrounds, Black text on dark backgrounds
⚠️ **WARNING**: Low contrast ratios (< 4.5:1 for normal text, < 3:1 for large text)

## Files Scanned

### Resource Center Pages (✅ FIXED)
- `app/resource-center.html` - ✅ Using theme variables
- `app/resource-center/claim-roadmap.html` - ✅ Using theme variables
- `app/assets/css/resource-center.css` - ✅ Using theme variables

### Pages with Dark Backgrounds (Intentional - OK)
These pages intentionally use dark backgrounds with white text:
- `app/document-generator-v2/document-generator.html` - Dark background (intentional)
- `app/evidence-organizer.html` - Dark background (intentional)
- `app/ai-response-agent.html` - Dark background (intentional)
- `app/resource-center/advanced-tools/*.html` - Dark backgrounds (intentional)
- `app/intake.html` - Dark background (intentional)
- `app/quick-start.html` - Dark background (intentional)

### Pages Needing Review
- `app/claim-portfolio/index.html` - Has white text, needs verification
- `app/dashboard.html` - Needs verification
- `app/activation/first-steps.html` - Needs verification

## Color Usage Analysis

### ✅ Correct Usage (White Text on Colored Backgrounds)
Found in `resource-center.css`:
- `.btn-primary` - White text on blue (#2563eb) ✅
- `.search-btn` - White text on blue (#2563eb) ✅
- `.stage-node.active .stage-circle` - White text on blue (#2563eb) ✅
- `.stage-node.completed .stage-circle` - White text on green (#10b981) ✅

### ✅ Correct Usage (Dark Text on Light Backgrounds)
- All body text on `body.resource-center` - Dark text (#1f2937, #4b5563) on light bg (#f8f9fb) ✅
- All headings - Dark text (#1f2937) on light bg ✅
- All paragraphs - Dark text (#4b5563) on light bg ✅

### ⚠️ Inline Styles Found (Should Use Theme Classes)
In `app/resource-center.html`:
- Data Management buttons - Using inline styles (should use theme classes)
- CN Agent section text - Using inline styles (should use theme classes)

In `app/resource-center/claim-roadmap.html`:
- State-specific tips text - Using inline styles (should use theme classes)

## Recommendations

1. **Replace Inline Styles**: Convert inline `style="color: ..."` to theme utility classes
2. **Dark Pages**: Pages with intentional dark backgrounds should use `.cn-section-dark` wrapper
3. **Theme Integration**: All pages should import `theme.css` first
4. **QA Tool**: Use `?audit=colors` URL parameter or enable QA mode to run font color audit

## How to Run Audit

1. **Browser Console**: Open page and run `window.CNFontColorAudit.run()`
2. **URL Parameter**: Add `?audit=colors` to any page URL
3. **QA Mode**: Enable QA mode (CTRL+SHIFT+D) - audit runs automatically

## Next Steps

1. Review pages listed in "Pages Needing Review"
2. Convert inline styles to theme utility classes
3. Wrap dark sections in `.cn-section-dark` class
4. Ensure all pages import `theme.css` first

