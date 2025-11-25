/**
 * Compliance Monitor
 * Check carrier compliance with statutory requirements
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
    
    const { carrierName, eventType, eventDate } = formData;
    
    if (!carrierName || !eventType || !eventDate) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Extract text from uploaded file if present
    let extractedText = '';
    if (fileBuffer && fileName.endsWith('.pdf')) {
      try {
        extractedText = await extractTextFromPDF(fileBuffer);
      } catch (pdfError) {
        console.error('PDF extraction error:', pdfError);
      }
    }

    // Query state deadlines (assuming this table exists)
    let statutoryRule = '';
    let deadlineInfo = null;
    
    if (process.env.SUPABASE_URL) {
      try {
        const supabase = createClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Try to get state-specific deadline info
        // This assumes a state_deadlines or similar table exists
        // For now, we'll use AI to generate the statutory rule
      } catch (dbError) {
        console.error('Database query error:', dbError);
      }
    }

    // AI compliance analysis
    const userPrompt = `Analyze this compliance issue:

Carrier: ${carrierName}
Event Type: ${eventType}
Date Occurred: ${eventDate}
${extractedText ? `\nInsurer Letter Content:\n${extractedText.substring(0, 2000)}` : ''}

Determine:
1. The relevant statutory rule or deadline
2. Whether a violation is likely (YES/NO)
3. Severity rating (Low, Medium, High)
4. Recommended next step

Format as JSON:
{
  "statutoryRule": "<rule description>",
  "isViolation": <true/false>,
  "severity": "<Low|Medium|High>",
  "recommendedAction": "<action>"
}`;

    // Parse AI response
    let result;
    try {
      result = await runToolAIJSON('compliance-monitor', userPrompt, {
        model: 'gpt-4o',
        temperature: 0.3,
        max_tokens: 1000
      }, 'compliance-rules');
    } catch (parseError) {
      // Fallback
      result = {
        statutoryRule: 'Unable to determine specific statutory rule.',
        isViolation: false,
        severity: 'Low',
        recommendedAction: 'Consult with an attorney or insurance department.'
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        statutoryRule: result.statutoryRule || 'No statutory rule information available.',
        isViolation: result.isViolation || false,
        severity: result.severity || 'Low',
        recommendedAction: result.recommendedAction || 'No recommendation available.'
      })
    };

  } catch (error) {
    console.error('Compliance monitor error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

