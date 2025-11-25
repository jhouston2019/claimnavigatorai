/**
 * Appeal Package Builder
 * Generate comprehensive appeal packages
 */

const pdfParse = require('pdf-parse');
const { runToolAIJSON } = require('../lib/advanced-tools-ai-helper');
const { createClient } = require('@supabase/supabase-js');

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
          // This is a file
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
          // Regular form field
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
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
    
    if (!fileBuffer) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Denial letter file is required' })
      };
    }

    // Extract text from denial letter
    let denialText = '';
    if (fileName.endsWith('.pdf')) {
      try {
        denialText = await extractTextFromPDF(fileBuffer);
      } catch (pdfError) {
        console.error('PDF extraction error:', pdfError);
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Failed to extract text from PDF' })
        };
      }
    } else {
      denialText = fileBuffer.toString('utf-8');
    }

    const { claimDetails, disputedItems, evidenceLinks } = formData;

    // AI appeal package generation
    const userPrompt = `Generate an appeal package based on:

DENIAL LETTER:
${denialText.substring(0, 3000)}

CLAIM DETAILS:
${claimDetails || 'Not provided'}

DISPUTED ITEMS:
${disputedItems || 'Not provided'}

EVIDENCE LINKS:
${evidenceLinks || 'None provided'}

Provide:
1. Appeal Summary - Brief overview of the appeal
2. Legal Basis - Legal grounds for the appeal
3. Evidence List - List of evidence to include
4. Corrective Action Request - What you're asking the carrier to do

Format as JSON:
{
  "appealSummary": "<summary>",
  "legalBasis": "<legal grounds>",
  "evidenceList": ["<evidence1>", "<evidence2>"],
  "correctiveAction": "<requested action>"
}`;

    const aiResponse = await runToolAIJSON('appeal-package-builder', userPrompt, {
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
        appealSummary: 'Appeal package generation incomplete. Please review manually.',
        legalBasis: 'Legal basis to be determined.',
        evidenceList: [],
        correctiveAction: 'Review and correct the denial decision.'
      };
    }

    // Store in Supabase if user is authenticated
    const authHeader = event.headers.authorization || event.headers.Authorization;
    let userId = null;
    
    if (authHeader && authHeader.startsWith('Bearer ') && process.env.SUPABASE_URL) {
      try {
        const supabase = createClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        const token = authHeader.split(' ')[1];
        const { data: { user } } = await supabase.auth.getUser(token);
        
        if (user) {
          userId = user.id;
          
          await supabase.from('appeal_packages').insert({
            user_id: userId,
            denial_text: denialText.substring(0, 10000),
            appeal_json: result
          });
        }
      } catch (dbError) {
        console.error('Database storage error:', dbError);
        // Continue without storing
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('Appeal builder error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

