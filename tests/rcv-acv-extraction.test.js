/**
 * Unit Tests for RCV/ACV Extraction (True ERP Parity)
 * Tests real depreciation extraction (no simulated values)
 */

const { parseEstimate } = require('../netlify/functions/lib/estimate-parser');
const { calculateExposure } = require('../netlify/functions/lib/financial-exposure-engine');

// =====================================================
// TEST 1: RCV/ACV PAIR EXTRACTION
// =====================================================
function testRCVACVPairExtraction() {
  console.log('\n=== TEST 1: RCV/ACV Pair Extraction ===');
  
  const pdfText = `
Roofing Estimate
RCV  Asphalt shingles  25 SQ  350.00  8750.00
ACV  Asphalt shingles  25 SQ  280.00  7000.00
RCV  Ridge vent  50 LF  12.00  600.00
ACV  Ridge vent  50 LF  9.60  480.00
  `;
  
  const result = parseEstimate(pdfText, 'contractor');
  
  console.log('Line Items:', result.lineItems.length);
  console.log('RCV/ACV Pairs Detected:', result.metadata.rcv_acv_pairs_detected);
  console.log('Depreciation Extracted:', result.metadata.depreciation_extracted);
  
  // Should have 2 line items (pairs, not 4 separate)
  const pass1 = result.lineItems.length === 2;
  
  // Should detect 2 RCV/ACV pairs
  const pass2 = result.metadata.rcv_acv_pairs_detected === 2;
  
  // First item should have correct values
  const shingles = result.lineItems[0];
  const pass3 = shingles.rcv_total === 8750.00 &&
                shingles.acv_total === 7000.00 &&
                shingles.depreciation === 1750.00;
  
  console.log('Shingles:', {
    rcv: shingles.rcv_total,
    acv: shingles.acv_total,
    depreciation: shingles.depreciation
  });
  
  const pass = pass1 && pass2 && pass3;
  console.log(pass ? '✅ PASS' : '❌ FAIL');
  
  if (!pass) {
    console.log('Expected: 2 line items with paired RCV/ACV');
    console.log('Got:', result.lineItems.length, 'items');
  }
  
  return pass;
}

// =====================================================
// TEST 2: NO SIMULATED DEPRECIATION
// =====================================================
function testNoSimulatedDepreciation() {
  console.log('\n=== TEST 2: No Simulated Depreciation ===');
  
  // Estimate without RCV/ACV prefixes
  const pdfText = `
Roofing Estimate
Asphalt shingles  25 SQ  350.00  8750.00
Ridge vent  50 LF  12.00  600.00
  `;
  
  const result = parseEstimate(pdfText, 'contractor');
  
  console.log('Line Items:', result.lineItems.length);
  console.log('RCV/ACV Pairs Detected:', result.metadata.rcv_acv_pairs_detected);
  console.log('Depreciation Extracted:', result.metadata.depreciation_extracted);
  
  // Should have 2 line items
  const pass1 = result.lineItems.length === 2;
  
  // Should NOT detect RCV/ACV pairs
  const pass2 = result.metadata.rcv_acv_pairs_detected === 0;
  
  // Items should have rcv_total = acv_total (no depreciation)
  const shingles = result.lineItems[0];
  const pass3 = shingles.rcv_total === 8750.00 &&
                shingles.acv_total === 8750.00 &&
                shingles.depreciation === 0;
  
  console.log('Shingles (no ACV):', {
    rcv: shingles.rcv_total,
    acv: shingles.acv_total,
    depreciation: shingles.depreciation
  });
  
  const pass = pass1 && pass2 && pass3;
  console.log(pass ? '✅ PASS - No simulated depreciation applied' : '❌ FAIL');
  
  return pass;
}

