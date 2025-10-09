import { writeFileSync } from 'fs';

const docs = [
  ['proof-of-loss', 'Proof of Loss'],
  ['appeal-letter', 'Appeal Letter'],
  ['demand-letter', 'Demand Letter'],
  ['damage-inventory', 'Damage Inventory Sheet'],
  ['claim-timeline', 'Claim Timeline / Diary'],
  ['repair-vs-replace', 'Repair or Replacement Cost Worksheet'],
  ['expenses-log', 'Out-of-Pocket Expense Log'],
  ['appraisal-demand', 'Appraisal Demand Letter'],
  ['delay-complaint', 'Notice of Delay Complaint'],
  ['coverage-clarification', 'Coverage Clarification Request'],
  ['notice-of-claim', 'Notice of Claim'],
  ['medical-expense-summary', 'Medical Expense Summary'],
  ['rom-estimate-report', 'ROM Estimate Report'],
  ['photograph-log', 'Photograph Log'],
  ['document-index', 'Document Index'],
  ['comparative-estimates', 'Comparative Estimates'],
  ['settlement-comparison-sheet', 'Settlement Comparison Sheet']
];

for (const [slug, title] of docs) {
  const html = `<!doctype html><html lang="en"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title}</title>
<link rel="stylesheet" href="/app/assets/css/style.css"/></head><body>
<header class="header"><div class="bar container"><div class="brand"><div class="logo"></div><div>${title}</div></div>
<nav class="nav"><a href="/app/documents/index.html">← Documents</a></nav></div></header>
<main class="container" id="main">
  <div class="card"><h2>${title}</h2></div>
  <div class="card">
    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(240px,1fr))">
      <label>Policyholder<input id="name" placeholder="Policyholder Name"/></label>
      <label>Policy #<input id="policy" placeholder="Policy #"/></label>
      <label>Claim #<input id="claim" placeholder="Claim #"/></label>
    </div>
    <label style="display:block;margin-top:8px">Details<textarea id="details" placeholder="Enter details/context..."></textarea></label>
    <div style="display:flex;gap:8px;margin-top:10px">
      <button class="btn btn-primary" id="draft">Draft with AI</button>
      <button class="btn" id="pdf">Export PDF</button>
      <button class="btn" id="docx">Export DOCX</button>
    </div>
    <div id="out" class="card" style="margin-top:12px"></div>
  </div>
</main>
<script type="module">
  import {qs,on,toast} from '/app/assets/js/ui-helpers.js';
  import { callAI, createDoc } from '/app/assets/js/api-client.js';
  const slug='${slug}';
  on(qs('#draft'),'click', async ()=>{
    const body={type:slug,name:qs('#name').value,policy:qs('#policy').value,claim:qs('#claim').value,details:qs('#details').value};
    qs('#out').innerHTML='Drafting…';
    try{ const r=await callAI(body,{type:slug}); qs('#out').innerHTML=r.response||r.analysis||JSON.stringify(r)||'(no content)';}
    catch(e){ qs('#out').innerHTML='<div style="color:#ef4444">'+e.message+'</div>'; }
  });
  async function exportAs(fmt){
    const html=qs('#out').innerHTML.trim(); if(!html) return toast('Draft first');
    const r = await createDoc({content:html,format:fmt,type:slug,filename:\`\${slug}_\${Date.now()}\`});
    location.href = r.url||r.downloadUrl;
  }
  on(qs('#pdf'),'click',()=>exportAs('pdf'));
  on(qs('#docx'),'click',()=>exportAs('docx'));
</script>
<script type="module" src="/app/assets/js/diagnostics.js"></script>
</body></html>`;
  
  writeFileSync(`app/documents/${slug}.html`, html);
  console.log(`Created ${slug}.html`);
}
