const { createClient } = require('@supabase/supabase-js');

exports.handler = async () => {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // simple check: can we run a basic query?
    const { data, error } = await supabase
      .from('ai_admins')
      .select('id')
      .limit(1);

    if (error) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          success: false,
          data: null,
          error: {
            message: 'Supabase health check failed',
            detail: error.message,
            code: 'CN-5001'
          }
        })
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        success: true,
        data: {
          healthy: true,
          supabase: true,
          timestamp: new Date().toISOString()
        },
        error: null
      })
    };
  } catch (err) {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        success: false,
        data: null,
        error: {
          message: 'Unhandled service health error',
          detail: err.message,
          code: 'CN-5002'
        }
      })
    };
  }
};
