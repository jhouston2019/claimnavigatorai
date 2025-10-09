import { fmtMoney, parseMoney } from './validation-utils.js';
export function renderTable(host,{columns,rows,calcTotal}){
  host.innerHTML='';
  const table=document.createElement('table'); table.style.width='100%'; table.style.borderCollapse='collapse';
  const thead=document.createElement('thead'), tr=document.createElement('tr');
  columns.forEach(c=>{ const th=document.createElement('th'); th.textContent=c.label; th.style.textAlign=c.align||'left'; th.style.borderBottom='1px solid #e5e7eb'; th.style.cursor='pointer';
    th.addEventListener('click',()=>sortBy(c.key)); tr.appendChild(th);});
  thead.appendChild(tr); table.appendChild(thead);
  const tbody=document.createElement('tbody'); table.appendChild(tbody);
  function paint(){
    tbody.innerHTML='';
    rows.forEach(r=>{
      const tr=document.createElement('tr');
      columns.forEach(c=>{
        const td=document.createElement('td'); let v=r[c.key]; if(c.money) v=fmtMoney(parseMoney(v)); td.textContent=v??''; td.style.padding='6px 4px'; tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    if(calcTotal){
      const tot=rows.reduce((s,r)=>s+(parseMoney(r.amount)||0),0);
      const f=document.createElement('tfoot'); const tr=document.createElement('tr');
      const td=document.createElement('td'); td.colSpan=columns.length-1; td.textContent='TOTAL'; td.style.fontWeight='700';
      const td2=document.createElement('td'); td2.textContent=fmtMoney(tot); td2.style.fontWeight='700';
      tr.appendChild(td); tr.appendChild(td2); f.appendChild(tr); table.appendChild(f);
    }
  }
  let asc=true;
  function sortBy(key){
    rows.sort((a,b)=>{ const av=a[key]??'', bv=b[key]??''; const na=parseFloat(av), nb=parseFloat(bv);
      if(!isNaN(na) && !isNaN(nb)) return asc?na-nb:nb-na;
      return asc?String(av).localeCompare(String(bv)):String(bv).localeCompare(String(av)); });
    asc=!asc; paint();
  }
  host.appendChild(table); paint();
  return {update:(r)=>{rows=r;paint();}};
}
