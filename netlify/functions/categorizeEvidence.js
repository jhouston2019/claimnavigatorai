const { createClient } = require('@supabase/supabase-js');
const { OpenAI } = require('openai');

exports.handler = async (event, context) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // Get authorization header
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify user token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Invalid token' })
      };
    }

    // Parse multipart form data
    const boundary = event.headers['content-type']?.split('boundary=')[1];
    if (!boundary) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'No boundary found in content-type' })
      };
    }

    const files = parseMultipartFormData(event.body, boundary);
    if (!files || files.length === 0) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'No files provided' })
      };
    }

    const results = [];

    for (const file of files) {
      try {
        // Upload file to Supabase storage
        const fileName = `${user.id}/${Date.now()}-${file.filename}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('evidence-uploads')
          .upload(fileName, file.content, {
            contentType: file.contentType,
            upsert: false
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          continue;
        }

        // Analyze file with AI
        const analysisPrompt = `Analyze this insurance claim evidence file and categorize it into one of these categories:
        
        - Structure: Building damage, structural issues, roof damage, foundation problems
        - Contents: Personal property, furniture, electronics, clothing, household items
        - ALE: Additional Living Expenses, temporary housing, meals, transportation costs
        - Medical: Medical bills, injury documentation, treatment records
        
        File: ${file.filename}
        Content type: ${file.contentType}
        
        Provide:
        1. Category (Structure/Contents/ALE/Medical)
        2. Brief summary of what this evidence shows
        3. Recommended use in insurance claim
        
        Format as JSON: {"category": "Category", "summary": "Brief description", "recommended_use": "How to use this evidence"}`;

        const aiResponse = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are an expert insurance claim analyst. Analyze evidence files and categorize them for insurance claims.'
            },
            {
              role: 'user',
              content: analysisPrompt
            }
          ],
          max_tokens: 500,
          temperature: 0.3
        });

        const aiAnalysis = JSON.parse(aiResponse.choices[0].message.content);

        // Save to database
        const { data: dbData, error: dbError } = await supabase
          .from('evidence_items')
          .insert({
            user_id: user.id,
            file_path: uploadData.path,
            category: aiAnalysis.category,
            ai_summary: aiAnalysis.summary,
            filename: file.filename
          })
          .select()
          .single();

        if (dbError) {
          console.error('Database error:', dbError);
          continue;
        }

        results.push({
          id: dbData.id,
          filename: file.filename,
          category: aiAnalysis.category,
          ai_summary: aiAnalysis.summary,
          recommended_use: aiAnalysis.recommended_use
        });

      } catch (fileError) {
        console.error('Error processing file:', fileError);
        continue;
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(results)
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

// Helper function to parse multipart form data
function parseMultipartFormData(body, boundary) {
  const parts = body.split(`--${boundary}`);
  const files = [];

  for (const part of parts) {
    if (part.includes('Content-Disposition: form-data')) {
      const headerEnd = part.indexOf('\r\n\r\n');
      if (headerEnd === -1) continue;

      const headers = part.substring(0, headerEnd);
      const content = part.substring(headerEnd + 4);

      // Extract filename
      const filenameMatch = headers.match(/filename="([^"]+)"/);
      if (!filenameMatch) continue;

      const filename = filenameMatch[1];
      
      // Extract content type
      const contentTypeMatch = headers.match(/Content-Type: ([^\r\n]+)/);
      const contentType = contentTypeMatch ? contentTypeMatch[1] : 'application/octet-stream';

      // Convert content to buffer
      const buffer = Buffer.from(content, 'binary');

      files.push({
        filename,
        contentType,
        content: buffer
      });
    }
  }

  return files;
}
