import { exist, read, write } from './_fs.mjs';

const fileCandidates = [
  'app/response-center.html',
  'response-center.html'
].filter(f => exist(f));

if (fileCandidates.length === 0) {
  console.log('ℹ️ No response-center.html found — skipping legacy conversion.');
  process.exit(0);
}
const p = fileCandidates[0];
let html = read(p);

// Map tool ids → new page URLs
const map = {
  'ai-agent': '/app/ai-response-agent.html',
  'claim-analysis': '/app/response-center/claim-analysis-tools/index.html',
  'claim-timeline': '/app/trackers/index.html',
  'claim-stage-tracker': '/app/trackers/index.html',
  'deadline-tracker': '/app/trackers/index.html',
  'document-generator': '/app/documents/index.html',
  'situational-advisory': '/app/response-center/situational-advisory/index.html',
  'maximize-claim': '/app/maximize/index.html',
  'insurance-tactics': '/app/tactics/index.html',
  'state-rights': '/app/state-rights/index.html',
  'evidence-organizer': '/app/evidence/index.html',
  'settlement-comparison': '/app/settlement/index.html',
  'negotiation-scripts': '/app/negotiation/index.html',
  'litigation-escalation': '/app/litigation/index.html',
  'financial-calculator': '/app/calculator/index.html',
  'professional-marketplace': '/app/marketplace/index.html',
  'ai-policy-analyzer': '/app/response-center/claim-analysis-tools/policy-review.html',
  'damage-assessment': '/app/response-center/claim-analysis-tools/damage-assessment.html',
  'estimate-comparison': '/app/response-center/claim-analysis-tools/estimate-comparison.html',
  'business-interruption': '/app/response-center/claim-analysis-tools/business-interruption.html',
  'settlement-analysis': '/app/response-center/claim-analysis-tools/settlement-analysis.html',
  // common legacy labels:
  'claim-playbook': '/app/maximize/index.html',
  'claim-documentation-guides': '/app/documents/index.html',
  'claim-document-library': '/app/documents/index.html',
  'advanced-tools': '/app/response-center/claim-analysis-tools/index.html',
  'my-claims': '/app/trackers/index.html',
  'recommended-resources': '/app/maximize/index.html',
  'how-to-use': '/app/maximize/index.html'
};

// 1) Replace onclick="showTool('x')" with href links
html = html.replace(/onclick\s*=\s*["']\s*showTool\(\s*'([^'"]+)'\s*\)\s*;?\s*["']/g,
  (m, id) => map[id] ? `href="${map[id]}"` : '');

// 2) If tiles use data-tool="x", add href=...
html = html.replace(/(<\w+\b[^>]*\bdata-tool=["']([^"']+)["'][^>]*)(>)/g,
  (m, pre, id, close) => {
    if (!map[id]) return m;
    if (/href=/.test(pre)) return m;
    return pre + ` href="${map[id]}"` + close;
  }
);

// 3) Ensure tiles are anchors when href is present
html = html.replace(/<div([^>]*\shref=["'][^"']+["'][^>]*)>/g, '<a$1>')
           .replace(/<\/div>(?=\s*<!--\s*tile\s*end\s*-->|)/g, '</a>');

// 4) Add a <main id="main"> wrapper if missing
if (!/id=["']main["']/.test(html)) {
  html = html.replace(/<body[^>]*>/i, m => m + '\n<main id="main" class="main">')
             .replace(/<\/body>/i, '</main>\n</body>');
}

// 5) Make sure we load modules only (no duplicate non-module asset script tags)
html = html
  .replace(/<script(?![^>]*type=["']module["'])\s+[^>]*src=["'][^"']*assets\/js\/(validation-utils|error-handler|api-client|diagnostics|window-bridge)\.js["'][^>]*>\s*<\/script>/g, '')
  .replace(/<\/html>[\s\S]*$/,'</html>'); // trim accidental duplicate docs

write(p, html);
console.log('✅ Legacy response-center converted to link-out navigation:', p);
