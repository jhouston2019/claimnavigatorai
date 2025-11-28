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
    const { fileName, fileType, fileSize, ocrText } = body;
    
    // Log event
    await LOG_EVENT('ai_request', 'ai-categorize-evidence', { payload: body });
    
    const startTime = Date.now();
    
    const prompt = `
You are an insurance evidence assistant. Based on filename, file type, and any extracted text content, classify this evidence file into one of these categories and provide relevant tags and summary.

Categories: photos, documents, receipts, other

For each file, analyze:
1. File name patterns (e.g., "receipt", "invoice", "photo", "damage")
2. File type (images vs documents)
3. Any extracted text content
4. File size (large files might be photos)

Output JSON only with this exact format:
{
  "category": "photos|documents|receipts|other",
  "tags": ["tag1", "tag2", "tag3"],
  "summary": "Brief description of what this file contains",
  "confidence": 85
}

File details:
- Name: ${fileName}
- Type: ${fileType}
- Size: ${fileSize} bytes
- Extracted text: ${ocrText || "None available"}

Focus on insurance claim context. Photos of damage, receipts for expenses, official documents, etc.
`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 300
    });

    const result = response.choices[0].message.content;
    
    // Try to parse the JSON response
    let parsedResult;
    try {
      parsedResult = JSON.parse(result);
    } catch (parseError) {
      // Fallback if AI doesn't return valid JSON
      parsedResult = {
        category: "other",
        tags: ["unclassified"],
        summary: "Unable to categorize this file",
        confidence: 0
      };
    }

    const endTime = Date.now();
    const durationMs = endTime - startTime;

    // Log usage
    await LOG_USAGE({
      function: 'ai-categorize-evidence',
      duration_ms: durationMs,
      input_token_estimate: 0,
      output_token_estimate: 0,
      success: true
    });

    // Log cost
    await LOG_COST({
      function: 'ai-categorize-evidence',
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
      function: 'ai-categorize-evidence',
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

