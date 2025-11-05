const sgMail = require('@sendgrid/mail');

/**
 * Send email via SendGrid
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} body - Email body (HTML or plain text)
 * @returns {Promise<object>} Send result
 */
async function sendEmail(to, subject, body) {
  try {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      throw new Error('SENDGRID_API_KEY is not configured');
    }

    sgMail.setApiKey(apiKey);

    const fromEmail = process.env.FROM_EMAIL || 'no-reply@claimnavigator.ai';
    const fromName = process.env.FROM_NAME || 'ClaimNavigator Agent';

    const msg = {
      to: to,
      from: {
        email: fromEmail,
        name: fromName
      },
      subject: subject,
      html: body,
      text: body.replace(/<[^>]*>/g, ''), // Strip HTML for plain text version
    };

    const response = await sgMail.send(msg);

    return {
      success: true,
      message_id: response[0]?.headers?.['x-message-id'] || null,
      sent_at: new Date().toISOString(),
      to: to,
      subject: subject
    };
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

module.exports = {
  sendEmail
};


