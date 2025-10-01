const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'GET') {
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

    // Get item ID from query parameters
    const { itemId } = event.queryStringParameters || {};
    if (!itemId) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Item ID required' })
      };
    }

    // Get evidence item from database
    const { data: evidenceItem, error: dbError } = await supabase
      .from('evidence_items')
      .select('*')
      .eq('id', itemId)
      .eq('user_id', user.id)
      .single();

    if (dbError || !evidenceItem) {
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Evidence item not found' })
      };
    }

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('evidence-uploads')
      .download(evidenceItem.file_path);

    if (downloadError) {
      console.error('Download error:', downloadError);
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Failed to download file' })
      };
    }

    // Convert blob to buffer
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${evidenceItem.filename || 'evidence-file'}"`,
        'Content-Length': buffer.length
      },
      body: buffer.toString('base64'),
      isBase64Encoded: true
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
