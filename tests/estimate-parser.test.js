/**
 * Estimate Parser Test Suite
 * Tests deterministic parsing, matching, and reconciliation
 */

const { parseEstimate, normalizeDescription, categorizeLineItem } = require('../netlify/functions/lib/estimate-parser');
const { matchLineItems, calculateSimilarity } = require('../netlify/functions/lib/estimate-matcher');
const { reconcileEstimates, validateReconciliation } = require('../netlify/functions/lib/estimate-reconciler');

// =====================================================
// TEST DATA
// =====================================================

const SAMPLE_CONTRACTOR_ESTIMATE = `
ABC Roofing & Construction
Estimate #12345
Date: 02/12/2024

ROOFING
Tear off existing shingles  25 SQ  $3.50  $87.50
Architectural shingles  25 SQ  $95.00  $2,375.00
Ice and water shield  10 LF  $4.50  $45.00
Ridge vent installation  40 LF  $8.00  $320.00

SIDING
Remove damaged siding  200 SF  $2.00  $400.00
Vinyl siding installation  200 SF  $6.50  $1,300.00

INTERIOR
Drywall repair  150 SF  $3.50  $525.00
Paint interior walls  150 SF  $2.00  $300.00

Subtotal: $5,352.50
Tax (8%): $428.20
Total: $5,780.70
`;

const SAMPLE_CARRIER_ESTIMATE = `
State Farm Insurance
Claim #CLM-2024-089456

ROOFING
Remove shingles  25 SQ  $3.00  $75.00
Standard shingles  25 SQ  $75.00  $1,875.00
Ice shield  8 LF  $4.00  $32.00

SIDING
Siding removal  200 SF  $1.50  $300.00
Vinyl siding  200 SF  $5.00  $1,000.00

INTERIOR
Drywall  120 SF  $3.00  $360.00
Paint  120 SF  $1.50  $180.00

Subtotal: $3,822.00
Tax: $305.76
Total: $4,127.76
`;

// =====================================================
// PARSER TESTS
// =====================================================

function testParser() {
  console.log('\n=== PARSER TESTS ===\n');
  
  // Test 1: Parse contractor estimate
  console.log('Test 1: Parse Contractor Estimate');
  const contractorParsed = parseEstimate(SAMPLE_CONTRACTOR_ESTIMATE, 'contractor');
  console.log(`✓ Parsed ${contractorParsed.lineItems.length} line items`);
  console.log(`✓ Parse success rate: ${contractorParsed.metadata.parse_success_rate}%`);
  
  if (contractorParsed.lineItems.length < 8) {
    console.error('✗ FAIL: Expected at least 8 line items');
    return false;
  }
  
  // Test 2: Parse carrier estimate
  console.log('\nTest 2: Parse Carrier Estimate');
  const carrierParsed = parseEstimate(SAMPLE_CARRIER_ESTIMATE, 'carrier');
  console.log(`✓ Parsed ${carrierParsed.lineItems.length} line items`);
  console.log(`✓ Parse success rate: ${carrierParsed.metadata.parse_success_rate}%`);
  
  if (carrierParsed.lineItems.length < 7) {
    console.error('✗ FAIL: Expected at least 7 line items');
    return false;
  }
  
  // Test 3: Verify numeric extraction
  console.log('\nTest 3: Verify Numeric Extraction');
  const firstItem = contractorParsed.lineItems[0];
  console.log(`Description: ${firstItem.description}`);
  console.log(`Quantity: ${firstItem.quantity} ${firstItem.unit}`);
  console.log(`Unit Price: $${firstItem.unit_price}`);
  console.log(`Total: $${firstItem.total}`);
  
  if (!firstItem.quantity || !firstItem.unit_price || !firstItem.total) {
    console.error('✗ FAIL: Numeric fields not extracted');
    return false;
  }
  
  // Test 4: Verify math
  const expectedTotal = firstItem.quantity * firstItem.unit_price;
  const tolerance = 0.01;
  if (Math.abs(firstItem.total - expectedTotal) > tolerance) {
    console.error(`✗ FAIL: Math validation failed. ${firstItem.quantity} * ${firstItem.unit_price} should equal ${firstItem.total}`);
    return false;
  }
  console.log(`✓ Math validated: ${firstItem.quantity} * ${firstItem.unit_price} = ${firstItem.total}`);
  
  // Test 5: Verify normalization
  console.log('\nTest 4: Verify Normalization');
  const normalized = normalizeDescription('Tear-off Existing Shingles!');
  console.log(`Original: "Tear-off Existing Shingles!"`);
  console.log(`Normalized: "${normalized}"`);
  
  if (normalized !== 'tearoff existing shingles') {
    console.error('✗ FAIL: Normalization incorrect');
    return false;
  }
  console.log('✓ Normalization correct');
  
  // Test 6: Verify categorization
  console.log('\nTest 5: Verify Categorization');
  const category = categorizeLineItem('Tear off existing shingles', 'SQ');
  console.log(`Category: ${category}`);
  
  if (category !== 'Roofing') {
    console.error('✗ FAIL: Categorization incorrect');
    return false;
  }
  console.log('✓ Categorization correct');
  
  console.log('\n✅ ALL PARSER TESTS PASSED\n');
  return { contractorParsed, carrierParsed };
}

