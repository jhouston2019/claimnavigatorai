/**
 * Claim Command Center - Components & Utilities
 * External namespace for modal tools, financial summary, and auth utilities
 */

(function() {
  'use strict';

  // ============================================================================
  // Supabase Client Initialization
  // ============================================================================

  let supabaseClient = null;

  function initSupabase() {
    if (typeof supabase === 'undefined' || !supabase.createClient) {
      console.warn('Supabase SDK not loaded');
      return null;
    }

    if (!supabaseClient) {
      const supabaseUrl = 'https://your-project.supabase.co';
      const supabaseAnonKey = 'your-anon-key';
      supabaseClient = supabase.createClient(supabaseUrl, supabaseAnonKey);
    }

    return supabaseClient;
  }

  // ============================================================================
  // Auth Utilities
  // ============================================================================

  async function getAuthToken() {
    const client = initSupabase();
    if (!client) return null;

    try {
      const { data: { session } } = await client.auth.getSession();
      return session?.access_token || null;
    } catch (error) {
      console.error('Failed to get auth token:', error);
      return null;
    }
  }

  function getClaimId() {
    const urlParams = new URLSearchParams(window.location.search);
    const claimIdParam = urlParams.get('claim_id');
    
    if (claimIdParam) {
      return claimIdParam;
    }

    try {
      const stored = localStorage.getItem('ccc_current_claim_id');
      return stored || null;
    } catch (e) {
      return null;
    }
  }

  // ============================================================================
  // Toast Notification
  // ============================================================================

  function showToast(message, type = 'info') {
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(t => t.remove());

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        document.body.removeChild(toast);
      }
    }, 2500);
  }

  // ============================================================================
  // Step Tool Modal
  // ============================================================================

  class StepToolModal {
    constructor(config) {
      this.stepNumber = config.stepNumber;
      this.toolType = config.toolType;
      this.title = config.title;
      this.description = config.description || '';
      this.requiredDocuments = config.requiredDocuments || [];
      this.onRun = config.onRun;
      this.onClose = config.onClose;
      
      this.uploadedFiles = {};
      this.isRunning = false;
      this.element = null;
    }

    render() {
      const overlay = document.createElement('div');
      overlay.className = 'step-tool-modal-overlay';
      overlay.id = `modal-${this.toolType}`;

      const modal = document.createElement('div');
      modal.className = 'step-tool-modal';

      const header = this.renderHeader();
      const body = this.renderBody();
      const footer = this.renderFooter();

      modal.appendChild(header);
      modal.appendChild(body);
      modal.appendChild(footer);
      overlay.appendChild(modal);

      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.close();
        }
      });

      this.element = overlay;
      document.body.appendChild(overlay);
    }

    renderHeader() {
      const header = document.createElement('div');
      header.className = 'step-tool-modal-header';

      header.innerHTML = `
        <div class="step-tool-modal-header-text">
          <div class="step-tool-modal-step-label">Step ${this.stepNumber}</div>
          <div class="step-tool-modal-title">${this.title}</div>
          ${this.description ? `<div class="step-tool-modal-description">${this.description}</div>` : ''}
        </div>
        <button class="step-tool-modal-close" type="button">×</button>
      `;

      header.querySelector('.step-tool-modal-close').addEventListener('click', () => {
        this.close();
      });

      return header;
    }

    renderBody() {
      const body = document.createElement('div');
      body.className = 'step-tool-modal-body';

      if (this.requiredDocuments.length > 0) {
        const section = document.createElement('div');
        section.className = 'step-tool-modal-section';

        const label = document.createElement('div');
        label.className = 'step-tool-modal-section-label';
        label.textContent = 'Required Documents';
        section.appendChild(label);

        this.requiredDocuments.forEach(doc => {
          const uploadArea = this.renderUploadArea(doc);
          section.appendChild(uploadArea);
        });

        body.appendChild(section);
      }

      return body;
    }

    renderUploadArea(doc) {
      const container = document.createElement('div');
      container.style.marginBottom = '16px';

      const uploadArea = document.createElement('div');
      uploadArea.className = 'step-tool-upload-area';
      uploadArea.dataset.docKey = doc.key;

      uploadArea.innerHTML = `
        <div class="step-tool-upload-icon">📄</div>
        <div class="step-tool-upload-text">${doc.label}</div>
        <div class="step-tool-upload-hint">Click to upload or drag and drop</div>
        <input type="file" accept=".pdf" style="display: none;">
      `;

      const fileInput = uploadArea.querySelector('input[type="file"]');

      uploadArea.addEventListener('click', () => {
        fileInput.click();
      });

      uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
      });

      uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
      });

      uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
          this.handleFileSelect(doc.key, files[0], container);
        }
      });

      fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
          this.handleFileSelect(doc.key, e.target.files[0], container);
        }
      });

      container.appendChild(uploadArea);
      return container;
    }

    handleFileSelect(docKey, file, container) {
      if (file.type !== 'application/pdf') {
        showToast('Please upload a PDF file', 'error');
        return;
      }

      this.uploadedFiles[docKey] = {
        file: file,
        name: file.name,
        size: file.size,
        url: URL.createObjectURL(file),
        id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      const uploadArea = container.querySelector('.step-tool-upload-area');
      uploadArea.style.display = 'none';

      let fileItem = container.querySelector('.step-tool-file-item');
      if (!fileItem) {
        fileItem = document.createElement('div');
        fileItem.className = 'step-tool-file-item';
        container.appendChild(fileItem);
      }

      const sizeKB = Math.round(file.size / 1024);
      fileItem.innerHTML = `
        <div class="step-tool-file-icon">📄</div>
        <div class="step-tool-file-info">
          <div class="step-tool-file-name">${file.name}</div>
          <div class="step-tool-file-size">${sizeKB} KB</div>
        </div>
        <button class="step-tool-file-remove" type="button">×</button>
      `;

      fileItem.querySelector('.step-tool-file-remove').addEventListener('click', () => {
        delete this.uploadedFiles[docKey];
        fileItem.remove();
        uploadArea.style.display = '';
      });

      this.updateRunButton();
    }

    renderFooter() {
      const footer = document.createElement('div');
      footer.className = 'step-tool-modal-footer';

      footer.innerHTML = `
        <button class="step-tool-modal-cancel" type="button">Cancel</button>
        <button class="step-tool-modal-run" type="button" ${this.requiredDocuments.length > 0 ? 'disabled' : ''}>
          Run Analysis
        </button>
      `;

      footer.querySelector('.step-tool-modal-cancel').addEventListener('click', () => {
        this.close();
      });

      footer.querySelector('.step-tool-modal-run').addEventListener('click', () => {
        this.run();
      });

      return footer;
    }

    updateRunButton() {
      const runButton = this.element.querySelector('.step-tool-modal-run');
      if (!runButton) return;

      const allUploaded = this.requiredDocuments.every(doc => this.uploadedFiles[doc.key]);
      runButton.disabled = !allUploaded || this.isRunning;
    }

    async run() {
      if (this.isRunning) return;

      const runButton = this.element.querySelector('.step-tool-modal-run');
      this.isRunning = true;
      runButton.classList.add('running');
      runButton.disabled = true;

      try {
        const result = await this.onRun(this.uploadedFiles);
        showToast('Analysis complete', 'success');
        this.close();
      } catch (error) {
        console.error('Tool execution failed:', error);
        showToast(error.message || 'Analysis failed', 'error');
      } finally {
        this.isRunning = false;
        runButton.classList.remove('running');
        runButton.disabled = false;
      }
    }

    show() {
      if (this.element) {
        this.element.classList.remove('hidden');
      }
    }

    close() {
      if (this.element && this.element.parentNode) {
        document.body.removeChild(this.element);
      }
      if (this.onClose) {
        this.onClose();
      }
    }
  }

  // ============================================================================
  // Financial Summary Panel
  // ============================================================================

  class FinancialSummaryPanel {
    constructor(claimId) {
      this.claimId = claimId;
      this.data = null;
    }

    async load() {
      const client = initSupabase();
      if (!client || !this.claimId) {
        return;
      }

      try {
        const { data, error } = await client
          .from('claim_financial_summary')
          .select('*')
          .eq('claim_id', this.claimId)
          .single();

        if (error) throw error;
        this.data = data;
      } catch (error) {
        console.error('Failed to load financial summary:', error);
        this.data = null;
      }
    }

    render() {
      if (!this.data) {
        return null;
      }

      const panel = document.createElement('div');
      panel.className = 'financial-summary-panel';

      const header = document.createElement('div');
      header.className = 'financial-summary-header';
      header.innerHTML = `
        <div class="financial-summary-title">Financial Summary</div>
        <a href="/app/claim-financial-summary.html" class="financial-summary-link">View Details →</a>
      `;

      const grid = document.createElement('div');
      grid.className = 'financial-summary-grid';

      const metrics = [
        {
          label: 'RCV Total',
          value: this.formatCurrency(this.data.rcv_total || 0),
          sublabel: 'Replacement Cost Value'
        },
        {
          label: 'ACV Paid',
          value: this.formatCurrency(this.data.acv_paid || 0),
          sublabel: 'Actual Cash Value'
        },
        {
          label: 'Depreciation Withheld',
          value: this.formatCurrency(this.data.depreciation_withheld || 0),
          sublabel: 'Recoverable after repairs'
        },
        {
          label: 'Underpayment Estimate',
          value: this.formatCurrency(this.data.underpayment_estimate || 0),
          valueClass: this.data.underpayment_estimate > 0 ? 'negative' : '',
          sublabel: 'Gap identified'
        }
      ];

      metrics.forEach(metric => {
        const metricEl = document.createElement('div');
        metricEl.className = 'financial-summary-metric';
        metricEl.innerHTML = `
          <div class="financial-summary-metric-label">${metric.label}</div>
          <div class="financial-summary-metric-value ${metric.valueClass || ''}">${metric.value}</div>
          ${metric.sublabel ? `<div class="financial-summary-metric-sublabel">${metric.sublabel}</div>` : ''}
        `;
        grid.appendChild(metricEl);
      });

      panel.appendChild(header);
      panel.appendChild(grid);

      if (this.data.underpayment_estimate > 0) {
        const alert = document.createElement('div');
        alert.className = 'financial-summary-alert';
        alert.innerHTML = `
          <div class="financial-summary-alert-icon">⚠</div>
          <div class="financial-summary-alert-text">
            <strong>Gap Identified:</strong> Review estimate discrepancies and evidence gaps in Steps 8-10.
          </div>
        `;
        panel.appendChild(alert);
      }

      return panel;
    }

    formatCurrency(amount) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    }
  }

  // ============================================================================
  // Export to Global Namespace
  // ============================================================================

  window.ClaimCommandCenter = {
    getAuthToken,
    getClaimId,
    showToast,
    StepToolModal,
    FinancialSummaryPanel
  };

})();
