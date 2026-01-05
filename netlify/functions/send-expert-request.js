const sgMail = require('@sendgrid/mail');

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      throw new Error('SENDGRID_API_KEY is not configured');
    }

    sgMail.setApiKey(apiKey);

    const requestData = JSON.parse(event.body || '{}');
    const { name, email, claim_id, message } = requestData;

    // Validate required fields
    if (!name || !email || !claim_id || !message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields: name, email, claim_id, and message are required' })
      };
    }

    const expertEmail = process.env.EXPERT_EMAIL || 'experts@claimnavigator.ai';
    const fromEmail = process.env.FROM_EMAIL || 'no-reply@claimnavigator.ai';
    const fromName = process.env.FROM_NAME || 'Claim Navigator';

    const emailContent = {
      to: expertEmail,
      from: {
        email: fromEmail,
        name: fromName
      },
      replyTo: email,
      subject: `Expert Opinion Request – Claim ${claim_id}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e3a8a;">Expert Opinion Request</h2>
          <div style="background: #f3f4f6; padding: 1rem; border-radius: 0.5rem; margin: 1rem 0;">
            <p><strong>From:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Claim ID:</strong> ${claim_id}</p>
          </div>
          <div style="margin: 1rem 0;">
            <h3 style="color: #1e3a8a;">Message:</h3>
            <p style="white-space: pre-wrap; line-height: 1.6;">${message.replace(/\n/g, '<br>')}</p>
          </div>
          <hr style="border: 1px solid #e5e7eb; margin: 1rem 0;">
          <p style="color: #6b7280; font-size: 0.875rem;">
            This request was submitted through Claim Navigator Expert Opinion Request form.
          </p>
        </div>
      `,
      text: `
Expert Opinion Request

From: ${name}
Email: ${email}
Claim ID: ${claim_id}

Message:
${message}
      `
    };

    await sgMail.send(emailContent);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'sent',
        message: 'Expert opinion request sent successfully'
      })
    };

  } catch (error) {
    console.error('Error sending expert request:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        status: 'error',
        error: error.message
      })
    };
  }
};


