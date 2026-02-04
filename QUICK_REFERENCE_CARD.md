# LAYOUT ALIGNMENT - QUICK REFERENCE CARD
**For rapid implementation - print this page**

---

## 🎯 GOAL
Make Advanced Tools pages visually match Resource Center exactly.

---

## 📋 CHECKLIST (17 pages × 4 changes each = 68 edits)

### Per Tool Page (5 min each):

#### ✅ 1. Update Font (in `<head>`)
```html
<!-- REMOVE -->
<link href="...Poppins..." rel="stylesheet">

<!-- ADD -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

#### ✅ 2. Add New Stylesheet (in `<head>`)
```html
<link rel="stylesheet" href="/app/assets/css/advanced-tools-layout.css">
```

#### ✅ 3. Delete Inline `<style>` Block
```html
<!-- DELETE entire <style> block (lines 13-209) -->
<!-- KEEP only tool-specific styles like sliders -->
```

#### ✅ 4. Replace Hero Header
```html
<!-- REPLACE -->
<div class="tool-header" style="max-width: 1000px; margin: 2rem auto;">
    <h1>Tool Name</h1>
    <p>Description</p>
</div>

<!-- WITH -->
<section class="tool-hero">
    <div class="tool-hero-container">
        <p class="tool-hero-eyebrow">Advanced Tools</p>
        <h1 class="tool-hero-title">Tool Name</h1>
        <p class="tool-hero-subtitle">Description</p>
    </div>
</section>
```

#### ✅ 5. Update Main Container
```html
<!-- ADD style attribute -->
<main class="tool-container" style="padding-top: 80px;">
```

---

## 📁 FILES TO UPDATE

```
☐ settlement-calculator-pro.html
☐ fraud-detection-scanner.html
☐ evidence-photo-analyzer.html
☐ policy-comparison-tool.html
☐ bad-faith-evidence-tracker.html
☐ insurance-profile-database.html
☐ regulatory-updates-monitor.html
☐ compliance-monitor.html
☐ appeal-package-builder.html
☐ mediation-preparation-kit.html
☐ arbitration-strategy-guide.html
☐ expert-witness-database.html
☐ settlement-history-database.html
☐ deadline-tracker-pro.html
☐ expert-opinion-generator.html
☐ communication-templates.html
☐ mediation-arbitration-evidence-organizer.html
☐ advanced-tools.html (hub page - different changes)
```

---

## 🧪 QUICK TEST

After each page:
1. Open in browser
2. Check: Light background? ✓
3. Check: Dark text? ✓
4. Check: Dark hero section? ✓
5. Check: Flat cards? ✓
6. Check: Form still works? ✓

---

## 🚨 IF SOMETHING BREAKS

1. Comment out: `<link rel="stylesheet" href="/app/assets/css/advanced-tools-layout.css">`
2. Revert hero structure
3. Re-add inline `<style>` block from git history

---

## 📊 PROGRESS TRACKER

**Time per page:** 5 minutes  
**Total pages:** 17  
**Total time:** 85 minutes  
**Plus hub page:** +15 minutes  
**Plus testing:** +30 minutes  
**Total:** ~2.5 hours

**Current progress:** ___ / 17 pages complete

---

## 🎨 VISUAL REFERENCE

**BEFORE (Wrong):**
- Dark background with image
- White text
- Glassmorphic cards
- Centered header card

**AFTER (Correct):**
- Light gray background `#F5F7FA`
- Dark text `#0B1B34`
- Flat light cards `#F0F4FA`
- Full-width dark hero `#0B1B34`

---

## 🔑 KEY MEASUREMENTS

| Element | Value |
|---------|-------|
| Container width | `1120px` |
| Container padding | `0 24px` |
| Hero padding | `96px 0 88px` |
| H1 size | `42px` |
| H2 size | `32px` |
| H3 size | `22px` |
| Body text | `16px` |
| Card padding | `24px` |
| Card radius | `16px` |
| Grid gap | `24px` |
| Section padding | `80px 0` |
| Primary color | `#2D5BFF` |

---

## 💡 TIPS

- Work in batches of 5 pages
- Test after each batch
- Use find/replace for font link
- Copy hero structure once, reuse 17 times
- Keep original files in git history
- Take a screenshot before/after for comparison

---

## ✅ DONE?

Compare side-by-side:
- `/app/resource-center.html`
- Any tool page you just updated

**Ask:** "Do these feel like the same product?"

If YES → ✅ Success!  
If NO → Review audit report

---

**Print this card and check off pages as you go!**







