/**
 * Evidence Photo Analyzer
 * AI-powered photo analysis using OpenAI Vision
 */

const OpenAI = require('openai');

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
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

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
        body: JSON.stringify({ error: 'No image found' })
      };
    }

    // Convert to base64 for OpenAI Vision
    const base64Image = fileBuffer.toString('base64');
    const mimeType = fileName.endsWith('.png') ? 'image/png' : 
                     fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') ? 'image/jpeg' : 
                     'image/jpeg';

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert insurance claim damage assessor. Analyze property damage photos and provide detailed assessments.'
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this property damage photo. Provide:
1. Auto-tagging: List relevant tags (e.g., "water damage", "roof leak", "structural damage")
2. Damage classification: Type of damage and description
3. Severity rating: Low, Medium, or High
4. Required supplemental photos: List what additional photos would be helpful

Format as JSON:
{
  "tags": ["tag1", "tag2"],
  "damageType": "<type>",
  "damageDescription": "<description>",
  "severity": "Low|Medium|High",
  "requiredPhotos": ["photo1", "photo2"]
}`
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.3
    });

    const aiResponse = response.choices[0].message.content;
    
    // Parse AI response
    let result;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found');
      }
    } catch (parseError) {
      // Fallback
      result = {
        tags: ['property damage'],
        damageType: 'Unknown',
        damageDescription: 'Unable to classify damage from image.',
        severity: 'Medium',
        requiredPhotos: ['Additional angles', 'Close-up shots']
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        tags: result.tags || [],
        damageType: result.damageType || 'Unknown',
        damageDescription: result.damageDescription || '',
        severity: result.severity || 'Medium',
        requiredPhotos: result.requiredPhotos || []
      })
    };

  } catch (error) {
    console.error('Photo analyzer error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};


