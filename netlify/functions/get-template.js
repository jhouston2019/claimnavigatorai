const fs = require('fs');
const path = require('path');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };

  const user = context.clientContext && context.clientContext.user;
  if (!user) {
    return { statusCode: 401, headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  const name = event.queryStringParameters && event.queryStringParameters.name;
  if (!name) {
    return { statusCode: 400, headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Template name required' }) };
  }

  const baseDir = path.join(process.cwd(), 'assets', 'docs');

  const mapping = {
    'fnol': 'claims/fnol.docx',
    'proof-of-loss': 'claims/proof-of-loss.docx',
    'appeal-letter': 'letters/appeal-letter.docx',
    'demand-letter': 'letters/demand-letter.docx',
    'evidence-log': 'logs/evidence-log.docx',
    'claim-sequence-guide': 'guides/claim-sequence-guide.pdf',
    'status-update-letter': 'letters/status-update-letter.docx',
    'reservation-of-rights-response': 'letters/ror-response.docx',
    'policy-limit-demand': 'letters/policy-limit-demand.docx',
    'bad-faith-notice': 'letters/bad-faith-notice.docx',
    'supplement-request': 'letters/supplement-request.docx',
    'inspection-request': 'letters/inspection-request.docx',
    'estimate-dispute': 'letters/estimate-dispute.docx',
    'um-uim-demand': 'letters/um-uim-demand.docx',
    'medical-bill-summary': 'forms/medical-bill-summary.docx',
    'witness-statement': 'forms/witness-statement.docx',
    'timeline': 'logs/timeline.docx',
    'call-log': 'logs/call-log.docx',
    'eob-challenge': 'letters/eob-challenge.docx',
    'proof-of-mailing': 'forms/proof-of-mailing.docx'
  };

  const relative = mapping[name];
  if (!relative) {
    return { statusCode: 404, headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Template not found' }) };
  }

  const filePath = path.join(baseDir, relative);
  try {
    const data = fs.readFileSync(filePath);
    const isPDF = filePath.toLowerCase().endsWith('.pdf');
    const contentType = isPDF ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    const filename = path.basename(filePath);
    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, max-age=3600'
      },
      body: data.toString('base64'),
      isBase64Encoded: true
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to load template', message: error.message })
    };
  }
};