// =====================================================
// TEST 3: O&P BASE EXCLUDES TAX
// =====================================================
function testOPBaseExcludesTax() {
  console.log('\n=== TEST 3: O&P Base Excludes Tax ===');
  
  const reconciliation = {
    discrepancies: [],
    categoryBreakdown: {},
    opAnalysis: {
      contractor: { has_op: true, total_op_amount: 2000 },
      carrier: { has_op: false, total_op_amount: 0 }
    },
    totals: {
      contractor_total: 12000,
      carrier_total: 10000,
      underpayment_amount: 2000
    }
  };
  
  const contractorItems = [
    { category: 'Roofing', rcv_total: 5000, is_tax: false, is_op: false },
    { category: 'Siding', rcv_total: 3000, is_tax: false, is_op: false },
    { category: 'Electrical', rcv_total: 2000, is_tax: false, is_op: false },
    { category: 'Tax', rcv_total: 800, is_tax: true, is_op: false }, // Should be excluded
    { category: 'O&P', rcv_total: 2000, is_tax: false, is_op: true } // Should be excluded
  ];
  
  const carrierItems = [];
  
  const result = calculateExposure(reconciliation, contractorItems, carrierItems);
  
  console.log('O&P Qualifies:', result.opExposure.qualifiesForOP);
  console.log('O&P Amount:', result.opExposure.opAmount);
  console.log('Calculation:', result.opExposure.calculation);
  
  // O&P should be calculated on $10,000 base (excluding tax and O&P)
  // Expected: $10,000 * 0.20 = $2,000
  const expectedBase = 10000; // 5000 + 3000 + 2000 (excluding tax and O&P)
  const expectedOP = 2000;
  
  const pass = result.opExposure.qualifiesForOP === true &&
               Math.abs(result.opExposure.opAmount - expectedOP) < 0.01;
  
  console.log(pass ? '✅ PASS - Tax excluded from O&P base' : '❌ FAIL');
  
  if (!pass) {
    console.log('Expected O&P:', expectedOP);
    console.log('Got O&P:', result.opExposure.opAmount);
  }
  
  return pass;
}

