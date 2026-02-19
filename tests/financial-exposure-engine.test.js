/**
 * Unit Tests for Financial Exposure Engine
 * Tests deterministic calculations for RCV, ACV, Depreciation, and O&P
 */

const {
  calculateExposure,
  calculateRCVACVDeltas,
  calculateOPExposure,
  calculateCategoryExposure,
  calculateTotalProjectedRecovery,
  buildStructuredLineItemDeltas,
  validateFinancialExposure
} = require('../netlify/functions/lib/financial-exposure-engine');

// =====================================================
// TEST 1: RCV / ACV / DEPRECIATION CALCULATIONS
// =====================================================
function testRCVACVDeltas() {
  console.log('\n=== TEST 1: RCV / ACV / Depreciation Calculations ===');
  
  const discrepancies = [
    {
      line_item_description: 'Asphalt shingles',
      category: 'Roofing',
      contractor_total: 8750.00,
      carrier_total: 7700.00,
      discrepancy_type: 'quantity_difference'
    },
    {
      line_item_description: 'Labor - Roofing installation',
      category: 'Labor',
      contractor_total: 3500.00,
      carrier_total: 3000.00,
      discrepancy_type: 'pricing_difference'
    },
    {
      line_item_description: 'Siding materials',
      category: 'Siding',
      contractor_total: 5000.00,
      carrier_total: 4200.00,
      discrepancy_type: 'pricing_difference'
    }
  ];
  
  const result = calculateRCVACVDeltas(discrepancies);
  
  // Expected:
  // Shingles: RCV delta = 1050, ACV delta = 840 (20% depreciation), Depreciation = 210
  // Labor: RCV delta = 500, ACV delta = 500 (0% depreciation), Depreciation = 0
  // Siding: RCV delta = 800, ACV delta = 640 (20% depreciation), Depreciation = 160
  // Totals: RCV = 2350, ACV = 1980, Depreciation = 370
  
  console.log('RCV Delta Total:', result.rcvDeltaTotal);
  console.log('ACV Delta Total:', result.acvDeltaTotal);
  console.log('Recoverable Depreciation:', result.recoverableDepreciationTotal);
  
  const expectedRCV = 2350.00;
  const expectedACV = 1980.00;
  const expectedDep = 370.00;
  
  const pass = Math.abs(result.rcvDeltaTotal - expectedRCV) < 0.01 &&
               Math.abs(result.acvDeltaTotal - expectedACV) < 0.01 &&
               Math.abs(result.recoverableDepreciationTotal - expectedDep) < 0.01;
  
  console.log(pass ? '✅ PASS' : '❌ FAIL');
  
  if (!pass) {
    console.log(`Expected RCV: ${expectedRCV}, Got: ${result.rcvDeltaTotal}`);
    console.log(`Expected ACV: ${expectedACV}, Got: ${result.acvDeltaTotal}`);
    console.log(`Expected Dep: ${expectedDep}, Got: ${result.recoverableDepreciationTotal}`);
  }
  
  return pass;
}

// =====================================================
// TEST 2: O&P TRIGGER LOGIC
// =====================================================
function testOPTriggerLogic() {
  console.log('\n=== TEST 2: O&P Trigger Logic ===');
  
  // Test Case 1: 3+ trades, should qualify
  const contractorItems1 = [
    { category: 'Roofing', description: 'Shingles', total: 5000 },
    { category: 'Siding', description: 'Vinyl siding', total: 3000 },
    { category: 'Electrical', description: 'Wiring', total: 2000 },
    { category: 'Plumbing', description: 'Pipes', total: 1500 }
  ];
  
  const carrierItems1 = [
    { category: 'Roofing', description: 'Shingles', total: 4500 },
    { category: 'Siding', description: 'Vinyl siding', total: 2800 }
  ];
  
  const opAnalysis1 = {
    contractor: { has_op: true, total_op_amount: 2000 },
    carrier: { has_op: false, total_op_amount: 0 }
  };
  
  const result1 = calculateOPExposure(contractorItems1, carrierItems1, opAnalysis1, 11500, 7300);
  
  console.log('Test Case 1: 4 trades detected');
  console.log('Qualifies for O&P:', result1.qualifiesForOP);
  console.log('Trade Count:', result1.tradeCount);
  console.log('O&P Amount:', result1.opAmount);
  
  const pass1 = result1.qualifiesForOP === true && 
                result1.tradeCount === 4 &&
                result1.opAmount > 0;
  
  console.log(pass1 ? '✅ PASS' : '❌ FAIL');
  
  // Test Case 2: 2 trades, should NOT qualify
  const contractorItems2 = [
    { category: 'Roofing', description: 'Shingles', total: 5000 },
    { category: 'Siding', description: 'Vinyl siding', total: 3000 }
  ];
  
  const result2 = calculateOPExposure(contractorItems2, [], {}, 8000, 7000);
  
  console.log('\nTest Case 2: 2 trades detected');
  console.log('Qualifies for O&P:', result2.qualifiesForOP);
  console.log('Trade Count:', result2.tradeCount);
  
  const pass2 = result2.qualifiesForOP === false && result2.tradeCount === 2;
  
  console.log(pass2 ? '✅ PASS' : '❌ FAIL');
  
  return pass1 && pass2;
}

