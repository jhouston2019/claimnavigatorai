const endpoints = [
  { url: '/.netlify/functions/generate-response', body: { inputText: 'ping', language: 'en' } },
  { url: '/.netlify/functions/generate-response-simple', body: { inputText: 'ping', language: 'en' } },
  { url: '/.netlify/functions/policyAnalyzer', body: { policyText: 'policy text', analysisType: 'coverage_review' } },
  { url: '/.netlify/functions/analyze-claim', body: { analysisType:'settlement_analysis', text:'offer 10k; estimate 30k' } },
  { url: '/.netlify/functions/generate-document', body: { content:'<h1>Test</h1>', format:'pdf', type:'test' } },
  { url: '/.netlify/functions/get-doc', body: { filePath:'templates/sample.pdf' } },
  { url: '/.netlify/functions/create-checkout-session', body: { priceId:'price_test', meta:{ source:'qa' } } },
];

(async ()=>{
  const base = location.origin;
  for (const e of endpoints) {
    try{
      const r = await fetch(base+e.url, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(e.body) });
      console.log(e.url, r.status);
    }catch(err){
      console.warn('Ping failed', e.url, err.message);
    }
  }
})();
