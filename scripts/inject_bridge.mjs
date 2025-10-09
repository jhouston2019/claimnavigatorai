import {listFiles, read, write} from './_helpers.mjs';

const htmls = listFiles('app', ['.html']);
for (const p of htmls) {
  let h = read(p);
  if (/on[a-zA-Z]+\s*=/.test(h) && !/window-bridge\.js/.test(h)) {
    h = h.replace(/<\/body>/i, '<script type="module" src="/app/assets/js/window-bridge.js"></script>\n</body>');
    write(p, h);
  }
}
console.log('✅ Injected window-bridge where inline handlers were detected (if any).');
