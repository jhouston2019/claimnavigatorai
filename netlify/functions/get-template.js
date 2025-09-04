const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const { Document, Packer, Paragraph } = require('docx');
const { getStore } = require('@netlify/blobs');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const user = context.clientContext && context.clientContext.user;
  if (!user) {
    return { statusCode: 401, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  try {
    const { name } = event.queryStringParameters || {};
    if (!name) {
      return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'name is required' }) };
    }

    const mapping = buildTemplateMap();
    const entry = mapping[name];
    if (!entry) {
      return { statusCode: 404, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Template not found' }) };
    }

    if (entry.type === 'file') {
      const filePath = path.join(process.cwd(), entry.path);
      const ext = path.extname(filePath).toLowerCase();
      const contentType = ext === '.pdf'
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

      const buffer = fs.readFileSync(filePath);
      return {
        statusCode: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${path.basename(filePath)}"`,
          'Cache-Control': 'private, max-age=3600'
        },
        body: buffer.toString('base64'),
        isBase64Encoded: true
      };
    }

    if (entry.type === 'blob') {
      const store = getStore(entry.store || 'templates');
      const buffer = await store.get(entry.key);
      if (!buffer) {
        const generated = await generateTemplateBuffer(entry.key);
        if (!generated) {
          return { statusCode: 404, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Template not found in storage' }) };
        }
        await store.set(entry.key, generated.buffer, { contentType: generated.contentType, metadata: { generated: 'true' } });
        return {
          statusCode: 200,
          headers: {
            'Content-Type': generated.contentType,
            'Content-Disposition': `attachment; filename="${path.basename(entry.key)}"`,
            'Cache-Control': 'private, max-age=3600'
          },
          body: generated.buffer.toString('base64'),
          isBase64Encoded: true
        };
      }

      const ext = path.extname(entry.key).toLowerCase();
      const contentType = ext === '.pdf'
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

      return {
        statusCode: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${path.basename(entry.key)}"`,
          'Cache-Control': 'private, max-age=3600'
        },
        body: buffer.toString('base64'),
        isBase64Encoded: true
      };
    }

    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Invalid template mapping' }) };
  } catch (error) {
    console.error('get-template error:', error);
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Failed to get template', message: error.message }) };
  }
};

