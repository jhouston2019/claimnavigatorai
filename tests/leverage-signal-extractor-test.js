/**
 * TEST SUITE: LEVERAGE SIGNAL EXTRACTOR
 * Tests factual signal extraction without strategy or tactics
 */

const { extractLeverageSignals, SIGNAL_TYPE, filterSignalsByType, getSignalSummary, validateSignal, validateExtraction } = require('../app/assets/js/intelligence/leverage-signal-extractor.js');

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

console.log('\n🧪 LEVERAGE SIGNAL EXTRACTOR TESTS\n');

// Test 1: Extracts omitted line items
test('Extracts OMITTED_LINE_ITEMS signals', () => {
  const result = extractLeverageSignals({
    estimateDelta: {
      removedLineItems: [
        { lineNumber: 1, description: 'Roof replacement', amount: 5000 },
        { lineNumber: 2, description: 'Siding repair', amount: 3000 }
      ]
    }
  });

  const omittedSignals = filterSignalsByType(result, SIGNAL_TYPE.OMITTED_LINE_ITEMS);
  assert(omittedSignals.length === 2, 'Should extract 2 omitted line item signals');
  assert(result.signalCount === 2, 'Signal count should be 2');
});

// Test 2: Extracts inconsistent estimates
test('Extracts INCONSISTENT_ESTIMATES signals', () => {
  const result = extractLeverageSignals({
    estimateDelta: {
      reducedQuantities: [
        { lineNumber: 1, description: 'Paint', before: 10, after: 5 }
      ]
    }
  });

  const inconsistentSignals = filterSignalsByType(result, SIGNAL_TYPE.INCONSISTENT_ESTIMATES);
  assert(inconsistentSignals.length === 1, 'Should extract 1 inconsistent estimate signal');
});

// Test 3: Extracts unsupported scope reduction
test('Extracts UNSUPPORTED_SCOPE_REDUCTION signals', () => {
  const result = extractLeverageSignals({
    estimateDelta: {
      categoryOmissions: [
        { category: 'Electrical', affectedItemCount: 3, issue: 'Category not present' }
      ]
    }
  });

  const scopeSignals = filterSignalsByType(result, SIGNAL_TYPE.UNSUPPORTED_SCOPE_REDUCTION);
  assert(scopeSignals.length === 1, 'Should extract 1 scope reduction signal');
});

// Test 4: Extracts repeated satisfied RFI
test('Extracts REPEATED_SATISFIED_RFI signals', () => {
  const result = extractLeverageSignals({
    estimateDelta: {},
    carrierResponse: {
      responseType: 'REQUEST_FOR_INFORMATION',
      carrierText: 'Please provide documentation for roof damage and photos'
    },
    submissionHistory: [
      {
        type: 'information_response',
        date: '2024-01-01',
        itemsProvided: ['roof damage documentation', 'roof photos']
      }
    ]
  });

  const rfiSignals = filterSignalsByType(result, SIGNAL_TYPE.REPEATED_SATISFIED_RFI);
  assert(rfiSignals.length > 0, 'Should extract repeated RFI signal');
});

// Test 5: Extracts timeline violations
test('Extracts TIMELINE_VIOLATION signals', () => {
  const result = extractLeverageSignals({
    estimateDelta: {},
    claimTimeline: {
      submissionDate: '2024-01-01',
      responseDate: '2024-02-15',
      expectedResponseDays: 30
    }
  });

  const timelineSignals = filterSignalsByType(result, SIGNAL_TYPE.TIMELINE_VIOLATION);
  assert(timelineSignals.length === 1, 'Should extract timeline violation signal');
});

// Test 6: No signals when no issues
test('Returns empty signals when no issues detected', () => {
  const result = extractLeverageSignals({
    estimateDelta: {
      removedLineItems: [],
      reducedQuantities: [],
      categoryOmissions: []
    }
  });

  assert(result.signalCount === 0, 'Should have 0 signals');
  assert(result.signals.length === 0, 'Signals array should be empty');
});

