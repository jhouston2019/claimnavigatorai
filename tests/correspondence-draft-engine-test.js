/**
 * TEST SUITE: CORRESPONDENCE DRAFT ENGINE
 * Tests draft generation without auto-send
 */

const {
  DRAFT_TYPE,
  generateCorrespondenceDraft,
  generateInitialSubmission,
  generateSupplementRequest,
  generateDisputeLetter
} = require('../app/assets/js/intelligence/correspondence-draft-engine.js');

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

console.log('\n🧪 CORRESPONDENCE DRAFT ENGINE TESTS\n');

// Test 1: Generates draft with correct metadata
test('Generates draft with correct metadata', () => {
  const draft = generateCorrespondenceDraft({
    draftType: DRAFT_TYPE.INITIAL_SUBMISSION,
    claimInfo: {
      claimNumber: 'TEST-001',
      insuredName: 'Test User'
    }
  });

  assert(draft.metadata.generatedBy === 'ClaimNavigator', 'Should identify generator');
  assert(draft.metadata.requiresUserReview === true, 'Should require user review');
  assert(draft.metadata.requiresUserConfirmation === true, 'Should require confirmation');
  assert(draft.metadata.executed === false, 'Should not be executed');
  assert(draft.metadata.autoSend === false, 'Should not auto-send');
});

// Test 2: Includes disclaimers
test('Includes appropriate disclaimers', () => {
  const draft = generateCorrespondenceDraft({
    draftType: DRAFT_TYPE.INITIAL_SUBMISSION,
    claimInfo: { claimNumber: 'TEST-001' }
  });

  assert(Array.isArray(draft.disclaimers), 'Should have disclaimers');
  assert(draft.disclaimers.length > 0, 'Should have at least one disclaimer');
  
  const hasDraftDisclaimer = draft.disclaimers.some(d => 
    d.includes('DRAFT')
  );
  assert(hasDraftDisclaimer, 'Should include draft disclaimer');
});

// Test 3: Generates initial submission
test('Generates initial submission letter', () => {
  const letter = generateInitialSubmission(
    {
      claimNumber: 'TEST-001',
      policyNumber: 'POL-123',
      insuredName: 'John Doe',
      propertyAddress: '123 Main St',
      dateOfLoss: '2024-01-01'
    },
    {
      categories: [
        { name: 'Roofing', itemCount: 5 }
      ],
      totals: { grandTotal: 10000 }
    }
  );

  assert(typeof letter === 'string', 'Should return string');
  assert(letter.includes('TEST-001'), 'Should include claim number');
  assert(letter.includes('John Doe'), 'Should include insured name');
  assert(letter.includes('Roofing'), 'Should include categories');
  assert(letter.includes('$10000.00'), 'Should include total');
});

// Test 4: Generates supplement request
test('Generates supplement request letter', () => {
  const letter = generateSupplementRequest(
    { claimNumber: 'TEST-001', insuredName: 'John Doe' },
    { responseType: 'PARTIAL_APPROVAL' },
    {
      signals: [
        {
          type: 'OMITTED_LINE_ITEMS',
          description: 'Roof replacement not included',
          evidence: { amount: 5000 }
        }
      ]
    },
    { regressionDetected: true }
  );

  assert(typeof letter === 'string', 'Should return string');
  assert(letter.includes('Supplemental'), 'Should be supplement request');
  assert(letter.includes('Roof replacement'), 'Should include omitted items');
  assert(letter.includes('$5000.00'), 'Should include amount');
});

// Test 5: Generates dispute letter
test('Generates dispute letter', () => {
  const letter = generateDisputeLetter(
    { claimNumber: 'TEST-001', insuredName: 'John Doe' },
    { responseType: 'SCOPE_REDUCTION' },
    {
      signals: [
        {
          type: 'OMITTED_LINE_ITEMS',
          description: 'Item A missing'
        },
        {
          type: 'INCONSISTENT_ESTIMATES',
          description: 'Quantity reduced'
        }
      ]
    }
  );

  assert(typeof letter === 'string', 'Should return string');
  assert(letter.includes('Dispute'), 'Should be dispute letter');
  assert(letter.includes('Item A missing'), 'Should include leverage signals');
  assert(letter.includes('Quantity reduced'), 'Should include all signals');
});

// Test 6: Generates subject line
test('Generates appropriate subject line', () => {
  const draft = generateCorrespondenceDraft({
    draftType: DRAFT_TYPE.DISPUTE_LETTER,
    claimInfo: {
      claimNumber: 'TEST-001',
      propertyAddress: '123 Main St'
    }
  });

  assert(draft.subject, 'Should have subject');
  assert(draft.subject.includes('TEST-001'), 'Should include claim number');
  assert(draft.subject.includes('Dispute'), 'Should indicate dispute');
});

// Test 7: Suggests attachments
test('Suggests appropriate attachments', () => {
  const draft = generateCorrespondenceDraft({
    draftType: DRAFT_TYPE.INITIAL_SUBMISSION,
    claimInfo: { claimNumber: 'TEST-001' },
    estimateAnalysis: { categories: [] }
  });

  assert(Array.isArray(draft.attachments), 'Should have attachments array');
  assert(draft.attachments.length > 0, 'Should suggest attachments');
  assert(draft.attachments[0].name, 'Each attachment should have name');
  assert(typeof draft.attachments[0].required === 'boolean', 'Should indicate if required');
});

// Test 8: No auto-send flag
test('Never sets auto-send flag', () => {
  const types = [
    DRAFT_TYPE.INITIAL_SUBMISSION,
    DRAFT_TYPE.SUPPLEMENT_REQUEST,
    DRAFT_TYPE.DISPUTE_LETTER,
    DRAFT_TYPE.ESCALATION_LETTER
  ];

  types.forEach(draftType => {
    const draft = generateCorrespondenceDraft({
      draftType,
      claimInfo: { claimNumber: 'TEST-001' }
    });

    assert(draft.metadata.autoSend === false, `${draftType} should not auto-send`);
    assert(draft.metadata.executed === false, `${draftType} should not be executed`);
  });
});

// Test 9: Determinism
test('Determinism: Same input → same draft', () => {
  const input = {
    draftType: DRAFT_TYPE.INITIAL_SUBMISSION,
    claimInfo: {
      claimNumber: 'TEST-001',
      insuredName: 'John Doe'
    },
    estimateAnalysis: {
      categories: [{ name: 'Roofing', itemCount: 3 }],
      totals: { grandTotal: 5000 }
    }
  };

  const draft1 = generateCorrespondenceDraft(input);
  const draft2 = generateCorrespondenceDraft(input);

  assert(draft1.body === draft2.body, 'Body should be identical');
  assert(draft1.subject === draft2.subject, 'Subject should be identical');
});

// Test 10: Handles missing optional data
test('Handles missing optional data gracefully', () => {
  const draft = generateCorrespondenceDraft({
    draftType: DRAFT_TYPE.INITIAL_SUBMISSION,
    claimInfo: { claimNumber: 'TEST-001' }
    // Missing optional fields
  });

  assert(draft.body, 'Should generate body');
  assert(draft.subject, 'Should generate subject');
  assert(draft.metadata, 'Should have metadata');
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

