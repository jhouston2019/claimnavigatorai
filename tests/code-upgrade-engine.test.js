/**
 * Unit Tests: Code Upgrade Detection Engine
 * Tests deterministic code compliance detection
 */

const {
  analyzeCodeUpgrades,
  checkRoof25PercentRule,
  checkDripEdge,
  checkIceAndWaterShield,
  checkVentilationCompliance,
  checkInsulationRValue
} = require('../netlify/functions/lib/code-upgrade-engine');

/**
 * Test 1: Roof 25% Rule Trigger
 */
function testRoof25PercentRule() {
  const lineItems = [
    {
      category: 'Roofing',
      description: 'Asphalt shingles',
      quantity: 30,
      unit: 'SQ',
      rcv_total: 9000,
      total: 9000
    }
  ];
  
  const propertyMetadata = {
    roof_size: 100 // Total roof is 100 SQ
  };
  
  const result = checkRoof25PercentRule(lineItems, propertyMetadata);
  
  console.assert(result.triggered === true, 'Test 1 Failed: Should trigger 25% rule');
  console.assert(result.calculation.percentage_affected === 30, 'Test 1 Failed: Should be 30% affected');
  console.assert(result.estimatedCostImpact > 0, 'Test 1 Failed: Should have cost impact');
  
  console.log('✓ Test 1 Passed: Roof 25% Rule Trigger');
}

/**
 * Test 2: Missing Drip Edge Detection
 */
function testMissingDripEdge() {
  const lineItems = [
    {
      category: 'Roofing',
      description: 'Asphalt shingles',
      quantity: 25,
      unit: 'SQ',
      total: 7500
    }
    // No drip edge line
  ];
  
  const result = checkDripEdge(lineItems);
  
  console.assert(result.triggered === true, 'Test 2 Failed: Should detect missing drip edge');
  console.assert(result.issue === 'Missing Drip Edge', 'Test 2 Failed: Wrong issue type');
  console.assert(result.estimatedCostImpact > 0, 'Test 2 Failed: Should have cost impact');
  
  console.log('✓ Test 2 Passed: Missing Drip Edge Detection');
}

/**
 * Test 3: Drip Edge Present (No Flag)
 */
function testDripEdgePresent() {
  const lineItems = [
    {
      category: 'Roofing',
      description: 'Asphalt shingles',
      quantity: 25,
      unit: 'SQ',
      total: 7500
    },
    {
      category: 'Roofing',
      description: 'Drip edge',
      quantity: 150,
      unit: 'LF',
      total: 375
    }
  ];
  
  const result = checkDripEdge(lineItems);
  
  console.assert(result.triggered === false, 'Test 3 Failed: Should not trigger when drip edge present');
  
  console.log('✓ Test 3 Passed: Drip Edge Present (No Flag)');
}

/**
 * Test 4: Ice & Water Shield Required (Cold Climate)
 */
function testIceShieldRequired() {
  const lineItems = [
    {
      category: 'Roofing',
      description: 'Asphalt shingles',
      quantity: 25,
      unit: 'SQ',
      total: 7500
    }
    // No ice shield
  ];
  
  const regionalData = {
    climate: 'cold',
    state: 'MN'
  };
  
  const result = checkIceAndWaterShield(lineItems, regionalData);
  
  console.assert(result.triggered === true, 'Test 4 Failed: Should require ice shield in cold climate');
  console.assert(result.priority === 'high', 'Test 4 Failed: Should be high priority');
  console.assert(result.estimatedCostImpact > 0, 'Test 4 Failed: Should have cost impact');
  
  console.log('✓ Test 4 Passed: Ice & Water Shield Required');
}

/**
 * Test 5: Ventilation Imbalance Detection
 */
function testVentilationImbalance() {
  const lineItems = [
    {
      category: 'Roofing',
      description: 'Ridge vent',
      quantity: 50,
      unit: 'LF',
      total: 500
    }
    // No intake vent
  ];
  
  const result = checkVentilationCompliance(lineItems);
  
  console.assert(result.triggered === true, 'Test 5 Failed: Should detect ventilation imbalance');
  console.assert(result.issue === 'Ventilation Imbalance', 'Test 5 Failed: Wrong issue type');
  
  console.log('✓ Test 5 Passed: Ventilation Imbalance Detection');
}

/**
 * Test 6: Insulation R-Value Below Code
 */
function testInsulationRValue() {
  const lineItems = [
    {
      category: 'Insulation',
      description: 'R-30 blown insulation',
      quantity: 1500,
      unit: 'SF',
      total: 2250
    }
  ];
  
  const regionalData = {
    climate: 'cold' // Requires R-49
  };
  
  const result = checkInsulationRValue(lineItems, regionalData);
  
  console.assert(result.triggered === true, 'Test 6 Failed: Should detect R-value below code');
  console.assert(result.calculation.detected_r_value === 30, 'Test 6 Failed: Should detect R-30');
  console.assert(result.calculation.required_r_value === 49, 'Test 6 Failed: Should require R-49');
  
  console.log('✓ Test 6 Passed: Insulation R-Value Below Code');
}

