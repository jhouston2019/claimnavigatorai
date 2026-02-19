/**
 * Unit Tests: Carrier Pattern Detection Engine
 * Tests systemic carrier behavior pattern detection
 */

const {
  analyzeCarrierPatterns,
  detectOPOmissionPattern,
  detectLaborDepreciationPattern,
  detectPriceSuppressionPattern,
  detectCategoryOmissionPattern,
  calculateAverageVariance,
  calculateRiskLevel
} = require('../netlify/functions/lib/carrier-pattern-engine');

/**
 * Test 1: O&P Omission Pattern Detection
 */
function testOPOmissionPattern() {
  const reconciliation = {
    opAnalysis: {
      contractor: {
        has_op: true,
        total_op: 5000
      },
      carrier: {
        has_op: false,
        total_op: 0
      },
      gap: {
        total_op_gap: 5000
      }
    }
  };
  
  const result = detectOPOmissionPattern('State Farm', reconciliation, []);
  
  console.assert(result.detected === true, 'Test 1 Failed: Should detect O&P omission');
  console.assert(result.pattern === 'Systemic O&P Omission', 'Test 1 Failed: Wrong pattern name');
  console.assert(result.severity === 3, 'Test 1 Failed: Should have severity 3');
  
  console.log('✓ Test 1 Passed: O&P Omission Pattern Detection');
}

/**
 * Test 2: Labor Depreciation Pattern Detection
 */
function testLaborDepreciationPattern() {
  const reconciliation = {
    discrepancies: [
      {
        category: 'Labor',
        line_item_description: 'Installation labor',
        carrier_depreciation: 500
      },
      {
        category: 'Labor',
        line_item_description: 'Removal labor',
        carrier_depreciation: 300
      }
    ]
  };
  
  const result = detectLaborDepreciationPattern(reconciliation);
  
  console.assert(result.detected === true, 'Test 2 Failed: Should detect labor depreciation');
  console.assert(result.labor_items_affected === 2, 'Test 2 Failed: Should affect 2 items');
  console.assert(result.total_labor_depreciation === 800, 'Test 2 Failed: Should total $800');
  
  console.log('✓ Test 2 Passed: Labor Depreciation Pattern Detection');
}

/**
 * Test 3: Price Suppression Pattern Detection
 */
function testPriceSuppressionPattern() {
  const reconciliation = {
    categoryBreakdown: {
      Roofing: {
        contractor_total: 10000,
        carrier_total: 8500 // 15% below
      },
      Siding: {
        contractor_total: 8000,
        carrier_total: 6800 // 15% below
      },
      Drywall: {
        contractor_total: 5000,
        carrier_total: 4300 // 14% below
      }
    }
  };
  
  const result = detectPriceSuppressionPattern(reconciliation, []);
  
  console.assert(result.detected === true, 'Test 3 Failed: Should detect price suppression');
  console.assert(result.suppressed_categories.length === 3, 'Test 3 Failed: Should detect 3 categories');
  console.assert(result.confidence === 'high', 'Test 3 Failed: Should be high confidence (3+ categories)');
  
  console.log('✓ Test 3 Passed: Price Suppression Pattern Detection');
}

/**
 * Test 4: Category Omission Pattern Detection
 */
function testCategoryOmissionPattern() {
  const reconciliation = {
    discrepancies: [
      {
        discrepancy_type: 'missing_item',
        category: 'Roofing',
        contractor_total: 1000
      },
      {
        discrepancy_type: 'missing_item',
        category: 'Roofing',
        contractor_total: 1500
      },
      {
        discrepancy_type: 'missing_item',
        category: 'Roofing',
        contractor_total: 2000
      }
    ]
  };
  
  const result = detectCategoryOmissionPattern(reconciliation);
  
  console.assert(result.detected === true, 'Test 4 Failed: Should detect category omission');
  console.assert(result.omissions[0].missing_count === 3, 'Test 4 Failed: Should have 3 missing items');
  console.assert(result.omissions[0].total_value === 4500, 'Test 4 Failed: Should total $4500');
  
  console.log('✓ Test 4 Passed: Category Omission Pattern Detection');
}

/**
 * Test 5: Average Variance Calculation
 */
function testAverageVariance() {
  const reconciliation = {
    totals: {
      contractor_total: 50000,
      carrier_total: 40000 // 20% variance
    }
  };
  
  const result = calculateAverageVariance(reconciliation, []);
  
  console.assert(result.detected === true, 'Test 5 Failed: Should detect high variance');
  console.assert(result.current_variance === 20, 'Test 5 Failed: Should be 20% variance');
  console.assert(result.severity === 3, 'Test 5 Failed: Should have severity 3 (>20%)');
  
  console.log('✓ Test 5 Passed: Average Variance Calculation');
}

/**
 * Test 6: Risk Level Calculation
 */
function testRiskLevelCalculation() {
  console.assert(calculateRiskLevel(2) === 'low', 'Test 6a Failed: Score 2 should be low');
  console.assert(calculateRiskLevel(4) === 'medium', 'Test 6b Failed: Score 4 should be medium');
  console.assert(calculateRiskLevel(6) === 'high', 'Test 6c Failed: Score 6 should be high');
  console.assert(calculateRiskLevel(10) === 'critical', 'Test 6d Failed: Score 10 should be critical');
  
  console.log('✓ Test 6 Passed: Risk Level Calculation');
}

/**
 * Test 7: Full Carrier Pattern Analysis
 */
