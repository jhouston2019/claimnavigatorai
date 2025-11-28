const { createClient } = require('@supabase/supabase-js');

exports.handler = async () => {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  async function insert(table, record) {
    const { error } = await supabase.from(table).insert(record);
    return { table, success: !error, error };
  }

  const results = [];

  results.push(await insert("system_errors", {
    function_name: "test-fn",
    error_message: "Test error",
    stack_trace: "none",
    created_at: new Date().toISOString()
  }));

  results.push(await insert("system_events", {
    event_type: "test_event",
    source: "system",
    payload: { test: true },
    created_at: new Date().toISOString()
  }));

  results.push(await insert("api_usage_logs", {
    function_name: "test-fn",
    ip_address: "127.0.0.1",
    request_payload: { ok: true },
    response_status: 200,
    created_at: new Date().toISOString()
  }));

  results.push(await insert("ai_cost_tracking", {
    tool_name: "test-tool",
    tokens_used: 123,
    cost_usd: 0.002,
    created_at: new Date().toISOString()
  }));

  results.push(await insert("rate_limit_logs", {
    ip_address: "127.0.0.1",
    route: "/test",
    limit: 100,
    remaining: 99,
    created_at: new Date().toISOString()
  }));

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ success: true, results })
  };
};

