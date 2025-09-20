const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

exports.handler = async (event) => {
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Check for admin authorization (you can implement your own admin check)
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Authorization required' })
      };
    }

    // Extract query parameters
    const { 
      limit = '50', 
      offset = '0', 
      status, 
      date_from, 
      date_to,
      user_id,
      include_logs = 'false'
    } = event.queryStringParameters || {};

    // Build query
    let query = supabase
      .from('claims')
      .select(`
        *,
        claim_access_logs (
          id,
          action,
          document_id,
          document_type,
          timestamp,
          metadata
        )
      `)
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (date_from) {
      query = query.gte('created_at', date_from);
    }

    if (date_to) {
      query = query.lte('created_at', date_to);
    }

    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    // Execute query
    const { data: claims, error } = await query;

    if (error) {
      throw error;
    }

    // Get summary statistics
    const { data: stats, error: statsError } = await supabase
      .from('claims')
      .select('status, amount_paid, created_at');

    if (statsError) {
      console.error('Error getting stats:', statsError);
    }

    // Calculate statistics
    const summary = {
      total_claims: claims.length,
      total_revenue: 0,
      status_breakdown: {},
      recent_activity: 0
    };

    if (stats) {
      stats.forEach(claim => {
        // Revenue calculation
        if (claim.amount_paid) {
          summary.total_revenue += parseFloat(claim.amount_paid);
        }

        // Status breakdown
        summary.status_breakdown[claim.status] = (summary.status_breakdown[claim.status] || 0) + 1;

        // Recent activity (last 7 days)
        const claimDate = new Date(claim.created_at);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        if (claimDate > weekAgo) {
          summary.recent_activity++;
        }
      });
    }

    // Get access log summary if requested
    let accessLogSummary = null;
    if (include_logs === 'true') {
      const { data: logs, error: logsError } = await supabase
        .from('claim_access_logs')
        .select('action, document_type, timestamp')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (!logsError && logs) {
        accessLogSummary = {
          total_actions: logs.length,
          action_breakdown: {},
          document_type_breakdown: {},
          recent_actions: logs.filter(log => {
            const logDate = new Date(log.timestamp);
            const dayAgo = new Date();
            dayAgo.setDate(dayAgo.getDate() - 1);
            return logDate > dayAgo;
          }).length
        };

        logs.forEach(log => {
          accessLogSummary.action_breakdown[log.action] = 
            (accessLogSummary.action_breakdown[log.action] || 0) + 1;
          
          if (log.document_type) {
            accessLogSummary.document_type_breakdown[log.document_type] = 
              (accessLogSummary.document_type_breakdown[log.document_type] || 0) + 1;
          }
        });
      }
    }

    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        data: {
          claims: claims,
          summary: summary,
          access_logs: accessLogSummary,
          pagination: {
            limit: parseInt(limit),
            offset: parseInt(offset),
            total: claims.length
          }
        }
      })
    };

  } catch (error) {
    console.error('Error in admin claims monitor:', error);
    
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};
