const { Document, Packer, Paragraph } = require('docx');
const PDFDocument = require('pdfkit');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };

  const user = context.clientContext && context.clientContext.user;
  if (!user) {
    return {
      statusCode: 401,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Unauthorized' })
    };
  }

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const content = typeof body.content === 'string' ? body.content : '';
    const format = (body.format || 'pdf').toLowerCase();

    if (!content || !['pdf', 'docx'].includes(format)) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid content or format' })
      };
    }

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
          ...headers,
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': 'attachment; filename="claimnavigator-document.docx"'
        },
        body: buffer.toString('base64'),
        isBase64Encoded: true
      };
    }

    // PDF
    const pdfBuffer = await new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(12);
      const title = 'ClaimNavigatorAI Document';
      doc.fontSize(18).text(title, { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(content, {
        align: 'left'
      });
      doc.end();
    });

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="claimnavigator-document.pdf"'
      },
      body: pdfBuffer.toString('base64'),
      isBase64Encoded: true
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to export document', message: error.message })
    };
  }
};

