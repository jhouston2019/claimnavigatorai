import { exist, write } from './_fs.mjs';

// ---- Top-level sections
const sections = [
  ['advisory','🧭 Situational Advisory'],
  ['maximize','📈 Maximize Your Claim'],
  ['tactics','🧠 Insurance Company Tactics'],
  ['state-rights','⚖️ State Rights & Deadlines'],
  ['trackers','🗺️ Trackers & Timeline'],
  ['evidence','📸 Evidence Organizer'],
  ['settlement','⚖️ Settlement Comparison'],
  ['negotiation','💬 Negotiation Scripts'],
  ['litigation','🚀 Escalation Readiness'],
  ['calculator','💵 Financial Impact Calculator'],
  ['marketplace','🏪 Professional Marketplace'],
];

const sectionTpl = (title) => `<!doctype html><html lang="en"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title}</title>
<link rel="stylesheet" href="/app/assets/css/style.css"/></head><body>
<header><nav class="container"><div class="logo">${title}</div><div><a href="/app/index.html" style="color:#fff">← Back</a></div></nav></header>
<main id="main" class="container"><div class="card"><h1 class="section-h">${title}</h1><p class="lead">Page scaffold.</p></div></main>
<script type="module" src="/app/assets/js/diagnostics.js"></script></body></html>`;

for (const [slug, title] of sections) {
  const f = `app/${slug}/index.html`;
  if (!exist(f)) write(f, sectionTpl(title));
}

// ---- Documents 1–10
const docs = [
  ['appeal-letter','Appeal Letter'],
  ['demand-letter','Demand Letter'],
  ['damage-inventory','Damage Inventory Sheet'],
  ['claim-timeline','Claim Timeline / Diary'],
  ['repair-vs-replace','Repair or Replacement Cost Worksheet'],
  ['expenses-log','Out-of-Pocket Expense Log'],
  ['appraisal-demand','Appraisal Demand Letter'],
  ['delay-complaint','Notice of Delay Complaint'],
  ['coverage-clarification','Coverage Clarification Request']
];

const docTpl = (slug, title) => `<!doctype html><html lang="en"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title}</title>
<link rel="stylesheet" href="/app/assets/css/style.css"/></head><body>
<header><nav class="container"><div class="logo">📄 ${title}</div><div><a href="/app/documents/index.html" style="color:#fff">← Documents</a></div></nav></header>
<main id="main" class="container">
  <div class="card"><h1 class="section-h">${title}</h1>
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
import { callAI, createDoc } from '/app/assets/js/api-client.js';
import { qs, on } from '/app/assets/js/ui-helpers.js';
const slug='${slug}';
on(qs('#draft'),'click', async ()=>{
  const body={type:slug,name:qs('#name').value,policy:qs('#policy').value,claim:qs('#claim').value,details:qs('#details').value};
  qs('#out').innerHTML='<span class="spinner"></span> Drafting...';
  try{ const r=await callAI(JSON.stringify(body),{type:slug}); qs('#out').innerHTML=r.response||'(no content)'; }
  catch(e){ qs('#out').innerHTML=\`<div style="color:#dc2626">Error: \${e.message}</div>\`; }
});
async function exportAs(fmt){
  const html=qs('#out').innerHTML.trim(); if(!html) return alert('Draft first.');
  const r=await createDoc({content:html,format:fmt,type:slug,filename:\`\${slug}_\${Date.now()}\`});
  const url=r.url||r.downloadUrl; if(url) location.href=url; else alert('Export failed');
}
on(qs('#pdf'),'click',()=>exportAs('pdf'));
on(qs('#docx'),'click',()=>exportAs('docx'));
</script>
<script type="module" src="/app/assets/js/diagnostics.js"></script>
</body></html>`;

for (const [slug, title] of docs) {
  const f = `app/documents/${slug}.html`;
  if (!exist(f)) write(f, docTpl(slug,title));
}

// ---- Claim Analysis subpages
const analysis = [
  ['damage-assessment','🔎 Damage Assessment','ROM estimate & scope recommendations.','damage_assessment'],
  ['estimate-comparison','⚖️ Estimate Comparison','Contractor vs insurer vs ROM.','estimate_comparison'],
  ['business-interruption','💼 Business Interruption','Lost income / P&L tools.','business_interruption'],
  ['settlement-analysis','💰 Settlement Analysis','Offer fairness & gap report.','settlement_analysis'],
];