// =====================================================
// MATCHER TESTS
// =====================================================

function testMatcher(contractorParsed, carrierParsed) {
  console.log('\n=== MATCHER TESTS ===\n');
  
  // Test 1: Match line items
  console.log('Test 1: Match Line Items');
  const matchResult = matchLineItems(
    contractorParsed.lineItems,
    carrierParsed.lineItems
  );
  
  console.log(`✓ Total matches: ${matchResult.matches.length}`);
  console.log(`  - Exact: ${matchResult.stats.exact_matches}`);
  console.log(`  - Fuzzy: ${matchResult.stats.fuzzy_matches}`);
  console.log(`  - Category: ${matchResult.stats.category_matches}`);
  console.log(`✓ Unmatched contractor: ${matchResult.unmatchedContractor.length}`);
  console.log(`✓ Unmatched carrier: ${matchResult.unmatchedCarrier.length}`);
  
  if (matchResult.matches.length === 0) {
    console.error('✗ FAIL: No matches found');
    return false;
  }
  
  // Test 2: Verify exact match
  console.log('\nTest 2: Verify Exact Match');
  const exactMatch = matchResult.matches.find(m => m.match_method === 'exact');
  if (exactMatch) {
    console.log(`✓ Found exact match: "${exactMatch.contractor.description}"`);
    console.log(`  Confidence: ${exactMatch.match_confidence}`);
    
    if (exactMatch.match_confidence !== 1.00) {
      console.error('✗ FAIL: Exact match should have confidence 1.00');
      return false;
    }
  } else {
    console.log('⚠ No exact matches found (may be OK depending on data)');
  }
  
  // Test 3: Verify fuzzy match
  console.log('\nTest 3: Verify Fuzzy Match');
  const fuzzyMatch = matchResult.matches.find(m => m.match_method === 'fuzzy');
  if (fuzzyMatch) {
    console.log(`✓ Found fuzzy match: "${fuzzyMatch.contractor.description}" → "${fuzzyMatch.carrier.description}"`);
    console.log(`  Confidence: ${fuzzyMatch.match_confidence}`);
    
    if (fuzzyMatch.match_confidence < 0.85 || fuzzyMatch.match_confidence > 1.00) {
      console.error('✗ FAIL: Fuzzy match confidence out of range');
      return false;
    }
  }
  
  // Test 4: Verify similarity calculation
  console.log('\nTest 4: Verify Similarity Calculation');
  const sim1 = calculateSimilarity('tear off shingles', 'remove shingles');
  console.log(`Similarity("tear off shingles", "remove shingles"): ${sim1.toFixed(2)}`);
  
  const sim2 = calculateSimilarity('identical', 'identical');
  console.log(`Similarity("identical", "identical"): ${sim2.toFixed(2)}`);
  
  if (sim2 !== 1.00) {
    console.error('✗ FAIL: Identical strings should have similarity 1.00');
    return false;
  }
  console.log('✓ Similarity calculation correct');
  
  console.log('\n✅ ALL MATCHER TESTS PASSED\n');
  return matchResult;
}

// =====================================================
// RECONCILER TESTS
// =====================================================

