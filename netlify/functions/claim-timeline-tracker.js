const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const user = context.clientContext && context.clientContext.user;
  if (!user) {
    return { 
      statusCode: 401, 
      headers,
      body: JSON.stringify({ error: 'Unauthorized' }) 
    };
  }

  try {
    const { claimId } = JSON.parse(event.body || '{}');
    
    // Mock timeline data - in production, this would query the database
    const timeline = [
      {
        id: 1,
        date: "2024-01-15",
        event: "Claim Filed",
        description: "Initial claim submitted to insurance company",
        status: "completed"
      },
      {
        id: 2,
        date: "2024-01-20",
        event: "Adjuster Assigned",
        description: "Insurance adjuster assigned to case",
        status: "completed"
      },
      {
        id: 3,
        date: "2024-01-25",
        event: "Inspection Scheduled",
        description: "Property inspection scheduled",
        status: "pending"
      },
      {
        id: 4,
        date: "2024-02-01",
        event: "Documentation Due",
        description: "Submit additional documentation",
        status: "pending"
      }
    ];

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        timeline,
        totalEvents: timeline.length,
        completedEvents: timeline.filter(t => t.status === 'completed').length
      })
    };
  } catch (error) {
    console.error('Timeline tracking error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Timeline tracking failed' })
    };
  }
};


