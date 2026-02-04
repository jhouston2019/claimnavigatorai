/**
 * Batch Script: Harden All AI Backend Functions
 * 
 * Applies professional prompt hardening to all AI functions
 * to ensure claim-grade output across the entire system.
 */

const fs = require('fs');
const path = require('path');

// All AI functions that need hardening
const AI_FUNCTIONS = [
  // Coverage & Policy
  'ai-policy-review.js',
  'ai-coverage-decoder.js',
  
  // Estimates & Valuation
  'ai-estimate-comparison.js',
  'ai-rom-estimator.js',
  
  // Damage & Evidence
  'ai-damage-assessment.js',
  'ai-categorize-evidence.js',
  'ai-evidence-auto-tagger.js',
  'ai-evidence-check.js',
  
  // Business Interruption
  'ai-business-interruption.js',
  
  // Negotiation & Carrier
  'ai-response-agent.js',
  'ai-negotiation-advisor.js',
  
  // Advisory & Expert
  'ai-advisory.js',
  'ai-advisory-simple.js',
  'ai-advisory-system.js',
  'ai-situational-advisory.js',
  'ai-expert-opinion.js',
  
  // Document Generation
  'ai-document-generator.js',
  
  // Timeline
  'ai-timeline-analyzer.js'
];

const FUNCTIONS_DIR = path.join(__dirname, '..', 'netlify', 'functions');

// Import statement to add
const IMPORT_STATEMENT = `const { 
  getClaimGradeSystemMessage,
  enhancePromptWithContext,
  postProcessResponse,
  validateProfessionalOutput
} = require('./utils/prompt-hardening');
`;

/**
 * Check if file already has prompt hardening imports
 */
function hasPromptHardening(content) {
  return content.includes('prompt-hardening') || 
         content.includes('getClaimGradeSystemMessage');
}

/**
 * Add import statement after existing imports
 */
function addImports(content) {
  // Find the last require statement
  const requirePattern = /const .* = require\([^)]+\);/g;
  const matches = [...content.matchAll(requirePattern)];
  
  if (matches.length === 0) {
    // No requires found, add at top after comments
    const firstLineOfCode = content.search(/^[^\/\n]/m);
    if (firstLineOfCode !== -1) {
      return content.slice(0, firstLineOfCode) + 
             IMPORT_STATEMENT + '\n' + 
             content.slice(firstLineOfCode);
    }
    return IMPORT_STATEMENT + '\n' + content;
  }
  
  // Add after last require
  const lastMatch = matches[matches.length - 1];
  const insertPos = lastMatch.index + lastMatch[0].length;
  
  return content.slice(0, insertPos) + 
         '\n' + IMPORT_STATEMENT + 
         content.slice(insertPos);
}

/**
 * Add comment marker for manual review
 */
function addReviewMarker(content, functionName) {
  const marker = `
// ⚠️ PHASE 5B: PROMPT HARDENING REQUIRED
// This function needs manual review to:
// 1. Replace system prompt with getClaimGradeSystemMessage(outputType)
// 2. Enhance user prompt with enhancePromptWithContext(prompt, claimInfo, outputType)
// 3. Post-process response with postProcessResponse(response, outputType)
// 4. Validate with validateProfessionalOutput(response, outputType)
// See: /netlify/functions/PROMPT_HARDENING_GUIDE.md
`;

  // Add marker after exports.handler line
  const handlerMatch = content.match(/exports\.handler\s*=\s*async\s*\([^)]*\)\s*=>\s*{/);
  if (handlerMatch) {
    const insertPos = handlerMatch.index + handlerMatch[0].length;
    return content.slice(0, insertPos) + 
           marker + 
           content.slice(insertPos);
  }
  
  return marker + '\n' + content;
}

/**
 * Process a single AI function file
 */
function processFunction(functionName) {
  const filePath = path.join(FUNCTIONS_DIR, functionName);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  SKIP: ${functionName} (file not found)`);
    return { status: 'not_found', file: functionName };
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if already hardened
  if (hasPromptHardening(content)) {
    console.log(`✅ SKIP: ${functionName} (already hardened)`);
    return { status: 'already_hardened', file: functionName };
  }
  
  // Add imports
  content = addImports(content);
  
  // Add review marker
  content = addReviewMarker(content, functionName);
  
  // Write back
  fs.writeFileSync(filePath, content, 'utf8');
  
  console.log(`📝 UPDATED: ${functionName} (imports added, needs manual review)`);
  return { status: 'updated', file: functionName };
}

/**
 * Main execution
 */
function main() {
  console.log('🚀 Starting AI Function Hardening...\n');
  console.log(`📁 Functions directory: ${FUNCTIONS_DIR}\n`);
  console.log(`🎯 Target functions: ${AI_FUNCTIONS.length}\n`);
  
  const results = {
    updated: [],
    already_hardened: [],
    not_found: [],
    errors: []
  };
  
  AI_FUNCTIONS.forEach(functionName => {
    try {
      const result = processFunction(functionName);
      results[result.status].push(result.file);
    } catch (error) {
      console.error(`❌ ERROR: ${functionName} - ${error.message}`);
      results.errors.push({ file: functionName, error: error.message });
    }
  });
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Already Hardened: ${results.already_hardened.length}`);
  console.log(`📝 Updated (needs review): ${results.updated.length}`);
  console.log(`⚠️  Not Found: ${results.not_found.length}`);
  console.log(`❌ Errors: ${results.errors.length}`);
  console.log('='.repeat(60));
  
  if (results.updated.length > 0) {
    console.log('\n📝 FUNCTIONS UPDATED (MANUAL REVIEW REQUIRED):');
    results.updated.forEach(f => console.log(`   - ${f}`));
  }
  
  if (results.not_found.length > 0) {
    console.log('\n⚠️  FUNCTIONS NOT FOUND:');
    results.not_found.forEach(f => console.log(`   - ${f}`));
  }
  
  if (results.errors.length > 0) {
    console.log('\n❌ ERRORS:');
    results.errors.forEach(e => console.log(`   - ${e.file}: ${e.error}`));
  }
  
  console.log('\n📖 NEXT STEPS:');
  console.log('   1. Review each updated function');
  console.log('   2. Follow markers to apply hardening');
  console.log('   3. See: /netlify/functions/PROMPT_HARDENING_GUIDE.md');
  console.log('   4. Test with verification tools');
  console.log('');
  
  // Create tracking file
  const trackingPath = path.join(__dirname, '..', 'PHASE_5B_TRACKING.json');
  fs.writeFileSync(trackingPath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`💾 Tracking file saved: PHASE_5B_TRACKING.json\n`);
}

main();



