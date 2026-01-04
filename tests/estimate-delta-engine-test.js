/**
 * ESTIMATE DELTA ENGINE TEST SUITE
 * Verifies estimate comparison and delta detection
 */

const {
  compareEstimates,
  getDeltaSummary
} = require('../app/assets/js/intelligence/estimate-delta-engine');

function runEstimateDeltaEngineTests() {
  console.log('═'.repeat(80));
  console.log('ESTIMATE DELTA ENGINE TEST SUITE');
  console.log('═'.repeat(80));
  console.log('');

  let passed = 0;
  let failed = 0;

  // TEST 1: Identical estimates → No differences
  console.log('Test 1: Identical Estimates → No Differences');
  const test1 = compareEstimates({
    originalEstimate: {
      text: 'Replace roof - $5000\nReplace siding - $3000',
      lineItems: [
        { lineNumber: 1, description: 'Replace roof', amount: 5000 },
        { lineNumber: 2, description: 'Replace siding', amount: 3000 }
      ],
      total: 8000
    },
    carrierEstimate: {
      text: 'Replace roof - $5000\nReplace siding - $3000',
      lineItems: [
        { lineNumber: 1, description: 'Replace roof', amount: 5000 },
        { lineNumber: 2, description: 'Replace siding', amount: 3000 }
      ],
      total: 8000
    }
  });

  if (!test1.scopeRegressionDetected &&
      test1.removedLineItems.length === 0 &&
      test1.reducedQuantities.length === 0) {
    console.log('✅ PASSED - No differences detected');
    passed++;
  } else {
    console.log('❌ FAILED - Should not detect differences');
    console.log('   Removed:', test1.removedLineItems.length);
    failed++;
  }

  // TEST 2: Removed line item → Detected
  console.log('\nTest 2: Removed Line Item → Detected');
  const test2 = compareEstimates({
    originalEstimate: {
      lineItems: [
        { lineNumber: 1, description: 'Replace roof', amount: 5000 },
        { lineNumber: 2, description: 'Replace siding', amount: 3000 },
        { lineNumber: 3, description: 'Replace windows', amount: 2000 }
      ],
      total: 10000
    },
    carrierEstimate: {
      lineItems: [
        { lineNumber: 1, description: 'Replace roof', amount: 5000 },
        { lineNumber: 2, description: 'Replace siding', amount: 3000 }
      ],
      total: 8000
    }
  });

  if (test2.scopeRegressionDetected &&
      test2.removedLineItems.length === 1 &&
      test2.removedLineItems[0].description.includes('windows')) {
    console.log('✅ PASSED - Removed line item detected');
    console.log('   Removed:', test2.removedLineItems[0].description);
    passed++;
  } else {
    console.log('❌ FAILED - Should detect removed line item');
    failed++;
  }

  // TEST 3: Reduced quantity → Detected
  console.log('\nTest 3: Reduced Quantity → Detected');
  const test3 = compareEstimates({
    originalEstimate: {
      lineItems: [
        { lineNumber: 1, description: 'Replace roof 1000 sq ft', amount: 5000, quantity: 1000 }
      ],
      total: 5000
    },
    carrierEstimate: {
      lineItems: [
        { lineNumber: 1, description: 'Replace roof 500 sq ft', amount: 2500, quantity: 500 }
      ],
      total: 2500
    }
  });

  if (test3.scopeRegressionDetected &&
      test3.reducedQuantities.length === 1 &&
      test3.reducedQuantities[0].before === 1000 &&
      test3.reducedQuantities[0].after === 500) {
    console.log('✅ PASSED - Reduced quantity detected');
    console.log('   Before:', test3.reducedQuantities[0].before);
    console.log('   After:', test3.reducedQuantities[0].after);
    passed++;
  } else {
    console.log('❌ FAILED - Should detect reduced quantity');
    console.log('   Reduced quantities:', test3.reducedQuantities);
    failed++;
  }

  // TEST 4: Valuation changes → Detected
  console.log('\nTest 4: Valuation Changes → Detected');
  const test4 = compareEstimates({
    originalEstimate: {
      lineItems: [
        { lineNumber: 1, description: 'Replace roof', amount: 5000 }
      ],
      total: 5000
    },
    carrierEstimate: {
      lineItems: [
        { lineNumber: 1, description: 'Replace roof', amount: 3000 }
      ],
      total: 3000
    }
  });

  if (test4.valuationChangesPresent) {
    console.log('✅ PASSED - Valuation changes detected');
    passed++;
  } else {
    console.log('❌ FAILED - Should detect valuation changes');
    failed++;
  }

  // TEST 5: Category omission → Detected
  console.log('\nTest 5: Category Omission → Detected');
  const test5 = compareEstimates({
    originalEstimate: {
      lineItems: [
        { lineNumber: 1, description: 'Replace roof', amount: 5000 },
        { lineNumber: 2, description: 'Replace windows', amount: 2000 }
      ],
      total: 7000
    },
    carrierEstimate: {
      lineItems: [
        { lineNumber: 1, description: 'Replace roof', amount: 5000 }
      ],
      total: 5000
    }
  });

  if (test5.categoryOmissions.length > 0) {
    console.log('✅ PASSED - Category omission detected');
    console.log('   Omissions:', test5.categoryOmissions);
    passed++;
  } else {
    console.log('❌ FAILED - Should detect category omission');
    failed++;
  }

  // TEST 6: Multiple changes → All detected
  console.log('\nTest 6: Multiple Changes → All Detected');
  const test6 = compareEstimates({
    originalEstimate: {
      lineItems: [
        { lineNumber: 1, description: 'Replace roof', amount: 5000 },
        { lineNumber: 2, description: 'Replace siding', amount: 3000 },
        { lineNumber: 3, description: 'Replace windows', amount: 2000 },
        { lineNumber: 4, description: 'Paint exterior', amount: 1000 }
      ],
      total: 11000
    },
    carrierEstimate: {
      lineItems: [
        { lineNumber: 1, description: 'Replace roof', amount: 4000 },
        { lineNumber: 2, description: 'Replace siding', amount: 3000 }
      ],
      total: 7000
    }
  });

  if (test6.scopeRegressionDetected &&
      test6.removedLineItems.length >= 2 &&
      test6.valuationChangesPresent) {
    console.log('✅ PASSED - Multiple changes detected');
    console.log('   Removed items:', test6.removedLineItems.length);
    console.log('   Valuation changes:', test6.valuationChangesPresent);
    passed++;
  } else {
    console.log('❌ FAILED - Should detect multiple changes');
    failed++;
  }

  // TEST 7: Delta summary generation
  console.log('\nTest 7: Delta Summary → Generated');
  const test7 = getDeltaSummary({
    removedLineItems: [{ description: 'Item 1' }],
    reducedQuantities: [],
    categoryOmissions: [],
    valuationChangesPresent: true,
    scopeRegressionDetected: true
  });

  if (test7 && test7.length > 0 && test7.includes('removed')) {
    console.log('✅ PASSED - Delta summary generated');
    console.log('   Summary:', test7);
    passed++;
  } else {
    console.log('❌ FAILED - Summary not generated correctly');
    failed++;
  }

  // TEST 8: No changes summary
  console.log('\nTest 8: No Changes → Summary Correct');
  const test8 = getDeltaSummary({
    removedLineItems: [],
    reducedQuantities: [],
    categoryOmissions: [],
    valuationChangesPresent: false,
    scopeRegressionDetected: false
  });

  if (test8.includes('No significant differences')) {
    console.log('✅ PASSED - No changes summary correct');
    passed++;
  } else {
    console.log('❌ FAILED - Should indicate no differences');
    failed++;
  }

  // TEST 9: Fuzzy matching works
  console.log('\nTest 9: Fuzzy Matching → Similar Items Matched');
  const test9 = compareEstimates({
    originalEstimate: {
      lineItems: [
        { lineNumber: 1, description: 'Replace asphalt shingle roof', amount: 5000 }
      ],
      total: 5000
    },
    carrierEstimate: {
      lineItems: [
        { lineNumber: 1, description: 'Replace roof shingles', amount: 5000 }
      ],
      total: 5000
    }
  });

  if (!test9.scopeRegressionDetected) {
    console.log('✅ PASSED - Fuzzy matching working');
    passed++;
  } else {
    console.log('❌ FAILED - Should match similar items');
    console.log('   Removed items:', test9.removedLineItems);
    failed++;
  }

  // TEST 10: Deterministic comparison
  console.log('\nTest 10: Deterministic Comparison → Identical Output');
  const input = {
    originalEstimate: {
      lineItems: [
        { lineNumber: 1, description: 'Replace roof', amount: 5000 }
      ],
      total: 5000
    },
    carrierEstimate: {
      lineItems: [
        { lineNumber: 1, description: 'Replace roof', amount: 3000 }
      ],
      total: 3000
    }
  };

  const run1 = compareEstimates(input);
  const run2 = compareEstimates(input);
  const run3 = compareEstimates(input);

  if (run1.scopeRegressionDetected === run2.scopeRegressionDetected &&
      run2.scopeRegressionDetected === run3.scopeRegressionDetected &&
      run1.valuationChangesPresent === run2.valuationChangesPresent &&
      run2.valuationChangesPresent === run3.valuationChangesPresent) {
    console.log('✅ PASSED - Comparison is deterministic');
    passed++;
  } else {
    console.log('❌ FAILED - Non-deterministic comparison');
    failed++;
  }

  // Summary
  console.log('\n' + '═'.repeat(80));
  console.log('TEST SUMMARY');
  console.log('═'.repeat(80));
  console.log(`Total: 10`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log('');

  if (failed === 0) {
    console.log('🎉 ALL TESTS PASSED! Estimate delta engine working correctly.');
  } else {
    console.log('⚠️ SOME TESTS FAILED. Review failures above.');
  }
  console.log('═'.repeat(80));

  return { passed, failed };
}

// Run if executed directly
if (require.main === module) {
  const results = runEstimateDeltaEngineTests();
  process.exit(results.failed > 0 ? 1 : 0);
}

module.exports = { runEstimateDeltaEngineTests };