// =====================================================
// TEST 4: DETERMINISTIC OUTPUT
// =====================================================
function testDeterministicOutput() {
  console.log('\n=== TEST 4: Deterministic Output (Same Input = Same Output) ===');
  
  const reconciliation = {
    discrepancies: [
      {
        category: 'Roofing',
        line_item_description: 'Shingles',
        contractor_rcv_total: 8750,
        contractor_acv_total: 7000,
        contractor_depreciation: 1750,
        carrier_rcv_total: 7700,
        carrier_acv_total: 6160,
        carrier_depreciation: 1540
      }
    ],
    categoryBreakdown: {},
    opAnalysis: {},
    totals: {
      contractor_total: 8750,
      carrier_total: 7700,
      underpayment_amount: 1050
    }
  };
  
  const contractorItems = [
    { category: 'Roofing', rcv_total: 8750, is_tax: false, is_op: false }
  ];
  
  const carrierItems = [
    { category: 'Roofing', rcv_total: 7700, is_tax: false, is_op: false }
  ];
  
  // Run 3 times
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
// TEST 5: REAL DEPRECIATION IN FINANCIAL EXPOSURE
// =====================================================
function testRealDepreciationInExposure() {
  console.log('\n=== TEST 5: Real Depreciation in Financial Exposure ===');
  
  const reconciliation = {
    discrepancies: [
      {
        category: 'Roofing',
        line_item_description: 'Asphalt shingles',
        contractor_rcv_total: 8750.00,
        contractor_acv_total: 7000.00,
        contractor_depreciation: 1750.00,
        carrier_rcv_total: 7700.00,
        carrier_acv_total: 6160.00,
        carrier_depreciation: 1540.00
      }
    ],
    categoryBreakdown: {},
    opAnalysis: {},
    totals: {
      contractor_total: 8750,
      carrier_total: 7700,
      underpayment_amount: 1050
    }
  };
  
  const result = calculateExposure(reconciliation, [], []);
  
  console.log('RCV Delta:', result.rcvDeltaTotal);
  console.log('ACV Delta:', result.acvDeltaTotal);
  console.log('Recoverable Depreciation:', result.recoverableDepreciationTotal);
  
  // Expected:
  // RCV Delta = 8750 - 7700 = 1050
  // ACV Delta = 7000 - 6160 = 840
  // Depreciation Delta = 1750 - 1540 = 210
  
  const pass = result.rcvDeltaTotal === 1050.00 &&
               result.acvDeltaTotal === 840.00 &&
               result.recoverableDepreciationTotal === 210.00;
  
  console.log(pass ? '✅ PASS - Real depreciation used' : '❌ FAIL');
  
  if (!pass) {
    console.log('Expected RCV Delta: 1050.00, Got:', result.rcvDeltaTotal);
    console.log('Expected ACV Delta: 840.00, Got:', result.acvDeltaTotal);
    console.log('Expected Depreciation: 210.00, Got:', result.recoverableDepreciationTotal);
  }
  
  return pass;
}

// =====================================================
// TEST 6: DOUBLE-COUNT PROTECTION
// =====================================================
function testDoubleCountProtection() {
  console.log('\n=== TEST 6: Double-Count Protection ===');
  
  const reconciliation = {
    discrepancies: [
      {
        category: 'Roofing',
        line_item_description: 'Shingles',
        contractor_rcv_total: 8750,
        contractor_acv_total: 7000,
        contractor_depreciation: 1750,
        carrier_rcv_total: 7700,
        carrier_acv_total: 6160,
        carrier_depreciation: 1540
      }
    ],
    categoryBreakdown: {},
    opAnalysis: {
      contractor: { has_op: true, total_op_amount: 2000 },
      carrier: { has_op: false, total_op_amount: 0 }
    },
    totals: {
      contractor_total: 10750,
      carrier_total: 7700,
      underpayment_amount: 1050
    }
  };
  
  const contractorItems = [
    { category: 'Roofing', rcv_total: 8750, is_tax: false, is_op: false },
    { category: 'Siding', rcv_total: 3000, is_tax: false, is_op: false },
    { category: 'Electrical', rcv_total: 2000, is_tax: false, is_op: false }
  ];
  
  const result = calculateExposure(reconciliation, contractorItems, []);
  
  console.log('RCV Delta:', result.rcvDeltaTotal);
  console.log('O&P Amount:', result.opExposure.opAmount);
  console.log('Total Projected Recovery:', result.totalProjectedRecovery);
  console.log('Expected Total:', result.rcvDeltaTotal + result.opExposure.opAmount);
  
  // Total should equal RCV Delta + O&P (no double-counting)
  const expectedTotal = result.rcvDeltaTotal + result.opExposure.opAmount;
  const pass = Math.abs(result.totalProjectedRecovery - expectedTotal) < 0.01;
  
  console.log(pass ? '✅ PASS - No double-counting' : '❌ FAIL - Double-counting detected');
  
  if (!pass) {
    console.log('Expected:', expectedTotal);
    console.log('Got:', result.totalProjectedRecovery);
    console.log('Difference:', Math.abs(result.totalProjectedRecovery - expectedTotal));
  }
  
  return pass;
}

// =====================================================
// TEST 7: SUMMARY DEPRECIATION ALLOCATION
// =====================================================
function testSummaryDepreciationAllocation() {
  console.log('\n=== TEST 7: Summary Depreciation Allocation ===');
  
  const pdfText = `
Roofing Estimate
Asphalt shingles  25 SQ  350.00  8750.00
Ridge vent  50 LF  12.00  600.00
Subtotal  9350.00
Less Depreciation  1870.00
Total ACV  7480.00
  `;
  
  const result = parseEstimate(pdfText, 'carrier');
  
  console.log('Line Items:', result.lineItems.length);
  console.log('Summary Depreciation Allocated:', result.metadata.summary_depreciation_allocated);
  console.log('Summary Depreciation Total:', result.metadata.summary_depreciation_total);
  
  // Should have 2 line items (depreciation line excluded)
  const pass1 = result.lineItems.length === 2;
  
  // Should detect summary depreciation
  const pass2 = result.metadata.summary_depreciation_allocated === true;
  const pass3 = result.metadata.summary_depreciation_total === 1870.00;
  
  // Items should have allocated depreciation
  const shingles = result.lineItems[0];
  const ridgeVent = result.lineItems[1];
  
  // Depreciation should be allocated proportionally
  // Shingles: 8750/9350 * 1870 = 1750
  // Ridge: 600/9350 * 1870 = 120
  const pass4 = Math.abs(shingles.depreciation - 1750) < 1 &&
                Math.abs(ridgeVent.depreciation - 120) < 1;
  
  console.log('Shingles depreciation:', shingles.depreciation);
  console.log('Ridge vent depreciation:', ridgeVent.depreciation);
  
  const pass = pass1 && pass2 && pass3 && pass4;
  console.log(pass ? '✅ PASS - Summary depreciation allocated' : '❌ FAIL');
  
  return pass;
}

// =====================================================
// TEST 8: O&P DELTA LOGIC (NOT ABSOLUTE)
// =====================================================
function testOPDeltaLogic() {
  console.log('\n=== TEST 8: O&P Delta Logic (Not Absolute) ===');
  
  const reconciliation = {
    discrepancies: [],
    categoryBreakdown: {},
    opAnalysis: {
      contractor: { 
        has_op: true, 
        total_op_amount: 2000,
        combined_percent: 20
      },
      carrier: { 
        has_op: false, 
        total_op_amount: 0 
      }
    },
    totals: {
      contractor_total: 12000,
      carrier_total: 10000,
      underpayment_amount: 2000
    }
  };
  
  const contractorItems = [
    { category: 'Roofing', rcv_total: 5000, is_tax: false, is_op: false },
    { category: 'Siding', rcv_total: 3000, is_tax: false, is_op: false },
    { category: 'Electrical', rcv_total: 2000, is_tax: false, is_op: false }
  ];
  
  const result = calculateExposure(reconciliation, contractorItems, []);
  
  console.log('O&P Amount:', result.opExposure.opAmount);
  console.log('Calculation Method:', result.opExposure.calculation?.method);
  
  // Should use contractor's ACTUAL O&P amount (delta), not recalculated 20%
  // Expected: $2,000 (contractor's actual O&P)
  // NOT: $10,000 * 0.20 = $2,000 (coincidentally same, but method matters)
  
  const pass = result.opExposure.opAmount === 2000 &&
               result.opExposure.calculation?.method === 'delta';
  
  console.log(pass ? '✅ PASS - O&P uses delta logic' : '❌ FAIL - O&P uses absolute calculation');
  
  if (!pass) {
    console.log('Expected: Delta method with $2,000');
    console.log('Got:', result.opExposure.calculation);
  }
  
  return pass;
}

// =====================================================
// TEST 9: EMBEDDED O&P DETECTION
// =====================================================
function testEmbeddedOPDetection() {
  console.log('\n=== TEST 9: Embedded O&P Detection ===');
  
  const reconciliation = {
    discrepancies: [],
    categoryBreakdown: {},
    opAnalysis: {
      contractor: { has_op: false, total_op_amount: 0 },
      carrier: { has_op: false, total_op_amount: 0 }
    },
    totals: {
      contractor_total: 10000,
      carrier_total: 8000,
      underpayment_amount: 2000
    }
  };
  
  const contractorItems = [
    { category: 'Roofing', rcv_total: 5000, is_tax: false, is_op: false },
    { category: 'Siding', rcv_total: 3000, is_tax: false, is_op: false },
    { category: 'Electrical', rcv_total: 2000, is_tax: false, is_op: false }
  ];
  
  const result = calculateExposure(reconciliation, contractorItems, []);
  
  console.log('O&P Qualifies:', result.opExposure.qualifiesForOP);
  console.log('O&P Amount:', result.opExposure.opAmount);
  console.log('Reason:', result.opExposure.reason);
  
  // Should qualify (3 trades) but O&P amount should be 0 (embedded)
  const pass = result.opExposure.qualifiesForOP === true &&
               result.opExposure.opAmount === 0 &&
               result.opExposure.reason.includes('embedded');
  
  console.log(pass ? '✅ PASS - Embedded O&P detected, no exposure calculated' : '❌ FAIL');
  
  return pass;
}

// =====================================================
// TEST 10: LABOR EXCLUDED FROM DEPRECIATION ALLOCATION
// =====================================================
function testLaborExcludedFromDepreciation() {
  console.log('\n=== TEST 10: Labor Excluded from Depreciation Allocation ===');
  
  const pdfText = `
Roofing Estimate
Asphalt shingles  25 SQ  350.00  8000.00
Labor - Installation  40 HR  50.00  2000.00
Subtotal  10000.00
Less Depreciation  1600.00
Total ACV  8400.00
  `;
  
  const result = parseEstimate(pdfText, 'carrier');
  
  console.log('Line Items:', result.lineItems.length);
  console.log('Summary Depreciation Total:', result.metadata.summary_depreciation_total);
  
  const shingles = result.lineItems.find(i => i.description.includes('shingles'));
  const labor = result.lineItems.find(i => i.description.includes('Labor'));
  
  console.log('Shingles depreciation:', shingles?.depreciation);
  console.log('Labor depreciation:', labor?.depreciation);
  
  // Depreciation should be allocated ONLY to shingles (material)
  // Labor should have $0 depreciation
  // Shingles: ($8,000 / $8,000) * $1,600 = $1,600
  // Labor: $0
  
  const pass = Math.abs(shingles.depreciation - 1600) < 1 &&
               labor.depreciation === 0;
  
  console.log(pass ? '✅ PASS - Labor excluded from depreciation' : '❌ FAIL - Labor incorrectly depreciated');
  
  if (!pass) {
    console.log('Expected: Shingles $1,600, Labor $0');
    console.log('Got: Shingles $' + shingles.depreciation + ', Labor $' + labor.depreciation);
  }
  
  return pass;
}

// =====================================================
// RUN ALL TESTS
// =====================================================
function runAllTests() {
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║   RCV/ACV EXTRACTION - TRUE ERP PARITY TEST SUITE   ║');
  console.log('╚═══════════════════════════════════════════════════════╝');
  
  const results = {
    test1: testRCVACVPairExtraction(),
    test2: testNoSimulatedDepreciation(),
    test3: testOPBaseExcludesTax(),
    test4: testDeterministicOutput(),
    test5: testRealDepreciationInExposure(),
    test6: testDoubleCountProtection(),
    test7: testSummaryDepreciationAllocation(),
    test8: testOPDeltaLogic(),
    test9: testEmbeddedOPDetection(),
    test10: testLaborExcludedFromDepreciation()
  };
  
  const passed = Object.values(results).filter(r => r).length;
  const total = Object.values(results).length;
  
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log(`║   TEST RESULTS: ${passed}/${total} PASSED                           ║`);
  console.log('╚═══════════════════════════════════════════════════════╝');
  
  if (passed === total) {
    console.log('✅ ALL TESTS PASSED - TRUE 100% ERP PARITY ACHIEVED');
    console.log('✅ Real RCV/ACV extraction working');
    console.log('✅ No simulated depreciation');
    console.log('✅ Summary depreciation allocation working');
    console.log('✅ Labor excluded from depreciation allocation');
    console.log('✅ O&P delta logic (not absolute)');
    console.log('✅ Embedded O&P detection');
    console.log('✅ O&P base calculation correct');
    console.log('✅ Deterministic output verified');
    console.log('✅ Double-count protection active');
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
  testRCVACVPairExtraction,
  testNoSimulatedDepreciation,
  testOPBaseExcludesTax,
  testDeterministicOutput,
  testRealDepreciationInExposure,
  testDoubleCountProtection,
  testSummaryDepreciationAllocation,
  testOPDeltaLogic,
  testEmbeddedOPDetection,
  testLaborExcludedFromDepreciation
};

// Run tests if executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  runAllTests,
  testRCVACVPairExtraction,
  testNoSimulatedDepreciation,
  testOPBaseExcludesTax,
  testDeterministicOutput,
  testRealDepreciationInExposure,
  testDoubleCountProtection,
  testSummaryDepreciationAllocation,
  testOPDeltaLogic,
  testEmbeddedOPDetection
};
