/**
 * ESTIMATE ENGINE PARITY TEST
 * Verifies Claim Navigator estimate engine produces identical results to Estimate Review Pro
 */

const EstimateEngine = require('../app/assets/js/intelligence/estimate-engine');

// Test data
const TEST_CASES = [
  {
    name: 'Valid Property Estimate',
    input: {
      estimateText: `Remove shingles 200 SF
Install shingles 200 SF
Replace underlayment 200 SF
Install flashing 40 LF
Paint interior walls 500 SF
Install drywall 300 SF
Replace roofing materials
Install new flooring
Repair ceiling damage`,
      lineItems: [],
      userInput: '',
      metadata: {}
    },
    expectedClassification: 'PROPERTY',
    expectedConfidence: 'HIGH',
    shouldSucceed: true
  },
  {
    name: 'Valid Auto Estimate',
    input: {
      estimateText: `Replace front bumper
Repair fender
Paint door panel
Replace headlight assembly
Align front suspension`,
      lineItems: [],
      userInput: '',
      metadata: {}
    },
    expectedClassification: 'AUTO',
    shouldSucceed: true
  },
  {
    name: 'Ambiguous Estimate (Should Fail)',
    input: {
      estimateText: `Replace item 1
Fix item 2
Install item 3`,
      lineItems: [],
      userInput: '',
      metadata: {}
    },
    expectedClassification: 'UNKNOWN',
    shouldSucceed: false
  },
  {
    name: 'Prohibited Language (Should Fail)',
    input: {
      estimateText: `Remove shingles 200 SF
Install shingles 200 SF`,
      lineItems: [],
      userInput: 'Help me negotiate with the insurance company',
      metadata: {}
    },
    shouldSucceed: false,
    expectedError: 'Prohibited'
  },
  {
    name: 'Property Estimate with Missing Categories',
    input: {
      estimateText: `Remove shingles 200 SF
Install shingles 200 SF
Replace underlayment 200 SF
Install roofing materials
Repair roof damage
Replace siding materials`,
      lineItems: [],
      userInput: '',
      metadata: {}
    },
    expectedClassification: 'PROPERTY',
    shouldSucceed: true,
    expectedMissingCategories: true
  },
  {
    name: 'Estimate with Zero Quantities',
    input: {
      estimateText: `Remove shingles 200 SF
Repair roofing damage
Install new roof materials`,
      lineItems: [
        'Remove shingles 200 SF',
        'Install shingles quantity: 0',
        'Replace underlayment 200 SF',
        'Repair roofing damage',
        'Install new roof materials'
      ],
      userInput: '',
      metadata: {}
    },
    expectedClassification: 'PROPERTY',
    shouldSucceed: true,
    expectedZeroQuantities: true
  }
];

// Run tests
function runParityTests() {
  console.log('═'.repeat(80));
  console.log('ESTIMATE ENGINE PARITY TEST SUITE');
  console.log('Verifying Claim Navigator behavior matches Estimate Review Pro');
  console.log('═'.repeat(80));
  console.log('');

  let passed = 0;
  let failed = 0;
  const results = [];

  TEST_CASES.forEach((testCase, index) => {
    console.log(`Test ${index + 1}: ${testCase.name}`);
    console.log('-'.repeat(80));

    try {
      const result = EstimateEngine.analyzeEstimate(testCase.input);

      // Check if test should succeed or fail
      if (testCase.shouldSucceed && !result.success) {
        console.log(`❌ FAILED: Expected success but got failure`);
        console.log(`   Error: ${result.error}`);
        failed++;
        results.push({ test: testCase.name, status: 'FAILED', reason: 'Expected success' });
      } else if (!testCase.shouldSucceed && result.success) {
        console.log(`❌ FAILED: Expected failure but got success`);
        failed++;
        results.push({ test: testCase.name, status: 'FAILED', reason: 'Expected failure' });
      } else if (result.success) {
        // Verify classification
        if (testCase.expectedClassification && 
            result.classification.classification !== testCase.expectedClassification) {
          console.log(`❌ FAILED: Classification mismatch`);
          console.log(`   Expected: ${testCase.expectedClassification}`);
          console.log(`   Got: ${result.classification.classification}`);
          failed++;
          results.push({ test: testCase.name, status: 'FAILED', reason: 'Classification mismatch' });
        } else if (testCase.expectedConfidence && 
                   result.classification.confidence !== testCase.expectedConfidence) {
          console.log(`❌ FAILED: Confidence mismatch`);
          console.log(`   Expected: ${testCase.expectedConfidence}`);
          console.log(`   Got: ${result.classification.confidence}`);
          failed++;
          results.push({ test: testCase.name, status: 'FAILED', reason: 'Confidence mismatch' });
        } else if (testCase.expectedMissingCategories && 
                   (!result.analysis.missingCategories || result.analysis.missingCategories.length === 0)) {
          console.log(`❌ FAILED: Expected missing categories but none found`);
          failed++;
          results.push({ test: testCase.name, status: 'FAILED', reason: 'Missing categories not detected' });
        } else if (testCase.expectedZeroQuantities && 
                   (!result.analysis.zeroQuantityItems || result.analysis.zeroQuantityItems.length === 0)) {
          console.log(`❌ FAILED: Expected zero quantities but none found`);
          failed++;
          results.push({ test: testCase.name, status: 'FAILED', reason: 'Zero quantities not detected' });
        } else {
          console.log(`✅ PASSED`);
          console.log(`   Classification: ${result.classification.classification} (${result.classification.confidence})`);
          console.log(`   Line Items: ${result.analysis.totalLineItems}`);
          console.log(`   Categories Found: ${result.analysis.includedCategories?.length || 0}`);
          console.log(`   Categories Missing: ${result.analysis.missingCategories?.length || 0}`);
          passed++;
          results.push({ test: testCase.name, status: 'PASSED' });
        }
      } else {
        // Expected failure
        if (testCase.expectedError && !result.error.includes(testCase.expectedError)) {
          console.log(`❌ FAILED: Error message mismatch`);
          console.log(`   Expected: ${testCase.expectedError}`);
          console.log(`   Got: ${result.error}`);
          failed++;
          results.push({ test: testCase.name, status: 'FAILED', reason: 'Error message mismatch' });
        } else {
          console.log(`✅ PASSED (Expected Failure)`);
          console.log(`   Error: ${result.error}`);
          passed++;
          results.push({ test: testCase.name, status: 'PASSED' });
        }
      }

    } catch (error) {
      console.log(`❌ FAILED: Exception thrown`);
      console.log(`   ${error.message}`);
      failed++;
      results.push({ test: testCase.name, status: 'FAILED', reason: error.message });
    }

    console.log('');
  });

  // Summary
  console.log('═'.repeat(80));
  console.log('TEST SUMMARY');
  console.log('═'.repeat(80));
  console.log(`Total Tests: ${TEST_CASES.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log('');

  if (failed === 0) {
    console.log('🎉 ALL TESTS PASSED! Engine behavior matches Estimate Review Pro.');
  } else {
    console.log('⚠️ SOME TESTS FAILED. Review failures above.');
  }

  console.log('═'.repeat(80));

  return {
    total: TEST_CASES.length,
    passed,
    failed,
    results
  };
}

// Export for use in other tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runParityTests };
}

// Run if executed directly
if (require.main === module) {
  const results = runParityTests();
  process.exit(results.failed > 0 ? 1 : 0);
}

