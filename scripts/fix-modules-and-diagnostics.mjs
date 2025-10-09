import { readdirSync, statSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const ROOTS = ['.', 'app']; // include root and /app in case response-center.html is at root

function walk(dir, out=[]) {
  for (const name of readdirSync(dir)) {
    const p = resolve(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (p.endsWith('.html')) out.push(p);
  }
  return out;
}

function ensureModuleTags(html) {
  // 1) Any /app/assets/js/*.js MUST be loaded as type="module"
  html = html.replace(
    /<script(?![^>]*type\s*=\s*["']module["'])\s+([^>]*?)\bsrc\s*=\s*["'](\/app\/assets\/js\/[^"']+\.js)["']([^>]*)>\s*<\/script>/g,
    '<script type="module" $1 src="$2"$3></script>'
  );
  // 2) Also catch relative assets like ./assets/js/*.js or ../assets/js/*.js and rewrite to /app/… + module
  html = html.replace(
    /<script(?![^>]*type\s*=\s*["']module["'])\s+([^>]*?)\bsrc\s*=\s*["'](\.{0,2}\/assets\/js\/[^"']+\.js)["']([^>]*)>\s*<\/script>/g,
    (m, pre, src, suf) => `<script type="module" ${pre} src="/app/${src.replace(/^\.\//,'').replace(/^\.\.\//,'')}">${suf}</script>`
  );
  return html;
}

function ensureDiagnostics(html) {
  if (!/\/app\/assets\/js\/diagnostics\.js/.test(html)) {
    html = html.replace(/<\/body>/i, '<script type="module" src="/app/assets/js/diagnostics.js"></script>\n</body>');
  }
  return html;
}

function ensureBridgeIfInline(html) {
  // If page still has inline event handlers, inject the module bridge once
  if (/on[a-zA-Z]+\s*=/.test(html) && !/\/app\/assets\/js\/window-bridge\.js/.test(html)) {
    html = html.replace(/<\/body>/i, '<script type="module" src="/app/assets/js/window-bridge.js"></script>\n</body>');
  }
  return html;
}

const files = ROOTS.flatMap(r => {
  try { return walk(resolve(r)); } catch { return []; }
}).filter(p => /\/app\/|response-center\.html$|index\.html$/.test(p)); // focus on site pages

let changed = 0;
for (const p of files) {
  let html = readFileSync(p, 'utf8');
  const orig = html;

  html = ensureModuleTags(html);
  html = ensureDiagnostics(html);
  html = ensureBridgeIfInline(html);

  if (html !== orig) {
    writeFileSync(p, html, 'utf8');
    changed++;
    console.log('updated:', p);
  }
}
console.log('✅ HTML files updated:', changed);

// --- Patch diagnostics.js to ping the correct function with a valid payload ---
const diagPath = resolve('app/assets/js/diagnostics.js');
try {
  let d = readFileSync(diagPath, 'utf8');

  // Replace any test call to /generate-response-public with /generate-response and valid body
  d = d.replace(/\/\.netlify\/functions\/generate-response-public/g, '/.netlify/functions/generate-response');

  // Ensure the test sends the body your function expects (inputText at minimum)
  if (!/testApiEndpoint/.test(d)) {
    // Add a tiny test function if not present
    d = `
async function testApiEndpoint(){
  try{
    const r = await fetch('/.netlify/functions/generate-response', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ inputText: 'ping', language: 'en' })
    });
    if(!r.ok){ console.warn('⚠️ generate-response endpoint returned', r.status); }
  }catch(e){ console.warn('⚠️ generate-response ping failed', e.message); }
}
${d}
try{ testApiEndpoint(); }catch(_){}
`;
  } else {
    // If your file has testApiEndpoint already, just ensure it uses a good payload
    d = d.replace(/body:\s*JSON\.stringify\([^)]*\)/g, "body: JSON.stringify({ inputText: 'ping', language: 'en' })");
  }

  writeFileSync(diagPath, d, 'utf8');
  console.log('✅ diagnostics.js ping fixed');
} catch {
  console.log('ℹ️ diagnostics.js not found (skipped ping fix)');
}
