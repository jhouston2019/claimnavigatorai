exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { analysisType, text } = body;

    if (!text) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'text is required' })
      };
    }

    // Demo analysis based on type
    let analysis = '';
    
    switch (analysisType) {
      case 'damage_assessment':
        analysis = `## Damage Assessment Analysis\n\n**Input:** ${text}\n\n### Key Findings:\n- Structural damage assessment needed\n- Professional inspection recommended\n- Documentation requirements identified\n\n### Recommendations:\n1. Schedule professional inspection\n2. Document all visible damage\n3. Obtain multiple estimates\n4. Review policy coverage\n\n### Next Steps:\n- Gather supporting documentation\n- Prepare detailed claim submission\n- Consider expert consultation`;
        break;
      case 'estimate_comparison':
        analysis = `## Estimate Comparison Analysis\n\n**Input:** ${text}\n\n### Comparison Results:\n- Contractor estimate: $X,XXX\n- Insurance estimate: $X,XXX\n- Gap identified: $X,XXX\n\n### Analysis:\n- Significant variance between estimates\n- Additional documentation needed\n- Professional review recommended\n\n### Recommendations:\n1. Request detailed breakdown from contractor\n2. Challenge insurance estimate if low\n3. Consider independent appraisal\n4. Document all discrepancies`;
        break;
      case 'business_interruption':
        analysis = `## Business Interruption Analysis\n\n**Input:** ${text}\n\n### Impact Assessment:\n- Lost revenue calculation\n- Additional expenses identified\n- Recovery timeline estimated\n\n### Financial Impact:\n- Daily lost income: $XXX\n- Additional expenses: $XXX\n- Total impact: $XXX\n\n### Documentation Needed:\n1. Financial records (P&L statements)\n2. Revenue projections\n3. Expense documentation\n4. Recovery timeline`;
        break;
      case 'settlement_analysis':
        analysis = `## Settlement Analysis\n\n**Input:** ${text}\n\n### Settlement Review:\n- Offer amount: $XXX,XXX\n- Policy coverage: $XXX,XXX\n- Gap analysis: $XXX,XXX\n\n### Key Issues:\n- Coverage limitations identified\n- Additional damages not included\n- Documentation gaps\n\n### Recommendations:\n1. Review policy terms carefully\n2. Document all covered damages\n3. Challenge low estimates\n4. Consider professional consultation`;
        break;
      default:
        analysis = `## General Analysis\n\n**Input:** ${text}\n\n### Analysis Summary:\nThis is a demo analysis. In production, this would provide detailed AI-powered analysis based on your specific claim details.\n\n### Key Points:\n- Review all documentation\n- Understand policy coverage\n- Document everything thoroughly\n- Consider professional advice\n\n### Next Steps:\n1. Gather supporting evidence\n2. Review policy terms\n3. Prepare detailed response\n4. Consider expert consultation`;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        analysis,
        assessment: analysis,
        comparison: analysis,
        report: analysis,
        type: analysisType,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
