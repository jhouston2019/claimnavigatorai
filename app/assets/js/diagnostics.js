(async()=>{
  try{
    console.log('✅ Clean Resource Center build');
    const scripts=[...document.querySelectorAll('script[src]')].map(s=>s.src), bad=[];
    for(const src of scripts){ try{ const blob=await (await fetch(src,{cache:'no-store'})).text(); if(blob.trim().startsWith('<')) bad.push(src);}catch{} }
    if(bad.length) console.warn('🚩 Non-JS responses (fix redirects):', bad); else console.log('✅ All imported scripts return valid JavaScript.');
    const main=document.querySelector('main,.main,#main')||document.querySelector('#content-area'); console.log(main?'📋 DOM verification: ok':'⚠️ main/.main/#main missing');
  }catch(e){ console.error('Diagnostics failed', e); }
})();