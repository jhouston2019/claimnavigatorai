/**
 * Claim Resource & AI Response Center Component
 * Main component with hybrid navigation system
 */

class ResponseCenter {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      ...options
    };
    
    this.currentSection = 'dashboard';
    this.sections = {};
    
    this.init();
  }

  init() {
    this.createLayout();
    this.initializeComponents();
    this.bindEvents();
    this.loadSection('dashboard');
  }

  createLayout() {
    // Main container
    this.mainContainer = document.createElement('div');
    this.mainContainer.className = 'response-center';
    
    // Sidebar container
    this.sidebarContainer = document.createElement('div');
    this.sidebarContainer.className = 'sidebar-container';
    
    // Main content area
    this.contentArea = document.createElement('div');
    this.contentArea.className = 'main-content-area';
    
    // Content wrapper
    this.contentWrapper = document.createElement('div');
    this.contentWrapper.className = 'content-wrapper';
    
    this.mainContainer.appendChild(this.sidebarContainer);
    this.mainContainer.appendChild(this.contentArea);
    this.contentArea.appendChild(this.contentWrapper);
    this.container.appendChild(this.mainContainer);
  }

  initializeComponents() {
    // Initialize sidebar navigation
    this.sidebarNav = new SidebarNav(this.sidebarContainer, {
      onSectionChange: (sectionId) => {
        this.loadSection(sectionId);
      }
    });
    
    // Initialize dashboard
    this.dashboard = new DashboardLanding(this.contentWrapper, {
      onCardClick: (sectionId) => {
        this.loadSection(sectionId);
      }
    });
    
    // Initialize section components
    this.initializeSections();
  }

  initializeSections() {
    // Document Library section
    this.sections['document-library'] = this.createDocumentLibrarySection();
    this.sections['templates'] = this.createTemplatesSection();
    this.sections['samples'] = this.createSamplesSection();
    this.sections['policy-requests'] = this.createPolicyRequestsSection();
    
    // Other sections
    this.sections['situational-advisory'] = this.createSituationalAdvisorySection();
    this.sections['insurance-tactics'] = this.createInsuranceTacticsSection();
    this.sections['claim-timeline'] = this.createClaimTimelineSection();
    this.sections['maximize-claim'] = this.createMaximizeClaimSection();
    this.sections['how-to-use'] = this.createHowToUseSection();
    this.sections['solution-center'] = this.createSolutionCenterSection();
  }

  createDocumentLibrarySection() {
    const section = document.createElement('div');
    section.className = 'section-content document-library-section';
    section.innerHTML = `
      <div class="section-header">
        <h1>Document Library</h1>
        <p>Access templates, samples, and certified policy requests</p>
      </div>
      
      <div class="section-tabs">
        <button class="section-tab active" data-tab="templates">Templates</button>
        <button class="section-tab" data-tab="samples">Samples</button>
        <button class="section-tab" data-tab="policy-requests">Certified Policy Requests</button>
      </div>
      
      <div class="section-tab-content">
        <div id="templates-content" class="tab-content active">
          <div class="documents-grid">
            <div class="document-card">
              <div class="document-icon">📝</div>
              <h3>Proof of Loss</h3>
              <p>Official form for documenting your claim</p>
              <button class="btn-primary">Download Template</button>
            </div>
            <div class="document-card">
              <div class="document-icon">📄</div>
              <h3>Appeal Letter</h3>
              <p>Template for appealing denied claims</p>
              <button class="btn-primary">Download Template</button>
            </div>
            <div class="document-card">
              <div class="document-icon">⚖️</div>
              <h3>Demand Letter</h3>
              <p>Professional demand for payment</p>
              <button class="btn-primary">Download Template</button>
            </div>
          </div>
        </div>
        
        <div id="samples-content" class="tab-content">
          <div class="documents-grid">
            <div class="document-card">
              <div class="document-icon">📋</div>
              <h3>Sample Proof of Loss</h3>
              <p>Example of completed proof of loss form</p>
              <button class="btn-secondary">View Sample</button>
            </div>
            <div class="document-card">
              <div class="document-icon">📄</div>
              <h3>Sample Appeal Letter</h3>
              <p>Example of successful appeal letter</p>
              <button class="btn-secondary">View Sample</button>
            </div>
          </div>
        </div>
        
        <div id="policy-requests-content" class="tab-content">
          <div class="documents-grid">
            <div class="document-card">
              <div class="document-icon">📜</div>
              <h3>Policy Request Form</h3>
              <p>Request certified copies of your policy</p>
              <button class="btn-primary">Request Policy</button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Add tab switching functionality
    section.querySelectorAll('.section-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const tabId = tab.dataset.tab;
        this.switchDocumentLibraryTab(tabId, section);
      });
    });
    
    return section;
  }

  createTemplatesSection() {
    return this.createDocumentLibrarySection();
  }

  createSamplesSection() {
    return this.createDocumentLibrarySection();
  }

  createPolicyRequestsSection() {
    return this.createDocumentLibrarySection();
  }

  createSituationalAdvisorySection() {
    const section = document.createElement('div');
    section.className = 'section-content situational-advisory-section';
    section.innerHTML = `
      <div class="section-header">
        <h1>Situational Advisory</h1>
        <p>Get personalized guidance based on your specific claim situation</p>
      </div>
      
      <div class="advisory-form">
        <div class="form-group">
          <label for="claim-type">Claim Type</label>
          <select id="claim-type" class="form-control">
            <option value="">Select claim type</option>
            <option value="property">Property Damage</option>
            <option value="auto">Auto Accident</option>
            <option value="health">Health Insurance</option>
            <option value="business">Business Interruption</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="claim-stage">Current Stage</label>
          <select id="claim-stage" class="form-control">
            <option value="">Select current stage</option>
            <option value="initial">Initial Filing</option>
            <option value="investigation">Under Investigation</option>
            <option value="denied">Claim Denied</option>
            <option value="underpaid">Underpaid</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="claim-description">Describe Your Situation</label>
          <textarea id="claim-description" class="form-control" rows="4" placeholder="Provide details about your claim situation..."></textarea>
        </div>
        
        <button class="btn-primary" onclick="generateAdvisory()">Get Advisory</button>
      </div>
      
      <div id="advisory-result" class="advisory-result" style="display: none;">
        <h3>Your Personalized Advisory</h3>
        <div class="advisory-content"></div>
      </div>
    `;
    
    return section;
  }

  createInsuranceTacticsSection() {
    const section = document.createElement('div');
    section.className = 'section-content insurance-tactics-section';
    section.innerHTML = `
      <div class="section-header">
        <h1>Insurance Company Tactics</h1>
        <p>Learn common tactics used by insurance companies and how to counter them</p>
      </div>
      
      <div class="tactics-grid">
        <div class="tactic-card">
          <div class="tactic-icon">⏰</div>
          <h3>Delay Tactics</h3>
          <p>Common delay strategies and how to counter them</p>
          <button class="btn-primary">Learn More</button>
        </div>
        
        <div class="tactic-card">
          <div class="tactic-icon">💰</div>
          <h3>Lowball Offers</h3>
          <p>How to recognize and respond to low settlement offers</p>
          <button class="btn-primary">Learn More</button>
        </div>
        
        <div class="tactic-card">
          <div class="tactic-icon">📋</div>
          <h3>Documentation Demands</h3>
          <p>Excessive documentation requests and your rights</p>
          <button class="btn-primary">Learn More</button>
        </div>
        
        <div class="tactic-card">
          <div class="tactic-icon">🔍</div>
          <h3>Surveillance</h3>
          <p>Your rights regarding surveillance and privacy</p>
          <button class="btn-primary">Learn More</button>
        </div>
      </div>
    `;
    
    return section;
  }

  createClaimTimelineSection() {
    const section = document.createElement('div');
    section.className = 'section-content claim-timeline-section';
    section.innerHTML = `
      <div class="section-header">
        <h1>Claim Timeline & Sequence Guide</h1>
        <p>Step-by-step guide through the entire claim process</p>
      </div>
      
      <div class="timeline-container">
        <div class="timeline-phase">
          <div class="phase-header">
            <div class="phase-number">1</div>
            <h3>Initial Filing</h3>
          </div>
          <div class="phase-content">
            <p>File your claim promptly and provide initial documentation</p>
            <ul>
              <li>Contact your insurance company immediately</li>
              <li>Document all damages with photos and videos</li>
              <li>Keep detailed records of all communications</li>
            </ul>
          </div>
        </div>
        
        <div class="timeline-phase">
          <div class="phase-header">
            <div class="phase-number">2</div>
            <h3>Investigation</h3>
          </div>
          <div class="phase-content">
            <p>Insurance company investigates your claim</p>
            <ul>
              <li>Cooperate with adjuster but know your rights</li>
              <li>Don't sign anything without legal review</li>
              <li>Keep copies of all documents</li>
            </ul>
          </div>
        </div>
        
        <div class="timeline-phase">
          <div class="phase-header">
            <div class="phase-number">3</div>
            <h3>Decision</h3>
          </div>
          <div class="phase-content">
            <p>Insurance company makes their decision</p>
            <ul>
              <li>Review the decision carefully</li>
              <li>Understand your appeal rights</li>
              <li>Consider professional help if needed</li>
            </ul>
          </div>
        </div>
      </div>
    `;
    
    return section;
  }

  createMaximizeClaimSection() {
    const section = document.createElement('div');
    section.className = 'section-content maximize-claim-section';
    section.innerHTML = `
      <div class="section-header">
        <h1>How to Maximize Your Claim</h1>
        <p>Strategies and tips to get the maximum settlement for your claim</p>
      </div>
      
      <div class="maximize-strategies">
        <div class="strategy-card">
          <div class="strategy-icon">📸</div>
          <h3>Document Everything</h3>
          <p>Take photos, videos, and detailed notes of all damages and expenses</p>
        </div>
        
        <div class="strategy-card">
          <div class="strategy-icon">📋</div>
          <h3>Keep Detailed Records</h3>
          <p>Maintain organized records of all communications and expenses</p>
        </div>
        
        <div class="strategy-card">
          <div class="strategy-icon">⚖️</div>
          <h3>Know Your Rights</h3>
          <p>Understand your policy coverage and legal rights</p>
        </div>
        
        <div class="strategy-card">
          <div class="strategy-icon">💪</div>
          <h3>Be Persistent</h3>
          <p>Don't accept the first offer - negotiate for fair compensation</p>
        </div>
      </div>
    `;
    
    return section;
  }

  createHowToUseSection() {
    const section = document.createElement('div');
    section.className = 'section-content how-to-use-section';
    section.innerHTML = `
      <div class="section-header">
        <h1>How to Use This Site</h1>
        <p>Complete guide on navigating and using all available tools</p>
      </div>
      
      <div class="usage-guide">
        <div class="guide-step">
          <div class="step-number">1</div>
          <div class="step-content">
            <h3>Explore the Dashboard</h3>
            <p>Start with the dashboard to get an overview of all available tools and resources.</p>
          </div>
        </div>
        
        <div class="guide-step">
          <div class="step-number">2</div>
          <div class="step-content">
            <h3>Access Document Library</h3>
            <p>Browse templates, samples, and policy requests in the Document Library section.</p>
          </div>
        </div>
        
        <div class="guide-step">
          <div class="step-number">3</div>
          <div class="step-content">
            <h3>Get Personalized Guidance</h3>
            <p>Use the Situational Advisory tool to get personalized guidance for your specific situation.</p>
          </div>
        </div>
        
        <div class="guide-step">
          <div class="step-number">4</div>
          <div class="step-content">
            <h3>Learn About Tactics</h3>
            <p>Understand common insurance company tactics and how to counter them.</p>
          </div>
        </div>
      </div>
    `;
    
    return section;
  }

  createSolutionCenterSection() {
    const section = document.createElement('div');
    section.className = 'section-content solution-center-section';
    section.innerHTML = `
      <div class="section-header">
        <h1>Solution Center</h1>
        <p>Get help and support from our team of experts</p>
      </div>
      
      <div class="solution-options">
        <div class="solution-card">
          <div class="solution-icon">💬</div>
          <h3>Live Chat</h3>
          <p>Chat with our support team in real-time</p>
          <button class="btn-primary">Start Chat</button>
        </div>
        
        <div class="solution-card">
          <div class="solution-icon">📧</div>
          <h3>Email Support</h3>
          <p>Send us an email and we'll respond within 24 hours</p>
          <button class="btn-secondary">Send Email</button>
        </div>
        
        <div class="solution-card">
          <div class="solution-icon">📞</div>
          <h3>Phone Support</h3>
          <p>Call us for immediate assistance</p>
          <button class="btn-secondary">Call Now</button>
        </div>
      </div>
    `;
    
    return section;
  }

  switchDocumentLibraryTab(tabId, section) {
    // Update tab buttons
    section.querySelectorAll('.section-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    section.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    
    // Update tab content
    section.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    section.querySelector(`#${tabId}-content`).classList.add('active');
  }

  loadSection(sectionId) {
    // Hide current content
    this.contentWrapper.innerHTML = '';
    
    // Update sidebar active state
    this.sidebarNav.setSection(sectionId);
    
    // Show appropriate content
    if (sectionId === 'dashboard') {
      this.dashboard.show();
      this.contentWrapper.appendChild(this.dashboard.dashboard);
    } else if (this.sections[sectionId]) {
      this.contentWrapper.appendChild(this.sections[sectionId]);
    }
    
    this.currentSection = sectionId;
    
    // Add smooth transition
    this.contentWrapper.style.opacity = '0';
    setTimeout(() => {
      this.contentWrapper.style.opacity = '1';
    }, 50);
  }

  bindEvents() {
    // Handle window resize
    window.addEventListener('resize', () => {
      this.handleResize();
    });
  }

  handleResize() {
    // Update sidebar for mobile/desktop
    if (this.sidebarNav) {
      this.sidebarNav.handleResize();
    }
  }

  // Public methods
  getCurrentSection() {
    return this.currentSection;
  }

  navigateToSection(sectionId) {
    this.loadSection(sectionId);
  }
}

