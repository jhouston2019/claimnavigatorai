/**
 * Arbitration Strategy Guide
 * Prepare for arbitration/appraisal proceedings
 */

const pdfParse = require('pdf-parse');
const { runToolAIJSON } = require('../lib/advanced-tools-ai-helper');

// Simple multipart parser
function parseMultipartForm(body, contentType) {
  const boundary = contentType.split('boundary=')[1];
  const parts = body.split(`--${boundary}`);
  
  const files = {};
  
  for (const part of parts) {
    if (part.includes('Content-Disposition')) {
      const nameMatch = part.match(/name="([^"]+)"/);
      const filenameMatch = part.match(/filename="([^"]+)"/);
      
      if (nameMatch && filenameMatch) {
        const name = nameMatch[1];
        const fileName = filenameMatch[1];
        
        const contentStart = part.indexOf('\r\n\r\n') + 4;
        const contentEnd = part.lastIndexOf('\r\n');
        const content = part.substring(contentStart, contentEnd);
        
        try {
          files[name] = {
            buffer: Buffer.from(content, 'base64'),
            fileName
          };
        } catch (e) {
          files[name] = {
            buffer: Buffer.from(content),
            fileName
          };
        }
      } else if (nameMatch && !filenameMatch) {
        // Regular form field
        const name = nameMatch[1];
        const contentStart = part.indexOf('\r\n\r\n') + 4;
        const contentEnd = part.lastIndexOf('\r\n');
        files[name] = part.substring(contentStart, contentEnd);
      }
    }
  }
  
  return files;
}

async function extractTextFromPDF(buffer) {
  const data = await pdfParse(buffer);
  return data.text;
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

    const files = parseMultipartForm(event.body, contentType);
    
    if (!files.carrierEstimate || !files.userEstimate) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Both estimates are required' })
      };
    }

    // Extract text from both estimates
    const [carrierText, userText] = await Promise.all([
      extractTextFromPDF(files.carrierEstimate.buffer),
      extractTextFromPDF(files.userEstimate.buffer)
    ]);

    const disagreementDescription = files.disagreementDescription || '';
    const arbitrationType = files.arbitrationType || 'binding';

    // AI strategy guide generation
    const userPrompt = `Generate an arbitration strategy guide:

CARRIER ESTIMATE:
${carrierText.substring(0, 2000)}

USER ESTIMATE:
${userText.substring(0, 2000)}

DISAGREEMENT:
${disagreementDescription}

ARBITRATION TYPE:
${arbitrationType}

Provide:
1. Strengths - Your position's strengths
2. Weaknesses - Areas of concern
3. Strategy Plan - Overall strategy
4. Evidence Needed - Evidence to gather
5. Expected Outcomes - Likely outcomes

Format as JSON:
{
  "strengths": ["<strength1>", "<strength2>"],
  "weaknesses": ["<weakness1>", "<weakness2>"],
  "strategyPlan": "<strategy>",
  "evidenceNeeded": ["<evidence1>", "<evidence2>"],
  "expectedOutcomes": "<outcomes>"
}`;

    const aiResponse = await runToolAIJSON('arbitration-strategy-guide', userPrompt, {
      model: 'gpt-4o',
      temperature: 0.3,
      max_tokens: 2000
    });

    // Parse AI response
    let result;
    try {
      // runToolAIJSON returns an object, but handle string fallback
      if (typeof aiResponse === 'object' && aiResponse !== null) {
        result = aiResponse;
      } else {
        const jsonMatch = String(aiResponse).match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found');
        }
      }
    } catch (parseError) {
      // Fallback
      result = {
        strengths: [],
        weaknesses: [],
        strategyPlan: 'Strategy plan to be developed.',
        evidenceNeeded: [],
        expectedOutcomes: 'Outcomes to be determined.'
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('Arbitration guide error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