const analysisTpl = (slug,title,desc,type)=>`<!doctype html><html lang="en"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title}</title>
<link rel="stylesheet" href="/app/assets/css/style.css"/></head><body>
<header><nav class="container"><div class="logo">🔍 ${title}</div><div><a href="/app/response-center/claim-analysis-tools/index.html" style="color:#fff">← All Analysis Tools</a></div></nav></header>
<main id="main" class="container"><div class="card"><h1 class="section-h">${title}</h1><p class="lead">${desc}</p>
  <div class="card">
    <label>Input</label>
    <textarea id="tool-input" style="width:100%;min-height:120px;border:1px solid var(--border);border-radius:10px;padding:12px"></textarea>
    <div style="display:flex;gap:.5rem;margin-top:.5rem;flex-wrap:wrap">
      <button class="btn btn-solid" id="run">Run Analysis</button>
      <button class="btn" id="export">Export PDF</button>
    </div>
    <div id="tool-output" class="card" style="margin-top:1rem"></div>
  </div>
</div></main>
<script type="module">
import { analyzeClaim, createDoc } from '/app/assets/js/api-client.js';
import { qs, on } from '/app/assets/js/ui-helpers.js';
const analysisType='${type}';
on(qs('#run'),'click', async ()=>{
  const v=qs('#tool-input').value.trim(); if(!v) return alert('Enter details first.');
  qs('#tool-output').innerHTML='<span class="spinner"></span> Running...';
  try{ const res=await analyzeClaim({analysisType,text:v});
    const html=res.assessment||res.comparison||res.report||res.analysis||JSON.stringify(res);
    qs('#tool-output').innerHTML=html||'(no output)'; }
  catch(e){ qs('#tool-output').innerHTML=\`<div style="color:#dc2626">Error: \${e.message}</div>\`; }
});
on(qs('#export'),'click', async ()=>{
  const html=qs('#tool-output').innerHTML.trim(); if(!html) return alert('Run analysis first.');
  const r=await createDoc({content:html,format:'pdf',type:analysisType,filename:\`\${analysisType}_\${Date.now()}\`});
  const url=r.url||r.downloadUrl; if(url) location.href=url; else alert('Export failed');
});
</script>
<script type="module" src="/app/assets/js/diagnostics.js"></script>
</body></html>`;

for (const a of analysis) {
  const [slug,title,desc,type] = a;
  const f = `app/response-center/claim-analysis-tools/${slug}.html`;
  if (!exist(f)) write(f, analysisTpl(slug,title,desc,type));
}

// ---- Ensure Claim Analysis index exists with double-size cards
const indexCA = `<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Claim Analysis Tools</title><link rel="stylesheet" href="/app/assets/css/style.css"/></head><body>
<header><nav class="container"><div>🔍 Claim Analysis Tools</div><div><a href="/app/index.html" style="color:#fff">← Back</a></div></nav></header>
<main id="main" class="container"><section class="grid tools tools-xl">
  <a class="card tool-xl" href="/app/response-center/claim-analysis-tools/policy-review.html"><h3 class="title">📋 Policy Review</h3></a>
  <a class="card tool-xl" href="/app/response-center/claim-analysis-tools/damage-assessment.html"><h3 class="title">🔎 Damage Assessment</h3></a>
  <a class="card tool-xl" href="/app/response-center/claim-analysis-tools/estimate-comparison.html"><h3 class="title">⚖️ Estimate Comparison</h3></a>
  <a class="card tool-xl" href="/app/response-center/claim-analysis-tools/business-interruption.html"><h3 class="title">💼 Business Interruption</h3></a>
  <a class="card tool-xl" href="/app/response-center/claim-analysis-tools/settlement-analysis.html"><h3 class="title">💰 Settlement Analysis</h3></a>
</section></main>
<script type="module" src="/app/assets/js/diagnostics.js"></script></body></html>`;
const caIdx = 'app/response-center/claim-analysis-tools/index.html';
if (!exist(caIdx)) write(caIdx, indexCA);

// ---- Ensure Documents hub exists
const docHub = `<!doctype html><html lang="en"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Document Generator</title>
<link rel="stylesheet" href="/app/assets/css/style.css"/></head><body>
<header><nav class="container"><div>📄 Document Generator</div><div><a href="/app/index.html" style="color:#fff">← Back</a></div></nav></header>
<main id="main" class="container"><section class="grid tools">
  ${docs.map(([slug,title])=>`<a class="card" href="/app/documents/${slug}.html"><h3 class="title">${title}</h3></a>`).join('\n  ')}
</section></main>
<script type="module" src="/app/assets/js/diagnostics.js"></script></body></html>`;
const docIdx = 'app/documents/index.html';
if (!exist(docIdx)) write(docIdx, docHub);

console.log('✅ Scaffolds ensured/created where missing.');
