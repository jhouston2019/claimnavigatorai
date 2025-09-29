/**
 * MaximizeClaim Stepper Component
 * Handles navigation between steps and progress tracking
 */

class MaximizeClaimStepper {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.currentStep = options.currentStep || 0;
    this.totalSteps = options.totalSteps || 7;
    this.completedSteps = options.completedSteps || [];
    this.language = options.language || 'en';
    this.onStepChange = options.onStepChange || (() => {});
    this.onStepComplete = options.onStepComplete || (() => {});
    
    this.init();
  }

  init() {
    this.render();
    this.attachEventListeners();
  }

  render() {
    this.container.innerHTML = `
      <div class="maximize-claim-stepper">
        <!-- Progress Bar -->
        <div class="progress-container">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${(this.completedSteps.length / this.totalSteps) * 100}%"></div>
          </div>
          <div class="progress-text">
            ${this.getProgressText()}
          </div>
        </div>

        <!-- Step Navigation -->
        <div class="step-navigation">
          <button class="nav-btn prev-btn" ${this.currentStep === 0 ? 'disabled' : ''}>
            <i class="icon-arrow-left"></i>
            ${this.getText('navigation.previous')}
          </button>
          
          <div class="step-indicators">
            ${this.renderStepIndicators()}
          </div>
          
          <button class="nav-btn next-btn" ${this.currentStep === this.totalSteps - 1 ? 'disabled' : ''}>
            ${this.getText('navigation.next')}
            <i class="icon-arrow-right"></i>
          </button>
        </div>

        <!-- Step Actions -->
        <div class="step-actions">
          <button class="action-btn complete-btn" ${this.isStepCompleted(this.currentStep) ? 'disabled' : ''}>
            <i class="icon-check"></i>
            ${this.isStepCompleted(this.currentStep) ? this.getText('navigation.completed') : this.getText('navigation.markComplete')}
          </button>
        </div>
      </div>
    `;
  }

  renderStepIndicators() {
    let indicators = '';
    for (let i = 0; i < this.totalSteps; i++) {
      const isActive = i === this.currentStep;
      const isCompleted = this.isStepCompleted(i);
      
      indicators += `
        <div class="step-indicator ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}" 
             data-step="${i}">
          <div class="step-number">${i + 1}</div>
        </div>
      `;
    }
    return indicators;
  }

  attachEventListeners() {
    // Previous button
    this.container.querySelector('.prev-btn').addEventListener('click', () => {
      if (this.currentStep > 0) {
        this.goToStep(this.currentStep - 1);
      }
    });

    // Next button
    this.container.querySelector('.next-btn').addEventListener('click', () => {
      if (this.currentStep < this.totalSteps - 1) {
        this.goToStep(this.currentStep + 1);
      }
    });

    // Step indicators
    this.container.querySelectorAll('.step-indicator').forEach((indicator, index) => {
      indicator.addEventListener('click', () => {
        this.goToStep(index);
      });
    });

    // Complete button
    this.container.querySelector('.complete-btn').addEventListener('click', () => {
      this.toggleStepCompletion(this.currentStep);
    });
  }

  goToStep(stepIndex) {
    if (stepIndex >= 0 && stepIndex < this.totalSteps) {
      this.currentStep = stepIndex;
      this.render();
      this.attachEventListeners();
      this.onStepChange(stepIndex);
    }
  }

  toggleStepCompletion(stepIndex) {
    if (this.isStepCompleted(stepIndex)) {
      this.completedSteps = this.completedSteps.filter(step => step !== stepIndex);
    } else {
      this.completedSteps.push(stepIndex);
    }
    
    this.render();
    this.attachEventListeners();
    this.onStepComplete(stepIndex, this.isStepCompleted(stepIndex));
  }

  isStepCompleted(stepIndex) {
    return this.completedSteps.includes(stepIndex);
  }

  getProgressText() {
    const completed = this.completedSteps.length;
    const total = this.totalSteps;
    return this.getText('progress').replace('{completed}', completed).replace('{total}', total);
  }

  getText(key) {
    // This would be replaced with actual i18n implementation
    const translations = {
      'navigation.previous': this.language === 'es' ? 'Anterior' : 'Previous',
      'navigation.next': this.language === 'es' ? 'Siguiente' : 'Next',
      'navigation.completed': this.language === 'es' ? 'Completado' : 'Completed',
      'navigation.markComplete': this.language === 'es' ? 'Marcar Paso Completado' : 'Mark Step Complete',
      'progress': this.language === 'es' ? 'Progreso: {completed} de {total} pasos completados' : 'Progress: {completed} of {total} steps completed'
    };
    return translations[key] || key;
  }

  // Public methods
  setLanguage(lang) {
    this.language = lang;
    this.render();
    this.attachEventListeners();
  }

  getCurrentStep() {
    return this.currentStep;
  }

  getCompletedSteps() {
    return [...this.completedSteps];
  }

  setCompletedSteps(steps) {
    this.completedSteps = [...steps];
    this.render();
    this.attachEventListeners();
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MaximizeClaimStepper;
} else {
  window.MaximizeClaimStepper = MaximizeClaimStepper;
}