/**
 * Test 7: Full Code Upgrade Analysis
 */
function testFullCodeUpgradeAnalysis() {
  const lineItems = [
    {
      category: 'Roofing',
      description: 'Asphalt shingles',
      quantity: 30,
      unit: 'SQ',
      rcv_total: 9000,
      total: 9000
    },
    {
      category: 'Roofing',
      description: 'Ridge vent',
      quantity: 50,
      unit: 'LF',
      total: 500
    }
  ];
  
  const propertyMetadata = {
    roof_size: 100
  };
  
  const regionalData = {
    climate: 'cold'
  };
  
  const result = analyzeCodeUpgrades({
    lineItems: lineItems,
    reconciliation: {},
    exposure: {},
    propertyMetadata: propertyMetadata,
    regionalData: regionalData
  });
  
  console.assert(result.flagCount > 0, 'Test 7 Failed: Should detect multiple flags');
  console.assert(result.totalCodeUpgradeExposure > 0, 'Test 7 Failed: Should have total exposure');
  console.assert(Array.isArray(result.codeUpgradeFlags), 'Test 7 Failed: Should return array of flags');
  
  console.log('✓ Test 7 Passed: Full Code Upgrade Analysis');
  console.log(`  - Flags detected: ${result.flagCount}`);
  console.log(`  - Total exposure: $${result.totalCodeUpgradeExposure}`);
}

/**
 * Test 8: Deterministic Output
 */
function testDeterministicOutput() {
  const lineItems = [
    {
      category: 'Roofing',
      description: 'Asphalt shingles',
      quantity: 30,
      unit: 'SQ',
      rcv_total: 9000,
      total: 9000
    }
  ];
  
  const propertyMetadata = { roof_size: 100 };
  const regionalData = { climate: 'cold' };
  
  const result1 = analyzeCodeUpgrades({
    lineItems,
    reconciliation: {},
    exposure: {},
    propertyMetadata,
    regionalData
  });
  
  const result2 = analyzeCodeUpgrades({
    lineItems,
    reconciliation: {},
    exposure: {},
    propertyMetadata,
    regionalData
  });
  
  console.assert(
    result1.totalCodeUpgradeExposure === result2.totalCodeUpgradeExposure,
    'Test 8 Failed: Results should be deterministic'
  );
  console.assert(
    result1.flagCount === result2.flagCount,
    'Test 8 Failed: Flag count should be deterministic'
  );
  
  console.log('✓ Test 8 Passed: Deterministic Output');
}

/**
 * Test 9: No Roofing Items (No Flags)
 */
function testNoRoofingItems() {
  const lineItems = [
    {
      category: 'Drywall',
      description: 'Drywall repair',
      quantity: 100,
      unit: 'SF',
      total: 500
    }
  ];
  
  const result = analyzeCodeUpgrades({
    lineItems: lineItems,
    reconciliation: {},
    exposure: {},
    propertyMetadata: {},
    regionalData: {}
  });
  
  console.assert(result.totalCodeUpgradeExposure === 0, 'Test 9 Failed: Should have no exposure');
  console.assert(result.flagCount === 0, 'Test 9 Failed: Should have no flags');
  
  console.log('✓ Test 9 Passed: No Roofing Items (No Flags)');
}

/**
 * Test 10: Roof Below 25% Threshold
 */
function testRoofBelow25Percent() {
  const lineItems = [
    {
      category: 'Roofing',
      description: 'Asphalt shingles',
      quantity: 20,
      unit: 'SQ',
      rcv_total: 6000,
      total: 6000
    }
  ];
  
  const propertyMetadata = {
    roof_size: 100 // 20/100 = 20% (below 25% threshold)
  };
  
  const result = checkRoof25PercentRule(lineItems, propertyMetadata);
  
  console.assert(result.triggered === false, 'Test 10 Failed: Should not trigger below 25%');
  
  console.log('✓ Test 10 Passed: Roof Below 25% Threshold');
}

// =====================================================
// RUN ALL TESTS
// =====================================================
function runAllTests() {
  console.log('\n========================================');
  console.log('CODE UPGRADE ENGINE UNIT TESTS');
  console.log('========================================\n');
  
  try {
    testRoof25PercentRule();
    testMissingDripEdge();
    testDripEdgePresent();
    testIceShieldRequired();
    testVentilationImbalance();
    testInsulationRValue();
    testFullCodeUpgradeAnalysis();
    testDeterministicOutput();
    testNoRoofingItems();
    testRoofBelow25Percent();
    
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
