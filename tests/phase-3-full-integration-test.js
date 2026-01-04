/**
 * PHASE 3 FULL INTEGRATION TEST SUITE
 * End-to-end carrier response ingestion scenarios
 */

const { CLAIM_STATE } = require('../app/assets/js/intelligence/claim-state-machine');
const { classifyCarrierResponse, RESPONSE_TYPE } = require('../app/assets/js/intelligence/carrier-response-classifier');
const { compareEstimates } = require('../app/assets/js/intelligence/estimate-delta-engine');
const { detectScopeRegression } = require('../app/assets/js/intelligence/scope-regression-detector');
const { resolveNextState } = require('../app/assets/js/intelligence/response-state-resolver');

function runPhase3IntegrationTests() {
  console.log('═'.repeat(80));
  console.log('PHASE 3 FULL INTEGRATION TEST SUITE');
  console.log('═'.repeat(80));
  console.log('');

  let passed = 0;
  let failed = 0;

  // TEST 1: Full approval flow
  console.log('Test 1: Full Approval Flow → Complete');
  const test1Classification = classifyCarrierResponse({
    carrierText: 'Your claim has been approved in full. Payment of $10,000 has been issued.',
    carrierEstimate: { total: 10000 },
    responseDocuments: [{ type: 'payment' }]
  });

  const test1State = resolveNextState({
    currentState: CLAIM_STATE.SUBMITTED,
    responseClassification: test1Classification
  });

  if (test1Classification.responseType === RESPONSE_TYPE.FULL_APPROVAL &&
      test1State.nextState === CLAIM_STATE.CLOSED &&
      test1State.allowed) {
    console.log('✅ PASSED - Full approval flow complete');
    passed++;
  } else {
    console.log('❌ FAILED - Full approval flow incomplete');
    failed++;
  }

  // TEST 2: Partial approval with omissions
  console.log('\nTest 2: Partial Approval With Omissions → Detected');
  const test2Classification = classifyCarrierResponse({
    carrierText: 'We have approved a partial payment. Some items were not covered.',
    carrierEstimate: { total: 5000 },
    responseDocuments: []
  });

  const test2Delta = compareEstimates({
    originalEstimate: {
      lineItems: [
        { lineNumber: 1, description: 'Replace roof', amount: 5000 },
        { lineNumber: 2, description: 'Replace windows', amount: 3000 }
      ],
      total: 8000
    },
    carrierEstimate: {
      lineItems: [
        { lineNumber: 1, description: 'Replace roof', amount: 5000 }
      ],
      total: 5000
    }
  });

  const test2Regression = detectScopeRegression({
    submissionPacket: {},
    carrierResponse: test2Classification,
    estimateDelta: test2Delta
  });

  if (test2Classification.responseType === RESPONSE_TYPE.PARTIAL_APPROVAL &&
      test2Delta.scopeRegressionDetected &&
      test2Regression.regressionDetected) {
    console.log('✅ PASSED - Partial approval with omissions detected');
    passed++;
  } else {
    console.log('❌ FAILED - Should detect omissions');
    failed++;
  }

  // TEST 3: Scope reduction with estimate delta
  console.log('\nTest 3: Scope Reduction With Delta → Complete Analysis');
  const test3Classification = classifyCarrierResponse({
    carrierText: 'Several line items have been removed as not covered.',
    carrierEstimate: { total: 3000 },
    responseDocuments: []
  });

  const test3Delta = compareEstimates({
    originalEstimate: {
      lineItems: [
        { lineNumber: 1, description: 'Replace roof', amount: 5000 },
        { lineNumber: 2, description: 'Replace siding', amount: 3000 },
        { lineNumber: 3, description: 'Paint exterior', amount: 1000 }
      ],
      total: 9000
    },
    carrierEstimate: {
      lineItems: [
        { lineNumber: 1, description: 'Replace siding', amount: 3000 }
      ],
      total: 3000
    }
  });

  const test3Regression = detectScopeRegression({
    submissionPacket: {},
    carrierResponse: test3Classification,
    estimateDelta: test3Delta
  });

  const test3State = resolveNextState({
    currentState: CLAIM_STATE.SUBMITTED,
    responseClassification: test3Classification,
    scopeRegression: test3Regression
  });

  if (test3Classification.responseType === RESPONSE_TYPE.SCOPE_REDUCTION &&
      test3Delta.removedLineItems.length >= 2 &&
      test3Regression.regressionDetected &&
      test3State.nextState === CLAIM_STATE.CARRIER_RESPONSE_RECEIVED) {
    console.log('✅ PASSED - Scope reduction analysis complete');
    console.log('   Removed items:', test3Delta.removedLineItems.length);
    passed++;
  } else {
    console.log('❌ FAILED - Scope reduction analysis incomplete');
    failed++;
  }

  // TEST 4: Denial without estimate
  console.log('\nTest 4: Denial Without Estimate → Handled');
  const test4Classification = classifyCarrierResponse({
    carrierText: 'Your claim has been denied as the damage is not covered under your policy.',
    carrierEstimate: null,
    responseDocuments: [{ type: 'denial_letter' }]
  });

  const test4State = resolveNextState({
    currentState: CLAIM_STATE.SUBMITTED,
    responseClassification: test4Classification
  });

  if (test4Classification.responseType === RESPONSE_TYPE.DENIAL &&
      test4Classification.confidence === 'HIGH' &&
      test4State.nextState === CLAIM_STATE.CARRIER_RESPONSE_RECEIVED) {
    console.log('✅ PASSED - Denial without estimate handled');
    passed++;
  } else {
    console.log('❌ FAILED - Should handle denial');
    failed++;
  }

  // TEST 5: RFI response
  console.log('\nTest 5: Request for Information → No State Change');
  const test5Classification = classifyCarrierResponse({
    carrierText: 'We need additional information to process your claim. Please provide receipts.',
    carrierEstimate: null,
    responseDocuments: [{ type: 'information_request' }]
  });

  const test5State = resolveNextState({
    currentState: CLAIM_STATE.SUBMITTED,
    responseClassification: test5Classification
  });

  if (test5Classification.responseType === RESPONSE_TYPE.REQUEST_FOR_INFORMATION &&
      test5State.nextState === CLAIM_STATE.SUBMITTED &&
      test5State.allowed) {  // Staying in same state is allowed
    console.log('✅ PASSED - RFI does not change state');
    passed++;
  } else {
    console.log('❌ FAILED - RFI should not change state');
    console.log('   Next state:', test5State.nextState);
    console.log('   Allowed:', test5State.allowed);
    failed++;
  }

  // TEST 6: Delay response
  console.log('\nTest 6: Delay Response → No State Change');
  const test6Classification = classifyCarrierResponse({
    carrierText: 'We require additional time to complete our investigation.',
    carrierEstimate: null,
    responseDocuments: []
  });

  const test6State = resolveNextState({
    currentState: CLAIM_STATE.SUBMITTED,
    responseClassification: test6Classification
  });

  if (test6Classification.responseType === RESPONSE_TYPE.DELAY &&
      test6State.nextState === CLAIM_STATE.SUBMITTED) {
    console.log('✅ PASSED - Delay does not change state');
    passed++;
  } else {
    console.log('❌ FAILED - Delay should not change state');
    failed++;
  }

  // TEST 7: Invalid state transition blocked
  console.log('\nTest 7: Invalid State Transition → Blocked');
  const test7State = resolveNextState({
    currentState: CLAIM_STATE.CLOSED,
    responseClassification: {
      responseType: RESPONSE_TYPE.PARTIAL_APPROVAL
    }
  });

  // CLOSED state can't transition anywhere except staying CLOSED
  if (test7State.nextState === CLAIM_STATE.CLOSED && test7State.allowed) {
    console.log('✅ PASSED - Closed state remains closed');
    console.log('   Next state:', test7State.nextState);
    passed++;
  } else {
    console.log('❌ FAILED - Closed state handling incorrect');
    console.log('   Next state:', test7State.nextState);
    console.log('   Allowed:', test7State.allowed);
    failed++;
  }

  // TEST 8: Deterministic classification
  console.log('\nTest 8: Deterministic Classification → Verified');
  const input = {
    carrierText: 'Your claim has been approved.',
    carrierEstimate: { total: 10000 },
    responseDocuments: []
  };

  const run1 = classifyCarrierResponse(input);
  const run2 = classifyCarrierResponse(input);
  const run3 = classifyCarrierResponse(input);

  if (run1.responseType === run2.responseType &&
      run2.responseType === run3.responseType &&
      run1.confidence === run2.confidence &&
      run2.confidence === run3.confidence) {
    console.log('✅ PASSED - Classification is deterministic');
    passed++;
  } else {
    console.log('❌ FAILED - Non-deterministic classification');
    failed++;
  }

  // TEST 9: Deterministic delta computation
  console.log('\nTest 9: Deterministic Delta Computation → Verified');
  const deltaInput = {
    originalEstimate: {
      lineItems: [{ lineNumber: 1, description: 'Replace roof', amount: 5000 }],
      total: 5000
    },
    carrierEstimate: {
      lineItems: [{ lineNumber: 1, description: 'Replace roof', amount: 3000 }],
      total: 3000
    }
  };

  const deltaRun1 = compareEstimates(deltaInput);
  const deltaRun2 = compareEstimates(deltaInput);
  const deltaRun3 = compareEstimates(deltaInput);

  if (deltaRun1.valuationChangesPresent === deltaRun2.valuationChangesPresent &&
      deltaRun2.valuationChangesPresent === deltaRun3.valuationChangesPresent) {
    console.log('✅ PASSED - Delta computation is deterministic');
    passed++;
  } else {
    console.log('❌ FAILED - Non-deterministic delta computation');
    failed++;
  }

  // TEST 10: Deterministic state resolution
  console.log('\nTest 10: Deterministic State Resolution → Verified');
  const stateInput = {
    currentState: CLAIM_STATE.SUBMITTED,
    responseClassification: {
      responseType: RESPONSE_TYPE.FULL_APPROVAL
    }
  };

  const stateRun1 = resolveNextState(stateInput);
  const stateRun2 = resolveNextState(stateInput);
  const stateRun3 = resolveNextState(stateInput);

  if (stateRun1.nextState === stateRun2.nextState &&
      stateRun2.nextState === stateRun3.nextState &&
      stateRun1.allowed === stateRun2.allowed &&
      stateRun2.allowed === stateRun3.allowed) {
    console.log('✅ PASSED - State resolution is deterministic');
    passed++;
  } else {
    console.log('❌ FAILED - Non-deterministic state resolution');
    failed++;
  }

  // TEST 11: No prohibited language in outputs
  console.log('\nTest 11: No Prohibited Language → Verified');
  const test11Classification = classifyCarrierResponse({
    carrierText: 'Several items were not covered.',
    carrierEstimate: null,
    responseDocuments: []
  });

  const test11Delta = compareEstimates({
    originalEstimate: {
      lineItems: [{ lineNumber: 1, description: 'Replace roof', amount: 5000 }],
      total: 5000
    },
    carrierEstimate: {
      lineItems: [],
      total: 0
    }
  });

  const test11Regression = detectScopeRegression({
    submissionPacket: {},
    carrierResponse: test11Classification,
    estimateDelta: test11Delta
  });

  const prohibitedWords = ['underpaid', 'owed', 'entitled', 'should have', 'negotiate'];
  const allOutputs = [
    ...test11Classification.indicators,
    ...test11Regression.evidence,
    test11Delta.removedLineItems.map(i => i.description).join(' ')
  ].join(' ').toLowerCase();

  const hasProhibited = prohibitedWords.some(word => allOutputs.includes(word));

  if (!hasProhibited) {
    console.log('✅ PASSED - No prohibited language in outputs');
    passed++;
  } else {
    console.log('❌ FAILED - Prohibited language detected');
    failed++;
  }

  // TEST 12: Scope regression with partial approval
  console.log('\nTest 12: Scope Regression With Partial Approval → Response Received');
  const test12State = resolveNextState({
    currentState: CLAIM_STATE.SUBMITTED,
    responseClassification: {
      responseType: RESPONSE_TYPE.PARTIAL_APPROVAL
    },
    scopeRegression: {
      regressionDetected: true,
      regressionType: 'LINE_ITEM_REMOVAL',
      evidence: ['Item removed']
    }
  });

  // Should go to CARRIER_RESPONSE_RECEIVED, then can move to DISPUTE_IDENTIFIED
  if (test12State.nextState === CLAIM_STATE.CARRIER_RESPONSE_RECEIVED && test12State.allowed) {
    console.log('✅ PASSED - Scope regression handled correctly');
    console.log('   Next state:', test12State.nextState);
    passed++;
  } else {
    console.log('❌ FAILED - Should transition to response received');
    console.log('   Next state:', test12State.nextState);
    console.log('   Allowed:', test12State.allowed);
    failed++;
  }

  // TEST 13: Multi-step state progression
  console.log('\nTest 13: Multi-Step State Progression → Validated');
  const step1 = resolveNextState({
    currentState: CLAIM_STATE.SUBMITTED,
    responseClassification: { responseType: RESPONSE_TYPE.PARTIAL_APPROVAL }
  });

  const step2 = resolveNextState({
    currentState: step1.nextState,
    responseClassification: { responseType: RESPONSE_TYPE.SCOPE_REDUCTION },
    scopeRegression: { regressionDetected: true }
  });

  if (step1.nextState === CLAIM_STATE.CARRIER_RESPONSE_RECEIVED &&
      step2.nextState === CLAIM_STATE.DISPUTE_IDENTIFIED &&
      step1.allowed && step2.allowed) {
    console.log('✅ PASSED - Multi-step progression validated');
    console.log('   Step 1:', step1.nextState);
    console.log('   Step 2:', step2.nextState);
    passed++;
  } else {
    console.log('❌ FAILED - Multi-step progression invalid');
    failed++;
  }

  // TEST 14: Complete end-to-end flow
  console.log('\nTest 14: Complete End-to-End Flow → All Components');
  const e2eClassification = classifyCarrierResponse({
    carrierText: 'We have reviewed your claim. Some items were removed as not covered.',
    carrierEstimate: { total: 4000 },
    responseDocuments: []
  });

  const e2eDelta = compareEstimates({
    originalEstimate: {
      lineItems: [
        { lineNumber: 1, description: 'Replace roof', amount: 5000 },
        { lineNumber: 2, description: 'Replace windows', amount: 2000 }
      ],
      total: 7000
    },
    carrierEstimate: {
      lineItems: [
        { lineNumber: 1, description: 'Replace roof', amount: 4000 }
      ],
      total: 4000
    }
  });

  const e2eRegression = detectScopeRegression({
    submissionPacket: {},
    carrierResponse: e2eClassification,
    estimateDelta: e2eDelta
  });

  const e2eState = resolveNextState({
    currentState: CLAIM_STATE.SUBMITTED,
    responseClassification: e2eClassification,
    scopeRegression: e2eRegression
  });

  if (e2eClassification.responseType &&
      e2eDelta.scopeRegressionDetected &&
      e2eRegression.regressionDetected &&
      e2eState.nextState &&
      e2eState.allowed) {
    console.log('✅ PASSED - Complete end-to-end flow successful');
    console.log('   Classification:', e2eClassification.responseType);
    console.log('   Regression:', e2eRegression.regressionType);
    console.log('   Next state:', e2eState.nextState);
    passed++;
  } else {
    console.log('❌ FAILED - End-to-end flow incomplete');
    failed++;
  }

  // Summary
  console.log('\n' + '═'.repeat(80));
  console.log('TEST SUMMARY');
  console.log('═'.repeat(80));
  console.log(`Total: 14`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log('');

  if (failed === 0) {
    console.log('🎉 ALL INTEGRATION TESTS PASSED! Phase 3 complete.');
  } else {
    console.log('⚠️ SOME TESTS FAILED. Review failures above.');
  }
  console.log('═'.repeat(80));

  return { passed, failed };
}

// Run if executed directly
if (require.main === module) {
  const results = runPhase3IntegrationTests();
  process.exit(results.failed > 0 ? 1 : 0);
}

module.exports = { runPhase3IntegrationTests };