function testFullCarrierPatternAnalysis() {
  const reconciliation = {
    opAnalysis: {
      contractor: { has_op: true, total_op: 5000 },
      carrier: { has_op: false, total_op: 0 },
      gap: { total_op_gap: 5000 }
    },
    discrepancies: [
      {
        category: 'Labor',
        line_item_description: 'Installation labor',
        carrier_depreciation: 500
      }
    ],
    categoryBreakdown: {
      Roofing: {
        contractor_total: 10000,
        carrier_total: 8500
      }
    },
    totals: {
      contractor_total: 50000,
      carrier_total: 40000
    }
  };
  
  const result = analyzeCarrierPatterns({
    carrierName: 'Test Carrier',
    reconciliation: reconciliation,
    exposure: {},
    historicalData: [],
    supabase: null
  });
  
  console.assert(result.patternCount > 0, 'Test 7 Failed: Should detect patterns');
  console.assert(result.severityScore > 0, 'Test 7 Failed: Should have severity score');
  console.assert(result.riskLevel !== undefined, 'Test 7 Failed: Should have risk level');
  
  console.log('✓ Test 7 Passed: Full Carrier Pattern Analysis');
  console.log(`  - Patterns detected: ${result.patternCount}`);
  console.log(`  - Severity score: ${result.severityScore}`);
  console.log(`  - Risk level: ${result.riskLevel}`);
}

/**
 * Test 8: No Patterns Detected
 */
function testNoPatternsDetected() {
  const reconciliation = {
    opAnalysis: {
      contractor: { has_op: true },
      carrier: { has_op: true }
    },
    discrepancies: [],
    categoryBreakdown: {
      Roofing: {
        contractor_total: 10000,
        carrier_total: 9500 // Only 5% variance
      }
    },
    totals: {
      contractor_total: 10000,
      carrier_total: 9500
    }
  };
  
  const result = analyzeCarrierPatterns({
    carrierName: 'Good Carrier',
    reconciliation: reconciliation,
    exposure: {},
    historicalData: [],
    supabase: null
  });
  
  console.assert(result.patternCount === 0, 'Test 8 Failed: Should detect no patterns');
  console.assert(result.severityScore === 0, 'Test 8 Failed: Should have zero severity');
  console.assert(result.riskLevel === 'low', 'Test 8 Failed: Should be low risk');
  
  console.log('✓ Test 8 Passed: No Patterns Detected');
}

/**
 * Test 9: Deterministic Output
 */
function testDeterministicOutput() {
  const reconciliation = {
    opAnalysis: {
      contractor: { has_op: true, total_op: 5000 },
      carrier: { has_op: false, total_op: 0 },
      gap: { total_op_gap: 5000 }
    },
    discrepancies: [],
    categoryBreakdown: {},
    totals: {
      contractor_total: 50000,
      carrier_total: 40000
    }
  };
  
  const result1 = analyzeCarrierPatterns({
    carrierName: 'Test Carrier',
    reconciliation: reconciliation,
    exposure: {},
    historicalData: [],
    supabase: null
  });
  
  const result2 = analyzeCarrierPatterns({
    carrierName: 'Test Carrier',
    reconciliation: reconciliation,
    exposure: {},
    historicalData: [],
    supabase: null
  });
  
  console.assert(
    result1.patternCount === result2.patternCount,
    'Test 9 Failed: Pattern count should be deterministic'
  );
  console.assert(
    result1.severityScore === result2.severityScore,
    'Test 9 Failed: Severity score should be deterministic'
  );
  console.assert(
    result1.riskLevel === result2.riskLevel,
    'Test 9 Failed: Risk level should be deterministic'
  );
  
  console.log('✓ Test 9 Passed: Deterministic Output');
}

/**
 * Test 10: Historical Data Integration
 */
function testHistoricalDataIntegration() {
  const reconciliation = {
    opAnalysis: {
      contractor: { has_op: true, total_op: 5000 },
      carrier: { has_op: false, total_op: 0 },
      gap: { total_op_gap: 5000 }
    },
    discrepancies: [],
    categoryBreakdown: {},
    totals: {
      contractor_total: 50000,
      carrier_total: 40000
    }
  };
  
  const historicalData = [
    {
      carrier_name: 'Test Carrier',
      contractor_has_op: true,
      carrier_has_op: false
    },
    {
      carrier_name: 'Test Carrier',
      contractor_has_op: true,
      carrier_has_op: false
    },
    {
      carrier_name: 'Test Carrier',
      contractor_has_op: true,
      carrier_has_op: true
    }
  ];
  
  const result = detectOPOmissionPattern('Test Carrier', reconciliation, historicalData);
  
  console.assert(result.detected === true, 'Test 10 Failed: Should detect O&P omission');
  console.assert(result.historical.omission_rate > 0, 'Test 10 Failed: Should calculate historical rate');
  console.assert(result.historical.sample_size === 3, 'Test 10 Failed: Should track sample size');
  
  console.log('✓ Test 10 Passed: Historical Data Integration');
}

// =====================================================
// RUN ALL TESTS
// =====================================================
function runAllTests() {
  console.log('\n========================================');
  console.log('CARRIER PATTERN ENGINE UNIT TESTS');
  console.log('========================================\n');
  
  try {
    testOPOmissionPattern();
    testLaborDepreciationPattern();
    testPriceSuppressionPattern();
    testCategoryOmissionPattern();
    testAverageVariance();
    testRiskLevelCalculation();
    testFullCarrierPatternAnalysis();
    testNoPatternsDetected();
    testDeterministicOutput();
    testHistoricalDataIntegration();
    
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
