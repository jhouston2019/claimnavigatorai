import { callAI } from '/app/assets/js/api-client.js';
/** Bridge legacy inline calls -> module-safe window functions */
window.togglePhase = (id)=>document.getElementById(id)?.classList.toggle('open');
window.toggleTimelinePhase = (id)=>document.getElementById(id)?.classList.toggle('open');
window.generateResponse = async ()=>{
  const input = document.getElementById('ai-input')?.value?.trim();
  const out = document.getElementById('ai-output');
  if(!input||!out) return;
  out.innerHTML = '<span class="spinner"></span> Generating...';
  try{
    const r = await callAI(input,{type:'claim_response'});
    out.innerHTML = r.response || '(no content)';
  }catch(e){ out.innerHTML = `<div style="color:#dc2626">Error: ${e.message}</div>`; }
};
