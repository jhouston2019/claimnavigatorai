export function parseCSV(text){
  if(!text) return [];
  const rows=[]; let i=0, field='', row=[], inQ=false; text=text.replace(/\r/g,'')+'\n';
  while(i<text.length){
    const c=text[i++];
    if(c==='\"'){ inQ=!inQ; }
    else if(c===',' && !inQ){ row.push(field); field=''; }
    else if((c==='\n') && !inQ){ row.push(field); rows.push(row); row=[]; field=''; }
    else{ field+=c; }
  }
  return rows.filter(r=>r.some(c=>String(c).trim()!==''));
}
export function toCSV(rows){ return rows.map(r=>r.map(c=>/[,\"\n]/.test(c)?`"${String(c).replace(/"/g,'""')}"`:String(c)).join(',')).join('\n'); }
