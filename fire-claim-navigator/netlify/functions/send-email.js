// Email sending function using Netlify's built-in email service
// For production, you can switch to SendGrid or other providers

exports.handler = async (event, context) => {
  // Only allow POST from internal functions
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { to, subject, html, text, type } = JSON.parse(event.body);
    
    if (!to || !subject || (!html && !text)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: to, subject, and html/text' })
      };
    }

    // If using SendGrid (recommended for production)
    if (process.env.SENDGRID_API_KEY) {
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      
      const msg = {
        to,
        from: 'claimnavigatorai@gmail.com', // ✅ locked verified sender
        subject,
        text: text || stripHtml(html),
        html,
        replyTo: process.env.SUPPORT_EMAIL || process.env.EMAIL_REPLY_TO || 'support@claimnavigatorai.com'
      };
      
      await sgMail.send(msg);
      
      console.log(`Email sent to ${to}: ${subject}`);
      
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, message: 'Email sent successfully' })
      };
    }
    
    // Fallback: Log email for manual sending (development/testing)
    console.log('EMAIL TO SEND:', {
      to,
      subject,
      type,
      timestamp: new Date().toISOString()
    });
    
    // Store email in Netlify Blobs for manual processing
    const { getStore } = require("@netlify/blobs");
    const emailStore = getStore("pending_emails");
    
    await emailStore.setJSON(`${Date.now()}_${to.replace('@', '_')}`, {
      to,
      subject,
      html,
      text,
      type,
      timestamp: new Date().toISOString(),
      sent: false
    });
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        message: 'Email queued for sending',
        note: 'SendGrid not configured - email stored for manual sending'
      })
    };
    
  } catch (error) {
    console.error('Email sending error:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to send email',
        message: error.message 
      })
    };
  }
};

// Helper to strip HTML tags
function stripHtml(html) {
  return html.replace(/<[^>]*>/g, '');
}

// Email template generators
function getPurchaseConfirmationEmail(customerEmail, sessionId, amount) {
  return {
    to: customerEmail,
    subject: 'Welcome to ClaimNavigatorAI - Your Purchase Confirmation',
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1e40af; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9fafb; }
    .button { background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to ClaimNavigatorAI!</h1>
    </div>
    <div class="content">
      <h2>Thank you for your purchase!</h2>
      <p>Your payment of $${(amount/100).toFixed(2)} has been successfully processed.</p>
      
      <h3>What's Included:</h3>
      <ul>
        <li>Complete AI Claim Documentation Toolkit</li>
        <li>20 AI-Generated Response Credits</li>
        <li>All forms and templates for your claim</li>
        <li>Bilingual support (English/Spanish)</li>
      </ul>
      
      <h3>Get Started Now:</h3>
      <p>Access your Claim Resource & AI Response Center to start generating professional responses to insurer correspondence:</p>
      
      <a href="${process.env.SITE_URL || process.env.URL || 'https://claimnavigatorai.com'}/success.html?session_id=${sessionId}" class="button">
        Access Your Account
      </a>
      
      <h3>Important Next Steps:</h3>
      <ol>
        <li>Create your account using this email address</li>
        <li>Upload your insurer's letter</li>
        <li>Generate your professional response</li>
        <li>Download as PDF or Word document</li>
      </ol>
      
      <p><strong>Order ID:</strong> ${sessionId}</p>
      
      <h3>Need Help?</h3>
      <p>If you have any questions, please contact us at ${process.env.SUPPORT_EMAIL || process.env.EMAIL_REPLY_TO || 'support@claimnavigatorai.com'}</p>
    </div>
    <div class="footer">
      <p>ClaimNavigatorAI - AI-Powered Claim Documentation Tools</p>
      <p>This is a receipt for your records. No action is required.</p>
    </div>
  </div>
</body>
</html>
    `,
    type: 'purchase_confirmation'
  };
}

// Export template functions for use by other functions
module.exports.getPurchaseConfirmationEmail = getPurchaseConfirmationEmail;