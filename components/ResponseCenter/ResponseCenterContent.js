/**
 * Response Center Content Component
 * Loads and manages the actual Response Center content and functionality
 */

class ResponseCenterContent {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      onContentChange: null,
      ...options
    };
    
    this.currentTab = 'how-to-use';
    this.tabContents = {};
    
    this.init();
  }

  init() {
    this.createContent();
    this.bindEvents();
    this.injectStyles();
  }

  createContent() {
    this.container.innerHTML = `
      <div class="response-center-content">
        <div class="content-header">
          <h1>Claim Resource & AI Response Center</h1>
          <p>AI-powered tools to strengthen your claim and generate professional responses</p>
        </div>
        
        <!-- Tabs -->
        <div class="tabs">
          <button class="tab active" data-tab="how-to-use">📚 How to Use This Site</button>
          <button class="tab" data-tab="ai-agent">🤖 AI Response & Analysis Agent</button>
          <button class="tab" data-tab="my-documents">📁 Claim Document Library</button>
          <button class="tab" data-tab="claim-playbook">📖 Claim Playbook</button>
          <button class="tab" data-tab="claim-timeline-guide">⏰ Claim Timeline & Sequence Guide</button>
          <button class="tab" data-tab="appeal-builder">⚖️ Appeal Builder</button>
          <button class="tab" data-tab="evidence-organizer">📸 Evidence Organizer</button>
          <button class="tab" data-tab="analysis-tools">🔍 Claim Analysis Tools</button>
          <button class="tab" data-tab="settings">⚙️ Settings</button>
        </div>
        
        <!-- Tab Contents -->
        <div class="tab-contents">
          ${this.createTabContent('how-to-use')}
          ${this.createTabContent('ai-agent')}
          ${this.createTabContent('my-documents')}
          ${this.createTabContent('claim-playbook')}
          ${this.createTabContent('claim-timeline-guide')}
          ${this.createTabContent('appeal-builder')}
          ${this.createTabContent('evidence-organizer')}
          ${this.createTabContent('analysis-tools')}
          ${this.createTabContent('settings')}
        </div>
      </div>
    `;
  }

  createTabContent(tabId) {
    const contents = {
      'how-to-use': this.createHowToUseContent(),
      'ai-agent': this.createAIAgentContent(),
      'my-documents': this.createMyDocumentsContent(),
      'claim-playbook': this.createClaimPlaybookContent(),
      'claim-timeline-guide': this.createClaimTimelineContent(),
      'appeal-builder': this.createAppealBuilderContent(),
      'evidence-organizer': this.createEvidenceOrganizerContent(),
      'analysis-tools': this.createAnalysisToolsContent(),
      'settings': this.createSettingsContent()
    };
    
    return `
      <div id="${tabId}" class="tab-content ${tabId === 'how-to-use' ? 'active' : ''}">
        ${contents[tabId]}
      </div>
    `;
  }

  createHowToUseContent() {
    return `
      <h2>How to Use This Site</h2>
      <p>Welcome to <strong>Claim Navigator</strong>. This guide shows you how to get the most out of the Resource Center and tools available.</p>

      <div class="tool-card" style="margin-bottom: 2rem;">
        <h3 style="color: var(--primary); margin-bottom: 1rem;">1. Explore the Resource Center</h3>
        <p>Use the sidebar to navigate between sections such as:</p>
        <ul style="margin: 1rem 0; padding-left: 1.5rem;">
          <li><strong>Claim Documentation Guides</strong> – ready-to-use letters and forms</li>
          <li><strong>AI Response & Analysis Agent</strong> – generate custom claim responses</li>
          <li><strong>Claim Timeline & Sequence Guide</strong> – step-by-step claim process</li>
          <li><strong>Appeal Builder</strong> – purchase and generate professional appeals</li>
        </ul>
      </div>

      <div class="tool-card" style="margin-bottom: 2rem;">
        <h3 style="color: var(--primary); margin-bottom: 1rem;">2. Choose a Document or Guide</h3>
        <p>Browse the <strong>Claim Documentation Guides</strong>.</p>
        <p>Each guide includes:</p>
        <ul style="margin: 1rem 0; padding-left: 1.5rem;">
          <li>A <strong>template PDF</strong> you can fill in</li>
          <li>A <strong>sample PDF</strong> showing what the finished version should look like</li>
        </ul>
      </div>

      <div class="tool-card" style="margin-bottom: 2rem;">
        <h3 style="color: var(--primary); margin-bottom: 1rem;">3. Use the AI Agent</h3>
        <p>Go to the <strong>AI Response & Analysis Agent</strong> tab.</p>
        <ul style="margin: 1rem 0; padding-left: 1.5rem;">
          <li>Enter your claim details and facts.</li>
          <li>The AI will produce a draft letter or response, tailored to your situation.</li>
        </ul>
      </div>

      <div class="tool-card" style="margin-bottom: 2rem;">
        <h3 style="color: var(--primary); margin-bottom: 1rem;">4. Download Your Files</h3>
        <ul style="margin: 1rem 0; padding-left: 1.5rem;">
          <li>All generated documents are delivered as secure PDFs.</li>
          <li>Every file is watermarked and imprinted with your policyholder information for protection.</li>
          <li>Save a copy to your records and send to your insurer when ready.</li>
        </ul>
      </div>

      <div class="tool-card" style="margin-bottom: 2rem;">
        <h3 style="color: var(--primary); margin-bottom: 1rem;">5. Follow the Claim Timeline</h3>
        <ul style="margin: 1rem 0; padding-left: 1.5rem;">
          <li>Open the <strong>Claim Timeline & Sequence Guide</strong>.</li>
          <li>Review the recommended order of actions for your claim.</li>
          <li>Mark off steps you've already completed to stay on track.</li>
        </ul>
      </div>

      <div class="tool-card" style="margin-bottom: 2rem;">
        <h3 style="color: var(--primary); margin-bottom: 1rem;">6. Appeal a Denial (Optional Upgrade)</h3>
        <ul style="margin: 1rem 0; padding-left: 1.5rem;">
          <li>If your claim is denied, visit the <strong>Appeal Builder</strong> tab.</li>
          <li>Appeals are a pay-per-appeal service ($249 each).</li>
          <li>Once purchased, you'll receive AI-generated appeal letters with your details pre-filled.</li>
        </ul>
      </div>

      <div class="tool-card" style="background: linear-gradient(135deg, #f0f9ff, #e0f2fe); border-left: 5px solid var(--primary);">
        <h3 style="color: var(--primary); margin-bottom: 1rem;">Quick Tips</h3>
        <ul style="margin: 1rem 0; padding-left: 1.5rem;">
          <li>Always double-check your input before generating documents.</li>
          <li>Keep copies of everything you download.</li>
          <li>Follow the sequence guide for the strongest claim results.</li>
        </ul>
        <p style="margin-top: 1rem; font-weight: 600; color: var(--primary);">👉 Next Step: Select any tab in the Resource Center menu to begin.</p>
      </div>
    `;
  }

  createAIAgentContent() {
    return `
      <h2>AI Response & Analysis Agent</h2>
      <p>Generate professional responses to insurance correspondence using AI.</p>
      
      <div class="tool-card">
        <h3>Input Your Correspondence</h3>
        <textarea id="ai-input" placeholder="Paste the insurance company's letter or email here..." style="width: 100%; height: 200px; padding: 1rem; border: 1px solid var(--border); border-radius: 0.5rem; margin-bottom: 1rem;"></textarea>
        <button class="btn-primary" onclick="generateAIResponse()">Generate AI Response</button>
      </div>
      
      <div class="tool-card" id="ai-output" style="display: none;">
        <h3>AI Generated Response</h3>
        <div id="ai-response-content"></div>
        <div class="action-buttons">
          <button class="btn-secondary" onclick="downloadResponse()">Download PDF</button>
          <button class="btn-secondary" onclick="copyResponse()">Copy to Clipboard</button>
        </div>
      </div>
    `;
  }

  createMyDocumentsContent() {
    return `
      <div class="documents-section">
        <div class="section-header">
          <h2>Claim Document Library</h2>
          <p>Access your complete library of 122 professional claim documents and templates.</p>
          
          <div class="language-toggle">
            <button id="lang-en" class="lang-btn active" data-lang="en">English</button>
            <button id="lang-es" class="lang-btn" data-lang="es">Español</button>
          </div>
        </div>
        
        <div class="tool-card">
          <h3>Document Search</h3>
          <input type="text" id="document-search" placeholder="Search documents..." style="width: 100%; padding: 0.75rem; border: 1px solid var(--border); border-radius: 0.5rem; margin-bottom: 1rem;">
          <button class="btn-primary" onclick="searchDocuments()">Search</button>
        </div>
        
        <div class="tool-card">
          <h3>My Documents</h3>
          <div id="documents-list">
            <div class="loading">Loading documents...</div>
          </div>
        </div>
        
        <div id="document-count" class="info-box" style="display: none;">
          <strong>📄 <span id="document-count-text">0</span> documents available in <span id="current-language">English</span></strong>
        </div>
      </div>
    `;
  }

  createClaimPlaybookContent() {
    return `
      <h2>Claim Playbook</h2>
      <p>Your comprehensive guide to managing your insurance claim.</p>
      
      <div class="playbook-container">
        <div class="playbook-overview">
          <h3>Claim Management Roadmap</h3>
          <p>Follow these phases to maximize your claim success. Each phase builds on the previous one to create a comprehensive claim strategy.</p>
        </div>
        
        <div class="playbook-phase">
          <div class="playbook-phase-header" onclick="togglePlaybookPhase(this)">
            <div class="playbook-phase-number">1</div>
            <div class="playbook-phase-title">Immediate Response & Documentation</div>
            <div class="playbook-phase-toggle">▼</div>
          </div>
          <div class="playbook-phase-body">
            <h4>Critical First Steps</h4>
            <ul>
              <li>Contact your insurance company immediately</li>
              <li>Document all damage with photos and videos</li>
              <li>Secure your property to prevent further damage</li>
              <li>Keep detailed records of all communications</li>
            </ul>
          </div>
        </div>
        
        <div class="playbook-phase">
          <div class="playbook-phase-header" onclick="togglePlaybookPhase(this)">
            <div class="playbook-phase-number">2</div>
            <div class="playbook-phase-title">Evidence Collection & Organization</div>
            <div class="playbook-phase-toggle">▼</div>
          </div>
          <div class="playbook-phase-body">
            <h4>Building Your Case</h4>
            <ul>
              <li>Gather all relevant documentation</li>
              <li>Create a comprehensive damage inventory</li>
              <li>Collect witness statements</li>
              <li>Document all expenses related to the claim</li>
            </ul>
          </div>
        </div>
        
        <div class="playbook-phase">
          <div class="playbook-phase-header" onclick="togglePlaybookPhase(this)">
            <div class="playbook-phase-number">3</div>
            <div class="playbook-phase-title">Claim Submission & Follow-up</div>
            <div class="playbook-phase-toggle">▼</div>
          </div>
          <div class="playbook-phase-body">
            <h4>Formal Claim Process</h4>
            <ul>
              <li>Submit your formal claim</li>
              <li>Follow up regularly with your adjuster</li>
              <li>Maintain detailed communication logs</li>
              <li>Request written confirmation of all decisions</li>
            </ul>
          </div>
        </div>
      </div>
    `;
  }

  createClaimTimelineContent() {
    return `
      <h2>Claim Timeline & Sequence Guide</h2>
      <p>Step-by-step timeline for managing your insurance claim.</p>
      
      <div class="tool-card">
        <h3>Phase 1: Immediate Response (0-24 hours)</h3>
        <ul>
          <li>Contact insurance company</li>
          <li>Document damage</li>
          <li>Secure property</li>
        </ul>
      </div>
      
      <div class="tool-card">
        <h3>Phase 2: Documentation (1-7 days)</h3>
        <ul>
          <li>Complete damage inventory</li>
          <li>Gather supporting documents</li>
          <li>Take detailed photos</li>
        </ul>
      </div>
      
      <div class="tool-card">
        <h3>Phase 3: Claim Submission (1-2 weeks)</h3>
        <ul>
          <li>Submit formal claim</li>
          <li>Provide all documentation</li>
          <li>Schedule adjuster visit</li>
        </ul>
      </div>
    `;
  }

  createAppealBuilderContent() {
    return `
      <h2>Appeal Builder</h2>
      <p>Professional appeal letters for denied claims.</p>
      
      <div class="tool-card">
        <h3>Appeal Letter Generator</h3>
        <p>Generate professional appeal letters tailored to your specific denial reason.</p>
        <button class="btn-primary">Start Appeal Builder</button>
      </div>
    `;
  }

  createEvidenceOrganizerContent() {
    return `
      <h2>Evidence Organizer</h2>
      <p>Organize and categorize your claim evidence.</p>
      
      <div class="evidence-upload-zone">
        <div class="upload-area" onclick="document.getElementById('evidence-upload').click()">
          <div class="upload-icon">📁</div>
          <h3>Upload Evidence Files</h3>
          <p>Drag and drop files here or click to browse</p>
          <input type="file" id="evidence-upload" multiple style="display: none;">
        </div>
      </div>
      
      <div class="ai-categorization-panel">
        <h3>AI Evidence Categorization</h3>
        <p>Our AI will automatically categorize your evidence for maximum impact.</p>
        <button class="btn-primary">Categorize Evidence</button>
      </div>
    `;
  }

  createAnalysisToolsContent() {
    return `
      <h2>Claim Analysis Tools</h2>
      <p>Analyze your claim for potential issues and opportunities.</p>
      
      <div class="tool-card">
        <h3>Claim Strength Analyzer</h3>
        <p>Evaluate the strength of your claim based on documentation and evidence.</p>
        <button class="btn-primary">Analyze Claim</button>
      </div>
      
      <div class="tool-card">
        <h3>Timeline Analysis</h3>
        <p>Review your claim timeline for any delays or issues.</p>
        <button class="btn-primary">Analyze Timeline</button>
      </div>
    `;
  }

  createSettingsContent() {
    return `
      <h2>Settings</h2>
      <p>Manage your account and preferences.</p>
      
      <div class="tool-card">
        <h3>Account Information</h3>
        <p>Credits: <span id="user-credits-display">Loading...</span></p>
        <button class="btn-primary" onclick="buyMoreCredits()">Buy More Credits</button>
      </div>
      
      <div class="tool-card">
        <h3>Preferences</h3>
        <label>
          <input type="checkbox" checked> Email notifications
        </label>
        <br>
        <label>
          <input type="checkbox" checked> Auto-save documents
        </label>
      </div>
    `;
  }

  bindEvents() {
    // Tab switching
    this.container.addEventListener('click', (e) => {
      if (e.target.classList.contains('tab')) {
        this.switchTab(e.target.dataset.tab);
      }
      
      // Language toggle events
      if (e.target.matches('.lang-btn')) {
        const lang = e.target.dataset.lang;
        this.switchLanguage(lang);
      }
    });
    
    // Document search events
    const searchInput = this.container.querySelector('#document-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchDocuments(e.target.value);
      });
    }
  }

  switchTab(tabId) {
    // Remove active class from all tabs and contents
    this.container.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    this.container.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Add active class to selected tab and content
    const selectedTab = this.container.querySelector(`[data-tab="${tabId}"]`);
    const selectedContent = this.container.querySelector(`#${tabId}`);
    
    if (selectedTab) selectedTab.classList.add('active');
    if (selectedContent) selectedContent.classList.add('active');
    
    this.currentTab = tabId;
    
    // Load documents when My Documents tab is selected
    if (tabId === 'my-documents') {
      // Load English documents by default
      this.loadDocuments('en');
    }
    
    // Trigger callback
    if (this.options.onContentChange) {
      this.options.onContentChange(tabId);
    }
  }

  injectStyles() {
    if (document.querySelector('#response-center-content-styles')) return;
    
    const styles = `
      <style id="response-center-content-styles">
        .response-center-content {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .content-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .content-header h1 {
          color: var(--primary);
          margin-bottom: 0.5rem;
        }

        .tabs {
          display: flex;
          border-bottom: 2px solid var(--border);
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .tab {
          padding: 1rem;
          cursor: pointer;
          border: none;
          background: none;
          border-bottom: 3px solid transparent;
          transition: all 0.2s;
        }

        .tab:hover {
          background: var(--bg-light);
        }

        .tab.active {
          border-bottom: 3px solid var(--primary);
          font-weight: bold;
          color: var(--primary);
        }

        .tab-content {
          display: none;
        }

        .tab-content.active {
          display: block;
        }

        .tool-card {
          background: var(--bg-light);
          padding: 1.5rem;
          border: 1px solid var(--border);
          border-radius: 0.5rem;
          margin-bottom: 1rem;
        }

        .tool-card h3 {
          color: var(--primary);
          margin-bottom: 1rem;
        }

        .btn-primary {
          background: var(--primary);
          color: #fff;
          border: none;
          border-radius: 0.5rem;
          padding: 0.75rem 1.5rem;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
          margin-right: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .btn-primary:hover {
          background: #1d4ed8;
        }

        .btn-secondary {
          background: var(--accent);
          color: #fff;
          border: none;
          border-radius: 0.5rem;
          padding: 0.75rem 1.5rem;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
          margin-right: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .btn-secondary:hover {
          background: #2563eb;
        }

        .action-buttons {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-top: 1rem;
        }

        /* Playbook Styles */
        .playbook-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .playbook-phase {
          background: #fff;
          border: 2px solid var(--border);
          border-radius: 12px;
          margin-bottom: 2rem;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .playbook-phase-header {
          background: linear-gradient(135deg, var(--primary), var(--accent));
          color: white;
          padding: 1.5rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .playbook-phase-number {
          background: rgba(255,255,255,0.2);
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 1.2rem;
        }

        .playbook-phase-title {
          font-size: 1.3rem;
          font-weight: 600;
          flex: 1;
        }

        .playbook-phase-toggle {
          font-size: 1.5rem;
          transition: transform 0.3s;
        }

        .playbook-phase.active .playbook-phase-toggle {
          transform: rotate(180deg);
        }

        .playbook-phase-body {
          display: none;
          padding: 2rem;
          background: #fafbfc;
        }

        .playbook-phase.active .playbook-phase-body {
          display: block;
        }

        .playbook-overview {
          background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
          padding: 1.5rem;
          border-radius: 12px;
          margin-bottom: 2rem;
          border-left: 5px solid var(--primary);
        }

        /* Evidence Organizer Styles */
        .evidence-upload-zone {
          margin: 2rem 0;
        }

        .upload-area {
          border: 3px dashed var(--border);
          border-radius: 12px;
          padding: 3rem;
          text-align: center;
          background: var(--bg-light);
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .upload-area:hover {
          border-color: var(--primary);
          background: #f0f9ff;
        }

        .upload-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .ai-categorization-panel {
          background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 1.5rem;
          margin: 2rem 0;
        }

        /* Mobile responsive */
        @media (max-width: 768px) {
          .tabs {
            flex-direction: column;
          }

          .tab {
            text-align: left;
            padding: 0.75rem;
          }

          .response-center-content {
            padding: 1rem;
          }
        }

        /* Document Library Styles */
        .documents-section {
          max-width: 100%;
        }

        .section-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .section-header h2 {
          color: var(--primary);
          margin-bottom: 0.5rem;
        }

        .language-toggle {
          display: flex;
          gap: 0.5rem;
          justify-content: center;
          margin-top: 1rem;
        }

        .lang-btn {
          padding: 0.5rem 1rem;
          border: 2px solid var(--border);
          background: white;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .lang-btn.active {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }

        .lang-btn:hover {
          border-color: var(--primary);
        }

        .document-item {
          background: white;
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 1.5rem;
          margin-bottom: 1rem;
          transition: all 0.3s ease;
        }

        .document-item:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          border-color: var(--primary);
        }

        .document-header h4 {
          color: var(--primary);
          margin-bottom: 0.5rem;
          font-size: 1.1rem;
        }

        .document-header p {
          color: #666;
          margin-bottom: 1rem;
          line-height: 1.5;
        }

        .document-actions {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .document-actions .btn-secondary {
          padding: 0.5rem 1rem;
          background: var(--bg-light);
          border: 1px solid var(--border);
          border-radius: 4px;
          color: var(--text);
          text-decoration: none;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .document-actions .btn-secondary:hover {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }

        .info-box {
          background: #e0f2fe;
          border: 1px solid #b3e5fc;
          border-radius: 8px;
          padding: 1rem;
          margin-top: 1rem;
          text-align: center;
          color: #0277bd;
        }

        .loading {
          text-align: center;
          padding: 2rem;
          color: #666;
        }

        .error-message {
          background: #ffebee;
          border: 1px solid #ffcdd2;
          border-radius: 8px;
          padding: 1rem;
          color: #c62828;
        }
      </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', styles);
  }
}

// Global functions for backward compatibility
window.togglePlaybookPhase = function(header) {
  const phase = header.parentElement;
  const isActive = phase.classList.contains('active');
  
  // Close all phases
  document.querySelectorAll('.playbook-phase').forEach(p => p.classList.remove('active'));
  
  // Open clicked phase if it wasn't already active
  if (!isActive) {
    phase.classList.add('active');
  }
};

window.generateAIResponse = function() {
  const input = document.getElementById('ai-input').value;
  if (!input.trim()) {
    alert('Please enter some text first.');
    return;
  }
  
  // Simulate AI response generation
  const output = document.getElementById('ai-output');
  const content = document.getElementById('ai-response-content');
  
  content.innerHTML = `
    <div style="background: #f0f9ff; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem;">
      <strong>AI Generated Response:</strong><br>
      Based on your input, here's a professional response to the insurance company...
    </div>
  `;
  
  output.style.display = 'block';
};

// Document loading methods
ResponseCenterContent.prototype.loadDocuments = async function(language = 'en') {
  try {
    const docsUrl = language === 'es' ? '/assets/docs/es/documents.json' : '/assets/data/documents.json';
    const response = await fetch(docsUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to load documents: ${response.status}`);
    }
    
    const docsData = await response.json();
    
    // Convert object to array and sort by label
    const docsArray = Object.values(docsData).sort((a, b) => a.label.localeCompare(b.label));
    
    this.renderDocuments(docsArray, language);
    this.updateDocumentCount(docsArray.length, language);
    
  } catch (error) {
    console.error('Error loading documents:', error);
    this.showDocumentError(error.message);
  }
};

