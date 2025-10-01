// Netlify Scheduled Function for Daily Lead Digest
// This function runs daily at 9 AM EST to send lead digests to professionals

const { createClient } = require('@supabase/supabase-js');
const sgMail = require('@sendgrid/mail');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Set SendGrid API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.handler = async (event, context) => {
  console.log('Starting daily lead digest...');

  try {
    // Get all new leads from the last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .eq('lead_status', 'new')
      .gte('created_at', yesterday.toISOString())
      .order('created_at', { ascending: false });

    if (leadsError) {
      console.error('Error fetching leads:', leadsError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to fetch leads' })
      };
    }

    if (!leads || leads.length === 0) {
      console.log('No new leads in the last 24 hours');
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          message: 'No new leads to notify about',
          leads_count: 0
        })
      };
    }

    // Get all professionals
    const { data: professionals, error: profError } = await supabase
      .from('professionals')
      .select('*');

    if (profError) {
      console.error('Error fetching professionals:', profError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to fetch professionals' })
      };
    }

    if (!professionals || professionals.length === 0) {
      console.log('No professionals to notify');
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          message: 'No professionals to notify',
          professionals_count: 0
        })
      };
    }

    // Group leads by state
    const leadsByState = {};
    leads.forEach(lead => {
      // Handle both JSONB and text loss_location formats
      let state = 'Unknown';
      
      if (typeof lead.loss_location === 'string') {
        // Text format: "City, State"
        state = lead.loss_location.includes(',') 
          ? lead.loss_location.split(',')[1].trim()
          : 'Unknown';
      } else if (lead.loss_location && typeof lead.loss_location === 'object') {
        // JSONB format: {city: "City", state: "State"}
        state = lead.loss_location.state || 'Unknown';
      }
      
      if (!leadsByState[state]) {
        leadsByState[state] = [];
      }
      leadsByState[state].push(lead);
    });

    // Send daily digest to each professional
    const results = await Promise.allSettled(
      professionals.map(professional => sendDailyDigest(professional, leadsByState))
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`Daily digest sent: ${successful} successful, ${failed} failed`);

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Daily digest sent',
        leads_count: leads.length,
        professionals_notified: successful,
        failed_notifications: failed
      })
    };

  } catch (error) {
    console.error('Error processing daily digest:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to process daily digest',
        message: error.message
      })
    };
  }
};

async function sendDailyDigest(professional, leadsByState) {
  try {
    // Get leads for this professional's state
    const stateLeads = leadsByState[professional.state] || [];
    
    if (stateLeads.length === 0) {
      console.log(`No leads for professional ${professional.id} in state ${professional.state}`);
      return;
    }

    const emailSubject = `Daily Lead Digest - ${stateLeads.length} New Leads in ${professional.state}`;
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af;">Daily Lead Digest</h2>
        
        <p>Hello ${professional.company_name || 'Professional'},</p>
        
        <p>Here are the new claim leads posted in your area today:</p>
        
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1e40af; margin-top: 0;">${stateLeads.length} New Leads in ${professional.state}</h3>
          
          ${stateLeads.map(lead => `
            <div style="border-bottom: 1px solid #e5e7eb; padding: 15px 0;">
              <h4 style="color: #1e40af; margin: 0 0 10px 0;">${lead.type_of_loss}</h4>
              <p style="margin: 5px 0;"><strong>Property Type:</strong> ${lead.property_type}</p>
              <p style="margin: 5px 0;"><strong>Insurer:</strong> ${lead.insurer}</p>
              <p style="margin: 5px 0;"><strong>Date of Loss:</strong> ${new Date(lead.date_of_loss).toLocaleDateString()}</p>
              <p style="margin: 5px 0;"><strong>Status:</strong> ${lead.status}</p>
              <p style="margin: 5px 0;"><strong>Price:</strong> $${lead.price}</p>
            </div>
          `).join('')}
        </div>
        
        <p>These leads are available for purchase on the ClaimNavigatorAI Professional Dashboard.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.SITE_URL || process.env.URL || 'https://claimnavigatorai.com'}/app/professional-dashboard.html" 
             style="background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Lead Dashboard
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px;">
          This is your daily digest of new leads. Check the dashboard regularly for the latest opportunities.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="color: #6b7280; font-size: 12px;">
          ClaimNavigatorAI Professional Lead Exchange<br>
          <a href="${process.env.SITE_URL || process.env.URL || 'https://claimnavigatorai.com'}">claimnavigatorai.netlify.app</a>
        </p>
      </div>
    `;

    const msg = {
      to: professional.email || 'professional@example.com',
      from: 'claimnavigatorai@gmail.com', // ✅ locked verified sender
      subject: emailSubject,
      html: emailBody
    };

    await sgMail.send(msg);
    console.log(`Daily digest sent to ${professional.email}`);

  } catch (error) {
    console.error(`Failed to send daily digest to ${professional.email}:`, error);
    throw error;
  }
}
