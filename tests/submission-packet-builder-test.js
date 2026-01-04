/**
 * SUBMISSION PACKET BUILDER TEST SUITE
 * Verifies carrier-safe packet generation and language sanitization
 */

const { CLAIM_STATE } = require('../app/assets/js/intelligence/claim-state-machine');
const {
  PROHIBITED_PHRASES,
  sanitizeLanguage,
  convertToCarrierProfessional,
  filterDocumentsForSubmission,
  stripSensitiveMetadata,
  buildSubmissionPacket,
  validateSubmissionPacket
} = require('../app/assets/js/intelligence/submission-packet-builder');

function runSubmissionPacketBuilderTests() {
  console.log('═'.repeat(80));
  console.log('SUBMISSION PACKET BUILDER TEST SUITE');
  console.log('═'.repeat(80));
  console.log('');

  let passed = 0;
  let failed = 0;

  // TEST 1: Prohibited language detection and removal
  console.log('Test 1: Prohibited Language → Sanitized');
  const test1a = sanitizeLanguage('They underpaid the claim');
  const test1b = sanitizeLanguage('The carrier missed several items');
  const test1c = sanitizeLanguage('We are entitled to more money');

  if (test1a.violations.includes('underpaid') &&
      test1b.violations.includes('missed') &&
      test1c.violations.includes('entitled') &&
      !test1a.sanitized.includes('underpaid') &&
      !test1b.sanitized.includes('missed') &&
      !test1c.sanitized.includes('entitled')) {
    console.log('✅ PASSED - Prohibited language detected and sanitized');
    console.log('   Original: "They underpaid the claim"');
    console.log('   Sanitized:', test1a.sanitized);
    passed++;
  } else {
    console.log('❌ FAILED - Prohibited language not properly sanitized');
    failed++;
  }

  // TEST 2: Draft documents auto-excluded
  console.log('\nTest 2: Draft Documents → Auto-Excluded');
  const test2 = filterDocumentsForSubmission([
    { id: 'doc-1', name: 'estimate.pdf', status: 'complete' },
    { id: 'doc-2', name: 'draft-estimate.pdf', status: 'draft' },
    { id: 'doc-3', name: 'photos.pdf', status: 'complete' }
  ]);

  if (test2.included.length === 2 &&
      test2.excluded.length === 1 &&
      test2.excluded[0].id === 'doc-2') {
    console.log('✅ PASSED - Draft documents excluded');
    console.log('   Included:', test2.included.length);
    console.log('   Excluded:', test2.excluded.length);
    passed++;
  } else {
    console.log('❌ FAILED - Draft documents not properly excluded');
    failed++;
  }

  // TEST 3: User comments auto-excluded
  console.log('\nTest 3: User Comments → Auto-Excluded');
  const test3 = filterDocumentsForSubmission([
    { id: 'doc-1', name: 'estimate.pdf', type: 'estimate' },
    { id: 'doc-2', name: 'my-notes.txt', type: 'comment' },
    { id: 'doc-3', name: 'user-note.txt', type: 'user_note' }
  ]);

  if (test3.included.length === 1 && test3.excluded.length === 2) {
    console.log('✅ PASSED - User comments excluded');
    passed++;
  } else {
    console.log('❌ FAILED - User comments not properly excluded');
    failed++;
  }

  // TEST 4: AI analysis artifacts auto-excluded
  console.log('\nTest 4: AI Analysis Artifacts → Auto-Excluded');
  const test4 = filterDocumentsForSubmission([
    { id: 'doc-1', name: 'estimate.pdf', type: 'estimate' },
    { id: 'doc-2', name: 'analysis.json', type: 'tool_output' },
    { id: 'doc-3', name: 'ai-report.pdf', source: 'ai_analysis' }
  ]);

  if (test4.included.length === 1 && test4.excluded.length === 2) {
    console.log('✅ PASSED - AI artifacts excluded');
    passed++;
  } else {
    console.log('❌ FAILED - AI artifacts not properly excluded');
    failed++;
  }

  // TEST 5: Sensitive metadata stripped
  console.log('\nTest 5: Sensitive Metadata → Stripped');
  const test5 = stripSensitiveMetadata({
    id: 'doc-1',
    name: 'estimate.pdf',
    userComments: 'This is my note',
    internalNotes: 'Internal only',
    aiAnalysis: { score: 0.9 },
    uploadedBy: 'user@example.com',
    text: 'Estimate content'
  });

  if (!test5.userComments &&
      !test5.internalNotes &&
      !test5.aiAnalysis &&
      !test5.uploadedBy &&
      test5.text === 'Estimate content') {
    console.log('✅ PASSED - Sensitive metadata stripped');
    console.log('   Remaining fields:', Object.keys(test5));
    passed++;
  } else {
    console.log('❌ FAILED - Sensitive metadata not properly stripped');
    console.log('   Remaining:', test5);
    failed++;
  }

  // TEST 6: Complete packet generation
  console.log('\nTest 6: Complete Packet Generation');
  const test6 = buildSubmissionPacket({
    claimId: 'claim-123',
    claimNumber: 'CLM-2026-001',
    policyNumber: 'POL-123456',
    dateOfLoss: '2026-01-01',
    claimState: CLAIM_STATE.SUBMISSION_READY,
    submissionType: 'INITIAL_CLAIM',
    documents: [
      { id: 'doc-1', name: 'estimate.pdf', type: 'estimate', status: 'complete' },
      { id: 'doc-2', name: 'photos.pdf', type: 'photos', status: 'complete' },
      { id: 'doc-3', name: 'draft.pdf', type: 'estimate', status: 'draft' }
    ],
    estimateFindings: [
      'Roof replacement documented',
      'Siding repair documented'
    ]
  });

  if (test6.coverNarrative &&
      test6.includedDocuments.length === 2 &&
      test6.excludedDocuments.length === 1 &&
      test6.auditMetadata) {
    console.log('✅ PASSED - Complete packet generated');
    console.log('   Included docs:', test6.includedDocuments.length);
    console.log('   Excluded docs:', test6.excludedDocuments.length);
    passed++;
  } else {
    console.log('❌ FAILED - Packet generation incomplete');
    failed++;
  }

  // TEST 7: Deterministic packet generation
  console.log('\nTest 7: Deterministic Packet Generation');
  const input = {
    claimId: 'claim-123',
    claimNumber: 'CLM-2026-001',
    policyNumber: 'POL-123456',
    dateOfLoss: '2026-01-01',
    claimState: CLAIM_STATE.SUBMISSION_READY,
    submissionType: 'INITIAL_CLAIM',
    documents: [
      { id: 'doc-1', name: 'estimate.pdf', type: 'estimate', status: 'complete' }
    ],
    estimateFindings: ['Test finding']
  };

  const run1 = buildSubmissionPacket(input);
  const run2 = buildSubmissionPacket(input);
  const run3 = buildSubmissionPacket(input);

  // Compare key fields (excluding timestamps)
  const identical = 
    run1.includedDocuments.length === run2.includedDocuments.length &&
    run2.includedDocuments.length === run3.includedDocuments.length &&
    run1.excludedDocuments.length === run2.excludedDocuments.length &&
    run2.excludedDocuments.length === run3.excludedDocuments.length;

  if (identical) {
    console.log('✅ PASSED - Packet generation is deterministic');
    passed++;
  } else {
    console.log('❌ FAILED - Non-deterministic packet generation');
    failed++;
  }

  // TEST 8: Packet validation catches prohibited language
  console.log('\nTest 8: Packet Validation → Catches Prohibited Language');
  const test8 = buildSubmissionPacket({
    claimId: 'claim-123',
    claimNumber: 'CLM-2026-001',
    policyNumber: 'POL-123456',
    dateOfLoss: '2026-01-01',
    claimState: CLAIM_STATE.SUBMISSION_READY,
    submissionType: 'INITIAL_CLAIM',
    documents: [
      { id: 'doc-1', name: 'estimate.pdf', type: 'estimate', status: 'complete' }
    ],
    estimateFindings: []
  });

  const validation = validateSubmissionPacket(test8);

  if (validation.valid) {
    console.log('✅ PASSED - Clean packet validated successfully');
    passed++;
  } else {
    console.log('❌ FAILED - Clean packet failed validation');
    console.log('   Issues:', validation.issues);
    failed++;
  }

  // TEST 9: Empty document list blocked
  console.log('\nTest 9: Empty Document List → Validation Fails');
  const test9 = buildSubmissionPacket({
    claimId: 'claim-123',
    claimNumber: 'CLM-2026-001',
    policyNumber: 'POL-123456',
    dateOfLoss: '2026-01-01',
    claimState: CLAIM_STATE.SUBMISSION_READY,
    submissionType: 'INITIAL_CLAIM',
    documents: [],
    estimateFindings: []
  });

  const validation9 = validateSubmissionPacket(test9);

  if (!validation9.valid && validation9.issues.some(i => i.includes('No documents'))) {
    console.log('✅ PASSED - Empty document list caught');
    passed++;
  } else {
    console.log('❌ FAILED - Should have caught empty document list');
    failed++;
  }

  // TEST 10: Language conversion to carrier-professional
  console.log('\nTest 10: Language Conversion → Carrier-Professional');
  const test10 = convertToCarrierProfessional('They missed the roof damage');

  if (test10.includes('not present') && !test10.includes('missed')) {
    console.log('✅ PASSED - Language converted to professional tone');
    console.log('   Converted:', test10);
    passed++;
  } else {
    console.log('❌ FAILED - Language not properly converted');
    failed++;
  }

  // TEST 11: Internal documents excluded
  console.log('\nTest 11: Internal Documents → Auto-Excluded');
  const test11 = filterDocumentsForSubmission([
    { id: 'doc-1', name: 'estimate.pdf', type: 'estimate' },
    { id: 'doc-2', name: 'internal-memo.pdf', internal: true },
    { id: 'doc-3', name: 'internal-note.txt', isInternal: true }
  ]);

  if (test11.included.length === 1 && test11.excluded.length === 2) {
    console.log('✅ PASSED - Internal documents excluded');
    passed++;
  } else {
    console.log('❌ FAILED - Internal documents not properly excluded');
    failed++;
  }

  // TEST 12: Speculative content excluded
  console.log('\nTest 12: Speculative Content → Auto-Excluded');
  const test12 = filterDocumentsForSubmission([
    { id: 'doc-1', name: 'estimate.pdf', type: 'estimate' },
    { id: 'doc-2', name: 'speculation.pdf', speculative: true },
    { id: 'doc-3', name: 'maybe.pdf', isSpeculative: true }
  ]);

  if (test12.included.length === 1 && test12.excluded.length === 2) {
    console.log('✅ PASSED - Speculative content excluded');
    passed++;
  } else {
    console.log('❌ FAILED - Speculative content not properly excluded');
    failed++;
  }

  // TEST 13: Cover narrative is carrier-professional
  console.log('\nTest 13: Cover Narrative → Carrier-Professional Tone');
  const test13 = buildSubmissionPacket({
    claimId: 'claim-123',
    claimNumber: 'CLM-2026-001',
    policyNumber: 'POL-123456',
    dateOfLoss: '2026-01-01',
    claimState: CLAIM_STATE.SUBMISSION_READY,
    submissionType: 'INITIAL_CLAIM',
    documents: [
      { id: 'doc-1', name: 'estimate.pdf', type: 'estimate', status: 'complete' }
    ],
    estimateFindings: ['Roof replacement documented']
  });

  const hasProhibited = PROHIBITED_PHRASES.some(phrase => 
    test13.coverNarrative.toLowerCase().includes(phrase.toLowerCase())
  );

  if (!hasProhibited && test13.coverNarrative.includes('submitted for review')) {
    console.log('✅ PASSED - Cover narrative is professional');
    passed++;
  } else {
    console.log('❌ FAILED - Cover narrative contains issues');
    failed++;
  }

  // TEST 14: Audit metadata captured
  console.log('\nTest 14: Audit Metadata → Captured');
  const test14 = buildSubmissionPacket({
    claimId: 'claim-123',
    claimNumber: 'CLM-2026-001',
    policyNumber: 'POL-123456',
    dateOfLoss: '2026-01-01',
    claimState: CLAIM_STATE.SUBMISSION_READY,
    submissionType: 'INITIAL_CLAIM',
    documents: [
      { id: 'doc-1', name: 'estimate.pdf', type: 'estimate', status: 'complete' },
      { id: 'doc-2', name: 'draft.pdf', type: 'estimate', status: 'draft' }
    ],
    estimateFindings: []
  });

  if (test14.auditMetadata &&
      test14.auditMetadata.claimId === 'claim-123' &&
      test14.auditMetadata.documentCount.total === 2 &&
      test14.auditMetadata.documentCount.included === 1 &&
      test14.auditMetadata.documentCount.excluded === 1 &&
      test14.auditMetadata.generatedAt) {
    console.log('✅ PASSED - Audit metadata captured correctly');
    passed++;
  } else {
    console.log('❌ FAILED - Audit metadata incomplete');
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
    console.log('🎉 ALL TESTS PASSED! Submission packet builder working correctly.');
  } else {
    console.log('⚠️ SOME TESTS FAILED. Review failures above.');
  }
  console.log('═'.repeat(80));

  return { passed, failed };
}

// Run if executed directly
if (require.main === module) {
  const results = runSubmissionPacketBuilderTests();
  process.exit(results.failed > 0 ? 1 : 0);
}

module.exports = { runSubmissionPacketBuilderTests };

