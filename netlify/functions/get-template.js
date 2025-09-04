const { getStore } = require("@netlify/blobs");
const PDFDocument = require("pdfkit");
const { Document, Packer, Paragraph } = require("docx");

// Define at least 20 core templates. Stored text is used to generate DOCX/PDF on demand and cached in Netlify Blobs.
const TEMPLATES = [
  { key: 'fnol', title: 'First Notice of Loss (FNOL)', category: 'core', body: base("First Notice of Loss (FNOL)") },
  { key: 'proof-of-loss', title: 'Proof of Loss', category: 'core', body: base("Proof of Loss") },
  { key: 'appeal-letter', title: 'Appeal Letter', category: 'letters', body: base("Appeal Letter") },
  { key: 'demand-letter', title: 'Demand Letter', category: 'letters', body: base("Demand Letter") },
  { key: 'estimate-request', title: 'Estimate Request', category: 'requests', body: base("Estimate Request") },
  { key: 'partial-denial-response', title: 'Partial Denial Response', category: 'responses', body: base("Partial Denial Response") },
  { key: 'full-denial-response', title: 'Full Denial Response', category: 'responses', body: base("Full Denial Response") },
  { key: 'supplement-request', title: 'Supplement Request', category: 'requests', body: base("Supplement Request") },
  { key: 'underpayment-dispute', title: 'Underpayment Dispute', category: 'disputes', body: base("Underpayment Dispute") },
  { key: 'coverage-clarification', title: 'Coverage Clarification Request', category: 'requests', body: base("Coverage Clarification Request") },
  { key: 'reservation-of-rights-response', title: 'Reservation of Rights Response', category: 'responses', body: base("Reservation of Rights Response") },
  { key: 'appraisal-demand', title: 'Appraisal Demand', category: 'demands', body: base("Appraisal Demand") },
  { key: 'umpire-request', title: 'Umpire Request', category: 'requests', body: base("Umpire Request") },
  { key: 'inspection-request', title: 'Inspection Request', category: 'requests', body: base("Inspection Request") },
  { key: 'reinspection-request', title: 'Reinspection Request', category: 'requests', body: base("Reinspection Request") },
  { key: 'claim-status-update', title: 'Claim Status Update Request', category: 'requests', body: base("Claim Status Update Request") },
  { key: 'proof-of-repairs', title: 'Proof of Repairs Submission', category: 'submissions', body: base("Proof of Repairs Submission") },
  { key: 'time-limit-demand', title: 'Time-Limit Demand', category: 'demands', body: base("Time-Limit Demand") },
  { key: 'good-faith-communication', title: 'Good Faith Communication Notice', category: 'notices', body: base("Good Faith Communication Notice") },
  { key: 'final-demand', title: 'Final Demand', category: 'demands', body: base("Final Demand") },
  { key: 'espanol-carta-demanda', title: 'Carta de Demanda (Español)', category: 'spanish', body: base("Carta de Demanda (Español)") },
  { key: 'espanol-prueba-de-perdida', title: 'Prueba de Pérdida (Español)', category: 'spanish', body: base("Prueba de Pérdida (Español)") },
];

function base(title) {
  return `${title}\n\n` +
    `This template provides a professional structure for claim communications. Replace bracketed sections with your claim-specific details.\n\n` +
    `Claim Number: [CLAIM_NUMBER]\nPolicy Number: [POLICY_NUMBER]\nDate of Loss: [DATE_OF_LOSS]\nInsured: [INSURED_NAME]\nAddress: [ADDRESS]\n\n` +
    `Dear [ADJUSTER_NAME],\n\n[INTRODUCTION AND PURPOSE]\n\n[FACTS AND SUPPORTING DETAILS]\n\n[REQUESTS OR DEMANDS]\n\nPlease confirm receipt and provide a response within [TIMEFRAME].\n\nSincerely,\n[YOUR_NAME]\n[YOUR_CONTACT]`;
}

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  // Require authenticated user
  const user = context.clientContext && context.clientContext.user;
  if (!user) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  const templateKey = event.queryStringParameters && event.queryStringParameters.template;
  const format = (event.queryStringParameters && event.queryStringParameters.format || 'docx').toLowerCase();

  if (!templateKey) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing template parameter' }) };
  }
  if (!['docx', 'pdf'].includes(format)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid format' }) };
  }

  const found = TEMPLATES.find(t => t.key === templateKey);
  if (!found) {
    return { statusCode: 404, body: JSON.stringify({ error: 'Template not found' }) };
  }

  try {
    const templatesStore = getStore('templates');
    const key = `${found.category}/${templateKey}.${format}`;

    // Try fetch from cache
    const existing = await templatesStore.get(key);
    if (existing) {
      return streamOut(existing, format, `${templateKey}.${format}`);
    }

    // Generate
    let buffer;
    if (format === 'docx') {
      const doc = new Document({ sections: [{ properties: {}, children: found.body.split(/\n\n+/).map(p => new Paragraph(p)) }] });
      buffer = await Packer.toBuffer(doc);
    } else {
      buffer = await createPdfBuffer(found.title, found.body);
    }

    // Cache
    await templatesStore.set(key, buffer, { contentType: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

    return streamOut(buffer, format, `${templateKey}.${format}`);
  } catch (error) {
    console.error('get-template error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to get template', message: error.message }) };
  }
};

function streamOut(buffer, format, filename) {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, max-age=3600'
    },
    body: buffer.toString('base64'),
    isBase64Encoded: true
  };
}

function createPdfBuffer(title, body) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(16).text(title, { underline: true });
    doc.moveDown();
    doc.fontSize(12);
    body.split(/\n\n+/).forEach((p) => {
      doc.text(p);
      doc.moveDown();
    });
    doc.end();
  });
}

