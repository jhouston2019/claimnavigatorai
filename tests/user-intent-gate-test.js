/**
 * TEST SUITE: USER INTENT GATE
 * Tests execution blocking without confirmation
 */

const {
  ACTION_TYPE,
  CONFIRMATION_LEVEL,
  validateUserIntent,
  requiresConfirmation,
  getConfirmationLevel,
  createConfirmationRequest,
  validateExecutionContext,
  isActionReversible,
  getActionImpact,
  createUserIntent
} = require('../app/assets/js/intelligence/user-intent-gate.js');

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

console.log('\n🧪 USER INTENT GATE TESTS\n');

// Test 1: Guidance actions don't require confirmation
test('Guidance actions do not require confirmation', () => {
  const validation = validateUserIntent({
    actionType: ACTION_TYPE.GENERATE_GUIDANCE,
    userIntent: {}
  });

  assert(validation.allowed === true, 'Should allow guidance without confirmation');
  assert(validation.requiresConfirmation === false, 'Should not require confirmation');
});

// Test 2: Draft generation doesn't require confirmation
test('Draft generation does not require confirmation', () => {
  const validation = validateUserIntent({
    actionType: ACTION_TYPE.GENERATE_DRAFT,
    userIntent: {}
  });

  assert(validation.allowed === true, 'Should allow draft generation');
  assert(validation.requiresConfirmation === false, 'Should not require confirmation');
});

// Test 3: Send correspondence requires confirmation
test('Send correspondence requires confirmation', () => {
  const validation = validateUserIntent({
    actionType: ACTION_TYPE.SEND_CORRESPONDENCE,
    userIntent: {}
  });

  assert(validation.allowed === false, 'Should block without confirmation');
  assert(validation.requiresConfirmation === true, 'Should require confirmation');
  assert(validation.blockingReasons.length > 0, 'Should have blocking reasons');
});

// Test 4: Submit claim requires confirmation
test('Submit claim requires confirmation', () => {
  const validation = validateUserIntent({
    actionType: ACTION_TYPE.SUBMIT_CLAIM,
    userIntent: {}
  });

  assert(validation.allowed === false, 'Should block without confirmation');
  assert(validation.requiresConfirmation === true, 'Should require confirmation');
});

// Test 5: Escalate claim requires confirmation
test('Escalate claim requires confirmation', () => {
  const validation = validateUserIntent({
    actionType: ACTION_TYPE.ESCALATE_CLAIM,
    userIntent: {}
  });

  assert(validation.allowed === false, 'Should block without confirmation');
  assert(validation.requiresConfirmation === true, 'Should require confirmation');
  assert(validation.confirmationLevel === CONFIRMATION_LEVEL.CRITICAL, 'Should be critical level');
});

// Test 6: Confirmed intent allows execution
test('Confirmed intent allows execution', () => {
  const validation = validateUserIntent({
    actionType: ACTION_TYPE.SEND_CORRESPONDENCE,
    userIntent: {
      confirmed: true,
      actionType: ACTION_TYPE.SEND_CORRESPONDENCE
    }
  });

  assert(validation.allowed === true, 'Should allow with confirmation');
  assert(validation.requiresConfirmation === true, 'Should still note confirmation was required');
});

// Test 7: Mismatched action type blocks execution
test('Mismatched action type blocks execution', () => {
  const validation = validateUserIntent({
    actionType: ACTION_TYPE.SEND_CORRESPONDENCE,
    userIntent: {
      confirmed: true,
      actionType: ACTION_TYPE.SUBMIT_CLAIM // Wrong action type
    }
  });

  assert(validation.allowed === false, 'Should block mismatched confirmation');
  assert(validation.blockingReasons.length > 0, 'Should have blocking reason');
});

// Test 8: Confirmation level assignment
test('Assigns correct confirmation levels', () => {
  const criticalLevel = getConfirmationLevel(ACTION_TYPE.ACCEPT_OFFER);
  const standardLevel = getConfirmationLevel(ACTION_TYPE.SEND_CORRESPONDENCE);
  const noneLevel = getConfirmationLevel(ACTION_TYPE.GENERATE_GUIDANCE);

  assert(criticalLevel === CONFIRMATION_LEVEL.CRITICAL, 'Accept offer should be critical');
  assert(standardLevel === CONFIRMATION_LEVEL.STANDARD, 'Send should be standard');
  assert(noneLevel === CONFIRMATION_LEVEL.NONE, 'Guidance should be none');
});

