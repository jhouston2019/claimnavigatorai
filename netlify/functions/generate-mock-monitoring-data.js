const { createClient } = require('@supabase/supabase-js');

exports.handler = async () => {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    const timestamp = new Date().toISOString();

    // Insert mock system event
    await supabase.from('system_events').insert({
      event_type: 'mock_event',
      source: 'mock-generator',
      details: { message: 'Mock event created for testing' },
      created_at: timestamp
    });

    // Insert mock system error
    await supabase.from('system_errors').insert({
      function: 'mock-function',
      error_message: 'Mock error message',
      stack_trace: 'mock stack trace',
      created_at: timestamp
    });

    // Insert mock API usage
    await supabase.from('api_usage_logs').insert({
      function: 'mock-ai-endpoint',
      duration_ms: 1234,
      input_token_estimate: 100,
      output_token_estimate: 250,
      success: true,
      created_at: timestamp
    });

    // Insert mock AI cost tracking
    await supabase.from('ai_cost_tracking').insert({
      function: 'mock-ai-endpoint',
      estimated_cost_usd: 0.0025,
      created_at: timestamp
    });

    // Insert mock rate limit log
    await supabase.from('rate_limit_logs').insert({
      ip_address: '127.0.0.1',
      function: 'mock-ai-endpoint',
      attempts: 1,
      created_at: timestamp
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: 'Mock monitoring data inserted successfully!'
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};
