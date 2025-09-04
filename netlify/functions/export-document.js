const PDFDocument = require('pdfkit');
const { Document, Packer, Paragraph, HeadingLevel } = require('docx');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  const user = context.clientContext?.user;
  if (!user) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Unauthorized - Please login' })
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const content = (body.content || '').toString();
    const format = (body.format || 'pdf').toLowerCase();
    const filenameBase = (body.filename || 'claim-document').replace(/[^a-z0-9-_]+/gi, '-');

    if (!content || (format !== 'pdf' && format !== 'docx')) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid request: provide content and format pdf|docx' })
      };
    }

    if (format === 'pdf') {
      const buffer = await generatePdfBuffer(content);
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filenameBase}.pdf"`,
          'Cache-Control': 'private, max-age=3600'
        },
        body: buffer.toString('base64'),
        isBase64Encoded: true
      };
    }

    // DOCX
    const buffer = await generateDocxBuffer(content);
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filenameBase}.docx"`,
        'Cache-Control': 'private, max-age=3600'
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

async function generatePdfBuffer(text) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(16).text('ClaimNavigatorAI Document', { align: 'center' });
      doc.moveDown();
      doc.fontSize(11).text(text, { align: 'left' });
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

async function generateDocxBuffer(text) {
  const paragraphs = [];
  paragraphs.push(new Paragraph({ text: 'ClaimNavigatorAI Document', heading: HeadingLevel.HEADING_1 }));
  paragraphs.push(new Paragraph(''));
  for (const line of text.split(/\r?\n/)) {
    paragraphs.push(new Paragraph(line));
  }
  const doc = new Document({ sections: [{ properties: {}, children: paragraphs }] });
  const buffer = await Packer.toBuffer(doc);
  return buffer;
}

