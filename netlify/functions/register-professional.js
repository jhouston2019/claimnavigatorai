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
      user_id,
      company_name, 
      specialty, 
      state,
      email
    } = JSON.parse(event.body);

    // Validate required fields
    if (!user_id || !state) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Missing required fields: user_id, state' 
        })
      };
    }

    // Check if professional already exists
    const { data: existingProfessional, error: checkError } = await supabase
      .from('professionals')
      .select('id')
      .eq('id', user_id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking existing professional:', checkError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to check existing professional' })
      };
    }

    if (existingProfessional) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({ error: 'Professional already registered' })
      };
    }

    // Insert the professional
    const { data: professional, error: insertError } = await supabase
      .from('professionals')
      .insert([{
        id: user_id,
        role: 'professional',
        credits: 0,
        company_name: company_name || null,
        specialty: specialty || null,
        state: state
      }])
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting professional:', insertError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to register professional' })
      };
    }

    console.log('Professional registered successfully:', professional.id);

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({ 
        success: true, 
        professional_id: professional.id,
        message: 'Professional registered successfully'
      })
    };

  } catch (error) {
    console.error('Error registering professional:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to register professional',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    };
  }
};
