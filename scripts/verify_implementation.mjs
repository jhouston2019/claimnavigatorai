import {exist} from './_helpers.mjs';

console.log('— Check required pages exist under /app:');
const requiredPages = [
  'app/advisory/index.html', 'app/maximize/index.html', 'app/tactics/index.html', 'app/state-rights/index.html',
  'app/trackers/index.html', 'app/evidence/index.html', 'app/settlement/index.html', 'app/negotiation/index.html',
  'app/litigation/index.html', 'app/calculator/index.html', 'app/marketplace/index.html',
  'app/documents/appeal-letter.html', 'app/documents/demand-letter.html', 'app/documents/damage-inventory.html',
  'app/documents/claim-timeline.html', 'app/documents/repair-vs-replace.html', 'app/documents/expenses-log.html',
  'app/documents/appraisal-demand.html', 'app/documents/delay-complaint.html', 'app/documents/coverage-clarification.html',
  'app/response-center/claim-analysis-tools/damage-assessment.html',
  'app/response-center/claim-analysis-tools/estimate-comparison.html',
  'app/response-center/claim-analysis-tools/business-interruption.html',
  'app/response-center/claim-analysis-tools/settlement-analysis.html'
];

let missing = 0;
for (const p of requiredPages) {
  if (!exist(p)) {
    console.log(`❌ MISSING ${p}`);
    missing++;
  }
}

if (missing === 0) {
  console.log('✅ All 24 pages present (under /app).');
} else {
  console.log(`❌ ${missing} pages missing`);
}

// Check for inline handlers
console.log('\n— Check for inline handlers:');
import {readFileSync, readdirSync, statSync} from 'fs';
import {resolve} from 'path';

const findInlineHandlers = (dir) => {
  const files = [];
  const walk = (d) => {
    for (const f of readdirSync(d)) {
      const p = resolve(d, f);
      const st = statSync(p);
      if (st.isDirectory()) walk(p);
      else if (p.endsWith('.html')) files.push(p);
    }
  };
  walk(resolve(dir));
  return files;
};

const htmlFiles = findInlineHandlers('app');
let foundHandlers = false;
for (const file of htmlFiles) {
  const content = readFileSync(file, 'utf8');
  if (/on[a-zA-Z]+\s*=/.test(content)) {
    console.log(`⚠️  Found inline handlers in ${file}`);
    foundHandlers = true;
  }
}

if (!foundHandlers) {
  console.log('✅ No inline handlers detected (or window-bridge injected only where needed)');
}

console.log('\n— Check asset files exist:');
const assetFiles = [
  'app/assets/css/style.css',
  'app/assets/js/api-client.js',
  'app/assets/js/ui-helpers.js',
  'app/assets/js/diagnostics.js',
  'app/assets/js/window-bridge.js'
];

let missingAssets = 0;
for (const asset of assetFiles) {
  if (!exist(asset)) {
    console.log(`❌ MISSING ${asset}`);
    missingAssets++;
  }
}

if (missingAssets === 0) {
  console.log('✅ All core assets present');
} else {
  console.log(`❌ ${missingAssets} assets missing`);
}

console.log('\n— Check netlify.toml configuration:');
if (exist('netlify.toml')) {
  const toml = readFileSync('netlify.toml', 'utf8');
  if (toml.includes('/app/assets/*') && toml.includes('/.netlify/*')) {
    console.log('✅ Netlify redirects configured to prevent asset rewrites');
  } else {
    console.log('❌ Netlify redirects may not prevent asset rewrites');
  }
} else {
  console.log('❌ netlify.toml missing');
}
