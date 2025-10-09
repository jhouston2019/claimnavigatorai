import {readdirSync, statSync, readFileSync, writeFileSync} from 'fs';
import {resolve} from 'path';

function walk(d,acc=[]){ 
  for(const n of readdirSync(d)){ 
    const p=resolve(d,n), s=statSync(p); 
    s.isDirectory()?walk(p,acc):(p.endsWith('.html')&&acc.push(p)); 
  } 
  return acc; 
}

const files = walk('app/response-center/claim-analysis-tools');
for(const f of files){
  let html=readFileSync(f,'utf8');
  if(!/i18n\.js/.test(html)){
    html = html.replace(/<\/body>/i, `<script type="module" src="/app/assets/js/i18n.js"></script>\n</body>`);
    writeFileSync(f, html, 'utf8'); 
    console.log('i18n patched', f);
  }
}
