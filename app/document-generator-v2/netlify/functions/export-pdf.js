const PDFDocument = require('pdfkit');

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const { docId } = event.queryStringParameters;
    
    if (!docId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing docId parameter' })
      };
    }

    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margins: {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50
      }
    });

    // Buffer to store PDF data
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {});

    // Add content to PDF
    doc.fontSize(20).text(`${docId.replace(/-/g, ' ').toUpperCase()}`, 50, 50);
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, 50, 80);
    
    // Add document-specific content
    doc.fontSize(14).text('Document Information:', 50, 120);
    doc.fontSize(12).text(`Document Type: ${docId}`, 50, 150);
    doc.text(`This is a PDF export of the ${docId} document.`, 50, 170);
    doc.text('This document was generated using ClaimNavigatorAI Document Generator.', 50, 190);
    
    // Add footer
    doc.fontSize(10).text('ClaimNavigatorAI - Professional Insurance Claim Tools', 50, 750);

    // Finalize PDF
    doc.end();

    // Wait for PDF to be generated
    await new Promise((resolve) => {
      doc.on('end', resolve);
    });

    // Convert to base64
    const pdfBuffer = Buffer.concat(buffers);
    const base64PDF = pdfBuffer.toString('base64');

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${docId}.pdf"`
      },
      body: base64PDF,
      isBase64Encoded: true
    };

  } catch (error) {
    console.error('PDF export error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to generate PDF',
        details: error.message 
      })
    };
  }
};
