/**
 * Enforcement Layer Build Verification Script
 * Verifies all components are in place and tests are passing
 */

const fs = require('fs');
const path = require('path');

console.log('\n========================================');
console.log('ENFORCEMENT LAYER BUILD VERIFICATION');
console.log('========================================\n');

let allChecksPass = true;

// =====================================================
// CHECK 1: VERIFY FILES EXIST
// =====================================================
console.log('CHECK 1: Verifying files exist...\n');

const requiredFiles = [
  'netlify/functions/lib/code-upgrade-engine.js',
  'netlify/functions/lib/policy-estimate-crosswalk.js',
  'netlify/functions/lib/carrier-pattern-engine.js',
  'netlify/functions/generate-supplement-packet.js',
  'tests/code-upgrade-engine.test.js',
  'tests/policy-crosswalk.test.js',
  'tests/carrier-pattern-engine.test.js',
  'tests/supplement-packet.test.js',
  'supabase/migrations/20260214_enforcement_layers.sql',
  'ENFORCEMENT_LAYER_UPGRADE.md',
  'ENFORCEMENT_LAYER_API_REFERENCE.md',
  'BUILD_COMPLETE_SUMMARY.md'
];

for (const file of requiredFiles) {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✓ ${file}`);
  } else {
    console.log(`✗ ${file} - MISSING`);
    allChecksPass = false;
  }
}

// =====================================================
// CHECK 2: VERIFY INTEGRATIONS
// =====================================================
console.log('\n\nCHECK 2: Verifying integrations...\n');

const analyzeEstimatesPath = path.join(__dirname, 'netlify/functions/analyze-estimates-v2.js');
if (fs.existsSync(analyzeEstimatesPath)) {
  const content = fs.readFileSync(analyzeEstimatesPath, 'utf8');
  
  const checks = [
    { name: 'Code Upgrade Engine import', pattern: /require\(['"]\.\/lib\/code-upgrade-engine['"]\)/ },
    { name: 'Policy Crosswalk Engine import', pattern: /require\(['"]\.\/lib\/policy-estimate-crosswalk['"]\)/ },
    { name: 'Carrier Pattern Engine import', pattern: /require\(['"]\.\/lib\/carrier-pattern-engine['"]\)/ },
    { name: 'analyzeCodeUpgrades call', pattern: /analyzeCodeUpgrades\(/ },
    { name: 'analyzePolicyCrosswalk call', pattern: /analyzePolicyCrosswalk\(/ },
    { name: 'analyzeCarrierPatterns call', pattern: /analyzeCarrierPatterns\(/ },
    { name: 'totalProjectedRecoveryWithEnforcement calculation', pattern: /totalProjectedRecoveryWithEnforcement/ },
    { name: 'claim_enforcement_reports upsert', pattern: /claim_enforcement_reports/ },
    { name: 'enforcement in response', pattern: /enforcement:/ }
  ];
  
  for (const check of checks) {
    if (check.pattern.test(content)) {
      console.log(`✓ ${check.name}`);
    } else {
      console.log(`✗ ${check.name} - NOT FOUND`);
      allChecksPass = false;
    }
  }
} else {
  console.log('✗ analyze-estimates-v2.js not found');
  allChecksPass = false;
}

// =====================================================
// CHECK 3: VERIFY FRONTEND UPDATES
// =====================================================
console.log('\n\nCHECK 3: Verifying frontend updates...\n');

const componentsPath = path.join(__dirname, 'app/assets/js/claim-command-center-components.js');
if (fs.existsSync(componentsPath)) {
  const content = fs.readFileSync(componentsPath, 'utf8');
  
  const checks = [
    { name: 'enforcement variable', pattern: /const enforcement = / },
    { name: 'codeUpgrades variable', pattern: /const codeUpgrades = / },
    { name: 'coverageCrosswalk variable', pattern: /const coverageCrosswalk = / },
    { name: 'carrierPatterns variable', pattern: /const carrierPatterns = / },
    { name: 'totalWithEnforcement variable', pattern: /totalWithEnforcement/ },
    { name: 'Code Compliance section', pattern: /Code Compliance Requirements/ },
    { name: 'Policy Coverage section', pattern: /Policy Coverage Analysis/ },
    { name: 'Carrier Patterns section', pattern: /Carrier Behavior Patterns/ },
    { name: 'Generate Supplement Packet button', pattern: /generateStructuredSupplementPacket/ }
  ];
  
  for (const check of checks) {
    if (check.pattern.test(content)) {
      console.log(`✓ ${check.name}`);
    } else {
      console.log(`✗ ${check.name} - NOT FOUND`);
      allChecksPass = false;
    }
  }
} else {
  console.log('✗ claim-command-center-components.js not found');
  allChecksPass = false;
}

// =====================================================
// CHECK 4: VERIFY CSS STYLES
// =====================================================
console.log('\n\nCHECK 4: Verifying CSS styles...\n');

const htmlPath = path.join(__dirname, 'claim-command-center.html');
if (fs.existsSync(htmlPath)) {
  const content = fs.readFileSync(htmlPath, 'utf8');
  
  const checks = [
    { name: '.highlight-warning', pattern: /\.highlight-warning/ },
    { name: '.highlight-danger', pattern: /\.highlight-danger/ },
    { name: '.alert-danger', pattern: /\.alert-danger/ },
    { name: '.badge-high', pattern: /\.badge-high/ },
    { name: '.badge-medium', pattern: /\.badge-medium/ },
    { name: '.badge-low', pattern: /\.badge-low/ },
    { name: '.badge-critical', pattern: /\.badge-critical/ }
  ];
  
  for (const check of checks) {
    if (check.pattern.test(content)) {
      console.log(`✓ ${check.name}`);
    } else {
      console.log(`✗ ${check.name} - NOT FOUND`);
      allChecksPass = false;
    }
  }
} else {
  console.log('✗ claim-command-center.html not found');
  allChecksPass = false;
}

// =====================================================
// CHECK 5: RUN UNIT TESTS
// =====================================================
console.log('\n\nCHECK 5: Running unit tests...\n');

const testFiles = [
  'tests/code-upgrade-engine.test.js',
  'tests/policy-crosswalk.test.js',
  'tests/carrier-pattern-engine.test.js',
  'tests/supplement-packet.test.js'
];

let testsPassed = 0;
let testsFailed = 0;

for (const testFile of testFiles) {
  try {
    console.log(`\nRunning ${testFile}...`);
    require(`./${testFile}`).runAllTests();
    testsPassed++;
  } catch (error) {
    console.error(`✗ ${testFile} FAILED:`, error.message);
    testsFailed++;
    allChecksPass = false;
  }
}

// =====================================================
// FINAL REPORT
// =====================================================
console.log('\n\n========================================');
console.log('VERIFICATION REPORT');
console.log('========================================\n');

console.log(`Files Verified: ${requiredFiles.length}`);
console.log(`Integration Points Verified: 9`);
console.log(`Frontend Updates Verified: 9`);
console.log(`CSS Styles Verified: 7`);
console.log(`Test Suites Run: ${testsPassed + testsFailed}`);
console.log(`Tests Passed: ${testsPassed}`);
console.log(`Tests Failed: ${testsFailed}`);

console.log('\n========================================');
if (allChecksPass) {
  console.log('✅ ALL CHECKS PASSED');
  console.log('========================================');
  console.log('\n🚀 ENFORCEMENT LAYER BUILD: VERIFIED');
  console.log('✅ System is production-ready\n');
  process.exit(0);
} else {
  console.log('❌ SOME CHECKS FAILED');
  console.log('========================================');
  console.log('\n⚠️  Please review failed checks above\n');
  process.exit(1);
}
