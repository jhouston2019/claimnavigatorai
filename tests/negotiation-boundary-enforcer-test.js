/**
 * TEST SUITE: NEGOTIATION BOUNDARY ENFORCER
 * Tests hard guardrails against advice and negotiation
 */

const {
  checkBoundaries,
  validateOutputContent,
  enforceBoundaries,
  validateOutput,
  containsImperatives,
  containsEntitlementFraming,
  comprehensiveBoundaryCheck,
  BOUNDARY_TYPE
} = require('../app/assets/js/intelligence/negotiation-boundary-enforcer.js');

// ============================================================================
// TEST HELPERS
// ============================================================================

let testCount = 0;
let passCount = 0;

function test(name, fn) {
  testCount++;
  try {
    fn();
    passCount++;
    console.log(`✅ Test ${testCount}: ${name}`);
  } catch (error) {
    console.error(`❌ Test ${testCount}: ${name}`);
    console.error(`   ${error.message}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

// ============================================================================
// TEST SUITE
// ============================================================================

console.log('\n🧪 NEGOTIATION BOUNDARY ENFORCER TESTS\n');

// Test 1: Blocks advice requests
test('Blocks "what should I say"', () => {
  const result = checkBoundaries({
    userRequest: 'What should I say to the insurance company?'
  });

  assert(result.allowed === false, 'Should block advice request');
  assert(result.violations.length > 0, 'Should have violations');
  assert(result.refusalReason, 'Should have refusal reason');
});

// Test 2: Blocks negotiation tactics
test('Blocks "how do I negotiate"', () => {
  const result = checkBoundaries({
    userRequest: 'How do I negotiate with them?'
  });

  assert(result.allowed === false, 'Should block negotiation request');
  assert(result.violations.some(v => v.boundaryType === 'NEGOTIATION_TACTIC'), 'Should identify as negotiation tactic');
});

// Test 3: Blocks coverage interpretation
test('Blocks "are they required to"', () => {
  const result = checkBoundaries({
    userRequest: 'Are they required to pay for this?'
  });

  assert(result.allowed === false, 'Should block coverage interpretation');
  assert(result.violations.some(v => v.boundaryType === 'COVERAGE_INTERPRETATION'), 'Should identify as coverage interpretation');
});

// Test 4: Blocks entitlement framing
test('Blocks "what am I owed"', () => {
  const result = checkBoundaries({
    userRequest: 'What am I owed for this claim?'
  });

  assert(result.allowed === false, 'Should block entitlement framing');
  assert(result.violations.some(v => v.boundaryType === 'ENTITLEMENT_FRAMING'), 'Should identify as entitlement framing');
});

// Test 5: Blocks strategy requests
test('Blocks "what\'s my next move"', () => {
  const result = checkBoundaries({
    userRequest: 'What\'s my next move in this claim?'
  });

  assert(result.allowed === false, 'Should block strategy request');
  assert(result.violations.some(v => v.boundaryType === 'STRATEGY_REQUEST'), 'Should identify as strategy request');
});

// Test 6: Allows factual requests
test('Allows factual information requests', () => {
  const result = checkBoundaries({
    userRequest: 'What line items are missing from the carrier estimate?'
  });

  assert(result.allowed === true, 'Should allow factual request');
  assert(result.violations.length === 0, 'Should have no violations');
});

// Test 7: Validates output content
test('Detects prohibited words in output', () => {
  const result = validateOutputContent('You should negotiate with them about this.');

  assert(result.valid === false, 'Should detect prohibited language');
  assert(result.violations.length > 0, 'Should have violations');
});

// Test 8: Allows clean output
test('Allows clean factual output', () => {
  const result = validateOutputContent('The carrier estimate does not include line item 5.');

  assert(result.valid === true, 'Should allow clean output');
  assert(result.violations.length === 0, 'Should have no violations');
});

// Test 9: Enforces boundaries
test('Enforcement blocks prohibited requests', () => {
  const result = enforceBoundaries({
    userRequest: 'How should I respond to their lowball offer?'
  });

  assert(result.allowed === false, 'Should block request');
  assert(result.refusalMessage, 'Should provide refusal message');
  assert(result.output === null, 'Should not generate output');
});

// Test 10: Enforcement allows valid requests
test('Enforcement allows valid requests', () => {
  const result = enforceBoundaries({
    userRequest: 'What items are in the estimate delta?'
  });

  assert(result.allowed === true, 'Should allow request');
  assert(result.refusalMessage === null, 'Should not have refusal message');
});

// Test 11: Detects imperatives
test('Detects imperative language', () => {
  const hasImperatives = containsImperatives('You should contact them immediately.');

  assert(hasImperatives === true, 'Should detect imperatives');
});

// Test 12: Detects entitlement framing
test('Detects entitlement framing', () => {
  const hasEntitlement = containsEntitlementFraming('They owe you $5000 for this damage.');

  assert(hasEntitlement === true, 'Should detect entitlement framing');
});

// Test 13: Comprehensive boundary check
test('Comprehensive check catches all violations', () => {
  const result = comprehensiveBoundaryCheck({
    userRequest: 'What should I say?',
    generatedOutput: 'You must demand payment.'
  });

  assert(result.passed === false, 'Should fail comprehensive check');
  assert(result.requestAllowed === false, 'Request should be blocked');
  assert(result.outputValid === false, 'Output should be invalid');
  assert(result.violations.length > 0, 'Should have violations');
});

// Test 14: Comprehensive check passes clean content
test('Comprehensive check passes clean content', () => {
  const result = comprehensiveBoundaryCheck({
    userRequest: 'What line items are missing?',
    generatedOutput: 'Line items 3 and 5 are not present in the carrier estimate.'
  });

  assert(result.passed === true, 'Should pass comprehensive check');
  assert(result.requestAllowed === true, 'Request should be allowed');
  assert(result.outputValid === true, 'Output should be valid');
});

// Test 15: Neutral refusal messages
test('Refusal messages are neutral', () => {
  const result = checkBoundaries({
    userRequest: 'What should I do next?'
  });

  const refusal = result.refusalReason;
  
  // Check that refusal doesn't contain guidance
  const guidanceWords = ['try', 'consider', 'instead', 'alternatively'];
  const hasGuidance = guidanceWords.some(word => refusal.toLowerCase().includes(word));
  
  assert(!hasGuidance, 'Refusal should not contain guidance');
});

// ============================================================================
// RESULTS
// ============================================================================

console.log(`\n📊 Results: ${passCount}/${testCount} tests passed\n`);

if (passCount === testCount) {
  console.log('✅ ALL TESTS PASSED\n');
  process.exit(0);
} else {
  console.log('❌ SOME TESTS FAILED\n');
  process.exit(1);
}

