import { writeFileSync } from 'fs';

const tools = [
  ['policy-review', '📋 Policy Review', 'Coverage analysis & key limits.', 'coverage_review'],
  ['damage-assessment', '🔎 Damage Assessment', 'ROM estimate & scope recommendations.', 'damage_assessment'],
  ['estimate-comparison', '⚖️ Estimate Comparison', 'Compare contractor vs insurer vs ROM.', 'estimate_comparison'],
  ['business-interruption', '💼 Business Interruption', 'Lost income / P&L analysis.', 'business_interruption'],
  ['settlement-analysis', '💰 Settlement Analysis', 'Offer fairness & gap analysis.', 'settlement_analysis']
];

for (const [slug, title, desc, atype] of tools) {
  const html = `<!doctype html><html lang="en"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title}</title>
<link rel="stylesheet" href="/app/assets/css/style.css"/></head><body>
<header class="header"><div class="bar container"><div class="brand"><div class="logo"></div><div>${title}</div></div>
<nav class="nav"><a href="/app/response-center/claim-analysis-tools/index.html">← All Tools</a></nav></div></header>
<main class="container">
  <div class="card"><h2>${title}</h2><p>${desc}</p></div>
  <div class="card">
    <label>Input</label>
    <textarea id="tool-input" placeholder="Paste details, estimates, offers…"></textarea>
    <div style="display:flex;gap:8px;margin-top:8px">
      <button class="btn btn-primary" id="run">Run Analysis</button>
      <button class="btn" id="export">Export PDF</button>
    </div>
    <div id="tool-output" class="card" style="margin-top:12px"></div>
  </div>
</main>
<script type="module">
  import {qs,on} from '/app/assets/js/ui-helpers.js';
  import { analyzeClaim, createDoc, analyzePolicyText } from '/app/assets/js/api-client.js';
  const type='${atype}';
  on(qs('#run'),'click', async ()=>{
    const v=qs('#tool-input').value.trim(); if(!v) return alert('Enter details first.');
    qs('#tool-output').innerHTML='<span class="small">Running…</span>';
    try{
      const res = type==='coverage_review' ? await analyzePolicyText(v,type) : await analyzeClaim({analysisType:type, text:v});
      const html = res.analysis||res.assessment||res.comparison||res.report||JSON.stringify(res);
      qs('#tool-output').innerHTML = html || '(no output)';
    }catch(e){ qs('#tool-output').innerHTML = '<div style="color:#ef4444">'+e.message+'</div>'; }
  });
  on(qs('#export'),'click', async ()=>{
    const html=qs('#tool-output').innerHTML.trim(); if(!html) return alert('Run analysis first.');
    const r=await createDoc({content:html,format:'pdf',type,filename:type+'_'+Date.now()}); location.href=r.url||r.downloadUrl;
  });
</script>
<script type="module" src="/app/assets/js/diagnostics.js"></script>
</body></html>`;
  
  writeFileSync(`app/response-center/claim-analysis-tools/${slug}.html`, html);
  console.log(`Created ${slug}.html`);
}
