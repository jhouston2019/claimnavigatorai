/**
 * CARRIER RESPONSE CLASSIFIER TEST SUITE
 * Verifies response classification accuracy
 */

const {
  RESPONSE_TYPE,
  CONFIDENCE_LEVEL,
  classifyCarrierResponse,
  requiresAction,
  getResponseTypeDescription,
  validateClassification
} = require('../app/assets/js/intelligence/carrier-response-classifier');

function runCarrierResponseClassifierTests() {
  console.log('═'.repeat(80));
  console.log('CARRIER RESPONSE CLASSIFIER TEST SUITE');
  console.log('═'.repeat(80));
  console.log('');

  let passed = 0;
  let failed = 0;

  // TEST 1: Acknowledgment classification
  console.log('Test 1: Acknowledgment → Classified Correctly');
  const test1 = classifyCarrierResponse({
    carrierText: 'We have received your claim and assigned claim number 12345. An adjuster will be in contact shortly.',
    carrierEstimate: null,
    responseDocuments: []
  });

  if (test1.responseType === RESPONSE_TYPE.ACKNOWLEDGMENT && test1.indicators.length > 0) {
    console.log('✅ PASSED - Acknowledgment classified');
    console.log('   Indicators:', test1.indicators.length);
    passed++;
  } else {
    console.log('❌ FAILED - Should have classified as acknowledgment');
    console.log('   Got:', test1.responseType);
    failed++;
  }

  // TEST 2: Full approval classification
  console.log('\nTest 2: Full Approval → Classified Correctly');
  const test2 = classifyCarrierResponse({
    carrierText: 'Your claim has been approved in full. Payment of $15,000 has been issued.',
    carrierEstimate: { total: 15000 },
    responseDocuments: [{ type: 'payment', amount: 15000 }]
  });

  if (test2.responseType === RESPONSE_TYPE.FULL_APPROVAL && 
      test2.confidence === CONFIDENCE_LEVEL.HIGH) {
    console.log('✅ PASSED - Full approval classified with high confidence');
    passed++;
  } else {
    console.log('❌ FAILED - Should have classified as full approval');
    console.log('   Got:', test2.responseType, test2.confidence);
    failed++;
  }

  // TEST 3: Partial approval classification
  console.log('\nTest 3: Partial Approval → Classified Correctly');
  const test3 = classifyCarrierResponse({
    carrierText: 'We have approved a partial payment for some items in your claim.',
    carrierEstimate: { total: 8000 },
    responseDocuments: []
  });

  if (test3.responseType === RESPONSE_TYPE.PARTIAL_APPROVAL) {
    console.log('✅ PASSED - Partial approval classified');
    passed++;
  } else {
    console.log('❌ FAILED - Should have classified as partial approval');
    failed++;
  }

  // TEST 4: Scope reduction classification
  console.log('\nTest 4: Scope Reduction → Classified Correctly');
  const test4 = classifyCarrierResponse({
    carrierText: 'Several line items have been removed from coverage as they are not included under your policy.',
    carrierEstimate: { total: 5000 },
    responseDocuments: []
  });

  if (test4.responseType === RESPONSE_TYPE.SCOPE_REDUCTION) {
    console.log('✅ PASSED - Scope reduction classified');
    passed++;
  } else {
    console.log('❌ FAILED - Should have classified as scope reduction');
    failed++;
  }

  // TEST 5: Denial classification
  console.log('\nTest 5: Denial → Classified Correctly');
  const test5 = classifyCarrierResponse({
    carrierText: 'Your claim has been denied as the damage is not covered under your policy.',
    carrierEstimate: null,
    responseDocuments: [{ type: 'denial_letter' }]
  });

  if (test5.responseType === RESPONSE_TYPE.DENIAL && 
      test5.confidence === CONFIDENCE_LEVEL.HIGH) {
    console.log('✅ PASSED - Denial classified with high confidence');
    passed++;
  } else {
    console.log('❌ FAILED - Should have classified as denial');
    failed++;
  }

  // TEST 6: Request for information classification
  console.log('\nTest 6: Request for Information → Classified Correctly');
  const test6 = classifyCarrierResponse({
    carrierText: 'We need additional information to process your claim. Please provide receipts for all contents items.',
    carrierEstimate: null,
    responseDocuments: [{ type: 'information_request' }]
  });

  if (test6.responseType === RESPONSE_TYPE.REQUEST_FOR_INFORMATION) {
    console.log('✅ PASSED - RFI classified');
    passed++;
  } else {
    console.log('❌ FAILED - Should have classified as RFI');
    failed++;
  }

  // TEST 7: Delay classification
  console.log('\nTest 7: Delay → Classified Correctly');
  const test7 = classifyCarrierResponse({
    carrierText: 'We require additional time to complete our investigation. The review has been extended.',
    carrierEstimate: null,
    responseDocuments: []
  });

  if (test7.responseType === RESPONSE_TYPE.DELAY) {
    console.log('✅ PASSED - Delay classified');
    passed++;
  } else {
    console.log('❌ FAILED - Should have classified as delay');
    failed++;
  }

  // TEST 8: Non-response classification
  console.log('\nTest 8: Non-Response → Classified Correctly');
  const test8 = classifyCarrierResponse({
    carrierText: '',
    carrierEstimate: null,
    responseDocuments: []
  });

  if (test8.responseType === RESPONSE_TYPE.NON_RESPONSE && 
      test8.confidence === CONFIDENCE_LEVEL.HIGH) {
    console.log('✅ PASSED - Non-response classified');
    passed++;
  } else {
    console.log('❌ FAILED - Should have classified as non-response');
    failed++;
  }

  // TEST 9: Ambiguous response with limitations
  console.log('\nTest 9: Ambiguous Response → Has Limitations');
  const test9 = classifyCarrierResponse({
    carrierText: 'Your claim is under review.',
    carrierEstimate: { total: 10000 },
    responseDocuments: []
  });

  if (test9.limitations.length > 0) {
    console.log('✅ PASSED - Ambiguous response flagged with limitations');
    console.log('   Limitations:', test9.limitations);
    passed++;
  } else {
    console.log('❌ FAILED - Should have flagged limitations');
    failed++;
  }

  // TEST 10: Action required check
  console.log('\nTest 10: Action Required → Correctly Identified');
  const test10a = requiresAction({
    responseType: RESPONSE_TYPE.REQUEST_FOR_INFORMATION
  });
  
  const test10b = requiresAction({
    responseType: RESPONSE_TYPE.ACKNOWLEDGMENT
  });

  if (test10a.actionRequired && !test10b.actionRequired) {
    console.log('✅ PASSED - Action requirements correctly identified');
    console.log('   RFI requires action:', test10a.actionRequired);
    console.log('   Acknowledgment requires action:', test10b.actionRequired);
    passed++;
  } else {
    console.log('❌ FAILED - Action requirements incorrect');
    failed++;
  }

  // TEST 11: Response type descriptions
  console.log('\nTest 11: Response Type Descriptions → Generated');
  const test11 = getResponseTypeDescription(RESPONSE_TYPE.FULL_APPROVAL);

  if (test11 && test11.length > 0) {
    console.log('✅ PASSED - Description generated');
    console.log('   Description:', test11);
    passed++;
  } else {
    console.log('❌ FAILED - Description not generated');
    failed++;
  }

  // TEST 12: Classification validation
  console.log('\nTest 12: Classification Validation → Working');
  const test12a = validateClassification({
    responseType: RESPONSE_TYPE.FULL_APPROVAL,
    confidence: CONFIDENCE_LEVEL.HIGH,
    indicators: ['Payment issued'],
    limitations: []
  });

  const test12b = validateClassification({
    responseType: null,
    confidence: null,
    indicators: []
  });

  if (test12a.valid && !test12b.valid && test12b.issues.length > 0) {
    console.log('✅ PASSED - Validation working correctly');
    console.log('   Valid classification:', test12a.valid);
    console.log('   Invalid classification:', test12b.valid);
    passed++;
  } else {
    console.log('❌ FAILED - Validation not working correctly');
    failed++;
  }

  // TEST 13: Deterministic classification
  console.log('\nTest 13: Deterministic Classification → Identical Output');
  const input = {
    carrierText: 'Your claim has been approved in full.',
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

  // Summary
  console.log('\n' + '═'.repeat(80));
  console.log('TEST SUMMARY');
  console.log('═'.repeat(80));
  console.log(`Total: 13`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log('');

  if (failed === 0) {
    console.log('🎉 ALL TESTS PASSED! Carrier response classifier working correctly.');
  } else {
    console.log('⚠️ SOME TESTS FAILED. Review failures above.');
  }
  console.log('═'.repeat(80));

  return { passed, failed };
}

// Run if executed directly
if (require.main === module) {
  const results = runCarrierResponseClassifierTests();
  process.exit(results.failed > 0 ? 1 : 0);
}

module.exports = { runCarrierResponseClassifierTests };

