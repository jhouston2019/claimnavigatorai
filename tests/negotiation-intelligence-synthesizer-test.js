/**
 * TEST SUITE: NEGOTIATION INTELLIGENCE SYNTHESIZER
 * Tests intelligence synthesis without advice or recommendations
 */

const {
  synthesizeNegotiationIntelligence,
  getStateConstraints,
  generateNeutralObservations,
  generateIntelligenceSummary,
  validateIntelligence,
  getAspectSummary,
  filterObservationsByCategory,
  isDeterministic
} = require('../app/assets/js/intelligence/negotiation-intelligence-synthesizer.js');

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

console.log('\n🧪 NEGOTIATION INTELLIGENCE SYNTHESIZER TESTS\n');

// Test 1: Synthesizes complete intelligence
test('Synthesizes complete intelligence', () => {
  const result = synthesizeNegotiationIntelligence({
    carrierResponse: {
      responseType: 'PARTIAL_APPROVAL',
      carrierText: 'Some items approved.',
      confidence: 'HIGH'
    },
    estimateDelta: {
      removedLineItems: [{ lineNumber: 1, description: 'Item A', amount: 1000 }],
      reducedQuantities: [],
      categoryOmissions: [],
      valuationChangesPresent: false
    },
    scopeRegression: {
      regressionDetected: true,
      regressionType: 'LINE_ITEM_REMOVAL',
      evidence: ['Line item 1 removed']
    },
    claimState: 'CARRIER_RESPONSE_RECEIVED',
    submissionHistory: [],
    claimTimeline: {}
  });

  assert(result.summary, 'Should have summary');
  assert(result.posture, 'Should have posture classification');
  assert(result.signals, 'Should have leverage signals');
  assert(result.observations, 'Should have observations');
  assert(result.stateConstraints, 'Should have state constraints');
});

// Test 2: Gets state constraints
test('Gets state constraints for claim state', () => {
  const constraints = getStateConstraints('CARRIER_RESPONSE_RECEIVED');

  assert(constraints.currentState === 'CARRIER_RESPONSE_RECEIVED', 'Should have correct state');
  assert(Array.isArray(constraints.allowedActions), 'Should have allowed actions');
  assert(Array.isArray(constraints.blockedActions), 'Should have blocked actions');
  assert(constraints.requiresValidation === true, 'Should require validation');
});

// Test 3: Generates neutral observations
test('Generates neutral observations', () => {
  const observations = generateNeutralObservations({
    postureClassification: {
      postureType: 'PARTIAL_ACCEPTANCE',
      confidence: 'HIGH',
      evidence: ['Evidence 1']
    },
    leverageSignals: {
      signals: [{ type: 'OMITTED_LINE_ITEMS' }],
      signalCount: 1
    },
    carrierResponse: {
      responseType: 'PARTIAL_APPROVAL',
      confidence: 'HIGH'
    },
    estimateDelta: {
      removedLineItems: [{ lineNumber: 1, description: 'Item A' }],
      reducedQuantities: []
    },
    scopeRegression: {
      regressionDetected: true,
      regressionType: 'LINE_ITEM_REMOVAL'
    }
  });

  assert(Array.isArray(observations), 'Should return array');
  assert(observations.length > 0, 'Should have observations');
  
  observations.forEach(obs => {
    assert(obs.category, 'Each observation should have category');
    assert(obs.observation, 'Each observation should have observation text');
    assert(obs.source, 'Each observation should have source');
  });
});

// Test 4: Observations are factual only
test('Observations contain no advice', () => {
  const observations = generateNeutralObservations({
    postureClassification: {
      postureType: 'DELAY',
      confidence: 'HIGH',
      evidence: []
    },
    leverageSignals: {
      signals: [],
      signalCount: 0
    },
    carrierResponse: {
      responseType: 'DELAY'
    },
    estimateDelta: {},
    scopeRegression: {}
  });

  const prohibitedWords = ['should', 'must', 'recommend', 'advise', 'negotiate'];
  
  observations.forEach(obs => {
    const hasProhibited = prohibitedWords.some(word =>
      obs.observation.toLowerCase().includes(word)
    );
    assert(!hasProhibited, `Observation should not contain advice: ${obs.observation}`);
  });
});

// Test 5: Generates intelligence summary
test('Generates intelligence summary', () => {
  const summary = generateIntelligenceSummary({
    postureClassification: {
      postureType: 'PARTIAL_ACCEPTANCE',
      confidence: 'HIGH'
    },
    leverageSignals: {
      signalCount: 2
    },
    observations: [
      { category: 'POSTURE', observation: 'Test', confidence: 'HIGH' }
    ],
    stateConstraints: {
      currentState: 'CARRIER_RESPONSE_RECEIVED',
      allowedActions: ['review_response']
    }
  });

  assert(typeof summary === 'string', 'Summary should be string');
  assert(summary.length > 0, 'Summary should not be empty');
});

