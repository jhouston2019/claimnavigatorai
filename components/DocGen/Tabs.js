/**
 * Document Generator Tabs Component
 * Lightweight tab switcher with keyboard accessibility
 */

class DocumentGeneratorTabs {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      activeTab: 0,
      onTabChange: null,
      ...options
    };
    
    this.tabs = [];
    this.activeIndex = this.options.activeTab;
    
    this.init();
  }

  init() {
    this.createTabs();
    this.bindEvents();
    this.setActiveTab(this.activeIndex);
  }

  createTabs() {
    const documentTypes = [
      { id: 'proof-of-loss', name: 'Proof of Loss', icon: '📄' },
      { id: 'appeal-letter', name: 'Appeal Letter', icon: '📝' },
      { id: 'demand-letter', name: 'Demand Letter', icon: '⚖️' },
      { id: 'damage-inventory', name: 'Damage Inventory', icon: '📋' },
      { id: 'claim-timeline', name: 'Claim Timeline', icon: '⏰' },
      { id: 'repair-cost-worksheet', name: 'Repair Cost Worksheet', icon: '🔧' },
      { id: 'out-of-pocket-expenses', name: 'Out-of-Pocket Expenses', icon: '💰' },
      { id: 'appraisal-demand', name: 'Appraisal Demand', icon: '📊' },
      { id: 'delay-complaint', name: 'Delay Complaint', icon: '⏳' },
      { id: 'coverage-clarification', name: 'Coverage Clarification', icon: '❓' }
    ];

    // Create tab navigation
    const tabNav = document.createElement('div');
    tabNav.className = 'doc-gen-tabs-nav';
    tabNav.setAttribute('role', 'tablist');
    tabNav.setAttribute('aria-label', 'Document types');

    documentTypes.forEach((docType, index) => {
      const tab = document.createElement('button');
      tab.className = 'doc-gen-tab';
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-selected', 'false');
      tab.setAttribute('aria-controls', `panel-${docType.id}`);
      tab.setAttribute('id', `tab-${docType.id}`);
      tab.setAttribute('tabindex', '-1');
      
      tab.innerHTML = `
        <span class="tab-icon">${docType.icon}</span>
        <span class="tab-label">${docType.name}</span>
      `;
      
      tab.addEventListener('click', () => this.setActiveTab(index));
      tab.addEventListener('keydown', (e) => this.handleKeydown(e, index));
      
      tabNav.appendChild(tab);
      this.tabs.push({ element: tab, docType });
    });

    // Create tab panels container
    const tabPanels = document.createElement('div');
    tabPanels.className = 'doc-gen-tab-panels';
    
    documentTypes.forEach((docType, index) => {
      const panel = document.createElement('div');
      panel.className = 'doc-gen-tab-panel';
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', `tab-${docType.id}`);
      panel.setAttribute('id', `panel-${docType.id}`);
      panel.setAttribute('hidden', 'true');
      
      tabPanels.appendChild(panel);
    });

    this.container.innerHTML = '';
    this.container.appendChild(tabNav);
    this.container.appendChild(tabPanels);
    
    this.tabPanels = tabPanels;
  }

  bindEvents() {
    // Handle window resize for responsive behavior
    window.addEventListener('resize', () => this.handleResize());
  }

  setActiveTab(index) {
    if (index < 0 || index >= this.tabs.length) return;

    // Update tab states
    this.tabs.forEach((tab, i) => {
      const isActive = i === index;
      tab.element.setAttribute('aria-selected', isActive);
      tab.element.setAttribute('tabindex', isActive ? '0' : '-1');
      tab.element.classList.toggle('active', isActive);
    });

    // Update panel visibility
    const panels = this.tabPanels.querySelectorAll('.doc-gen-tab-panel');
    panels.forEach((panel, i) => {
      const isActive = i === index;
      panel.toggleAttribute('hidden', !isActive);
    });

    this.activeIndex = index;
    
    // Trigger callback
    if (this.options.onTabChange) {
      this.options.onTabChange(index, this.tabs[index].docType);
    }
  }

  handleKeydown(event, index) {
    let newIndex = index;

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        newIndex = index > 0 ? index - 1 : this.tabs.length - 1;
        break;
      case 'ArrowRight':
        event.preventDefault();
        newIndex = index < this.tabs.length - 1 ? index + 1 : 0;
        break;
      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        newIndex = this.tabs.length - 1;
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.setActiveTab(index);
        return;
      default:
        return;
    }

    this.setActiveTab(newIndex);
    this.tabs[newIndex].element.focus();
  }

  handleResize() {
    // Handle responsive behavior if needed
    const isMobile = window.innerWidth < 768;
    this.container.classList.toggle('mobile', isMobile);
  }

  getActiveTab() {
    return this.tabs[this.activeIndex];
  }

  getActivePanel() {
    return this.tabPanels.children[this.activeIndex];
  }

  // Public API methods
  next() {
    const nextIndex = (this.activeIndex + 1) % this.tabs.length;
    this.setActiveTab(nextIndex);
  }

  previous() {
    const prevIndex = this.activeIndex > 0 ? this.activeIndex - 1 : this.tabs.length - 1;
    this.setActiveTab(prevIndex);
  }

  goToTab(docTypeId) {
    const index = this.tabs.findIndex(tab => tab.docType.id === docTypeId);
    if (index !== -1) {
      this.setActiveTab(index);
    }
  }
}

// CSS styles
const styles = `
.doc-gen-tabs-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 1rem;
}

.doc-gen-tab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  background: #ffffff;
  color: #374151;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 0;
  flex: 1;
  justify-content: center;
}

.doc-gen-tab:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.doc-gen-tab:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.doc-gen-tab.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: #ffffff;
}

.doc-gen-tab .tab-icon {
  font-size: 1.125rem;
  flex-shrink: 0;
}

.doc-gen-tab .tab-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.doc-gen-tab-panels {
  position: relative;
}

.doc-gen-tab-panel {
  display: block;
}

.doc-gen-tab-panel[hidden] {
  display: none;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .doc-gen-tabs-nav {
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .doc-gen-tab {
    flex: none;
    justify-content: flex-start;
    padding: 0.5rem 0.75rem;
  }
  
  .doc-gen-tab .tab-label {
    font-size: 0.8rem;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .doc-gen-tab {
    border-width: 2px;
  }
  
  .doc-gen-tab.active {
    background: #000000;
    color: #ffffff;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .doc-gen-tab {
    transition: none;
  }
}
`;

// Inject styles
if (!document.querySelector('#doc-gen-tabs-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'doc-gen-tabs-styles';
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DocumentGeneratorTabs;
} else {
  window.DocumentGeneratorTabs = DocumentGeneratorTabs;
}