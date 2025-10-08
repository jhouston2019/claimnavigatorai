const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const user = context.clientContext && context.clientContext.user;
  if (!user) {
    return { 
      statusCode: 401, 
      headers,
      body: JSON.stringify({ error: 'Unauthorized' }) 
    };
  }

  try {
    const { content, title, type } = JSON.parse(event.body || '{}');
    
    if (!content) {
      return { 
        statusCode: 400, 
        headers,
        body: JSON.stringify({ error: 'Missing content' }) 
      };
    }

    // Save draft to Supabase
    const { data, error } = await supabase
      .from('drafts')
      .insert({
        user_id: user.sub,
        content,
        title: title || 'Untitled Draft',
        type: type || 'general',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Draft save error:', error);
      return { 
        statusCode: 500, 
        headers,
        body: JSON.stringify({ error: 'Failed to save draft' }) 
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true,
        draft: data
      })
    };
  } catch (error) {
    console.error('Save draft error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Save draft failed' })
    };
  }
};


