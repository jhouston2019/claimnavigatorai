import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'fs';
import { dirname } from 'path';

const missing = {
  topLevel: [
    'public/advisory/index.html',
    'public/maximize/index.html',
    'public/tactics/index.html',
    'public/state-rights/index.html',
    'public/trackers/index.html',
    'public/evidence/index.html',
    'public/settlement/index.html',
    'public/negotiation/index.html',
    'public/litigation/index.html',
    'public/calculator/index.html',
    'public/marketplace/index.html',
  ],
  documents: [
    'public/documents/appeal-letter.html',
    'public/documents/demand-letter.html',
    'public/documents/damage-inventory.html',
    'public/documents/claim-timeline.html',
    'public/documents/repair-vs-replace.html',
    'public/documents/expenses-log.html',
    'public/documents/appraisal-demand.html',
    'public/documents/delay-complaint.html',
    'public/documents/coverage-clarification.html',
  ],
  analysis: [
    'public/response-center/claim-analysis-tools/damage-assessment.html',
    'public/response-center/claim-analysis-tools/estimate-comparison.html',
    'public/response-center/claim-analysis-tools/business-interruption.html',
    'public/response-center/claim-analysis-tools/settlement-analysis.html',
  ]
};

const titleForTop = (p) => {
  const map = {
    'advisory': '🧭 Situational Advisory',
    'maximize': '📈 Maximize Your Claim',
    'tactics': '🧠 Insurance Company Tactics',
    'state-rights': '⚖️ State Rights & Deadlines',
    'trackers': '🗺️ Trackers & Timeline',
    'evidence': '📸 Evidence Organizer',
    'settlement': '⚖️ Settlement Comparison',
    'negotiation': '💬 Negotiation Scripts',
    'litigation': '🚀 Escalation Readiness',
    'calculator': '💵 Financial Impact Calculator',
    'marketplace': '🏪 Professional Marketplace',
  };
  const key = p.split('/')[1];
  return map[key] || key;
};

const titleForDoc = (slug) => {
  const map = {
    'appeal-letter':'Appeal Letter',
    'demand-letter':'Demand Letter',
    'damage-inventory':'Damage Inventory Sheet',
    'claim-timeline':'Claim Timeline / Diary',
    'repair-vs-replace':'Repair or Replacement Cost Worksheet',
    'expenses-log':'Out-of-Pocket Expense Log',
    'appraisal-demand':'Appraisal Demand Letter',
    'delay-complaint':'Notice of Delay Complaint',
    'coverage-clarification':'Coverage Clarification Request',
  };
  return map[slug] || slug;
};

const analysisMeta = {
  'damage-assessment': { title:'🔎 Damage Assessment', desc:'ROM estimate & scope recommendations.', type:'damage_assessment' },
  'estimate-comparison': { title:'⚖️ Estimate Comparison', desc:'Compare contractor vs insurer vs ROM.', type:'estimate_comparison' },
  'business-interruption': { title:'💼 Business Interruption', desc:'Lost income / P&L analysis.', type:'business_interruption' },
  'settlement-analysis': { title:'💰 Settlement Analysis', desc:'Offer fairness & gap analysis.', type:'settlement_analysis' },
};

const ensureDir = (file) => mkdirSync(dirname(file), { recursive: true });

const depthPrefix = (file) => {
  // path like public/dir/index.html -> segments after 'public' minus file => how many ../ to reach /public
  const parts = file.split('/').slice(1); // drop "public"
  const dirDepth = parts.length - 1; // exclude file itself
  return '../'.repeat(dirDepth) + 'assets'; // /public/assets
};

const writeIfMissing = (file, content) => {
  if (existsSync(file)) return false;
  ensureDir(file);
  writeFileSync(file, content, 'utf8');
  return true;
};

const topLevelTemplate = (title, file) => {
  const backHref = '../index.html';
  return `<!doctype html><html lang="en"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title}</title>
<link rel="stylesheet" href="../assets/css/style.css"/>
</head><body>
<header><nav class="container"><div class="logo">${title}</div><div class="nav-links"><a href="${backHref}" style="color:#fff">← Back</a></div></nav></header>
<main class="container">
  <div class="card">
    <h1 class="section-h">${title}</h1>
    <p class="lead">Page scaffold. Connect buttons/actions as needed.</p>
  </div>
</main>
<script type="module" src="../assets/js/diagnostics.js"></script>
</body></html>`;
};

const docTemplate = (slug, title) => `<!doctype html><html lang="en"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title}</title>
<link rel="stylesheet" href="../assets/css/style.css"/></head><body>
<header><nav class="container"><div class="logo">📄 ${title}</div><div class="nav-links"><a href="./index.html" style="color:#fff">← Documents</a></div></nav></header>
<main class="container">
  <div class="card">
    <h1 class="section-h">${title}</h1>
    <div class="card">
      <div style="display:grid;gap:.5rem;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));margin-bottom:.75rem">
        <input id="name" placeholder="Policyholder Name" style="padding:.6rem;border:1px solid var(--border);border-radius:10px"/>
        <input id="policy" placeholder="Policy #" style="padding:.6rem;border:1px solid var(--border);border-radius:10px"/>
        <input id="claim" placeholder="Claim #" style="padding:.6rem;border:1px solid var(--border);border-radius:10px"/>
      </div>
      <textarea id="details" placeholder="Enter details/context..." style="width:100%;min-height:140px;padding:12px;border:1px solid var(--border);border-radius:10px"></textarea>
      <div style="display:flex;gap:.5rem;margin-top:.5rem;flex-wrap:wrap">
        <button class="btn btn-solid" id="draft">Draft with AI</button>
        <button class="btn" id="pdf">Export PDF</button>
        <button class="btn" id="docx">Export DOCX</button>
      </div>
      <div id="out" class="card" style="margin-top:1rem"></div>
    </div>
  </div>
</main>
<script type="module">
import { callAI, createDoc } from '../assets/js/api-client.js';
import { qs, on } from '../assets/js/ui-helpers.js';
const slug='${slug}';
on(qs('#draft'),'click', async ()=>{
  const body={type:slug, name:qs('#name').value, policy:qs('#policy').value, claim:qs('#claim').value, details:qs('#details').value};
  qs('#out').innerHTML='<span class="spinner"></span> Drafting...';
  try{ const r=await callAI(JSON.stringify(body),{type:slug}); qs('#out').innerHTML=r.response||'(no content)'; }
  catch(e){ qs('#out').innerHTML=\`<div style="color:#dc2626">Error: \${e.message}</div>\`; }
});
async function exportAs(format){
  const content=qs('#out').innerHTML.trim(); if(!content) return alert('Draft first.');
  const r=await createDoc({content, format, type:slug, filename:\`\${slug}_\${Date.now()}\`});
  const url=r.url||r.downloadUrl; if(url) location.href=url; else alert('Export failed');
}
on(qs('#pdf'),'click', ()=>exportAs('pdf'));
on(qs('#docx'),'click', ()=>exportAs('docx'));
</script>
<script type="module" src="../assets/js/diagnostics.js"></script>
</body></html>`;

