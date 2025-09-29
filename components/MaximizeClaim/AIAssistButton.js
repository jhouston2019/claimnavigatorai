/**
 * MaximizeClaim AIAssistButton Component
 * Handles AI Assist button functionality with Stripe gating
 */

class MaximizeClaimAIAssistButton {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.toolName = options.toolName || '';
    this.language = options.language || 'en';
    this.onClick = options.onClick || (() => {});
    this.onLimitReached = options.onLimitReached || (() => {});
    this.onUpgradeRequired = options.onUpgradeRequired || (() => {});
    
    this.init();
  }

  init() {
    this.render();
    this.attachEventListeners();
  }

  render() {
    this.container.innerHTML = `
      <div class="ai-assist-button-container">
        <button class="ai-assist-btn" data-tool="${this.toolName}">
          <div class="btn-content">
            <i class="icon-ai"></i>
            <span class="btn-text">${this.getText('navigation.aiAssist')}</span>
            <span class="tool-name">${this.toolName}</span>
          </div>
          <div class="btn-status">
            <i class="icon-arrow-right"></i>
          </div>
        </button>
        
        <div class="tool-info">
          <p class="tool-description">
            ${this.getToolDescription()}
          </p>
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    this.container.querySelector('.ai-assist-btn').addEventListener('click', async (e) => {
      e.preventDefault();
      await this.handleClick();
    });
  }

  async handleClick() {
    try {
      // Show loading state
      this.setLoadingState(true);
      
      // Check user limits and subscription status
      const limitCheck = await this.checkUserLimits();
      
      if (!limitCheck.canGenerate) {
        if (limitCheck.upgradeRequired) {
          this.onUpgradeRequired(limitCheck);
        } else {
          this.onLimitReached(limitCheck);
        }
        return;
      }
      
      // Proceed with tool access
      this.onClick(this.toolName, limitCheck);
      
    } catch (error) {
      console.error('Error handling AI Assist click:', error);
      this.showError(this.getText('error.generic'));
    } finally {
      this.setLoadingState(false);
    }
  }

  async checkUserLimits() {
    try {
      // Get user auth token
      const token = this.getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Check limits via API
      const response = await fetch('/.netlify/functions/checkUserLimits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          toolType: this.getToolType(),
          language: this.language
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
      
    } catch (error) {
      console.error('Error checking user limits:', error);
      // Return conservative defaults
      return {
        canGenerate: false,
        upgradeRequired: true,
        count: 0,
        limit: 2,
        subscriptionStatus: 'none'
      };
    }
  }

  getToolType() {
    // Map tool names to tool types for limit checking
    const toolTypeMap = {
      'Damage Inventory Sheet': 'document',
      'Policy Analyzer': 'advisory',
      'Proof of Loss Generator': 'document',
      'Notice of Delay Complaint': 'document',
      'ROM Estimator + Demand Letter': 'document',
      'Appraisal Demand Letter or Appeal Letter': 'document',
      'Professional Marketplace': 'advisory',
      'Claim Diary Generator': 'document'
    };
    
    return toolTypeMap[this.toolName] || 'document';
  }

  getToolDescription() {
    const descriptions = {
      'Damage Inventory Sheet': this.language === 'es' 
        ? 'Genera una hoja de inventario detallada de todos los daños' 
        : 'Generate a detailed inventory sheet of all damages',
      'Policy Analyzer': this.language === 'es' 
        ? 'Analiza tu póliza para identificar cobertura y derechos' 
        : 'Analyze your policy to identify coverage and rights',
      'Proof of Loss Generator': this.language === 'es' 
        ? 'Genera una declaración formal de pérdidas' 
        : 'Generate a formal statement of losses',
      'Notice of Delay Complaint': this.language === 'es' 
        ? 'Crea una queja formal por retrasos en el procesamiento' 
        : 'Create a formal complaint about processing delays',
      'ROM Estimator + Demand Letter': this.language === 'es' 
        ? 'Estima costos y genera carta de demanda' 
        : 'Estimate costs and generate demand letter',
      'Appraisal Demand Letter or Appeal Letter': this.language === 'es' 
        ? 'Genera carta de tasación o apelación' 
        : 'Generate appraisal or appeal letter',
      'Professional Marketplace': this.language === 'es' 
        ? 'Conecta con profesionales especializados' 
        : 'Connect with specialized professionals',
      'Claim Diary Generator': this.language === 'es' 
        ? 'Crea un diario detallado del reclamo' 
        : 'Create a detailed claim diary'
    };
    
    return descriptions[this.toolName] || '';
  }

  setLoadingState(loading) {
    const btn = this.container.querySelector('.ai-assist-btn');
    if (loading) {
      btn.classList.add('loading');
      btn.disabled = true;
    } else {
      btn.classList.remove('loading');
      btn.disabled = false;
    }
  }

  showError(message) {
    // Create or update error message
    let errorDiv = this.container.querySelector('.error-message');
    if (!errorDiv) {
      errorDiv = document.createElement('div');
      errorDiv.className = 'error-message';
      this.container.appendChild(errorDiv);
    }
    
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    // Hide error after 5 seconds
    setTimeout(() => {
      errorDiv.style.display = 'none';
    }, 5000);
  }

  getAuthToken() {
    // Get token from localStorage or sessionStorage
    return localStorage.getItem('supabase.auth.token') || 
           sessionStorage.getItem('supabase.auth.token');
  }

  getText(key) {
    const translations = {
      'navigation.aiAssist': this.language === 'es' ? 'Asistencia IA' : 'AI Assist',
      'error.generic': this.language === 'es' ? 'Error al procesar solicitud' : 'Error processing request'
    };
    return translations[key] || key;
  }

  // Public methods
  setLanguage(lang) {
    this.language = lang;
    this.render();
    this.attachEventListeners();
  }

  setToolName(toolName) {
    this.toolName = toolName;
    this.render();
    this.attachEventListeners();
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MaximizeClaimAIAssistButton;
} else {
  window.MaximizeClaimAIAssistButton = MaximizeClaimAIAssistButton;
}
