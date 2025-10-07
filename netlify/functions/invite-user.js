const fetch = require('node-fetch');

exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const { email } = JSON.parse(event.body);

    if (!email) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Email is required' })
      };
    }

    // Get the site URL from environment or construct it
    const siteUrl = process.env.URL || 'https://claimnavigatorai.com';
    const identityUrl = `${siteUrl}/.netlify/identity`;

    // Create user invite via Netlify Identity API
    const response = await fetch(`${identityUrl}/admin/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NETLIFY_IDENTITY_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        confirmed: true,
        invited: true
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Identity API error:', errorData);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Failed to create user invite',
          details: errorData 
        })
      };
    }

    const result = await response.json();
    console.log('User invite created:', result);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        success: true, 
        message: 'User invite sent successfully',
        user: result 
      })
    };

  } catch (error) {
    console.error('Invite user error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      })
    };
  }
};