const analysisTemplate = (slug) => {
  const m = analysisMeta[slug];
  return `<!doctype html><html lang="en"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${m.title}</title>
<link rel="stylesheet" href="../../../assets/css/style.css"/></head><body>
<header><nav class="container"><div class="logo">🔍 ${m.title}</div><div class="nav-links"><a href="./index.html" style="color:#fff">← All Analysis Tools</a></div></nav></header>
<main class="container">
  <div class="card">
    <h1 class="section-h">${m.title}</h1>
    <p class="lead">${m.desc}</p>
    <div class="card">
      <label>Input</label>
      <textarea id="tool-input" style="width:100%;min-height:120px;border:1px solid var(--border);border-radius:10px;padding:12px"></textarea>
      <div style="display:flex;gap:.5rem;margin-top:.5rem;flex-wrap:wrap">
        <button class="btn btn-solid" id="run">Run Analysis</button>
        <button class="btn" id="export">Export PDF</button>
      </div>
      <div id="tool-output" class="card" style="margin-top:1rem"></div>
    </div>
  </div>
</main>
<script type="module">
import { analyzeClaim, createDoc } from '../../../assets/js/api-client.js';
import { qs, on } from '../../../assets/js/ui-helpers.js';
const analysisType='${m.type}';
on(qs('#run'),'click', async ()=>{
  const v=qs('#tool-input').value.trim(); if(!v) return alert('Enter details first.');
  qs('#tool-output').innerHTML='<span class="spinner"></span> Running...';
  try{
    const res = await analyzeClaim({ analysisType, text:v });
    const html = res.assessment || res.comparison || res.report || res.analysis || JSON.stringify(res);
    qs('#tool-output').innerHTML = html || '(no output)';
  }catch(e){
    qs('#tool-output').innerHTML = \`<div style="color:#dc2626">Error: \${e.message}</div>\`;
  }
});
on(qs('#export'),'click', async ()=>{
  const html=qs('#tool-output').innerHTML.trim(); if(!html) return alert('Run analysis first.');
  const r=await createDoc({content:html,format:'pdf',type:analysisType,filename:\`\${analysisType}_\${Date.now()}\`});
  const url=r.url||r.downloadUrl; if(url) location.href=url; else alert('Export failed');
});
</script>
<script type="module" src="../../../assets/js/diagnostics.js"></script>
</body></html>`;
};

const created = [];
const skipped = [];

// 1) Top-level pages
for (const file of missing.topLevel) {
  const ok = writeIfMissing(file, topLevelTemplate(titleForTop(file), file));
  ok ? created.push(file) : skipped.push(file);
}

// 2) Document Generator pages
for (const file of missing.documents) {
  const slug = file.split('/').pop().replace('.html','');
  const ok = writeIfMissing(file, docTemplate(slug, titleForDoc(slug)));
  ok ? created.push(file) : skipped.push(file);
}

// 3) Analysis subpages
for (const file of missing.analysis) {
  const slug = file.split('/').pop().replace('.html','');
  const ok = writeIfMissing(file, analysisTemplate(slug));
  ok ? created.push(file) : skipped.push(file);
}

// 4) Ensure Documents hub lists these pages (append cards if missing)
const hubPath = 'public/documents/index.html';
if (existsSync(hubPath)) {
  let html = readFileSync(hubPath, 'utf8');
  const ensureCard = (slug, title) => {
    if (!html.includes(`${slug}.html`)) {
      const card = `<a class="card" href="./${slug}.html"><h3 class="title">${title}</h3></a>`;
      html = html.replace(/<section[^>]*id="doc-grid"[^>]*>.*?<\/section>/s,
        (m) => m.replace('</section>', `${card}</section>`))
        .replace(/<main[^>]*>[\s\S]*?<section class="grid tools">/s, (m) => m); // noop if no id
      // If no doc-grid section, append a basic grid:
      if (!html.includes('doc-grid')) {
        html = html.replace('</main>', `<section class="grid tools" id="doc-grid">${card}</section></main>`);
      }
    }
  };
  for (const f of missing.documents) {
    const slug = f.split('/').pop().replace('.html','');
    ensureCard(slug, titleForDoc(slug));
  }
  writeFileSync(hubPath, html, 'utf8');
}

writeFileSync('_build/report.json', JSON.stringify({ created, skipped }, null, 2));
console.log('✅ Created:', created.length, '  ↺ Skipped (already existed):', skipped.length);
