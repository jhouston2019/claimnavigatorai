/**
 * SCOPE REGRESSION DETECTOR TEST SUITE
 * Verifies scope regression detection accuracy
 */

const {
  REGRESSION_TYPE,
  detectScopeRegression,
  getRegressionSeverity,
  getRegressionDescription,
  validateRegressionDetection
} = require('../app/assets/js/intelligence/scope-regression-detector');

function runScopeRegressionDetectorTests() {
  console.log('═'.repeat(80));
  console.log('SCOPE REGRESSION DETECTOR TEST SUITE');
  console.log('═'.repeat(80));
  console.log('');

  let passed = 0;
  let failed = 0;

  // TEST 1: No regression → None detected
  console.log('Test 1: No Regression → None Detected');
  const test1 = detectScopeRegression({
    submissionPacket: {},
    carrierResponse: { carrierText: 'Your claim has been approved.' },
    estimateDelta: {
      scopeRegressionDetected: false,
      removedLineItems: [],
      reducedQuantities: [],
      categoryOmissions: [],
      valuationChangesPresent: false
    }
  });

  if (!test1.regressionDetected && test1.regressionType === REGRESSION_TYPE.NONE) {
    console.log('✅ PASSED - No regression detected');
    passed++;
  } else {
    console.log('❌ FAILED - Should not detect regression');
    failed++;
  }

  // TEST 2: Line item removal → Detected
  console.log('\nTest 2: Line Item Removal → Detected');
  const test2 = detectScopeRegression({
    submissionPacket: {},
    carrierResponse: {},
    estimateDelta: {
      scopeRegressionDetected: true,
      removedLineItems: [
        { description: 'Replace windows', amount: 2000 }
      ],
      reducedQuantities: [],
      categoryOmissions: [],
      valuationChangesPresent: true
    }
  });

  if (test2.regressionDetected &&
      test2.regressionType === REGRESSION_TYPE.LINE_ITEM_REMOVAL &&
      test2.evidence.length > 0) {
    console.log('✅ PASSED - Line item removal detected');
    console.log('   Evidence:', test2.evidence);
    passed++;
  } else {
    console.log('❌ FAILED - Should detect line item removal');
    failed++;
  }

  // TEST 3: Quantity reduction → Detected
  console.log('\nTest 3: Quantity Reduction → Detected');
  const test3 = detectScopeRegression({
    submissionPacket: {},
    carrierResponse: {},
    estimateDelta: {
      scopeRegressionDetected: true,
      removedLineItems: [],
      reducedQuantities: [
        { description: 'Replace roof', before: 1000, after: 500 }
      ],
      categoryOmissions: [],
      valuationChangesPresent: true
    }
  });

  if (test3.regressionDetected &&
      test3.regressionType === REGRESSION_TYPE.QUANTITY_REDUCTION) {
    console.log('✅ PASSED - Quantity reduction detected');
    passed++;
  } else {
    console.log('❌ FAILED - Should detect quantity reduction');
    failed++;
  }

  // TEST 4: Category removal → Detected
  console.log('\nTest 4: Category Removal → Detected');
  const test4 = detectScopeRegression({
    submissionPacket: {},
    carrierResponse: {},
    estimateDelta: {
      scopeRegressionDetected: true,
      removedLineItems: [],
      reducedQuantities: [],
      categoryOmissions: [
        { category: 'Windows', affectedItemCount: 3 }
      ],
      valuationChangesPresent: true
    }
  });

  if (test4.regressionDetected &&
      test4.regressionType === REGRESSION_TYPE.CATEGORY_REMOVAL) {
    console.log('✅ PASSED - Category removal detected');
    passed++;
  } else {
    console.log('❌ FAILED - Should detect category removal');
    failed++;
  }

  // TEST 5: Mixed regression → Detected
  console.log('\nTest 5: Mixed Regression → Detected');
  const test5 = detectScopeRegression({
    submissionPacket: {},
    carrierResponse: {},
    estimateDelta: {
      scopeRegressionDetected: true,
      removedLineItems: [
        { description: 'Paint exterior', amount: 1000 }
      ],
      reducedQuantities: [
        { description: 'Replace roof', before: 1000, after: 500 }
      ],
      categoryOmissions: [],
      valuationChangesPresent: true
    }
  });

  if (test5.regressionDetected &&
      test5.regressionType === REGRESSION_TYPE.MIXED &&
      test5.evidence.length >= 2) {
    console.log('✅ PASSED - Mixed regression detected');
    console.log('   Evidence count:', test5.evidence.length);
    passed++;
  } else {
    console.log('❌ FAILED - Should detect mixed regression');
    failed++;
  }

  // TEST 6: Carrier text indicators → Detected
  console.log('\nTest 6: Carrier Text Indicators → Detected');
  const test6 = detectScopeRegression({
    submissionPacket: {},
    carrierResponse: {
      carrierText: 'Several items have been removed as they are not covered under your policy.'
    },
    estimateDelta: {
      scopeRegressionDetected: false,
      removedLineItems: [],
      reducedQuantities: [],
      categoryOmissions: [],
      valuationChangesPresent: false
    }
  });

  if (test6.regressionDetected && test6.evidence.length > 0) {
    console.log('✅ PASSED - Text indicators detected');
    console.log('   Evidence:', test6.evidence);
    passed++;
  } else {
    console.log('❌ FAILED - Should detect text indicators');
    failed++;
  }

  // TEST 7: Severity calculation
  console.log('\nTest 7: Severity Calculation → Correct');
  const test7a = getRegressionSeverity({
    regressionDetected: true,
    evidence: ['1', '2', '3', '4', '5', '6']
  });

  const test7b = getRegressionSeverity({
    regressionDetected: true,
    evidence: ['1', '2', '3']
  });

  const test7c = getRegressionSeverity({
    regressionDetected: false,
    evidence: []
  });

  if (test7a === 'HIGH' && test7b === 'MEDIUM' && test7c === 'NONE') {
    console.log('✅ PASSED - Severity calculated correctly');
    console.log('   6 evidence:', test7a);
    console.log('   3 evidence:', test7b);
    console.log('   0 evidence:', test7c);
    passed++;
  } else {
    console.log('❌ FAILED - Severity calculation incorrect');
    failed++;
  }

  // TEST 8: Validation working
  console.log('\nTest 8: Validation → Working');
  const test8a = validateRegressionDetection({
    regressionDetected: true,
    regressionType: REGRESSION_TYPE.LINE_ITEM_REMOVAL,
    evidence: ['Evidence 1']
  });

  const test8b = validateRegressionDetection({
    regressionDetected: true,
    regressionType: REGRESSION_TYPE.LINE_ITEM_REMOVAL,
    evidence: []
  });

  if (test8a.valid && !test8b.valid && test8b.issues.length > 0) {
    console.log('✅ PASSED - Validation working');
    console.log('   Valid detection:', test8a.valid);
    console.log('   Invalid detection:', test8b.valid);
    passed++;
  } else {
    console.log('❌ FAILED - Validation not working correctly');
    failed++;
  }

  // Summary
  console.log('\n' + '═'.repeat(80));
  console.log('TEST SUMMARY');
  console.log('═'.repeat(80));
  console.log(`Total: 8`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log('');

  if (failed === 0) {
    console.log('🎉 ALL TESTS PASSED! Scope regression detector working correctly.');
  } else {
    console.log('⚠️ SOME TESTS FAILED. Review failures above.');
  }
  console.log('═'.repeat(80));

  return { passed, failed };
}

// Run if executed directly
if (require.main === module) {
  const results = runScopeRegressionDetectorTests();
  process.exit(results.failed > 0 ? 1 : 0);
}

module.exports = { runScopeRegressionDetectorTests };

