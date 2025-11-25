/**
 * Expert Witness Database
 * Search and retrieve expert witness profiles
 */

const { runToolAIJSON } = require('../lib/advanced-tools-ai-helper');
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Handle GET request for individual expert profile
  if (event.httpMethod === 'GET') {
    try {
      const expertId = event.queryStringParameters?.id;
      
      if (!expertId || !process.env.SUPABASE_URL) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing expert ID or database not configured' })
        };
      }

      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      const { data: expert, error } = await supabase
        .from('expert_witnesses')
        .select('*')
        .eq('id', expertId)
        .single();

      if (error || !expert) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Expert not found' })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(expert)
      };
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: error.message })
      };
    }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { search, specialty, state } = body;

    if (!process.env.SUPABASE_URL) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Database not configured' })
      };
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Build query
    let query = supabase.from('expert_witnesses').select('*');

    if (specialty) {
      query = query.eq('specialty', specialty);
    }

    if (state) {
      query = query.eq('state', state);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,specialty.ilike.%${search}%,summary.ilike.%${search}%`);
    }

    const { data: experts, error } = await query.limit(50);

    if (error) {
      throw error;
    }

    // If no experts found and database is empty, generate some initial entries
    if ((!experts || experts.length === 0) && process.env.OPENAI_API_KEY) {
      const userPrompt = `Generate 5 expert witness profiles in JSON format. Each profile should have:
- name (full name)
- specialty (construction, engineering, roofing, plumbing, electrical, HVAC, mold, forensic-accounting, or other)
- license_number (realistic license format)
- state (US state abbreviation)
- experience_years (number)
- summary (2-3 sentences about expertise)
- contact_email (realistic email)

Return as JSON array.`;

      try {
        const generatedProfiles = await runToolAIJSON('expert-witness-database', userPrompt);

        // Insert generated profiles
        if (Array.isArray(generatedProfiles)) {
          const { data: inserted, error: insertError } = await supabase
            .from('expert_witnesses')
            .insert(generatedProfiles)
            .select();

          if (!insertError && inserted) {
            return {
              statusCode: 200,
              headers,
              body: JSON.stringify({ experts: inserted })
            };
          }
        }
      } catch (aiError) {
        console.error('AI generation error:', aiError);
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ experts: experts || [] })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

