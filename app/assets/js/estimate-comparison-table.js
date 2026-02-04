/**
 * ESTIMATE COMPARISON TABLE COMPONENT
 * Standardized tabular output for estimate review
 * Presentation layer only - uses existing estimate data
 */

(function() {
  'use strict';
  
  /**
   * Generate estimate comparison table HTML
   * @param {Object} estimateData - Estimate comparison data
   * @returns {string} HTML table
   */
  function generateComparisonTable(estimateData) {
    if (!estimateData || !estimateData.lineItems || estimateData.lineItems.length === 0) {
      return '<p>No estimate data available.</p>';
    }
    
    let totalPolicyholder = 0;
    let totalCarrier = 0;
    
    let html = `
      <div class="estimate-comparison-table-container">
        <h3>Estimate Comparison Summary</h3>
        <table class="estimate-comparison-table">
          <thead>
            <tr>
              <th>Line Item / Category</th>
              <th>Your Estimate</th>
              <th>Carrier Estimate</th>
              <th>Difference</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    estimateData.lineItems.forEach(item => {
      const policyholderAmount = parseFloat(item.policyholderAmount || 0);
      const carrierAmount = parseFloat(item.carrierAmount || 0);
      const difference = policyholderAmount - carrierAmount;
      
      totalPolicyholder += policyholderAmount;
      totalCarrier += carrierAmount;
      
      const statusClass = difference > 0 ? 'status-underpaid' : difference < 0 ? 'status-overpaid' : 'status-match';
      const statusText = difference > 0 ? 'Underpaid' : difference < 0 ? 'Overpaid' : 'Match';
      
      html += `
        <tr>
          <td>${escapeHtml(item.category || item.lineItem || 'Unknown')}</td>
          <td class="amount">$${policyholderAmount.toFixed(2)}</td>
          <td class="amount">$${carrierAmount.toFixed(2)}</td>
          <td class="amount ${difference !== 0 ? 'difference' : ''}">${difference > 0 ? '+' : ''}$${difference.toFixed(2)}</td>
          <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        </tr>
      `;
    });
    
    const totalDifference = totalPolicyholder - totalCarrier;
    
    html += `
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td><strong>TOTAL</strong></td>
              <td class="amount"><strong>$${totalPolicyholder.toFixed(2)}</strong></td>
              <td class="amount"><strong>$${totalCarrier.toFixed(2)}</strong></td>
              <td class="amount difference"><strong>${totalDifference > 0 ? '+' : ''}$${totalDifference.toFixed(2)}</strong></td>
              <td></td>
            </tr>
          </tfoot>
        </table>
        
        <div class="table-actions">
          <button class="btn btn-secondary" onclick="CNEstimateTable.exportPDF()">Export PDF</button>
          <button class="btn btn-secondary" onclick="CNEstimateTable.exportCSV()">Export CSV</button>
        </div>
      </div>
      
      <style>
        .estimate-comparison-table-container {
          margin: 2rem 0;
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .estimate-comparison-table {
          width: 100%;
          border-collapse: collapse;
          margin: 1rem 0;
        }
        
        .estimate-comparison-table th,
        .estimate-comparison-table td {
          padding: 0.75rem;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .estimate-comparison-table th {
          background: #f9fafb;
          font-weight: 600;
          color: #374151;
        }
        
        .estimate-comparison-table td.amount {
          text-align: right;
          font-family: monospace;
        }
        
        .estimate-comparison-table td.difference {
          font-weight: 600;
        }
        
        .estimate-comparison-table .total-row {
          background: #f3f4f6;
          font-size: 1.1rem;
        }
        
        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.875rem;
          font-weight: 500;
        }
        
        .status-underpaid {
          background: #fef2f2;
          color: #dc2626;
        }
        
        .status-overpaid {
          background: #f0fdf4;
          color: #16a34a;
        }
        
        .status-match {
          background: #f3f4f6;
          color: #6b7280;
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
    
    const table = document.querySelector('.estimate-comparison-table');
    if (!table) {
      alert('No table found to export.');
      return;
    }
    
    const doc = new jsPDF.jsPDF();
    doc.text('Estimate Comparison Report', 14, 15);
    doc.autoTable({ html: table, startY: 25 });
    doc.save('estimate-comparison.pdf');
  }
  
  /**
   * Export table as CSV
   */
  function exportCSV() {
    const table = document.querySelector('.estimate-comparison-table');
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
    a.download = 'estimate-comparison.csv';
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
  window.CNEstimateTable = {
    generate: generateComparisonTable,
    exportPDF: exportPDF,
    exportCSV: exportCSV
  };
  
})();



