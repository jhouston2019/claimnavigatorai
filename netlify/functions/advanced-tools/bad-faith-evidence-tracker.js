/**
 * Bad Faith Evidence Tracker
 * Track and score bad faith events
 */

const { runToolAIJSON } = require('../lib/advanced-tools-ai-helper');
const { createClient } = require('@supabase/supabase-js');

// Simple multipart parser
function parseMultipartForm(body, contentType) {
  const boundary = contentType.split('boundary=')[1];
  const parts = body.split(`--${boundary}`);
  
  const formData = {};
  const files = [];
  
  for (const part of parts) {
    if (part.includes('Content-Disposition')) {
      const nameMatch = part.match(/name="([^"]+)"/);
      const filenameMatch = part.match(/filename="([^"]+)"/);
      
      if (nameMatch) {
        const name = nameMatch[1];
        
        if (filenameMatch) {
          // This is a file
          const fileName = filenameMatch[1];
          const contentStart = part.indexOf('\r\n\r\n') + 4;
          const contentEnd = part.lastIndexOf('\r\n');
          const content = part.substring(contentStart, contentEnd);
          
          files.push({
            name,
            fileName,
            buffer: Buffer.from(content, 'base64')
          });
        } else {
          // Regular form field
          const contentStart = part.indexOf('\r\n\r\n') + 4;
          const contentEnd = part.lastIndexOf('\r\n');
          formData[name] = part.substring(contentStart, contentEnd);
        }
      }
    }
  }
  
  return { formData, files };
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
    // Auth check (optional - can be removed if not required)
    const authHeader = event.headers.authorization || event.headers.Authorization;
    let userId = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      const token = authHeader.split(' ')[1];
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) userId = user.id;
    }

    const contentType = event.headers['content-type'] || '';
    
    if (!contentType.includes('multipart/form-data')) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Multipart form data required' })
      };
    }

    const { formData, files } = parseMultipartForm(event.body, contentType);
    
    const { date, event, category } = formData;
    
    if (!date || !event || !category) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Bad faith scoring matrix
    const categoryScores = {
      delay: 30,
      misstatement: 40,
      'request-abuse': 25,
      underpayment: 35,
      denial: 50,
      'policy-misinterpretation': 30,
      'failure-to-respond': 20,
      other: 15
    };

    const baseScore = categoryScores[category] || 15;

    // AI analysis
    const userPrompt = `Analyze this bad faith event:
- Date: ${date}
- Category: ${category}
- Description: ${event}

Provide:
1. A severity rating (Low, Medium, High, Critical)
2. A risk score from 0-100 (where base is ${baseScore})
3. Professional notes on the event

Format as JSON:
{
  "severity": "<Low|Medium|High|Critical>",
  "score": <number>,
  "aiNotes": "<notes>"
}`;

    let aiResult;
    try {
      aiResult = await runToolAIJSON('bad-faith-evidence-tracker', userPrompt, {
        model: 'gpt-4o-mini',
        temperature: 0.3,
        max_tokens: 500
      }, 'bad-faith-rules');
    } catch (aiError) {
      console.error('AI analysis failed:', aiError);
      aiResult = {
        severity: 'Medium',
        score: baseScore,
        aiNotes: 'AI analysis unavailable. Event logged.'
      };
    }

    // Store in Supabase if user is authenticated
    let fileUrl = null;
    if (userId && files.length > 0 && process.env.SUPABASE_URL) {
      try {
        const supabase = createClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        
        // Upload file to storage
        const file = files[0];
        const fileName = `${userId}/${Date.now()}_${file.fileName}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('badfaith_evidence')
          .upload(fileName, file.buffer, {
            contentType: 'application/octet-stream'
          });
        
        if (!uploadError && uploadData) {
          const { data: urlData } = supabase.storage
            .from('badfaith_evidence')
            .getPublicUrl(fileName);
          fileUrl = urlData?.publicUrl;
        }
        
        // Insert into database
        await supabase.from('badfaith_events').insert({
          user_id: userId,
          date,
          event,
          category,
          severity: aiResult.severity,
          file_url: fileUrl,
          ai_notes: aiResult.aiNotes,
          score: aiResult.score || baseScore
        });
      } catch (dbError) {
        console.error('Database storage failed:', dbError);
        // Continue without storing
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        date,
        event,
        category,
        severity: aiResult.severity,
        score: aiResult.score || baseScore,
        aiNotes: aiResult.aiNotes,
        fileUrl
      })
    };

  } catch (error) {
    console.error('Bad faith tracker error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

