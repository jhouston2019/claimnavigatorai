const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event, context) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  try {
    const { sendgrid_api_key, from_email, admin_email } = JSON.parse(event.body);

    if (!sendgrid_api_key || !from_email || !admin_email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Store email configuration in environment variables or database
    // For now, we'll just validate the format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(from_email)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid from email format' })
      };
    }

    if (!emailRegex.test(admin_email)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid admin email format' })
      };
    }

    // Store in database (you can create a settings table)
    const { data, error } = await supabase
      .from('system_settings')
      .upsert({
        setting_key: 'email_config',
        setting_value: {
          sendgrid_api_key: sendgrid_api_key,
          from_email: from_email,
          admin_email: admin_email,
          updated_at: new Date().toISOString()
        }
      });

    if (error) {
      console.error('Error saving email config:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to save configuration' })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        message: 'Email configuration saved successfully',
        from_email: from_email,
        admin_email: admin_email
      })
    };

  } catch (error) {
    console.error('Error configuring email:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to configure email',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    };
  }
};
