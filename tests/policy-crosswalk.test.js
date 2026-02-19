/**
 * Unit Tests: Policy-to-Estimate Crosswalk Engine
 * Tests policy coverage conflict detection
 */

const {
  analyzePolicyCrosswalk,
  checkReplacementCostCompliance,
  checkLikeKindAndQuality,
  checkOrdinanceAndLaw,
  checkMatchingClause,
  checkDeductibleApplication,
  checkSublimitConflicts
} = require('../netlify/functions/lib/policy-estimate-crosswalk');

/**
 * Test 1: RCV Policy with Material Downgrade
 */
function testRCVPolicyDowngrade() {
  const parsedPolicy = {
    settlement_type: 'Replacement Cost Value (RCV)'
  };
  
  const lineItems = [
    {
      description: 'Standard grade shingles',
      category: 'Roofing',
      total: 5000
    }
  ];
  
  const result = checkReplacementCostCompliance(parsedPolicy, lineItems);
  
  console.assert(result.triggered === true, 'Test 1 Failed: Should detect downgrade');
  console.assert(result.priority === 'high', 'Test 1 Failed: Should be high priority');
  
  console.log('✓ Test 1 Passed: RCV Policy with Material Downgrade');
}

/**
 * Test 2: Ordinance & Law Endorsement Available
 */
function testOrdinanceAndLawEndorsement() {
  const parsedPolicy = {
    ordinance_law_percent: 25,
    dwelling_limit: 400000
  };
  
  const result = checkOrdinanceAndLaw(parsedPolicy, {});
  
  console.assert(result.triggered === true, 'Test 2 Failed: Should detect ordinance coverage');
  console.assert(result.coverage_available === 100000, 'Test 2 Failed: Should calculate 25% of 400k');
  console.assert(result.priority === 'high', 'Test 2 Failed: Should be high priority');
  
  console.log('✓ Test 2 Passed: Ordinance & Law Endorsement Available');
}

/**
 * Test 3: Matching Clause with Partial Replacement
 */
function testMatchingClause() {
  const parsedPolicy = {
    endorsements: {
      matching: true
    }
  };
  
  const lineItems = [
    {
      description: 'Siding - North side only',
      category: 'Siding',
      total: 8000
    }
  ];
  
  const result = checkMatchingClause(parsedPolicy, lineItems);
  
  console.assert(result.triggered === true, 'Test 3 Failed: Should detect matching requirement');
  console.assert(result.priority === 'high', 'Test 3 Failed: Should be high priority');
  
  console.log('✓ Test 3 Passed: Matching Clause with Partial Replacement');
}

/**
 * Test 4: Deductible Application Conflict
 */
function testDeductibleConflict() {
  const parsedPolicy = {
    deductible: 2500
  };
  
  const reconciliation = {
    totals: {
      carrier_total: 2550 // Suspiciously close to deductible
    }
  };
  
  const result = checkDeductibleApplication(parsedPolicy, reconciliation);
  
  console.assert(result.triggered === true, 'Test 4 Failed: Should detect deductible conflict');
  console.assert(result.difference < 500, 'Test 4 Failed: Should be within threshold');
  
  console.log('✓ Test 4 Passed: Deductible Application Conflict');
}

/**
 * Test 5: Sublimit Exceeded
 */
function testSublimitExceeded() {
  const parsedPolicy = {
    sublimits: {
      water: 10000,
      mold: 5000
    }
  };
  
  const reconciliation = {
    categoryBreakdown: {
      Water: {
        contractor_total: 15000
      },
      Mold: {
        contractor_total: 7000
      }
    }
  };
  
  const result = checkSublimitConflicts(parsedPolicy, reconciliation);
  
  console.assert(result.triggered === true, 'Test 5 Failed: Should detect sublimit conflicts');
  console.assert(result.priority === 'critical', 'Test 5 Failed: Should be critical priority');
  console.assert(result.exposureAdjustment < 0, 'Test 5 Failed: Should have negative adjustment');
  
  const totalExcess = (15000 - 10000) + (7000 - 5000);
  console.assert(result.exposureAdjustment === -totalExcess, 'Test 5 Failed: Should calculate correct excess');
  
  console.log('✓ Test 5 Passed: Sublimit Exceeded');
}

/**
 * Test 6: Full Policy Crosswalk Analysis
 */
