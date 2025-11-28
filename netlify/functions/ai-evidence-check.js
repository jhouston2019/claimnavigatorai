import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const { LOG_EVENT, LOG_ERROR, LOG_USAGE, LOG_COST } = require('./_utils');

export async function handler(event) {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const body = JSON.parse(event.body);
    const { claimType, uploadedCategories, claimDetails } = body;
    
    // Log event
    await LOG_EVENT('ai_request', 'ai-evidence-check', { payload: body });
    
    const startTime = Date.now();
    
    const prompt = `
You are an insurance claim documentation expert analyzing the completeness of evidence for a claim.

Claim Type: ${claimType || 'General Property Claim'}
Uploaded Evidence Categories: ${uploadedCategories.join(', ')}

Based on the uploaded evidence categories, identify:
1. Missing critical evidence types
2. Recommended additional documentation
3. Priority level for each missing item

Consider these standard evidence types for insurance claims:
- Photos (damage, property, receipts)
- Official documents (police reports, estimates, invoices)
- Receipts (repairs, temporary housing, replacement items)
- Correspondence (emails, letters with insurance company)
- Medical records (if applicable)
- Witness statements
- Expert reports

Output JSON only with this exact format:
{
  "missing": ["missing evidence type 1", "missing evidence type 2"],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "completeness_score": 75,
  "priority_items": ["high priority item 1", "high priority item 2"]
}

Focus on what's typically required for a strong insurance claim. Be specific about evidence types that are missing.
`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 400
    });

    const result = response.choices[0].message.content;
    
    // Try to parse the JSON response
    let parsedResult;
    try {
      parsedResult = JSON.parse(result);
    } catch (parseError) {
      // Fallback if AI doesn't return valid JSON
      parsedResult = {
        missing: ["Unable to analyze evidence completeness"],
        recommendations: ["Please review your documentation with an insurance professional"],
        completeness_score: 0,
        priority_items: ["Contact your insurance company for guidance"]
      };
    }

    const endTime = Date.now();
    const durationMs = endTime - startTime;

    // Log usage
    await LOG_USAGE({
      function: 'ai-evidence-check',
      duration_ms: durationMs,
      input_token_estimate: 0,
      output_token_estimate: 0,
      success: true
    });

    // Log cost
    await LOG_COST({
      function: 'ai-evidence-check',
      estimated_cost_usd: 0.002
    });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ success: true, data: parsedResult, error: null })
    };

  } catch (error) {
    await LOG_ERROR('ai_error', {
      function: 'ai-evidence-check',
      message: error.message,
      stack: error.stack
    });
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        data: null,
        error: { code: 'CN-5000', message: error.message }
      })
    };
  }
}

