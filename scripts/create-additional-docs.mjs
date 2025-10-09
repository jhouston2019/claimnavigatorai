import { writeFileSync } from 'fs';

const docs = [
  ['proof-of-mitigation', 'Proof of Mitigation'],
  ['expert-support-letter', 'Expert Support Letter'],
  ['follow-up-letter', 'Follow Up Letter'],
  ['coverage-position-request', 'Coverage Position Request'],
  ['notice-of-intent-to-litigate', 'Notice of Intent to Litigate'],
  ['bad-faith-letter', 'Bad Faith Letter'],
  ['lost-income-worksheet', 'Lost Income Worksheet'],
  ['pnl-claim-summary', 'Pnl Claim Summary'],
  ['payroll-interruption-log', 'Payroll Interruption Log']
];

for (const [slug, title] of docs) {
  const html = `<!doctype html><html lang="en"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${title}</title>
<link rel="stylesheet" href="/app/assets/css/style.css"/></head><body>
<header class="header"><div class="bar container"><div class="brand"><div class="logo"></div><div>${title}</div></div>
<nav class="nav"><a href="/app/documents/index.html">← Documents</a></nav></div></header>
<main class="container" id="main">
  <div class="card"><h2>${title}</h2></div>
  <div class="card">
    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(240px,1fr))">
      <label>Policyholder<input id="name" placeholder="Policyholder"/></label>
      <label>Policy #<input id="policy" placeholder="Policy #"/></label>
      <label>Claim #<input id="claim" placeholder="Claim #"/></label>
      <label>Date of Loss<input id="dol" placeholder="YYYY-MM-DD"/></label>
    </div>
    <label style="display:block;margin-top:8px">Details<textarea id="details" placeholder="Provide specifics to tailor the draft…"></textarea></label>
    <div style="display:flex;gap:8px;margin-top:10px">
      <button class="btn btn-primary" id="draft">Draft with AI</button>
      <button class="btn" id="pdf">Export PDF</button>
      <button class="btn" id="docx">Export DOCX</button>
    </div>
    <div id="out" class="card" style="margin-top:12px"></div>
  </div>
</main>
<script type="module">
  import {qs,on} from '/app/assets/js/ui-helpers.js';
  import { callAI, createDoc } from '/app/assets/js/api-client.js';
  const slug='${slug}';
  // URL prefill
  const u=new URL(location.href); ['policy','claim','name','dol'].forEach(k=>{ const v=u.searchParams.get(k); if(v) qs('#'+k).value=v; });
  on(qs('#draft'),'click', async ()=>{
    const body={type:slug,name:qs('#name').value,policy:qs('#policy').value,claim:qs('#claim').value,dol:qs('#dol').value,details:qs('#details').value};
    qs('#out').innerHTML='Drafting…'; const r=await callAI(body,{type:slug}); qs('#out').innerHTML=r.response||r.analysis||'(no content)';
  });
  async function exportAs(fmt){ const html=qs('#out').innerHTML.trim(); if(!html) return alert('Draft first.');
    const r=await createDoc({content:html,format:fmt,type:slug,filename:\`\${slug}_\${Date.now()}\`}); location.href=r.url||r.downloadUrl; }
  on(qs('#pdf'),'click',()=>exportAs('pdf')); on(qs('#docx'),'click',()=>exportAs('docx'));
</script>
<script type="module" src="/app/assets/js/diagnostics.js"></script>
</body></html>`;
  
  writeFileSync(`app/documents/${slug}.html`, html);
  console.log(`Created ${slug}.html`);
}
