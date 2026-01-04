/**
 * PHASE 4 INTEGRATION TEST SUITE
 * Comprehensive integration tests for Negotiation Intelligence Engine
 */

const { classifyNegotiationPosture } = require('../app/assets/js/intelligence/negotiation-posture-classifier.js');
const { extractLeverageSignals } = require('../app/assets/js/intelligence/leverage-signal-extractor.js');
const { checkBoundaries, comprehensiveBoundaryCheck } = require('../app/assets/js/intelligence/negotiation-boundary-enforcer.js');
const { synthesizeNegotiationIntelligence, validateIntelligence } = require('../app/assets/js/intelligence/negotiation-intelligence-synthesizer.js');
const { validateTransition } = require('../app/assets/js/intelligence/claim-state-machine.js');

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
// INTEGRATION TEST SUITE
// ============================================================================

console.log('\n🧪 PHASE 4 INTEGRATION TESTS\n');

// Test 1: Full flow - Administrative posture
test('Integration: Administrative posture flow', () => {
  const carrierResponse = {
    responseType: 'ACKNOWLEDGMENT',
    carrierText: 'We have received your claim.',
    confidence: 'HIGH'
  };

  const posture = classifyNegotiationPosture({
    carrierResponse,
    claimState: 'SUBMITTED',
    estimateDelta: null,
    scopeRegression: null
  });

  const signals = extractLeverageSignals({
    estimateDelta: {},
    carrierResponse,
    submissionHistory: [],
    claimTimeline: {}
  });

  const intelligence = synthesizeNegotiationIntelligence({
    carrierResponse,
    estimateDelta: {},
    scopeRegression: {},
    claimState: 'SUBMITTED',
    submissionHistory: [],
    claimTimeline: {}
  });

  assert(posture.postureType === 'ADMINISTRATIVE', 'Should classify as administrative');
  assert(signals.signalCount === 0, 'Should have no signals');
  assert(intelligence.summary, 'Should generate intelligence summary');
});

// Test 2: Full flow - Scope reduction with signals
test('Integration: Scope reduction with leverage signals', () => {
  const carrierResponse = {
    responseType: 'SCOPE_REDUCTION',
    carrierText: 'Scope reduced.',
    confidence: 'HIGH'
  };

  const estimateDelta = {
    removedLineItems: [
      { lineNumber: 1, description: 'Roof replacement', amount: 5000 },
      { lineNumber: 2, description: 'Siding repair', amount: 3000 }
    ],
    reducedQuantities: [],
    categoryOmissions: [
      { category: 'Electrical', affectedItemCount: 3, issue: 'Not present' }
    ]
  };

  const scopeRegression = {
    regressionDetected: true,
    regressionType: 'MIXED',
    evidence: ['Line items removed', 'Category omitted']
  };

  const posture = classifyNegotiationPosture({
    carrierResponse,
    claimState: 'CARRIER_RESPONSE_RECEIVED',
    estimateDelta,
    scopeRegression
  });

  const signals = extractLeverageSignals({
    estimateDelta,
    carrierResponse,
    submissionHistory: [],
    claimTimeline: {}
  });

  const intelligence = synthesizeNegotiationIntelligence({
    carrierResponse,
    estimateDelta,
    scopeRegression,
    claimState: 'CARRIER_RESPONSE_RECEIVED',
    submissionHistory: [],
    claimTimeline: {}
  });

  assert(posture.postureType === 'SCOPE_REDUCTION', 'Should classify as scope reduction');
  assert(signals.signalCount === 3, 'Should extract 3 signals (2 omitted + 1 category)');
  assert(intelligence.observations.length > 0, 'Should generate observations');
  
  const validation = validateIntelligence(intelligence);
  assert(validation.valid === true, 'Intelligence should be valid');
});

// Test 3: Boundary enforcement blocks advice requests
test('Integration: Boundary enforcement prevents advice', () => {
  const boundaryCheck = checkBoundaries({
    userRequest: 'What should I say to negotiate better?'
  });

  assert(boundaryCheck.allowed === false, 'Should block advice request');
  assert(boundaryCheck.refusalReason, 'Should provide refusal reason');
});

// Test 4: State machine integration - validates transitions
test('Integration: State machine prevents invalid transitions', () => {
  const currentState = 'SUBMITTED';
  const invalidTransition = validateTransition(currentState, 'DISPUTE_IDENTIFIED');

  assert(invalidTransition.valid === false, 'Should block invalid transition');
  assert(invalidTransition.error, 'Should provide blocking reason');
});

