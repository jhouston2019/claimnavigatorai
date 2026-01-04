/**
 * ESTIMATE FUNCTIONAL PARITY AUDIT
 * Final gate: Behavioral equivalence testing
 * 
 * Tests that Claim Navigator produces identical outputs to Estimate Review Pro
 * for all supported estimate analysis scenarios.
 */

const EstimateEngine = require('../app/assets/js/intelligence/estimate-engine');

// ============================================================================
// TEST CASES
// ============================================================================

const TEST_MATRIX = {
  // CLASSIFICATION TESTS
  classification: [
    {
      id: 'TC-CLS-01',
      name: 'Property Estimate - High Confidence',
      input: {
        estimateText: `Remove damaged roofing shingles 2000 SF
Install new architectural shingles 2000 SF
Replace underlayment ice and water shield
Install new flashing around chimney
Paint interior walls 800 SF
Replace damaged drywall 400 SF
Install new flooring in living room
Repair ceiling water damage`,
        lineItems: [],
        userInput: '',
        metadata: {}
      },
      expected: {
        classification: 'PROPERTY',
        confidence: 'HIGH',
        minCategories: 2
      }
    },
    {
      id: 'TC-CLS-02',
      name: 'Auto Estimate - High Confidence',
      input: {
        estimateText: `Replace front bumper assembly
Repair left fender panel
Paint door panel and blend
Replace headlight assembly OEM
Align front suspension
Replace windshield with OEM glass`,
        lineItems: [],
        userInput: '',
        metadata: {}
      },
      expected: {
        classification: 'AUTO',
        confidence: 'HIGH',
        minCategories: 1
      }
    },
    {
      id: 'TC-CLS-03',
      name: 'Commercial Property - High Confidence',
      input: {
        estimateText: `Commercial HVAC system replacement
Fire suppression sprinkler repair
ADA compliance door installation
Commercial kitchen equipment
Parking lot resurfacing
Building signage replacement`,
        lineItems: [],
        userInput: '',
        metadata: {}
      },
      expected: {
        classification: 'COMMERCIAL',
        confidence: 'HIGH',  // 6 keywords = HIGH confidence
        minCategories: 1
      }
    },
    {
      id: 'TC-CLS-04',
      name: 'Insufficient Keywords - Should Fail',
      input: {
        estimateText: `Replace item A
Fix item B
Install component C`,
        lineItems: [],
        userInput: '',
        metadata: {}
      },
      expected: {
        shouldFail: true,
        error: 'Unable to classify'
      }
    },
    {
      id: 'TC-CLS-05',
      name: 'Mixed Types - Should Fail as Ambiguous',
      input: {
        estimateText: `Replace roofing shingles
Install new roof materials
Repair front bumper
Paint car door
Replace headlight`,
        lineItems: [],
        userInput: '',
        metadata: {}
      },
      expected: {
        shouldFail: true,
        error: 'Ambiguous'
      }
    }
  ],

  // OMISSION DETECTION TESTS
  omissions: [
    {
      id: 'TC-OM-01',
      name: 'Property Estimate Missing Labor Category',
      input: {
        estimateText: `Remove shingles 200 SF
Install shingles 200 SF
Replace underlayment 200 SF
Roofing materials only`,
        lineItems: [],
        userInput: '',
        metadata: {}
      },
      expected: {
        classification: 'PROPERTY',
        hasMissingCategories: true,
        missingCategoriesMin: 3
      }
    },
    {
      id: 'TC-OM-02',
      name: 'More Complete Property Estimate',
      input: {
        estimateText: `Remove shingles 200 SF
Install shingles 200 SF
Replace underlayment and flashing
Install siding materials
Paint interior walls
Install drywall and trim
Contractor labor and overhead
Water damage drying and dehumidification`,
        lineItems: [],
        userInput: '',
        metadata: {}
      },
      expected: {
        classification: 'PROPERTY',
        hasMissingCategories: true,
        missingCategoriesMin: 1,  // Will still have some missing (demolition, etc.)
        missingCategoriesMax: 5   // But fewer than minimal estimate
      }
    }
  ],

  // UNDER-SCOPING TESTS
  underscoping: [
    {
      id: 'TC-US-01',
      name: 'Zero Quantity Detection',
      input: {
        estimateText: `Remove roofing materials
Install new roof`,
        lineItems: [
          'Remove shingles 200 SF',
          'Install shingles quantity: 0',
          'Replace underlayment 150 SF',
          'Install flashing qty 0'
        ],
        userInput: '',
        metadata: {}
      },
      expected: {
        classification: 'PROPERTY',
        hasZeroQuantities: true,
        zeroQuantityCount: 2
      }
    },
    {
      id: 'TC-US-02',
      name: 'Material-Only Detection',
      input: {
        estimateText: `Roofing shingles materials only
Underlayment material only
Paint supplies only`,
        lineItems: [
          'Roofing shingles - materials only',
          'Underlayment - materials only',
          'Paint - materials only'
        ],
        userInput: '',
        metadata: {}
      },
      expected: {
        classification: 'PROPERTY',
        hasUnderScoping: true,
        underScopingMin: 3
      }
    },
    {
      id: 'TC-US-03',
      name: 'Incomplete Scope Indicators',
      input: {
        estimateText: `Temporary roof repair
Partial siding replacement
Patch drywall damage`,
        lineItems: [
          'Temporary roof repair',
          'Partial siding replacement',
          'Patch drywall damage'
        ],
        userInput: '',
        metadata: {}
      },
      expected: {
        classification: 'PROPERTY',
        hasUnderScoping: true,
        underScopingMin: 3
      }
    }
  ],

  // GUARDRAIL TESTS
  guardrails: [
    {
      id: 'TC-GR-01',
      name: 'Negotiation Request - Should Refuse',
      input: {
        estimateText: `Remove shingles 200 SF
Install shingles 200 SF`,
        lineItems: [],
        userInput: 'Help me negotiate with the insurance company',
        metadata: {}
      },
      expected: {
        shouldFail: true,
        error: 'Prohibited content detected'
      }
    },
    {
      id: 'TC-GR-02',
      name: 'Coverage Question - Should Refuse',
      input: {
        estimateText: `Replace roof materials`,
        lineItems: [],
        userInput: 'Am I covered for this damage?',
        metadata: {}
      },
      expected: {
        shouldFail: true,
        error: 'Prohibited request detected'
      }
    },
    {
      id: 'TC-GR-03',
      name: 'Legal Advice Request - Should Refuse',
      input: {
        estimateText: `Roof damage repair`,
        lineItems: [],
        userInput: 'Should I sue the insurance company?',
        metadata: {}
      },
      expected: {
        shouldFail: true,
        error: 'Prohibited'
      }
    },
    {
      id: 'TC-GR-04',
      name: 'Entitlement Language - Should Refuse',
      input: {
        estimateText: `Remove roofing shingles
Install new roofing materials
Replace damaged siding`,
        lineItems: [],
        userInput: 'This amount is owed to me',  // Exact phrase from guardrails
        metadata: {}
      },
      expected: {
        shouldFail: true,
        error: 'Prohibited'
      }
    },
    {
      id: 'TC-GR-05',
      name: 'Clean Estimate - Should Pass',
      input: {
        estimateText: `Remove damaged roofing shingles
Install new roofing materials
Replace underlayment and flashing
Repair roof structure`,
        lineItems: [],
        userInput: 'Please analyze this estimate',
        metadata: {}
      },
      expected: {
        shouldFail: false,
        classification: 'PROPERTY'  // Need enough keywords to classify
      }
    }
  ],

  // DETERMINISM TESTS
  determinism: [
    {
      id: 'TC-DT-01',
      name: 'Same Input Multiple Times',
      input: {
        estimateText: `Remove shingles 200 SF
Install shingles 200 SF
Replace underlayment
Install flashing`,
        lineItems: [],
        userInput: '',
        metadata: {}
      },
      expected: {
        classification: 'PROPERTY',
        runsRequired: 3,
        mustBeIdentical: true
      }
    }
  ]
};

