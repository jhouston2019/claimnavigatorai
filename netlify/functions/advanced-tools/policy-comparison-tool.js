/**
 * Policy Comparison Tool
 * Compare multiple insurance policies side-by-side
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
    
    if (!files.policyA || !files.policyB) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Both Policy A and Policy B are required' })
      };
    }

    // Extract text from both policies
    const [textA, textB] = await Promise.all([
      extractTextFromPDF(files.policyA.buffer),
      extractTextFromPDF(files.policyB.buffer)
    ]);

    // AI comparison
    const userPrompt = `Compare these two insurance policies:

POLICY A:
${textA.substring(0, 4000)}

POLICY B:
${textB.substring(0, 4000)}

Provide:
1. Coverage sections for each policy (type and content)
2. Key differences between the policies
3. Exclusions comparison

Format as JSON:
{
  "policyA": {
    "sections": [
      {"type": "<coverage/exclusion/condition>", "content": "<summary>"}
    ]
  },
  "policyB": {
    "sections": [
      {"type": "<coverage/exclusion/condition>", "content": "<summary>"}
    ]
  },
  "differences": [
    {"category": "<category>", "description": "<description>"}
  ],
  "exclusions": ["<exclusion1>", "<exclusion2>"]
}`;

    const aiResponse = await runToolAIJSON('policy-comparison-tool', userPrompt, {
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
        policyA: { sections: [] },
        policyB: { sections: [] },
        differences: [],
        exclusions: []
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('Policy comparison error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

