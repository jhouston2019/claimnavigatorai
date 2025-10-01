/**
 * Response Center Sidebar Navigation Component
 * Hybrid navigation system with collapsible sidebar and table of contents
 */

class SidebarNav {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      onSectionChange: null,
      activeSection: 'dashboard',
      isCollapsed: false,
      ...options
    };
    
    this.categories = [
      {
        id: 'dashboard',
        title: 'Dashboard',
        icon: '🏠',
        description: 'Overview and quick access to all tools'
      },
      {
        id: 'core-tools',
        title: 'Core Claim Tools',
        icon: '🟢',
        description: 'Essential tools for claim management',
        color: '#10b981',
        tools: [
          { id: 'advanced-tools', title: 'Advanced Tools', icon: '⚡' },
          { id: 'ai-agent', title: 'AI Response & Analysis Agent', icon: '🤖' },
          { id: 'claim-analysis', title: 'Claim Analysis Tools', icon: '🔍' },
          { id: 'document-generator', title: 'Document Generator', icon: '📄' },
          { id: 'evidence-organizer', title: 'Evidence Organizer', icon: '📸' },
          { id: 'claim-document-library', title: 'Claim Document Library', icon: '📁' },
          { id: 'claim-documentation-guides', title: 'Claim Documentation Guides', icon: '📝' }
        ]
      },
      {
        id: 'strategy-guidance',
        title: 'Strategy & Guidance',
        icon: '🟠',
        description: 'Strategic guidance and tactics',
        color: '#f59e0b',
        tools: [
          { id: 'claim-playbook', title: 'Claim Playbook', icon: '📖' },
          { id: 'claim-timeline', title: 'Claim Timeline & Sequence Guide', icon: '⏰' },
          { id: 'situational-advisory', title: 'Situational Advisory', icon: '💡' },
          { id: 'insurance-tactics', title: 'Insurance Company Tactics', icon: '🎯' },
          { id: 'maximize-claim', title: 'Maximize Your Claim', icon: '📈' },
          { id: 'negotiation-scripts', title: 'Negotiation Scripts & Escalation', icon: '💬' }
        ]
      },
      {
        id: 'appeals-legal',
        title: 'Appeals & Legal Rights',
        icon: '🔵',
        description: 'Legal appeals and rights information',
        color: '#3b82f6',
        tools: [
          { id: 'appeal-builder', title: 'Appeal Builder', icon: '⚖️' },
          { id: 'state-rights', title: 'State-Specific Rights & Deadlines', icon: '🏛️' }
        ]
      },
      {
        id: 'resources-support',
        title: 'Resources & Support',
        icon: '🟣',
        description: 'Help, resources, and settings',
        color: '#8b5cf6',
        tools: [
          { id: 'how-to-use', title: 'How to Use This Site', icon: '📚' },
          { id: 'recommended-resources', title: 'Recommended Resources', icon: '🔗' },
          { id: 'my-claims', title: 'My Claims', icon: '📋' },
          { id: 'settings', title: 'Settings', icon: '⚙️' }
        ]
      }
    ];
    
    this.activeSection = this.options.activeSection;
    this.isCollapsed = this.options.isCollapsed;
    
    this.init();
  }

  init() {
    this.createSidebar();
    this.bindEvents();
    this.setActiveSection(this.activeSection);
  }

  createSidebar() {
    this.container.innerHTML = `
      <div class="sidebar-nav ${this.isCollapsed ? 'collapsed' : ''}">
        <div class="sidebar-header">
          <button class="sidebar-toggle" aria-label="Toggle sidebar">
            <span class="hamburger"></span>
          </button>
          <h3 class="sidebar-title">Response Center</h3>
        </div>
        
        <nav class="sidebar-menu" role="navigation" aria-label="Main navigation">
          ${this.categories.map(category => this.createCategoryHTML(category)).join('')}
        </nav>
        
        <div class="sidebar-footer">
          <div class="user-info">
            <div class="user-avatar">👤</div>
            <div class="user-details">
              <div class="user-name">Claim Navigator</div>
              <div class="user-status">Premium Access</div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    this.injectStyles();
  }

  createCategoryHTML(category) {
    const hasTools = category.tools && category.tools.length > 0;
    const isActive = this.activeSection === category.id;
    const isExpanded = isActive && hasTools;
    
    return `
      <div class="sidebar-section ${isActive ? 'active' : ''}">
        <button 
          class="section-button ${hasTools ? 'has-subsections' : ''}" 
          data-section="${category.id}"
          aria-expanded="${isExpanded}"
          aria-controls="subsection-${category.id}"
        >
          <span class="section-icon" style="color: ${category.color || 'var(--primary)'}">${category.icon}</span>
          <span class="section-title">${category.title}</span>
          ${hasTools ? '<span class="section-arrow">▶</span>' : ''}
        </button>
        
        ${hasTools ? `
          <div class="subsection-list ${isExpanded ? 'expanded' : ''}" id="subsection-${category.id}">
            ${category.tools.map(tool => `
              <button 
                class="subsection-button" 
                data-section="${category.id}"
                data-subsection="${tool.id}"
              >
                <span class="subsection-icon">${tool.icon}</span>
                <span class="subsection-title">${tool.title}</span>
              </button>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }

  bindEvents() {
    // Section buttons
    this.container.addEventListener('click', (e) => {
      if (e.target.closest('.section-button')) {
        const button = e.target.closest('.section-button');
        const sectionId = button.dataset.section;
        this.handleSectionClick(sectionId, button);
      }
      
      if (e.target.closest('.subsection-button')) {
        const button = e.target.closest('.subsection-button');
        const sectionId = button.dataset.section;
        const subsectionId = button.dataset.subsection;
        this.handleSubsectionClick(sectionId, subsectionId, button);
      }
    });

    // Toggle button
    const toggleBtn = this.container.querySelector('.sidebar-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.toggleSidebar());
    }

    // Keyboard navigation
    this.container.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const button = e.target.closest('button');
        if (button) button.click();
      }
    });
  }

  handleSectionClick(sectionId, button) {
    const section = this.sections.find(s => s.id === sectionId);
    if (!section) return;

    // Update active state
    this.setActiveSection(sectionId);
    
    // Toggle subsections if they exist
    if (section.subsections && section.subsections.length > 0) {
      const subsectionList = button.parentElement.querySelector('.subsection-list');
      const isExpanded = subsectionList.classList.contains('expanded');
      
      // Close all other subsection lists
      this.container.querySelectorAll('.subsection-list').forEach(list => {
        list.classList.remove('expanded');
      });
      
      // Toggle current subsection list
      if (!isExpanded) {
        subsectionList.classList.add('expanded');
        button.setAttribute('aria-expanded', 'true');
      } else {
        button.setAttribute('aria-expanded', 'false');
      }
    }

    // Trigger callback
    if (this.options.onSectionChange) {
      this.options.onSectionChange(sectionId, null);
    }
  }

  handleSubsectionClick(sectionId, subsectionId, button) {
    // Update active state
    this.setActiveSection(sectionId, subsectionId);
    
    // Trigger callback
    if (this.options.onSectionChange) {
      this.options.onSectionChange(sectionId, subsectionId);
    }
  }

  setActiveSection(sectionId, subsectionId = null) {
    this.activeSection = sectionId;
    
    // Update visual states
    this.container.querySelectorAll('.sidebar-section').forEach(section => {
      section.classList.remove('active');
    });
    
    this.container.querySelectorAll('.section-button, .subsection-button').forEach(button => {
      button.classList.remove('active');
    });
    
    // Activate current section
    const activeSection = this.container.querySelector(`[data-section="${sectionId}"]`);
    if (activeSection) {
      activeSection.closest('.sidebar-section').classList.add('active');
      activeSection.classList.add('active');
    }
    
    // Activate subsection if specified
    if (subsectionId) {
      const activeSubsection = this.container.querySelector(`[data-subsection="${subsectionId}"]`);
      if (activeSubsection) {
        activeSubsection.classList.add('active');
      }
    }
  }

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
    const sidebar = this.container.querySelector('.sidebar-nav');
    sidebar.classList.toggle('collapsed', this.isCollapsed);
    
    // Update toggle button
    const toggleBtn = this.container.querySelector('.sidebar-toggle');
    if (toggleBtn) {
      toggleBtn.setAttribute('aria-expanded', !this.isCollapsed);
    }
  }

  showSidebar() {
    this.isCollapsed = false;
    const sidebar = this.container.querySelector('.sidebar-nav');
    sidebar.classList.remove('collapsed');
  }

  hideSidebar() {
    this.isCollapsed = true;
    const sidebar = this.container.querySelector('.sidebar-nav');
    sidebar.classList.add('collapsed');
  }

  getActiveSection() {
    return {
      section: this.activeSection,
      subsection: this.container.querySelector('.subsection-button.active')?.dataset.subsection || null
    };
  }

  injectStyles() {
    if (document.querySelector('#sidebar-nav-styles')) return;
    
    const styles = `
      <style id="sidebar-nav-styles">
        .sidebar-nav {
          width: 250px;
          height: 100vh;
          background: #ffffff;
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          transition: all 0.3s ease;
          position: fixed;
          left: 0;
          top: 0;
          z-index: 1000;
          box-shadow: 2px 0 8px rgba(0,0,0,0.1);
        }

        .sidebar-nav.collapsed {
          width: 60px;
        }

        .sidebar-header {
          padding: 1rem;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: var(--bg-light);
        }

        .sidebar-toggle {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 0.375rem;
          transition: background-color 0.2s;
        }

        .sidebar-toggle:hover {
          background: rgba(0,0,0,0.05);
        }

        .hamburger {
          display: block;
          width: 20px;
          height: 2px;
          background: var(--primary);
          position: relative;
          transition: all 0.3s;
        }

        .hamburger::before,
        .hamburger::after {
          content: '';
          position: absolute;
          width: 20px;
          height: 2px;
          background: var(--primary);
          transition: all 0.3s;
        }

        .hamburger::before {
          top: -6px;
        }

        .hamburger::after {
          top: 6px;
        }

        .sidebar-nav.collapsed .hamburger::before {
          transform: rotate(45deg);
          top: 0;
        }

        .sidebar-nav.collapsed .hamburger::after {
          transform: rotate(-45deg);
          top: 0;
        }

        .sidebar-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--primary);
          margin: 0;
          transition: opacity 0.3s;
        }

        .sidebar-nav.collapsed .sidebar-title {
          opacity: 0;
          width: 0;
          overflow: hidden;
        }

        .sidebar-menu {
          flex: 1;
          padding: 1rem 0;
          overflow-y: auto;
        }

        .sidebar-section {
          margin-bottom: 0.25rem;
        }

        .section-button,
        .subsection-button {
          width: 100%;
          background: none;
          border: none;
          padding: 0.75rem 1rem;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .section-button:hover,
        .subsection-button:hover {
          background: var(--bg-light);
          color: var(--primary);
        }

        .section-button.active,
        .subsection-button.active {
          background: var(--primary);
          color: white;
        }

        .section-icon,
        .subsection-icon {
          font-size: 1.125rem;
          flex-shrink: 0;
        }

        .section-title,
        .subsection-title {
          flex: 1;
          transition: opacity 0.3s;
        }

        .sidebar-nav.collapsed .section-title,
        .sidebar-nav.collapsed .subsection-title {
          opacity: 0;
          width: 0;
          overflow: hidden;
        }

        .section-arrow {
          font-size: 0.75rem;
          transition: transform 0.3s, opacity 0.3s;
        }

        .section-button[aria-expanded="true"] .section-arrow {
          transform: rotate(90deg);
        }

        .sidebar-nav.collapsed .section-arrow {
          opacity: 0;
        }

        .subsection-list {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease;
        }

        .subsection-list.expanded {
          max-height: 200px;
        }

        .subsection-button {
          padding-left: 2.5rem;
          font-size: 0.8rem;
        }

        .sidebar-footer {
          padding: 1rem;
          border-top: 1px solid var(--border);
          background: var(--bg-light);
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .user-avatar {
          width: 32px;
          height: 32px;
          background: var(--primary);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.875rem;
          color: white;
        }

        .user-details {
          transition: opacity 0.3s;
        }

        .sidebar-nav.collapsed .user-details {
          opacity: 0;
          width: 0;
          overflow: hidden;
        }

        .user-name {
          font-weight: 600;
          font-size: 0.875rem;
          color: var(--primary);
        }

        .user-status {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        /* Mobile responsive */
        @media (max-width: 768px) {
          .sidebar-nav {
            transform: translateX(-100%);
            width: 280px;
          }

          .sidebar-nav.mobile-open {
            transform: translateX(0);
          }

          .sidebar-nav.collapsed {
            transform: translateX(-100%);
            width: 280px;
          }
        }

        /* Focus styles */
        .section-button:focus,
        .subsection-button:focus {
          outline: 2px solid var(--primary);
          outline-offset: -2px;
        }

        /* High contrast mode */
        @media (prefers-contrast: high) {
          .sidebar-nav {
            border-right-width: 2px;
          }

          .section-button.active,
          .subsection-button.active {
            background: #000000;
            color: #ffffff;
          }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .sidebar-nav,
          .section-button,
          .subsection-button,
          .section-arrow,
          .subsection-list {
            transition: none;
          }
        }
      </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', styles);
  }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SidebarNav;
}

// Global registration
if (typeof window !== 'undefined') {
  window.SidebarNav = SidebarNav;
}
