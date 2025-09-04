const fs = require('fs');
const path = require('path');

const TEMPLATE_MAP = {
  'fnol': {
    file: path.join(process.cwd(), 'assets/docs/core/fnol-template.docx'),
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  },
  'proof-of-loss': {
    file: path.join(process.cwd(), 'assets/docs/core/proof-of-loss.docx'),
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  },
  'appeal-letter': {
    file: path.join(process.cwd(), 'assets/docs/escalation/appeal-letter.docx'),
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  },
  'demand-letter': {
    file: path.join(process.cwd(), 'assets/docs/escalation/demand-letter.docx'),
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  },
  'evidence-log': {
    file: path.join(process.cwd(), 'assets/docs/specialty/evidence-log.xlsx'),
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  },
  'claim-sequence': {
    file: path.join(process.cwd(), 'assets/docs/core/claim-sequence-guide.pdf'),
    type: 'application/pdf'
  }
};

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  // Require Netlify Identity auth
  const user = context.clientContext && context.clientContext.user;
  if (!user) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  try {
    const params = event.queryStringParameters || {};
    const name = (params.name || '').toLowerCase();
    const mapping = TEMPLATE_MAP[name];

    if (!mapping) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Template not found' }) };
    }

    if (!fs.existsSync(mapping.file)) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Template file missing on server' }) };
    }

    const fileBuffer = fs.readFileSync(mapping.file);
    const filename = path.basename(mapping.file);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': mapping.type,
        'Content-Disposition': `attachment; filename="${filename}"`
      },
      isBase64Encoded: true,
      body: fileBuffer.toString('base64')
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};