// =====================================================
// TEST 3: CATEGORY AGGREGATION
// =====================================================
function testCategoryAggregation() {
  console.log('\n=== TEST 3: Category Aggregation ===');
  
  const discrepancies = [
    {
      category: 'Roofing',
      line_item_description: 'Shingles',
      contractor_total: 8750.00,
      carrier_total: 7700.00
    },
    {
      category: 'Roofing',
      line_item_description: 'Ridge vent',
      contractor_total: 450.00,
      carrier_total: 0
    },
    {
      category: 'Siding',
      line_item_description: 'Vinyl siding',
      contractor_total: 5000.00,
      carrier_total: 4200.00
    }
  ];
  
  const result = calculateCategoryExposure(discrepancies, {});
  
  console.log('Categories:', result.map(c => c.category));
  console.log('Roofing RCV Delta:', result.find(c => c.category === 'Roofing')?.rcvDelta);
  console.log('Siding RCV Delta:', result.find(c => c.category === 'Siding')?.rcvDelta);
  
  const roofing = result.find(c => c.category === 'Roofing');
  const siding = result.find(c => c.category === 'Siding');
  
  // Roofing: (8750 - 7700) + (450 - 0) = 1500
  // Siding: (5000 - 4200) = 800
  
  const pass = Math.abs(roofing.rcvDelta - 1500.00) < 0.01 &&
               Math.abs(siding.rcvDelta - 800.00) < 0.01 &&
               roofing.discrepancyCount === 2 &&
               siding.discrepancyCount === 1;
  
  console.log(pass ? '✅ PASS' : '❌ FAIL');
  
  if (!pass) {
    console.log('Expected Roofing RCV Delta: 1500.00, Got:', roofing.rcvDelta);
    console.log('Expected Siding RCV Delta: 800.00, Got:', siding.rcvDelta);
  }
  
  return pass;
}

// =====================================================
// TEST 4: TOTAL PROJECTED RECOVERY
// =====================================================
function testTotalProjectedRecovery() {
  console.log('\n=== TEST 4: Total Projected Recovery ===');
  
  const rcvDeltaTotal = 7550.00;
  const opAmount = 2000.00;
  
  const result = calculateTotalProjectedRecovery(rcvDeltaTotal, opAmount);
  
  console.log('RCV Delta:', rcvDeltaTotal);
  console.log('O&P Amount:', opAmount);
  console.log('Total Projected Recovery:', result);
  
  const expected = 9550.00;
  const pass = Math.abs(result - expected) < 0.01;
  
  console.log(pass ? '✅ PASS' : '❌ FAIL');
  
  return pass;
}

// =====================================================
// TEST 5: STRUCTURED LINE ITEM DELTAS
// =====================================================
function testStructuredLineItemDeltas() {
  console.log('\n=== TEST 5: Structured Line Item Deltas ===');
  
  const discrepancies = [
    {
      line_item_description: 'Asphalt shingles',
      category: 'Roofing',
      discrepancy_type: 'quantity_difference',
      carrier_quantity: 22,
      contractor_quantity: 25,
      quantity_delta: 3,
      carrier_unit_price: 350.00,
      contractor_unit_price: 350.00,
      unit_price_delta: 0,
      carrier_total: 7700.00,
      contractor_total: 8750.00,
      match_confidence: 1.00,
      match_method: 'exact',
      notes: 'Quantity mismatch'
    }
  ];
  
  const result = buildStructuredLineItemDeltas(discrepancies);
  
  console.log('Line Items:', result.length);
  console.log('First Item:', result[0]);
  
  const pass = result.length === 1 &&
               result[0].description === 'Asphalt shingles' &&
               result[0].rcvDelta === 1050.00 &&
               result[0].acvDelta === 840.00 &&
               result[0].depreciationDelta === 210.00;
  
  console.log(pass ? '✅ PASS' : '❌ FAIL');
  
  return pass;
}

