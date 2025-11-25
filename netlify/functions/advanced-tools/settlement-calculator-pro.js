/**
 * Settlement Calculator Pro
 * Advanced settlement valuation with AI sanity check
 */

const { runToolAI } = require('../lib/advanced-tools-ai-helper');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
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
    const { damageCategory, squareFootage, materialGrade, laborMultiplier = 1.5, depreciation = 0 } = body;

    if (!damageCategory || !squareFootage || !materialGrade) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Material cost per sqft by grade
    const materialCosts = {
      economy: 15,
      standard: 25,
      premium: 40,
      luxury: 65
    };

    // Base calculation
    const materialCostPerSqft = materialCosts[materialGrade] || 25;
    const baseMaterialCost = squareFootage * materialCostPerSqft;
    const laborCost = baseMaterialCost * laborMultiplier;
    const totalRCV = baseMaterialCost + laborCost;
    const depreciationAmount = totalRCV * (depreciation / 100);
    const totalACV = totalRCV - depreciationAmount;

    // Fair range (ACV ± 15%)
    const fairRangeLow = totalACV * 0.85;
    const fairRangeHigh = totalACV * 1.15;

    // AI sanity check
    const userPrompt = `Review this settlement calculation:
- Damage Category: ${damageCategory}
- Square Footage: ${squareFootage}
- Material Grade: ${materialGrade}
- Labor Multiplier: ${laborMultiplier}
- Depreciation: ${depreciation}%
- Total RCV: $${totalRCV.toLocaleString()}
- Total ACV: $${totalACV.toLocaleString()}
- Fair Range: $${fairRangeLow.toLocaleString()} - $${fairRangeHigh.toLocaleString()}

Provide brief professional notes on:
1. Whether the calculation appears reasonable
2. Any considerations or red flags
3. Recommendations for the policyholder

Keep response concise (3-4 sentences).`;

    let notes = '';
    try {
      notes = await runToolAI('settlement-calculator-pro', userPrompt, {
        model: 'gpt-4o-mini',
        temperature: 0.3,
        max_tokens: 300
      });
    } catch (aiError) {
      console.error('AI check failed:', aiError);
      notes = 'AI validation unavailable. Calculation completed.';
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        totalRCV: Math.round(totalRCV * 100) / 100,
        totalACV: Math.round(totalACV * 100) / 100,
        depreciation: Math.round(depreciationAmount * 100) / 100,
        fairRangeLow: Math.round(fairRangeLow * 100) / 100,
        fairRangeHigh: Math.round(fairRangeHigh * 100) / 100,
        notes
      })
    };

  } catch (error) {
    console.error('Settlement calculator error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

