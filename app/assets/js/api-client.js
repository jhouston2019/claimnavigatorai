export async function postJSON(url, body){
  const r = await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  if(!r.ok){ const t = await r.text().catch(()=> ''); throw new Error(`HTTP ${r.status} ${t.slice(0,200)}`); }
  return r.json();
}

/** Robust AI call: try generate-response, then generate-response-simple */
export async function callAI(inputText, meta={}){
  const body = typeof inputText==='string' ? { inputText } : inputText;
  const payload = { ...body, ...meta };
  try { return await postJSON('/.netlify/functions/generate-response', payload); }
  catch(e1){
    try { return await postJSON('/.netlify/functions/generate-response-simple', payload); }
    catch(e2){ throw new Error(`AI call failed: ${e1.message} | fallback: ${e2.message}`); }
  }
}

/** Coverage analyzer with fallback name */
export async function analyzePolicyText(policyText, analysisType='coverage_review'){
  const body = { policyText, analysisType };
  try { return await postJSON('/.netlify/functions/policyAnalyzer', body); }
  catch(e1){
    try { return await postJSON('/.netlify/functions/policy-analyzer', body); }
    catch(e2){ throw new Error(`policyAnalyzer failed: ${e1.message} | fallback: ${e2.message}`); }
  }
}

/** Claim analysis with flexible analysisType */
export async function analyzeClaim(body){
  try { return await postJSON('/.netlify/functions/analyze-claim', body); }
  catch(e1){
    try { return await postJSON('/.netlify/functions/analyze-claim-simple', body); }
    catch(e2){ throw new Error(`analyze-claim failed: ${e1.message} | fallback: ${e2.message}`); }
  }
}

/** Document creation */
export async function createDoc(payload){
  // support both names
  try { return await postJSON('/.netlify/functions/generate-document', payload); }
  catch(e1){
    try { return await postJSON('/.netlify/functions/generate-document-simple', payload); }
    catch(e2){ throw new Error(`generate-document failed: ${e1.message} | fallback: ${e2.message}`); }
  }
}

/** Signed URL */
export async function getSignedUrl(filePath){
  try { return await postJSON('/.netlify/functions/get-doc', { filePath }); }
  catch(e){ throw new Error(`get-doc failed: ${e.message}`); }
}

/** Stripe */
export async function createCheckoutSession(priceId, meta={}){
  return postJSON('/.netlify/functions/create-checkout-session', { priceId, meta });
}