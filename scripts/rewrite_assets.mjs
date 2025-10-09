import {listFiles, read, write} from './_helpers.mjs';

const htmls = listFiles('app', ['.html']);
for (const p of htmls) {
  let h = read(p);

  // Link CSS -> /app/assets/css/style.css (absolute)
  h = h.replace(/href=["'](?:\.{0,2}\/)?assets\/css\/style\.css["']/g, 'href="/app/assets/css/style.css"');

  // JS src -> /app/assets/js/*
  h = h.replace(/src=["'](?:\.{0,2}\/)?assets\/js\/([^"']+)["']/g, 'src="/app/assets/js/$1"');

  // Ensure module scripts for our files (diagnostics, api-client, ui-helpers)
  h = h.replace(/<script([^>]*?)\s+src="\/app\/assets\/js\/(api-client|ui-helpers|diagnostics)\.js"([^>]*)><\/script>/g,
                '<script type="module"$1 src="/app/assets/js/$2.js"$3></script>');

  // Inject diagnostics if missing (before </body>)
  if (!/assets\/js\/diagnostics\.js/.test(h)) {
    h = h.replace(/<\/body>/i, '<script type="module" src="/app/assets/js/diagnostics.js"></script>\n</body>');
  }

  write(p, h);
}
console.log('✅ Rewrote asset paths & ensured module scripts/diagnostics on all /app HTML.');
