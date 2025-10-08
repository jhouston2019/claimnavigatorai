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
    
    // Mock deadline data
    const deadlines = [
      {
        id: 1,
        title: "Submit Additional Documentation",
        dueDate: "2024-02-15",
        priority: "high",
        status: "pending",
        description: "Submit repair estimates and photos"
      },
      {
        id: 2,
        title: "Respond to Insurance Adjuster",
        dueDate: "2024-02-20",
        priority: "medium",
        status: "pending",
        description: "Respond to adjuster's questions"
      },
      {
        id: 3,
        title: "File Appeal (if needed)",
        dueDate: "2024-03-01",
        priority: "low",
        status: "pending",
        description: "File appeal if claim is denied"
      }
    ];

    const today = new Date();
    const upcomingDeadlines = deadlines.filter(d => {
      const dueDate = new Date(d.dueDate);
      const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
      return daysUntilDue <= 7 && d.status === 'pending';
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        deadlines,
        upcomingDeadlines,
        totalDeadlines: deadlines.length,
        pendingDeadlines: deadlines.filter(d => d.status === 'pending').length
      })
    };
  } catch (error) {
    console.error('Deadline tracking error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Deadline tracking failed' })
    };
  }
};


