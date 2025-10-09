import {existsSync,mkdirSync,readFileSync,writeFileSync,readdirSync,statSync,cpSync} from 'fs';
import {dirname,resolve,relative} from 'path';

export const ensureDir = (p)=> mkdirSync(p,{recursive:true});
export const read = (p)=> readFileSync(p,'utf8');
export const write = (p,c)=> { ensureDir(dirname(p)); writeFileSync(p,c,'utf8'); };
export const exist = (p)=> existsSync(p);
export const cpdir = (src,dst)=> cpSync(src,dst,{recursive:true,force:true,errorOnExist:false});
export const listFiles = (root, exts=['.html'])=>{
  const out=[];
  const walk=(d)=>{
    for(const f of readdirSync(d)){ const p=resolve(d,f); const st=statSync(p);
      if(st.isDirectory()) walk(p);
      else if(exts.some(e=>p.endsWith(e))) out.push(p);
    }
  };
  walk(resolve(root));
  return out;
};
export const replacer = (html, pairs)=> pairs.reduce((acc,[pattern, repl])=> acc.replace(pattern, repl), html);
