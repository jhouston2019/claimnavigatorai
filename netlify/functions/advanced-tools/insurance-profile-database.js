/**
 * Insurance Company Profile Database
 * Query and generate carrier profiles
 */

const { runToolAIJSON } = require('../lib/advanced-tools-ai-helper');
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
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
    const { search, state, carrierId, carrierName } = body;

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

    // If carrierId provided, fetch specific carrier
    if (carrierId) {
      const { data: carrier, error } = await supabase
        .from('carrier_profiles')
        .select('*')
        .eq('id', carrierId)
        .single();

      if (error || !carrier) {
        // Generate new profile if not found
        if (carrierName) {
          return await generateCarrierProfile(carrierName, state, supabase);
        }
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Carrier not found' })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ carrier })
      };
    }

    // Search carriers
    let query = supabase.from('carrier_profiles').select('*');
    
    if (search) {
      query = query.ilike('carrier_name', `%${search}%`);
    }
    
    if (state) {
      query = query.eq('state', state);
    }
    
    query = query.limit(50);
    
    const { data: carriers, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Database query failed' })
      };
    }

    // If no results and search term provided, generate a profile
    if (carriers.length === 0 && search) {
      const generated = await generateCarrierProfile(search, state, supabase);
      if (generated.statusCode === 200) {
        const generatedData = JSON.parse(generated.body);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ carriers: [generatedData.carrier] })
        };
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ carriers: carriers || [] })
    };

  } catch (error) {
    console.error('Profile database error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

async function generateCarrierProfile(carrierName, state, supabase) {
  const userPrompt = `Generate a profile for insurance carrier: ${carrierName}${state ? ` in ${state}` : ''}

Provide:
1. A.M. Best rating (estimate if unknown)
2. Known tactics (common claim handling practices)
3. Bad faith history (general patterns)
4. Average response time (typical days)
5. State-level restrictions (if state provided)
6. Additional notes

Format as JSON:
{
  "am_best_rating": "<rating>",
  "known_tactics": ["<tactic1>", "<tactic2>"],
  "bad_faith_history": ["<pattern1>", "<pattern2>"],
  "avg_response_time": <days>,
  "state_restrictions": "<notes>",
  "notes": "<additional info>"
}`;

  try {
    const aiResponseObj = await runToolAIJSON('insurance-profile-database', userPrompt, {
      model: 'gpt-4o-mini',
      temperature: 0.3,
      max_tokens: 1000
    });
    
    // Handle both object and string responses
    let profile;
    if (typeof aiResponseObj === 'object' && aiResponseObj !== null) {
      profile = aiResponseObj;
    } else {
      const aiResponse = typeof aiResponseObj === 'string' ? aiResponseObj : String(aiResponseObj);
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON in AI response');
      }
      profile = JSON.parse(jsonMatch[0]);
    }

    // Insert into database
    const { data: carrier, error } = await supabase
      .from('carrier_profiles')
      .insert({
        carrier_name: carrierName,
        state: state || null,
        am_best_rating: profile.am_best_rating || 'Unknown',
        known_tactics: profile.known_tactics || [],
        bad_faith_history: profile.bad_faith_history || [],
        avg_response_time: profile.avg_response_time || null,
        notes: profile.notes || ''
      })
      .select()
      .single();

    if (error) {
      console.error('Insert error:', error);
      // Return generated profile even if insert fails
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: JSON.stringify({
          carrier: {
            carrier_name: carrierName,
            state: state || null,
            ...profile
          }
        })
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({ carrier })
    };

  } catch (error) {
    console.error('Profile generation error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({ error: error.message })
    };
  }
}

