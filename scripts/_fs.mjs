import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname } from 'path';
export const exist = p => existsSync(p);
export const ensure = p => mkdirSync(dirname(p), { recursive:true });
export const read = p => readFileSync(p, 'utf8');
export const write = (p,c) => { ensure(p); writeFileSync(p, c, 'utf8'); };
