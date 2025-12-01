/**
 * Text Extraction Function
 * Extracts text from PDF, DOCX, and other document formats
 */

const pdfParse = require('pdf-parse');
const { createClient } = require('@supabase/supabase-js');

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
    // Validate auth
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Authorization required' })
      };
    }

    // Parse multipart form data
    const contentType = event.headers['content-type'] || '';
    if (!contentType.includes('multipart/form-data')) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Multipart form data required' })
      };
    }

    // Extract file from form data
    // Note: This is simplified - in production, use a proper multipart parser
    const boundary = contentType.split('boundary=')[1];
    const parts = event.body.split(`--${boundary}`);
    
    let fileBuffer = null;
    let fileName = '';
    
    for (const part of parts) {
      if (part.includes('Content-Disposition') && part.includes('filename=')) {
        const filenameMatch = part.match(/filename="([^"]+)"/);
        if (filenameMatch) {
          fileName = filenameMatch[1];
        }
        
        // Extract file content (simplified - use proper parser in production)
        const contentStart = part.indexOf('\r\n\r\n') + 4;
        const contentEnd = part.lastIndexOf('\r\n');
        const content = part.substring(contentStart, contentEnd);
        fileBuffer = Buffer.from(content, 'base64');
        break;
      }
    }

    if (!fileBuffer) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No file found in request' })
      };
    }

    // Extract text based on file type
    let extractedText = '';

    if (fileName.endsWith('.pdf')) {
      const data = await pdfParse(fileBuffer);
      extractedText = data.text;
    } else if (fileName.endsWith('.txt')) {
      extractedText = fileBuffer.toString('utf-8');
    } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
      // DOCX extraction would require mammoth or similar library
      // For now, return error
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'DOCX extraction not yet implemented. Please use PDF or TXT.' })
      };
    } else {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Unsupported file type' })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        text: extractedText,
        filename: fileName
      })
    };

  } catch (error) {
    console.error('Text extraction error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};



