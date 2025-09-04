const { Document, Packer, Paragraph } = require('docx');
const PDFDocument = require('pdfkit');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  // Require Netlify Identity auth
  const user = context.clientContext && context.clientContext.user;
  if (!user) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  try {
    const { content, format } = JSON.parse(event.body || '{}');
    if (!content || !format || !['pdf', 'docx'].includes(format)) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing or invalid body. Expected { content, format: "pdf"|"docx" }' }) };
    }

    const timestamp = Date.now();
    const filename = `response-${timestamp}.${format}`;

    if (format === 'docx') {
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [new Paragraph(content)]
          }
        ]
      });

      const buffer = await Packer.toBuffer(doc);

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${filename}"`
        },
        isBase64Encoded: true,
        body: buffer.toString('base64')
      };
    }

    // PDF
    const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
    const chunks = [];
    return await new Promise((resolve) => {
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve({
          statusCode: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${filename}"`
          },
          isBase64Encoded: true,
          body: pdfBuffer.toString('base64')
        });
      });

      // Simple text rendering with basic wrapping
      doc.fontSize(12).text(content, { align: 'left' });
      doc.end();
    });
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};

