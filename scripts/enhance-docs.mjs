import {readFileSync, writeFileSync, existsSync} from 'fs';

const docs = [
  ['appeal-letter',[
    ['recipient','Insurer/Recipient'],
    ['policyholder','Policyholder Name'],
    ['policyNumber','Policy #'],
    ['claimNumber','Claim #'],
    ['dateOfLoss','Date of Loss'],
    ['denialReason','Denial/Underpayment Reason'],
    ['facts','Key Facts Summary'],
    ['law','Policy/Statutes to Cite'],
    ['relief','Requested Remedy'],
  ]],
  ['demand-letter',[
    ['recipient','Insurer/Adjuster'],
    ['policyholder','Policyholder'],
    ['policyNumber','Policy #'],
    ['claimNumber','Claim #'],
    ['amount','Demand Amount ($)'],
    ['basis','Basis / Coverage'],
    ['support','Supporting Evidence (estimates, photos, invoices)'],
    ['deadline','Response Deadline (date)'],
  ]],
  ['damage-inventory',[
    ['location','Location / Room'],
    ['items','Items (CSV: qty,name,desc,preValue,postValue)'],
    ['method','Valuation Method (ACV/RCV)'],
    ['notes','Notes'],
  ]],
  ['claim-timeline',[
    ['lossDate','Loss Date'],
    ['events','Events (CSV: date,actor,event,notes)'],
    ['deadlines','Deadlines to Track (CSV: date,label)'],
  ]],
  ['repair-vs-replace',[
    ['trade','Trade/Component'],
    ['repairCost','Repair Cost ($)'],
    ['replaceCost','Replacement Cost ($)'],
    ['rationale','Rationale / Code Issues'],
  ]],
  ['expenses-log',[
    ['category','Category (ALE/Travel/Meals/Rental)'],
    ['entries','Entries (CSV: date,vendor,desc,amount)'],
    ['period','Coverage Period'],
  ]],
  ['appraisal-demand',[
    ['recipient','Insurer/Adjuster'],
    ['policyholder','Policyholder'],
    ['policyNumber','Policy #'],
    ['claimNumber','Claim #'],
    ['disputeScope','Scope of Dispute'],
    ['umpire','Proposed Umpires'],
    ['appraiser','Your Appraiser (optional)'],
  ]],
  ['delay-complaint',[
    ['recipient','Insurer/Claims Dept'],
    ['policyholder','Policyholder'],
    ['policyNumber','Policy #'],
    ['claimNumber','Claim #'],
    ['missedDeadlines','Missed Statutory/Policy Deadlines'],
    ['harm','Prejudice/Harm from Delay'],
    ['statutes','State Statutes to Cite'],
  ]],
  ['coverage-clarification',[
    ['recipient','Insurer/Adjuster'],
    ['policyholder','Policyholder'],
    ['policyNumber','Policy #'],
    ['claimNumber','Claim #'],
    ['provisions','Provisions/Endorsements to Clarify'],
    ['question','Specific Question(s)'],
    ['context','Relevant Facts'],
  ]],
];

function enhance(html, fields){
  // Replace the single textarea block with a grid of inputs + details textarea
  html = html.replace(/<textarea[^>]*id="details"[\s\S]*?<\/textarea>/,
  `<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:.5rem">
    ${fields.map(([id,label])=>`<label style="display:flex;flex-direction:column;font-weight:600">${label}
      <input id="${id}" style="padding:.6rem;border:1px solid var(--border);border-radius:10px"/>
    </label>`).join('\n')}
  </div>
  <label style="display:block;margin-top:.5rem;font-weight:600">Additional Details
    <textarea id="details" style="width:100%;min-height:120px;padding:12px;border:1px solid var(--border);border-radius:10px"></textarea>
  </label>`);

  // Inject a smarter draft handler that sends structured JSON to AI
  html = html.replace(/on\(qs\('#draft'\),'click',[\s\S]*?<\/script>/,
`on(qs('#draft'),'click', async ()=>{
  const data = { 
    type: slug,
    fields: {
      ${fields.map(([id])=>`${id}: qs('#${id}')?.value||''`).join(',')}
    },
    details: qs('#details')?.value||''
  };
  qs('#out').innerHTML='<span class="spinner"></span> Drafting...';
  try{ const r=await callAI(data,{type:slug}); qs('#out').innerHTML=r.response||'(no content)'; }
  catch(e){ qs('#out').innerHTML=\`<div style="color:#dc2626">Error: \${e.message}</div>\`; }
});
async function exportAs(fmt){
  const html = qs('#out')?.innerHTML?.trim(); if(!html) return alert('Draft first.');
  const r = await createDoc({content:html,format:fmt,type:slug,filename:\`\${slug}_\${Date.now()}\`});
  const url = r.url||r.downloadUrl; if(url) location.href=url; else alert('Export failed');
}
on(qs('#pdf'),'click',()=>exportAs('pdf'));
on(qs('#docx'),'click',()=>exportAs('docx'));
</script>`);
  return html;
}

let updated=0;
for (const [slug, fields] of docs) {
  const path = `app/documents/${slug}.html`;
  if(!existsSync(path)) continue;
  let html = readFileSync(path,'utf8');
  if (html.includes('Additional Details')) continue; // already enhanced
  html = enhance(html, fields);
  writeFileSync(path, html, 'utf8'); updated++;
}
console.log('Enhanced document pages:', updated);
