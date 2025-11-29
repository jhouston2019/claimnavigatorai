/**
 * Generate corrected monitoring data for all tables
 * Populates audit_log, api_usage_logs, ai_cost_tracking, rate_limit_logs, system_events
 */

const { createClient } = require('@supabase/supabase-js');
const { randomUUID } = require('crypto');

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};

// Helper to generate random date within last 30 days
function randomDate() {
  const now = Date.now();
  const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
  const randomTime = thirtyDaysAgo + Math.random() * (now - thirtyDaysAgo);
  return new Date(randomTime).toISOString();
}

// Helper to pick random element from array
function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Function names used in the system
const FUNCTION_NAMES = [
  'ai-advisory-system',
  'aiResponseAgent',
  'ai-categorize-evidence',
  'ai-advisory',
  'claim-analysis',
  'ai-evidence-check',
  'generate-evidence-report',
  'generate-letter',
  'ai-response-agent',
  'ai-document-generator',
  'ai-timeline-analyzer',
  'ai-rom-estimator',
  'ai-evidence-auto-tagger',
  'ai-coverage-decoder',
  'ai-policy-review',
  'ai-situational-advisory',
  'monitoring-errors-list',
  'monitoring-usage-list',
  'monitoring-cost-list'
];

// Error codes
const ERROR_CODES = [
  'CN-1000',
  'CN-2000',
  'CN-2001',
  'CN-3000',
  'CN-4000',
  'CN-5000',
  'CN-5001',
  'CN-5002',
  'CN-6000',
  'CN-7000'
];

// Error messages
const ERROR_MESSAGES = [
  'Database connection timeout',
  'Invalid request parameters',
  'Authentication failed',
  'Rate limit exceeded',
  'Internal server error',
  'Missing required field',
  'Validation error',
  'External API error',
  'Resource not found',
  'Permission denied'
];

// AI Models
const AI_MODELS = [
  'gpt-4',
  'gpt-4-turbo',
  'gpt-3.5-turbo',
  'claude-3-opus',
  'claude-3-sonnet',
  'claude-3-haiku'
];

// Event types
const EVENT_TYPES = [
  'function_call',
  'error_occurred',
  'rate_limit_hit',
  'cost_threshold_exceeded',
  'user_action',
  'system_alert',
  'data_export',
  'cache_miss',
  'database_query',
  'api_request'
];

// Event sources
const EVENT_SOURCES = [
  'admin-console',
  'api-gateway',
  'monitoring-system',
  'background-job',
  'user-request',
  'scheduled-task',
  'webhook',
  'internal-service'
];

// IP addresses
const IP_ADDRESSES = [
  '192.168.1.100',
  '10.0.0.50',
  '172.16.0.25',
  '203.0.113.45',
  '198.51.100.12',
  '192.0.2.78'
];

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Generate 50 audit_log records (errors)
    const auditLogs = [];
    for (let i = 0; i < 50; i++) {
      auditLogs.push({
        id: randomUUID(),
        function_name: randomElement(FUNCTION_NAMES),
        error_code: randomElement(ERROR_CODES),
        error_message: randomElement(ERROR_MESSAGES),
        stack_trace: `Error at line ${Math.floor(Math.random() * 1000)}: ${randomElement(ERROR_MESSAGES)}\n  at Function.${randomElement(FUNCTION_NAMES)} (index.js:${Math.floor(Math.random() * 500)}:${Math.floor(Math.random() * 50)})\n  at Object.handler (handler.js:${Math.floor(Math.random() * 200)}:${Math.floor(Math.random() * 30)})`,
        created_at: randomDate()
      });
    }

    // Generate 200 usage records
    const usageLogs = [];
    for (let i = 0; i < 200; i++) {
      const duration = Math.floor(Math.random() * 5000) + 100; // 100-5100ms
      const tokensIn = Math.floor(Math.random() * 5000) + 100;
      const tokensOut = Math.floor(Math.random() * 2000) + 50;
      usageLogs.push({
        function_name: randomElement(FUNCTION_NAMES),
        duration_ms: duration,
        input_token_estimate: tokensIn,
        output_token_estimate: tokensOut,
        success: Math.random() > 0.15, // 85% success rate
        created_at: randomDate()
      });
    }

    // Generate 100 cost records
    const costRecords = [];
    for (let i = 0; i < 100; i++) {
      const tokensIn = Math.floor(Math.random() * 10000) + 500;
      const tokensOut = Math.floor(Math.random() * 5000) + 200;
      const model = randomElement(AI_MODELS);
      // Rough cost calculation: $0.03 per 1K input tokens, $0.06 per 1K output tokens
      const cost = (tokensIn / 1000) * 0.03 + (tokensOut / 1000) * 0.06;
      costRecords.push({
        function_name: randomElement(FUNCTION_NAMES),
        model: model,
        tokens_in: tokensIn,
        tokens_out: tokensOut,
        cost_usd: Math.round(cost * 10000) / 10000, // Round to 4 decimals
        created_at: randomDate()
      });
    }

    // Generate 50 rate limit records
    const rateLimitLogs = [];
    for (let i = 0; i < 50; i++) {
      rateLimitLogs.push({
        ip_address: randomElement(IP_ADDRESSES),
        function_name: randomElement(FUNCTION_NAMES),
        count: Math.floor(Math.random() * 200) + 1,
        created_at: randomDate()
      });
    }

    // Generate 200 event records
    const events = [];
    for (let i = 0; i < 200; i++) {
      events.push({
        event_type: randomElement(EVENT_TYPES),
        source: randomElement(EVENT_SOURCES),
        payload: {
          function_name: randomElement(FUNCTION_NAMES),
          duration_ms: Math.floor(Math.random() * 5000) + 100,
          user_id: `user_${Math.floor(Math.random() * 1000)}`,
          request_id: `req_${Math.random().toString(36).substring(7)}`,
          metadata: {
            ip: randomElement(IP_ADDRESSES),
            user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            timestamp: randomDate()
          }
        },
        created_at: randomDate()
      });
    }

    // Insert all data
    const [auditResult, usageResult, costResult, rateLimitResult, eventsResult] = await Promise.all([
      supabase.from('audit_log').insert(auditLogs),
      supabase.from('api_usage_logs').insert(usageLogs),
      supabase.from('ai_cost_tracking').insert(costRecords),
      supabase.from('rate_limit_logs').insert(rateLimitLogs),
      supabase.from('system_events').insert(events)
    ]);

    // Check for errors
    const insertErrors = [
      auditResult.error,
      usageResult.error,
      costResult.error,
      rateLimitResult.error,
      eventsResult.error
    ].filter(e => e !== null);

    if (insertErrors.length > 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: false,
          message: "Some data failed to insert",
          error: insertErrors.map(e => e.message).join('; ')
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: "Full monitoring data generated.",
        error: null
      })
    };

  } catch (error) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: false,
        message: "Failed to generate monitoring data",
        error: error.message
      })
    };
  }
};

