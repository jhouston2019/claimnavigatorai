/**
 * Sidebar Navigation Component
 * Collapsible sidebar with table of contents style navigation
 */

class SidebarNav {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      onSectionChange: null,
      activeSection: 'dashboard',
      ...options
    };
    
    this.isCollapsed = false;
    this.isMobile = window.innerWidth < 768;
    this.activeSection = this.options.activeSection;
    
    this.init();
  }

  init() {
    this.createSidebar();
    this.bindEvents();
    this.handleResize();
  }

  createSidebar() {
    this.sidebar = document.createElement('div');
    this.sidebar.className = 'sidebar-nav';
    
    // Mobile header with hamburger menu
    const mobileHeader = document.createElement('div');
    mobileHeader.className = 'sidebar-mobile-header';
    mobileHeader.innerHTML = `
      <button class="sidebar-toggle" aria-label="Toggle navigation">
        <span class="hamburger"></span>
        <span class="hamburger"></span>
        <span class="hamburger"></span>
      </button>
      <span class="sidebar-title">Claim Resource & AI Response Center</span>
    `;
    
    // Navigation content
    const navContent = document.createElement('div');
    navContent.className = 'sidebar-content';
    
    // Dashboard section
    const dashboardSection = this.createNavSection('dashboard', 'Dashboard', '🏠', [
      { id: 'dashboard', label: 'Overview', icon: '📊' }
    ]);
    
    // Document Library section
    const docLibrarySection = this.createNavSection('document-library', 'Document Library', '📄', [
      { id: 'templates', label: 'Templates', icon: '📝' },
      { id: 'samples', label: 'Samples', icon: '📋' },
      { id: 'policy-requests', label: 'Certified Policy Requests', icon: '📜' }
    ]);
    
    // Other sections
    const otherSections = [
      { id: 'situational-advisory', label: 'Situational Advisory', icon: '🎯' },
      { id: 'insurance-tactics', label: 'Insurance Company Tactics', icon: '⚔️' },
      { id: 'claim-timeline', label: 'Claim Timeline & Sequence Guide', icon: '⏰' },
      { id: 'maximize-claim', label: 'How to Maximize Your Claim', icon: '💰' },
      { id: 'how-to-use', label: 'How to Use This Site', icon: '❓' },
      { id: 'solution-center', label: 'Solution Center', icon: '💬' }
    ];
    
    navContent.appendChild(dashboardSection);
    navContent.appendChild(docLibrarySection);
    
    // Add other sections
    otherSections.forEach(section => {
      const sectionElement = this.createNavItem(section.id, section.label, section.icon);
      navContent.appendChild(sectionElement);
    });
    
    this.sidebar.appendChild(mobileHeader);
    this.sidebar.appendChild(navContent);
    this.container.appendChild(this.sidebar);
    
    // Store references
    this.toggleButton = this.sidebar.querySelector('.sidebar-toggle');
    this.navContent = navContent;
  }

  createNavSection(sectionId, title, icon, items) {
    const section = document.createElement('div');
    section.className = 'nav-section';
    section.dataset.section = sectionId;
    
    const header = document.createElement('div');
    header.className = 'nav-section-header';
    header.innerHTML = `
      <span class="nav-section-icon">${icon}</span>
      <span class="nav-section-title">${title}</span>
      <span class="nav-section-toggle">▼</span>
    `;
    
    const content = document.createElement('div');
    content.className = 'nav-section-content';
    
    items.forEach(item => {
      const itemElement = this.createNavItem(item.id, item.label, item.icon, true);
      content.appendChild(itemElement);
    });
    
    section.appendChild(header);
    section.appendChild(content);
    
    // Toggle section
    header.addEventListener('click', () => {
      this.toggleSection(section);
    });
    
    return section;
  }

  createNavItem(itemId, label, icon, isSubItem = false) {
    const item = document.createElement('div');
    item.className = `nav-item ${isSubItem ? 'nav-sub-item' : ''}`;
    item.dataset.section = itemId;
    item.innerHTML = `
      <span class="nav-item-icon">${icon}</span>
      <span class="nav-item-label">${label}</span>
    `;
    
    item.addEventListener('click', () => {
      this.setActiveSection(itemId);
      if (this.options.onSectionChange) {
        this.options.onSectionChange(itemId);
      }
    });
    
    return item;
  }

  toggleSection(section) {
    const isExpanded = section.classList.contains('expanded');
    const toggle = section.querySelector('.nav-section-toggle');
    
    if (isExpanded) {
      section.classList.remove('expanded');
      toggle.textContent = '▼';
    } else {
      section.classList.add('expanded');
      toggle.textContent = '▲';
    }
  }

  setActiveSection(sectionId) {
    // Remove active class from all items
    this.sidebar.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
    });
    
    // Add active class to selected item
    const activeItem = this.sidebar.querySelector(`[data-section="${sectionId}"]`);
    if (activeItem) {
      activeItem.classList.add('active');
    }
    
    this.activeSection = sectionId;
    
    // Close mobile sidebar after selection
    if (this.isMobile) {
      this.collapseSidebar();
    }
  }

  toggleSidebar() {
    if (this.isCollapsed) {
      this.expandSidebar();
    } else {
      this.collapseSidebar();
    }
  }

  expandSidebar() {
    this.sidebar.classList.remove('collapsed');
    this.isCollapsed = false;
  }

  collapseSidebar() {
    this.sidebar.classList.add('collapsed');
    this.isCollapsed = true;
  }

  bindEvents() {
    // Toggle button
    this.toggleButton.addEventListener('click', () => {
      this.toggleSidebar();
    });
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
      if (this.isMobile && !this.sidebar.contains(e.target) && !this.isCollapsed) {
        this.collapseSidebar();
      }
    });
    
    // Handle window resize
    window.addEventListener('resize', () => {
      this.handleResize();
    });
  }

  handleResize() {
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth < 768;
    
    if (wasMobile !== this.isMobile) {
      if (this.isMobile) {
        this.sidebar.classList.add('mobile');
        this.collapseSidebar();
      } else {
        this.sidebar.classList.remove('mobile');
        this.expandSidebar();
      }
    }
  }

  // Public methods
  getActiveSection() {
    return this.activeSection;
  }

  setSection(sectionId) {
    this.setActiveSection(sectionId);
  }
}

