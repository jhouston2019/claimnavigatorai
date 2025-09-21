const sgMail = require('@sendgrid/mail');

// Set SendGrid API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse the request body
    const { user_name, user_email, subject, message } = JSON.parse(event.body);

    // Validate required fields
    if (!user_name || !user_email || !subject || !message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'All fields are required' })
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(user_email)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid email format' })
      };
    }

    // Save to Supabase
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Server configuration error' })
      };
    }

    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('support_messages')
      .insert([
        {
          user_name: user_name.trim(),
          user_email: user_email.trim(),
          subject: subject.trim(),
          message: message.trim(),
          status: 'new'
        }
      ])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to save message' })
      };
    }

    // Send email notification to admin
    try {
      await sendEmailNotification({
        user_name: user_name.trim(),
        user_email: user_email.trim(),
        subject: subject.trim(),
        message: message.trim(),
        messageId: data[0].id
      });
    } catch (emailError) {
      console.error('Email notification failed:', emailError);
      // Don't fail the request if email fails, just log it
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({ 
        success: true, 
        message: 'Message sent successfully',
        messageId: data[0].id
      })
    };

  } catch (error) {
    console.error('Error processing support message:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

async function sendEmailNotification({ user_name, user_email, subject, message, messageId }) {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@claimnavigatorai.com';
  const siteUrl = process.env.SITE_URL || 'https://claimnavigatorai.com';

  const msg = {
    to: adminEmail,
    from: 'claimnavigatorai@gmail.com', // ✅ locked verified sender
    subject: `New Support Message: ${subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af;">New Support Message Received</h2>
        
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #374151; margin-bottom: 15px;">Message Details</h3>
          <p><strong>From:</strong> ${user_name} (${user_email})</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message ID:</strong> ${messageId}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
        </div>
        
        <div style="background: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #374151; margin-bottom: 15px;">Message Content</h3>
          <div style="white-space: pre-wrap; line-height: 1.6;">${message}</div>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            This message was sent through the ClaimNavigatorAI Solution Center.<br>
            <a href="${siteUrl}/solution-center.html" style="color: #1e40af;">View Solution Center</a>
          </p>
        </div>
      </div>
    `,
    text: `
New Support Message Received

From: ${user_name} (${user_email})
Subject: ${subject}
Message ID: ${messageId}
Date: ${new Date().toLocaleString()}

Message Content:
${message}

This message was sent through the ClaimNavigatorAI Solution Center.
Visit: ${siteUrl}/solution-center.html
    `
  };

  await sgMail.send(msg);
  console.log('Email notification sent successfully');
}
