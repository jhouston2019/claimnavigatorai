# UNUSED OR DUPLICATE FILES - PHASE 2 IDENTIFICATION
**Generated:** 2025-01-27  
**Purpose:** List all unused, duplicate, or orphaned files identified during Phase 2  
**Status:** IDENTIFICATION ONLY - NO DELETIONS

---

## DUPLICATE DIRECTORIES (Identified for Future Consolidation)

### 1. State Guides (100 duplicate files)
- **Location 1:** `app/state-guides/` (50 files: AK.html through WY.html)
- **Location 2:** `app/resource-center/state/` (50 files: AK.html through WY.html)
- **Status:** Links updated to use `app/resource-center/state/` in Phase 1
- **Action Required:** Delete `app/state-guides/` after verification (NOT in Phase 2)

### 2. Claim Analysis Tools
- **Location 1:** `app/claim-analysis/` (6 files: business.html, damage.html, estimates.html, expert.html, policy.html, settlement.html)
- **Location 2:** `app/claim-analysis-tools/` (7 files: same 6 files + index.html)
- **Status:** Links updated to use `app/claim-analysis-tools/` in Phase 1
- **Action Required:** Delete `app/claim-analysis/` after verification (NOT in Phase 2)

### 3. Statement of Loss
- **Location 1:** `app/statement-of-loss.html`
- **Location 2:** `app/resource-center/statement-of-loss.html`
- **Status:** Links point to `app/statement-of-loss.html` (canonical version)
- **Action Required:** Delete `app/resource-center/statement-of-loss.html` after verification (NOT in Phase 2)

### 4. Document Generator
- **Location 1:** `app/document-generator-v2/` (newer version with forms)
- **Location 2:** `app/resource-center/document-generator/` (older version with 63 template files)
- **Status:** Need to determine which is active
- **Action Required:** Document which version is canonical, then delete other (NOT in Phase 2)

---

## ORPHANED PAGES (Not Linked from Navigation)

### Pages in `app/` Directory
1. `app/post.html` - No navigation links found
2. `app/receipt.html` - No navigation links found
3. `app/email-config.html` - No navigation links found
4. `app/affiliates.html` - No navigation links found
5. `app/partners.html` - No navigation links found
6. `app/register-professional.html` - No navigation links found

### Test Files in Root
1. `test-negotiation-scripts.html`
2. `test-maximize-claim.html`
3. `test-integration.html`
4. `test-insurance-tactics.html`
5. `test-functions.html`
6. `test-background.html`
7. `test-functions-local.html`
8. `test-advisory.html`
9. `test-financial-calculator.html`
10. `test-claim-header.html`
11. `test-evidence-organizer.html`
12. `test-document-generator-standalone.html`
13. `test-claim-analysis.html`
14. `test-claim-analysis-fixed.html`

### Backup Files
1. `index_backup.html` - Backup file in root
2. `index.html.backup-phase1-before-edit` - Phase 1 backup
3. All `*.backup-phase2-before-edit` files - Phase 2 backups (should be kept)

---

## POTENTIALLY UNUSED CSS FILES

### Files to Verify Usage
1. `styles/globals.css` - Check if referenced anywhere
2. `assets/css/advisory.css` - Check if used
3. `assets/css/document-generator.css` - May be duplicate of app version
4. `public/assets/css/style.css` - Check if used

---

## POTENTIALLY UNUSED JAVASCRIPT FILES

### Files to Verify Usage
1. `test-document-generator.js` - Test file
2. `generate_documents.js` - May be obsolete script

---

## GIT ARTIFACTS (Should Be Deleted)

1. `et --hard 3568bcb` - Git error artifact
2. `et --hard fd8a968` - Git error artifact
3. `tatus` - Git error artifact
4. `ting terminal` - Git error artifact

---

## UNUSED IMAGES

### Referenced but May Not Exist
1. `/favicon-16x16.png` - Referenced in manifest.json
2. `/favicon-32x32.png` - Referenced in manifest.json
3. `/android-chrome-192x192.png` - Referenced in manifest.json
4. `/android-chrome-512x512.png` - Referenced in manifest.json
5. `/screenshot-desktop.png` - Referenced in manifest.json
6. `/screenshot-mobile.png` - Referenced in manifest.json

---

## DUPLICATE COMPONENT FILES

### Components with Similar Names
1. `components/ResponseCenter.js` vs `components/ResponseCenter/ResponseCenter.js`
2. `components/SidebarNav.js` vs `components/ResponseCenter/SidebarNav.js`
3. `components/DashboardLanding.js` vs `components/ResponseCenter/DashboardLanding.js`

**Action Required:** Determine which versions are used, then consolidate (NOT in Phase 2)

---

## SUMMARY

- **Duplicate Directories:** 4 sets identified
- **Orphaned Pages:** 6 pages in app/, 14 test files in root
- **Backup Files:** 1 old backup in root (index_backup.html)
- **Git Artifacts:** 4 files to delete
- **Potentially Unused CSS:** 4 files to verify
- **Potentially Unused JS:** 2 files to verify
- **Missing Images:** 6 referenced in manifest.json
- **Duplicate Components:** 3 sets identified

**TOTAL FILES IDENTIFIED:** ~140+ files/directories

---

**NOTE:** This is an identification list only. No files have been deleted in Phase 2. All deletions should be performed in a future phase after verification and approval.

---

**END OF UNUSED/DUPLICATE FILES LIST**