// CSS styles
const styles = `
.sidebar-nav {
  position: fixed;
  top: 0;
  left: 0;
  width: 250px;
  height: 100vh;
  background: #ffffff;
  border-right: 1px solid #e5e7eb;
  z-index: 1000;
  transition: transform 0.3s ease;
  overflow-y: auto;
}

.sidebar-nav.collapsed {
  transform: translateX(-100%);
}

.sidebar-nav.mobile {
  transform: translateX(-100%);
}

.sidebar-nav.mobile:not(.collapsed) {
  transform: translateX(0);
}

.sidebar-mobile-header {
  display: flex;
  align-items: center;
  padding: 1rem;
  background: #1e40af;
  color: white;
  border-bottom: 1px solid #e5e7eb;
}

.sidebar-toggle {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0.5rem;
  margin-right: 1rem;
}

.hamburger {
  display: block;
  width: 20px;
  height: 2px;
  background: white;
  margin: 3px 0;
  transition: 0.3s;
}

.sidebar-title {
  font-weight: 600;
  font-size: 1.1rem;
}

.sidebar-content {
  padding: 1rem 0;
}

.nav-section {
  margin-bottom: 0.5rem;
}

.nav-section-header {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid #f3f4f6;
}

.nav-section-header:hover {
  background: #f9fafb;
}

.nav-section-icon {
  font-size: 1.2rem;
  margin-right: 0.75rem;
}

.nav-section-title {
  flex: 1;
  font-weight: 600;
  color: #374151;
}

.nav-section-toggle {
  font-size: 0.8rem;
  color: #6b7280;
  transition: transform 0.2s;
}

.nav-section.expanded .nav-section-toggle {
  transform: rotate(180deg);
}

.nav-section-content {
  display: none;
  background: #f9fafb;
}

.nav-section.expanded .nav-section-content {
  display: block;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem 0.5rem 2.5rem;
  cursor: pointer;
  transition: all 0.2s;
  color: #6b7280;
}

.nav-item:hover {
  background: #f3f4f6;
  color: #374151;
}

.nav-item.active {
  background: #dbeafe;
  color: #1e40af;
  font-weight: 600;
  border-right: 3px solid #1e40af;
}

.nav-sub-item {
  padding-left: 3rem;
  font-size: 0.9rem;
}

.nav-item-icon {
  font-size: 1rem;
  margin-right: 0.75rem;
  width: 20px;
  text-align: center;
}

.nav-item-label {
  flex: 1;
}

/* Desktop styles */
@media (min-width: 768px) {
  .sidebar-nav {
    position: relative;
    transform: none;
    height: 100vh;
  }
  
  .sidebar-nav.collapsed {
    width: 60px;
  }
  
  .sidebar-nav.collapsed .sidebar-mobile-header {
    display: none;
  }
  
  .sidebar-nav.collapsed .nav-section-title,
  .sidebar-nav.collapsed .nav-item-label {
    display: none;
  }
  
  .sidebar-nav.collapsed .nav-section-icon,
  .sidebar-nav.collapsed .nav-item-icon {
    margin-right: 0;
    text-align: center;
  }
  
  .sidebar-nav.collapsed .nav-item {
    padding: 0.75rem;
    justify-content: center;
  }
  
  .sidebar-nav.collapsed .nav-section-header {
    padding: 0.75rem;
    justify-content: center;
  }
}

/* Mobile overlay */
@media (max-width: 767px) {
  .sidebar-nav:not(.collapsed)::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: -1;
  }
}

/* Scrollbar styling */
.sidebar-nav::-webkit-scrollbar {
  width: 6px;
}

.sidebar-nav::-webkit-scrollbar-track {
  background: #f1f5f9;
}

.sidebar-nav::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.sidebar-nav::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
`;

// Inject styles
if (!document.querySelector('#sidebar-nav-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'sidebar-nav-styles';
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SidebarNav;
}
