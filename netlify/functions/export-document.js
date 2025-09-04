const { getStore } = require("@netlify/blobs");
const PDFDocument = require("pdfkit");
const { Document, Packer, Paragraph } = require("docx");

exports.handler = async (event, context) => {
  // Enforce POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  // Require authenticated user
  const user = context.clientContext && context.clientContext.user;
  if (!user) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Unauthorized' })
    };
  }

  try {
    const { text, format, filename, persist } = JSON.parse(event.body || '{}');

    if (!text || !format) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing required fields: text, format' })
      };
    }

    const safeFormat = String(format).toLowerCase();
    if (!['pdf', 'docx'].includes(safeFormat)) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid format. Use pdf or docx.' })
      };
    }

    const safeBaseName = (filename && filename.replace(/[^a-z0-9-_\.]/gi, '')) || 'ClaimNavigatorAI_Response';
    const outFileName = safeBaseName.endsWith('.' + safeFormat) ? safeBaseName : `${safeBaseName}.${safeFormat}`;

    // Generate buffer
    let buffer;
    if (safeFormat === 'docx') {
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: text.split(/\n\n+/).map(p => new Paragraph(p))
          }
        ]
      });
      buffer = await Packer.toBuffer(doc);
    } else {
      // PDF
      buffer = await createPdfBuffer(text);
    }

    // Optionally persist to Blobs for later download via /download
    if (persist) {
      const documentsStore = getStore('documents');
      const key = `${user.email}/${outFileName}`;
      await documentsStore.set(key, buffer, { contentType: safeFormat === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': safeFormat === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${outFileName}"`,
        'Cache-Control': 'private, max-age=0, must-revalidate'
      },
      body: buffer.toString('base64'),
      isBase64Encoded: true
    };
  } catch (error) {
    console.error('export-document error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to export document', message: error.message })
    };
  }
};

function createPdfBuffer(text) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(12);
      text.split(/\n\n+/).forEach((paragraph, idx) => {
        doc.text(paragraph, { align: 'left' });
        if (idx < text.length - 1) doc.moveDown();
      });

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}