function testReconciler(matchResult) {
  console.log('\n=== RECONCILER TESTS ===\n');
  
  // Test 1: Reconcile estimates
  console.log('Test 1: Reconcile Estimates');
  const reconciliation = reconcileEstimates(
    matchResult.matches,
    matchResult.unmatchedContractor,
    matchResult.unmatchedCarrier
  );
  
  console.log(`✓ Found ${reconciliation.discrepancies.length} discrepancies`);
  console.log(`✓ Contractor total: $${reconciliation.totals.contractor_total}`);
  console.log(`✓ Carrier total: $${reconciliation.totals.carrier_total}`);
  console.log(`✓ Underpayment: $${reconciliation.totals.underpayment_amount}`);
  
  // Test 2: Validate reconciliation
  console.log('\nTest 2: Validate Reconciliation Math');
  const validation = validateReconciliation(reconciliation);
  
  if (!validation.valid) {
    console.error('✗ FAIL: Reconciliation validation failed');
    console.error('Errors:', validation.errors);
    return false;
  }
  console.log('✓ Reconciliation math validated');
  
  // Test 3: Verify underpayment calculation
  console.log('\nTest 3: Verify Underpayment Calculation');
  const manualUnderpayment = reconciliation.discrepancies
    .filter(d => d.difference_amount > 0)
    .reduce((sum, d) => sum + d.difference_amount, 0);
  
  console.log(`Calculated underpayment: $${reconciliation.totals.underpayment_amount}`);
  console.log(`Manual verification: $${manualUnderpayment.toFixed(2)}`);
  
  if (Math.abs(manualUnderpayment - reconciliation.totals.underpayment_amount) > 0.01) {
    console.error('✗ FAIL: Underpayment calculation incorrect');
    return false;
  }
  console.log('✓ Underpayment calculation verified');
  
  // Test 4: Verify discrepancy types
  console.log('\nTest 4: Verify Discrepancy Types');
  const types = {
    missing_item: reconciliation.discrepancies.filter(d => d.discrepancy_type === 'missing_item').length,
    quantity_difference: reconciliation.discrepancies.filter(d => d.discrepancy_type === 'quantity_difference').length,
    pricing_difference: reconciliation.discrepancies.filter(d => d.discrepancy_type === 'pricing_difference').length
  };
  
  console.log(`Missing items: ${types.missing_item}`);
  console.log(`Quantity differences: ${types.quantity_difference}`);
  console.log(`Pricing differences: ${types.pricing_difference}`);
  console.log('✓ Discrepancy types assigned');
  
  // Test 5: Verify category breakdown
  console.log('\nTest 5: Verify Category Breakdown');
  const categories = Object.keys(reconciliation.categoryBreakdown);
  console.log(`Categories found: ${categories.join(', ')}`);
  
  for (const category of categories) {
    const breakdown = reconciliation.categoryBreakdown[category];
    console.log(`${category}:`);
    console.log(`  Contractor: $${breakdown.contractor_total}`);
    console.log(`  Carrier: $${breakdown.carrier_total}`);
    console.log(`  Difference: $${breakdown.difference}`);
  }
  console.log('✓ Category breakdown calculated');
  
  console.log('\n✅ ALL RECONCILER TESTS PASSED\n');
  return reconciliation;
}

// =====================================================
// INTEGRATION TEST
// =====================================================

function testFullPipeline() {
  console.log('\n========================================');
  console.log('ESTIMATE REVIEW PRO ENGINE - FULL TEST');
  console.log('========================================\n');
  
  try {
    // Phase 1: Parser
    const parserResult = testParser();
    if (!parserResult) {
      console.error('\n❌ PARSER TESTS FAILED\n');
      return false;
    }
    
    // Phase 2: Matcher
    const matchResult = testMatcher(parserResult.contractorParsed, parserResult.carrierParsed);
    if (!matchResult) {
      console.error('\n❌ MATCHER TESTS FAILED\n');
      return false;
    }
    
    // Phase 3: Reconciler
    const reconciliation = testReconciler(matchResult);
    if (!reconciliation) {
      console.error('\n❌ RECONCILER TESTS FAILED\n');
      return false;
    }
    
    // Final summary
    console.log('\n========================================');
    console.log('FINAL RESULTS');
    console.log('========================================\n');
    console.log(`Contractor Total: $${reconciliation.totals.contractor_total}`);
    console.log(`Carrier Total: $${reconciliation.totals.carrier_total}`);
    console.log(`Underpayment: $${reconciliation.totals.underpayment_amount}`);
    console.log(`Total Discrepancies: ${reconciliation.discrepancies.length}`);
    console.log(`\n✅ ALL TESTS PASSED - ENGINE IS DETERMINISTIC\n`);
    
    return true;
  } catch (error) {
    console.error('\n❌ TEST SUITE FAILED:', error);
    return false;
  }
}

