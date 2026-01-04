/**
 * CLAIM STATE MACHINE TEST SUITE
 * Verifies state transition logic and step locking
 */

const ClaimStateMachine = require('../app/assets/js/intelligence/claim-state-machine');

const { 
  CLAIM_STATE,
  validateTransition,
  checkStateReadiness,
  transitionState,
  getAvailableTransitions,
  inferStateFromSteps,
  isStepAllowed
} = ClaimStateMachine;

function runStateMachineTests() {
  console.log('═'.repeat(80));
  console.log('CLAIM STATE MACHINE TEST SUITE');
  console.log('═'.repeat(80));
  console.log('');

  let passed = 0;
  let failed = 0;

  // TEST 1: Valid transition
  console.log('Test 1: Valid Transition (INTAKE → DOCUMENT_COLLECTION)');
  const test1 = validateTransition(CLAIM_STATE.INTAKE, CLAIM_STATE.DOCUMENT_COLLECTION);
  if (test1.valid) {
    console.log('✅ PASSED');
    passed++;
  } else {
    console.log('❌ FAILED');
    failed++;
  }

  // TEST 2: Invalid transition
  console.log('\nTest 2: Invalid Transition (INTAKE → SUBMITTED)');
  const test2 = validateTransition(CLAIM_STATE.INTAKE, CLAIM_STATE.SUBMITTED);
  if (!test2.valid) {
    console.log('✅ PASSED - Correctly blocked invalid transition');
    passed++;
  } else {
    console.log('❌ FAILED - Should have blocked transition');
    failed++;
  }

  // TEST 3: Step requirements check
  console.log('\nTest 3: Step Requirements (ESTIMATE_REVIEWED requires steps 1-5)');
  const test3 = checkStateReadiness(CLAIM_STATE.ESTIMATE_REVIEWED, [1, 2, 3, 4, 5]);
  if (test3.ready) {
    console.log('✅ PASSED - All required steps completed');
    passed++;
  } else {
    console.log('❌ FAILED');
    console.log('   Missing steps:', test3.missingSteps);
    failed++;
  }

  // TEST 4: Incomplete steps
  console.log('\nTest 4: Incomplete Steps (ESTIMATE_REVIEWED with only steps 1-3)');
  const test4 = checkStateReadiness(CLAIM_STATE.ESTIMATE_REVIEWED, [1, 2, 3]);
  if (!test4.ready && test4.missingSteps.length === 2) {
    console.log('✅ PASSED - Correctly identified missing steps:', test4.missingSteps);
    passed++;
  } else {
    console.log('❌ FAILED');
    failed++;
  }

  // TEST 5: Full transition with validation
  console.log('\nTest 5: Full Transition (DOCUMENT_COLLECTION → ESTIMATE_REVIEWED)');
  const test5 = transitionState({
    currentState: CLAIM_STATE.DOCUMENT_COLLECTION,
    nextState: CLAIM_STATE.ESTIMATE_REVIEWED,
    completedSteps: [1, 2, 3, 4, 5],
    userId: 'test-user',
    claimId: 'test-claim',
    reason: 'Estimates reviewed'
  });
  if (test5.success && test5.newState === CLAIM_STATE.ESTIMATE_REVIEWED) {
    console.log('✅ PASSED - Transition successful');
    passed++;
  } else {
    console.log('❌ FAILED');
    console.log('   Error:', test5.error);
    failed++;
  }

  // TEST 6: Blocked transition (missing steps)
  console.log('\nTest 6: Blocked Transition (missing required steps)');
  const test6 = transitionState({
    currentState: CLAIM_STATE.DOCUMENT_COLLECTION,
    nextState: CLAIM_STATE.ESTIMATE_REVIEWED,
    completedSteps: [1, 2],  // Missing steps 3, 4, 5
    userId: 'test-user',
    claimId: 'test-claim'
  });
  if (!test6.success && test6.error === 'Required steps not completed') {
    console.log('✅ PASSED - Correctly blocked due to missing steps');
    passed++;
  } else {
    console.log('❌ FAILED - Should have blocked transition');
    failed++;
  }

  // TEST 7: Infer state from steps
  console.log('\nTest 7: Infer State from Completed Steps');
  const test7a = inferStateFromSteps([1, 2, 3]);
  const test7b = inferStateFromSteps([1, 2, 3, 4, 5]);
  const test7c = inferStateFromSteps([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  
  if (test7a === CLAIM_STATE.DOCUMENT_COLLECTION &&
      test7b === CLAIM_STATE.ESTIMATE_REVIEWED &&
      test7c === CLAIM_STATE.SUBMISSION_READY) {
    console.log('✅ PASSED');
    console.log('   Steps 1-3:', test7a);
    console.log('   Steps 1-5:', test7b);
    console.log('   Steps 1-10:', test7c);
    passed++;
  } else {
    console.log('❌ FAILED');
    failed++;
  }

  // TEST 8: Available transitions
  console.log('\nTest 8: Get Available Transitions');
  const test8 = getAvailableTransitions(CLAIM_STATE.ESTIMATE_REVIEWED, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  if (test8.readyTransitions.some(t => t.state === CLAIM_STATE.SUBMISSION_READY)) {
    console.log('✅ PASSED - SUBMISSION_READY is available');
    console.log('   Ready transitions:', test8.readyTransitions.map(t => t.state));
    passed++;
  } else {
    console.log('❌ FAILED');
    failed++;
  }

  // TEST 9: Step locking
  console.log('\nTest 9: Step Locking (step 13 not allowed in DOCUMENT_COLLECTION)');
  const test9 = isStepAllowed(13, CLAIM_STATE.DOCUMENT_COLLECTION);
  if (!test9.allowed) {
    console.log('✅ PASSED - Step 13 correctly blocked');
    console.log('   Reason:', test9.reason);
    passed++;
  } else {
    console.log('❌ FAILED - Should have blocked step 13');
    failed++;
  }

  // TEST 10: Reversible transitions
  console.log('\nTest 10: Reversible Transition (ESTIMATE_REVIEWED → DOCUMENT_COLLECTION)');
  const test10 = validateTransition(CLAIM_STATE.ESTIMATE_REVIEWED, CLAIM_STATE.DOCUMENT_COLLECTION);
  if (test10.valid) {
    console.log('✅ PASSED - Backward transition allowed');
    passed++;
  } else {
    console.log('❌ FAILED - Should allow going back');
    failed++;
  }

  // TEST 11: Terminal state
  console.log('\nTest 11: Terminal State (CLOSED has no outgoing transitions)');
  const test11 = getAvailableTransitions(CLAIM_STATE.CLOSED, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
  if (test11.availableTransitions.length === 0) {
    console.log('✅ PASSED - CLOSED is terminal state');
    passed++;
  } else {
    console.log('❌ FAILED - CLOSED should have no outgoing transitions');
    failed++;
  }

  // TEST 12: Explicit logging
  console.log('\nTest 12: Transition Audit Trail');
  const test12 = transitionState({
    currentState: CLAIM_STATE.SUBMITTED,
    nextState: CLAIM_STATE.CARRIER_RESPONSE_RECEIVED,
    completedSteps: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    userId: 'user-123',
    claimId: 'claim-456',
    reason: 'Carrier response received on 2026-01-03'
  });
  if (test12.success && test12.transition.userId === 'user-123' && test12.transition.reason) {
    console.log('✅ PASSED - Audit trail captured');
    console.log('   Transition:', JSON.stringify(test12.transition, null, 2));
    passed++;
  } else {
    console.log('❌ FAILED');
    failed++;
  }

  // Summary
  console.log('\n' + '═'.repeat(80));
  console.log('TEST SUMMARY');
  console.log('═'.repeat(80));
  console.log(`Total: 12`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log('');

  if (failed === 0) {
    console.log('🎉 ALL TESTS PASSED! State machine is working correctly.');
  } else {
    console.log('⚠️ SOME TESTS FAILED. Review failures above.');
  }
  console.log('═'.repeat(80));

  return { passed, failed };
}

// Run if executed directly
if (require.main === module) {
  const results = runStateMachineTests();
  process.exit(results.failed > 0 ? 1 : 0);
}

module.exports = { runStateMachineTests };