// =====================================================
// TEST 6: VALIDATION
// =====================================================
function testValidation() {
  console.log('\n=== TEST 6: Financial Exposure Validation ===');
  
  const financialDeltas = {
    rcvDeltaTotal: 2350.00,
    acvDeltaTotal: 1980.00,
    recoverableDepreciationTotal: 370.00
  };
  
  const totals = {
    underpayment_amount: 2350.00
  };
  
  const categoryExposure = [
    { rcvDelta: 1500.00 },
    { rcvDelta: 850.00 }
  ];
  
  const result = validateFinancialExposure(financialDeltas, totals, categoryExposure);
  
  console.log('Valid:', result.valid);
  console.log('Errors:', result.errors);
  console.log('Warnings:', result.warnings);
  
  const pass = result.valid === true && result.errors.length === 0;
  
  console.log(pass ? '✅ PASS' : '❌ FAIL');
  
  return pass;
}

// =====================================================
// TEST 7: DETERMINISM TEST
// =====================================================
function testDeterminism() {
  console.log('\n=== TEST 7: Determinism Test (Same Input = Same Output) ===');
  
  const reconciliation = {
    discrepancies: [
      {
        category: 'Roofing',
        line_item_description: 'Shingles',
        contractor_total: 8750.00,
        carrier_total: 7700.00
      }
    ],
    categoryBreakdown: {},
    opAnalysis: {},
    totals: {
      contractor_total: 8750.00,
      carrier_total: 7700.00,
      underpayment_amount: 1050.00
    }
  };
  
  const contractorItems = [
    { category: 'Roofing', description: 'Shingles', total: 8750 }
  ];
  
  const carrierItems = [
    { category: 'Roofing', description: 'Shingles', total: 7700 }
  ];
  
  // Run calculation 3 times
  const result1 = calculateExposure(reconciliation, contractorItems, carrierItems);
  const result2 = calculateExposure(reconciliation, contractorItems, carrierItems);
  const result3 = calculateExposure(reconciliation, contractorItems, carrierItems);
  
  console.log('Run 1 Total:', result1.totalProjectedRecovery);
  console.log('Run 2 Total:', result2.totalProjectedRecovery);
  console.log('Run 3 Total:', result3.totalProjectedRecovery);
  
  const pass = result1.totalProjectedRecovery === result2.totalProjectedRecovery &&
               result2.totalProjectedRecovery === result3.totalProjectedRecovery &&
               result1.rcvDeltaTotal === result2.rcvDeltaTotal &&
               result1.acvDeltaTotal === result2.acvDeltaTotal;
  
  console.log(pass ? '✅ PASS - Deterministic' : '❌ FAIL - Non-deterministic');
  
  return pass;
}

// =====================================================
// TEST 8: O&P CALCULATION WITH 3+ TRADES
// =====================================================
function testOPCalculationWithMultipleTrades() {
  console.log('\n=== TEST 8: O&P Calculation with 3+ Trades ===');
  
  const contractorItems = [
    { category: 'Roofing', description: 'Shingles', total: 10000, is_total: false },
    { category: 'Siding', description: 'Vinyl', total: 8000, is_total: false },
    { category: 'Electrical', description: 'Wiring', total: 5000, is_total: false },
    { category: 'Plumbing', description: 'Pipes', total: 3000, is_total: false }
  ];
  
  const carrierItems = [
    { category: 'Roofing', description: 'Shingles', total: 9000 }
  ];
  
  const opAnalysis = {
    contractor: { has_op: true, total_op_amount: 5200, combined_percent: 20 },
    carrier: { has_op: false, total_op_amount: 0 }
  };
  
  const result = calculateOPExposure(contractorItems, carrierItems, opAnalysis, 26000, 9000);
  
  console.log('Qualifies for O&P:', result.qualifiesForOP);
  console.log('Trades Detected:', result.tradesDetected);
  console.log('Trade Count:', result.tradeCount);
  console.log('O&P Amount:', result.opAmount);
  
  // Should qualify (4 trades) and calculate 20% of subtotal
  // Subtotal = 26000, O&P = 5200 (20%)
  
  const pass = result.qualifiesForOP === true &&
               result.tradeCount === 4 &&
               result.opAmount === 5200.00;
  
  console.log(pass ? '✅ PASS' : '❌ FAIL');
  
  return pass;
}

