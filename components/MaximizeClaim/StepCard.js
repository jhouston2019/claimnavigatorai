/**
 * MaximizeClaim StepCard Component
 * Displays step content with What to Do, Why It Matters, and AI Assist button
 */

class MaximizeClaimStepCard {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.stepData = options.stepData || {};
    this.language = options.language || 'en';
    this.onAIAssistClick = options.onAIAssistClick || (() => {});
    
    this.init();
  }

  init() {
    this.render();
    this.attachEventListeners();
  }

  render() {
    const { title, whatToDo, whyItMatters, aiAssist } = this.stepData;
    
    this.container.innerHTML = `
      <div class="maximize-claim-step-card">
        <div class="step-header">
          <h2 class="step-title">${title || ''}</h2>
        </div>
        
        <div class="step-content">
          <div class="what-to-do-section">
            <h3 class="section-title">
              <i class="icon-checklist"></i>
              ${this.getText('whatToDo')}
            </h3>
            <div class="section-content">
              ${whatToDo || ''}
            </div>
          </div>
          
          <div class="why-it-matters-section">
            <h3 class="section-title">
              <i class="icon-info"></i>
              ${this.getText('whyItMatters')}
            </h3>
            <div class="section-content">
              ${whyItMatters || ''}
            </div>
          </div>
        </div>
        
        <div class="step-actions">
          <button class="ai-assist-btn" data-tool="${aiAssist || ''}">
            <i class="icon-ai"></i>
            ${this.getText('navigation.aiAssist')}
            <span class="tool-name">${aiAssist || ''}</span>
          </button>
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    // AI Assist button
    this.container.querySelector('.ai-assist-btn').addEventListener('click', (e) => {
      const tool = e.currentTarget.dataset.tool;
      this.onAIAssistClick(tool);
    });
  }

  updateStepData(newStepData) {
    this.stepData = { ...this.stepData, ...newStepData };
    this.render();
    this.attachEventListeners();
  }

  getText(key) {
    // This would be replaced with actual i18n implementation
    const translations = {
      'whatToDo': this.language === 'es' ? 'Qué Hacer' : 'What to Do',
      'whyItMatters': this.language === 'es' ? 'Por Qué Importa' : 'Why It Matters',
      'navigation.aiAssist': this.language === 'es' ? 'Asistencia IA' : 'AI Assist'
    };
    return translations[key] || key;
  }

  // Public methods
  setLanguage(lang) {
    this.language = lang;
    this.render();
    this.attachEventListeners();
  }

  setStepData(stepData) {
    this.stepData = stepData;
    this.render();
    this.attachEventListeners();
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MaximizeClaimStepCard;
} else {
  window.MaximizeClaimStepCard = MaximizeClaimStepCard;
}
