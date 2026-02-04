/**
 * POLICY COVERAGE MATRIX TABLE COMPONENT
 * Standardized coverage matrix for policy analysis
 * Presentation layer only - uses existing policy data
 */

(function() {
  'use strict';
  
  /**
   * Generate policy coverage matrix table HTML
   * @param {Object} policyData - Policy analysis data
   * @returns {string} HTML table
   */
  function generateCoverageMatrix(policyData) {
    if (!policyData || !policyData.coverages || policyData.coverages.length === 0) {
      return '<p>No policy coverage data available.</p>';
    }
    
    let html = `
      <div class="policy-coverage-table-container">
        <h3>Policy Coverage Matrix</h3>
        <table class="policy-coverage-table">
          <thead>
            <tr>
              <th>Coverage Category</th>
              <th>Coverage Limit</th>
              <th>Deductible</th>
              <th>Exclusions / Notes</th>
              <th>Applies to Loss</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    policyData.coverages.forEach(coverage => {
      const limit = coverage.limit || coverage.coverageLimit || 'Not specified';
      const deductible = coverage.deductible || 'Not specified';
      const exclusions = coverage.exclusions || coverage.notes || 'None noted';
      const applicability = coverage.applicability || coverage.appliesToLoss || 'Unknown';
      
      const applicabilityClass = 
        applicability.toLowerCase() === 'yes' || applicability.toLowerCase() === 'applicable' ? 'applies-yes' :
        applicability.toLowerCase() === 'no' || applicability.toLowerCase() === 'not applicable' ? 'applies-no' :
        'applies-unknown';
      
      const applicabilityText = 
        applicability.toLowerCase() === 'yes' || applicability.toLowerCase() === 'applicable' ? 'Yes' :
        applicability.toLowerCase() === 'no' || applicability.toLowerCase() === 'not applicable' ? 'No' :
        'To Be Determined';
      
      html += `
        <tr>
          <td><strong>${escapeHtml(coverage.category || coverage.coverageType || 'Unknown')}</strong></td>
          <td class="amount">${escapeHtml(limit.toString())}</td>
          <td class="amount">${escapeHtml(deductible.toString())}</td>
          <td class="notes">${escapeHtml(exclusions.toString())}</td>
          <td><span class="applicability-badge ${applicabilityClass}">${applicabilityText}</span></td>
        </tr>
      `;
    });
    
    html += `
          </tbody>
        </table>
        
        <div class="coverage-summary">
          <h4>Coverage Summary</h4>
          <div class="summary-grid">
            <div class="summary-item">
              <span class="summary-label">Total Coverages:</span>
              <span class="summary-value">${policyData.coverages.length}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Applicable to Loss:</span>
              <span class="summary-value">${policyData.coverages.filter(c => {
                const app = (c.applicability || c.appliesToLoss || '').toLowerCase();
                return app === 'yes' || app === 'applicable';
              }).length}</span>
            </div>
          </div>
        </div>
        
        <div class="table-actions">
          <button class="btn btn-secondary" onclick="CNPolicyTable.exportPDF()">Export PDF</button>
          <button class="btn btn-secondary" onclick="CNPolicyTable.exportCSV()">Export CSV</button>
        </div>
      </div>
      
      <style>
        .policy-coverage-table-container {
          margin: 2rem 0;
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .policy-coverage-table {
          width: 100%;
          border-collapse: collapse;
          margin: 1rem 0;
        }
        
        .policy-coverage-table th,
        .policy-coverage-table td {
          padding: 0.75rem;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .policy-coverage-table th {
          background: #f9fafb;
          font-weight: 600;
          color: #374151;
        }
        
        .policy-coverage-table td.amount {
          text-align: right;
          font-family: monospace;
        }
        
        .policy-coverage-table td.notes {
          font-size: 0.875rem;
          color: #6b7280;
          max-width: 300px;
        }
        
        .applicability-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.875rem;
          font-weight: 500;
          display: inline-block;
        }
        
        .applies-yes {
          background: #dcfce7;
          color: #16a34a;
        }
        
        .applies-no {
          background: #f3f4f6;
          color: #6b7280;
        }
        
        .applies-unknown {
          background: #fef3c7;
          color: #d97706;
        }
        
        .coverage-summary {
          margin: 1.5rem 0;
          padding: 1rem;
          background: #f9fafb;
          border-radius: 6px;
        }
        
        .coverage-summary h4 {
          margin: 0 0 0.75rem 0;
          color: #374151;
        }
        
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }
        
        .summary-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .summary-label {
          font-weight: 500;
          color: #6b7280;
        }
        
        .summary-value {
          font-weight: 600;
          color: #1e3a8a;
          font-size: 1.25rem;
        }
        
        .table-actions {
          margin-top: 1rem;
          display: flex;
          gap: 0.5rem;
        }
        
        .btn {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
        }
        
        .btn-secondary {
          background: #6b7280;
          color: white;
        }
        
        .btn-secondary:hover {
          background: #4b5563;
        }
      </style>
    `;
    
    return html;
  }
  
  /**
   * Export table as PDF
   */
  function exportPDF() {
    if (typeof jsPDF === 'undefined') {
      alert('PDF export library not loaded. Please refresh the page.');
      return;
    }
    
    const table = document.querySelector('.policy-coverage-table');
    if (!table) {
      alert('No table found to export.');
      return;
    }
    
    const doc = new jsPDF.jsPDF('l'); // Landscape for wider table
    doc.text('Policy Coverage Matrix', 14, 15);
    doc.autoTable({ html: table, startY: 25 });
    doc.save('policy-coverage-matrix.pdf');
  }
  
  /**
   * Export table as CSV
   */
  function exportCSV() {
    const table = document.querySelector('.policy-coverage-table');
    if (!table) {
      alert('No table found to export.');
      return;
    }
    
    let csv = [];
    const rows = table.querySelectorAll('tr');
    
    rows.forEach(row => {
      const cols = row.querySelectorAll('td, th');
      const rowData = [];
      cols.forEach(col => {
        rowData.push('"' + col.textContent.trim().replace(/"/g, '""') + '"');
      });
      csv.push(rowData.join(','));
    });
    
    const csvContent = csv.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'policy-coverage-matrix.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }
  
  /**
   * Escape HTML to prevent XSS
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  // Export public API
  window.CNPolicyTable = {
    generate: generateCoverageMatrix,
    exportPDF: exportPDF,
    exportCSV: exportCSV
  };
  
})();



