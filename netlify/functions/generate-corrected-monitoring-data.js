const { createClient } = require("@supabase/supabase-js");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: "",
    };
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const rand = (min, max) =>
      Math.floor(Math.random() * (max - min + 1)) + min;

    const randomIP = () =>
      `${rand(1, 255)}.${rand(0, 255)}.${rand(0, 255)}.${rand(1, 255)}`;

    const randomTimestamp = () =>
      new Date(Date.now() - rand(0, 30) * 86400000).toISOString();

    const functions = [
      "ai-document-generator",
      "generate-letter",
      "ai-policy-review",
      "ai-rom-estimator",
      "claim-analysis",
      "ai-advisory",
      "monitoring-errors-list",
      "monitoring-usage-list",
      "monitoring-cost-list",
    ];

    //
    // -------------------------
    // AUDIT LOG
    // -------------------------
    //
    const auditData = Array.from({ length: 50 }).map(() => ({
      user_id: null,
      action: "system_event",
      details: { info: "Mock audit log entry" },
      ip_address: randomIP(),
      user_agent: "MockDataGenerator/1.0",
    }));

    await supabase.from("audit_log").insert(auditData);

    //
    // -------------------------
    // API USAGE LOGS
    // -------------------------
    //
    const usageData = Array.from({ length: 200 }).map(() => ({
      timestamp: randomTimestamp(),
      function_name: functions[rand(0, functions.length - 1)],
      latency_ms: rand(40, 900),
      status_code: rand(200, 500),
      request_id: crypto.randomUUID(),
      user_id: null,
    }));

    await supabase.from("api_usage_logs").insert(usageData);

    //
    // -------------------------
    // AI COST TRACKING
    // -------------------------
    //
    const costData = Array.from({ length: 100 }).map(() => ({
      timestamp: randomTimestamp(),
      model: "gpt-4o-mini",
      tokens_input: rand(200, 4000),
      tokens_output: rand(200, 4000),
      cost_usd: Number((Math.random() * 0.1).toFixed(4)),
      function_name: functions[rand(0, functions.length - 1)],
      request_id: crypto.randomUUID(),
    }));

    await supabase.from("ai_cost_tracking").insert(costData);

    //
    // -------------------------
    // SYSTEM EVENTS
    // -------------------------
    //
    const eventTypes = ["INFO", "WARN", "ERROR"];

    const eventData = Array.from({ length: 100 }).map(() => ({
      timestamp: randomTimestamp(),
      event_type: eventTypes[rand(0, eventTypes.length - 1)],
      event_source: "mock-generator",
      details: { message: "Mock system event" },
      user_id: null,
    }));

    await supabase.from("system_events").insert(eventData);

    //
    // -------------------------
    // RATE LIMIT LOGS
    // -------------------------
    //
    const rateData = Array.from({ length: 50 }).map(() => ({
      id: crypto.randomUUID(),
      timestamp: randomTimestamp(),
      function_name: functions[rand(0, functions.length - 1)],
      limit_type: "ip",
      count: rand(1, 10),
      request_id: crypto.randomUUID(),
      meta: {},
      ip_address: randomIP(),
      created_at: randomTimestamp(),
      endpoint: "/api/mock",
      api_key: "none",
      hit_count: rand(1, 3),
      metadata: {},
    }));

    await supabase.from("rate_limit_logs").insert(rateData);

    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify({
        success: true,
        message: "Mock monitoring data inserted successfully.",
        inserted: {
          audit_log: auditData.length,
          api_usage_logs: usageData.length,
          ai_cost_tracking: costData.length,
          system_events: eventData.length,
          rate_limit_logs: rateData.length,
        },
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({ success: false, error: err.message }),
    };
  }
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}