function buildTemplateMap() {
  // name -> file path or blob key; extend as needed
  const base = 'assets/docs';
  const map = {};

  const entries = [
    { name: 'fnol', file: `${base}/claims/FNOL.docx` },
    { name: 'fnol-pdf', file: `${base}/claims/FNOL.pdf` },
    { name: 'proof-of-loss', file: `${base}/claims/Proof-of-Loss.docx` },
    { name: 'proof-of-loss-pdf', file: `${base}/claims/Proof-of-Loss.pdf` },
    { name: 'appeal-letter', file: `${base}/letters/Appeal-Letter.docx` },
    { name: 'appeal-letter-pdf', file: `${base}/letters/Appeal-Letter.pdf` },
    { name: 'demand-letter', file: `${base}/letters/Demand-Letter.docx` },
    { name: 'demand-letter-pdf', file: `${base}/letters/Demand-Letter.pdf` },
    { name: 'estimate-request', file: `${base}/requests/Estimate-Request.docx` },
    { name: 'estimate-request-pdf', file: `${base}/requests/Estimate-Request.pdf` },
    { name: 'inspection-request', file: `${base}/requests/Inspection-Request.docx` },
    { name: 'inspection-request-pdf', file: `${base}/requests/Inspection-Request.pdf` },
    { name: 'status-update', file: `${base}/letters/Status-Update.docx` },
    { name: 'status-update-pdf', file: `${base}/letters/Status-Update.pdf` },
    { name: 'claim-reopen', file: `${base}/letters/Claim-Reopen.docx` },
    { name: 'claim-reopen-pdf', file: `${base}/letters/Claim-Reopen.pdf` },
    { name: 'uap-request', file: `${base}/requests/Underpayment-Appeal.docx` },
    { name: 'uap-request-pdf', file: `${base}/requests/Underpayment-Appeal.pdf` },
    { name: 'supplement-request', file: `${base}/requests/Supplement-Request.docx` },
    { name: 'supplement-request-pdf', file: `${base}/requests/Supplement-Request.pdf` },
    { name: 'coverage-confirmation', file: `${base}/letters/Coverage-Confirmation.docx` },
    { name: 'coverage-confirmation-pdf', file: `${base}/letters/Coverage-Confirmation.pdf` },
    { name: 'estimate-dispute', file: `${base}/letters/Estimate-Dispute.docx` },
    { name: 'estimate-dispute-pdf', file: `${base}/letters/Estimate-Dispute.pdf` },
    { name: 'payment-demand', file: `${base}/letters/Payment-Demand.docx` },
    { name: 'payment-demand-pdf', file: `${base}/letters/Payment-Demand.pdf` },
    { name: 'proof-of-repair', file: `${base}/claims/Proof-of-Repair.docx` },
    { name: 'proof-of-repair-pdf', file: `${base}/claims/Proof-of-Repair.pdf` },
    { name: 'euos-request', file: `${base}/requests/EUO-Request.docx` },
    { name: 'euos-request-pdf', file: `${base}/requests/EUO-Request.pdf` },
    { name: 'document-request', file: `${base}/requests/Document-Request.docx` },
    { name: 'document-request-pdf', file: `${base}/requests/Document-Request.pdf` },
    { name: 'mediation-request', file: `${base}/requests/Mediation-Request.docx` },
    { name: 'mediation-request-pdf', file: `${base}/requests/Mediation-Request.pdf` },
    { name: 'appraisal-demand', file: `${base}/requests/Appraisal-Demand.docx` },
    { name: 'appraisal-demand-pdf', file: `${base}/requests/Appraisal-Demand.pdf` },
    { name: 'rfi-response', file: `${base}/letters/RFI-Response.docx` },
    { name: 'rfi-response-pdf', file: `${base}/letters/RFI-Response.pdf` },
    { name: 'bad-faith-notice', file: `${base}/letters/Bad-Faith-Notice.docx` },
    { name: 'bad-faith-notice-pdf', file: `${base}/letters/Bad-Faith-Notice.pdf` },
  ];

  for (const e of entries) {
    const absolute = path.join(process.cwd(), e.file);
    if (fs.existsSync(absolute)) {
      map[e.name] = { type: 'file', path: e.file };
    } else {
      const key = e.file.replace(`${base}/`, '');
      map[e.name] = { type: 'blob', store: 'templates', key };
    }
  }

  return map;
}

async function generateTemplateBuffer(relativeKey) {
  const ext = path.extname(relativeKey).toLowerCase();
  const baseName = path.basename(relativeKey, ext).replace(/[-_]/g, ' ');
  const title = `${baseName} Template`;

  if (ext === '.docx') {
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({ text: 'ClaimNavigatorAI' }),
            new Paragraph({ text: title }),
            new Paragraph({ text: '' }),
            new Paragraph({ text: 'Instructions:' }),
            new Paragraph({ text: '1) Replace placeholder fields with your claim details.' }),
            new Paragraph({ text: '2) Review for accuracy before sending to your insurer.' }),
            new Paragraph({ text: '' }),
            new Paragraph({ text: 'Body:' }),
            new Paragraph({ text: '[Insert claim number, date of loss, and relevant facts here.]' }),
          ]
        }
      ]
    });
    const buffer = await Packer.toBuffer(doc);
    return { buffer, contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };
  }

  if (ext === '.pdf') {
    const pdf = new PDFDocument({ size: 'LETTER', margin: 50 });
    pdf.fontSize(20).text('ClaimNavigatorAI', { align: 'center' });
    pdf.moveDown();
    pdf.fontSize(16).text(title, { align: 'left' });
    pdf.moveDown();
    pdf.fontSize(12).text('Instructions:', { underline: true });
    pdf.text('1) Replace placeholder fields with your claim details.');
    pdf.text('2) Review for accuracy before sending to your insurer.');
    pdf.moveDown();
    pdf.text('Body:');
    pdf.text('[Insert claim number, date of loss, and relevant facts here.]');
    pdf.end();
    const buffer = await streamToBuffer(pdf);
    return { buffer, contentType: 'application/pdf' };
  }

  return null;
}

function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

