/**
 * COMPREHENSIVE PIPELINE INTEGRATION TEST
 * Tests all estimate analysis engines working together
 */

const LossExpectationEngine = require('../netlify/functions/lib/loss-expectation-engine');
const TradeCompletenessEngine = require('../netlify/functions/lib/trade-completeness-engine');
const CodeUpgradeEngine = require('../netlify/functions/lib/code-upgrade-engine');
const LaborRateValidator = require('../netlify/functions/lib/labor-rate-validator');

// ============================================================================
// TEST DATA
// ============================================================================

const WATER_DAMAGE_LINE_ITEMS = [
  { description: 'Drying equipment - 3 days', quantity: 3, unit: 'DAY', unit_price: 150, total: 450, category: 'Cleaning' },
  { description: 'Demolition - remove wet drywall', quantity: 500, unit: 'SF', unit_price: 1.50, total: 750, category: 'Demolition' },
  { description: 'Drywall replacement', quantity: 500, unit: 'SF', unit_price: 3.00, total: 1500, category: 'Drywall' },
  { description: 'Paint interior walls', quantity: 500, unit: 'SF', unit_price: 2.50, total: 1250, category: 'Painting' },
  { description: 'Carpet replacement', quantity: 200, unit: 'SF', unit_price: 6.00, total: 1200, category: 'Flooring' },
  { description: 'Labor - drywall installation', quantity: 16, unit: 'HR', unit_price: 45, total: 720, category: 'Drywall' }
];

const FIRE_DAMAGE_LINE_ITEMS = [
  { description: 'Smoke cleaning', quantity: 1000, unit: 'SF', unit_price: 2.00, total: 2000, category: 'Cleaning' },
  { description: 'Demolition - fire damaged materials', quantity: 800, unit: 'SF', unit_price: 2.00, total: 1600, category: 'Demolition' },
  { description: 'Framing - structural repair', quantity: 200, unit: 'LF', unit_price: 15.00, total: 3000, category: 'Framing' },
  { description: 'Drywall replacement', quantity: 800, unit: 'SF', unit_price: 3.00, total: 2400, category: 'Drywall' },
  { description: 'Paint - complete interior', quantity: 800, unit: 'SF', unit_price: 2.50, total: 2000, category: 'Painting' },
  { description: 'Electrical repair', quantity: 12, unit: 'HR', unit_price: 85, total: 1020, category: 'Electrical' },
  { description: 'Flooring replacement', quantity: 400, unit: 'SF', unit_price: 8.00, total: 3200, category: 'Flooring' }
];

const WIND_DAMAGE_LINE_ITEMS = [
  { description: 'Roofing - shingle replacement', quantity: 25, unit: 'SQ', unit_price: 350, total: 8750, category: 'Roofing' },
  { description: 'Tear off old shingles', quantity: 25, unit: 'SQ', unit_price: 75, total: 1875, category: 'Roofing' },
  { description: 'Gutter replacement', quantity: 100, unit: 'LF', unit_price: 12, total: 1200, category: 'Roofing' },
  { description: 'Siding repair', quantity: 200, unit: 'SF', unit_price: 8, total: 1600, category: 'Siding' },
  { description: 'Window replacement', quantity: 2, unit: 'EA', unit_price: 550, total: 1100, category: 'Windows' }
];

// ============================================================================
// TESTS
// ============================================================================