// =====================================================
// TEST 9: CATEGORY EXPOSURE SORTING
// =====================================================
function testCategoryExposureSorting() {
  console.log('\n=== TEST 9: Category Exposure Sorting ===');
  
  const discrepancies = [
    {
      category: 'Siding',
      line_item_description: 'Siding',
      contractor_total: 5000.00,
      carrier_total: 4200.00
    },
    {
      category: 'Roofing',
      line_item_description: 'Shingles',
      contractor_total: 8750.00,
      carrier_total: 7700.00
    },
    {
      category: 'Electrical',
      line_item_description: 'Wiring',
      contractor_total: 2000.00,
      carrier_total: 1800.00
    }
  ];
  
  const result = calculateCategoryExposure(discrepancies, {});
  
  console.log('Category Order:', result.map(c => `${c.category}: $${c.rcvDelta}`));
  
  // Should be sorted by RCV delta descending: Roofing (1050) > Siding (800) > Electrical (200)
  const pass = result[0].category === 'Roofing' &&
               result[1].category === 'Siding' &&
               result[2].category === 'Electrical' &&
               result[0].rcvDelta > result[1].rcvDelta &&
               result[1].rcvDelta > result[2].rcvDelta;
  
  console.log(pass ? '✅ PASS' : '❌ FAIL');
  
  return pass;
}

// =====================================================
// TEST 10: VALIDATION - CATEGORY SUM MATCHES TOTAL
// =====================================================
function testValidationCategorySum() {
  console.log('\n=== TEST 10: Validation - Category Sum Matches Total ===');
  
  const financialDeltas = {
    rcvDeltaTotal: 2550.00,
    acvDeltaTotal: 2040.00,
    recoverableDepreciationTotal: 510.00
  };
  
  const totals = {
    underpayment_amount: 2550.00
  };
  
  const categoryExposure = [
    { rcvDelta: 1050.00 },
    { rcvDelta: 800.00 },
    { rcvDelta: 700.00 }
  ];
  
  const result = validateFinancialExposure(financialDeltas, totals, categoryExposure);
  
  console.log('Valid:', result.valid);
  console.log('Errors:', result.errors);
  
  const pass = result.valid === true;
  
  console.log(pass ? '✅ PASS' : '❌ FAIL');
  
  return pass;
}

// =====================================================
// RUN ALL TESTS
// =====================================================
function runAllTests() {
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║   FINANCIAL EXPOSURE ENGINE - UNIT TEST SUITE        ║');
  console.log('╚═══════════════════════════════════════════════════════╝');
  
  const results = {
    test1: testRCVACVDeltas(),
    test2: testOPTriggerLogic(),
    test3: testCategoryAggregation(),
    test4: testTotalProjectedRecovery(),
    test5: testStructuredLineItemDeltas(),
    test6: testValidation(),
    test7: testDeterminism(),
    test8: testOPCalculationWithMultipleTrades(),
    test9: testCategoryExposureSorting(),
    test10: testValidationCategorySum()
  };
  
  const passed = Object.values(results).filter(r => r).length;
  const total = Object.values(results).length;
  
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log(`║   TEST RESULTS: ${passed}/${total} PASSED                           ║`);
  console.log('╚═══════════════════════════════════════════════════════╝');
  
  if (passed === total) {
    console.log('✅ ALL TESTS PASSED - Financial Exposure Engine is deterministic and accurate');
  } else {
    console.log('❌ SOME TESTS FAILED - Review failures above');
  }
  
  return passed === total;
}

// Run tests if executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  runAllTests,
  testRCVACVDeltas,
  testOPTriggerLogic,
  testCategoryAggregation,
  testTotalProjectedRecovery,
  testDeterminism
};
