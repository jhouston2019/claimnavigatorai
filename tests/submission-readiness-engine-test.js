/**
 * SUBMISSION READINESS ENGINE TEST SUITE
 * Verifies submission safety and completeness checks
 */

const { CLAIM_STATE } = require('../app/assets/js/intelligence/claim-state-machine');
const {
  SUBMISSION_TYPE,
  evaluateSubmissionReadiness,
  evaluateDocumentSafety,
  validateSubmissionTiming,
  getReadinessSummary
} = require('../app/assets/js/intelligence/submission-readiness-engine');

function runSubmissionReadinessTests() {
  console.log('═'.repeat(80));
  console.log('SUBMISSION READINESS ENGINE TEST SUITE');
  console.log('═'.repeat(80));
  console.log('');

  let passed = 0;
  let failed = 0;

  // TEST 1: Incomplete estimate → blocked
  console.log('Test 1: Incomplete Estimate → Blocked');
  const test1 = evaluateSubmissionReadiness({
    claimState: CLAIM_STATE.SUBMISSION_READY,
    completedSteps: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    estimates: [{
      id: 'est-1',
      status: 'incomplete',
      lineItems: []
    }],
    photos: [{ id: 'photo-1' }],
    policyDocs: [{ id: 'policy-1' }],
    priorCarrierDocs: [],
    contentsInventory: [],
    aleDocs: []
  });

  if (!test1.ready && test1.blockingIssues.some(i => i.includes('incomplete'))) {
    console.log('✅ PASSED - Incomplete estimate blocked');
    console.log('   Blocking issues:', test1.blockingIssues);
    passed++;
  } else {
    console.log('❌ FAILED - Should have blocked incomplete estimate');
    failed++;
  }

  // TEST 2: Missing photos → blocked
  console.log('\nTest 2: Missing Photos → Blocked');
  const test2 = evaluateSubmissionReadiness({
    claimState: CLAIM_STATE.SUBMISSION_READY,
    completedSteps: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    estimates: [{
      id: 'est-1',
      status: 'complete',
      lineItems: [{ item: 'Replace roof', qty: 1 }]
    }],
    photos: [],  // No photos
    policyDocs: [{ id: 'policy-1' }],
    priorCarrierDocs: [],
    contentsInventory: [],
    aleDocs: []
  });

  if (!test2.ready && test2.blockingIssues.some(i => i.includes('photos'))) {
    console.log('✅ PASSED - Missing photos blocked');
    console.log('   Blocking issues:', test2.blockingIssues);
    passed++;
  } else {
    console.log('❌ FAILED - Should have blocked missing photos');
    failed++;
  }

  // TEST 3: ALE docs incomplete → holdback
  console.log('\nTest 3: ALE Docs Incomplete → Holdback');
  const test3 = evaluateSubmissionReadiness({
    claimState: CLAIM_STATE.SUBMISSION_READY,
    completedSteps: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    estimates: [{
      id: 'est-1',
      status: 'complete',
      lineItems: [{ item: 'Replace roof', qty: 1 }]
    }],
    photos: [{ id: 'photo-1' }],
    policyDocs: [{ id: 'policy-1' }],
    priorCarrierDocs: [],
    contentsInventory: [],
    aleDocs: [
      { id: 'ale-1', type: 'expense', status: 'incomplete' }
    ]
  });

  if (!test3.ready && test3.holdbacks.some(h => h.includes('ALE'))) {
    console.log('✅ PASSED - ALE docs incomplete flagged as holdback');
    console.log('   Holdbacks:', test3.holdbacks);
    passed++;
  } else {
    console.log('❌ FAILED - Should have flagged ALE as holdback');
    failed++;
  }

  // TEST 4: Fully complete claim → ready
  console.log('\nTest 4: Fully Complete Claim → Ready');
  const test4 = evaluateSubmissionReadiness({
    claimState: CLAIM_STATE.SUBMISSION_READY,
    completedSteps: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    estimates: [{
      id: 'est-1',
      status: 'complete',
      lineItems: [
        { item: 'Replace roof', qty: 1, cost: 5000 },
        { item: 'Replace siding', qty: 1, cost: 3000 }
      ]
    }],
    photos: [
      { id: 'photo-1', type: 'damage' },
      { id: 'photo-2', type: 'damage' }
    ],
    policyDocs: [{ id: 'policy-1', type: 'declarations' }],
    priorCarrierDocs: [],
    contentsInventory: [],
    aleDocs: []
  });

  if (test4.ready && test4.blockingIssues.length === 0 && test4.holdbacks.length === 0) {
    console.log('✅ PASSED - Complete claim marked as ready');
    console.log('   Allowed submission types:', test4.allowedSubmissionTypes);
    passed++;
  } else {
    console.log('❌ FAILED - Should have marked claim as ready');
    console.log('   Ready:', test4.ready);
    console.log('   Blocking:', test4.blockingIssues);
    console.log('   Holdbacks:', test4.holdbacks);
    failed++;
  }

  // TEST 5: Deterministic repeat run → identical output
  console.log('\nTest 5: Deterministic Repeat Run → Identical Output');
  const input = {
    claimState: CLAIM_STATE.SUBMISSION_READY,
    completedSteps: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    estimates: [{
      id: 'est-1',
      status: 'complete',
      lineItems: [{ item: 'Test', qty: 1 }]
    }],
    photos: [{ id: 'photo-1' }],
    policyDocs: [{ id: 'policy-1' }],
    priorCarrierDocs: [],
    contentsInventory: [],
    aleDocs: []
  };

  const run1 = evaluateSubmissionReadiness(input);
  const run2 = evaluateSubmissionReadiness(input);
  const run3 = evaluateSubmissionReadiness(input);

  const identical = 
    run1.ready === run2.ready && run2.ready === run3.ready &&
    run1.blockingIssues.length === run2.blockingIssues.length &&
    run2.blockingIssues.length === run3.blockingIssues.length &&
    run1.holdbacks.length === run2.holdbacks.length &&
    run2.holdbacks.length === run3.holdbacks.length;

  if (identical) {
    console.log('✅ PASSED - Three runs produced identical results');
    console.log('   Ready:', run1.ready, run2.ready, run3.ready);
    passed++;
  } else {
    console.log('❌ FAILED - Non-deterministic output');
    failed++;
  }

  // TEST 6: Draft estimate → blocked
  console.log('\nTest 6: Draft Estimate → Blocked');
  const test6 = evaluateSubmissionReadiness({
    claimState: CLAIM_STATE.SUBMISSION_READY,
    completedSteps: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    estimates: [{
      id: 'est-1',
      status: 'draft',
      isDraft: true,
      lineItems: [{ item: 'Replace roof', qty: 1 }]
    }],
    photos: [{ id: 'photo-1' }],
    policyDocs: [{ id: 'policy-1' }],
    priorCarrierDocs: [],
    contentsInventory: [],
    aleDocs: []
  });

  if (!test6.ready && test6.blockingIssues.some(i => i.includes('draft'))) {
    console.log('✅ PASSED - Draft estimate blocked');
    passed++;
  } else {
    console.log('❌ FAILED - Should have blocked draft estimate');
    failed++;
  }

  // TEST 7: Wrong claim state → blocked
  console.log('\nTest 7: Wrong Claim State → Blocked');
  const test7 = evaluateSubmissionReadiness({
    claimState: CLAIM_STATE.DOCUMENT_COLLECTION,  // Wrong state
    completedSteps: [1, 2, 3],
    estimates: [{
      id: 'est-1',
      status: 'complete',
      lineItems: [{ item: 'Replace roof', qty: 1 }]
    }],
    photos: [{ id: 'photo-1' }],
    policyDocs: [{ id: 'policy-1' }],
    priorCarrierDocs: [],
    contentsInventory: [],
    aleDocs: []
  });

  if (!test7.ready && test7.blockingIssues.some(i => i.includes('state'))) {
    console.log('✅ PASSED - Wrong claim state blocked');
    passed++;
  } else {
    console.log('❌ FAILED - Should have blocked wrong state');
    failed++;
  }

  // TEST 8: Document safety check
  console.log('\nTest 8: Document Safety Check');
  const test8a = evaluateDocumentSafety({
    id: 'doc-1',
    name: 'estimate.pdf',
    type: 'estimate',
    status: 'draft'
  });

  const test8b = evaluateDocumentSafety({
    id: 'doc-2',
    name: 'estimate.pdf',
    type: 'estimate',
    status: 'complete'
  });

  if (!test8a.safe && test8a.issues.length > 0 && test8b.safe) {
    console.log('✅ PASSED - Document safety correctly evaluated');
    console.log('   Draft doc safe:', test8a.safe);
    console.log('   Complete doc safe:', test8b.safe);
    passed++;
  } else {
    console.log('❌ FAILED - Document safety check incorrect');
    failed++;
  }

  // TEST 9: Submission timing validation
  console.log('\nTest 9: Submission Timing Validation');
  const test9 = validateSubmissionTiming({
    claimState: CLAIM_STATE.SUBMITTED,
    lastSubmissionDate: '2026-01-01',
    carrierResponseDate: null,
    daysElapsed: 3
  });

  if (!test9.timingAppropriate && test9.issues.some(i => i.includes('pending'))) {
    console.log('✅ PASSED - Timing validation working');
    console.log('   Issues:', test9.issues);
    passed++;
  } else {
    console.log('❌ FAILED - Should have flagged timing issue');
    failed++;
  }

  // TEST 10: Readiness summary generation
  console.log('\nTest 10: Readiness Summary Generation');
  const test10 = getReadinessSummary({
    ready: false,
    blockingIssues: ['Missing photos', 'Draft estimate'],
    holdbacks: ['ALE incomplete'],
    riskFlags: []
  });

  if (test10.includes('not ready') && test10.includes('blocking')) {
    console.log('✅ PASSED - Summary generated correctly');
    console.log('   Summary:', test10);
    passed++;
  } else {
    console.log('❌ FAILED - Summary incorrect');
    failed++;
  }

  // TEST 11: Contents inventory without photos → holdback
  console.log('\nTest 11: Contents Inventory Without Photos → Holdback');
  const test11 = evaluateSubmissionReadiness({
    claimState: CLAIM_STATE.SUBMISSION_READY,
    completedSteps: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    estimates: [{
      id: 'est-1',
      status: 'complete',
      lineItems: [{ item: 'Replace roof', qty: 1 }]
    }],
    photos: [{ id: 'photo-1' }],
    policyDocs: [{ id: 'policy-1' }],
    priorCarrierDocs: [],
    contentsInventory: [
      { id: 'item-1', description: 'TV', rcv: 500, acv: 400, photos: [] }
    ],
    aleDocs: []
  });

  if (!test11.ready && test11.holdbacks.some(h => h.includes('Contents'))) {
    console.log('✅ PASSED - Contents without photos flagged');
    passed++;
  } else {
    console.log('❌ FAILED - Should have flagged contents inventory');
    failed++;
  }

  // TEST 12: Missing required steps → blocked
  console.log('\nTest 12: Missing Required Steps → Blocked');
  const test12 = evaluateSubmissionReadiness({
    claimState: CLAIM_STATE.SUBMISSION_READY,
    completedSteps: [1, 2, 3],  // Missing steps 4-10
    estimates: [{
      id: 'est-1',
      status: 'complete',
      lineItems: [{ item: 'Replace roof', qty: 1 }]
    }],
    photos: [{ id: 'photo-1' }],
    policyDocs: [{ id: 'policy-1' }],
    priorCarrierDocs: [],
    contentsInventory: [],
    aleDocs: []
  });

  if (!test12.ready && test12.blockingIssues.some(i => i.includes('steps'))) {
    console.log('✅ PASSED - Missing steps blocked');
    passed++;
  } else {
    console.log('❌ FAILED - Should have blocked missing steps');
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
    console.log('🎉 ALL TESTS PASSED! Submission readiness engine working correctly.');
  } else {
    console.log('⚠️ SOME TESTS FAILED. Review failures above.');
  }
  console.log('═'.repeat(80));

  return { passed, failed };
}

// Run if executed directly
if (require.main === module) {
  const results = runSubmissionReadinessTests();
  process.exit(results.failed > 0 ? 1 : 0);
}

module.exports = { runSubmissionReadinessTests };