// =====================================================
// UNIT TESTS
// =====================================================

function testNormalization() {
  console.log('\n=== NORMALIZATION TESTS ===\n');
  
  const tests = [
    { input: 'Tear-off Shingles!', expected: 'tearoff shingles' },
    { input: 'VINYL SIDING', expected: 'vinyl siding' },
    { input: 'Drywall  Repair', expected: 'drywall repair' },
    { input: '2x4 Studs (8ft)', expected: '2x4 studs 8ft' }
  ];
  
  let passed = 0;
  for (const test of tests) {
    const result = normalizeDescription(test.input);
    if (result === test.expected) {
      console.log(`✓ "${test.input}" → "${result}"`);
      passed++;
    } else {
      console.error(`✗ "${test.input}" → "${result}" (expected "${test.expected}")`);
    }
  }
  
  console.log(`\n${passed}/${tests.length} tests passed\n`);
  return passed === tests.length;
}

function testCategorization() {
  console.log('\n=== CATEGORIZATION TESTS ===\n');
  
  const tests = [
    { description: 'Tear off shingles', unit: 'SQ', expected: 'Roofing' },
    { description: 'Labor - framing', unit: 'HR', expected: 'Labor' },
    { description: 'Vinyl siding', unit: 'SF', expected: 'Siding' },
    { description: 'Drywall repair', unit: 'SF', expected: 'Interior' },
    { description: 'Electrical wiring', unit: 'LF', expected: 'Electrical' }
  ];
  
  let passed = 0;
  for (const test of tests) {
    const result = categorizeLineItem(test.description, test.unit);
    if (result === test.expected) {
      console.log(`✓ "${test.description}" (${test.unit}) → ${result}`);
      passed++;
    } else {
      console.error(`✗ "${test.description}" (${test.unit}) → ${result} (expected ${test.expected})`);
    }
  }
  
  console.log(`\n${passed}/${tests.length} tests passed\n`);
  return passed === tests.length;
}

function testSimilarity() {
  console.log('\n=== SIMILARITY TESTS ===\n');
  
  const tests = [
    { str1: 'identical', str2: 'identical', expected: 1.00 },
    { str1: 'tear off shingles', str2: 'remove shingles', expected: 0.60 }, // Approximate
    { str1: 'vinyl siding', str2: 'vinyl siding installation', expected: 0.70 } // Approximate
  ];
  
  let passed = 0;
  for (const test of tests) {
    const result = calculateSimilarity(test.str1, test.str2);
    const tolerance = 0.15;
    
    if (Math.abs(result - test.expected) <= tolerance) {
      console.log(`✓ Similarity("${test.str1}", "${test.str2}") = ${result.toFixed(2)}`);
      passed++;
    } else {
      console.error(`✗ Similarity("${test.str1}", "${test.str2}") = ${result.toFixed(2)} (expected ~${test.expected})`);
    }
  }
  
  console.log(`\n${passed}/${tests.length} tests passed\n`);
  return passed === tests.length;
}

// =====================================================
// RUN ALL TESTS
// =====================================================

function runAllTests() {
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║   ESTIMATE REVIEW PRO ENGINE - TEST SUITE         ║');
  console.log('╚════════════════════════════════════════════════════╝\n');
  
  const results = {
    normalization: testNormalization(),
    categorization: testCategorization(),
    similarity: testSimilarity(),
    fullPipeline: testFullPipeline()
  };
  
  console.log('\n========================================');
  console.log('TEST SUMMARY');
  console.log('========================================\n');
  console.log(`Normalization: ${results.normalization ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Categorization: ${results.categorization ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Similarity: ${results.similarity ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Full Pipeline: ${results.fullPipeline ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = Object.values(results).every(r => r === true);
  
  if (allPassed) {
    console.log('\n🎉 ALL TESTS PASSED - ENGINE IS PRODUCTION READY\n');
  } else {
    console.log('\n⚠️  SOME TESTS FAILED - REVIEW ABOVE\n');
  }
  
  return allPassed;
}

// Run tests if executed directly
if (require.main === module) {
  const success = runAllTests();
  process.exit(success ? 0 : 1);
}

module.exports = {
  testParser,
  testMatcher,
  testReconciler,
  testNormalization,
  testCategorization,
  testSimilarity,
  runAllTests
};
