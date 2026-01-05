const fs = require('fs');
const path = require('path');

// Read data files
const statesPath = path.join(__dirname, '../data/states.json');
const pillarsPath = path.join(__dirname, '../data/pillars.json');
const states = JSON.parse(fs.readFileSync(statesPath, 'utf8'));
const pillars = JSON.parse(fs.readFileSync(pillarsPath, 'utf8'));

// State template
const stateTemplate = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>{{state}} Fire Claim Guide • Claim Navigator</title>
  <meta name="description" content="Insurance claim deadlines, proof of loss requirements, and contact information for {{state}}. Fire damage claim guide with state-specific regulations.">
  <meta name="keywords" content="{{state}} fire claim, {{state}} insurance, {{state}} deadline, {{state}} DOI, fire damage claim {{state}}">
  <link rel="stylesheet" href="/app/assets/css/style.css">
  <link rel="stylesheet" href="/app/assets/css/design-system.css">
  <link rel="stylesheet" href="/app/assets/css/resource-center.css">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "{{state}} Fire Claim Guide",
    "description": "Fire insurance claim deadlines, proof of loss requirements, and contact info for {{state}}",
    "about": {
      "@type": "Place",
      "name": "{{state}}"
    }
  }
  </script>
  <style>
    body.state-guide-page {
      background: 
        linear-gradient(rgba(0, 0, 0, 0.85), rgba(0, 0, 0, 0.85)),
        url('../../../assets/images/backgrounds/ai5.jpg') !important;
      background-size: cover !important;
      background-position: center !important;
      background-attachment: fixed !important;
      color: #ffffff !important;
    }
    body.state-guide-page * { color: #ffffff !important; }
    body.state-guide-page a { color: #dbeafe !important; }
    .guide-container { max-width: 900px; margin: 0 auto; padding: 2rem; }
    .guide-header { text-align: center; margin-bottom: 2rem; padding: 2rem; background: rgba(255, 255, 255, 0.1); border-radius: 1rem; backdrop-filter: blur(8px); border: 1px solid rgba(255, 255, 255, 0.2); }
    .guide-header h1 { font-size: 2.5rem; font-weight: 700; margin: 0 0 0.5rem 0; }
    .info-section { background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 1rem; padding: 2rem; margin-bottom: 2rem; backdrop-filter: blur(8px); }
    .info-item { margin-bottom: 1.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid rgba(255, 255, 255, 0.1); }
    .info-item:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
    .info-item strong { display: block; margin-bottom: 0.5rem; font-size: 1.1rem; color: #3b82f6 !important; }
    .info-item p { margin: 0; line-height: 1.6; }
    .btn { display: inline-block; padding: 0.75rem 1.5rem; background: #3b82f6; color: #ffffff !important; border-radius: 0.5rem; text-decoration: none; font-weight: 600; transition: all 0.2s; }
    .btn:hover { background: #2563eb; transform: translateY(-1px); }
    .tools-section { background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 1rem; padding: 2rem; margin-top: 2rem; }
    .tools-section h3 { margin: 0 0 1rem 0; }
    .tools-section ul { margin: 0.5rem 0 0 1.5rem; padding: 0; }
    .tools-section li { margin: 0.5rem 0; }
  </style>
</head>
<body class="resource-center state-guide-page">
  <header class="header">
    <div class="bar container">
      <div class="brand"><div class="logo"></div><div>Claim Navigator</div></div>
      <nav class="nav">
        <a href="/app/index.html">Home</a>
        <a href="/app/resource-center.html">Resource Center</a>
        <a href="/app/authority-hub.html">Authority Hub</a>
      </nav>
    </div>
  </header>

  <main class="container">
    <div class="guide-container">
      <div class="guide-header">
        <h1>{{state}} Fire Claim Guide</h1>
        <p style="color: #dbeafe !important;">State-specific insurance claim deadlines and regulatory information</p>
      </div>

      <div class="info-section">
        <div class="info-item">
          <strong>Proof of Loss Deadline</strong>
          <p>{{deadline}} from the date of loss. This is the standard timeframe for submitting your proof of loss documentation to your insurance company.</p>
        </div>

        <div class="info-item">
          <strong>State Insurance Department</strong>
          <p><strong>{{fire_contact}}</strong></p>
          <p style="margin-top: 0.5rem;">
            <a href="{{website}}" target="_blank" rel="noopener noreferrer" class="btn">Visit {{state}} Insurance Department →</a>
          </p>
          {{#if email}}
          <p style="margin-top: 0.5rem; color: #dbeafe !important;">Email: <a href="mailto:{{email}}">{{email}}</a></p>
          {{/if}}
        </div>

        <div class="info-item">
          <strong>Important Notes</strong>
          <p>Deadlines may vary based on policy language and specific circumstances. Always review your insurance policy carefully. If you have questions or need assistance with your claim, contact your state insurance department or use ClaimNavigator's tools below.</p>
        </div>
      </div>

      <div class="tools-section">
        <h3>ClaimNavigator Tools for {{state}} Claims</h3>
        <p style="color: #dbeafe !important; margin-bottom: 1rem;">Use these tools to stay compliant and organized with your {{state}} fire claim:</p>
        <ul>
          <li><a href="/app/deadlines.html">Deadline Tracker</a> - Track and manage critical claim deadlines with AI detection</li>
          <li><a href="/app/statement-of-loss.html">Statement of Loss</a> - Financial ledger and PDF generator for claim transactions</li>
          <li><a href="/app/claim-journal.html">Claim Journal</a> - Document all claim events, calls, and submissions</li>
          <li><a href="/app/cn-agent.html">CN Agent</a> - AI Copilot for automated claim management</li>
        </ul>
        <p style="margin-top: 1rem;">
          <a href="/app/authority-hub.html" class="btn">← Back to Authority Hub</a>
        </p>
      </div>
    </div>
  </main>
</body>
</html>`;

// Pillar template
const pillarTemplate = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>{{title}} • Claim Navigator</title>
  <meta name="description" content="{{desc}}">
  <meta name="keywords" content="{{keywords}}">
  <link rel="stylesheet" href="/app/assets/css/style.css">
  <link rel="stylesheet" href="/app/assets/css/design-system.css">
  <link rel="stylesheet" href="/app/assets/css/resource-center.css">
  <style>
    body.pillar-guide-page {
      background: 
        linear-gradient(rgba(0, 0, 0, 0.85), rgba(0, 0, 0, 0.85)),
        url('../../../assets/images/backgrounds/paperwork6.jpeg') !important;
      background-size: cover !important;
      background-position: center !important;
      background-attachment: fixed !important;
      color: #ffffff !important;
    }
    body.pillar-guide-page * { color: #ffffff !important; }
    body.pillar-guide-page a { color: #dbeafe !important; }
    .guide-container { max-width: 900px; margin: 0 auto; padding: 2rem; }
    .guide-header { text-align: center; margin-bottom: 2rem; padding: 2rem; background: rgba(255, 255, 255, 0.1); border-radius: 1rem; backdrop-filter: blur(8px); border: 1px solid rgba(255, 255, 255, 0.2); }
    .guide-header h1 { font-size: 2.5rem; font-weight: 700; margin: 0 0 0.5rem 0; }
    .content-section { background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 1rem; padding: 2rem; margin-bottom: 2rem; backdrop-filter: blur(8px); }
    .content-section p { line-height: 1.8; margin-bottom: 1rem; }
    .content-section ul { margin: 1rem 0 1rem 2rem; }
    .content-section li { margin: 0.5rem 0; line-height: 1.6; }
    .btn { display: inline-block; padding: 0.75rem 1.5rem; background: #3b82f6; color: #ffffff !important; border-radius: 0.5rem; text-decoration: none; font-weight: 600; transition: all 0.2s; }
    .btn:hover { background: #2563eb; transform: translateY(-1px); }
    .tools-section { background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 1rem; padding: 2rem; margin-top: 2rem; }
    .tools-section h3 { margin: 0 0 1rem 0; }
    .tools-section ul { margin: 0.5rem 0 0 1.5rem; padding: 0; }
    .tools-section li { margin: 0.5rem 0; }
  </style>
</head>
<body class="resource-center pillar-guide-page">
  <header class="header">
    <div class="bar container">
      <div class="brand"><div class="logo"></div><div>Claim Navigator</div></div>
      <nav class="nav">
        <a href="/app/index.html">Home</a>
        <a href="/app/resource-center.html">Resource Center</a>
        <a href="/app/authority-hub.html">Authority Hub</a>
      </nav>
    </div>
  </header>

  <main class="container">
    <div class="guide-container">
      <div class="guide-header">
        <h1>{{title}}</h1>
        <p style="color: #dbeafe !important;">Comprehensive guide for {{title}}</p>
      </div>

      <div class="content-section">
        <p>{{desc}}</p>
        <p>See <a href="/app/authority-hub.html">Claim Authority Hub</a> for state-specific deadlines and regulatory requirements.</p>
      </div>

      <div class="tools-section">
        <h3>ClaimNavigator Tools for {{title}}</h3>
        <p style="color: #dbeafe !important; margin-bottom: 1rem;">Use these tools to manage your claim effectively:</p>
        <ul>
          <li><a href="/app/deadlines.html">Deadline Tracker</a> - Track and manage critical claim deadlines with AI detection</li>
          <li><a href="/app/statement-of-loss.html">Statement of Loss</a> - Financial ledger and PDF generator for claim transactions</li>
          <li><a href="/app/claim-journal.html">Claim Journal</a> - Document all claim events, calls, and submissions</li>
          <li><a href="/app/cn-agent.html">CN Agent</a> - AI Copilot for automated claim management</li>
        </ul>
        <p style="margin-top: 1rem;">
          <a href="/app/authority-hub.html" class="btn">← Back to Authority Hub</a>
        </p>
      </div>
    </div>
  </main>
</body>
</html>`;

// Create directories if they don't exist
const stateGuidesDir = path.join(__dirname, '../app/state-guides');
const pillarGuidesDir = path.join(__dirname, '../app/pillar-guides');

if (!fs.existsSync(stateGuidesDir)) {
  fs.mkdirSync(stateGuidesDir, { recursive: true });
}

if (!fs.existsSync(pillarGuidesDir)) {
  fs.mkdirSync(pillarGuidesDir, { recursive: true });
}

// Generate state pages
console.log('Generating state pages...');
for (const state of states) {
  let output = stateTemplate
    .replace(/\{\{state\}\}/g, state.state)
    .replace(/\{\{abbr\}\}/g, state.abbr)
    .replace(/\{\{deadline\}\}/g, state.deadline)
    .replace(/\{\{fire_contact\}\}/g, state.fire_contact)
    .replace(/\{\{website\}\}/g, state.website);
  
  // Handle optional email field
  if (state.email) {
    output = output.replace(/\{\{#if email\}\}/g, '');
    output = output.replace(/\{\{\/if\}\}/g, '');
    output = output.replace(/\{\{email\}\}/g, state.email);
  } else {
    output = output.replace(/\{\{#if email\}\}[\s\S]*?\{\{\/if\}\}/g, '');
  }
  
  const filePath = path.join(stateGuidesDir, `${state.abbr}.html`);
  fs.writeFileSync(filePath, output);
  console.log(`  ✓ Generated ${state.abbr}.html`);
}

// Generate pillar pages
console.log('\nGenerating pillar pages...');
for (const pillar of pillars) {
  let output = pillarTemplate
    .replace(/\{\{title\}\}/g, pillar.title)
    .replace(/\{\{desc\}\}/g, pillar.desc)
    .replace(/\{\{keywords\}\}/g, pillar.keywords || '');
  
  const filePath = path.join(pillarGuidesDir, `${pillar.slug}.html`);
  fs.writeFileSync(filePath, output);
  console.log(`  ✓ Generated ${pillar.slug}.html`);
}

console.log('\n✅ Authority pages generated successfully!');
console.log(`   - ${states.length} state pages`);
console.log(`   - ${pillars.length} pillar pages`);


