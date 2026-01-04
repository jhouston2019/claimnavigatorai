/**
 * PHASE 2 FULL TEST SUITE
 * Runs all Phase 2 submission intelligence tests
 */

const { runSubmissionReadinessTests } = require('./submission-readiness-engine-test');
const { runSubmissionPacketBuilderTests } = require('./submission-packet-builder-test');
const { runSubmissionStateEnforcerTests } = require('./submission-state-enforcer-test');

function runPhase2FullTestSuite() {
  console.log('\n');
  console.log('█'.repeat(80));
  console.log('█' + ' '.repeat(78) + '█');
  console.log('█' + ' '.repeat(20) + 'PHASE 2: SUBMISSION INTELLIGENCE ENGINE' + ' '.repeat(19) + '█');
  console.log('█' + ' '.repeat(30) + 'FULL TEST SUITE' + ' '.repeat(33) + '█');
  console.log('█' + ' '.repeat(78) + '█');
  console.log('█'.repeat(80));
  console.log('\n');

  const results = {
    readiness: null,
    packetBuilder: null,
    stateEnforcer: null
  };

  // Test 1: Submission Readiness Engine
  console.log('═'.repeat(80));
  console.log('MODULE 1: SUBMISSION READINESS ENGINE');
  console.log('═'.repeat(80));
  results.readiness = runSubmissionReadinessTests();
  console.log('\n');

  // Test 2: Submission Packet Builder
  console.log('═'.repeat(80));
  console.log('MODULE 2: SUBMISSION PACKET BUILDER');
  console.log('═'.repeat(80));
  results.packetBuilder = runSubmissionPacketBuilderTests();
  console.log('\n');

  // Test 3: Submission State Enforcer
  console.log('═'.repeat(80));
  console.log('MODULE 3: SUBMISSION STATE ENFORCER');
  console.log('═'.repeat(80));
  results.stateEnforcer = runSubmissionStateEnforcerTests();
  console.log('\n');

  // Overall Summary
  const totalPassed = results.readiness.passed + results.packetBuilder.passed + results.stateEnforcer.passed;
  const totalFailed = results.readiness.failed + results.packetBuilder.failed + results.stateEnforcer.failed;
  const totalTests = totalPassed + totalFailed;

  console.log('\n');
  console.log('█'.repeat(80));
  console.log('█' + ' '.repeat(78) + '█');
  console.log('█' + ' '.repeat(25) + 'PHASE 2 TEST RESULTS SUMMARY' + ' '.repeat(26) + '█');
  console.log('█' + ' '.repeat(78) + '█');
  console.log('█'.repeat(80));
  console.log('');
  console.log('  Module 1: Submission Readiness Engine');
  console.log(`    Tests: ${results.readiness.passed + results.readiness.failed}`);
  console.log(`    ✅ Passed: ${results.readiness.passed}`);
  console.log(`    ❌ Failed: ${results.readiness.failed}`);
  console.log('');
  console.log('  Module 2: Submission Packet Builder');
  console.log(`    Tests: ${results.packetBuilder.passed + results.packetBuilder.failed}`);
  console.log(`    ✅ Passed: ${results.packetBuilder.passed}`);
  console.log(`    ❌ Failed: ${results.packetBuilder.failed}`);
  console.log('');
  console.log('  Module 3: Submission State Enforcer');
  console.log(`    Tests: ${results.stateEnforcer.passed + results.stateEnforcer.failed}`);
  console.log(`    ✅ Passed: ${results.stateEnforcer.passed}`);
  console.log(`    ❌ Failed: ${results.stateEnforcer.failed}`);
  console.log('');
  console.log('─'.repeat(80));
  console.log('');
  console.log(`  TOTAL TESTS: ${totalTests}`);
  console.log(`  ✅ PASSED: ${totalPassed}`);
  console.log(`  ❌ FAILED: ${totalFailed}`);
  console.log('');

  if (totalFailed === 0) {
    console.log('  🎉 ALL PHASE 2 TESTS PASSED!');
    console.log('');
    console.log('  ✅ Submission readiness evaluation working');
    console.log('  ✅ Packet builder creating carrier-safe submissions');
    console.log('  ✅ State enforcement preventing premature submissions');
    console.log('  ✅ Prohibited language sanitized');
    console.log('  ✅ Sensitive metadata stripped');
    console.log('  ✅ Deterministic outputs verified');
    console.log('');
    console.log('  PHASE 2: COMPLETE ✅');
  } else {
    console.log('  ⚠️ SOME TESTS FAILED');
    console.log('');
    console.log('  Review failures above before proceeding to Phase 3.');
    console.log('');
    console.log('  PHASE 2: INCOMPLETE ❌');
  }

  console.log('');
  console.log('█'.repeat(80));
  console.log('\n');

  return {
    totalTests,
    totalPassed,
    totalFailed,
    allPassed: totalFailed === 0,
    results
  };
}

// Run if executed directly
if (require.main === module) {
  const summary = runPhase2FullTestSuite();
  process.exit(summary.allPassed ? 0 : 1);
}

module.exports = { runPhase2FullTestSuite };

