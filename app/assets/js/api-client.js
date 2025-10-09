export async function postJSON(url, body){
  const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  if(!r.ok){ const t=await r.text().catch(()=> ''); throw new Error(`HTTP ${r.status} ${t.slice(0,160)}`); }
  return r.json();
}
export async function callAI(body, meta={}){
  const payload = typeof body==='string'? { inputText: body }: body;
  try{ return await postJSON('/.netlify/functions/generate-response',{...payload,...meta}); }
  catch(e1){ try{ return await postJSON('/.netlify/functions/generate-response-simple',{...payload,...meta}); }
  catch(e2){ return { response:`(demo) ${payload.inputText || 'AI draft'} — functions unavailable` }; } }
}
export async function analyzeClaim(body){
  try{ return await postJSON('/.netlify/functions/analyze-claim', body); }
  catch{ return { analysis:'(demo) analysis result', assessment:'(demo) assessment', comparison:'(demo) comparison', report:'(demo) report' }; }
}
export async function analyzePolicyText(policyText, analysisType='coverage_review'){
  try{ return await postJSON('/.netlify/functions/policyAnalyzer', { policyText, analysisType }); }
  catch{ return { analysis:'(demo) suggested provisions / statutes based on state & context.' }; }
}
export async function createDoc(payload){
  try{ return await postJSON('/.netlify/functions/generate-document', payload); }
  catch{ const data=`data:text/html;charset=utf-8,${encodeURIComponent(payload.content||'<h1>Document</h1>')}`; return { url:data, downloadUrl:data }; }
}