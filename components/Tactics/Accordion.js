/**
 * Accessible Accordion Component for Insurance Tactics
 * Supports keyboard navigation and ARIA compliance
 */
class TacticsAccordion {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.options = {
      allowMultiple: false,
      ...options
    };
    this.activePanel = null;
    this.panels = [];
    
    this.init();
  }

  init() {
    if (!this.container) {
      console.error('Accordion container not found:', this.containerId);
      return;
    }

    this.setupPanels();
    this.bindEvents();
  }

  setupPanels() {
    const panelElements = this.container.querySelectorAll('[data-accordion-panel]');
    
    panelElements.forEach((panel, index) => {
      const header = panel.querySelector('[data-accordion-header]');
      const content = panel.querySelector('[data-accordion-content]');
      
      if (!header || !content) {
        console.warn('Panel missing required elements:', panel);
        return;
      }

      // Set ARIA attributes
      const panelId = `tactic-panel-${index}`;
      const contentId = `tactic-content-${index}`;
      
      header.setAttribute('id', panelId);
      header.setAttribute('aria-expanded', 'false');
      header.setAttribute('aria-controls', contentId);
      header.setAttribute('role', 'button');
      header.setAttribute('tabindex', '0');
      
      content.setAttribute('id', contentId);
      content.setAttribute('aria-labelledby', panelId);
      content.setAttribute('role', 'region');
      content.setAttribute('aria-hidden', 'true');
      
      // Initially hide content
      content.style.display = 'none';
      
      this.panels.push({
        element: panel,
        header,
        content,
        index,
        isOpen: false
      });
    });
  }

  bindEvents() {
    this.panels.forEach(panel => {
      // Click events
      panel.header.addEventListener('click', () => this.togglePanel(panel.index));
      
      // Keyboard events
      panel.header.addEventListener('keydown', (e) => this.handleKeydown(e, panel.index));
    });
  }

  handleKeydown(event, panelIndex) {
    const { key } = event;
    
    switch (key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.togglePanel(panelIndex);
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.focusNextPanel(panelIndex);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.focusPreviousPanel(panelIndex);
        break;
      case 'Home':
        event.preventDefault();
        this.focusFirstPanel();
        break;
      case 'End':
        event.preventDefault();
        this.focusLastPanel();
        break;
    }
  }

  togglePanel(panelIndex) {
    const panel = this.panels[panelIndex];
    if (!panel) return;

    if (panel.isOpen) {
      this.closePanel(panelIndex);
    } else {
      // Close other panels if not allowing multiple
      if (!this.options.allowMultiple) {
        this.panels.forEach((p, index) => {
          if (index !== panelIndex && p.isOpen) {
            this.closePanel(index);
          }
        });
      }
      this.openPanel(panelIndex);
    }
  }

  openPanel(panelIndex) {
    const panel = this.panels[panelIndex];
    if (!panel || panel.isOpen) return;

    panel.isOpen = true;
    panel.header.setAttribute('aria-expanded', 'true');
    panel.content.setAttribute('aria-hidden', 'false');
    panel.content.style.display = 'block';
    
    // Add animation class if available
    panel.content.classList.add('accordion-content-open');
    
    this.activePanel = panelIndex;
    
    // Trigger custom event
    this.triggerEvent('panelOpen', { panelIndex, panel });
  }

  closePanel(panelIndex) {
    const panel = this.panels[panelIndex];
    if (!panel || !panel.isOpen) return;

    panel.isOpen = false;
    panel.header.setAttribute('aria-expanded', 'false');
    panel.content.setAttribute('aria-hidden', 'true');
    panel.content.style.display = 'none';
    
    // Remove animation class
    panel.content.classList.remove('accordion-content-open');
    
    if (this.activePanel === panelIndex) {
      this.activePanel = null;
    }
    
    // Trigger custom event
    this.triggerEvent('panelClose', { panelIndex, panel });
  }

  focusNextPanel(currentIndex) {
    const nextIndex = (currentIndex + 1) % this.panels.length;
    this.panels[nextIndex].header.focus();
  }

  focusPreviousPanel(currentIndex) {
    const prevIndex = currentIndex === 0 ? this.panels.length - 1 : currentIndex - 1;
    this.panels[prevIndex].header.focus();
  }

  focusFirstPanel() {
    if (this.panels.length > 0) {
      this.panels[0].header.focus();
    }
  }

  focusLastPanel() {
    if (this.panels.length > 0) {
      this.panels[this.panels.length - 1].header.focus();
    }
  }

  triggerEvent(eventName, detail) {
    const event = new CustomEvent(`accordion:${eventName}`, {
      detail,
      bubbles: true
    });
    this.container.dispatchEvent(event);
  }

  // Public API methods
  openPanelByIndex(index) {
    if (index >= 0 && index < this.panels.length) {
      this.togglePanel(index);
    }
  }

  closeAllPanels() {
    this.panels.forEach((_, index) => this.closePanel(index));
  }

  getActivePanel() {
    return this.activePanel;
  }

  getPanelCount() {
    return this.panels.length;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TacticsAccordion;
} else if (typeof window !== 'undefined') {
  window.TacticsAccordion = TacticsAccordion;
}
