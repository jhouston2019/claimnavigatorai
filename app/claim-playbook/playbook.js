(function(){
  const $ = (sel, ctx=document) => ctx.querySelector(sel);
  const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

  // Year
  const y = $("#year");
  if (y) y.textContent = new Date().getFullYear();

  // Theme toggle
  const root = document.documentElement;
  const toggleThemeBtn = $('[data-action="toggle-theme"]');
  const savedTheme = localStorage.getItem('cn-theme');
  if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);
  toggleThemeBtn?.addEventListener('click', () => {
    const cur = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', cur);
    localStorage.setItem('cn-theme', cur);
  });

  // TOC active link on scroll (simple scrollspy)
  const sections = $$('.chapter[id]');
  const tocLinks = $$('#toc a');
  const onScroll = () => {
    let current = sections[0]?.id;
    sections.forEach(sec => {
      const top = sec.getBoundingClientRect().top;
      if (top <= 120) current = sec.id;
    });
    tocLinks.forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === '#' + current);
    });
  };
  document.addEventListener('scroll', onScroll, {passive:true});
  onScroll();

  // Expand/Collapse All
  $('[data-action="expand-all"]')?.addEventListener('click', ()=> {
    $$('#content details').forEach(d => d.open = true);
  });
  $('[data-action="collapse-all"]')?.addEventListener('click', ()=> {
    $$('#content details').forEach(d => d.open = false);
  });

  // Search
  const search = $('#playbook-search');
  search?.addEventListener('input', () => {
    const q = search.value.trim().toLowerCase();
    sections.forEach(sec => {
      const keys = (sec.getAttribute('data-keywords') || '').toLowerCase();
      const text = sec.textContent.toLowerCase();
      const hit = !q || keys.includes(q) || text.includes(q);
      sec.style.display = hit ? '' : 'none';
    });
  });

  // Copy template buttons
  const copyBtns = $$('[data-copy]');
  copyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = $(btn.getAttribute('data-copy'));
      if (!target) return;
      navigator.clipboard.writeText(target.value || target.textContent || '').then(()=>{
        btn.textContent = 'Copied!';
        setTimeout(()=>btn.textContent='Copy', 1000);
      });
    });
  });

  // Template openers (for quick copy)
  const tmplBtns = $$('[data-template]');
  tmplBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = $(btn.getAttribute('data-template'));
      if (!target) return;
      navigator.clipboard.writeText(target.value || '').then(()=>{
        btn.textContent = 'Copied!';
        setTimeout(()=>btn.textContent='Copy', 1000);
      });
    });
  });

  // Tool launchers – route these to your existing pages/modals
  const routeMap = {
    'open-incident-log': '/app/response-center.html?tab=incident-log',
    'open-document-generator': '/app/response-center.html?tab=documents',
    'open-ai-agent': '/app/response-center.html?tab=ai-agent',
    'open-claim-diary': '/app/response-center.html?tab=diary',
    'open-evidence-vault': '/app/response-center.html?tab=evidence',
    'open-proof-of-loss': '/app/response-center.html?tab=pol',
    'open-coverage-decoder': '/app/response-center.html?tab=coverage-decoder',
    'open-doc-organizer': '/app/response-center.html?tab=organizer',
    'open-state-rules': '/app/response-center.html?tab=state-rules',
    'open-inventory-starter': '/app/response-center.html?tab=inventory-starter'
  };

  $$('.tool,[data-tool]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tool = btn.getAttribute('data-tool');
      const doc = btn.getAttribute('data-doc') || '';
      const intent = btn.getAttribute('data-intent') || '';
      if (!tool) return;

      // Example: pass context via query params for AI agent
      const base = routeMap[tool] || '/response-center';
      const url = new URL(base, window.location.origin);
      if (doc) url.searchParams.set('doc', doc);
      if (intent) url.searchParams.set('intent', intent);

      // If you prefer modals, emit a custom event instead:
      // document.dispatchEvent(new CustomEvent('open-tool', { detail: { tool, doc, intent }}));
      window.location.href = url.toString();
    });
  });

  // State Rule Lookup button
  $('[data-tool="open-state-rules"]')?.addEventListener('click', () => {
    const state = $('#state-select')?.value || '';
    const url = new URL('/app/response-center.html', window.location.origin);
    url.searchParams.set('tab','state-rules');
    if (state) url.searchParams.set('state', state);
    window.location.href = url.toString();
  });

  // Preserve hash navigation offset
  if (location.hash) {
    const el = $(location.hash);
    el && el.scrollIntoView({behavior:'smooth', block:'start'});
  }
})();
