class AppealBuilder {
  constructor() {
    this.currentStep = 1;
    this.totalSteps = 6;
    this.formData = {};
    this.userAppeals = [];
    this.hasActiveAppeal = false;
    this.language = 'en';
    
    this.init();
  }

  async init() {
    await this.checkUserAppeals();
    this.render();
    this.bindEvents();
    this.loadAppealTracker();
  }

  async checkUserAppeals() {
    try {
      const userEmail = localStorage.getItem('userEmail');
      if (!userEmail) {
        console.log('No user email found');
        return;
      }

      const response = await fetch('/.netlify/functions/get-user-appeals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail })
      });

      if (response.ok) {
        const data = await response.json();
        this.userAppeals = data.appeals || [];
        this.hasActiveAppeal = this.userAppeals.some(appeal => appeal.status === 'active' && !appeal.used);
      }
    } catch (error) {
      console.error('Error checking user appeals:', error);
    }
  }

  render() {
    const container = document.getElementById('appeal-builder-content');
    if (!container) return;

    if (!this.hasActiveAppeal) {
      container.innerHTML = this.renderPaywall();
      return;
    }

    container.innerHTML = `
      <div class="appeal-builder-container">
        <div class="appeal-header">
          <h2>Appeal Builder</h2>
          <div class="language-toggle">
            <label>Language:</label>
            <select id="language-select">
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="pt">Portuguese</option>
            </select>
          </div>
        </div>

        <div class="progress-bar">
          <div class="progress-fill" style="width: ${(this.currentStep / this.totalSteps) * 100}%"></div>
        </div>

        <div class="wizard-container">
          <div class="step-indicator">
            Step ${this.currentStep} of ${this.totalSteps}
          </div>

          <form id="appeal-form" class="appeal-form">
            ${this.renderStep()}
          </form>

          <div class="form-navigation">
            ${this.currentStep > 1 ? '<button type="button" id="prev-step" class="btn-secondary">Previous</button>' : ''}
            ${this.currentStep < this.totalSteps ? '<button type="button" id="next-step" class="btn-primary">Next</button>' : ''}
            ${this.currentStep === this.totalSteps ? '<button type="button" id="submit-appeal" class="btn-primary">Generate Appeal</button>' : ''}
          </div>
        </div>

        <div class="sidebar">
          <div class="sidebar-card">
            <h3>Appeal Tracker</h3>
            <div id="appeal-tracker"></div>
          </div>
          <div class="sidebar-card">
            <h3>Professional Partners</h3>
            <div id="affiliate-links"></div>
          </div>
        </div>
      </div>
    `;

    this.loadAffiliateLinks();
    this.loadAppealTracker();
  }

  renderPaywall() {
    return `
      <div class="paywall-container">
        <div class="paywall-card">
          <div class="paywall-header">
            <h2>Appeal Builder – Premium Access</h2>
            <div class="premium-badge">Premium</div>
          </div>
          
          <div class="paywall-content">
            <div class="feature-list">
              <div class="feature-item">
                <span class="feature-icon">📝</span>
                <span>Generate complete, customized appeal letter</span>
              </div>
              <div class="feature-item">
                <span class="feature-icon">📋</span>
                <span>Evidence package with supporting documents</span>
              </div>
              <div class="feature-item">
                <span class="feature-icon">⚖️</span>
                <span>Multiple appeal types (Internal, External, Arbitration, Litigation)</span>
              </div>
              <div class="feature-item">
                <span class="feature-icon">🌍</span>
                <span>Multi-language support</span>
              </div>
              <div class="feature-item">
                <span class="feature-icon">📊</span>
                <span>Appeal tracking dashboard</span>
              </div>
            </div>

            <div class="pricing-section">
              <div class="price">$249</div>
              <div class="price-description">per appeal</div>
            </div>

            <button id="purchase-appeal" class="btn-primary purchase-btn">
              Purchase Appeal for $249
            </button>

            <div class="guarantee">
              <p>✓ Professional quality appeal letters</p>
              <p>✓ Evidence package included</p>
              <p>✓ Multi-language support</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderStep() {
    switch (this.currentStep) {
      case 1:
        return this.renderStep1();
      case 2:
        return this.renderStep2();
      case 3:
        return this.renderStep3();
      case 4:
        return this.renderStep4();
      case 5:
        return this.renderStep5();
      case 6:
        return this.renderStep6();
      default:
        return '';
    }
  }

  renderStep1() {
    return `
      <div class="step-content">
        <h3>Policyholder Information</h3>
        <div class="form-group">
          <label for="policyholder-name">Policyholder / Insured Name *</label>
          <input type="text" id="policyholder-name" name="policyholderName" required 
                 value="${this.formData.policyholderName || ''}">
        </div>
        <div class="form-group">
          <label for="policy-number">Policy Number *</label>
          <input type="text" id="policy-number" name="policyNumber" required 
                 value="${this.formData.policyNumber || ''}">
        </div>
        <div class="form-group">
          <label for="insurer">Insurer *</label>
          <input type="text" id="insurer" name="insurer" required 
                 value="${this.formData.insurer || ''}">
        </div>
      </div>
    `;
  }

  renderStep2() {
    return `
      <div class="step-content">
        <h3>Claim Information</h3>
        <div class="form-group">
          <label for="claim-number">Claim Number *</label>
          <input type="text" id="claim-number" name="claimNumber" required 
                 value="${this.formData.claimNumber || ''}">
        </div>
        <div class="form-group">
          <label for="date-of-loss">Date of Loss *</label>
          <input type="date" id="date-of-loss" name="dateOfLoss" required 
                 value="${this.formData.dateOfLoss || ''}">
        </div>
        <div class="form-group">
          <label for="date-of-denial">Date of Denial *</label>
          <input type="date" id="date-of-denial" name="dateOfDenial" required 
                 value="${this.formData.dateOfDenial || ''}">
        </div>
      </div>
    `;
  }

  renderStep3() {
    return `
      <div class="step-content">
        <h3>Appeal Type & Reason</h3>
        <div class="form-group">
          <label for="appeal-type">Type of Appeal *</label>
          <select id="appeal-type" name="appealType" required>
            <option value="">Select appeal type</option>
            <option value="internal" ${this.formData.appealType === 'internal' ? 'selected' : ''}>Internal Review</option>
            <option value="external" ${this.formData.appealType === 'external' ? 'selected' : ''}>External Review</option>
            <option value="arbitration" ${this.formData.appealType === 'arbitration' ? 'selected' : ''}>Arbitration</option>
            <option value="litigation" ${this.formData.appealType === 'litigation' ? 'selected' : ''}>Litigation Prep</option>
          </select>
        </div>
        <div class="form-group">
          <label for="denial-reason">Reason for Denial *</label>
          <textarea id="denial-reason" name="denialReason" required rows="4" 
                    placeholder="Describe the reason for denial in detail...">${this.formData.denialReason || ''}</textarea>
        </div>
      </div>
    `;
  }

  renderStep4() {
    return `
      <div class="step-content">
        <h3>Supporting Documents</h3>
        <div class="form-group">
          <label for="supporting-docs">Upload Supporting Documents</label>
          <input type="file" id="supporting-docs" name="supportingDocs" multiple 
                 accept=".pdf,.doc,.docx,.jpg,.jpeg,.png">
          <div class="file-upload-info">
            <p>Accepted formats: PDF, DOC, DOCX, JPG, PNG</p>
            <p>Maximum file size: 10MB per file</p>
          </div>
        </div>
        <div id="uploaded-files" class="uploaded-files"></div>
      </div>
    `;
  }

  renderStep5() {
    return `
      <div class="step-content">
        <h3>Additional Information</h3>
        <div class="form-group">
          <label for="additional-notes">Notes / Additional Information</label>
          <textarea id="additional-notes" name="additionalNotes" rows="4" 
                    placeholder="Any additional information that might be relevant to your appeal...">${this.formData.additionalNotes || ''}</textarea>
        </div>
        <div class="form-group">
          <label for="tone">Letter Tone</label>
          <select id="tone" name="tone">
            <option value="cooperative" ${this.formData.tone === 'cooperative' ? 'selected' : ''}>Cooperative</option>
            <option value="firm" ${this.formData.tone === 'firm' ? 'selected' : ''}>Firm</option>
            <option value="legalistic" ${this.formData.tone === 'legalistic' ? 'selected' : ''}>Legalistic</option>
          </select>
        </div>
      </div>
    `;
  }

  renderStep6() {
    return `
      <div class="step-content">
        <h3>Review & Generate</h3>
        <div class="review-section">
          <h4>Review Your Information</h4>
          <div class="review-grid">
            <div class="review-item">
              <strong>Policyholder:</strong> ${this.formData.policyholderName || 'Not provided'}
            </div>
            <div class="review-item">
              <strong>Policy Number:</strong> ${this.formData.policyNumber || 'Not provided'}
            </div>
            <div class="review-item">
              <strong>Insurer:</strong> ${this.formData.insurer || 'Not provided'}
            </div>
            <div class="review-item">
              <strong>Claim Number:</strong> ${this.formData.claimNumber || 'Not provided'}
            </div>
            <div class="review-item">
              <strong>Date of Loss:</strong> ${this.formData.dateOfLoss || 'Not provided'}
            </div>
            <div class="review-item">
              <strong>Date of Denial:</strong> ${this.formData.dateOfDenial || 'Not provided'}
            </div>
            <div class="review-item">
              <strong>Appeal Type:</strong> ${this.getAppealTypeLabel(this.formData.appealType)}
            </div>
            <div class="review-item">
              <strong>Tone:</strong> ${this.formData.tone || 'cooperative'}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  getAppealTypeLabel(type) {
    const labels = {
      'internal': 'Internal Review',
      'external': 'External Review',
      'arbitration': 'Arbitration',
      'litigation': 'Litigation Prep'
    };
    return labels[type] || type;
  }

  async loadAffiliateLinks() {
    try {
      const response = await fetch('/data/affiliates.json');
      const affiliates = await response.json();
      
      const container = document.getElementById('affiliate-links');
      if (!container) return;

      container.innerHTML = affiliates.map(affiliate => `
        <div class="affiliate-link">
          <a href="${affiliate.url}" target="_blank" rel="noopener">
            <span class="affiliate-icon">${affiliate.icon}</span>
            <span class="affiliate-name">${affiliate.name}</span>
          </a>
          <p class="affiliate-description">${affiliate.description}</p>
        </div>
      `).join('');
    } catch (error) {
      console.error('Error loading affiliate links:', error);
    }
  }

  async loadAppealTracker() {
    const container = document.getElementById('appeal-tracker');
    if (!container) return;

    if (this.userAppeals.length === 0) {
      container.innerHTML = '<p class="no-appeals">No appeals yet. Purchase an appeal to get started.</p>';
      return;
    }

    container.innerHTML = this.userAppeals.map(appeal => {
      const statusLabels = {
        'active': 'Active',
        'new': 'New',
        'submitted': 'Submitted',
        'pending': 'Pending',
        'response_received': 'Response Received',
        'next_steps': 'Next Steps'
      };

      const statusColors = {
        'active': '#10b981',
        'new': '#3b82f6',
        'submitted': '#f59e0b',
        'pending': '#8b5cf6',
        'response_received': '#06b6d4',
        'next_steps': '#ef4444'
      };

      const deadline = this.calculateDeadline(appeal);
      
      return `
        <div class="appeal-item">
          <div class="appeal-header">
            <span class="appeal-id">${appeal.appeal_id.substring(0, 8)}...</span>
            <span class="appeal-status" style="color: ${statusColors[appeal.status] || '#6b7280'}">
              ${statusLabels[appeal.status] || appeal.status}
            </span>
          </div>
          <div class="appeal-details">
            <div class="appeal-date">Purchased: ${new Date(appeal.purchased_at).toLocaleDateString()}</div>
            ${appeal.used ? '<div class="appeal-used">✓ Used</div>' : '<div class="appeal-available">Available</div>'}
            ${deadline ? `<div class="appeal-deadline">Deadline: ${deadline}</div>` : ''}
          </div>
          ${appeal.status !== 'active' ? `
            <div class="appeal-actions">
              <select class="status-select" data-appeal-id="${appeal.appeal_id}">
                <option value="new" ${appeal.status === 'new' ? 'selected' : ''}>New</option>
                <option value="submitted" ${appeal.status === 'submitted' ? 'selected' : ''}>Submitted</option>
                <option value="pending" ${appeal.status === 'pending' ? 'selected' : ''}>Pending</option>
                <option value="response_received" ${appeal.status === 'response_received' ? 'selected' : ''}>Response Received</option>
                <option value="next_steps" ${appeal.status === 'next_steps' ? 'selected' : ''}>Next Steps</option>
              </select>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    // Bind status change events
    container.querySelectorAll('.status-select').forEach(select => {
      select.addEventListener('change', (e) => this.updateAppealStatus(e.target.dataset.appealId, e.target.value));
    });
  }

  calculateDeadline(appeal) {
    if (!appeal.purchased_at) return null;
    
    const purchaseDate = new Date(appeal.purchased_at);
    const deadline = new Date(purchaseDate.getTime() + (90 * 24 * 60 * 60 * 1000)); // 90 days
    
    return deadline.toLocaleDateString();
  }

  async updateAppealStatus(appealId, newStatus) {
    try {
      const userEmail = localStorage.getItem('userEmail');
      if (!userEmail) return;

      const response = await fetch('/.netlify/functions/update-appeal-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail,
          appealId,
          newStatus
        })
      });

      if (response.ok) {
        // Refresh the appeal tracker
        await this.checkUserAppeals();
        this.loadAppealTracker();
      } else {
        const error = await response.json();
        console.error('Error updating appeal status:', error);
      }
    } catch (error) {
      console.error('Error updating appeal status:', error);
    }
  }

  bindEvents() {
    // Language toggle
    const languageSelect = document.getElementById('language-select');
    if (languageSelect) {
      languageSelect.addEventListener('change', (e) => {
        this.language = e.target.value;
      });
    }

    // Purchase appeal button
    const purchaseBtn = document.getElementById('purchase-appeal');
    if (purchaseBtn) {
      purchaseBtn.addEventListener('click', () => this.purchaseAppeal());
    }

    // Form navigation
    const nextBtn = document.getElementById('next-step');
    const prevBtn = document.getElementById('prev-step');
    const submitBtn = document.getElementById('submit-appeal');

    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.nextStep());
    }
    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.prevStep());
    }
    if (submitBtn) {
      submitBtn.addEventListener('click', () => this.submitAppeal());
    }

    // File upload handling
    const fileInput = document.getElementById('supporting-docs');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
    }
  }

  async purchaseAppeal() {
    try {
      const userEmail = localStorage.getItem('userEmail');
      if (!userEmail) {
        alert('Please log in to purchase an appeal');
        return;
      }

      const response = await fetch('/.netlify/functions/create-appeal-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail })
      });

      if (response.ok) {
        const data = await response.json();
        window.location.href = data.url;
      } else {
        const error = await response.json();
        alert('Error creating checkout session: ' + error.error);
      }
    } catch (error) {
      console.error('Error purchasing appeal:', error);
      alert('Error processing payment. Please try again.');
    }
  }

  nextStep() {
    if (this.validateCurrentStep()) {
      this.saveCurrentStepData();
      this.currentStep++;
      this.render();
      this.bindEvents();
    }
  }

  prevStep() {
    this.saveCurrentStepData();
    this.currentStep--;
    this.render();
    this.bindEvents();
  }

  validateCurrentStep() {
    const form = document.getElementById('appeal-form');
    const requiredFields = form.querySelectorAll('[required]');
    
    for (const field of requiredFields) {
      if (!field.value.trim()) {
        field.focus();
        alert(`Please fill in the ${field.labels[0].textContent} field`);
        return false;
      }
    }
    return true;
  }

  saveCurrentStepData() {
    const form = document.getElementById('appeal-form');
    const formData = new FormData(form);
    
    for (const [key, value] of formData.entries()) {
      this.formData[key] = value;
    }
  }

  handleFileUpload(event) {
    const files = Array.from(event.target.files);
    const container = document.getElementById('uploaded-files');
    
    if (!container) return;

    container.innerHTML = files.map(file => `
      <div class="uploaded-file">
        <span class="file-name">${file.name}</span>
        <span class="file-size">${(file.size / 1024 / 1024).toFixed(2)} MB</span>
      </div>
    `).join('');
  }

  async submitAppeal() {
    if (!this.validateCurrentStep()) return;

    this.saveCurrentStepData();
    
    try {
      const userEmail = localStorage.getItem('userEmail');
      const response = await fetch('/.netlify/functions/generate-appeal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail,
          formData: this.formData,
          language: this.language
        })
      });

      if (response.ok) {
        const data = await response.json();
        this.showAppealResult(data);
      } else {
        const error = await response.json();
        alert('Error generating appeal: ' + error.error);
      }
    } catch (error) {
      console.error('Error submitting appeal:', error);
      alert('Error generating appeal. Please try again.');
    }
  }

  showAppealResult(data) {
    const container = document.getElementById('appeal-builder-content');
    container.innerHTML = `
      <div class="appeal-result">
        <div class="result-header">
          <h2>Appeal Generated Successfully!</h2>
          <div class="success-icon">✓</div>
        </div>
        
        <div class="result-content">
          <div class="download-section">
            <h3>Download Your Appeal Letter</h3>
            <div class="download-buttons">
              <a href="${data.pdfUrl}" class="btn-primary" download>Download PDF</a>
              <a href="${data.docxUrl}" class="btn-secondary" download>Download DOCX</a>
            </div>
          </div>
          
          <div class="appeal-preview">
            <h3>Preview</h3>
            <div class="preview-content">${data.preview}</div>
          </div>
        </div>
        
        <div class="result-actions">
          <button onclick="location.reload()" class="btn-primary">Create Another Appeal</button>
          <a href="/app/response-center.html" class="btn-secondary">Back to Claim Resource & AI Response Center</a>
        </div>
      </div>
    `;
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('appeal-builder-content')) {
    new AppealBuilder();
  }
});
