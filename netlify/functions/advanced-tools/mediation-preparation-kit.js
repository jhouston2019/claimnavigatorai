/**
 * Mediation Preparation Kit
 * Prepare for mediation with comprehensive strategy
 */

const pdfParse = require('pdf-parse');
const { runToolAIJSON } = require('../lib/advanced-tools-ai-helper');

// Simple multipart parser
function parseMultipartForm(body, contentType) {
  const boundary = contentType.split('boundary=')[1];
  const parts = body.split(`--${boundary}`);
  
  const formData = {};
  let fileBuffer = null;
  let fileName = '';
  
  for (const part of parts) {
    if (part.includes('Content-Disposition')) {
      const nameMatch = part.match(/name="([^"]+)"/);
      const filenameMatch = part.match(/filename="([^"]+)"/);
      
      if (nameMatch) {
        const name = nameMatch[1];
        
        if (filenameMatch) {
          fileName = filenameMatch[1];
          const contentStart = part.indexOf('\r\n\r\n') + 4;
          const contentEnd = part.lastIndexOf('\r\n');
          const content = part.substring(contentStart, contentEnd);
          
          try {
            fileBuffer = Buffer.from(content, 'base64');
          } catch (e) {
            fileBuffer = Buffer.from(content);
          }
        } else {
          const contentStart = part.indexOf('\r\n\r\n') + 4;
          const contentEnd = part.lastIndexOf('\r\n');
          formData[name] = part.substring(contentStart, contentEnd);
        }
      }
    }
  }
  
  return { formData, fileBuffer, fileName };
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

    const { formData, fileBuffer, fileName } = parseMultipartForm(event.body, contentType);
    
    const { disputeDescription, mediationType } = formData;
    
    if (!disputeDescription || !mediationType) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Extract text from insurer offer if provided
    let offerText = '';
    if (fileBuffer && fileName.endsWith('.pdf')) {
      try {
        offerText = await extractTextFromPDF(fileBuffer);
      } catch (pdfError) {
        console.error('PDF extraction error:', pdfError);
      }
    }

    // AI mediation kit generation
    const userPrompt = `Generate a mediation preparation kit:

DISPUTE DESCRIPTION:
${disputeDescription}

MEDIATION TYPE:
${mediationType}

${offerText ? `INSURER OFFER:\n${offerText.substring(0, 2000)}` : ''}

Provide:
1. Opening Statement - Suggested opening statement
2. Key Evidence - List of key evidence to present
3. Weakness Analysis - Analysis of weaknesses in your position
4. Settlement Range - Recommended settlement range
5. Questions to Ask Mediator - List of strategic questions
6. Carrier Tactics to Anticipate - Common tactics the carrier might use

Format as JSON:
{
  "openingStatement": "<statement>",
  "keyEvidence": ["<evidence1>", "<evidence2>"],
  "weaknessAnalysis": "<analysis>",
  "settlementRange": "<range>",
  "questions": ["<question1>", "<question2>"],
  "carrierTactics": ["<tactic1>", "<tactic2>"]
}`;

    const aiResponse = await runToolAIJSON('mediation-preparation-kit', userPrompt, {
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
        openingStatement: 'Opening statement to be prepared.',
        keyEvidence: [],
        weaknessAnalysis: 'Weakness analysis to be completed.',
        settlementRange: 'Settlement range to be determined.',
        questions: [],
        carrierTactics: []
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('Mediation kit error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

