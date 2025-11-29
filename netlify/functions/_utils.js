const json = (status, data) => new Response(JSON.stringify(data), { status, headers:{'Content-Type':'application/json'}});
function readBody(req){return req.json().catch(()=> ({}));}
function ensureKey() { return process.env.OPENAI_API_KEY; }
async function openaiChat(system, user){
  const key=process.env.OPENAI_API_KEY;
  if(!key) return { demo:true, content:`(demo) ${user.slice(0,200)}` };
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method:'POST',
    headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},
    body: JSON.stringify({ model:"gpt-4o-mini", messages:[{role:'system',content:system},{role:'user',content:user}], temperature:0.3 })
  });
  const data = await r.json().catch(()=> ({}));
  const content = data?.choices?.[0]?.message?.content || JSON.stringify(data).slice(0,500);
  return { demo:false, content };
}

/**
 * Log system event
 * @param {string} eventType - Type of event
 * @param {string} source - Source of event
 * @param {object} payload - Event payload
 */
async function LOG_EVENT(eventType, source, payload = {}) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    await supabase
      .from('system_events')
      .insert({
        event_type: eventType,
        source: source,
        payload: payload
      });
  } catch (error) {
    // Non-critical - don't break main flow
    console.warn('Failed to log event:', error);
  }
}

/**
 * Log error to system_errors table
 * @param {string} eventType - Type of error event
 * @param {object} metadata - Error metadata (function, message, stack, etc.)
 */
async function LOG_ERROR(eventType, metadata = {}) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    await supabase
      .from('system_errors')
      .insert({
        function_name: metadata.function || 'unknown',
        error_message: metadata.message || 'Unknown error',
        error_code: metadata.code || 'CN-5000',
        metadata: metadata
      });
  } catch (error) {
    console.warn('Failed to log error:', error);
  }
}

/**
 * Log API usage to api_usage_logs table
 * @param {object} usageData - Usage data (function, duration_ms, input_token_estimate, output_token_estimate)
 */
async function LOG_USAGE(usageData = {}) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    await supabase
      .from('api_usage_logs')
      .insert({
        function_name: usageData.function || 'unknown',
        duration_ms: usageData.duration_ms || 0,
        success: usageData.success !== false,
        metadata: {
          input_token_estimate: usageData.input_token_estimate || 0,
          output_token_estimate: usageData.output_token_estimate || 0
        }
      });
  } catch (error) {
    console.warn('Failed to log usage:', error);
  }
}

/**
 * Log AI cost to ai_cost_tracking table
 * @param {object} costData - Cost data (function, estimated_cost_usd, model, tokens_in, tokens_out)
 */
async function LOG_COST(costData = {}) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    await supabase
      .from('ai_cost_tracking')
      .insert({
        model: costData.model || 'gpt-4o-mini',
        tokens_in: costData.tokens_in || 0,
        tokens_out: costData.tokens_out || 0,
        cost_usd: costData.estimated_cost_usd || 0,
        metadata: {
          function: costData.function || 'unknown'
        }
      });
  } catch (error) {
    console.warn('Failed to log cost:', error);
  }
}

// CommonJS exports
module.exports = {
  json,
  readBody,
  ensureKey,
  openaiChat,
  LOG_EVENT: async (eventType, source, payload = {}) => {
    try {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      await supabase.from('system_events').insert({
        event_type: eventType,
        source: source,
        payload: payload
      });
    } catch (error) {
      console.warn('Failed to log event:', error);
    }
  },
  LOG_ERROR,
  LOG_USAGE,
  LOG_COST
};