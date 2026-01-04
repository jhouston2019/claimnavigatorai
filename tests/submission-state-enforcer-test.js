/**
 * SUBMISSION STATE ENFORCER TEST SUITE
 * Verifies state-based submission enforcement
 */

const { CLAIM_STATE } = require('../app/assets/js/intelligence/claim-state-machine');
const {
  SubmissionBlockedError,
  SubmissionStateError,
  validateSubmissionState,
  canSubmit,
  getRequiredActionsForSubmission,
  enforceAndSubmit,
  checkSubmissionAllowed,
  getSubmissionStatus
} = require('../app/assets/js/intelligence/submission-state-enforcer');

function runSubmissionStateEnforcerTests() {
  console.log('═'.repeat(80));
  console.log('SUBMISSION STATE ENFORCER TEST SUITE');
  console.log('═'.repeat(80));
  console.log('');

  let passed = 0;
  let failed = 0;

  // TEST 1: Wrong state throws error
  console.log('Test 1: Wrong State → Throws Error');
  try {
    validateSubmissionState(CLAIM_STATE.INTAKE);
    console.log('❌ FAILED - Should have thrown error for INTAKE state');
    failed++;
  } catch (error) {
    if (error instanceof SubmissionStateError) {
      console.log('✅ PASSED - Wrong state throws SubmissionStateError');
      console.log('   Error:', error.message);
      passed++;
    } else {
      console.log('❌ FAILED - Wrong error type');
      failed++;
    }
  }

  // TEST 2: Correct state passes validation
  console.log('\nTest 2: Correct State → Passes Validation');
  try {
    validateSubmissionState(CLAIM_STATE.SUBMISSION_READY);
    console.log('✅ PASSED - SUBMISSION_READY state validated');
    passed++;
  } catch (error) {
    console.log('❌ FAILED - Should not have thrown error');
    console.log('   Error:', error.message);
    failed++;
  }

  // TEST 3: canSubmit checks state correctly
  console.log('\nTest 3: canSubmit → Checks State Correctly');
  const test3a = canSubmit(CLAIM_STATE.SUBMISSION_READY);
  const test3b = canSubmit(CLAIM_STATE.INTAKE);
  const test3c = canSubmit(CLAIM_STATE.RESUBMITTED);

  if (test3a && !test3b && test3c) {
    console.log('✅ PASSED - canSubmit working correctly');
    console.log('   SUBMISSION_READY:', test3a);
    console.log('   INTAKE:', test3b);
    console.log('   RESUBMITTED:', test3c);
    passed++;
  } else {
    console.log('❌ FAILED - canSubmit not working correctly');
    failed++;
  }

  // TEST 4: Required actions generated correctly
  console.log('\nTest 4: Required Actions → Generated Correctly');
  const test4 = getRequiredActionsForSubmission(
    CLAIM_STATE.DOCUMENT_COLLECTION,
    [1, 2, 3]
  );

  if (test4.length > 0 && test4.some(a => a.includes('steps'))) {
    console.log('✅ PASSED - Required actions generated');
    console.log('   Actions:', test4);
    passed++;
  } else {
    console.log('❌ FAILED - Required actions not generated correctly');
    failed++;
  }

  // TEST 5: Incomplete claim blocked
  console.log('\nTest 5: Incomplete Claim → Blocked');
  try {
    enforceAndSubmit({
      claimId: 'claim-123',
      claimState: CLAIM_STATE.SUBMISSION_READY,
      completedSteps: [1, 2, 3],  // Missing steps
      documents: [],
      estimates: [],
      photos: [],
      policyDocs: [],
      priorCarrierDocs: [],
      contentsInventory: [],
      aleDocs: [],
      submissionType: 'INITIAL_CLAIM',
      claimNumber: 'CLM-001',
      policyNumber: 'POL-001',
      dateOfLoss: '2026-01-01'
    });
    console.log('❌ FAILED - Should have blocked incomplete claim');
    failed++;
  } catch (error) {
    if (error instanceof SubmissionBlockedError) {
      console.log('✅ PASSED - Incomplete claim blocked');
      console.log('   Reason:', error.message);
      passed++;
    } else {
      console.log('❌ FAILED - Wrong error type');
      failed++;
    }
  }

  // TEST 6: Complete claim generates packet
  console.log('\nTest 6: Complete Claim → Generates Packet');
  try {
    const packet = enforceAndSubmit({
      claimId: 'claim-123',
      claimState: CLAIM_STATE.SUBMISSION_READY,
      completedSteps: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      documents: [
        { id: 'doc-1', name: 'estimate.pdf', type: 'estimate', status: 'complete' }
      ],
      estimates: [
        { id: 'est-1', status: 'complete', lineItems: [{ item: 'Test', qty: 1 }] }
      ],
      photos: [{ id: 'photo-1' }],
      policyDocs: [{ id: 'policy-1' }],
      priorCarrierDocs: [],
      contentsInventory: [],
      aleDocs: [],
      submissionType: 'INITIAL_CLAIM',
      claimNumber: 'CLM-001',
      policyNumber: 'POL-001',
      dateOfLoss: '2026-01-01',
      estimateFindings: ['Test finding']
    });

    if (packet && packet.coverNarrative && packet.enforcementMetadata) {
      console.log('✅ PASSED - Complete claim generated packet');
      console.log('   Enforcement metadata present:', !!packet.enforcementMetadata);
      passed++;
    } else {
      console.log('❌ FAILED - Packet incomplete');
      failed++;
    }
  } catch (error) {
    console.log('❌ FAILED - Should not have thrown error');
    console.log('   Error:', error.message);
    failed++;
  }

  // TEST 7: checkSubmissionAllowed works without throwing
  console.log('\nTest 7: checkSubmissionAllowed → No Throw');
  const test7a = checkSubmissionAllowed({
    claimState: CLAIM_STATE.INTAKE,
    completedSteps: [],
    estimates: [],
    photos: [],
    policyDocs: [],
    priorCarrierDocs: [],
    contentsInventory: [],
    aleDocs: []
  });

  const test7b = checkSubmissionAllowed({
    claimState: CLAIM_STATE.SUBMISSION_READY,
    completedSteps: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    estimates: [{ id: 'est-1', status: 'complete', lineItems: [{ item: 'Test', qty: 1 }] }],
    photos: [{ id: 'photo-1' }],
    policyDocs: [{ id: 'policy-1' }],
    priorCarrierDocs: [],
    contentsInventory: [],
    aleDocs: []
  });

  if (!test7a.allowed && test7a.reasons.length > 0 && 
      test7b.allowed && test7b.reasons.length === 0) {
    console.log('✅ PASSED - checkSubmissionAllowed working');
    console.log('   Incomplete allowed:', test7a.allowed);
    console.log('   Complete allowed:', test7b.allowed);
    passed++;
  } else {
    console.log('❌ FAILED - checkSubmissionAllowed not working correctly');
    failed++;
  }

  // TEST 8: getSubmissionStatus provides UI info
  console.log('\nTest 8: getSubmissionStatus → Provides UI Info');
  const test8 = getSubmissionStatus({
    claimState: CLAIM_STATE.DOCUMENT_COLLECTION,
    completedSteps: [1, 2],
    estimates: [],
    photos: [],
    policyDocs: [],
    priorCarrierDocs: [],
    contentsInventory: [],
    aleDocs: []
  });

  if (test8.canSubmit === false &&
      test8.status === 'BLOCKED' &&
      test8.reasons.length > 0 &&
      test8.requiredActions.length > 0) {
    console.log('✅ PASSED - Status info generated');
    console.log('   Status:', test8.status);
    console.log('   Reasons:', test8.reasons.length);
    passed++;
  } else {
    console.log('❌ FAILED - Status info incomplete');
    failed++;
  }

  // TEST 9: Wrong state blocks even with complete data
  console.log('\nTest 9: Wrong State → Blocks Even With Complete Data');
  try {
    enforceAndSubmit({
      claimId: 'claim-123',
      claimState: CLAIM_STATE.INTAKE,  // Wrong state
      completedSteps: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      documents: [
        { id: 'doc-1', name: 'estimate.pdf', type: 'estimate', status: 'complete' }
      ],
      estimates: [
        { id: 'est-1', status: 'complete', lineItems: [{ item: 'Test', qty: 1 }] }
      ],
      photos: [{ id: 'photo-1' }],
      policyDocs: [{ id: 'policy-1' }],
      priorCarrierDocs: [],
      contentsInventory: [],
      aleDocs: [],
      submissionType: 'INITIAL_CLAIM',
      claimNumber: 'CLM-001',
      policyNumber: 'POL-001',
      dateOfLoss: '2026-01-01'
    });
    console.log('❌ FAILED - Should have blocked wrong state');
    failed++;
  } catch (error) {
    if (error instanceof SubmissionBlockedError && error.message.includes('state')) {
      console.log('✅ PASSED - Wrong state blocked even with complete data');
      passed++;
    } else {
      console.log('❌ FAILED - Wrong error or reason');
      failed++;
    }
  }

  // TEST 10: Enforcement metadata captured
  console.log('\nTest 10: Enforcement Metadata → Captured');
  try {
    const packet = enforceAndSubmit({
      claimId: 'claim-123',
      claimState: CLAIM_STATE.SUBMISSION_READY,
      completedSteps: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      documents: [
        { id: 'doc-1', name: 'estimate.pdf', type: 'estimate', status: 'complete' }
      ],
      estimates: [
        { id: 'est-1', status: 'complete', lineItems: [{ item: 'Test', qty: 1 }] }
      ],
      photos: [{ id: 'photo-1' }],
      policyDocs: [{ id: 'policy-1' }],
      priorCarrierDocs: [],
      contentsInventory: [],
      aleDocs: [],
      submissionType: 'INITIAL_CLAIM',
      claimNumber: 'CLM-001',
      policyNumber: 'POL-001',
      dateOfLoss: '2026-01-01'
    });

    if (packet.enforcementMetadata &&
        packet.enforcementMetadata.claimId === 'claim-123' &&
        packet.enforcementMetadata.readinessCheck &&
        packet.enforcementMetadata.stateValidation &&
        packet.enforcementMetadata.packetValidation) {
      console.log('✅ PASSED - Enforcement metadata captured');
      passed++;
    } else {
      console.log('❌ FAILED - Enforcement metadata incomplete');
      failed++;
    }
  } catch (error) {
    console.log('❌ FAILED - Should not have thrown error');
    console.log('   Error:', error.message);
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
    console.log('🎉 ALL TESTS PASSED! Submission state enforcement working correctly.');
  } else {
    console.log('⚠️ SOME TESTS FAILED. Review failures above.');
  }
  console.log('═'.repeat(80));

  return { passed, failed };
}

// Run if executed directly
if (require.main === module) {
  const results = runSubmissionStateEnforcerTests();
  process.exit(results.failed > 0 ? 1 : 0);
}

module.exports = { runSubmissionStateEnforcerTests };

