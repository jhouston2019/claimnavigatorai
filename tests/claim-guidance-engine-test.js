/**
 * TEST SUITE: CLAIM GUIDANCE ENGINE
 * Tests guidance generation without auto-execution
 */

const {
  generateClaimGuidance,
  generatePolicyExplanation,
  generateCoverageAnalysis,
  generateNextSteps,
  analyzeCarrierResponse,
  explainLeverage,
  assessRisks,
  generateOptions
} = require('../app/assets/js/intelligence/claim-guidance-engine.js');

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

console.log('\n🧪 CLAIM GUIDANCE ENGINE TESTS\n');

// Test 1: Generates complete guidance
test('Generates complete guidance output', () => {
  const guidance = generateClaimGuidance({
    claimState: 'ESTIMATE_REVIEWED',
    policyText: 'Dwelling coverage applies to structure damage. Replacement cost value.',
    estimateAnalysis: {
      categories: [
        { name: 'Roofing', itemCount: 5 }
      ]
    }
  });

  assert(guidance.policyExplanation, 'Should have policy explanation');
  assert(guidance.recommendedNextSteps, 'Should have recommended next steps');
  assert(Array.isArray(guidance.disclaimers), 'Should have disclaimers');
  assert(guidance.metadata.requiresUserConfirmation === true, 'Should require user confirmation');
  assert(guidance.metadata.isGuidanceOnly === true, 'Should be guidance only');
});

// Test 2: Policy explanation generated
test('Generates policy explanation', () => {
  const explanation = generatePolicyExplanation(
    'Dwelling coverage includes structure. Replacement cost value applies.',
    { categories: [{ name: 'Roofing' }] }
  );

  assert(explanation.type === 'POLICY_EXPLANATION', 'Should have correct type');
  assert(Array.isArray(explanation.content), 'Should have content array');
  assert(explanation.content.length > 0, 'Should have explanation content');
});

// Test 3: Coverage analysis generated
test('Generates coverage analysis', () => {
  const analysis = generateCoverageAnalysis(
    'Standard dwelling policy',
    {
      categories: [
        { name: 'Roofing' },
        { name: 'Landscaping' }
      ]
    }
  );

  assert(analysis.type === 'COVERAGE_ANALYSIS', 'Should have correct type');
  assert(Array.isArray(analysis.likelyCovered), 'Should have likely covered array');
  assert(Array.isArray(analysis.questionable), 'Should have questionable array');
  assert(Array.isArray(analysis.notes), 'Should have notes');
});

// Test 4: Next steps recommendations
test('Generates next steps recommendations', () => {
  const steps = generateNextSteps({
    claimState: 'ESTIMATE_REVIEWED',
    carrierResponse: null,
    negotiationPosture: null,
    scopeRegression: null
  });

  assert(Array.isArray(steps), 'Should return array');
  assert(steps.length > 0, 'Should have recommended steps');
  assert(steps[0].step, 'Each step should have description');
  assert(steps[0].reason, 'Each step should have reason');
  assert(steps[0].priority, 'Each step should have priority');
});

// Test 5: Carrier response analysis
test('Analyzes carrier response', () => {
  const analysis = analyzeCarrierResponse({
    carrierResponse: {
      responseType: 'PARTIAL_APPROVAL'
    },
    negotiationPosture: {
      postureType: 'SCOPE_REDUCTION'
    },
    scopeRegression: {
      regressionDetected: true,
      regressionType: 'LINE_ITEM_REMOVAL'
    }
  });

  assert(analysis.type === 'CARRIER_RESPONSE_ANALYSIS', 'Should have correct type');
  assert(analysis.posture === 'SCOPE_REDUCTION', 'Should identify posture');
  assert(Array.isArray(analysis.concerns), 'Should have concerns array');
  assert(analysis.concerns.length > 0, 'Should identify concerns');
  assert(analysis.interpretation, 'Should have interpretation');
});

// Test 6: Leverage explanation
test('Explains leverage signals', () => {
  const explanation = explainLeverage({
    signals: [
      {
        type: 'OMITTED_LINE_ITEMS',
        description: 'Line item missing'
      }
    ],
    signalCount: 1
  });

  assert(explanation.type === 'LEVERAGE_EXPLANATION', 'Should have correct type');
  assert(Array.isArray(explanation.signals), 'Should have signals array');
  assert(explanation.signals[0].whyItMatters, 'Should explain why signal matters');
  assert(explanation.context, 'Should have context');
});

// Test 7: Risk assessment
test('Assesses risks', () => {
  const assessment = assessRisks({
    claimState: 'CARRIER_RESPONSE_RECEIVED',
    carrierResponse: { responseType: 'DENIAL' },
    negotiationPosture: { postureType: 'TECHNICAL_DENIAL' }
  });

  assert(assessment.type === 'RISK_ASSESSMENT', 'Should have correct type');
  assert(Array.isArray(assessment.risks), 'Should have risks array');
  assert(Array.isArray(assessment.mitigations), 'Should have mitigations array');
});

