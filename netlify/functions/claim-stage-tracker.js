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
    
    // Mock claim stages
    const stages = [
      {
        id: 1,
        name: "Initial Filing",
        status: "completed",
        description: "Claim submitted to insurance company",
        completedDate: "2024-01-15"
      },
      {
        id: 2,
        name: "Review & Assignment",
        status: "completed",
        description: "Claim reviewed and adjuster assigned",
        completedDate: "2024-01-20"
      },
      {
        id: 3,
        name: "Investigation",
        status: "in_progress",
        description: "Adjuster investigating claim details",
        completedDate: null
      },
      {
        id: 4,
        name: "Documentation",
        status: "pending",
        description: "Gathering required documentation",
        completedDate: null
      },
      {
        id: 5,
        name: "Settlement",
        status: "pending",
        description: "Negotiating settlement amount",
        completedDate: null
      }
    ];

    const currentStage = stages.find(s => s.status === 'in_progress') || stages[0];
    const completedStages = stages.filter(s => s.status === 'completed').length;
    const progressPercentage = (completedStages / stages.length) * 100;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        stages,
        currentStage,
        progressPercentage: Math.round(progressPercentage),
        completedStages,
        totalStages: stages.length
      })
    };
  } catch (error) {
    console.error('Claim stage tracking error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Claim stage tracking failed' })
    };
  }
};


