/**
 * Response Center Main Component
 * Hybrid navigation system with sidebar and dashboard
 */

class ResponseCenter {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      initialSection: 'dashboard',
      isMobile: window.innerWidth <= 768,
      ...options
    };
    
    this.currentSection = this.options.initialSection;
    this.currentSubsection = null;
    this.sidebar = null;
    this.dashboard = null;
    this.contentArea = null;
    
    this.sections = {
      'dashboard': {
        title: 'Dashboard',
        component: 'DashboardLanding'
      },
      'document-library': {
        title: 'Document Library',
        component: 'DocumentLibrary',
        subsections: {
          'templates': { title: 'Templates', component: 'DocumentTemplates' },
          'samples': { title: 'Samples', component: 'DocumentSamples' },
          'policy-requests': { title: 'Policy Requests', component: 'PolicyRequests' }
        }
      },
      'situational-advisory': {
        title: 'Situational Advisory',
        component: 'SituationalAdvisory'
      },
      'insurance-tactics': {
        title: 'Insurance Company Tactics',
        component: 'InsuranceTactics'
      },
      'claim-timeline': {
        title: 'Claim Timeline & Sequence Guide',
        component: 'ClaimTimeline'
      },
      'maximize-claim': {
        title: 'How to Maximize Your Claim',
        component: 'MaximizeClaim'
      },
      'how-to-use': {
        title: 'How to Use This Site',
        component: 'HowToUse'
      },
      'solution-center': {
        title: 'Solution Center',
        component: 'SolutionCenter'
      }
    };
    
    this.init();
  }

  init() {
    this.createLayout();
    this.initializeComponents();
    this.bindEvents();
    this.loadSection(this.currentSection, this.currentSubsection);
  }

  createLayout() {
    this.container.innerHTML = `
      <div class="response-center ${this.options.isMobile ? 'mobile' : ''}">
        <div class="response-center-sidebar">
          <!-- Sidebar will be rendered here -->
        </div>
        
        <div class="response-center-main">
          <div class="response-center-header">
            <button class="mobile-menu-toggle" aria-label="Toggle sidebar">
              <span class="hamburger"></span>
            </button>
            <div class="header-content">
              <h1 class="page-title">Response Center</h1>
              <div class="header-actions">
                <button class="header-btn" data-action="search">
                  <span class="btn-icon">🔍</span>
                  <span class="btn-text">Search</span>
                </button>
                <button class="header-btn" data-action="settings">
                  <span class="btn-icon">⚙️</span>
                  <span class="btn-text">Settings</span>
                </button>
              </div>
            </div>
          </div>
          
          <div class="response-center-content">
            <!-- Content will be loaded here -->
          </div>
        </div>
      </div>
    `;
    
    this.injectStyles();
  }

  initializeComponents() {
    console.log('🔧 Initializing components');
    
    // Initialize sidebar
    const sidebarContainer = this.container.querySelector('.response-center-sidebar');
    console.log('📱 Sidebar container found:', !!sidebarContainer);
    this.sidebar = new SidebarNav(sidebarContainer, {
      onSectionChange: (section, subsection) => {
        this.loadSection(section, subsection);
      },
      activeSection: this.currentSection
    });

    // Initialize content area
    this.contentArea = this.container.querySelector('.response-center-content');
    console.log('📄 Content area found:', !!this.contentArea);
    console.log('✅ Components initialized');
  }

  bindEvents() {
    // Mobile menu toggle
    const mobileToggle = this.container.querySelector('.mobile-menu-toggle');
    if (mobileToggle) {
      mobileToggle.addEventListener('click', () => {
        this.toggleMobileSidebar();
      });
    }

    // Header actions
    this.container.addEventListener('click', (e) => {
      if (e.target.closest('.header-btn')) {
        const button = e.target.closest('.header-btn');
        const action = button.dataset.action;
        this.handleHeaderAction(action);
      }
    });

    // Window resize
    window.addEventListener('resize', () => {
      this.handleResize();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      this.handleKeyboardShortcuts(e);
    });
  }

  loadSection(sectionId, subsectionId = null) {
    this.currentSection = sectionId;
    this.currentSubsection = subsectionId;
    
    // Update page title
    const pageTitle = this.container.querySelector('.page-title');
    if (pageTitle) {
      const section = this.sections[sectionId];
      if (section) {
        pageTitle.textContent = section.title;
      }
    }

    // Load section content
    this.renderSectionContent(sectionId, subsectionId);
    
    // Update sidebar active state
    if (this.sidebar) {
      this.sidebar.setActiveSection(sectionId, subsectionId);
    }

    // Close mobile sidebar if open
    if (this.options.isMobile) {
      this.hideMobileSidebar();
    }
  }

  renderSectionContent(sectionId, subsectionId = null) {
    const section = this.sections[sectionId];
    if (!section) {
      this.renderError('Section not found');
      return;
    }

    // Handle dashboard specially
    if (sectionId === 'dashboard') {
      this.renderDashboard();
      return;
    }

    // Handle subsections
    if (subsectionId && section.subsections) {
      const subsection = section.subsections[subsectionId];
      if (subsection) {
        this.renderSubsectionContent(section, subsection);
        return;
      }
    }

    // Render main section content
    this.renderMainSectionContent(section);
  }

  renderDashboard() {
    console.log('🎯 Rendering Dashboard');
    if (!this.dashboard) {
      console.log('📊 Creating new DashboardLanding component');
      this.dashboard = new DashboardLanding(this.contentArea, {
        onCardClick: (cardId) => {
          this.loadSection(cardId);
        }
      });
    } else {
      console.log('🔄 Re-rendering existing dashboard');
      // Re-render the dashboard
      this.dashboard.container = this.contentArea;
      this.dashboard.createDashboard();
    }
    console.log('✅ Dashboard rendered');
  }

  renderMainSectionContent(section) {
    // This would integrate with existing section components
    // For now, we'll create a placeholder that can be replaced
    this.contentArea.innerHTML = `
      <div class="section-content">
        <div class="section-header">
          <h2 class="section-title">${section.title}</h2>
          <p class="section-description">Loading ${section.title.toLowerCase()} content...</p>
        </div>
        <div class="section-body">
          <div class="loading-placeholder">
            <div class="loading-spinner"></div>
            <p>Content will be loaded here</p>
          </div>
        </div>
      </div>
    `;
    
    // In a real implementation, this would load the actual section component
    this.loadSectionComponent(section.component);
  }

  renderSubsectionContent(section, subsection) {
    this.contentArea.innerHTML = `
      <div class="section-content">
        <div class="section-header">
          <nav class="breadcrumb">
            <a href="#" data-section="${section.id}">${section.title}</a>
            <span class="breadcrumb-separator">›</span>
            <span class="breadcrumb-current">${subsection.title}</span>
          </nav>
          <h2 class="section-title">${subsection.title}</h2>
        </div>
        <div class="section-body">
          <div class="loading-placeholder">
            <div class="loading-spinner"></div>
            <p>Loading ${subsection.title.toLowerCase()} content...</p>
          </div>
        </div>
      </div>
    `;
    
    // In a real implementation, this would load the actual subsection component
    this.loadSectionComponent(subsection.component);
  }

  loadSectionComponent(componentName) {
    // This is where you would integrate with existing components
    // For now, we'll simulate loading
    setTimeout(() => {
      this.contentArea.querySelector('.loading-placeholder').innerHTML = `
        <div class="component-loaded">
          <h3>${componentName} Component</h3>
          <p>This is where the ${componentName} component would be rendered.</p>
          <p>In the actual implementation, this would integrate with your existing section components.</p>
        </div>
      `;
    }, 1000);
  }

  renderError(message) {
    this.contentArea.innerHTML = `
      <div class="error-content">
        <div class="error-icon">⚠️</div>
        <h3>Error</h3>
        <p>${message}</p>
        <button class="btn-primary" onclick="location.reload()">Reload Page</button>
      </div>
    `;
  }

  toggleMobileSidebar() {
    const sidebar = this.container.querySelector('.response-center-sidebar');
    if (sidebar) {
      sidebar.classList.toggle('mobile-open');
    }
  }

  hideMobileSidebar() {
    const sidebar = this.container.querySelector('.response-center-sidebar');
    if (sidebar) {
      sidebar.classList.remove('mobile-open');
    }
  }

  handleHeaderAction(action) {
    switch (action) {
      case 'search':
        this.openSearch();
        break;
      case 'settings':
        this.openSettings();
        break;
    }
  }

  openSearch() {
    // Implement search functionality
    console.log('Opening search...');
  }

  openSettings() {
    // Implement settings functionality
    console.log('Opening settings...');
  }

  handleResize() {
    const isMobile = window.innerWidth <= 768;
    if (isMobile !== this.options.isMobile) {
      this.options.isMobile = isMobile;
      this.container.classList.toggle('mobile', isMobile);
      
      if (!isMobile) {
        this.hideMobileSidebar();
      }
    }
  }

  handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + K for search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      this.openSearch();
    }
    
    // Escape to close mobile sidebar
    if (e.key === 'Escape' && this.options.isMobile) {
      this.hideMobileSidebar();
    }
  }

  getCurrentSection() {
    return {
      section: this.currentSection,
      subsection: this.currentSubsection
    };
  }

  navigateToSection(sectionId, subsectionId = null) {
    this.loadSection(sectionId, subsectionId);
  }

  injectStyles() {
    if (document.querySelector('#response-center-styles')) return;
    
    const styles = `
      <style id="response-center-styles">
        .response-center {
          display: flex;
          height: 100vh;
          background: #f8fafc;
        }

        .response-center.mobile {
          flex-direction: column;
        }

        .response-center-sidebar {
          width: 250px;
          background: white;
          border-right: 1px solid var(--border);
          overflow-y: auto;
          transition: transform 0.3s ease;
        }

        .response-center-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .response-center-header {
          background: white;
          border-bottom: 1px solid var(--border);
          padding: 1rem 2rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .mobile-menu-toggle {
          display: none;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 0.375rem;
        }

        .mobile-menu-toggle:hover {
          background: var(--bg-light);
        }

        .hamburger {
          display: block;
          width: 20px;
          height: 2px;
          background: var(--primary);
          position: relative;
        }

        .hamburger::before,
        .hamburger::after {
          content: '';
          position: absolute;
          width: 20px;
          height: 2px;
          background: var(--primary);
        }

        .hamburger::before {
          top: -6px;
        }

        .hamburger::after {
          top: 6px;
        }

        .header-content {
          flex: 1;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .page-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--primary);
          margin: 0;
        }

        .header-actions {
          display: flex;
          gap: 0.5rem;
        }

        .header-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: var(--bg-light);
          border: 1px solid var(--border);
          border-radius: 0.375rem;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.875rem;
        }

        .header-btn:hover {
          background: var(--primary);
          color: white;
        }

        .response-center-content {
          flex: 1;
          overflow-y: auto;
          padding: 2rem;
        }

        .section-content {
          max-width: 1200px;
          margin: 0 auto;
        }

        .section-header {
          margin-bottom: 2rem;
        }

        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .breadcrumb a {
          color: var(--primary);
          text-decoration: none;
          cursor: pointer;
        }

        .breadcrumb a:hover {
          text-decoration: underline;
        }

        .breadcrumb-separator {
          color: var(--text-secondary);
        }

        .breadcrumb-current {
          color: var(--primary);
          font-weight: 500;
        }

        .section-title {
          font-size: 2rem;
          font-weight: 700;
          color: var(--primary);
          margin: 0 0 0.5rem 0;
        }

        .section-description {
          color: var(--text-secondary);
          margin: 0;
        }

        .section-body {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          border: 1px solid var(--border);
          min-height: 400px;
        }

        .loading-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          text-align: center;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid var(--border);
          border-top: 3px solid var(--primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .component-loaded {
          text-align: center;
          padding: 2rem;
        }

        .component-loaded h3 {
          color: var(--primary);
          margin-bottom: 1rem;
        }

        .error-content {
          text-align: center;
          padding: 3rem;
        }

        .error-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .error-content h3 {
          color: #dc2626;
          margin-bottom: 1rem;
        }

        /* Mobile responsive */
        @media (max-width: 768px) {
          .response-center {
            flex-direction: column;
          }

          .response-center-sidebar {
            position: fixed;
            top: 0;
            left: 0;
            height: 100vh;
            width: 280px;
            transform: translateX(-100%);
            z-index: 1000;
            box-shadow: 2px 0 8px rgba(0,0,0,0.1);
          }

          .response-center-sidebar.mobile-open {
            transform: translateX(0);
          }

          .mobile-menu-toggle {
            display: block;
          }

          .response-center-header {
            padding: 1rem;
          }

          .response-center-content {
            padding: 1rem;
          }

          .section-body {
            padding: 1.5rem;
          }
        }

        /* Focus styles */
        .mobile-menu-toggle:focus,
        .header-btn:focus {
          outline: 2px solid var(--primary);
          outline-offset: 2px;
        }

        /* High contrast mode */
        @media (prefers-contrast: high) {
          .response-center-sidebar,
          .response-center-header,
          .section-body {
            border-width: 2px;
          }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .response-center-sidebar,
          .loading-spinner {
            transition: none;
            animation: none;
          }
        }
      </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', styles);
  }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ResponseCenter;
}

// Global registration
if (typeof window !== 'undefined') {
  window.ResponseCenter = ResponseCenter;
}