// Test 8: Options generation
test('Generates options with tradeoffs', () => {
  const options = generateOptions({
    claimState: 'CARRIER_RESPONSE_RECEIVED',
    carrierResponse: { responseType: 'PARTIAL_APPROVAL' },
    negotiationPosture: { postureType: 'LOWBALL' },
    leverageSignals: { signalCount: 3 }
  });

  assert(Array.isArray(options), 'Should return array');
  assert(options.length > 0, 'Should have options');
  assert(options[0].option, 'Each option should have description');
  assert(Array.isArray(options[0].pros), 'Each option should have pros');
  assert(Array.isArray(options[0].cons), 'Each option should have cons');
});

// Test 9: Disclaimers included
test('Includes appropriate disclaimers', () => {
  const guidance = generateClaimGuidance({
    claimState: 'ESTIMATE_REVIEWED',
    policyText: 'Test policy',
    estimateAnalysis: {}
  });

  assert(Array.isArray(guidance.disclaimers), 'Should have disclaimers');
  assert(guidance.disclaimers.length > 0, 'Should have at least one disclaimer');
  
  const hasInfoDisclaimer = guidance.disclaimers.some(d => 
    d.includes('informational purposes')
  );
  assert(hasInfoDisclaimer, 'Should include informational disclaimer');
});

// Test 10: No auto-execution metadata
test('Metadata confirms no auto-execution', () => {
  const guidance = generateClaimGuidance({
    claimState: 'ESTIMATE_REVIEWED',
    policyText: 'Test',
    estimateAnalysis: {}
  });

  assert(guidance.metadata.requiresUserConfirmation === true, 'Should require confirmation');
  assert(guidance.metadata.isGuidanceOnly === true, 'Should be guidance only');
  assert(guidance.metadata.generatedAt, 'Should have timestamp');
  assert(guidance.metadata.claimState, 'Should record claim state');
});

// Test 11: Determinism
test('Determinism: Same input → same guidance', () => {
  const input = {
    claimState: 'ESTIMATE_REVIEWED',
    policyText: 'Dwelling coverage',
    estimateAnalysis: {
      categories: [{ name: 'Roofing', itemCount: 3 }]
    }
  };

  const guidance1 = generateClaimGuidance(input);
  const guidance2 = generateClaimGuidance(input);

  assert(guidance1.recommendedNextSteps.length === guidance2.recommendedNextSteps.length, 
    'Should generate same number of steps');
  assert(JSON.stringify(guidance1.policyExplanation) === JSON.stringify(guidance2.policyExplanation),
    'Should generate same policy explanation');
});

// Test 12: State-specific recommendations
test('Provides state-specific recommendations', () => {
  const submittedSteps = generateNextSteps({
    claimState: 'CARRIER_RESPONSE_RECEIVED',
    carrierResponse: { responseType: 'SCOPE_REDUCTION' },
    negotiationPosture: { postureType: 'SCOPE_REDUCTION' },
    scopeRegression: { regressionDetected: true }
  });

  assert(submittedSteps.length > 0, 'Should have recommendations for this state');
  
  const hasScopeGuidance = submittedSteps.some(step =>
    step.step.toLowerCase().includes('scope') || 
    step.step.toLowerCase().includes('document')
  );
  assert(hasScopeGuidance, 'Should include scope-specific guidance');
});

// Test 13: Coverage likelihood assessment
test('Assesses coverage likelihood correctly', () => {
  const analysis = generateCoverageAnalysis(
    'Standard policy',
    {
      categories: [
        { name: 'Roofing' },      // Typically covered
        { name: 'Landscaping' },  // Questionable
        { name: 'Cosmetic' }      // Likely excluded
      ]
    }
  );

  assert(analysis.likelyCovered.length > 0 || 
         analysis.questionable.length > 0 || 
         analysis.likelyExcluded.length > 0,
    'Should categorize coverage likelihood');
});

// Test 14: Carrier posture interpretation
test('Interprets carrier posture correctly', () => {
  const analysis = analyzeCarrierResponse({
    carrierResponse: { responseType: 'DELAY' },
    negotiationPosture: { postureType: 'DELAY' },
    scopeRegression: null
  });

  assert(analysis.interpretation, 'Should have interpretation');
  assert(analysis.interpretation.length > 0, 'Interpretation should not be empty');
  assert(analysis.posture === 'DELAY', 'Should identify delay posture');
});

// Test 15: Handles missing optional data
test('Handles missing optional data gracefully', () => {
  const guidance = generateClaimGuidance({
    claimState: 'ESTIMATE_REVIEWED'
    // Missing optional fields
  });

  assert(guidance, 'Should generate guidance');
  assert(guidance.disclaimers, 'Should include disclaimers');
  assert(guidance.metadata, 'Should include metadata');
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

