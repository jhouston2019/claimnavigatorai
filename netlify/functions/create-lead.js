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
    // Parse request body
    const { 
      insured_name, 
      phone, 
      email, 
      date_of_loss, 
      type_of_loss, 
      insurer, 
      status, 
      property_type, 
      loss_location 
    } = JSON.parse(event.body);

    // Validate required fields
    const requiredFields = [
      'insured_name', 'phone', 'email', 'date_of_loss', 
      'type_of_loss', 'insurer', 'status', 'property_type', 'loss_location'
    ];

    const missingFields = requiredFields.filter(field => !event.body.includes(field));
    if (missingFields.length > 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Missing required fields', 
          missing: missingFields 
        })
      };
    }

    // Insert the lead into the original leads table
    const { data: lead, error: insertError } = await supabase
      .from('leads')
      .insert([{
        insured_name,
        phone,
        email,
        date_of_loss,
        type_of_loss,
        insurer,
        status,
        property_type,
        loss_location
      }])
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting lead:', insertError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to create lead' })
      };
    }

    // Create entry in lead_exchange table
    const { data: leadExchange, error: exchangeError } = await supabase
      .from('lead_exchange')
      .insert([{
        original_lead_id: lead.id,
        lead_status: 'new',
        price: 249,
        email: lead.email
      }])
      .select()
      .single();

    if (exchangeError) {
      console.error('Error creating lead exchange entry:', exchangeError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to create lead exchange entry' })
      };
    }

    console.log('Lead created successfully:', lead.id);

    // Trigger notification to professionals (async, don't wait for response)
    try {
      const notificationResponse = await fetch(`${process.env.SITE_URL || process.env.URL || 'https://claimnavigatorai.com'}/.netlify/functions/notify-new-lead`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ lead_id: lead.id })
      });

      if (!notificationResponse.ok) {
        console.error('Failed to trigger notifications:', await notificationResponse.text());
      } else {
        console.log('Notifications triggered successfully');
      }
    } catch (notificationError) {
      console.error('Error triggering notifications:', notificationError);
      // Don't fail the lead creation if notifications fail
    }

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({ 
        success: true, 
        lead_id: lead.id,
        message: 'Lead created successfully'
      })
    };

  } catch (error) {
    console.error('Error creating lead:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to create lead',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    };
  }
};
