/**
 * TEST SUITE: NEGOTIATION POSTURE CLASSIFIER
 * Tests posture classification without advice or strategy
 */

const { classifyNegotiationPosture, POSTURE_TYPE } = require('../app/assets/js/intelligence/negotiation-posture-classifier.js');

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

console.log('\n🧪 NEGOTIATION POSTURE CLASSIFIER TESTS\n');

// Test 1: Administrative posture
test('Classifies ADMINISTRATIVE posture', () => {
  const result = classifyNegotiationPosture({
    carrierResponse: {
      responseType: 'ACKNOWLEDGMENT',
      carrierText: 'We have received your claim and are processing it.'
    },
    claimState: 'SUBMITTED',
    estimateDelta: null,
    scopeRegression: null
  });

  assert(result.postureType === POSTURE_TYPE.ADMINISTRATIVE, 'Should be ADMINISTRATIVE');
  assert(result.confidence === 'HIGH', 'Should have HIGH confidence');
});

// Test 2: Delay posture
test('Classifies DELAY posture', () => {
  const result = classifyNegotiationPosture({
    carrierResponse: {
      responseType: 'DELAY',
      carrierText: 'We need additional time to review your claim.'
    },
    claimState: 'SUBMITTED',
    estimateDelta: null,
    scopeRegression: null
  });

  assert(result.postureType === POSTURE_TYPE.DELAY, 'Should be DELAY');
});

// Test 3: Partial acceptance posture
test('Classifies PARTIAL_ACCEPTANCE posture', () => {
  const result = classifyNegotiationPosture({
    carrierResponse: {
      responseType: 'PARTIAL_APPROVAL',
      carrierText: 'We approve some items but not others.'
    },
    claimState: 'CARRIER_RESPONSE_RECEIVED',
    estimateDelta: {
      removedLineItems: [{ lineNumber: 1, description: 'Item A' }]
    },
    scopeRegression: { regressionDetected: true }
  });

  assert(result.postureType === POSTURE_TYPE.PARTIAL_ACCEPTANCE, 'Should be PARTIAL_ACCEPTANCE');
});

// Test 4: Scope reduction posture
test('Classifies SCOPE_REDUCTION posture', () => {
  const result = classifyNegotiationPosture({
    carrierResponse: {
      responseType: 'SCOPE_REDUCTION',
      carrierText: 'We have reduced the scope of approved work.'
    },
    claimState: 'CARRIER_RESPONSE_RECEIVED',
    estimateDelta: {
      removedLineItems: [
        { lineNumber: 1, description: 'Item A' },
        { lineNumber: 2, description: 'Item B' }
      ]
    },
    scopeRegression: {
      regressionDetected: true,
      regressionType: 'LINE_ITEM_REMOVAL'
    }
  });

  assert(result.postureType === POSTURE_TYPE.SCOPE_REDUCTION, 'Should be SCOPE_REDUCTION');
});

// Test 5: Lowball posture
test('Classifies LOWBALL posture', () => {
  const result = classifyNegotiationPosture({
    carrierResponse: {
      responseType: 'PARTIAL_APPROVAL',
      carrierText: 'Approved with reduced amounts.'
    },
    claimState: 'CARRIER_RESPONSE_RECEIVED',
    estimateDelta: {
      valuationChangesPresent: true,
      reducedQuantities: [
        { lineNumber: 1, before: 10, after: 3 },
        { lineNumber: 2, before: 20, after: 5 }
      ]
    },
    scopeRegression: { regressionDetected: true }
  });

  assert(result.postureType === POSTURE_TYPE.LOWBALL, 'Should be LOWBALL');
});

// Test 6: Technical denial posture
test('Classifies TECHNICAL_DENIAL posture', () => {
  const result = classifyNegotiationPosture({
    carrierResponse: {
      responseType: 'DENIAL',
      carrierText: 'Claim denied due to policy exclusion.'
    },
    claimState: 'CARRIER_RESPONSE_RECEIVED',
    estimateDelta: null,
    scopeRegression: null
  });

  assert(result.postureType === POSTURE_TYPE.TECHNICAL_DENIAL, 'Should be TECHNICAL_DENIAL');
});

// Test 7: Stalling posture
test('Classifies STALLING posture', () => {
  const result = classifyNegotiationPosture({
    carrierResponse: {
      responseType: 'REQUEST_FOR_INFORMATION',
      carrierText: 'We need more documentation.'
    },
    claimState: 'RESUBMITTED',
    estimateDelta: null,
    scopeRegression: null
  });

  assert(result.postureType === POSTURE_TYPE.STALLING, 'Should be STALLING');
});

// Test 8: Evidence references present
test('Includes evidence references', () => {
  const result = classifyNegotiationPosture({
    carrierResponse: {
      responseType: 'SCOPE_REDUCTION',
      carrierText: 'Scope reduced.'
    },
    claimState: 'CARRIER_RESPONSE_RECEIVED',
    estimateDelta: {
      removedLineItems: [{ lineNumber: 1, description: 'Item A' }]
    },
    scopeRegression: { regressionDetected: true }
  });

  assert(Array.isArray(result.evidence), 'Should have evidence array');
  assert(result.evidence.length > 0, 'Should have evidence references');
});

// Test 9: Neutral description only
test('Provides neutral description only', () => {
  const result = classifyNegotiationPosture({
    carrierResponse: {
      responseType: 'DELAY',
      carrierText: 'Processing delayed.'
    },
    claimState: 'SUBMITTED',
    estimateDelta: null,
    scopeRegression: null
  });

  assert(typeof result.description === 'string', 'Should have description');
  assert(result.description.length > 0, 'Description should not be empty');
  
  // Check for prohibited words
  const prohibitedWords = ['should', 'recommend', 'advise', 'negotiate', 'demand'];
  const hasProhibited = prohibitedWords.some(word => 
    result.description.toLowerCase().includes(word)
  );
  assert(!hasProhibited, 'Description should not contain advice');
});

// Test 10: Determinism - same input produces same output
test('Determinism: Same input → same output', () => {
  const input = {
    carrierResponse: {
      responseType: 'PARTIAL_APPROVAL',
      carrierText: 'Partial approval.'
    },
    claimState: 'CARRIER_RESPONSE_RECEIVED',
    estimateDelta: {
      removedLineItems: [{ lineNumber: 1, description: 'Item A' }]
    },
    scopeRegression: { regressionDetected: true }
  };

  const result1 = classifyNegotiationPosture(input);
  const result2 = classifyNegotiationPosture(input);

  assert(result1.postureType === result2.postureType, 'Posture type should match');
  assert(result1.confidence === result2.confidence, 'Confidence should match');
  assert(result1.evidence.length === result2.evidence.length, 'Evidence count should match');
});

// Test 11: Confidence scoring
test('Provides confidence scoring', () => {
  const result = classifyNegotiationPosture({
    carrierResponse: {
      responseType: 'ACKNOWLEDGMENT',
      carrierText: 'Received.'
    },
    claimState: 'SUBMITTED',
    estimateDelta: null,
    scopeRegression: null
  });

  assert(['HIGH', 'MEDIUM'].includes(result.confidence), 'Should have valid confidence level');
});

// Test 12: Handles missing optional fields
test('Handles missing optional fields', () => {
  const result = classifyNegotiationPosture({
    carrierResponse: {
      responseType: 'ACKNOWLEDGMENT'
    },
    claimState: 'SUBMITTED'
  });

  assert(result.postureType, 'Should still classify posture');
  assert(result.confidence, 'Should still provide confidence');
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

