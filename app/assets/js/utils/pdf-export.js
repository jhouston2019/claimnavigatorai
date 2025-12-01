/**
 * PDF Export Utility
 * Shared PDF export functionality for Advanced Tools
 */

// Global PDF exporter (UMD pattern for compatibility)
window.PDFExporter = {
  /**
   * Export a section of the page to PDF
   * @param {string} selector - CSS selector for the element to export
   * @param {string} filename - Filename for the PDF download
   */
  exportSectionToPDF: async function(selector, filename = 'claim-document.pdf') {
    const element = document.querySelector(selector);
    if (!element) {
      console.error('PDF Export: Element not found:', selector);
      return;
    }

    // Check if libraries are loaded
    if (!window.jspdf || !window.html2canvas) {
      console.error('PDF libraries not loaded. Loading now...');
      
      // Try to load libraries dynamically
      await this.loadPDFLibraries();
      
      // Check again
      if (!window.jspdf || !window.html2canvas) {
        alert('PDF export libraries failed to load. Please refresh the page and try again.');
        return;
      }
    }

    try {
      // Show loading indicator
      const originalText = element.querySelector('.export-pdf-btn')?.textContent;
      const exportBtn = element.querySelector('.export-pdf-btn');
      if (exportBtn) {
        exportBtn.disabled = true;
        exportBtn.textContent = 'Generating PDF...';
      }

      // Capture element as canvas
      const canvas = await window.html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
      });

      const imgData = canvas.toDataURL('image/png');

      // Create PDF
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF('p', 'pt', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pageWidth - 40; // margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let position = 20; // top margin
      let heightLeft = imgHeight;

      // Add first page
      pdf.addImage(imgData, 'PNG', 20, position, imgWidth, imgHeight);
      heightLeft -= (pageHeight - 40);

      // Add additional pages if needed
      while (heightLeft > 0) {
        pdf.addPage();
        position = heightLeft - imgHeight + 20;
        pdf.addImage(imgData, 'PNG', 20, position, imgWidth, imgHeight);
        heightLeft -= (pageHeight - 40);
      }

      // Save PDF
      pdf.save(filename);

      // Restore button
      if (exportBtn) {
        exportBtn.disabled = false;
        if (originalText) {
          exportBtn.textContent = originalText;
        }
      }

    } catch (error) {
      console.error('PDF export error:', error);
      alert('Error generating PDF: ' + error.message);
      
      // Restore button
      const exportBtn = element.querySelector('.export-pdf-btn');
      if (exportBtn) {
        exportBtn.disabled = false;
        exportBtn.textContent = 'Export to PDF';
      }
    }
  },

  /**
   * Load PDF libraries dynamically
   */
  loadPDFLibraries: async function() {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (window.jspdf && window.html2canvas) {
        resolve();
        return;
      }

      let loaded = 0;
      const total = 2;

      const checkComplete = () => {
        loaded++;
        if (loaded === total) {
          resolve();
        }
      };

      // Load jsPDF
      if (!window.jspdf) {
        const jsPDFScript = document.createElement('script');
        jsPDFScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        jsPDFScript.onload = checkComplete;
        jsPDFScript.onerror = () => {
          console.error('Failed to load jsPDF');
          checkComplete();
        };
        document.head.appendChild(jsPDFScript);
      } else {
        checkComplete();
      }

      // Load html2canvas
      if (!window.html2canvas) {
        const html2canvasScript = document.createElement('script');
        html2canvasScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        html2canvasScript.onload = checkComplete;
        html2canvasScript.onerror = () => {
          console.error('Failed to load html2canvas');
          checkComplete();
        };
        document.head.appendChild(html2canvasScript);
      } else {
        checkComplete();
      }
    });
  }
};

// ES Module export (if supported)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = window.PDFExporter;
}