ResponseCenterContent.prototype.renderDocuments = function(documents, language) {
  const documentsList = this.container.querySelector('#documents-list');
  if (!documentsList) return;

  const documentsHtml = documents.map(doc => `
    <div class="document-item">
      <div class="document-header">
        <h4>${doc.label}</h4>
        <p>${doc.description}</p>
      </div>
      <div class="document-actions">
        ${doc.templatePath ? `<button class="btn-secondary" onclick="downloadDocument('${doc.templatePath}', 'template')">Download Template</button>` : ''}
        ${doc.samplePath ? `<button class="btn-secondary" onclick="downloadDocument('${doc.samplePath}', 'sample')">View Sample</button>` : ''}
      </div>
    </div>
  `).join('');

  documentsList.innerHTML = documentsHtml;
};

ResponseCenterContent.prototype.updateDocumentCount = function(count, language) {
  const countElement = this.container.querySelector('#document-count-text');
  const langElement = this.container.querySelector('#current-language');
  const countBox = this.container.querySelector('#document-count');
  
  if (countElement) countElement.textContent = count;
  if (langElement) langElement.textContent = language === 'es' ? 'Spanish' : 'English';
  if (countBox) countBox.style.display = 'block';
};

ResponseCenterContent.prototype.showDocumentError = function(message) {
  const documentsList = this.container.querySelector('#documents-list');
  if (documentsList) {
    documentsList.innerHTML = `<div class="error-message" style="color: red; padding: 1rem; text-align: center;">Error loading documents: ${message}</div>`;
  }
};

