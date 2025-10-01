const PDFDocument = require('pdfkit');
const { addClaimantProtection, logDocumentAccess } = require('./utils/pdf-protection');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse request body
    const { 
      documentType, 
      content, 
      claimantInfo,
      user_id 
    } = JSON.parse(event.body);

    if (!documentType || !content || !claimantInfo || !user_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required parameters' })
      };
    }

    // Create PDF document
    const doc = new PDFDocument({
      size: 'LETTER',
      margins: {
        top: 80,    // Extra space for header
        bottom: 60, // Extra space for footer
        left: 50,
        right: 50
      }
    });

    // Add content to PDF
    doc.fontSize(12);
    doc.text(content, {
      align: 'left',
      lineGap: 5
    });

    // Finalize the PDF
    const pdfBuffer = await new Promise((resolve, reject) => {
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      doc.end();
    });

    // Prepare claimant information with user_id
    const fullClaimantInfo = {
      ...claimantInfo,
      user_id: user_id
    };

    // Add claimant protection to the generated PDF
    const { protectedPdf, documentId } = await addClaimantProtection(pdfBuffer, fullClaimantInfo);

    // Log document generation
    await logDocumentAccess(documentId, fullClaimantInfo, 'generate');

    // Return the protected PDF
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${documentType}_protected.pdf"`,
        'Content-Length': protectedPdf.length.toString(),
        'X-Document-ID': documentId,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: protectedPdf.toString('base64'),
      isBase64Encoded: true
    };

  } catch (error) {
    console.error('Error generating protected document:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
