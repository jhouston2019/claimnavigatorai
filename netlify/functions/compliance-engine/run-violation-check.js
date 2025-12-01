/**
 * Compliance Engine - Run Violation Check Endpoint
 * Check evidence for compliance violations
 */

const { runToolAIJSON, loadRuleset } = require('../../lib/advanced-tools-ai-helper');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { state, carrier, evidenceData } = body;

    if (!state || !carrier || !evidenceData) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields: state, carrier, evidenceData' })
      };
    }

    // Load compliance and fraud rulesets
    const complianceRules = await loadRuleset('compliance-rules');
    const fraudRules = await loadRuleset('fraud-patterns');
    
    // Build prompt
    let prompt = `Analyze this evidence for compliance requirements and potential violations:\n`;
    prompt += `State: ${state}\n`;
    prompt += `Carrier: ${carrier}\n`;
    prompt += `Evidence: ${JSON.stringify(evidenceData, null, 2)}\n\n`;
    prompt += `Determine:\n`;
    prompt += `1. Is this evidence compliance-critical?\n`;
    prompt += `2. Is it required by statute?\n`;
    prompt += `3. Is it required by carrier?\n`;
    prompt += `4. Is it a missing required document?\n`;
    prompt += `5. Does it affect proof-of-loss timing?\n`;
    prompt += `6. Does it affect documentation requirements?\n`;
    prompt += `7. Does it affect deadlines?\n`;
    prompt += `8. Does it trigger bad faith concerns?\n\n`;
    prompt += `Return JSON with: labels (array of applicable labels), complianceCritical (boolean), requiredByStatute (boolean), requiredByCarrier (boolean), missingRequired (boolean)\n`;

    // Call AI
    const aiResult = await runToolAIJSON(
      'compliance-engine',
      prompt,
      {
        model: 'gpt-4o-mini',
        temperature: 0.3,
        max_tokens: 1000
      },
      'compliance-rules'
    );

    // Parse labels
    let labels = [];
    if (aiResult.labels && Array.isArray(aiResult.labels)) {
      labels = aiResult.labels;
    } else {
      // Build labels from boolean flags
      if (aiResult.complianceCritical) labels.push('Compliance-Critical');
      if (aiResult.requiredByStatute) labels.push('Required by Statute');
      if (aiResult.requiredByCarrier) labels.push('Required by Carrier');
      if (aiResult.missingRequired) labels.push('Missing Required Document');
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ labels })
    };

  } catch (error) {
    console.error('Violation check error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to run violation check',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    };
  }
};