// Test 9: Creates confirmation request
test('Creates confirmation request correctly', () => {
  const request = createConfirmationRequest(
    ACTION_TYPE.SEND_CORRESPONDENCE,
    { draftType: 'DISPUTE_LETTER' }
  );

  assert(request.actionType === ACTION_TYPE.SEND_CORRESPONDENCE, 'Should have action type');
  assert(request.requiresConfirmation === true, 'Should require confirmation');
  assert(request.confirmationPrompt, 'Should have prompt');
  assert(Array.isArray(request.warnings), 'Should have warnings');
  assert(request.createdAt, 'Should have timestamp');
});

// Test 10: Validates execution context
test('Validates execution context', () => {
  const validation = validateExecutionContext({
    actionType: ACTION_TYPE.SUBMIT_CLAIM,
    claimState: 'ESTIMATE_REVIEWED', // Wrong state
    requiredDocuments: ['estimate', 'photos'],
    availableDocuments: ['estimate']
  });

  assert(validation.valid === false, 'Should block wrong state');
  assert(validation.blockingIssues.length > 0, 'Should have blocking issues');
});

// Test 11: Action reversibility check
test('Identifies irreversible actions', () => {
  const sendReversible = isActionReversible(ACTION_TYPE.SEND_CORRESPONDENCE);
  const acceptReversible = isActionReversible(ACTION_TYPE.ACCEPT_OFFER);
  const advanceReversible = isActionReversible(ACTION_TYPE.ADVANCE_STATE);

  assert(sendReversible === false, 'Send should be irreversible');
  assert(acceptReversible === false, 'Accept should be irreversible');
  assert(advanceReversible === true, 'Advance state should be reversible');
});

// Test 12: Action impact assessment
test('Assesses action impact correctly', () => {
  const highImpact = getActionImpact(ACTION_TYPE.ACCEPT_OFFER);
  const mediumImpact = getActionImpact(ACTION_TYPE.SEND_CORRESPONDENCE);
  const lowImpact = getActionImpact(ACTION_TYPE.GENERATE_GUIDANCE);

  assert(highImpact === 'HIGH', 'Accept offer should be high impact');
  assert(mediumImpact === 'MEDIUM', 'Send should be medium impact');
  assert(lowImpact === 'LOW', 'Guidance should be low impact');
});

// Test 13: Creates user intent object
test('Creates user intent object', () => {
  const intent = createUserIntent({
    actionType: ACTION_TYPE.SEND_CORRESPONDENCE,
    confirmed: true,
    reviewed: true,
    userId: 'user123'
  });

  assert(intent.confirmed === true, 'Should be confirmed');
  assert(intent.reviewed === true, 'Should be reviewed');
  assert(intent.actionType === ACTION_TYPE.SEND_CORRESPONDENCE, 'Should have action type');
  assert(intent.confirmedAt, 'Should have confirmation timestamp');
  assert(intent.userId === 'user123', 'Should have user ID');
});

// Test 14: Warns on stale confirmation
test('Warns on stale confirmation', () => {
  const oldDate = new Date();
  oldDate.setMinutes(oldDate.getMinutes() - 10); // 10 minutes ago

  const validation = validateUserIntent({
    actionType: ACTION_TYPE.SEND_CORRESPONDENCE,
    userIntent: {
      confirmed: true,
      actionType: ACTION_TYPE.SEND_CORRESPONDENCE,
      confirmedAt: oldDate.toISOString()
    }
  });

  assert(validation.allowed === true, 'Should still allow');
  assert(validation.warnings.length > 0, 'Should have warning about stale confirmation');
});

// Test 15: All execution actions require confirmation
test('All execution actions require confirmation', () => {
  const executionActions = [
    ACTION_TYPE.SEND_CORRESPONDENCE,
    ACTION_TYPE.SUBMIT_CLAIM,
    ACTION_TYPE.FILE_SUPPLEMENT,
    ACTION_TYPE.ESCALATE_CLAIM,
    ACTION_TYPE.ADVANCE_STATE,
    ACTION_TYPE.ACCEPT_OFFER
  ];

  executionActions.forEach(actionType => {
    const required = requiresConfirmation(actionType);
    assert(required === true, `${actionType} should require confirmation`);
  });
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