// Test 5: Lowball posture with timeline violation
test('Integration: Lowball posture with timeline signal', () => {
  const carrierResponse = {
    responseType: 'PARTIAL_APPROVAL',
    carrierText: 'Approved with reduced amounts.',
    confidence: 'HIGH'
  };

  const estimateDelta = {
    removedLineItems: [],
    reducedQuantities: [
      { lineNumber: 1, description: 'Paint', before: 10, after: 3 },
      { lineNumber: 2, description: 'Flooring', before: 500, after: 100 }
    ],
    categoryOmissions: [],
    valuationChangesPresent: true
  };

  const claimTimeline = {
    submissionDate: '2024-01-01',
    responseDate: '2024-03-01',
    expectedResponseDays: 30
  };

  const posture = classifyNegotiationPosture({
    carrierResponse,
    claimState: 'CARRIER_RESPONSE_RECEIVED',
    estimateDelta,
    scopeRegression: { regressionDetected: true }
  });

  const signals = extractLeverageSignals({
    estimateDelta,
    carrierResponse,
    submissionHistory: [],
    claimTimeline
  });

  assert(posture.postureType === 'LOWBALL', 'Should classify as lowball');
  assert(signals.signalCount === 3, 'Should have 2 quantity + 1 timeline signals');
  
  const timelineSignals = signals.signals.filter(s => s.type === 'TIMELINE_VIOLATION');
  assert(timelineSignals.length === 1, 'Should detect timeline violation');
});

// Test 6: Repeated RFI detection
test('Integration: Repeated satisfied RFI detection', () => {
  const carrierResponse = {
    responseType: 'REQUEST_FOR_INFORMATION',
    carrierText: 'Please provide roof damage documentation and photos.',
    confidence: 'HIGH'
  };

  const submissionHistory = [
    {
      type: 'information_response',
      date: '2024-01-15',
      itemsProvided: ['roof damage documentation', 'roof damage photos']
    }
  ];

  const signals = extractLeverageSignals({
    estimateDelta: {},
    carrierResponse,
    submissionHistory,
    claimTimeline: {}
  });

  const rfiSignals = signals.signals.filter(s => s.type === 'REPEATED_SATISFIED_RFI');
  assert(rfiSignals.length > 0, 'Should detect repeated RFI');
});

// Test 7: Comprehensive boundary check with output validation
test('Integration: Comprehensive boundary check', () => {
  const result = comprehensiveBoundaryCheck({
    userRequest: 'What line items are missing?',
    generatedOutput: 'Line items 1, 3, and 5 are not present in the carrier estimate.'
  });

  assert(result.passed === true, 'Clean content should pass');
  assert(result.requestAllowed === true, 'Request should be allowed');
  assert(result.outputValid === true, 'Output should be valid');
});

// Test 8: Determinism across full pipeline
test('Integration: Full pipeline determinism', () => {
  const input = {
    carrierResponse: {
      responseType: 'PARTIAL_APPROVAL',
      carrierText: 'Partial approval.',
      confidence: 'HIGH'
    },
    estimateDelta: {
      removedLineItems: [{ lineNumber: 1, description: 'Item A', amount: 1000 }],
      reducedQuantities: [],
      categoryOmissions: []
    },
    scopeRegression: {
      regressionDetected: true,
      regressionType: 'LINE_ITEM_REMOVAL',
      evidence: ['Item A removed']
    },
    claimState: 'CARRIER_RESPONSE_RECEIVED',
    submissionHistory: [],
    claimTimeline: {}
  };

  const intel1 = synthesizeNegotiationIntelligence(input);
  const intel2 = synthesizeNegotiationIntelligence(input);

  assert(intel1.posture.postureType === intel2.posture.postureType, 'Posture should match');
  assert(intel1.signals.signalCount === intel2.signals.signalCount, 'Signal count should match');
  assert(intel1.observations.length === intel2.observations.length, 'Observation count should match');
});

// Test 9: No advice in full synthesis
test('Integration: No advice in synthesized intelligence', () => {
  const intelligence = synthesizeNegotiationIntelligence({
    carrierResponse: {
      responseType: 'DENIAL',
      carrierText: 'Claim denied.',
      confidence: 'HIGH'
    },
    estimateDelta: {},
    scopeRegression: {},
    claimState: 'CARRIER_RESPONSE_RECEIVED',
    submissionHistory: [],
    claimTimeline: {}
  });

  const prohibitedWords = ['should', 'must', 'recommend', 'advise', 'negotiate', 'demand'];
  const summaryText = intelligence.summary.toLowerCase();

  prohibitedWords.forEach(word => {
    assert(!summaryText.includes(word), `Summary should not contain: ${word}`);
  });
});

