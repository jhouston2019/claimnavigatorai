const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');

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
    // Parse request body
    const { lead_id } = JSON.parse(event.body);

    if (!lead_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required field: lead_id' })
      };
    }

    // Get the lead details
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', lead_id)
      .single();

    if (leadError || !lead) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Lead not found' })
      };
    }

    // Extract state from loss_location (assuming format: "City, State")
    const state = lead.loss_location.includes(',') 
      ? lead.loss_location.split(',')[1].trim()
      : 'Unknown';

    // Get professionals in the same state
    const { data: professionals, error: profError } = await supabase
      .from('professionals')
      .select('*')
      .eq('state', state);

    if (profError) {
      console.error('Error fetching professionals:', profError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to fetch professionals' })
      };
    }

    if (!professionals || professionals.length === 0) {
      console.log(`No professionals found in state: ${state}`);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          message: 'No professionals to notify',
          state: state,
          professionals_count: 0
        })
      };
    }

    // Send email notifications
    const results = await Promise.allSettled(
      professionals.map(professional => sendLeadNotification(lead, professional, state))
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`Lead notifications sent: ${successful} successful, ${failed} failed`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        message: 'Lead notifications sent',
        state: state,
        professionals_notified: successful,
        failed_notifications: failed
      })
    };

  } catch (error) {
    console.error('Error processing lead notification:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to process lead notification',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    };
  }
};

async function sendLeadNotification(lead, professional, state) {
  try {
    // Create email transporter (using SendGrid or similar)
    const transporter = nodemailer.createTransporter({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      }
    });

    // Create anonymized lead summary
    const anonymizedLocation = lead.loss_location.includes(',') 
      ? lead.loss_location.split(',')[1].trim() + ' Area'
      : 'Your Area';

    const emailSubject = `New Claim Lead Available in ${state}`;
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af;">New Claim Lead Available</h2>
        
        <p>Hello ${professional.company_name || 'Professional'},</p>
        
        <p>A new claim lead has been posted in your area and may be of interest to you:</p>
        
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1e40af; margin-top: 0;">Lead Summary</h3>
          <p><strong>Type of Loss:</strong> ${lead.type_of_loss}</p>
          <p><strong>Property Type:</strong> ${lead.property_type}</p>
          <p><strong>Insurer:</strong> ${lead.insurer}</p>
          <p><strong>Location:</strong> ${anonymizedLocation}</p>
          <p><strong>Date of Loss:</strong> ${new Date(lead.date_of_loss).toLocaleDateString()}</p>
          <p><strong>Status:</strong> ${lead.status}</p>
          <p><strong>Price:</strong> $${lead.price}</p>
        </div>
        
        <p>This lead is available for purchase on the ClaimNavigatorAI Professional Dashboard.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.URL || 'https://claimnavigatorai.netlify.app'}/app/professional-dashboard.html" 
             style="background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Lead Dashboard
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px;">
          This is an automated notification. Please do not reply to this email.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="color: #6b7280; font-size: 12px;">
          ClaimNavigatorAI Professional Lead Exchange<br>
          <a href="${process.env.URL || 'https://claimnavigatorai.netlify.app'}">claimnavigatorai.netlify.app</a>
        </p>
      </div>
    `;

    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@claimnavigatorai.netlify.app',
      to: professional.email || 'professional@example.com', // This should be the professional's email
      subject: emailSubject,
      html: emailBody
    };

    await transporter.sendMail(mailOptions);
    console.log(`Lead notification sent to ${professional.email}`);

  } catch (error) {
    console.error(`Failed to send notification to ${professional.email}:`, error);
    throw error;
  }
}
