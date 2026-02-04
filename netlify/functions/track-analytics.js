/**
 * Analytics Tracking Endpoint
 * Stores analytics events in Supabase
 */

const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const analyticsEvent = JSON.parse(event.body);

    // Initialize Supabase
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Store event
    const { error } = await supabase
      .from('analytics_events')
      .insert({
        event_name: analyticsEvent.event,
        event_properties: analyticsEvent,
        user_id: analyticsEvent.user_id || null,
        claim_id: analyticsEvent.claim_id || null,
        created_at: analyticsEvent.timestamp
      });

    if (error) {
      console.error('Error storing analytics event:', error);
      // Don't throw - fail silently for analytics
      return {
        statusCode: 200,
        body: JSON.stringify({ success: false, error: error.message })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };

  } catch (error) {
    console.error('Analytics tracking error:', error);
    // Fail silently - don't break user experience for analytics
    return {
      statusCode: 200,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};


