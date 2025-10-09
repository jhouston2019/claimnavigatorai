export const required=v=>String(v||'').trim().length>0;
export const isDate=v=>{const d=new Date(v); return !isNaN(d.getTime());};
export const parseMoney=v=>{const n=Number(String(v||'').replace(/[^0-9.-]/g,'')); return isFinite(n)?n:NaN;};
export const fmtMoney=n=>isFinite(n)?new Intl.NumberFormat(undefined,{style:'currency',currency:'USD'}).format(n):'';
export function mark(el,bad){ if(!el) return; el.classList.toggle('invalid',!!bad); }
export function validate(defs){ let ok=true; defs.forEach(([id,rule])=>{ const el=document.getElementById(id); const v=el?.value; const good=(rule==='req'?required(v):rule==='date'?isDate(v):!isNaN(parseMoney(v))); mark(el,!good); if(!good) ok=false;}); return ok; }