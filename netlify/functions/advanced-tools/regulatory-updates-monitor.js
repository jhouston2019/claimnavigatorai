/**
 * Regulatory Updates Monitor
 * Monitor state-specific regulatory updates
 */

const { runToolAI } = require('../lib/advanced-tools-ai-helper');
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
    const { state, category } = body;

    if (!state) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'State is required' })
      };
    }

    let updates = [];
    let aiNotes = '';

    // Query Supabase for existing updates
    if (process.env.SUPABASE_URL) {
      try {
        const supabase = createClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        let query = supabase
          .from('regulatory_updates')
          .select('*')
          .eq('state', state)
          .order('created_at', { ascending: false })
          .limit(10);

        if (category) {
          query = query.eq('category', category);
        }

        const { data, error } = await query;

        if (!error && data) {
          updates = data;
        }
      } catch (dbError) {
        console.error('Database query error:', dbError);
      }
    }

    // If no updates found, generate using AI
    if (updates.length === 0) {
      const userPrompt = `Generate regulatory updates for ${state}${category ? ` in the ${category} category` : ''}.

Provide:
1. Recent regulatory changes or updates
2. New case law affecting insurance claims
3. Statutory updates
4. Regulatory enforcement actions

Format as a summary of key regulatory developments.`;

      try {
        const aiResponse = await runToolAI('regulatory-updates-monitor', userPrompt, {
          model: 'gpt-4o-mini',
          temperature: 0.3,
          max_tokens: 1500
        });

        // Create synthetic update
        updates = [{
          title: `Regulatory Update for ${state}${category ? ` - ${category}` : ''}`,
          summary: aiResponse.substring(0, 500),
          full_text: aiResponse,
          category: category || 'General',
          state: state
        }];
      } catch (aiError) {
        console.error('AI generation error:', aiError);
        updates = [{
          title: 'No Updates Available',
          summary: 'Unable to generate regulatory updates at this time.',
          category: category || 'General',
          state: state
        }];
      }
    }

    // Generate AI impact summary
    if (updates.length > 0) {
      const userPrompt = `Based on these regulatory updates for ${state}:

${updates.map(u => `${u.title}: ${u.summary || u.full_text}`).join('\n\n')}

Explain what this means for policyholders and their claims. Provide actionable insights.`;

      try {
        aiNotes = await runToolAI('regulatory-updates-monitor', userPrompt, {
          model: 'gpt-4o-mini',
          temperature: 0.3,
          max_tokens: 800
        });
      } catch (aiError) {
        console.error('AI summary error:', aiError);
        aiNotes = 'AI impact analysis unavailable.';
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        updates,
        aiNotes
      })
    };

  } catch (error) {
    console.error('Regulatory monitor error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

