/**
 * Claim Command Center - Reusable Components
 * Vanilla JavaScript components for tool integration
 */

// =====================================================
// SUPABASE CLIENT INITIALIZATION
// =====================================================
const supabaseUrl = window.ENV?.SUPABASE_URL || '';
const supabaseAnonKey = window.ENV?.SUPABASE_ANON_KEY || '';
let supabaseClient = null;

if (typeof supabase !== 'undefined' && supabaseUrl && supabaseAnonKey) {
  supabaseClient = supabase.createClient(supabaseUrl, supabaseAnonKey);
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Get current user session
 */
async function getCurrentUser() {
  if (!supabaseClient) return null;
  const { data: { session } } = await supabaseClient.auth.getSession();
  return session?.user || null;
}

/**
 * Get auth token
 */
async function getAuthToken() {
  if (!supabaseClient) return null;
  const { data: { session } } = await supabaseClient.auth.getSession();
  return session?.access_token || null;
}

/**
 * Format currency
 */
function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

/**
 * Format date
 */
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'};
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    z-index: 10000;
    animation: slideIn 0.3s ease;
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// =====================================================
// STEP TOOL MODAL COMPONENT
// =====================================================

class StepToolModal {
  constructor(config) {
    this.stepNumber = config.stepNumber;
    this.toolType = config.toolType;
    this.title = config.title;
    this.requiredDocuments = config.requiredDocuments || [];
    this.onRun = config.onRun;
    this.onClose = config.onClose;
    this.modalId = `step-tool-modal-${this.stepNumber}`;
    
    this.modal = null;
    this.uploadedFiles = {};
  }
  
  render() {
    const modalHTML = `
      <div class="modal-overlay" id="${this.modalId}">
        <div class="modal-content">
          <div class="modal-header">
            <h2 class="modal-title">${this.title}</h2>
            <button class="modal-close-btn" onclick="closeStepToolModal('${this.modalId}')">&times;</button>
          </div>
          
          <div class="modal-body">
            ${this.renderUploadSection()}
            <div class="modal-status" id="${this.modalId}-status"></div>
            <div class="modal-output" id="${this.modalId}-output" style="display: none;"></div>
          </div>
          
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeStepToolModal('${this.modalId}')">Cancel</button>
            <button class="btn btn-primary" id="${this.modalId}-run-btn" onclick="runStepTool('${this.modalId}')">
              Run Analysis
            </button>
          </div>
        </div>
      </div>
    `;
    
    // Add modal to DOM
    const container = document.createElement('div');
    container.innerHTML = modalHTML;
    document.body.appendChild(container.firstElementChild);
    
    this.modal = document.getElementById(this.modalId);
    this.attachEventListeners();
    
    return this.modal;
  }
  
  renderUploadSection() {
    if (this.requiredDocuments.length === 0) {
      return '<p class="modal-info">No documents required for this analysis.</p>';
    }
    
    let html = '<div class="upload-section">';
    html += '<h3 class="upload-title">Required Documents</h3>';
    
    for (const doc of this.requiredDocuments) {
      html += `
        <div class="upload-item">
          <label class="upload-label">${doc.label}</label>
          <input 
            type="file" 
            id="${this.modalId}-file-${doc.key}"
            accept=".pdf,image/*"
            class="upload-input"
            data-doc-key="${doc.key}"
          />
          <div class="upload-status" id="${this.modalId}-status-${doc.key}"></div>
        </div>
      `;
    }
    
    html += '</div>';
    return html;
  }
  
  attachEventListeners() {
    // File upload listeners
    for (const doc of this.requiredDocuments) {
      const fileInput = document.getElementById(`${this.modalId}-file-${doc.key}`);
      if (fileInput) {
        fileInput.addEventListener('change', (e) => this.handleFileUpload(e, doc.key));
      }
    }
  }
  
  async handleFileUpload(event, docKey) {
    const file = event.target.files[0];
    if (!file) return;
    
    const statusEl = document.getElementById(`${this.modalId}-status-${docKey}`);
    statusEl.textContent = 'Uploading...';
    statusEl.className = 'upload-status uploading';
    
    try {
      // Get current user and claim
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const claimId = this.getClaimId();
      if (!claimId) {
        throw new Error('Claim ID not found');
      }
      
      // Upload file
      const result = await this.uploadFile(file, user.id, claimId, docKey);
      
      this.uploadedFiles[docKey] = result;
      statusEl.textContent = '✓ Uploaded';
      statusEl.className = 'upload-status success';
      
    } catch (error) {
      console.error('Upload error:', error);
      statusEl.textContent = `✗ ${error.message}`;
      statusEl.className = 'upload-status error';
    }
  }
  
  async uploadFile(file, userId, claimId, documentType) {
    // Validate file size
    if (file.size > 15 * 1024 * 1024) {
      throw new Error('File size exceeds 15MB limit');
    }
    
    // Generate file path
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${sanitizedName}`;
    
    const subfolderMap = {
      'policy': 'policies',
      'contractor_estimate': 'estimates',
      'carrier_estimate': 'estimates',
      'settlement_letter': 'settlements',
      'release': 'releases'
    };
    
    const subfolder = subfolderMap[documentType] || 'other';
    const filePath = `${userId}/${claimId}/${subfolder}/${fileName}`;
    
    // Upload to Supabase Storage
    const { data, error } = await supabaseClient.storage
      .from('claim-documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }
    
    // Get signed URL
    const { data: urlData } = await supabaseClient.storage
      .from('claim-documents')
      .createSignedUrl(filePath, 3600);
    
    // Save document record
    const { data: docRecord, error: docError } = await supabaseClient
      .from('claim_documents')
      .insert({
        claim_id: claimId,
        user_id: userId,
        document_type: documentType,
        file_name: file.name,
        file_url: urlData.signedUrl,
        file_size: file.size,
        mime_type: file.type,
        storage_path: filePath,
        step_number: this.stepNumber
      })
      .select()
      .single();
    
    if (docError) {
      console.error('Failed to save document record:', docError);
    }
    
    return {
      url: urlData.signedUrl,
      path: filePath,
      documentId: docRecord?.id
    };
  }
  
  getClaimId() {
    // Try to get from URL params
    const params = new URLSearchParams(window.location.search);
    const claimId = params.get('claim_id');
    if (claimId) return claimId;
    
    // Try to get from localStorage
    return localStorage.getItem('current_claim_id');
  }
  
  show() {
    if (this.modal) {
      this.modal.classList.add('show');
      document.body.style.overflow = 'hidden';
    }
  }
  
  hide() {
    if (this.modal) {
      this.modal.classList.remove('show');
      document.body.style.overflow = '';
      if (this.onClose) {
        this.onClose();
      }
    }
  }
  
  async run() {
    // Validate all required documents are uploaded
    for (const doc of this.requiredDocuments) {
      if (!this.uploadedFiles[doc.key]) {
        showToast(`Please upload ${doc.label}`, 'error');
        return;
      }
    }
    
    const statusEl = document.getElementById(`${this.modalId}-status`);
    const runBtn = document.getElementById(`${this.modalId}-run-btn`);
    
    statusEl.textContent = 'Processing...';
    statusEl.className = 'modal-status processing';
    runBtn.disabled = true;
    runBtn.textContent = 'Processing...';
    
    try {
      const result = await this.onRun(this.uploadedFiles);
      
      statusEl.textContent = 'Analysis complete!';
      statusEl.className = 'modal-status success';
      
      // Show output
      this.displayOutput(result);
      
      showToast('Analysis completed successfully', 'success');
      
    } catch (error) {
      console.error('Analysis error:', error);
      statusEl.textContent = `Error: ${error.message}`;
      statusEl.className = 'modal-status error';
      showToast('Analysis failed', 'error');
    } finally {
      runBtn.disabled = false;
      runBtn.textContent = 'Run Analysis';
    }
  }
  
  displayOutput(result) {
    const outputEl = document.getElementById(`${this.modalId}-output`);
    outputEl.style.display = 'block';
    
    // Render output based on tool type
    const outputComponent = new StructuredOutputPanel({
      data: result,
      toolType: this.toolType,
      claimId: this.getClaimId()
    });
    
    outputEl.innerHTML = '';
    const renderedOutput = outputComponent.render();
    outputEl.appendChild(renderedOutput);
    
    // For estimate comparison, render proof requirements
    if (this.toolType === 'estimate_comparison') {
      outputComponent.renderProofRequirements(renderedOutput, this.getClaimId());
    }
  }
}

// =====================================================
// STRUCTURED OUTPUT PANEL COMPONENT
// =====================================================

class StructuredOutputPanel {
  constructor(config) {
    this.data = config.data;
    this.toolType = config.toolType;
    this.claimId = config.claimId;
  }
  
  render() {
    const container = document.createElement('div');
    container.className = 'output-panel';
    
    switch (this.toolType) {
      case 'policy_analysis':
      case 'policy_analysis_v2':
        container.innerHTML = this.renderPolicyAnalysis();
        break;
      case 'estimate_comparison':
        container.innerHTML = this.renderEstimateComparison();
        break;
      case 'settlement_analysis':
        container.innerHTML = this.renderSettlementAnalysis();
        break;
      case 'release_analysis':
        container.innerHTML = this.renderReleaseAnalysis();
        break;
      default:
        container.innerHTML = this.renderGeneric();
    }
    
    return container;
  }
  
  renderPolicyAnalysis() {
    const data = this.data;
    const policyType = data.policy_type || 'OTHER';
    const formNumbers = data.form_numbers || [];
    const coverage = data.coverage || {};
    const endorsements = data.endorsements || {};
    const triggers = data.triggers || {};
    const recommendations = data.recommendations || [];
    const sublimits = data.sublimits || {};
    const coinsuranceValidation = data.coinsurance_validation || {};
    const metadata = data.metadata || {};
    
    const isCommercial = policyType === 'CP' || policyType === 'BOP';
    
    return `
      <div class="output-section">
        <h3 class="output-title">📋 Policy Intelligence - ${getPolicyTypeLabel(policyType)}</h3>
        
        ${formNumbers.length > 0 ? `
          <div class="output-subsection">
            <h4>Policy Forms Detected</h4>
            <div class="output-list">
              ${formNumbers.map(form => `<div class="output-item">${form}</div>`).join('')}
            </div>
          </div>
        ` : ''}
        
        <div class="output-subsection">
          <h4>Coverage Limits</h4>
          <div class="output-grid">
            ${isCommercial ? `
              <div class="output-card">
                <div class="output-label">Building</div>
                <div class="output-value">${coverage.building_limit ? formatCurrency(coverage.building_limit) : 'Not found'}</div>
              </div>
              <div class="output-card">
                <div class="output-label">Business Personal Property</div>
                <div class="output-value">${coverage.business_personal_property_limit ? formatCurrency(coverage.business_personal_property_limit) : 'Not found'}</div>
              </div>
              <div class="output-card">
                <div class="output-label">Loss of Income</div>
                <div class="output-value">${coverage.loss_of_income_limit ? formatCurrency(coverage.loss_of_income_limit) : 'Not found'}</div>
              </div>
              <div class="output-card">
                <div class="output-label">Extra Expense</div>
                <div class="output-value">${coverage.extra_expense_limit ? formatCurrency(coverage.extra_expense_limit) : 'Not found'}</div>
              </div>
            ` : `
              <div class="output-card">
                <div class="output-label">Coverage A (Dwelling)</div>
                <div class="output-value">${coverage.dwelling_limit ? formatCurrency(coverage.dwelling_limit) : 'Not found'}</div>
              </div>
              <div class="output-card">
                <div class="output-label">Coverage C (Contents)</div>
                <div class="output-value">${coverage.contents_limit ? formatCurrency(coverage.contents_limit) : 'Not found'}</div>
              </div>
              <div class="output-card">
                <div class="output-label">Coverage D (ALE)</div>
                <div class="output-value">${coverage.ale_limit ? formatCurrency(coverage.ale_limit) : 'Not found'}</div>
              </div>
            `}
            <div class="output-card">
              <div class="output-label">Deductible</div>
              <div class="output-value">${coverage.deductible ? formatCurrency(coverage.deductible) : 'Not found'}</div>
            </div>
            ${coverage.wind_hail_deductible || coverage.wind_hail_deductible_percent ? `
              <div class="output-card">
                <div class="output-label">Wind/Hail Deductible</div>
                <div class="output-value">${coverage.wind_hail_deductible ? formatCurrency(coverage.wind_hail_deductible) : coverage.wind_hail_deductible_percent + '%'}</div>
              </div>
            ` : ''}
          </div>
        </div>
        
        <div class="output-subsection">
          <h4>Settlement Type & Special Provisions</h4>
          <div class="output-grid">
            <div class="output-card">
              <div class="output-label">Settlement Type</div>
              <div class="output-value">${coverage.settlement_type || 'Not detected'}</div>
            </div>
            ${coverage.coinsurance_percent ? `
              <div class="output-card">
                <div class="output-label">Coinsurance</div>
                <div class="output-value">${coverage.coinsurance_percent}%${coverage.agreed_value ? ' (Waived by Agreed Value)' : ''}</div>
              </div>
            ` : ''}
            ${coverage.blanket_limit ? `
              <div class="output-card">
                <div class="output-label">Blanket Coverage</div>
                <div class="output-value">${formatCurrency(coverage.blanket_limit)}</div>
              </div>
            ` : ''}
          </div>
        </div>
        
        ${coverage.ordinance_law_percent ? `
          <div class="output-subsection">
            <h4>Ordinance & Law</h4>
            <div class="output-card">
              <div class="output-value">${coverage.ordinance_law_percent}% coverage available</div>
            </div>
          </div>
        ` : ''}
        
        ${coinsuranceValidation && coinsuranceValidation.coinsurance_penalty_risk ? `
          <div class="output-subsection">
            <h4>⚠ Coinsurance Penalty Risk</h4>
            <div class="output-alert alert-critical">
              <p><strong>Building limit is below coinsurance requirement</strong></p>
              <div class="output-grid">
                <div class="output-card">
                  <div class="output-label">Required Limit</div>
                  <div class="output-value">${formatCurrency(coinsuranceValidation.required_limit)}</div>
                </div>
                <div class="output-card">
                  <div class="output-label">Shortfall</div>
                  <div class="output-value">${formatCurrency(coinsuranceValidation.shortfall)}</div>
                </div>
                <div class="output-card">
                  <div class="output-label">Penalty %</div>
                  <div class="output-value">${coinsuranceValidation.penalty_percentage.toFixed(1)}%</div>
                </div>
              </div>
              <p>Claim payment will be reduced to ${coinsuranceValidation.penalty_percentage.toFixed(1)}% of loss amount.</p>
            </div>
          </div>
        ` : ''}
        
        <div class="output-subsection">
          <h4>Detected Endorsements</h4>
          <div class="output-list">
            ${endorsements.matching ? '<div class="output-item">✓ Matching endorsement</div>' : ''}
            ${endorsements.replacement_cost ? '<div class="output-item">✓ Replacement cost endorsement</div>' : ''}
            ${endorsements.roof_acv ? '<div class="output-item">⚠ Roof ACV endorsement</div>' : ''}
            ${endorsements.cosmetic_exclusion ? '<div class="output-item">⚠ Cosmetic exclusion</div>' : ''}
            ${!endorsements.matching && !endorsements.replacement_cost && !endorsements.roof_acv && !endorsements.cosmetic_exclusion ? '<div class="output-item">No special endorsements detected</div>' : ''}
          </div>
        </div>
        
        ${Object.keys(sublimits).some(k => sublimits[k]) ? `
          <div class="output-subsection">
            <h4>Sublimits</h4>
            <div class="output-grid">
              ${sublimits.water ? `<div class="output-card"><div class="output-label">Water damage</div><div class="output-value">${formatCurrency(sublimits.water)}</div></div>` : ''}
              ${sublimits.mold ? `<div class="output-card"><div class="output-label">Mold</div><div class="output-value">${formatCurrency(sublimits.mold)}</div></div>` : ''}
              ${sublimits.sewer_backup ? `<div class="output-card"><div class="output-label">Sewer backup</div><div class="output-value">${formatCurrency(sublimits.sewer_backup)}</div></div>` : ''}
            </div>
          </div>
        ` : ''}
        
        ${Object.keys(triggers).some(k => triggers[k] === true) ? `
          <div class="output-subsection">
            <h4>Coverage Triggers</h4>
            <div class="output-list">
              ${triggers.ordinance_trigger ? `<div class="output-item alert-success">✓ Ordinance coverage applies to code upgrades</div>` : ''}
              ${triggers.matching_trigger ? `<div class="output-item alert-success">✓ Matching endorsement applies</div>` : ''}
              ${triggers.depreciation_trigger ? `<div class="output-item alert-warning">⚠ Depreciation issue detected</div>` : ''}
              ${triggers.sublimit_trigger ? `<div class="output-item alert-warning">⚠ ${triggers.sublimit_trigger_type} sublimit may cap recovery</div>` : ''}
              ${triggers.coinsurance_penalty_trigger ? `<div class="output-item alert-critical">⚠ Coinsurance penalty risk present</div>` : ''}
              ${triggers.percentage_deductible_trigger ? `<div class="output-item alert-warning">⚠ Percentage deductible applies (${triggers.percentage_deductible_amount ? formatCurrency(triggers.percentage_deductible_amount) : 'amount TBD'})</div>` : ''}
              ${triggers.vacancy_trigger ? `<div class="output-item alert-critical">⚠ Vacancy clause may void coverage</div>` : ''}
              ${triggers.functional_replacement_trigger ? `<div class="output-item alert-warning">⚠ Functional replacement cost applies</div>` : ''}
              ${triggers.blanket_coverage_trigger ? `<div class="output-item alert-info">ℹ Blanket coverage applies</div>` : ''}
            </div>
          </div>
        ` : ''}
        
        ${recommendations.length > 0 ? `
          <div class="output-subsection">
            <h4>Recommendations</h4>
            <div class="output-list">
              ${recommendations.map(rec => `
                <div class="output-item priority-${rec.priority}">
                  <strong>${rec.title}</strong>
                  <p>${rec.action}</p>
                  ${rec.estimated_recovery ? `<p>Estimated Recovery: ${formatCurrency(rec.estimated_recovery)}</p>` : ''}
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
        
        <div class="output-metadata">
          <small>Parsed by: ${metadata.parsed_by || 'regex'} | Processing time: ${metadata.processing_time_ms || 0}ms | Engine v${metadata.engine_version || '2.0'}</small>
        </div>
      </div>
    `;
  }
  
  renderEstimateComparison() {
    // NEW: Financial Exposure Engine output + Enforcement Layers
    const exposure = this.data.exposure || {};
    const enforcement = this.data.enforcement || {};
    const comparison = this.data.comparison || {};
    const categoryBreakdown = exposure.categoryBreakdown || [];
    const opExposure = exposure.opExposure || {};
    const structuredDeltas = exposure.structuredLineItemDeltas || [];
    
    // Enforcement layer data
    const codeUpgrades = enforcement.codeUpgrades || {};
    const coverageCrosswalk = enforcement.coverageCrosswalk || {};
    const carrierPatterns = enforcement.carrierPatterns || {};
    const totalWithEnforcement = enforcement.totalProjectedRecoveryWithEnforcement || exposure.totalProjectedRecovery || 0;
    
    // Fallback to legacy format if no exposure data
    if (!exposure.totalProjectedRecovery && comparison.contractor_total) {
      return this.renderLegacyEstimateComparison();
    }
    
    return `
      <div class="output-section">
        <h3 class="output-title">💰 Financial Enforcement Analysis</h3>
        
        <!-- PRIMARY: TOTAL PROJECTED RECOVERY (WITH ENFORCEMENT) -->
        <div class="output-hero-metric">
          <div class="hero-label">Estimated Underpayment</div>
          <div class="hero-value">${formatCurrency(totalWithEnforcement)}</div>
          <div class="hero-subtitle">Action Required to Recover This Amount</div>
        </div>
        
        <!-- ENFORCEMENT BREAKDOWN -->
        ${(codeUpgrades.totalCodeUpgradeExposure > 0 || coverageCrosswalk.coverageExposureAdjustments !== 0) ? `
          <div class="output-subsection">
            <h4>Enforcement Layer Breakdown</h4>
            <div class="output-grid">
              <div class="output-card">
                <div class="output-label">Base Exposure</div>
                <div class="output-value">${formatCurrency(exposure.totalProjectedRecovery || 0)}</div>
                <div class="output-sublabel">RCV Delta + O&P</div>
              </div>
              ${codeUpgrades.totalCodeUpgradeExposure > 0 ? `
                <div class="output-card highlight-warning">
                  <div class="output-label">Code Upgrades</div>
                  <div class="output-value">${formatCurrency(codeUpgrades.totalCodeUpgradeExposure)}</div>
                  <div class="output-sublabel">${codeUpgrades.flagCount} requirement(s)</div>
                </div>
              ` : ''}
              ${coverageCrosswalk.coverageExposureAdjustments !== 0 ? `
                <div class="output-card ${coverageCrosswalk.coverageExposureAdjustments > 0 ? 'highlight-success' : 'highlight-danger'}">
                  <div class="output-label">Coverage Adjustments</div>
                  <div class="output-value">${formatCurrency(coverageCrosswalk.coverageExposureAdjustments)}</div>
                  <div class="output-sublabel">${coverageCrosswalk.conflictCount} conflict(s)</div>
                </div>
              ` : ''}
            </div>
          </div>
        ` : ''}
        
        <!-- FINANCIAL BREAKDOWN -->
        <div class="output-subsection">
          <h4>Financial Breakdown</h4>
          <div class="output-grid">
            <div class="output-card">
              <div class="output-label">RCV Delta</div>
              <div class="output-value">${formatCurrency(exposure.rcvDeltaTotal || 0)}</div>
              <div class="output-sublabel">Replacement Cost Value</div>
            </div>
            <div class="output-card">
              <div class="output-label">ACV Delta</div>
              <div class="output-value">${formatCurrency(exposure.acvDeltaTotal || 0)}</div>
              <div class="output-sublabel">Actual Cash Value</div>
            </div>
            <div class="output-card">
              <div class="output-label">Recoverable Depreciation</div>
              <div class="output-value">${formatCurrency(exposure.recoverableDepreciationTotal || 0)}</div>
              <div class="output-sublabel">RCV - ACV</div>
            </div>
            <div class="output-card ${opExposure.qualifiesForOP ? 'highlight-success' : ''}">
              <div class="output-label">O&P Exposure</div>
              <div class="output-value">${formatCurrency(opExposure.opAmount || 0)}</div>
              <div class="output-sublabel">${opExposure.qualifiesForOP ? '✓ Qualifies' : 'Not Applicable'}</div>
            </div>
          </div>
        </div>
        
        <!-- O&P ANALYSIS -->
        ${opExposure.qualifiesForOP ? `
          <div class="output-subsection">
            <h4>🔹 Overhead & Profit Qualification</h4>
            <div class="output-alert alert-success">
              <p><strong>${opExposure.tradeCount} distinct trades detected</strong></p>
              <p>${opExposure.reason}</p>
              ${opExposure.tradesDetected && opExposure.tradesDetected.length > 0 ? `
                <div class="output-list">
                  <strong>Trades:</strong> ${opExposure.tradesDetected.join(', ')}
                </div>
              ` : ''}
              ${opExposure.opAmount > 0 ? `
                <p><strong>Estimated O&P Exposure: ${formatCurrency(opExposure.opAmount)}</strong></p>
              ` : ''}
            </div>
          </div>
        ` : ''}
        
        <!-- CATEGORY BREAKDOWN -->
        ${categoryBreakdown.length > 0 ? `
          <div class="output-subsection">
            <h4>Category-Level Exposure</h4>
            <table class="output-table sortable">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>RCV Delta</th>
                  <th>ACV Delta</th>
                  <th>Depreciation</th>
                  <th>% Underpaid</th>
                  <th>Discrepancies</th>
                </tr>
              </thead>
              <tbody>
                ${categoryBreakdown.map(cat => `
                  <tr>
                    <td><strong>${cat.category}</strong></td>
                    <td class="${cat.rcvDelta > 0 ? 'negative' : ''}">${formatCurrency(cat.rcvDelta)}</td>
                    <td class="${cat.acvDelta > 0 ? 'negative' : ''}">${formatCurrency(cat.acvDelta)}</td>
                    <td>${formatCurrency(cat.depreciationDelta)}</td>
                    <td>${cat.percentUnderpaid.toFixed(1)}%</td>
                    <td>${cat.discrepancyCount}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}
        
        <!-- DEPRECIATION SUMMARY -->
        ${exposure.recoverableDepreciationTotal > 0 ? `
          <div class="output-subsection">
            <h4>Depreciation Recovery</h4>
            <div class="output-alert alert-info">
              <p><strong>${formatCurrency(exposure.recoverableDepreciationTotal)} in depreciation is recoverable</strong></p>
              <p>This amount can be recovered upon completion of repairs (RCV policy). <strong>Depreciation extracted from actual estimate values</strong> (not simulated).</p>
            </div>
          </div>
        ` : `
          <div class="output-subsection">
            <h4>Depreciation Status</h4>
            <div class="output-alert alert-info">
              <p><strong>No depreciation detected in estimates.</strong></p>
              <p>Estimates may not include separate RCV/ACV values, or both estimates use RCV pricing.</p>
            </div>
          </div>
        `}
        
        <!-- CODE UPGRADE REQUIREMENTS -->
        ${codeUpgrades.flagCount > 0 ? `
          <div class="output-subsection">
            <h4>🏗️ Code Compliance Requirements</h4>
            <div class="output-alert alert-warning">
              <p><strong>${codeUpgrades.flagCount} code upgrade requirement(s) detected</strong></p>
              <p>Total Code Upgrade Exposure: <strong>${formatCurrency(codeUpgrades.totalCodeUpgradeExposure)}</strong></p>
            </div>
            <table class="output-table">
              <thead>
                <tr>
                  <th>Issue</th>
                  <th>Priority</th>
                  <th>Explanation</th>
                  <th>Estimated Cost</th>
                </tr>
              </thead>
              <tbody>
                ${codeUpgrades.codeUpgradeFlags.map(flag => `
                  <tr>
                    <td><strong>${flag.issue}</strong></td>
                    <td><span class="badge badge-${flag.priority}">${flag.priority}</span></td>
                    <td>${flag.explanation}</td>
                    <td>${formatCurrency(flag.estimatedCostImpact)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}
        
        <!-- COVERAGE CONFLICTS -->
        ${coverageCrosswalk.conflictCount > 0 ? `
          <div class="output-subsection">
            <h4>📋 Policy Coverage Analysis</h4>
            <div class="output-alert ${coverageCrosswalk.coverageExposureAdjustments >= 0 ? 'alert-info' : 'alert-danger'}">
              <p><strong>${coverageCrosswalk.conflictCount} coverage conflict(s) detected</strong></p>
              ${coverageCrosswalk.coverageExposureAdjustments !== 0 ? `
                <p>Coverage Adjustment: <strong>${formatCurrency(coverageCrosswalk.coverageExposureAdjustments)}</strong></p>
              ` : ''}
            </div>
            <table class="output-table">
              <thead>
                <tr>
                  <th>Issue</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Explanation</th>
                </tr>
              </thead>
              <tbody>
                ${coverageCrosswalk.coverageConflicts.map(conflict => `
                  <tr>
                    <td><strong>${conflict.issue}</strong></td>
                    <td>${conflict.category}</td>
                    <td><span class="badge badge-${conflict.priority}">${conflict.priority}</span></td>
                    <td>${conflict.explanation}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}
        
        <!-- CARRIER PATTERN DETECTION -->
        ${carrierPatterns.patternCount > 0 ? `
          <div class="output-subsection">
            <h4>🔍 Carrier Behavior Patterns</h4>
            <div class="output-alert alert-${carrierPatterns.riskLevel === 'critical' ? 'danger' : carrierPatterns.riskLevel === 'high' ? 'warning' : 'info'}">
              <p><strong>${carrierPatterns.patternCount} systemic pattern(s) detected</strong></p>
              <p>Risk Level: <span class="badge badge-${carrierPatterns.riskLevel}">${carrierPatterns.riskLevel.toUpperCase()}</span> | Severity Score: ${carrierPatterns.severityScore}</p>
              <p><small>Pattern detection is informational and provides negotiation leverage. Does not affect financial calculations.</small></p>
            </div>
            <table class="output-table">
              <thead>
                <tr>
                  <th>Pattern</th>
                  <th>Category</th>
                  <th>Confidence</th>
                  <th>Explanation</th>
                </tr>
              </thead>
              <tbody>
                ${carrierPatterns.patternFlags.map(pattern => `
                  <tr>
                    <td><strong>${pattern.pattern}</strong></td>
                    <td>${pattern.category}</td>
                    <td><span class="badge badge-${pattern.confidence}">${pattern.confidence}</span></td>
                    <td>${pattern.explanation}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}
        
        <!-- LINE ITEM RECONCILIATION TABLE -->
        ${structuredDeltas.length > 0 ? `
          <div class="output-subsection">
            <h4>Line Item Reconciliation (${structuredDeltas.length} items)</h4>
            <div class="output-table-container">
              <table class="output-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Type</th>
                    <th>Carrier Qty</th>
                    <th>Contractor Qty</th>
                    <th>Carrier $</th>
                    <th>Contractor $</th>
                    <th>RCV Delta</th>
                  </tr>
                </thead>
                <tbody>
                  ${structuredDeltas.slice(0, 50).map(item => `
                    <tr>
                      <td>${item.description}</td>
                      <td>${item.category}</td>
                      <td><span class="badge badge-${item.discrepancyType}">${item.discrepancyType.replace(/_/g, ' ')}</span></td>
                      <td>${item.carrierQty}</td>
                      <td>${item.contractorQty}</td>
                      <td>${formatCurrency(item.carrierTotal)}</td>
                      <td>${formatCurrency(item.contractorTotal)}</td>
                      <td class="${item.rcvDelta > 0 ? 'negative' : 'positive'}">${formatCurrency(item.rcvDelta)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              ${structuredDeltas.length > 50 ? `
                <p class="output-note">Showing first 50 of ${structuredDeltas.length} line items. Download full report for complete details.</p>
              ` : ''}
            </div>
          </div>
        ` : ''}
        
        <!-- LEGACY COMPARISON DATA (for reference) -->
        <div class="output-subsection">
          <h4>Estimate Totals</h4>
          <div class="output-grid">
            <div class="output-card">
              <div class="output-label">Contractor Total</div>
              <div class="output-value">${formatCurrency(comparison.contractor_total || 0)}</div>
            </div>
            <div class="output-card">
              <div class="output-label">Carrier Total</div>
              <div class="output-value">${formatCurrency(comparison.carrier_total || 0)}</div>
            </div>
            <div class="output-card">
              <div class="output-label">Net Difference</div>
              <div class="output-value">${formatCurrency(comparison.net_difference || 0)}</div>
            </div>
          </div>
        </div>
        
        <!-- WHAT YOU MUST PROVE SECTION -->
        <div id="proof-requirements-section"></div>
        
        <!-- ACTIONS -->
        <div class="output-actions">
          <button class="btn btn-primary" onclick="generateStructuredSupplementPacket()">
            📄 Generate Structured Supplement Packet
          </button>
          <button class="btn btn-secondary" onclick="generateSupplement()">
            Generate Supplement Letter
          </button>
          <button class="btn btn-secondary" onclick="downloadReconciliationReport()">
            Download Full Report
          </button>
        </div>
        
        <div class="output-metadata">
          <small>Financial Enforcement Engine v3.0 | Deterministic Calculation | ${structuredDeltas.length} line items analyzed | ${codeUpgrades.flagCount || 0} code flags | ${coverageCrosswalk.conflictCount || 0} coverage conflicts | ${carrierPatterns.patternCount || 0} carrier patterns</small>
        </div>
      </div>
    `;
  }
  
  async renderProofRequirements(container, claimId) {
    // Load evidence gaps
    const { data: gaps } = await supabaseClient
      .from('claim_evidence_gaps')
      .select('*')
      .eq('claim_id', claimId)
      .eq('resolved', false)
      .order('severity', { ascending: false });
    
    if (!gaps || gaps.length === 0) return;
    
    // Load high-value discrepancies
    const { data: discrepancies } = await supabaseClient
      .from('claim_estimate_discrepancies')
      .select('*')
      .eq('claim_id', claimId)
      .in('delta_type', ['missing_item', 'pricing_difference'])
      .gte('difference_amount', 1000)
      .order('difference_amount', { ascending: false })
      .limit(10);
    
    // Load policy triggers
    const { data: triggers } = await supabaseClient
      .from('claim_policy_triggers')
      .select('*')
      .eq('claim_id', claimId)
      .single();
    
    const proofSection = container.querySelector('#proof-requirements-section');
    if (!proofSection) return;
    
    let html = `
      <div class="evidence-gap-section">
        <h4 class="evidence-gap-title">What You Must Prove</h4>
    `;
    
    // Group discrepancies by type
    const disputedItems = discrepancies || [];
    
    for (const item of disputedItems.slice(0, 5)) {
      html += `
        <div class="proof-requirement-card">
          <div class="proof-requirement-header">
            To recover ${formatCurrency(item.difference_amount)} for ${item.description}:
          </div>
          <ul class="proof-requirement-list">
            <li>Damage documentation</li>
            <li>Causation explanation</li>
            <li>Pricing support</li>
            ${item.category && item.category.includes('Code') ? '<li>Code citation</li>' : ''}
            ${item.delta_type === 'missing_item' ? '<li>Contractor narrative explaining omission</li>' : ''}
          </ul>
        </div>
      `;
    }
    
    // Add code trigger requirements
    if (triggers) {
      if (triggers.ordinance_trigger) {
        html += `
          <div class="proof-requirement-card">
            <div class="proof-requirement-header">
              Ordinance coverage available${triggers.ordinance_trigger_amount ? ` (${formatCurrency(triggers.ordinance_trigger_amount)})` : ''}:
            </div>
            <ul class="proof-requirement-list">
              <li>Building department citation</li>
              <li>Contractor code reference</li>
              <li>Documentation of code requirement</li>
            </ul>
          </div>
        `;
      }
      
      if (triggers.matching_trigger) {
        html += `
          <div class="proof-requirement-card">
            <div class="proof-requirement-header">
              Matching endorsement applies:
            </div>
            <ul class="proof-requirement-list">
              <li>Photo evidence of material mismatch</li>
              <li>Contractor statement</li>
            </ul>
          </div>
        `;
      }
    }
    
    html += `
      </div>
    `;
    
    proofSection.innerHTML = html;
  }
  
  renderLegacyEstimateComparison() {
    const comparison = this.data.comparison || this.data;
    
    return `
      <div class="output-section">
        <h3 class="output-title">Estimate Comparison Results</h3>
        
        <div class="output-financial-highlight">
          <div class="financial-row">
            <span class="financial-label">Contractor Total:</span>
            <span class="financial-value">${formatCurrency(comparison.contractor_total)}</span>
          </div>
          <div class="financial-row">
            <span class="financial-label">Carrier Total:</span>
            <span class="financial-value">${formatCurrency(comparison.carrier_total)}</span>
          </div>
          <div class="financial-row highlight">
            <span class="financial-label">Estimated Underpayment:</span>
            <span class="financial-value underpayment">${formatCurrency(comparison.underpayment_estimate)}</span>
          </div>
        </div>
        
        <div class="output-actions">
          <button class="btn btn-primary" onclick="generateSupplement()">
            Generate Supplement Letter
          </button>
          <button class="btn btn-secondary" onclick="downloadComparison()">
            Download Full Report
          </button>
        </div>
      </div>
    `;
  }
  
  renderSettlementAnalysis() {
    const analysis = this.data.analysis || this.data;
    const breakdown = analysis.settlement_breakdown || {};
    
    return `
      <div class="output-section">
        <h3 class="output-title">Settlement Analysis</h3>
        
        <div class="output-financial-highlight">
          <div class="financial-row">
            <span class="financial-label">RCV Total:</span>
            <span class="financial-value">${formatCurrency(breakdown.rcv_total)}</span>
          </div>
          <div class="financial-row">
            <span class="financial-label">ACV Paid:</span>
            <span class="financial-value">${formatCurrency(breakdown.acv_paid)}</span>
          </div>
          <div class="financial-row highlight">
            <span class="financial-label">Depreciation Withheld:</span>
            <span class="financial-value depreciation">${formatCurrency(breakdown.depreciation_withheld)}</span>
          </div>
          <div class="financial-row">
            <span class="financial-label">Deductible Applied:</span>
            <span class="financial-value">${formatCurrency(breakdown.deductible_applied)}</span>
          </div>
        </div>
        
        ${analysis.red_flags && analysis.red_flags.length > 0 ? `
          <div class="output-alert alert-danger">
            <h4>🚩 Red Flags</h4>
            <ul>
              ${analysis.red_flags.map(flag => `<li>${flag}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
        
        ${analysis.recovery_opportunities && analysis.recovery_opportunities.length > 0 ? `
          <div class="output-alert alert-success">
            <h4>💰 Recovery Opportunities</h4>
            <ul>
              ${analysis.recovery_opportunities.map(opp => `
                <li>
                  <strong>${opp.description}</strong> - ${formatCurrency(opp.estimated_value)}
                  <br><small>${opp.action_required}</small>
                </li>
              `).join('')}
            </ul>
          </div>
        ` : ''}
        
        <button class="btn btn-primary" onclick="downloadSettlementAnalysis()">
          Download Full Analysis
        </button>
      </div>
    `;
  }
  
  renderReleaseAnalysis() {
    const analysis = this.data.analysis || this.data;
    const risk = analysis.risk_summary || {};
    
    return `
      <div class="output-section">
        <h3 class="output-title">Release Document Analysis</h3>
        
        <div class="output-alert alert-${risk.overall_risk === 'critical' || risk.overall_risk === 'high' ? 'danger' : 'warning'}">
          <h4>Overall Risk: ${risk.overall_risk?.toUpperCase() || 'UNKNOWN'}</h4>
          <p><strong>Safe to Sign:</strong> ${risk.safe_to_sign ? '✓ Yes' : '✗ No'}</p>
        </div>
        
        ${analysis.flagged_clauses && analysis.flagged_clauses.length > 0 ? `
          <div class="output-table-section">
            <h4>Flagged Clauses</h4>
            ${analysis.flagged_clauses.map(clause => `
              <div class="clause-card risk-${clause.risk_level}">
                <div class="clause-risk">${clause.risk_level.toUpperCase()}</div>
                <div class="clause-issue"><strong>Issue:</strong> ${clause.issue}</div>
                <div class="clause-text"><em>"${clause.clause_text}"</em></div>
                <div class="clause-recommendation"><strong>Recommendation:</strong> ${clause.recommendation}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}
        
        ${risk.recommended_modifications && risk.recommended_modifications.length > 0 ? `
          <div class="output-alert alert-info">
            <h4>Recommended Modifications</h4>
            <ul>
              ${risk.recommended_modifications.map(mod => `<li>${mod}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
        
        <button class="btn btn-primary" onclick="downloadReleaseAnalysis()">
          Download Full Analysis
        </button>
      </div>
    `;
  }
  
  renderGeneric() {
    return `
      <div class="output-section">
        <h3 class="output-title">Analysis Results</h3>
        <pre class="output-json">${JSON.stringify(this.data, null, 2)}</pre>
      </div>
    `;
  }
}

// =====================================================
// FINANCIAL SUMMARY COMPONENT
// =====================================================

class FinancialSummaryPanel {
  constructor(claimId) {
    this.claimId = claimId;
    this.data = null;
    this.evidenceGaps = [];
    this.policyTriggers = null;
  }
  
  async load() {
    try {
      const { data, error } = await supabaseClient
        .from('claim_financial_summary')
        .select('*')
        .eq('claim_id', this.claimId)
        .single();
      
      if (error) throw error;
      this.data = data;
      
      // Load evidence gaps
      await this.loadEvidenceGaps();
      
      // Load policy triggers
      await this.loadPolicyTriggers();
      
      return data;
    } catch (error) {
      console.error('Failed to load financial summary:', error);
      return null;
    }
  }
  
  async loadEvidenceGaps() {
    try {
      const { data, error } = await supabaseClient
        .from('claim_evidence_gaps')
        .select('*')
        .eq('claim_id', this.claimId)
        .eq('resolved', false)
        .in('severity', ['high', 'critical'])
        .order('severity', { ascending: false })
        .order('delta_amount', { ascending: false });
      
      if (!error && data) {
        this.evidenceGaps = data;
      }
    } catch (error) {
      console.error('Failed to load evidence gaps:', error);
    }
  }
  
  async loadPolicyTriggers() {
    try {
      const { data, error } = await supabaseClient
        .from('claim_policy_triggers')
        .select('*')
        .eq('claim_id', this.claimId)
        .single();
      
      if (!error && data) {
        this.policyTriggers = data;
      }
    } catch (error) {
      console.error('Failed to load policy triggers:', error);
    }
  }
  
  async getRequiredActions() {
    const actions = [];
    
    // Add evidence gaps
    for (const gap of this.evidenceGaps) {
      actions.push({
        type: 'evidence_gap',
        severity: gap.severity,
        description: gap.description,
        delta_amount: gap.delta_amount,
        gap_id: gap.id
      });
    }
    
    // Add code trigger actions
    if (this.policyTriggers) {
      if (this.policyTriggers.ordinance_trigger) {
        const hasCodeDoc = this.evidenceGaps.some(g => 
          g.gap_type === 'code_citation_missing' || 
          g.gap_type === 'code_documentation_missing'
        );
        if (hasCodeDoc) {
          actions.push({
            type: 'code_trigger',
            severity: 'critical',
            description: 'Building code citation required for ordinance coverage',
            delta_amount: this.policyTriggers.ordinance_trigger_amount
          });
        }
      }
    }
    
    // Add high-value delta actions
    const { data: highValueDeltas } = await supabaseClient
      .from('claim_estimate_discrepancies')
      .select('description, difference_amount, delta_type')
      .eq('claim_id', this.claimId)
      .gte('difference_amount', 2500)
      .order('difference_amount', { ascending: false })
      .limit(5);
    
    if (highValueDeltas) {
      for (const delta of highValueDeltas) {
        if (delta.delta_type === 'missing_item') {
          actions.push({
            type: 'high_value_delta',
            severity: 'high',
            description: `Documentation required for ${delta.description}`,
            delta_amount: delta.difference_amount
          });
        }
      }
    }
    
    return actions;
  }
  
  render() {
    if (!this.data) {
      return this.renderEmpty();
    }
    
    const container = document.createElement('div');
    container.className = 'financial-summary-panel';
    container.innerHTML = `
      <div class="financial-summary-header">
        <h3>Claim Financial Snapshot</h3>
      </div>
      
      <div class="financial-summary-grid">
        <div class="financial-card highlight">
          <div class="financial-card-label">Estimated Underpayment</div>
          <div class="financial-card-value underpayment">
            ${formatCurrency(this.data.underpayment_estimate)}
          </div>
        </div>
        
        <div class="financial-card">
          <div class="financial-card-label">Depreciation Withheld</div>
          <div class="financial-card-value">
            ${formatCurrency(this.data.depreciation_withheld)}
          </div>
        </div>
        
        <div class="financial-card">
          <div class="financial-card-label">ALE Claimed</div>
          <div class="financial-card-value">
            ${formatCurrency(this.data.ale_total)}
          </div>
        </div>
        
        <div class="financial-card">
          <div class="financial-card-label">Contents Total</div>
          <div class="financial-card-value">
            ${formatCurrency(this.data.contents_total)}
          </div>
        </div>
      </div>
      
      <div id="required-actions-section-${this.claimId}"></div>
      
      <div class="financial-summary-details">
        <div class="detail-row">
          <span>Contractor Total:</span>
          <span>${formatCurrency(this.data.contractor_total)}</span>
        </div>
        <div class="detail-row">
          <span>Carrier Total:</span>
          <span>${formatCurrency(this.data.carrier_total)}</span>
        </div>
        <div class="detail-row">
          <span>Total Paid to Date:</span>
          <span>${formatCurrency(this.data.total_paid_to_date)}</span>
        </div>
        <div class="detail-row highlight">
          <span>Outstanding Balance:</span>
          <span>${formatCurrency(this.data.outstanding_balance)}</span>
        </div>
      </div>
    `;
    
    // Render required actions if underpayment exists
    if (this.data.underpayment_estimate > 0) {
      this.renderRequiredActions(container);
    }
    
    return container;
  }
  
  async renderRequiredActions(container) {
    const actions = await this.getRequiredActions();
    
    if (actions.length === 0) return;
    
    const actionsSection = container.querySelector(`#required-actions-section-${this.claimId}`);
    
    let actionsHTML = `
      <div class="required-actions-section">
        <h4 class="required-actions-title">Next Required Action</h4>
        <ul class="required-actions-list">
    `;
    
    for (const action of actions) {
      const highlightClass = action.severity === 'critical' ? 'critical' : 
                            action.severity === 'high' ? 'high' : 'medium';
      
      actionsHTML += `
        <li class="required-action-item ${highlightClass}">
          <span class="action-icon">${action.severity === 'critical' ? '🔴' : '🟡'}</span>
          <span class="action-description">${action.description}</span>
          ${action.delta_amount ? `<span class="action-amount">${formatCurrency(action.delta_amount)}</span>` : ''}
        </li>
      `;
    }
    
    actionsHTML += `
        </ul>
      </div>
    `;
    
    actionsSection.innerHTML = actionsHTML;
  }
  
  renderEmpty() {
    const container = document.createElement('div');
    container.className = 'financial-summary-panel empty';
    container.innerHTML = `
      <div class="financial-summary-empty">
        <p>No financial data available yet.</p>
        <p>Complete estimate analysis to see your financial snapshot.</p>
      </div>
    `;
    return container;
  }
}

// =====================================================
// GLOBAL FUNCTIONS (called from HTML)
// =====================================================

function closeStepToolModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('show');
    document.body.style.overflow = '';
  }
}

function runStepTool(modalId) {
  // Find the modal instance and run it
  // This would need to be tracked globally or via data attributes
  console.log('Running tool for modal:', modalId);
}

// =====================================================
// EXPORT FOR USE
// =====================================================

window.ClaimCommandCenter = {
  StepToolModal,
  StructuredOutputPanel,
  FinancialSummaryPanel,
  getCurrentUser,
  getAuthToken,
  formatCurrency,
  formatDate,
  showToast
};

// Helper function for policy type labels
function getPolicyTypeLabel(policyType) {
  const labels = {
    'HO': 'Homeowners Policy',
    'DP': 'Dwelling Property Policy',
    'CP': 'Commercial Property Policy',
    'BOP': 'Businessowners Policy',
    'OTHER': 'Policy Analysis'
  };
  return labels[policyType] || 'Policy Analysis';
}