// Test 6: Summary contains no imperatives
test('Summary contains no imperatives', () => {
  const summary = generateIntelligenceSummary({
    postureClassification: {
      postureType: 'LOWBALL',
      confidence: 'HIGH'
    },
    leverageSignals: {
      signalCount: 3
    },
    observations: [],
    stateConstraints: {
      currentState: 'DISPUTE_IDENTIFIED',
      allowedActions: ['prepare_supplement']
    }
  });

  const imperatives = ['you should', 'you must', 'you need to', 'i recommend', 'i suggest'];
  const hasImperatives = imperatives.some(phrase =>
    summary.toLowerCase().includes(phrase)
  );

  assert(!hasImperatives, 'Summary should not contain imperatives');
});

// Test 7: Validates intelligence
test('Validates intelligence structure', () => {
  const intelligence = {
    summary: 'Test summary',
    posture: { postureType: 'ADMINISTRATIVE' },
    signals: { signalCount: 0 },
    observations: [],
    stateConstraints: { currentState: 'SUBMITTED' }
  };

  const validation = validateIntelligence(intelligence);
  assert(validation.valid === true, 'Valid intelligence should pass');
  assert(validation.issues.length === 0, 'Should have no issues');
});

// Test 8: Detects missing required fields
test('Detects missing required fields', () => {
  const intelligence = {
    summary: 'Test',
    posture: { postureType: 'ADMINISTRATIVE' }
    // Missing signals, observations, stateConstraints
  };

  const validation = validateIntelligence(intelligence);
  assert(validation.valid === false, 'Incomplete intelligence should fail');
  assert(validation.issues.length > 0, 'Should have issues');
});

// Test 9: Detects prohibited language in summary
test('Detects prohibited language in summary', () => {
  const intelligence = {
    summary: 'You should negotiate with them.',
    posture: { postureType: 'ADMINISTRATIVE' },
    signals: { signalCount: 0 },
    observations: [],
    stateConstraints: { currentState: 'SUBMITTED' }
  };

  const validation = validateIntelligence(intelligence);
  assert(validation.valid === false, 'Should detect prohibited language');
});

// Test 10: Gets aspect summary
test('Gets aspect summary', () => {
  const intelligence = {
    posture: { postureType: 'DELAY', confidence: 'HIGH' },
    signals: { signalCount: 3 },
    observations: [{ category: 'POSTURE' }, { category: 'SCOPE' }],
    stateConstraints: { currentState: 'SUBMITTED' }
  };

  const postureSummary = getAspectSummary(intelligence, 'posture');
  assert(postureSummary.includes('DELAY'), 'Should include posture type');

  const signalsSummary = getAspectSummary(intelligence, 'signals');
  assert(signalsSummary.includes('3'), 'Should include signal count');
});

// Test 11: Filters observations by category
test('Filters observations by category', () => {
  const intelligence = {
    observations: [
      { category: 'POSTURE', observation: 'Test 1' },
      { category: 'SCOPE', observation: 'Test 2' },
      { category: 'POSTURE', observation: 'Test 3' }
    ]
  };

  const postureObs = filterObservationsByCategory(intelligence, 'POSTURE');
  assert(postureObs.length === 2, 'Should filter correctly');
});

// Test 12: Determinism check
test('Checks determinism between intelligence outputs', () => {
  const intel1 = {
    posture: { postureType: 'DELAY', confidence: 'HIGH' },
    signals: { signalCount: 2 },
    observations: [{ category: 'POSTURE' }],
    stateConstraints: { currentState: 'SUBMITTED' }
  };

  const intel2 = {
    posture: { postureType: 'DELAY', confidence: 'HIGH' },
    signals: { signalCount: 2 },
    observations: [{ category: 'POSTURE' }],
    stateConstraints: { currentState: 'SUBMITTED' }
  };

  const deterministic = isDeterministic(intel1, intel2);
  assert(deterministic === true, 'Identical inputs should be deterministic');
});

// Test 13: Full synthesis determinism
test('Full synthesis is deterministic', () => {
  const input = {
    carrierResponse: {
      responseType: 'ACKNOWLEDGMENT',
      carrierText: 'Received.',
      confidence: 'HIGH'
    },
    estimateDelta: {
      removedLineItems: [],
      reducedQuantities: [],
      categoryOmissions: []
    },
    scopeRegression: {
      regressionDetected: false
    },
    claimState: 'SUBMITTED',
    submissionHistory: [],
    claimTimeline: {}
  };

  const result1 = synthesizeNegotiationIntelligence(input);
  const result2 = synthesizeNegotiationIntelligence(input);

  const deterministic = isDeterministic(result1, result2);
  assert(deterministic === true, 'Same input should produce identical output');
});

// Test 14: State constraints include validation requirement
test('State constraints require validation', () => {
  const constraints = getStateConstraints('DISPUTE_IDENTIFIED');

  assert(constraints.requiresValidation === true, 'Should require validation');
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

