const PDFDocument = require('pdfkit');
const { Document, Packer, Paragraph } = require('docx');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const user = context.clientContext && context.clientContext.user;
  if (!user) {
    return { statusCode: 401, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  try {
    const { content, format, filename } = JSON.parse(event.body || '{}');

    if (!content || !format) {
      return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'content and format are required' }) };
    }

    const safeName = (filename || 'ClaimNavigatorAI-Document')
      .replace(/[^a-zA-Z0-9._-]/g, '')
      .slice(0, 120);

    if (format.toLowerCase() === 'pdf') {
      const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
      doc.info = { Title: safeName, Author: 'ClaimNavigatorAI' };

      doc.fontSize(18).fillColor('#111111').text('ClaimNavigatorAI Document', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).fillColor('#000000').text(content, { align: 'left' });
      doc.end();

      const pdfBuffer = await streamToBuffer(doc);

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${safeName}.pdf"`,
          'Cache-Control': 'private, max-age=3600'
        },
        body: pdfBuffer.toString('base64'),
        isBase64Encoded: true
      };
    }

    if (format.toLowerCase() === 'docx') {
      const paragraphs = content.split(/\n\n+/).map(block => new Paragraph({ text: block }));
      const docx = new Document({
        sections: [
          {
            properties: {},
            children: [new Paragraph({ text: 'ClaimNavigatorAI Document' }), ...paragraphs]
          }
        ]
      });
      const buffer = await Packer.toBuffer(docx);

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${safeName}.docx"`,
          'Cache-Control': 'private, max-age=3600'
        },
        body: buffer.toString('base64'),
        isBase64Encoded: true
      };
    }

    return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Unsupported format' }) };
  } catch (error) {
    console.error('export-document error:', error);
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Failed to export document', message: error.message }) };
  }
};

function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