// Test 7: Signal structure validation
test('Signals have required structure', () => {
  const result = extractLeverageSignals({
    estimateDelta: {
      removedLineItems: [
        { lineNumber: 1, description: 'Test item', amount: 1000 }
      ]
    }
  });

  const signal = result.signals[0];
  assert(signal.type, 'Signal should have type');
  assert(signal.description, 'Signal should have description');
  assert(signal.source, 'Signal should have source');
  assert(signal.evidence, 'Signal should have evidence');
  assert(signal.detectedAt, 'Signal should have detectedAt timestamp');
});

// Test 8: Factual descriptions only
test('Signal descriptions are factual only', () => {
  const result = extractLeverageSignals({
    estimateDelta: {
      removedLineItems: [
        { lineNumber: 1, description: 'Roof repair', amount: 5000 }
      ]
    }
  });

  const signal = result.signals[0];
  const prohibitedWords = ['should', 'must', 'recommend', 'advise', 'negotiate', 'leverage', 'use this'];
  
  const hasProhibited = prohibitedWords.some(word =>
    signal.description.toLowerCase().includes(word)
  );
  
  assert(!hasProhibited, 'Signal description should not contain strategy language');
});

// Test 9: Source-backed evidence
test('All signals are source-backed', () => {
  const result = extractLeverageSignals({
    estimateDelta: {
      removedLineItems: [{ lineNumber: 1, description: 'Item A', amount: 1000 }],
      reducedQuantities: [{ lineNumber: 2, description: 'Item B', before: 10, after: 5 }]
    }
  });

  result.signals.forEach(signal => {
    assert(signal.source, 'Each signal must have a source');
    assert(signal.evidence, 'Each signal must have evidence');
  });
});

// Test 10: Signal validation
test('Validates signals correctly', () => {
  const validSignal = {
    type: SIGNAL_TYPE.OMITTED_LINE_ITEMS,
    description: 'Line item not present',
    source: 'estimate_delta',
    evidence: { lineNumber: 1 }
  };

  const validation = validateSignal(validSignal);
  assert(validation.valid === true, 'Valid signal should pass validation');
});

// Test 11: Extraction validation
test('Validates extraction correctly', () => {
  const result = extractLeverageSignals({
    estimateDelta: {
      removedLineItems: [
        { lineNumber: 1, description: 'Item A', amount: 1000 }
      ]
    }
  });

  const validation = validateExtraction(result);
  assert(validation.valid === true, 'Valid extraction should pass validation');
});

// Test 12: Signal summary generation
test('Generates signal summary', () => {
  const result = extractLeverageSignals({
    estimateDelta: {
      removedLineItems: [{ lineNumber: 1, description: 'Item A', amount: 1000 }],
      reducedQuantities: [{ lineNumber: 2, description: 'Item B', before: 10, after: 5 }]
    }
  });

  const summary = getSignalSummary(result);
  assert(typeof summary === 'string', 'Summary should be a string');
  assert(summary.length > 0, 'Summary should not be empty');
});

// Test 13: Determinism
test('Determinism: Same input → same output', () => {
  const input = {
    estimateDelta: {
      removedLineItems: [
        { lineNumber: 1, description: 'Test item', amount: 1000 }
      ]
    }
  };

  const result1 = extractLeverageSignals(input);
  const result2 = extractLeverageSignals(input);

  assert(result1.signalCount === result2.signalCount, 'Signal count should match');
  assert(result1.signalTypes.length === result2.signalTypes.length, 'Signal types should match');
});

// Test 14: Multiple signal types
test('Handles multiple signal types', () => {
  const result = extractLeverageSignals({
    estimateDelta: {
      removedLineItems: [{ lineNumber: 1, description: 'Item A', amount: 1000 }],
      reducedQuantities: [{ lineNumber: 2, description: 'Item B', before: 10, after: 5 }],
      categoryOmissions: [{ category: 'Electrical', affectedItemCount: 2, issue: 'Missing' }]
    }
  });

  assert(result.signalTypes.length === 3, 'Should have 3 different signal types');
  assert(result.signalCount === 3, 'Should have 3 total signals');
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

