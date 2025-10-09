export const qs=(s,sc=document)=>sc.querySelector(s);
export const qsa=(s,sc=document)=>[...sc.querySelectorAll(s)];
export const on=(el,ev,fn)=>el&&el.addEventListener(ev,fn);
export function toast(msg,ok=false){ let el=qs('#toast'); if(!el){ el=document.createElement('div'); el.id='toast'; el.className='toast'; document.body.appendChild(el); }
  el.style.background=ok?'#065f46':'#7f1d1d'; el.textContent=msg; el.style.display='block'; setTimeout(()=>{el.style.display='none';},2200);
}