const { Document, Packer, Paragraph } = require("docx");
const PDFDocument = require("pdfkit");

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
    const { content, format } = JSON.parse(event.body || '{}');
    const normalizedFormat = String(format || 'docx').toLowerCase();

    if (!content || (normalizedFormat !== 'docx' && normalizedFormat !== 'pdf')) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid request. Provide { content, format: "docx"|"pdf" }.' })
      };
    }

    const timestamp = Date.now();
    const filename = `response-${timestamp}.${normalizedFormat}`;

    if (normalizedFormat === 'docx') {
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [new Paragraph({ text: content })]
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
        body: buffer.toString('base64'),
        isBase64Encoded: true
      };
    }

    // PDF
    const pdfDoc = new PDFDocument({ size: 'LETTER', margin: 50 });
    const chunks = [];
    return await new Promise((resolve, reject) => {
      pdfDoc.on('data', (d) => chunks.push(d));
      pdfDoc.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve({
          statusCode: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${filename}"`
          },
          body: buffer.toString('base64'),
          isBase64Encoded: true
        });
      });
      pdfDoc.on('error', reject);

      pdfDoc.fontSize(12).text(content, { align: 'left' });
      pdfDoc.end();
    });
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to export document', message: error.message })
    };
  }
};

