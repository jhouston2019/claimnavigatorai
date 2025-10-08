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
    const { location, specialty, serviceType } = JSON.parse(event.body || '{}');
    
    // Mock professional data - in production, this would query a database
    const professionals = [
      {
        id: 1,
        name: "John Smith",
        specialty: "Property Damage",
        location: "Miami, FL",
        rating: 4.8,
        experience: "15 years",
        services: ["Property Assessment", "Damage Documentation", "Expert Testimony"],
        contact: "john@example.com",
        phone: "(305) 555-0123"
      },
      {
        id: 2,
        name: "Sarah Johnson",
        specialty: "Insurance Claims",
        location: "Orlando, FL",
        rating: 4.9,
        experience: "12 years",
        services: ["Claim Negotiation", "Policy Review", "Settlement Analysis"],
        contact: "sarah@example.com",
        phone: "(407) 555-0456"
      },
      {
        id: 3,
        name: "Michael Brown",
        specialty: "Legal Representation",
        location: "Tampa, FL",
        rating: 4.7,
        experience: "20 years",
        services: ["Legal Consultation", "Court Representation", "Document Review"],
        contact: "michael@example.com",
        phone: "(813) 555-0789"
      }
    ];

    // Filter by location and specialty if provided
    let filteredProfessionals = professionals;
    if (location) {
      filteredProfessionals = filteredProfessionals.filter(p => 
        p.location.toLowerCase().includes(location.toLowerCase())
      );
    }
    if (specialty) {
      filteredProfessionals = filteredProfessionals.filter(p => 
        p.specialty.toLowerCase().includes(specialty.toLowerCase())
      );
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        professionals: filteredProfessionals,
        total: filteredProfessionals.length
      })
    };
  } catch (error) {
    console.error('Professional search error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Professional search failed' })
    };
  }
};


