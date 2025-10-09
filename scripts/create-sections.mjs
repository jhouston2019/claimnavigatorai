import { writeFileSync } from 'fs';

const sections = [
  ['advisory', '🧭 Situational Advisory', 'AI-driven next steps; links into Documents.'],
  ['maximize', '📈 Maximize Your Claim', 'Playbook & proactive tactics.'],
  ['tactics', '🧠 Insurance Company Tactics', 'Common tactics and counters.'],
  ['state-rights', '⚖️ State Rights & Deadlines', 'Auto-detect protections & timelines.'],
  ['trackers', '🗺️ Trackers & Timeline', 'Claim stage tracker & diary.'],
  ['evidence', '📸 Evidence Organizer', 'Photos, receipts, estimates organized.'],
  ['settlement', '⚖️ Settlement Comparison', 'Offer vs ROM and estimates.'],
  ['negotiation', '💬 Negotiation Scripts', 'Phone/email templates.'],
  ['litigation', '🚀 Escalation Readiness', 'Appraisal, DOI complaint, bad faith.'],
  ['calculator', '💵 Financial Impact Calculator', 'Cost-benefit of hiring pros.'],
  ['marketplace', '🏪 Professional Marketplace', 'Find adjusters, contractors, attorneys.']
];

for (const [path, title, desc] of sections) {
  const html = `<!doctype html><html lang="en"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title}</title>
<link rel="stylesheet" href="/app/assets/css/style.css"/></head><body>
<header class="header"><div class="bar container"><div class="brand"><div class="logo"></div><div>${title}</div></div>
<nav class="nav"><a href="/app/response-center.html">← Resource Center</a></nav></div></header>
<main class="container" id="main">
  <div class="card"><h2>${title}</h2><p>${desc}</p></div>
  <div class="card">
    <label>Notes</label>
    <textarea id="notes" placeholder="Describe your situation or paste data…"></textarea>
    <div style="display:flex;gap:8px;margin-top:8px">
      <button class="btn btn-primary" id="go">Run</button>
      <button class="btn" id="pdf">Export PDF</button>
    </div>
    <div id="out" class="card" style="margin-top:12px"></div>
  </div>
</main>
<script type="module">
  import {qs,on} from '/app/assets/js/ui-helpers.js';
  import { callAI, createDoc, analyzeClaim } from '/app/assets/js/api-client.js';
  on(qs('#go'),'click', async ()=>{
    const v=qs('#notes').value.trim(); if(!v) return;
    qs('#out').innerHTML='Working…';
    try{ const r = await callAI({inputText:v,type:'${path}'},{type:'${path}'}); qs('#out').innerHTML=r.response||r.analysis||JSON.stringify(r)||'(no content)'; }
    catch(e){ qs('#out').innerHTML='<div style="color:#ef4444">'+e.message+'</div>'; }
  });
  on(qs('#pdf'),'click', async ()=>{
    const html=qs('#out').innerHTML.trim(); if(!html) return alert('Run first.');
    const r=await createDoc({content:html,format:'pdf',type:'${path}',filename:'${path}_'+Date.now()}); location.href=r.url||r.downloadUrl;
  });
</script>
<script type="module" src="/app/assets/js/diagnostics.js"></script>
</body></html>`;
  
  writeFileSync(`app/${path}/index.html`, html);
  console.log(`Created ${path}/index.html`);
}
