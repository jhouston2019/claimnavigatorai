/**
 * PHASE 5B-FINAL: Apply Full Hardening to All AI Functions
 * 
 * This script applies the proven hardening pattern from ai-response-agent.js
 * to ALL remaining backend AI functions.
 * 
 * NO MARKERS. NO PREP. ACTUAL CODE CHANGES.
 */

const fs = require('fs');
const path = require('path');

const FUNCTIONS_DIR = path.join(__dirname, '..', 'netlify', 'functions');

// Functions and their output types
const FUNCTIONS_TO_HARDEN = {
  'ai-estimate-comparison.js': 'analysis',
  'ai-rom-estimator.js': 'analysis',
  'ai-damage-assessment.js': 'report',
  'ai-coverage-decoder.js': 'analysis',
  'ai-business-interruption.js': 'analysis',
  'ai-negotiation-advisor.js': 'strategy',
  'ai-advisory.js': 'analysis',
  'ai-advisory-simple.js': 'analysis',
  'ai-advisory-system.js': 'analysis',
  'ai-situational-advisory.js': 'analysis',
  'ai-expert-opinion.js': 'analysis',
  'ai-document-generator.js': 'letter',
  'ai-categorize-evidence.js': 'analysis',
  'ai-evidence-auto-tagger.js': 'analysis',
  'ai-evidence-check.js': 'checklist',
  'ai-timeline-analyzer.js': 'analysis'
};

/**
 * Apply hardening pattern to a function
 */
