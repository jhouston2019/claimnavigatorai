import { fmtMoney, parseMoney } from './validation-utils.js';
export function renderTable(host,{columns,rows,calcTotal}){
  host.innerHTML=''; const t=document.createElement('table'), thead=document.createElement('thead'), tr=document.createElement('tr'); let asc=true, key=columns[0].key;
  columns.forEach(c=>{const th=document.createElement('th'); th.textContent=c.label; th.style.cursor='pointer'; th.onclick=()=>{ key=c.key; asc=!asc; paint(); }; tr.appendChild(th);}); thead.appendChild(tr); t.appendChild(thead);
  const tbody=document.createElement('tbody'); t.appendChild(tbody);
  function paint(){
    tbody.innerHTML=''; const list=[...rows].sort((a,b)=>{const A=a[key]??'',B=b[key]??''; const na=parseFloat(A), nb=parseFloat(B); return (isNaN(na)||isNaN(nb)? String(A).localeCompare(String(B)) : na-nb)*(asc?1:-1);});
    list.forEach(r=>{const tr=document.createElement('tr'); columns.forEach(c=>{const td=document.createElement('td'); let v=r[c.key]; if(c.money) v=fmtMoney(parseMoney(v)); td.textContent=v??''; tr.appendChild(td);}); tbody.appendChild(tr);});
    if(calcTotal){ const tot=rows.reduce((s,r)=>s+(parseMoney(r.amount)||0),0); const tf=document.createElement('tfoot'); const tr=document.createElement('tr'); const td=document.createElement('td'); td.colSpan=columns.length-1; td.textContent='TOTAL'; const td2=document.createElement('td'); td2.textContent=fmtMoney(tot); tr.appendChild(td); tr.appendChild(td2); tf.appendChild(tr); t.appendChild(tf); }
  }
  host.appendChild(t); paint(); return {update:(r)=>{rows=r; paint();}};
}