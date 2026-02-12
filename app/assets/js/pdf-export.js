/**
 * PDF Export Utility
 * Export supplements and reports as PDF
 */

class PDFExporter {
  /**
   * Export HTML content as PDF
   * @param {string} html - HTML content to export
   * @param {string} filename - PDF filename
   * @param {object} options - Export options
   */
  static async exportToPDF(html, filename, options = {}) {
    const defaults = {
      margin: [20, 20, 20, 20],
      filename: filename || 'document.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' }
    };

    const config = { ...defaults, ...options };

    try {
      // Check if html2pdf is available
      if (typeof html2pdf === 'undefined') {
        console.error('html2pdf library not loaded');
        return this.fallbackPrint(html);
      }

      // Create temporary container
      const container = document.createElement('div');
      container.innerHTML = html;
      container.style.cssText = `
        position: absolute;
        left: -9999px;
        top: 0;
        width: 210mm;
        background: white;
        padding: 20mm;
      `;
      document.body.appendChild(container);

      // Generate PDF
      await html2pdf()
        .set(config)
        .from(container)
        .save();

      // Cleanup
      document.body.removeChild(container);

      return true;
    } catch (error) {
      console.error('PDF export failed:', error);
      return this.fallbackPrint(html);
    }
  }

  /**
   * Fallback to print dialog
   */
  static fallbackPrint(html) {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print Document</title>
        <style>
          @page {
            margin: 20mm;
            size: letter;
          }
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 210mm;
            margin: 0 auto;
          }
          @media print {
            body {
              margin: 0;
            }
          }
        </style>
      </head>
      <body>
        ${html}
        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
    return false;
  }

  /**
   * Export supplement as PDF
   */
  static async exportSupplement(supplementHTML, claimNumber) {
    const filename = `Supplement_Request_Claim_${claimNumber}_${this.getDateString()}.pdf`;
    return await this.exportToPDF(supplementHTML, filename, {
      margin: [15, 15, 15, 15]
    });
  }

  /**
   * Export estimate comparison as PDF
   */
  static async exportEstimateComparison(comparisonHTML, claimNumber) {
    const filename = `Estimate_Comparison_Claim_${claimNumber}_${this.getDateString()}.pdf`;
    return await this.exportToPDF(comparisonHTML, filename);
  }

  /**
   * Export financial summary as PDF
   */
  static async exportFinancialSummary(summaryHTML, claimNumber) {
    const filename = `Financial_Summary_Claim_${claimNumber}_${this.getDateString()}.pdf`;
    return await this.exportToPDF(summaryHTML, filename);
  }

  /**
   * Get formatted date string
   */
  static getDateString() {
    const now = new Date();
    return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  }

  /**
   * Copy HTML content to clipboard
   */
  static async copyToClipboard(html) {
    try {
      // Convert HTML to plain text
      const temp = document.createElement('div');
      temp.innerHTML = html;
      const text = temp.innerText || temp.textContent;

      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error('Copy to clipboard failed:', error);
      return false;
    }
  }

  /**
   * Print HTML content
   */
  static print(html) {
    return this.fallbackPrint(html);
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PDFExporter;
}
