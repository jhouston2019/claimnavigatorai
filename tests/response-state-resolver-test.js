/**
 * RESPONSE STATE RESOLVER TEST SUITE
 * Verifies state transition resolution accuracy
 */

const { CLAIM_STATE } = require('../app/assets/js/intelligence/claim-state-machine');
const { RESPONSE_TYPE } = require('../app/assets/js/intelligence/carrier-response-classifier');
const {
  resolveNextState,
  checkSupplementEligibility,
  checkEscalationEligibility,
  getAvailableActions,
  validateStateResolution
} = require('../app/assets/js/intelligence/response-state-resolver');

function runResponseStateResolverTests() {
  console.log('═'.repeat(80));
  console.log('RESPONSE STATE RESOLVER TEST SUITE');
  console.log('═'.repeat(80));
  console.log('');

  let passed = 0;
  let failed = 0;

  // TEST 1: Full approval → Closed
  console.log('Test 1: Full Approval → Closed');
  const test1 = resolveNextState({
    currentState: CLAIM_STATE.SUBMITTED,
    responseClassification: {
      responseType: RESPONSE_TYPE.FULL_APPROVAL
    }
  });

  if (test1.nextState === CLAIM_STATE.CLOSED && test1.allowed) {
    console.log('✅ PASSED - Full approval transitions to closed');
    passed++;
  } else {
    console.log('❌ FAILED - Should transition to closed');
    console.log('   Next state:', test1.nextState);
    console.log('   Allowed:', test1.allowed);
    failed++;
  }

  // TEST 2: Partial approval → Response received
  console.log('\nTest 2: Partial Approval → Response Received');
  const test2 = resolveNextState({
    currentState: CLAIM_STATE.SUBMITTED,
    responseClassification: {
      responseType: RESPONSE_TYPE.PARTIAL_APPROVAL
    }
  });

  if (test2.nextState === CLAIM_STATE.CARRIER_RESPONSE_RECEIVED && test2.allowed) {
    console.log('✅ PASSED - Partial approval transitions correctly');
    passed++;
  } else {
    console.log('❌ FAILED - Should transition to response received');
    failed++;
  }

  // TEST 3: Scope reduction → Response received (then dispute)
  console.log('\nTest 3: Scope Reduction → Response Received');
  const test3 = resolveNextState({
    currentState: CLAIM_STATE.SUBMITTED,
    responseClassification: {
      responseType: RESPONSE_TYPE.SCOPE_REDUCTION
    }
  });

  if (test3.nextState === CLAIM_STATE.CARRIER_RESPONSE_RECEIVED && test3.allowed) {
    console.log('✅ PASSED - Scope reduction transitions to response received');
    passed++;
  } else {
    console.log('❌ FAILED - Should transition to response received first');
    console.log('   Next state:', test3.nextState);
    failed++;
  }

  // TEST 4: Denial → Response received (then dispute/escalation)
  console.log('\nTest 4: Denial → Response Received');
  const test4 = resolveNextState({
    currentState: CLAIM_STATE.SUBMITTED,
    responseClassification: {
      responseType: RESPONSE_TYPE.DENIAL
    }
  });

  if (test4.nextState === CLAIM_STATE.CARRIER_RESPONSE_RECEIVED && test4.allowed) {
    console.log('✅ PASSED - Denial transitions to response received');
    passed++;
  } else {
    console.log('❌ FAILED - Should transition to response received first');
    console.log('   Next state:', test4.nextState);
    failed++;
  }

  // TEST 5: Acknowledgment → No state change
  console.log('\nTest 5: Acknowledgment → No State Change');
  const test5 = resolveNextState({
    currentState: CLAIM_STATE.SUBMITTED,
    responseClassification: {
      responseType: RESPONSE_TYPE.ACKNOWLEDGMENT
    }
  });

  if (test5.nextState === CLAIM_STATE.SUBMITTED && 
      test5.blockingReasons.length > 0) {
    console.log('✅ PASSED - Acknowledgment does not change state');
    console.log('   Blocking reasons:', test5.blockingReasons);
    passed++;
  } else {
    console.log('❌ FAILED - Should not change state');
    failed++;
  }

  // TEST 6: RFI → No state change
  console.log('\nTest 6: Request for Information → No State Change');
  const test6 = resolveNextState({
    currentState: CLAIM_STATE.SUBMITTED,
    responseClassification: {
      responseType: RESPONSE_TYPE.REQUEST_FOR_INFORMATION
    }
  });

  if (test6.nextState === CLAIM_STATE.SUBMITTED && 
      test6.blockingReasons.some(r => r.includes('Information request'))) {
    console.log('✅ PASSED - RFI does not change state');
    passed++;
  } else {
    console.log('❌ FAILED - Should not change state for RFI');
    failed++;
  }

  // TEST 7: Scope regression forces dispute
  console.log('\nTest 7: Scope Regression → Forces Dispute');
  const test7 = resolveNextState({
    currentState: CLAIM_STATE.SUBMITTED,
    responseClassification: {
      responseType: RESPONSE_TYPE.PARTIAL_APPROVAL
    },
    scopeRegression: {
      regressionDetected: true,
      regressionType: 'LINE_ITEM_REMOVAL'
    }
  });

  if (test7.nextState === CLAIM_STATE.DISPUTE_IDENTIFIED) {
    console.log('✅ PASSED - Scope regression forces dispute state');
    passed++;
  } else {
    console.log('❌ FAILED - Should force dispute state');
    console.log('   Next state:', test7.nextState);
    failed++;
  }

  // TEST 8: Supplement eligibility check
  console.log('\nTest 8: Supplement Eligibility → Checked');
  const test8a = checkSupplementEligibility({
    currentState: CLAIM_STATE.DISPUTE_IDENTIFIED,
    scopeRegression: null,
    responseClassification: null
  });

  const test8b = checkSupplementEligibility({
    currentState: CLAIM_STATE.INTAKE,
    scopeRegression: null,
    responseClassification: null
  });

  if (test8a.eligible && !test8b.eligible) {
    console.log('✅ PASSED - Supplement eligibility correct');
    console.log('   Dispute state eligible:', test8a.eligible);
    console.log('   Intake state eligible:', test8b.eligible);
    passed++;
  } else {
    console.log('❌ FAILED - Supplement eligibility incorrect');
    failed++;
  }

  // TEST 9: Escalation eligibility check
  console.log('\nTest 9: Escalation Eligibility → Checked');
  const test9a = checkEscalationEligibility({
    currentState: CLAIM_STATE.DISPUTE_IDENTIFIED,
    responseClassification: null
  });

  const test9b = checkEscalationEligibility({
    currentState: CLAIM_STATE.INTAKE,
    responseClassification: null
  });

  if (test9a.eligible && !test9b.eligible) {
    console.log('✅ PASSED - Escalation eligibility correct');
    passed++;
  } else {
    console.log('❌ FAILED - Escalation eligibility incorrect');
    failed++;
  }

  // TEST 10: Available actions generated
  console.log('\nTest 10: Available Actions → Generated');
  const test10 = getAvailableActions({
    currentState: CLAIM_STATE.DISPUTE_IDENTIFIED,
    responseClassification: {
      responseType: RESPONSE_TYPE.SCOPE_REDUCTION
    },
    scopeRegression: {
      regressionDetected: true
    }
  });

  if (test10.length > 0 && 
      test10.some(a => a.action === 'PREPARE_SUPPLEMENT')) {
    console.log('✅ PASSED - Available actions generated');
    console.log('   Actions:', test10.map(a => a.action));
    passed++;
  } else {
    console.log('❌ FAILED - Should generate available actions');
    failed++;
  }

  // Summary
  console.log('\n' + '═'.repeat(80));
  console.log('TEST SUMMARY');
  console.log('═'.repeat(80));
  console.log(`Total: 10`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log('');

  if (failed === 0) {
    console.log('🎉 ALL TESTS PASSED! Response state resolver working correctly.');
  } else {
    console.log('⚠️ SOME TESTS FAILED. Review failures above.');
  }
  console.log('═'.repeat(80));

  return { passed, failed };
}

// Run if executed directly
if (require.main === module) {
  const results = runResponseStateResolverTests();
  process.exit(results.failed > 0 ? 1 : 0);
}

module.exports = { runResponseStateResolverTests };

