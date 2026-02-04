/**
 * Fix AI Tool UI - Remove placeholders and add functional forms
 */

const fs = require('fs');
const path = require('path');

const TOOLS_DIR = path.join(__dirname, '..', 'app', 'tools');

// AI tools that need functional forms
const AI_TOOLS = [
  'carrier-response.html',
  'category-coverage-checker.html',
  'code-upgrade-identifier.html',
  'comparable-item-finder.html',
  'contents-valuation.html',
  'coverage-alignment.html',
  'coverage-gap-detector.html',
  'coverage-qa-chat.html',
  'damage-report-engine.html',
  'deadline-calculator.html',
  'depreciation-calculator.html',
  'endorsement-opportunity-identifier.html',
  'escalation-readiness-checker.html',
  'estimate-comparison.html',
  'estimate-review.html',
  'line-item-discrepancy-finder.html',
  'missing-document-identifier.html',
  'missing-evidence-identifier.html',
  'missing-trade-detector.html',
  'negotiation-language-generator.html',
  'negotiation-strategy-generator.html',
  'policy-intelligence-engine.html',
  'pre-submission-risk-review-tool.html',
  'pricing-deviation-analyzer.html',
  'remaining-ale-limit-calculator.html',
  'replacement-cost-justification-tool.html',
  'response-letter-generator.html',
  'scope-omission-detector.html',
  'submission-checklist-generator.html',
  'submission-report-engine.html',
  'sublimit-impact-analyzer.html',
  'supplement-analysis.html',
  'supplement-calculation-tool.html',
  'ale-eligibility-checker.html'
];

const FUNCTIONAL_FORM_HTML = `
        <!-- Input Form -->
        <form data-tool-form class="tool-form">
          <div class="tool-form-group">
            <label for="inputText" class="tool-label">Input Data</label>
            <textarea 
              id="inputText" 
              name="inputText" 
              class="tool-textarea" 
              rows="8" 
              placeholder="Enter the information to analyze..."
              required
            ></textarea>
          </div>

          <div class="tool-form-actions">
            <button type="submit" data-analyze-btn class="tool-btn tool-btn-primary">
              Analyze
            </button>
          </div>
        </form>

        <!-- Output Area -->
        <div data-tool-output id="output" class="tool-output" style="display: none;">
          <h3 class="tool-section-title">Analysis Results</h3>
          <div class="tool-output-content"></div>
          
          <div class="tool-form-actions" style="margin-top: 1.5rem;">
            <button data-export-pdf class="tool-btn tool-btn-secondary">
              Export as PDF
            </button>
            <button data-copy-clipboard class="tool-btn tool-btn-secondary">
              Copy to Clipboard
            </button>
          </div>
        </div>
`;

function fixToolUI(toolName) {
  const filePath = path.join(TOOLS_DIR, toolName);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  SKIP: ${toolName} (not found)`);
    return false;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if already has functional form
  if (content.includes('data-tool-form')) {
    console.log(`✅ SKIP: ${toolName} (already has form)`);
    return true;
  }
  
  // Remove placeholder "Tool Status" section
  content = content.replace(
    /<div class="tool-alert tool-alert-info">[\s\S]*?<\/div>/,
    ''
  );
  
  // Find the "What This Tool Does" section and add form before it
  const whatThisToolPattern = /<div class="tool-section">\s*<h3 class="tool-section-title">What This Tool Does<\/h3>/;
  
  if (whatThisToolPattern.test(content)) {
    content = content.replace(
      whatThisToolPattern,
      FUNCTIONAL_FORM_HTML + '\n\n        <div class="tool-section">\n          <h3 class="tool-section-title">What This Tool Does</h3>'
    );
  } else {
    // If pattern not found, add after tool-card-body opening
    content = content.replace(
      /<div class="tool-card-body">\s*<p>This tool is part of/,
      `<div class="tool-card-body">\n        <p>This tool is part of`
    );
    
    content = content.replace(
      /<p>This tool is part of[^<]*<\/p>/,
      (match) => match + '\n' + FUNCTIONAL_FORM_HTML
    );
  }
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ FIXED: ${toolName}`);
  return true;
}

function main() {
  console.log('🔧 Fixing AI Tool UI...\n');
  console.log(`📁 Tools directory: ${TOOLS_DIR}\n`);
  console.log(`🎯 AI Tools to fix: ${AI_TOOLS.length}\n`);
  
  const results = {
    fixed: [],
    already_good: [],
    failed: []
  };
  
  AI_TOOLS.forEach(toolName => {
    try {
      const success = fixToolUI(toolName);
      if (success) {
        if (fs.readFileSync(path.join(TOOLS_DIR, toolName), 'utf8').includes('data-tool-form')) {
          results.already_good.push(toolName);
        } else {
          results.fixed.push(toolName);
        }
      } else {
        results.failed.push(toolName);
      }
    } catch (error) {
      console.error(`❌ ERROR: ${toolName} - ${error.message}`);
      results.failed.push(toolName);
    }
  });
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Fixed: ${results.fixed.length}`);
  console.log(`✅ Already Good: ${results.already_good.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log('='.repeat(60));
  
  if (results.fixed.length > 0) {
    console.log('\n✅ FIXED:');
    results.fixed.forEach(f => console.log(`   - ${f}`));
  }
  
  if (results.failed.length > 0) {
    console.log('\n❌ FAILED:');
    results.failed.forEach(f => console.log(`   - ${f}`));
  }
  
  console.log('\n🎉 UI Fix Complete!\n');
}

main();



