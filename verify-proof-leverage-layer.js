/**
 * Verification Script for Proof & Leverage Layer
 * Run this to verify all components are properly integrated
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Proof & Leverage Layer Implementation...\n');

const checks = [];
let passed = 0;
let failed = 0;

// =====================================================
// FILE EXISTENCE CHECKS
// =====================================================

function checkFileExists(filePath, description) {
  const fullPath = path.join(__dirname, filePath);
  const exists = fs.existsSync(fullPath);
  checks.push({
    category: 'File Existence',
    description,
    status: exists ? 'PASS' : 'FAIL',
    details: exists ? `Found: ${filePath}` : `Missing: ${filePath}`
  });
  if (exists) passed++; else failed++;
  return exists;
}

// Database migration
checkFileExists(
  'supabase/migrations/20260219_evidence_gaps_schema.sql',
  'Evidence gaps schema migration'
);

// Backend functions
checkFileExists(
  'netlify/functions/analyze-evidence-gaps.js',
  'Evidence gap analyzer function'
);

checkFileExists(
  'netlify/functions/evaluate-escalation-status.js',
  'Escalation evaluator function'
);

checkFileExists(
  'netlify/functions/generate-escalation-template.js',
  'Escalation template generator function'
);

// Frontend files
checkFileExists(
  'claim-command-center.html',
  'Main HTML file'
);

checkFileExists(
  'app/assets/js/claim-command-center-components.js',
  'Component library'
);

// =====================================================
// CODE CONTENT CHECKS
// =====================================================

function checkFileContains(filePath, searchString, description) {
  const fullPath = path.join(__dirname, filePath);
  if (!fs.existsSync(fullPath)) {
    checks.push({
      category: 'Code Content',
      description,
      status: 'SKIP',
      details: `File not found: ${filePath}`
    });
    return false;
  }
  
  const content = fs.readFileSync(fullPath, 'utf8');
  const contains = content.includes(searchString);
  checks.push({
    category: 'Code Content',
    description,
    status: contains ? 'PASS' : 'FAIL',
    details: contains ? `Found in ${filePath}` : `Not found in ${filePath}`
  });
  if (contains) passed++; else failed++;
  return contains;
}

// Check for evidence gap table creation
checkFileContains(
  'supabase/migrations/20260219_evidence_gaps_schema.sql',
  'CREATE TABLE IF NOT EXISTS public.claim_evidence_gaps',
  'Evidence gaps table creation'
);

// Check for escalation status table creation
checkFileContains(
  'supabase/migrations/20260219_evidence_gaps_schema.sql',
  'CREATE TABLE IF NOT EXISTS public.claim_escalation_status',
  'Escalation status table creation'
);

// Check for helper functions
checkFileContains(
  'supabase/migrations/20260219_evidence_gaps_schema.sql',
  'CREATE OR REPLACE FUNCTION get_critical_evidence_gaps',
  'Helper function: get_critical_evidence_gaps'
);

// Check frontend functions
checkFileContains(
  'claim-command-center.html',
  'async function analyzeEvidenceGaps',
  'Frontend: analyzeEvidenceGaps function'
);

checkFileContains(
  'claim-command-center.html',
  'async function evaluateEscalation',
  'Frontend: evaluateEscalation function'
);

checkFileContains(
  'claim-command-center.html',
  'async function generateEscalationTemplate',
  'Frontend: generateEscalationTemplate function'
);

checkFileContains(
  'claim-command-center.html',
  'function updateEvidenceGapStatus',
  'Frontend: updateEvidenceGapStatus function'
);

// Check component updates
checkFileContains(
  'app/assets/js/claim-command-center-components.js',
  'async loadEvidenceGaps()',
  'Component: loadEvidenceGaps method'
);

checkFileContains(
  'app/assets/js/claim-command-center-components.js',
  'async renderProofRequirements',
  'Component: renderProofRequirements method'
);

checkFileContains(
  'app/assets/js/claim-command-center-components.js',
  'renderRequiredActions(container)',
  'Component: renderRequiredActions method'
);

// Check supplement integration
checkFileContains(
  'netlify/functions/generate-supplement-v2.js',
  'claim_evidence_gaps',
  'Supplement: Evidence gap integration'
);

checkFileContains(
  'netlify/functions/lib/supplement-formatter.js',
  'formatProofDocumentationSection',
  'Formatter: Proof documentation section'
);

// =====================================================
// LANGUAGE ENFORCEMENT CHECKS
// =====================================================

function checkFileDoesNotContain(filePath, searchPattern, description) {
  const fullPath = path.join(__dirname, filePath);
  if (!fs.existsSync(fullPath)) {
    checks.push({
      category: 'Language Enforcement',
      description,
      status: 'SKIP',
      details: `File not found: ${filePath}`
    });
    return false;
  }
  
  const content = fs.readFileSync(fullPath, 'utf8');
  const regex = new RegExp(searchPattern, 'gi');
  const matches = content.match(regex);
  const clean = !matches || matches.length === 0;
  
  checks.push({
    category: 'Language Enforcement',
    description,
    status: clean ? 'PASS' : 'WARN',
    details: clean 
      ? `No weak language found in ${filePath}` 
      : `Found ${matches.length} instance(s) of weak language in ${filePath}: ${matches.slice(0, 3).join(', ')}`
  });
  
  if (clean) passed++; else failed++;
  return clean;
}

// Check for weak language in key files
checkFileDoesNotContain(
  'netlify/functions/lib/supplement-builder.js',
  '(may indicate|may not|could|might|should be|please)',
  'Supplement builder: No weak language'
);

checkFileDoesNotContain(
  'netlify/functions/lib/code-upgrade-engine.js',
  '(may require|may indicate|could require)',
  'Code upgrade engine: No weak language'
);

checkFileDoesNotContain(
  'netlify/functions/lib/policy-estimate-crosswalk.js',
  '(may not meet|should be covered|may require)',
  'Policy crosswalk: No weak language'
);

// =====================================================
// CSS CHECKS
// =====================================================

checkFileContains(
  'claim-command-center.html',
  '.required-actions-section',
  'CSS: Required actions section styling'
);

checkFileContains(
  'claim-command-center.html',
  '.evidence-gap-section',
  'CSS: Evidence gap section styling'
);

checkFileContains(
  'claim-command-center.html',
  '.proof-checklist-section',
  'CSS: Proof checklist section styling'
);

checkFileContains(
  'claim-command-center.html',
  '.escalation-recommendation-section',
  'CSS: Escalation recommendation section styling'
);

// =====================================================
// TEMPLATE CHECKS
// =====================================================

checkFileContains(
  'netlify/functions/generate-escalation-template.js',
  'function generateSupervisorTemplate',
  'Template: Supervisor escalation letter'
);

checkFileContains(
  'netlify/functions/generate-escalation-template.js',
  'function generateDOITemplate',
  'Template: DOI complaint'
);

checkFileContains(
  'netlify/functions/generate-escalation-template.js',
  'function generateAppraisalTemplate',
  'Template: Appraisal demand'
);

// =====================================================
// PRINT RESULTS
// =====================================================

console.log('\n' + '='.repeat(80));
console.log('VERIFICATION RESULTS');
console.log('='.repeat(80) + '\n');

const categories = [...new Set(checks.map(c => c.category))];

categories.forEach(category => {
  console.log(`\n📋 ${category}`);
  console.log('-'.repeat(80));
  
  const categoryChecks = checks.filter(c => c.category === category);
  categoryChecks.forEach(check => {
    const icon = check.status === 'PASS' ? '✅' : check.status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${icon} ${check.description}`);
    if (check.status !== 'PASS') {
      console.log(`   ${check.details}`);
    }
  });
});

console.log('\n' + '='.repeat(80));
console.log('SUMMARY');
console.log('='.repeat(80));
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📊 Total:  ${passed + failed}`);
console.log(`🎯 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
console.log('='.repeat(80) + '\n');

if (failed === 0) {
  console.log('🎉 All checks passed! Proof & Leverage Layer is properly integrated.\n');
  process.exit(0);
} else {
  console.log('⚠️  Some checks failed. Review the details above and fix any issues.\n');
  process.exit(1);
}
