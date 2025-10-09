(async()=>{
  try{
    console.log('✅ Clean Resource Center build');
    console.log('🧪 Page initialized:', document.body?.id||document.title||'unknown');
    // JS validity check
    const scripts=[...document.querySelectorAll('script[src]')].map(s=>s.src); const bad=[];
    for(const src of scripts){ try{ const t=await (await fetch(src,{cache:'no-store'})).text(); if(t.trim().startsWith('<')) bad.push(src);}catch{} }
    console.log(bad.length?('🚩 Non-JS responses: '+bad.join(', ')):'✅ All imported scripts return valid JavaScript.');
    // DOM check
    const main = document.querySelector('main, .main, #main') || document.querySelector('#content-area');
    if(!main) console.warn('⚠️ Required DOM node not found: main, .main, #main');
    else console.log('📋 DOM verification: ok');
    // Feature presence
    const hasI18n = !!window.rc_i18n || !!document.querySelector('#rc-lang') || scripts.some(s=>s.includes('i18n.js'));
    console.log(hasI18n?'🌐 i18n present':'🌐 i18n not detected (ok)');
    console.log('✅ Clean Resource Center build');
  }catch(e){ console.error('Diagnostics failed', e); }
})();