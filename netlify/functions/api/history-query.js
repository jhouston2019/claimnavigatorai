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
      return sendError('Database not configured', 'CONFIG_ERROR', 500);
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
      return sendError('Failed to query settlement history', 'DATABASE_ERROR', 500);
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
    return sendError('Failed to query settlement history', 'INTERNAL_ERROR', 500);
  }
};