// CSS styles
const styles = `
.response-center {
  display: flex;
  min-height: 100vh;
  background: #f8fafc;
}

.sidebar-container {
  flex-shrink: 0;
}

.main-content-area {
  flex: 1;
  margin-left: 250px;
  transition: margin-left 0.3s ease;
}

.content-wrapper {
  padding: 2rem;
  transition: opacity 0.3s ease;
}

.section-content {
  max-width: 1200px;
  margin: 0 auto;
}

.section-header {
  text-align: center;
  margin-bottom: 3rem;
}

.section-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 1rem 0;
}

.section-header p {
  font-size: 1.25rem;
  color: #64748b;
  margin: 0;
}

.section-tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  justify-content: center;
  flex-wrap: wrap;
}

.section-tab {
  padding: 0.75rem 1.5rem;
  border: 2px solid #e2e8f0;
  background: white;
  color: #64748b;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
}

.section-tab:hover {
  border-color: #3b82f6;
  color: #3b82f6;
}

.section-tab.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

.section-tab-content {
  position: relative;
}

.tab-content {
  display: none;
}

.tab-content.active {
  display: block;
}

.documents-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.document-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  transition: transform 0.2s ease;
}

.document-card:hover {
  transform: translateY(-2px);
}

.document-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.document-card h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
}

.document-card p {
  color: #64748b;
  margin: 0 0 1.5rem 0;
}

.btn-primary, .btn-secondary {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  text-decoration: none;
  display: inline-block;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover {
  background: #4b5563;
}

/* Responsive design */
@media (max-width: 768px) {
  .main-content-area {
    margin-left: 0;
  }
  
  .content-wrapper {
    padding: 1rem;
  }
  
  .section-header h1 {
    font-size: 2rem;
  }
  
  .section-header p {
    font-size: 1rem;
  }
  
  .documents-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .document-card {
    padding: 1.5rem;
  }
}

@media (max-width: 480px) {
  .content-wrapper {
    padding: 0.5rem;
  }
  
  .section-tabs {
    flex-direction: column;
    align-items: center;
  }
  
  .section-tab {
    width: 100%;
    max-width: 300px;
  }
}
`;

// Inject styles
if (!document.querySelector('#response-center-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'response-center-styles';
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ResponseCenter;
}
