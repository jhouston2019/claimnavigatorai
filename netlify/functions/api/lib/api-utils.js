/**
 * Shared API Utilities
 * Common functions for all API endpoints
 */

const { createClient } = require('@supabase/supabase-js');

/**
 * Get Supabase client
 */
function getSupabaseClient() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

/**
 * Validate authentication token
 * @param {string} authHeader - Authorization header
 * @returns {Promise<{valid: boolean, user: object|null, error: string|null}>}
 */
async function validateAuth(authHeader) {
  if (!authHeader) {
    return { valid: false, user: null, error: 'Missing authorization header' };
  }

  // Check for Bearer token
  if (!authHeader.startsWith('Bearer ')) {
    return { valid: false, user: null, error: 'Invalid authorization format' };
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return { valid: false, user: null, error: 'Missing token' };
  }

  // Check if it's an API key
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { valid: false, user: null, error: 'Database not configured' };
  }

  // First check API keys table
  try {
    const { data: apiKey, error: keyError } = await supabase
      .from('api_keys')
      .select('*, user_id')
      .eq('key', token)
      .eq('active', true)
      .single();

    if (!keyError && apiKey) {
      // Get user for API key
      const { data: { user } } = await supabase.auth.admin.getUserById(apiKey.user_id);
      if (user) {
        return { valid: true, user: user, apiKey: apiKey, error: null };
      }
    }
  } catch (err) {
    // API key check failed, try auth token
  }

  // Try as Supabase auth token
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (!error && user) {
      return { valid: true, user: user, apiKey: null, error: null };
    }
  } catch (err) {
    // Auth check failed
  }

  return { valid: false, user: null, error: 'Invalid or expired token' };
}

/**
 * Validate request schema
 * @param {object} data - Request data
 * @param {object} schema - Schema definition
 * @returns {object} {valid: boolean, errors: array}
 */
function validateSchema(data, schema) {
  const errors = [];

  for (const [key, rules] of Object.entries(schema)) {
    const value = data[key];

    // Required check
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push({ field: key, message: `${key} is required` });
      continue;
    }

    // Skip other validations if field is optional and not provided
    if (!rules.required && (value === undefined || value === null || value === '')) {
      continue;
    }

    // Type check
    if (rules.type && typeof value !== rules.type) {
      errors.push({ field: key, message: `${key} must be ${rules.type}` });
      continue;
    }

    // Array check
    if (rules.array && !Array.isArray(value)) {
      errors.push({ field: key, message: `${key} must be an array` });
      continue;
    }

    // Min length
    if (rules.minLength && value.length < rules.minLength) {
      errors.push({ field: key, message: `${key} must be at least ${rules.minLength} characters` });
      continue;
    }

    // Max length
    if (rules.maxLength && value.length > rules.maxLength) {
      errors.push({ field: key, message: `${key} must be no more than ${rules.maxLength} characters` });
      continue;
    }

    // Custom validator
    if (rules.validator && typeof rules.validator === 'function') {
      const customError = rules.validator(value);
      if (customError) {
        errors.push({ field: key, message: customError });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors
  };
}

/**
 * Rate limit check
 * @param {string} userId - User ID
 * @param {string} endpoint - Endpoint path
 * @param {number} limit - Request limit per window
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Promise<{allowed: boolean, remaining: number, resetAt: number}>}
 */
async function rateLimit(userId, endpoint, limit = 100, windowMs = 60000) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    // If no database, allow request (graceful degradation)
    return { allowed: true, remaining: limit, resetAt: Date.now() + windowMs };
  }

  try {
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get recent requests
    const { data: recentRequests } = await supabase
      .from('api_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('endpoint', endpoint)
      .gte('created_at', new Date(windowStart).toISOString())
      .order('created_at', { ascending: false });

    const requestCount = recentRequests?.length || 0;

    if (requestCount >= limit) {
      const oldestRequest = recentRequests[recentRequests.length - 1];
      const resetAt = new Date(oldestRequest.created_at).getTime() + windowMs;
      return {
        allowed: false,
        remaining: 0,
        resetAt: resetAt
      };
    }

    return {
      allowed: true,
      remaining: limit - requestCount - 1,
      resetAt: now + windowMs
    };
  } catch (error) {
    // On error, allow request (fail open)
    console.warn('Rate limit check failed:', error);
    return { allowed: true, remaining: limit, resetAt: Date.now() + windowMs };
  }
}

/**
 * Send success response
 * @param {object} data - Response data
 * @param {number} statusCode - HTTP status code
 * @returns {object} Netlify function response
 */
function sendSuccess(data, statusCode = 200) {
  return {
    statusCode: statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    },
    body: JSON.stringify({
      success: true,
      data: data,
      error: null
    })
  };
}

/**
 * Send error response
 * @param {string} message - Error message
 * @param {string} code - Error code
 * @param {number} statusCode - HTTP status code
 * @returns {object} Netlify function response
 */
function sendError(message, code = 'API_ERROR', statusCode = 400) {
  return {
    statusCode: statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    },
    body: JSON.stringify({
      success: false,
      data: null,
      error: {
        message: message,
        code: code
      }
    })
  };
}

/**
 * Log API request
 * @param {object} logData - Log data
 * @returns {Promise<void>}
 */
async function logAPIRequest(logData) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.log('API Request:', logData);
    return;
  }

  try {
    await supabase
      .from('api_logs')
      .insert({
        user_id: logData.userId,
        endpoint: logData.endpoint,
        method: logData.method,
        status_code: logData.statusCode,
        response_time_ms: logData.responseTime,
        ip_address: logData.ipAddress,
        user_agent: logData.userAgent,
        request_body: logData.requestBody || null,
        error_message: logData.errorMessage || null
      });
  } catch (error) {
    console.warn('Failed to log API request:', error);
    // Don't throw - logging failure shouldn't break API
  }
}

/**
 * Parse request body
 * @param {string} body - Raw request body
 * @returns {object} Parsed body
 */
function parseBody(body) {
  if (!body) return {};
  
  try {
    return JSON.parse(body);
  } catch (error) {
    return {};
  }
}

/**
 * Get client IP address
 * @param {object} event - Netlify function event
 * @returns {string} IP address
 */
function getClientIP(event) {
  return event.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         event.headers['x-real-ip'] ||
         event.requestContext?.identity?.sourceIp ||
         'unknown';
}

/**
 * Get user agent
 * @param {object} event - Netlify function event
 * @returns {string} User agent
 */
function getUserAgent(event) {
  return event.headers['user-agent'] || 'unknown';
}

module.exports = {
  getSupabaseClient,
  validateAuth,
  validateSchema,
  rateLimit,
  sendSuccess,
  sendError,
  logAPIRequest,
  parseBody,
  getClientIP,
  getUserAgent
};

