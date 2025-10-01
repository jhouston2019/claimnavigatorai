const PDFDocument = require('pdfkit');
const { sanitize } = require('sanitize-html');

// Convert HTML content to PDF buffer
async function htmlToPDFBuffer(html, options = {}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: 50,
          bottom: 50,
          left: 50,
          right: 50
        }
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });

      // Add header
      if (options.policyholderName && options.docType) {
        doc.fontSize(16).font('Helvetica-Bold')
          .text(options.policyholderName, 50, 30)
          .fontSize(12).font('Helvetica')
          .text(options.docType.replace('-', ' ').toUpperCase(), 50, 50);
      }

      // Sanitize HTML content
      const sanitizedHtml = sanitize(html, {
        allowedTags: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
        allowedAttributes: {}
      });

      // Convert HTML to plain text for PDF
      const plainText = sanitizedHtml
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
        .replace(/&amp;/g, '&') // Replace HTML entities
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");

      // Split into lines and add to PDF
      const lines = plainText.split('\n');
      let yPosition = 80;

      lines.forEach(line => {
        if (line.trim()) {
          // Check if we need a new page
          if (yPosition > doc.page.height - 100) {
            doc.addPage();
            yPosition = 50;
          }

          // Handle different line types
          if (line.startsWith('**') && line.endsWith('**')) {
            // Bold text
            doc.fontSize(14).font('Helvetica-Bold')
              .text(line.replace(/\*\*/g, ''), 50, yPosition);
            yPosition += 20;
          } else if (line.startsWith('#')) {
            // Headers
            const level = (line.match(/^#+/) || [''])[0].length;
            const fontSize = Math.max(16 - level, 10);
            doc.fontSize(fontSize).font('Helvetica-Bold')
              .text(line.replace(/^#+\s*/, ''), 50, yPosition);
            yPosition += fontSize + 5;
          } else {
            // Regular text
            doc.fontSize(11).font('Helvetica')
              .text(line, 50, yPosition);
            yPosition += 15;
          }
        } else {
          yPosition += 10; // Empty line
        }
      });

      // Add footer with disclaimer
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        
        // Page number
        doc.fontSize(10).font('Helvetica')
          .text(`Page ${i + 1} of ${pageCount}`, 50, doc.page.height - 30, {
            align: 'center'
          });

        // Disclaimer
        doc.fontSize(8).font('Helvetica')
          .text('AI-generated; review before submission.', 50, doc.page.height - 20, {
            align: 'center'
          });
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  htmlToPDFBuffer
};