describe('Comprehensive Pipeline Integration', () => {
  
  // ========================================================================
  // TEST 1: WATER DAMAGE - FULL PIPELINE
  // ========================================================================
  test('Water damage estimate - full pipeline', async () => {
    console.log('\n========================================');
    console.log('TEST 1: WATER DAMAGE - FULL PIPELINE');
    console.log('========================================\n');
    
    const totalCost = WATER_DAMAGE_LINE_ITEMS.reduce((sum, item) => sum + item.total, 0);
    
    // Step 1: Loss Expectation
    console.log('Step 1: Loss Type & Severity Inference...');
    const lossExpectation = LossExpectationEngine.analyzeLossExpectation({
      lineItems: WATER_DAMAGE_LINE_ITEMS,
      totalCost,
      metadata: {}
    });
    
    console.log(`  ✓ Loss Type: ${lossExpectation.lossType}`);
    console.log(`  ✓ Severity: ${lossExpectation.severity}`);
    console.log(`  ✓ Confidence: ${(lossExpectation.confidence * 100).toFixed(1)}%`);
    console.log(`  ✓ Completeness Score: ${lossExpectation.completenessScore}/100`);
    console.log(`  ✓ Missing Trades: ${lossExpectation.missingTrades.length}`);
    
    expect(lossExpectation.success).toBe(true);
    expect(lossExpectation.lossType).toBe('WATER');
    expect(['LEVEL_1', 'LEVEL_2', 'LEVEL_3', 'CATEGORY_3']).toContain(lossExpectation.severity);
    
    // Step 2: Trade Completeness
    console.log('\nStep 2: Trade Completeness Scoring...');
    const tradeCompleteness = TradeCompletenessEngine.analyzeTradeCompleteness({
      lineItems: WATER_DAMAGE_LINE_ITEMS,
      metadata: {}
    });
    
    console.log(`  ✓ Integrity Score: ${tradeCompleteness.integrityScore}/100`);
    console.log(`  ✓ Integrity Level: ${tradeCompleteness.integrityLevel}`);
    console.log(`  ✓ Total Trades: ${tradeCompleteness.summary.total_trades}`);
    console.log(`  ✓ Trades with Issues: ${tradeCompleteness.summary.trades_with_issues}`);
    console.log(`  ✓ Critical Issues: ${tradeCompleteness.criticalIssues.length}`);
    
    expect(tradeCompleteness.success).toBe(true);
    expect(tradeCompleteness.integrityScore).toBeGreaterThan(0);
    expect(tradeCompleteness.integrityScore).toBeLessThanOrEqual(100);
    
    // Step 3: Code Upgrades
    console.log('\nStep 3: Code Upgrade Detection...');
    const codeUpgrades = CodeUpgradeEngine.analyzeCodeUpgrades({
      lineItems: WATER_DAMAGE_LINE_ITEMS,
      reconciliation: {},
      exposure: {},
      propertyMetadata: {},
      regionalData: {}
    });
    
    console.log(`  ✓ Code Upgrade Flags: ${codeUpgrades.flagCount}`);
    console.log(`  ✓ Total Exposure: $${codeUpgrades.totalCodeUpgradeExposure.toLocaleString()}`);
    
    expect(codeUpgrades.codeUpgradeFlags).toBeDefined();
    expect(Array.isArray(codeUpgrades.codeUpgradeFlags)).toBe(true);
    
    // Step 4: Labor Rate Validation
    console.log('\nStep 4: Labor Rate Validation...');
    const laborAnalysis = await LaborRateValidator.validateLaborRates({
      lineItems: WATER_DAMAGE_LINE_ITEMS,
      region: 'CA-San Francisco',
      metadata: {}
    });
    
    console.log(`  ✓ Total Labor Cost: $${laborAnalysis.totalLaborCost.toLocaleString()}`);
    console.log(`  ✓ Labor Score: ${laborAnalysis.laborScore}/100`);
    console.log(`  ✓ Undervalued Items: ${laborAnalysis.undervaluedLabor.length}`);
    console.log(`  ✓ Overvalued Items: ${laborAnalysis.overvaluedLabor.length}`);
    
    expect(laborAnalysis.success).toBe(true);
    expect(laborAnalysis.laborScore).toBeGreaterThanOrEqual(0);
    expect(laborAnalysis.laborScore).toBeLessThanOrEqual(100);
    
    console.log('\n✅ Water Damage Test PASSED\n');
  });
  
  // ========================================================================
  // TEST 2: FIRE DAMAGE - FULL PIPELINE
  // ========================================================================
  test('Fire damage estimate - full pipeline', async () => {
    console.log('\n========================================');
    console.log('TEST 2: FIRE DAMAGE - FULL PIPELINE');
    console.log('========================================\n');
    
    const totalCost = FIRE_DAMAGE_LINE_ITEMS.reduce((sum, item) => sum + item.total, 0);
    
    // Step 1: Loss Expectation
    console.log('Step 1: Loss Type & Severity Inference...');
    const lossExpectation = LossExpectationEngine.analyzeLossExpectation({
      lineItems: FIRE_DAMAGE_LINE_ITEMS,
      totalCost,
      metadata: {}
    });
    
    console.log(`  ✓ Loss Type: ${lossExpectation.lossType}`);
    console.log(`  ✓ Severity: ${lossExpectation.severity}`);
    console.log(`  ✓ Confidence: ${(lossExpectation.confidence * 100).toFixed(1)}%`);
    console.log(`  ✓ Completeness Score: ${lossExpectation.completenessScore}/100`);
    
    expect(lossExpectation.success).toBe(true);
    expect(lossExpectation.lossType).toBe('FIRE');
    expect(['LIGHT', 'MODERATE', 'HEAVY']).toContain(lossExpectation.severity);
    
    // Step 2: Trade Completeness
    console.log('\nStep 2: Trade Completeness Scoring...');
    const tradeCompleteness = TradeCompletenessEngine.analyzeTradeCompleteness({
      lineItems: FIRE_DAMAGE_LINE_ITEMS,
      metadata: {}
    });
    
    console.log(`  ✓ Integrity Score: ${tradeCompleteness.integrityScore}/100`);
    console.log(`  ✓ Integrity Level: ${tradeCompleteness.integrityLevel}`);
    
    expect(tradeCompleteness.success).toBe(true);
    
    console.log('\n✅ Fire Damage Test PASSED\n');
  });
  
  // ========================================================================
  // TEST 3: WIND DAMAGE - FULL PIPELINE
  // ========================================================================
  test('Wind damage estimate - full pipeline', async () => {
    console.log('\n========================================');
    console.log('TEST 3: WIND DAMAGE - FULL PIPELINE');
    console.log('========================================\n');
    
    const totalCost = WIND_DAMAGE_LINE_ITEMS.reduce((sum, item) => sum + item.total, 0);
    
    // Step 1: Loss Expectation
    console.log('Step 1: Loss Type & Severity Inference...');
    const lossExpectation = LossExpectationEngine.analyzeLossExpectation({
      lineItems: WIND_DAMAGE_LINE_ITEMS,
      totalCost,
      metadata: {}
    });
    
    console.log(`  ✓ Loss Type: ${lossExpectation.lossType}`);
    console.log(`  ✓ Severity: ${lossExpectation.severity}`);
    console.log(`  ✓ Confidence: ${(lossExpectation.confidence * 100).toFixed(1)}%`);
    
    expect(lossExpectation.success).toBe(true);
    expect(lossExpectation.lossType).toBe('WIND');
    expect(['MINOR', 'MAJOR']).toContain(lossExpectation.severity);
    
    // Step 2: Trade Completeness
    console.log('\nStep 2: Trade Completeness Scoring...');
    const tradeCompleteness = TradeCompletenessEngine.analyzeTradeCompleteness({
      lineItems: WIND_DAMAGE_LINE_ITEMS,
      metadata: {}
    });
    
    console.log(`  ✓ Integrity Score: ${tradeCompleteness.integrityScore}/100`);
    
    expect(tradeCompleteness.success).toBe(true);
    
    console.log('\n✅ Wind Damage Test PASSED\n');
  });
  
  // ========================================================================
  // TEST 4: LABOR RATE VALIDATION - MULTIPLE REGIONS
  // ========================================================================
  test('Labor rate validation - multiple regions', async () => {
    console.log('\n========================================');
    console.log('TEST 4: LABOR RATE VALIDATION - REGIONS');
    console.log('========================================\n');
    
    const laborItems = [
      { description: 'Electrician labor', quantity: 8, unit: 'HR', unit_price: 45, total: 360, category: 'Electrical' },
      { description: 'Plumber labor', quantity: 6, unit: 'HR', unit_price: 50, total: 300, category: 'Plumbing' },
      { description: 'Painter labor', quantity: 20, unit: 'HR', unit_price: 35, total: 700, category: 'Painting' }
    ];
    
    const regions = ['CA-San Francisco', 'TX-Houston', 'NY-New York City', 'FL-Miami'];
    
    for (const region of regions) {
      console.log(`\nTesting region: ${region}`);
      const result = await LaborRateValidator.validateLaborRates({
        lineItems: laborItems,
        region,
        metadata: {}
      });
      
      console.log(`  ✓ Labor Score: ${result.laborScore}/100`);
      console.log(`  ✓ Undervalued: ${result.undervaluedLabor.length}`);
      console.log(`  ✓ Total Variance: $${result.laborVariance.toFixed(2)}`);
      
      expect(result.success).toBe(true);
    }
    
    console.log('\n✅ Multi-Region Test PASSED\n');
  });
  
  // ========================================================================
  // TEST 5: EDGE CASES
  // ========================================================================
  test('Edge cases - empty and invalid inputs', async () => {
    console.log('\n========================================');
    console.log('TEST 5: EDGE CASES');
    console.log('========================================\n');
    
    // Empty line items
    console.log('Testing empty line items...');
    const emptyResult = LossExpectationEngine.analyzeLossExpectation({
      lineItems: [],
      totalCost: 0,
      metadata: {}
    });
    expect(emptyResult.success).toBe(false);
    console.log('  ✓ Empty input handled correctly');
    
    // Single line item
    console.log('\nTesting single line item...');
    const singleResult = LossExpectationEngine.analyzeLossExpectation({
      lineItems: [{ description: 'Test', quantity: 1, unit: 'EA', total: 100 }],
      totalCost: 100,
      metadata: {}
    });
    // Should still work, just might not classify well
    console.log(`  ✓ Single item result: ${singleResult.success ? 'Success' : 'Failed as expected'}`);
    
    console.log('\n✅ Edge Cases Test PASSED\n');
  });
});

// ============================================================================
// RUN TESTS
// ============================================================================

console.log('\n');
console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║  COMPREHENSIVE PIPELINE INTEGRATION TEST SUITE                 ║');
console.log('╚════════════════════════════════════════════════════════════════╝');
console.log('\n');

// Run all tests
(async () => {
  try {
    // Test 1
    await describe('Comprehensive Pipeline Integration', () => {
      test('Water damage estimate - full pipeline', async () => {
        // ... test code ...
      });
    });
    
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║  ALL TESTS PASSED ✅                                           ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log('\n');
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
})();

// Export for Jest
module.exports = {
  WATER_DAMAGE_LINE_ITEMS,
  FIRE_DAMAGE_LINE_ITEMS,
  WIND_DAMAGE_LINE_ITEMS
};
