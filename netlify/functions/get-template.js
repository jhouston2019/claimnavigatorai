const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const { Document, Packer, Paragraph, HeadingLevel } = require('docx');

// Map template names to category and filename under /assets/docs
const TEMPLATE_MAP = {
  'fnol': { title: 'First Notice of Loss', category: 'claims', filename: 'fnol.docx' },
  'proof-of-loss': { title: 'Proof of Loss', category: 'claims', filename: 'proof-of-loss.docx' },
  'appeal-letter': { title: 'Appeal Letter', category: 'letters', filename: 'appeal-letter.docx' },
  'demand-letter': { title: 'Demand Letter', category: 'letters', filename: 'demand-letter.docx' },
  'evidence-log': { title: 'Evidence Log', category: 'logs', filename: 'evidence-log.docx' },
  'claim-sequence-guide': { title: 'Claim Sequence Guide', category: 'guides', filename: 'claim-sequence-guide.pdf' },
  'inspection-request': { title: 'Inspection Request', category: 'letters', filename: 'inspection-request.docx' },
  'status-update-request': { title: 'Status Update Request', category: 'letters', filename: 'status-update-request.docx' },
  'documentation-request': { title: 'Documentation Request', category: 'letters', filename: 'documentation-request.docx' },
  'nonresponse-followup': { title: 'Non-Response Follow-Up', category: 'letters', filename: 'nonresponse-followup.docx' },
  'bad-faith-notice': { title: 'Bad Faith Notice', category: 'letters', filename: 'bad-faith-notice.docx' },
  'appeal-underpayment': { title: 'Underpayment Appeal', category: 'letters', filename: 'appeal-underpayment.docx' },
  'coverage-dispute': { title: 'Coverage Dispute Letter', category: 'letters', filename: 'coverage-dispute.docx' },
  'euos-prep': { title: 'EUO Preparation Guide', category: 'guides', filename: 'euos-prep.pdf' },
  'mediation-brief': { title: 'Mediation Brief', category: 'briefs', filename: 'mediation-brief.docx' },
  'arb-brief': { title: 'Arbitration Brief', category: 'briefs', filename: 'arbitration-brief.docx' },
  'claim-timeline': { title: 'Claim Timeline', category: 'logs', filename: 'claim-timeline.docx' },
  'call-log': { title: 'Carrier Call Log', category: 'logs', filename: 'call-log.docx' },
  'document-index': { title: 'Document Index', category: 'logs', filename: 'document-index.docx' },
  'settlement-offer': { title: 'Settlement Offer Letter', category: 'letters', filename: 'settlement-offer.docx' }
};

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const user = context.clientContext?.user;
  if (!user) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized - Please login' }) };
  }

  const name = event.queryStringParameters?.name;
  if (!name || !TEMPLATE_MAP[name]) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing or invalid template name' }) };
  }

  const info = TEMPLATE_MAP[name];
  const filePath = path.join(process.cwd(), 'assets', 'docs', info.category, info.filename);
  const ext = path.extname(info.filename).toLowerCase();

  try {
    if (fs.existsSync(filePath)) {
      const buffer = fs.readFileSync(filePath);
      const contentType = ext === '.pdf'
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      return {
        statusCode: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${info.filename}"`,
          'Cache-Control': 'private, max-age=3600'
        },
        body: buffer.toString('base64'),
        isBase64Encoded: true
      };
    }
  } catch (err) {
    // Fall through to dynamic generation
  }

  try {
    // Dynamically generate a basic template if file not present in repo
    if (ext === '.pdf') {
      const buffer = await generatePdf(info.title);
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${info.filename}"`,
          'Cache-Control': 'private, max-age=3600'
        },
        body: buffer.toString('base64'),
        isBase64Encoded: true
      };
    } else {
      const buffer = await generateDocx(info.title);
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${info.filename}"`,
          'Cache-Control': 'private, max-age=3600'
        },
        body: buffer.toString('base64'),
        isBase64Encoded: true
      };
    }
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to generate template', message: error.message }) };
  }
};

async function generatePdf(title) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.fontSize(18).text(`ClaimNavigatorAI — ${title}`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(11).text(`This is a professionally formatted template: ${title}. Customize fields as needed for your claim.`);
    doc.end();
  });
}

async function generateDocx(title) {
  const paragraphs = [];
  paragraphs.push(new Paragraph({ text: `ClaimNavigatorAI — ${title}`, heading: HeadingLevel.HEADING_1 }));
  paragraphs.push(new Paragraph(''));
  paragraphs.push(new Paragraph('This is a professionally formatted template. Customize fields as needed for your claim.'));
  const doc = new Document({ sections: [{ properties: {}, children: paragraphs }] });
  return await Packer.toBuffer(doc);
}

