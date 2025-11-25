/**
 * Settlement History Database
 * Search historical settlement data and analyze trends
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
    const { carrier, claimType, state, year, severity, analyzeTrends } = body;

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
    let query = supabase.from('settlement_history').select('*');

    if (carrier) {
      query = query.ilike('carrier', `%${carrier}%`);
    }

    if (claimType) {
      query = query.ilike('claim_type', `%${claimType}%`);
    }

    if (state) {
      query = query.eq('state', state);
    }

    if (year) {
      query = query.eq('year', parseInt(year));
    }

    if (severity) {
      query = query.eq('severity', severity);
    }

    const { data: settlements, error } = await query.limit(100);

    if (error) {
      throw error;
    }

    // If analyzeTrends is requested, use AI to analyze
    if (analyzeTrends && settlements && settlements.length > 0 && process.env.OPENAI_API_KEY) {
      const settlementSummary = settlements.map(s => ({
        carrier: s.carrier,
        claimType: s.claim_type,
        state: s.state,
        initialOffer: s.initial_offer,
        finalPayout: s.final_payout,
        timelineDays: s.timeline_days,
        disputeMethod: s.dispute_method
      }));

      const userPrompt = `Analyze these ${settlements.length} settlement records and provide:
1. Average settlement increase percentage (final vs initial)
2. Common dispute methods used
3. Timeline patterns
4. Carrier-specific patterns if applicable
5. Recommendations for policyholders

Settlement data:
${JSON.stringify(settlementSummary, null, 2)}

Provide a concise analysis (3-4 paragraphs).`;

      try {
        const trendsAnalysis = await runToolAI('settlement-history-database', userPrompt);
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            settlements: settlements || [],
            trends: trendsAnalysis
          })
        };
      } catch (aiError) {
        console.error('AI analysis error:', aiError);
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ settlements: settlements || [] })
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

