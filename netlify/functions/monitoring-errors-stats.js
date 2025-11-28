/**
 * Get error statistics
 */

const { createClient } = require('@supabase/supabase-js');
const requireAdmin = require('./_admin-auth');

exports.handler = async (event) => {
  const auth = requireAdmin(event);
  if (!auth.authorized) {
    return {
      statusCode: 401,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        data: null,
        error: auth.error
      })
    };
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const hours = parseInt(event.queryStringParameters?.hours || '24');
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    // Get error counts by function
    const { data: byFunction } = await supabase
      .from('system_errors')
      .select('function_name')
      .gte('created_at', since);

    const functionCounts = {};
    if (byFunction) {
      byFunction.forEach(err => {
        const func = err.function_name || 'unknown';
        functionCounts[func] = (functionCounts[func] || 0) + 1;
      });
    }

    // Get error counts by code
    const { data: byCode } = await supabase
      .from('system_errors')
      .select('error_code')
      .gte('created_at', since);

    const codeCounts = {};
    if (byCode) {
      byCode.forEach(err => {
        const code = err.error_code || 'unknown';
        codeCounts[code] = (codeCounts[code] || 0) + 1;
      });
    }

    // Total errors
    const { count: totalErrors } = await supabase
      .from('system_errors')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', since);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        data: {
          total_errors: totalErrors || 0,
          by_function: functionCounts,
          by_code: codeCounts,
          time_range_hours: hours
        },
        error: null
      })
    };
  } catch (err) {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        data: null,
        error: {
          message: 'Failed to fetch error stats',
          code: 'CN-5000',
          detail: err.message
        }
      })
    };
  }
};
