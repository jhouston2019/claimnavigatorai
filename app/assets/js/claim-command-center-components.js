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
      toolType: this.toolType
    });
    
    outputEl.innerHTML = '';
    outputEl.appendChild(outputComponent.render());
  }
}

// =====================================================
// STRUCTURED OUTPUT PANEL COMPONENT
// =====================================================

class StructuredOutputPanel {
  constructor(config) {
    this.data = config.data;
    this.toolType = config.toolType;
  }
  
  render() {
    const container = document.createElement('div');
    container.className = 'output-panel';
    
    switch (this.toolType) {
      case 'policy_analysis':
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
    const analysis = this.data.analysis || this.data;
    
    return `
      <div class="output-section">
        <h3 class="output-title">Policy Coverage Summary</h3>
        
        <div class="output-grid">
          <div class="output-card">
            <div class="output-label">Dwelling Limit</div>
            <div class="output-value">${formatCurrency(analysis.coverage_limits?.dwelling)}</div>
          </div>
          
          <div class="output-card">
            <div class="output-label">Contents Limit</div>
            <div class="output-value">${formatCurrency(analysis.coverage_limits?.contents)}</div>
          </div>
          
          <div class="output-card">
            <div class="output-label">ALE Limit</div>
            <div class="output-value">${formatCurrency(analysis.ale_limit?.amount)}</div>
          </div>
          
          <div class="output-card">
            <div class="output-label">Deductible</div>
            <div class="output-value">${formatCurrency(analysis.deductible?.amount)}</div>
          </div>
          
          <div class="output-card">
            <div class="output-label">Settlement Type</div>
            <div class="output-value">${analysis.settlement_type || 'N/A'}</div>
          </div>
          
          <div class="output-card">
            <div class="output-label">Ordinance & Law</div>
            <div class="output-value">${analysis.ordinance_law?.included ? '✓ Included' : '✗ Not Included'}</div>
          </div>
        </div>
        
        ${analysis.risk_notes && analysis.risk_notes.length > 0 ? `
          <div class="output-alert">
            <h4>⚠️ Risk Notes</h4>
            <ul>
              ${analysis.risk_notes.map(note => `<li>${note}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
        
        <button class="btn btn-primary" onclick="downloadPolicyAnalysis()">
          Download Full Analysis
        </button>
      </div>
    `;
  }
  
  renderEstimateComparison() {
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
        
        ${comparison.missing_items && comparison.missing_items.length > 0 ? `
          <div class="output-table-section">
            <h4>Missing Items (${comparison.missing_items.length})</h4>
            <table class="output-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                ${comparison.missing_items.map(item => `
                  <tr>
                    <td>${item.description}</td>
                    <td>${item.category}</td>
                    <td>${formatCurrency(item.contractor_total)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}
        
        ${comparison.pricing_discrepancies && comparison.pricing_discrepancies.length > 0 ? `
          <div class="output-table-section">
            <h4>Pricing Discrepancies (${comparison.pricing_discrepancies.length})</h4>
            <table class="output-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Contractor Price</th>
                  <th>Carrier Price</th>
                  <th>Difference</th>
                </tr>
              </thead>
              <tbody>
                ${comparison.pricing_discrepancies.map(item => `
                  <tr>
                    <td>${item.description}</td>
                    <td>${formatCurrency(item.contractor_unit_price)}</td>
                    <td>${formatCurrency(item.carrier_unit_price)}</td>
                    <td class="negative">${formatCurrency(item.amount_difference)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}
        
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
      return data;
    } catch (error) {
      console.error('Failed to load financial summary:', error);
      return null;
    }
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
          <div class="financial-card-label">Underpayment Identified</div>
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
    
    return container;
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
