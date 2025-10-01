/**
 * TacticPanel Component for Insurance Tactics
 * Renders individual tactic panels with AI Assist buttons
 */
class TacticPanel {
  constructor(tactic, index, language = 'en') {
    this.tactic = tactic;
    this.index = index;
    this.language = language;
    this.element = null;
  }

  render() {
    const panel = document.createElement('div');
    panel.className = 'tactic-panel';
    panel.setAttribute('data-accordion-panel', '');
    panel.setAttribute('data-tactic-index', this.index);
    
    panel.innerHTML = this.getPanelHTML();
    this.element = panel;
    
    this.bindEvents();
    return panel;
  }

  getPanelHTML() {
    const labels = this.getLabels();
    
    return `
      <div class="tactic-header" data-accordion-header>
        <div class="tactic-title">
          <h3>${this.tactic.title}</h3>
          <div class="tactic-indicator">
            <span class="tactic-number">${this.index + 1}</span>
            <span class="expand-icon" aria-hidden="true">▼</span>
          </div>
        </div>
      </div>
      
      <div class="tactic-content" data-accordion-content>
        <div class="tactic-details">
          <div class="tactic-section">
            <h4 class="section-label">${labels.whatInsurersDo}</h4>
            <p class="section-content">${this.tactic.whatInsurersDo}</p>
          </div>
          
          <div class="tactic-section">
            <h4 class="section-label">${labels.why}</h4>
            <p class="section-content">${this.tactic.why}</p>
          </div>
          
          <div class="tactic-section">
            <h4 class="section-label">${labels.yourMove}</h4>
            <p class="section-content">${this.tactic.yourMove}</p>
          </div>
          
          <div class="tactic-actions">
            <button class="ai-assist-btn" data-tactic-index="${this.index}" data-ai-tools="${this.tactic.aiAssistTool}">
              <span class="ai-icon">🤖</span>
              <span class="ai-text">${labels.aiAssist}</span>
              <span class="ai-tools">${this.tactic.aiAssistTool}</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  getLabels() {
    // This would typically come from the i18n system
    const labels = {
      en: {
        whatInsurersDo: 'What insurers do',
        why: 'Why they do it',
        yourMove: 'Your move',
        aiAssist: 'AI Assist'
      },
      es: {
        whatInsurersDo: 'Lo que hacen las aseguradoras',
        why: 'Por qué lo hacen',
        yourMove: 'Tu movimiento',
        aiAssist: 'Asistencia IA'
      }
    };
    
    return labels[this.language] || labels.en;
  }

  bindEvents() {
    if (!this.element) return;

    const aiAssistBtn = this.element.querySelector('.ai-assist-btn');
    if (aiAssistBtn) {
      aiAssistBtn.addEventListener('click', (e) => this.handleAiAssistClick(e));
    }
  }

  handleAiAssistClick(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const tacticIndex = parseInt(event.currentTarget.getAttribute('data-tactic-index'));
    const aiTools = event.currentTarget.getAttribute('data-ai-tools');
    
    // Log the interaction
    this.logTacticUsage(tacticIndex, true);
    
    // Trigger custom event for AI assist
    const aiAssistEvent = new CustomEvent('tactic:aiAssist', {
      detail: {
        tacticIndex,
        tactic: this.tactic,
        aiTools,
        language: this.language
      },
      bubbles: true
    });
    
    document.dispatchEvent(aiAssistEvent);
    
    // Navigate to appropriate tool
    this.navigateToAiTool(aiTools);
  }

  navigateToAiTool(aiTools) {
    // Parse AI tools and navigate to the first one
    const tools = aiTools.split(',').map(tool => tool.trim());
    const primaryTool = tools[0];
    
    // Map tool names to routes
    const toolRoutes = {
      'Claim Diary Generator': '/app/document-generator.html?type=claim-timeline',
      'Notice of Delay Complaint': '/app/document-generator.html?type=delay-complaint',
      'Coverage Clarification Request': '/app/document-generator.html?type=coverage-clarification',
      'Appeal Letter Generator': '/app/document-generator.html?type=appeal-letter',
      'ROM Estimator': '/app/rom-estimator.html',
      'Demand Letter': '/app/document-generator.html?type=demand-letter',
      'Payment Demand Letter': '/app/document-generator.html?type=demand-letter',
      'Appraisal Demand Letter': '/app/document-generator.html?type=appraisal-demand',
      'Medical Necessity Appeal': '/app/document-generator.html?type=appeal-letter',
      'Certified Policy Request Letter': '/app/document-generator.html?type=coverage-clarification',
      'Policy Analyzer': '/app/policy-analyzer.html'
    };
    
    const route = toolRoutes[primaryTool];
    if (route) {
      window.location.href = route;
    } else {
      // Fallback to document generator
      window.location.href = '/app/document-generator.html';
    }
  }

  async logTacticUsage(tacticIndex, clicked = true) {
    try {
      // Use the global tactics logging utility
      if (window.tacticsLogging) {
        await window.tacticsLogging.logTacticUsage(tacticIndex + 1, clicked);
      } else {
        // Fallback to console logging
        console.log('Tactic usage (fallback):', {
          tacticNumber: tacticIndex + 1,
          clicked,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error in logTacticUsage:', error);
    }
  }

  getCurrentUserId() {
    // This would integrate with your existing auth system
    // For now, return a placeholder
    return localStorage.getItem('user_id') || 'anonymous';
  }

  // Public API methods
  updateLanguage(newLanguage) {
    this.language = newLanguage;
    if (this.element) {
      const labels = this.getLabels();
      const labelElements = this.element.querySelectorAll('.section-label');
      const aiText = this.element.querySelector('.ai-text');
      
      if (labelElements.length >= 3) {
        labelElements[0].textContent = labels.whatInsurersDo;
        labelElements[1].textContent = labels.why;
        labelElements[2].textContent = labels.yourMove;
      }
      
      if (aiText) {
        aiText.textContent = labels.aiAssist;
      }
    }
  }

  getTacticData() {
    return this.tactic;
  }

  getIndex() {
    return this.index;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TacticPanel;
} else if (typeof window !== 'undefined') {
  window.TacticPanel = TacticPanel;
}