function testFullPolicyCrosswalk() {
  const parsedPolicy = {
    settlement_type: 'RCV',
    ordinance_law_percent: 25,
    dwelling_limit: 400000,
    deductible: 2500,
    endorsements: {
      matching: true
    }
  };
  
  const lineItems = [
    {
      description: 'Standard shingles',
      category: 'Roofing',
      total: 8000
    },
    {
      description: 'Siding - partial section',
      category: 'Siding',
      total: 6000
    }
  ];
  
  const reconciliation = {
    totals: {
      carrier_total: 2550
    }
  };
  
  const result = analyzePolicyCrosswalk({
    parsedPolicy: parsedPolicy,
    reconciliation: reconciliation,
    exposure: {},
    lineItems: lineItems
  });
  
  console.assert(result.conflictCount > 0, 'Test 6 Failed: Should detect conflicts');
  console.assert(Array.isArray(result.coverageConflicts), 'Test 6 Failed: Should return array');
  
  console.log('✓ Test 6 Passed: Full Policy Crosswalk Analysis');
  console.log(`  - Conflicts detected: ${result.conflictCount}`);
}

/**
 * Test 7: No Policy Data (No Conflicts)
 */
function testNoPolicyData() {
  const result = analyzePolicyCrosswalk({
    parsedPolicy: {},
    reconciliation: {},
    exposure: {},
    lineItems: []
  });
  
  console.assert(result.conflictCount === 0, 'Test 7 Failed: Should have no conflicts');
  console.assert(result.coverageExposureAdjustments === 0, 'Test 7 Failed: Should have no adjustments');
  
  console.log('✓ Test 7 Passed: No Policy Data (No Conflicts)');
}

/**
 * Test 8: Deterministic Output
 */
function testDeterministicOutput() {
  const parsedPolicy = {
    ordinance_law_percent: 25,
    dwelling_limit: 400000
  };
  
  const result1 = analyzePolicyCrosswalk({
    parsedPolicy: parsedPolicy,
    reconciliation: {},
    exposure: {},
    lineItems: []
  });
  
  const result2 = analyzePolicyCrosswalk({
    parsedPolicy: parsedPolicy,
    reconciliation: {},
    exposure: {},
    lineItems: []
  });
  
  console.assert(
    result1.coverageExposureAdjustments === result2.coverageExposureAdjustments,
    'Test 8 Failed: Results should be deterministic'
  );
  console.assert(
    result1.conflictCount === result2.conflictCount,
    'Test 8 Failed: Conflict count should be deterministic'
  );
  
  console.log('✓ Test 8 Passed: Deterministic Output');
}

/**
 * Test 9: ACV Policy (No RCV Downgrade Flag)
 */
function testACVPolicy() {
  const parsedPolicy = {
    settlement_type: 'Actual Cash Value (ACV)'
  };
  
  const lineItems = [
    {
      description: 'Standard grade shingles',
      category: 'Roofing',
      total: 5000
    }
  ];
  
  const result = checkReplacementCostCompliance(parsedPolicy, lineItems);
  
  console.assert(result.triggered === false, 'Test 9 Failed: Should not flag ACV policy');
  
  console.log('✓ Test 9 Passed: ACV Policy (No RCV Downgrade Flag)');
}

/**
 * Test 10: Sublimit Not Exceeded
 */
function testSublimitNotExceeded() {
  const parsedPolicy = {
    sublimits: {
      water: 10000
    }
  };
  
  const reconciliation = {
    categoryBreakdown: {
      Water: {
        contractor_total: 8000 // Below sublimit
      }
    }
  };
  
  const result = checkSublimitConflicts(parsedPolicy, reconciliation);
  
  console.assert(result.triggered === false, 'Test 10 Failed: Should not trigger when below sublimit');
  
  console.log('✓ Test 10 Passed: Sublimit Not Exceeded');
}

// =====================================================
// RUN ALL TESTS
// =====================================================
function runAllTests() {
  console.log('\n========================================');
  console.log('POLICY CROSSWALK ENGINE UNIT TESTS');
  console.log('========================================\n');
  
  try {
    testRCVPolicyDowngrade();
    testOrdinanceAndLawEndorsement();
    testMatchingClause();
    testDeductibleConflict();
    testSublimitExceeded();
    testFullPolicyCrosswalk();
    testNoPolicyData();
    testDeterministicOutput();
    testACVPolicy();
    testSublimitNotExceeded();
    
    console.log('\n========================================');
    console.log('✓ ALL TESTS PASSED');
    console.log('========================================\n');
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests if executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = { runAllTests };