// Test 10: State constraints prevent automatic escalation
test('Integration: State constraints block automatic escalation', () => {
  const intelligence = synthesizeNegotiationIntelligence({
    carrierResponse: {
      responseType: 'DENIAL',
      carrierText: 'Denied.',
      confidence: 'HIGH'
    },
    estimateDelta: {},
    scopeRegression: {},
    claimState: 'ESCALATION_CONSIDERED',
    submissionHistory: [],
    claimTimeline: {}
  });

  const blockedActions = intelligence.stateConstraints.blockedActions;
  assert(blockedActions.includes('automatic_escalation'), 'Should block automatic escalation');
});

// Test 11: Multiple signal types in one response
test('Integration: Multiple signal types extracted', () => {
  const estimateDelta = {
    removedLineItems: [{ lineNumber: 1, description: 'Item A', amount: 1000 }],
    reducedQuantities: [{ lineNumber: 2, description: 'Item B', before: 10, after: 5 }],
    categoryOmissions: [{ category: 'Electrical', affectedItemCount: 2, issue: 'Missing' }]
  };

  const signals = extractLeverageSignals({
    estimateDelta,
    carrierResponse: { responseType: 'SCOPE_REDUCTION' },
    submissionHistory: [],
    claimTimeline: {}
  });

  assert(signals.signalTypes.length === 3, 'Should have 3 signal types');
  assert(signals.signalCount === 3, 'Should have 3 total signals');
});

// Test 12: Validation catches prohibited language
test('Integration: Validation catches prohibited language', () => {
  const badIntelligence = {
    summary: 'You should negotiate with them.',
    posture: { postureType: 'DELAY' },
    signals: { signalCount: 0 },
    observations: [],
    stateConstraints: { currentState: 'SUBMITTED' }
  };

  const validation = validateIntelligence(badIntelligence);
  assert(validation.valid === false, 'Should detect prohibited language');
  assert(validation.issues.length > 0, 'Should have validation issues');
});

// Test 13: Stalling posture with repeated RFI
test('Integration: Stalling posture detection', () => {
  const carrierResponse = {
    responseType: 'REQUEST_FOR_INFORMATION',
    carrierText: 'Need more info.',
    confidence: 'HIGH'
  };

  const posture = classifyNegotiationPosture({
    carrierResponse,
    claimState: 'RESUBMITTED',
    estimateDelta: null,
    scopeRegression: null
  });

  assert(posture.postureType === 'STALLING', 'Should classify as stalling');
});

// Test 14: Technical denial posture
test('Integration: Technical denial classification', () => {
  const carrierResponse = {
    responseType: 'DENIAL',
    carrierText: 'Claim denied due to policy exclusion.',
    confidence: 'HIGH'
  };

  const posture = classifyNegotiationPosture({
    carrierResponse,
    claimState: 'CARRIER_RESPONSE_RECEIVED',
    estimateDelta: null,
    scopeRegression: null
  });

  const intelligence = synthesizeNegotiationIntelligence({
    carrierResponse,
    estimateDelta: {},
    scopeRegression: {},
    claimState: 'CARRIER_RESPONSE_RECEIVED',
    submissionHistory: [],
    claimTimeline: {}
  });

  assert(posture.postureType === 'TECHNICAL_DENIAL', 'Should classify as technical denial');
  assert(intelligence.posture.postureType === 'TECHNICAL_DENIAL', 'Intelligence should reflect denial');
});

// Test 15: Empty response handling
test('Integration: Handles empty/minimal responses', () => {
  const intelligence = synthesizeNegotiationIntelligence({
    carrierResponse: {
      responseType: 'NON_RESPONSE',
      confidence: 'MEDIUM'
    },
    estimateDelta: {},
    scopeRegression: {},
    claimState: 'SUBMITTED',
    submissionHistory: [],
    claimTimeline: {}
  });

  assert(intelligence.summary, 'Should generate summary even with minimal data');
  assert(intelligence.signals.signalCount === 0, 'Should have no signals');
  
  const validation = validateIntelligence(intelligence);
  assert(validation.valid === true, 'Should still be valid');
});

// ============================================================================
// RESULTS
// ============================================================================

console.log(`\n📊 Results: ${passCount}/${testCount} tests passed\n`);

if (passCount === testCount) {
  console.log('✅ ALL PHASE 4 INTEGRATION TESTS PASSED\n');
  process.exit(0);
} else {
  console.log('❌ SOME INTEGRATION TESTS FAILED\n');
  process.exit(1);
}