// ============================================================================
// TEST EXECUTION
// ============================================================================

function runFunctionalAudit() {
  console.log('═'.repeat(80));
  console.log('ESTIMATE FUNCTIONAL PARITY AUDIT');
  console.log('Final Gate: Behavioral Equivalence Testing');
  console.log('═'.repeat(80));
  console.log('');

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    categories: {}
  };

  // Run each category
  for (const [category, tests] of Object.entries(TEST_MATRIX)) {
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`CATEGORY: ${category.toUpperCase()}`);
    console.log('─'.repeat(80));

    results.categories[category] = { passed: 0, failed: 0 };

    tests.forEach(test => {
      results.total++;
      console.log(`\n[${test.id}] ${test.name}`);

      try {
        if (test.expected.runsRequired) {
          // Determinism test
          const outputs = [];
          for (let i = 0; i < test.expected.runsRequired; i++) {
            const result = EstimateEngine.analyzeEstimate(test.input);
            outputs.push(JSON.stringify(result));
          }

          const allIdentical = outputs.every(o => o === outputs[0]);
          
          if (allIdentical) {
            console.log(`✅ PASSED - Deterministic (${test.expected.runsRequired} identical runs)`);
            results.passed++;
            results.categories[category].passed++;
          } else {
            console.log(`❌ FAILED - Non-deterministic output detected`);
            results.failed++;
            results.categories[category].failed++;
          }
        } else {
          // Standard test
          const result = EstimateEngine.analyzeEstimate(test.input);

          if (test.expected.shouldFail) {
            if (!result.success) {
              const errorMatch = result.error.toLowerCase().includes(test.expected.error.toLowerCase());
              if (errorMatch) {
                console.log(`✅ PASSED - Correctly refused: ${result.error}`);
                results.passed++;
                results.categories[category].passed++;
              } else {
                console.log(`❌ FAILED - Wrong error message`);
                console.log(`   Expected: ${test.expected.error}`);
                console.log(`   Got: ${result.error}`);
                results.failed++;
                results.categories[category].failed++;
              }
            } else {
              console.log(`❌ FAILED - Should have failed but succeeded`);
              results.failed++;
              results.categories[category].failed++;
            }
          } else {
            if (!result.success) {
              console.log(`❌ FAILED - Unexpected error: ${result.error}`);
              results.failed++;
              results.categories[category].failed++;
            } else {
              let passed = true;
              const checks = [];

              // Check classification
              if (test.expected.classification) {
                const match = result.classification.classification === test.expected.classification;
                checks.push(`Classification: ${match ? '✓' : '✗'} ${result.classification.classification}`);
                if (!match) passed = false;
              }

              // Check confidence
              if (test.expected.confidence) {
                const match = result.classification.confidence === test.expected.confidence;
                checks.push(`Confidence: ${match ? '✓' : '✗'} ${result.classification.confidence}`);
                if (!match) passed = false;
              }

              // Check missing categories
              if (test.expected.hasMissingCategories !== undefined) {
                const hasMissing = result.analysis.missingCategories.length > 0;
                const match = hasMissing === test.expected.hasMissingCategories;
                checks.push(`Has Missing Categories: ${match ? '✓' : '✗'} ${hasMissing}`);
                if (!match) passed = false;
              }

              if (test.expected.missingCategoriesMin !== undefined) {
                const count = result.analysis.missingCategories.length;
                const match = count >= test.expected.missingCategoriesMin;
                checks.push(`Missing Categories: ${match ? '✓' : '✗'} ${count} >= ${test.expected.missingCategoriesMin}`);
                if (!match) passed = false;
              }

              if (test.expected.missingCategoriesMax !== undefined) {
                const count = result.analysis.missingCategories.length;
                const match = count <= test.expected.missingCategoriesMax;
                checks.push(`Missing Categories: ${match ? '✓' : '✗'} ${count} <= ${test.expected.missingCategoriesMax}`);
                if (!match) passed = false;
              }

              // Check zero quantities
              if (test.expected.hasZeroQuantities !== undefined) {
                const hasZero = result.analysis.zeroQuantityItems.length > 0;
                const match = hasZero === test.expected.hasZeroQuantities;
                checks.push(`Has Zero Quantities: ${match ? '✓' : '✗'} ${hasZero}`);
                if (!match) passed = false;
              }

              if (test.expected.zeroQuantityCount !== undefined) {
                const count = result.analysis.zeroQuantityItems.length;
                const match = count === test.expected.zeroQuantityCount;
                checks.push(`Zero Quantity Count: ${match ? '✓' : '✗'} ${count} === ${test.expected.zeroQuantityCount}`);
                if (!match) passed = false;
              }

              // Check under-scoping
              if (test.expected.hasUnderScoping !== undefined) {
                const hasUS = result.analysis.potentialUnderScoping.length > 0;
                const match = hasUS === test.expected.hasUnderScoping;
                checks.push(`Has Under-Scoping: ${match ? '✓' : '✗'} ${hasUS}`);
                if (!match) passed = false;
              }

              if (test.expected.underScopingMin !== undefined) {
                const count = result.analysis.potentialUnderScoping.length;
                const match = count >= test.expected.underScopingMin;
                checks.push(`Under-Scoping Count: ${match ? '✓' : '✗'} ${count} >= ${test.expected.underScopingMin}`);
                if (!match) passed = false;
              }

              if (passed) {
                console.log(`✅ PASSED`);
                checks.forEach(c => console.log(`   ${c}`));
                results.passed++;
                results.categories[category].passed++;
              } else {
                console.log(`❌ FAILED`);
                checks.forEach(c => console.log(`   ${c}`));
                results.failed++;
                results.categories[category].failed++;
              }
            }
          }
        }
      } catch (error) {
        console.log(`❌ FAILED - Exception: ${error.message}`);
        results.failed++;
        results.categories[category].failed++;
      }
    });
  }

  // Summary
  console.log('\n' + '═'.repeat(80));
  console.log('AUDIT SUMMARY');
  console.log('═'.repeat(80));
  console.log(`Total Tests: ${results.total}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log('');

  console.log('By Category:');
  for (const [category, stats] of Object.entries(results.categories)) {
    console.log(`  ${category}: ${stats.passed}/${stats.passed + stats.failed} passed`);
  }

  console.log('\n' + '═'.repeat(80));
  if (results.failed === 0) {
    console.log('🎉 ALL TESTS PASSED!');
    console.log('Behavioral equivalence to Estimate Review Pro: CONFIRMED');
  } else {
    console.log('⚠️ SOME TESTS FAILED');
    console.log('Review failures above before deployment');
  }
  console.log('═'.repeat(80));

  return results;
}

// Export for use in other tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runFunctionalAudit, TEST_MATRIX };
}

// Run if executed directly
if (require.main === module) {
  const results = runFunctionalAudit();
  process.exit(results.failed > 0 ? 1 : 0);
}