function hardenFunction(functionName, outputType) {
  const filePath = path.join(FUNCTIONS_DIR, functionName);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  SKIP: ${functionName} (not found)`);
    return false;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if already fully hardened
  if (content.includes('✅ PHASE 5B: FULLY HARDENED')) {
    console.log(`✅ SKIP: ${functionName} (already hardened)`);
    return true;
  }
  
  // 1. Update handler marker
  content = content.replace(
    /\/\/ ⚠️ PHASE 5B: PROMPT HARDENING REQUIRED[\s\S]*?See: \/netlify\/functions\/PROMPT_HARDENING_GUIDE\.md\n/,
    '  // ✅ PHASE 5B: FULLY HARDENED\n'
  );
  
  // 2. Add claimInfo to destructuring
  content = content.replace(
    /const\s*{\s*([^}]+)\s*}\s*=\s*body;/,
    (match, params) => {
      if (params.includes('claimInfo')) return match;
      return `const { ${params.trim()}, claimInfo = {} } = body;`;
    }
  );
  
  // 3. Replace system prompt patterns
  const systemPromptPatterns = [
    /const\s+systemPrompt\s*=\s*`[^`]+`;/,
    /const\s+systemMessage\s*=\s*`[^`]+`;/,
    /const\s+system\s*=\s*`[^`]+`;/
  ];
  
  for (const pattern of systemPromptPatterns) {
    if (pattern.test(content)) {
      content = content.replace(
        pattern,
        `const systemMessage = getClaimGradeSystemMessage('${outputType}');`
      );
      break;
    }
  }
  
  // 4. Enhance user prompt (find userPrompt assignment and add enhancement after it)
  const userPromptMatch = content.match(/(const\s+userPrompt\s*=\s*`[\s\S]*?`;)/);
  if (userPromptMatch) {
    const userPromptDeclaration = userPromptMatch[1];
    const replacement = userPromptDeclaration.replace('const userPrompt =', 'let userPrompt =');
    content = content.replace(userPromptDeclaration, replacement);
    
    // Add enhancement line after userPrompt
    content = content.replace(
      replacement,
      `${replacement}\n\n    // PHASE 5B: Enhance prompt with claim context\n    userPrompt = enhancePromptWithContext(userPrompt, claimInfo, '${outputType}');`
    );
  }
  
  // 5. Update OpenAI call to use systemMessage.content and capture as rawResponse
  content = content.replace(
    /const\s+(response|analysis|result|output|completion)\s*=\s*await\s+runOpenAI\(\s*systemPrompt/g,
    'const rawResponse = await runOpenAI(systemMessage.content'
  );
  
  content = content.replace(
    /const\s+(response|analysis|result|output|completion)\s*=\s*await\s+runOpenAI\(\s*system\s*,/g,
    'const rawResponse = await runOpenAI(systemMessage.content,'
  );
  
  // 6. Add post-processing and validation before return
  // Find the return statement and add processing before it
  const returnMatch = content.match(/(return\s*{\s*statusCode:\s*200[\s\S]*?body:\s*JSON\.stringify\(\s*{\s*success:\s*true,\s*data:\s*[^,]+)/);
  
  if (returnMatch) {
    const beforeReturn = content.substring(0, returnMatch.index);
    const returnStatement = content.substring(returnMatch.index);
    
    // Add processing code before return
    const processingCode = `
    // PHASE 5B: Post-process and validate
    const processedResponse = postProcessResponse(rawResponse, '${outputType}');
    const validation = validateProfessionalOutput(processedResponse, '${outputType}');

    if (!validation.pass) {
      console.warn('[${functionName.replace('.js', '')}] Quality issues:', validation.issues);
      await LOG_EVENT('quality_warning', '${functionName.replace('.js', '')}', {
        issues: validation.issues,
        score: validation.score,
        user_id: user.id
      });
    }

    `;
    
    // Update return to include metadata
    let updatedReturn = returnStatement.replace(
      /body:\s*JSON\.stringify\(\s*{\s*success:\s*true,\s*data:\s*([^,]+),?\s*error:\s*null\s*}\)/,
      `body: JSON.stringify({ success: true, data: $1, metadata: { quality_score: validation.score, validation_passed: validation.pass }, error: null })`
    );
    
    // Replace rawResponse references with processedResponse in the result
    updatedReturn = updatedReturn.replace(/rawResponse/g, 'processedResponse');
    
    content = beforeReturn + processingCode + updatedReturn;
  }
  
  // Write back
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ HARDENED: ${functionName}`);
  return true;
}

/**
 * Main execution
 */
function main() {
  console.log('🚀 PHASE 5B-FINAL: Full Hardening Implementation\n');
  console.log(`📁 Functions directory: ${FUNCTIONS_DIR}\n`);
  console.log(`🎯 Functions to harden: ${Object.keys(FUNCTIONS_TO_HARDEN).length}\n`);
  
  const results = {
    hardened: [],
    already_hardened: [],
    failed: []
  };
  
  Object.entries(FUNCTIONS_TO_HARDEN).forEach(([functionName, outputType]) => {
    try {
      const success = hardenFunction(functionName, outputType);
      if (success) {
        if (fs.readFileSync(path.join(FUNCTIONS_DIR, functionName), 'utf8').includes('✅ PHASE 5B: FULLY HARDENED')) {
          results.already_hardened.push(functionName);
        } else {
          results.hardened.push(functionName);
        }
      } else {
        results.failed.push(functionName);
      }
    } catch (error) {
      console.error(`❌ ERROR: ${functionName} - ${error.message}`);
      results.failed.push(functionName);
    }
  });
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Newly Hardened: ${results.hardened.length}`);
  console.log(`✅ Already Hardened: ${results.already_hardened.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`📊 TOTAL HARDENED: ${results.hardened.length + results.already_hardened.length}/${Object.keys(FUNCTIONS_TO_HARDEN).length}`);
  console.log('='.repeat(60));
  
  if (results.hardened.length > 0) {
    console.log('\n✅ NEWLY HARDENED:');
    results.hardened.forEach(f => console.log(`   - ${f}`));
  }
  
  if (results.failed.length > 0) {
    console.log('\n❌ FAILED:');
    results.failed.forEach(f => console.log(`   - ${f}`));
  }
  
  console.log('\n🎉 Phase 5B-Final Complete!\n');
}

main();



