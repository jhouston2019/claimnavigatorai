/**
 * API Endpoint: /history/query
 * Queries settlement history database
 */

const { getSupabaseClient, sendSuccess, sendError } = require('./lib/api-utils');

exports.handler = async (event) => {
  try {
    const { body, userId } = event;
    const supabase = getSupabaseClient();

    if (!supabase) {
      return sendError('Database not configured', 'CN-8000', 500);
    }

    // Build query
    let query = supabase
      .from('settlement_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(parseInt(body?.limit || '50'));

    // Apply filters
    if (body.carrier) {
      query = query.eq('carrier', body.carrier);
    }
    if (body.state) {
      query = query.eq('state', body.state);
    }
    if (body.claim_type) {
      query = query.eq('claim_type', body.claim_type);
    }
    if (body.min_payout) {
      query = query.gte('final_payout', body.min_payout);
    }
    if (body.max_payout) {
      query = query.lte('final_payout', body.max_payout);
    }

    const { data: history, error } = await query;

    if (error) {
      return sendError('Failed to query settlement history', 'CN-5001', 500, { databaseError: error.message });
    }

    return sendSuccess({
      settlements: history || [],
      count: history?.length || 0,
      filters: {
        carrier: body.carrier || null,
        state: body.state || null,
        claim_type: body.claim_type || null
      }
    });

  } catch (error) {
    console.error('History Query API Error:', error);
    
    try {
      return sendError('Failed to query settlement history', 'CN-5000', 500, { errorType: error.name });
    } catch (fallbackError) {
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          data: null,
          error: {
            code: 'CN-9000',
            message: 'Critical system failure'
          }
        })
      };
    }
  }
};

