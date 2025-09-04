const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph } = require('docx');
const PDFDocument = require('pdfkit');

const TEMPLATE_MAP = {
  'fnol': '/assets/docs/core/fnol-template.docx',
  'proof-of-loss': '/assets/docs/core/proof-of-loss.docx',
  'appeal-letter': '/assets/docs/escalation/appeal-letter.docx',
  'demand-letter': '/assets/docs/escalation/demand-letter.docx',
  'evidence-log': '/assets/docs/specialty/evidence-log.xlsx',
  'claim-sequence': '/assets/docs/core/claim-sequence-guide.pdf'
};

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case '.pdf':
      return 'application/pdf';
    case '.xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    default:
      return 'application/octet-stream';
  }
}

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'GET') {
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
    const name = (event.queryStringParameters?.name || '').toLowerCase();
    if (!name || !TEMPLATE_MAP[name]) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing or invalid template name' })
      };
    }

    const relPath = TEMPLATE_MAP[name];
    const absPath = path.join(process.cwd(), relPath.startsWith('/') ? `.${relPath}` : relPath);

    if (fs.existsSync(absPath)) {
      const content = fs.readFileSync(absPath);
      const mime = getMimeType(absPath);
      const filename = path.basename(absPath);

      return {
        statusCode: 200,
        headers: {
          'Content-Type': mime,
          'Content-Disposition': `attachment; filename="${filename}"`
        },
        body: Buffer.from(content).toString('base64'),
        isBase64Encoded: true
      };
    }

    // Fallback: generate on the fly based on expected extension
    const ext = path.extname(relPath).toLowerCase();
    const baseName = path.basename(relPath);
    const title = baseName.replace(/[-_]/g, ' ').replace(/\.[^.]+$/, '').replace(/\b\w/g, c => c.toUpperCase());

    if (ext === '.pdf') {
      const pdfDoc = new PDFDocument({ size: 'LETTER', margin: 50 });
      const chunks = [];
      return await new Promise((resolve, reject) => {
        pdfDoc.on('data', d => chunks.push(d));
        pdfDoc.on('end', () => {
          const buffer = Buffer.concat(chunks);
          resolve({
            statusCode: 200,
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename="${baseName}"`
            },
            body: buffer.toString('base64'),
            isBase64Encoded: true
          });
        });
        pdfDoc.on('error', reject);
        pdfDoc.fontSize(18).text(`${title}`, { align: 'center' }).moveDown();
        pdfDoc.fontSize(12).text('This is a placeholder sample template generated on demand. Replace with your production template under assets/docs.', { align: 'left' });
        pdfDoc.end();
      });
    }

    if (ext === '.xlsx') {
      // Fallback to CSV for evidence log if XLSX asset is missing
      const csv = 'Date,Item,Description,Amount,Notes\n2025-01-01,Expense,Sample entry,0,Placeholder template';
      const filename = baseName.replace(/\.xlsx$/, '.csv');
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`
        },
        body: Buffer.from(csv).toString('base64'),
        isBase64Encoded: true
      };
    }

    // Default to DOCX fallback
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({ text: title }),
            new Paragraph({ text: '' }),
            new Paragraph({ text: 'This is a placeholder sample template generated on demand. Replace with your production template under assets/docs.' })
          ]
        }
      ]
    });
    const buffer = await Packer.toBuffer(doc);
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${baseName.replace(/\.[^.]+$/, '.docx')}"`
      },
      body: buffer.toString('base64'),
      isBase64Encoded: true
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to load template', message: error.message })
    };
  }
};

