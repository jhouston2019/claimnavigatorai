/**
 * Email Sending Function
 * Supports multiple email providers: SendGrid, Mailgun, Resend
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Email provider configuration
const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || 'sendgrid'; // sendgrid, mailgun, or resend

/**
 * Send email via SendGrid
 */
async function sendViaSendGrid(to, subject, html, text) {
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: {
        email: process.env.FROM_EMAIL || 'noreply@claimcommandpro.com',
        name: 'Claim Command Pro'
      },
      subject: subject,
      content: [
        { type: 'text/plain', value: text },
        { type: 'text/html', value: html }
      ]
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SendGrid error: ${error}`);
  }

  return { success: true, provider: 'sendgrid' };
}

/**
 * Send email via Mailgun
 */
async function sendViaMailgun(to, subject, html, text) {
  const domain = process.env.MAILGUN_DOMAIN;
  const formData = new URLSearchParams();
  formData.append('from', `Claim Command Pro <noreply@${domain}>`);
  formData.append('to', to);
  formData.append('subject', subject);
  formData.append('text', text);
  formData.append('html', html);

  const response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(`api:${process.env.MAILGUN_API_KEY}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: formData
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Mailgun error: ${error}`);
  }

  return { success: true, provider: 'mailgun' };
}

/**
 * Send email via Resend
 */
async function sendViaResend(to, subject, html, text) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'Claim Command Pro <noreply@claimcommandpro.com>',
      to: [to],
      subject: subject,
      html: html,
      text: text
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend error: ${error}`);
  }

  return { success: true, provider: 'resend' };
}

/**
 * Main email sending function
 */
async function sendEmail(to, subject, html, text) {
  switch (EMAIL_PROVIDER.toLowerCase()) {
    case 'sendgrid':
      return await sendViaSendGrid(to, subject, html, text);
    case 'mailgun':
      return await sendViaMailgun(to, subject, html, text);
    case 'resend':
      return await sendViaResend(to, subject, html, text);
    default:
      throw new Error(`Unknown email provider: ${EMAIL_PROVIDER}`);
  }
}

/**
 * Log email sent to database
 */
async function logEmail(email, emailType, status, error = null) {
  try {
    await supabase.from('email_log').insert({
      email: email,
      email_type: emailType,
      status: status,
      error_message: error,
      provider: EMAIL_PROVIDER,
      sent_at: new Date().toISOString()
    });
  } catch (err) {
    console.error('[Email Log] Failed to log:', err);
  }
}

/**
 * Netlify function handler
 */
exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { to, subject, html, text, emailType } = JSON.parse(event.body);

    if (!to || !subject || !html) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields: to, subject, html' })
      };
    }

    const result = await sendEmail(to, subject, html, text || '');
    
    await logEmail(to, emailType || 'unknown', 'sent');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Email sent successfully',
        provider: result.provider
      })
    };

  } catch (error) {
    console.error('[Send Email] Error:', error);
    
    await logEmail(
      event.body ? JSON.parse(event.body).to : 'unknown',
      event.body ? JSON.parse(event.body).emailType : 'unknown',
      'failed',
      error.message
    );

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};

module.exports = { sendEmail, logEmail };