ResponseCenterContent.prototype.switchLanguage = function(language) {
  // Update language button states
  this.container.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  this.container.querySelector(`[data-lang="${language}"]`).classList.add('active');
  
  // Load documents for the selected language
  this.loadDocuments(language);
};

ResponseCenterContent.prototype.searchDocuments = function(query) {
  const documentItems = this.container.querySelectorAll('.document-item');
  const searchTerm = query.toLowerCase();
  
  documentItems.forEach(item => {
    const title = item.querySelector('h4').textContent.toLowerCase();
    const description = item.querySelector('p').textContent.toLowerCase();
    
    if (title.includes(searchTerm) || description.includes(searchTerm)) {
      item.style.display = 'block';
    } else {
      item.style.display = 'none';
    }
  });
};

window.downloadResponse = function() {
  alert('Download functionality would be implemented here.');
};

window.downloadDocument = function(filePath, type) {
  // Create a link to download the document
  const link = document.createElement('a');
  link.href = `/Document Library - Final ${type === 'template' ? 'English' : 'English'}/${filePath}`;
  link.download = filePath;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

window.copyResponse = function() {
  alert('Copy to clipboard functionality would be implemented here.');
};

window.buyMoreCredits = function() {
  alert('Credit purchase functionality would be implemented here.');
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ResponseCenterContent;
}

// Global registration
if (typeof window !== 'undefined') {
  window.ResponseCenterContent = ResponseCenterContent;
}
