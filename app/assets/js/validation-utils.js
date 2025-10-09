export function required(v){ return v!=null && String(v).trim().length>0; }
export function isDate(v){ if(!v) return false; const d=new Date(v); return !isNaN(d.getTime()); }
export function parseMoney(v){ if(v==null) return NaN; const n=Number(String(v).replace(/[^0-9.-]/g,'')); return isFinite(n)?n:NaN; }
export function fmtMoney(n){ return isFinite(n)? new Intl.NumberFormat(undefined,{style:'currency',currency:'USD'}).format(n):''; }
export function markInvalid(el, bad=true){ if(!el) return; el.style.outline=bad?'2px solid #ef4444':''; el.style.backgroundColor=bad?'#fff1f2':''; }
export function validate(fields){ // {el, rules:[fn], msg?}
  let ok=true; fields.forEach(f=>{ const v=f.el?.value; const good=(f.rules||[]).every(fn=>fn(v)); markInvalid(f.el,!good); if(!good) ok=false;}); return ok;
}