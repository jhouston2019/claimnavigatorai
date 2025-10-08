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
    const { claimType } = JSON.parse(event.body || '{}');
    
    // Mock checklist data based on claim type
    const checklists = {
      property: [
        { id: 1, item: "Property damage photos", completed: false, required: true },
        { id: 2, item: "Police report (if applicable)", completed: false, required: false },
        { id: 3, item: "Repair estimates", completed: false, required: true },
        { id: 4, item: "Receipts for temporary repairs", completed: false, required: false },
        { id: 5, item: "Property insurance policy", completed: false, required: true }
      ],
      auto: [
        { id: 1, item: "Vehicle damage photos", completed: false, required: true },
        { id: 2, item: "Police report", completed: false, required: true },
        { id: 3, item: "Repair estimates", completed: false, required: true },
        { id: 4, item: "Vehicle registration", completed: false, required: true },
        { id: 5, item: "Driver's license", completed: false, required: true }
      ],
      general: [
        { id: 1, item: "Incident photos", completed: false, required: true },
        { id: 2, item: "Witness statements", completed: false, required: false },
        { id: 3, item: "Medical records (if applicable)", completed: false, required: false },
        { id: 4, item: "Insurance policy", completed: false, required: true },
        { id: 5, item: "Correspondence with insurance company", completed: false, required: true }
      ]
    };

    const checklist = checklists[claimType] || checklists.general;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        checklist,
        totalItems: checklist.length,
        requiredItems: checklist.filter(item => item.required).length,
        completedItems: checklist.filter(item => item.completed).length
      })
    };
  } catch (error) {
    console.error('Documentation checklist error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Documentation checklist failed' })
    };
  }
};


