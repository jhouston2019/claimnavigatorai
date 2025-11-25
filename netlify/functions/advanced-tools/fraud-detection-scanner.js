/**
 * Fraud Detection Scanner
 * Identify potential insurance fraud patterns
 */

const pdfParse = require('pdf-parse');
const { runToolAIJSON } = require('../lib/advanced-tools-ai-helper');
const { createClient } = require('@supabase/supabase-js');

// Simple multipart parser
function parseMultipartForm(body, contentType) {
  const boundary = contentType.split('boundary=')[1];
  const parts = body.split(`--${boundary}`);
  
  let fileBuffer = null;
  let fileName = '';
  
  for (const part of parts) {
    if (part.includes('Content-Disposition') && part.includes('filename=')) {
      const filenameMatch = part.match(/filename="([^"]+)"/);
      if (filenameMatch) {
        fileName = filenameMatch[1];
      }
      
      const contentStart = part.indexOf('\r\n\r\n') + 4;
      const contentEnd = part.lastIndexOf('\r\n');
      const content = part.substring(contentStart, contentEnd);
      
      // Handle base64 encoding
      try {
        fileBuffer = Buffer.from(content, 'base64');
      } catch (e) {
        fileBuffer = Buffer.from(content);
      }
      break;
    }
  }
  
  return { fileBuffer, fileName };
}

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
    const contentType = event.headers['content-type'] || '';
    
    if (!contentType.includes('multipart/form-data')) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Multipart form data required' })
      };
    }

    const { fileBuffer, fileName } = parseMultipartForm(event.body, contentType);
    
    if (!fileBuffer) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No file found' })
      };
    }

    // Extract text
    let extractedText = '';
    if (fileName.endsWith('.pdf')) {
      const data = await pdfParse(fileBuffer);
      extractedText = data.text;
    } else if (fileName.match(/\.(jpg|jpeg|png)$/i)) {
      // For images, we'd need OCR - for now, return error or use OpenAI Vision
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Image OCR not yet implemented. Please use PDF.' })
      };
    } else {
      extractedText = fileBuffer.toString('utf-8');
    }

    if (!extractedText.trim()) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Could not extract text from file' })
      };
    }

    // AI fraud detection
    const userPrompt = `Analyze this insurance communication for fraud patterns and bad faith indicators:

${extractedText.substring(0, 8000)}

Provide:
1. A risk score from 0-100 (where 0 is no risk, 100 is high risk)
2. List of suspicious sections with type (delay, misstatement, policy misinterpretation, bad faith marker) and the specific text
3. Recommended actions for the policyholder

Format as JSON:
{
  "riskScore": <number>,
  "suspiciousSections": [
    {"type": "<type>", "text": "<excerpt>"}
  ],
  "recommendedActions": ["<action1>", "<action2>"]
}`;

    let result;
    try {
      result = await runToolAIJSON('fraud-detection-scanner', userPrompt, {
        model: 'gpt-4o',
        temperature: 0.3,
        max_tokens: 1500
      }, 'fraud-patterns');
    } catch (aiError) {
      console.error('AI fraud detection failed:', aiError);
      // Fallback
      result = {
        riskScore: 50,
        suspiciousSections: [],
        recommendedActions: ['Review the communication carefully', 'Consult with an attorney if concerns persist']
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        extractedText: extractedText.substring(0, 2000), // Limit response size
        riskScore: result.riskScore || 0,
        suspiciousSections: result.suspiciousSections || [],
        recommendedActions: result.recommendedActions || []
      })
    };

  } catch (error) {
    console.error('Fraud detection error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

