/**
 * Financial Snapshot Panel
 * Persistent financial summary displayed across claim workflow
 */

class FinancialSnapshotPanel {
  constructor(claimId) {
    this.claimId = claimId;
    this.data = null;
    this.container = null;
  }

  /**
   * Initialize and render panel
   */
  async init() {
    await this.loadData();
    this.render();
    this.attachToPage();
  }

  /**
   * Load financial data from Supabase
   */
  async loadData() {
    try {
      const supabase = window.supabaseClient;
      if (!supabase) {
        throw new Error('Supabase not initialized');
      }

      // Get financial summary
      const { data: financial, error: finError } = await supabase
        .from('claim_financial_summary')
        .select('*')
        .eq('claim_id', this.claimId)
        .single();

      // Get comparison data
      const { data: comparison, error: compError } = await supabase
        .from('claim_estimate_comparison')
        .select('*')
        .eq('claim_id', this.claimId)
        .single();

      // Get claim info
      const { data: claim, error: claimError } = await supabase
        .from('claims')
        .select('claim_number, carrier_name, loss_date')
        .eq('id', this.claimId)
        .single();

      this.data = {
        financial: financial || {},
        comparison: comparison || {},
        claim: claim || {}
      };
    } catch (error) {
      console.error('Failed to load financial data:', error);
      this.data = { financial: {}, comparison: {}, claim: {} };
    }
  }

  /**
   * Render panel HTML
   */
  render() {
    const { financial, comparison, claim } = this.data;

    const underpayment = financial.underpayment_estimate || comparison.underpayment_amount || 0;
    const contractorTotal = financial.contractor_total || comparison.contractor_total || 0;
    const carrierTotal = financial.carrier_total || comparison.carrier_total || 0;
    const depreciationWithheld = financial.depreciation_withheld || 0;
    const depreciationRecovered = financial.depreciation_recovered || 0;
    const totalPaid = financial.total_paid_to_date || 0;
    const outstandingBalance = financial.outstanding_balance || underpayment;

    this.container = document.createElement('div');
    this.container.className = 'financial-snapshot-panel';
    this.container.innerHTML = `
      <div class="financial-snapshot-header">
        <div class="financial-snapshot-title">
          <span class="icon">💰</span>
          <span>Financial Snapshot</span>
        </div>
        <button class="financial-snapshot-toggle" onclick="this.closest('.financial-snapshot-panel').classList.toggle('collapsed')">
          <span class="toggle-icon">▼</span>
        </button>
      </div>

      <div class="financial-snapshot-content">
        <div class="financial-snapshot-claim-info">
          <div class="claim-info-item">
            <span class="label">Claim #:</span>
            <span class="value">${claim.claim_number || 'N/A'}</span>
          </div>
          <div class="claim-info-item">
            <span class="label">Carrier:</span>
            <span class="value">${claim.carrier_name || 'N/A'}</span>
          </div>
        </div>

        <div class="financial-snapshot-grid">
          <div class="financial-metric ${underpayment > 0 ? 'alert' : ''}">
            <div class="metric-label">Underpayment Identified</div>
            <div class="metric-value">${this.formatCurrency(underpayment)}</div>
            ${underpayment > 0 ? '<div class="metric-status">Action Required</div>' : ''}
          </div>

          <div class="financial-metric">
            <div class="metric-label">Contractor Total</div>
            <div class="metric-value">${this.formatCurrency(contractorTotal)}</div>
          </div>

          <div class="financial-metric">
            <div class="metric-label">Carrier Total</div>
            <div class="metric-value">${this.formatCurrency(carrierTotal)}</div>
          </div>

          <div class="financial-metric ${depreciationWithheld > 0 ? 'warning' : ''}">
            <div class="metric-label">Depreciation Withheld</div>
            <div class="metric-value">${this.formatCurrency(depreciationWithheld)}</div>
            ${depreciationWithheld > 0 ? '<div class="metric-status">Recoverable</div>' : ''}
          </div>

          <div class="financial-metric">
            <div class="metric-label">Total Paid to Date</div>
            <div class="metric-value">${this.formatCurrency(totalPaid)}</div>
          </div>

          <div class="financial-metric ${outstandingBalance > 0 ? 'alert' : 'success'}">
            <div class="metric-label">Outstanding Balance</div>
            <div class="metric-value">${this.formatCurrency(outstandingBalance)}</div>
            ${outstandingBalance > 0 ? '<div class="metric-status">Pending</div>' : '<div class="metric-status">Resolved</div>'}
          </div>
        </div>

        <div class="financial-snapshot-actions">
          <button class="snapshot-action-btn" onclick="window.location.href='/app/claim-financial-summary.html?claim_id=${this.claimId}'">
            View Full Summary
          </button>
          ${underpayment > 0 ? `
            <button class="snapshot-action-btn primary" onclick="generateSupplement()">
              Generate Supplement
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Attach panel to page
   */
  attachToPage() {
    // Remove existing panel if any
    const existing = document.querySelector('.financial-snapshot-panel');
    if (existing) {
      existing.remove();
    }

    // Insert after main header or at top of main content
    const mainContent = document.querySelector('main') || document.querySelector('.main-content') || document.body;
    if (mainContent.firstChild) {
      mainContent.insertBefore(this.container, mainContent.firstChild);
    } else {
      mainContent.appendChild(this.container);
    }
  }

  /**
   * Update panel data
   */
  async refresh() {
    await this.loadData();
    this.render();
    
    // Replace existing content
    const existing = document.querySelector('.financial-snapshot-panel');
    if (existing) {
      existing.replaceWith(this.container);
    }
  }

  /**
   * Format currency
   */
  formatCurrency(amount) {
    if (!amount || isNaN(amount)) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FinancialSnapshotPanel;
}
