/**
 * Shared API Utilities
 * Common functions for all API endpoints
 */

const { createClient } = require('@supabase/supabase-js');

/**
 * Rate limit configuration
 */
const RATE_LIMITS = {
  perMinutePerKey: 120,
  perMinutePerIP: 300,
  burstLimit: 50,        // Requests in 10-second window
  burstWindowMs: 10000   // 10 seconds
};

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
 * Advanced rate limit check with per-key, per-IP, and burst protection
 * @param {string} userId - User ID
 * @param {string} apiKey - API key (if available)
 * @param {string} ipAddress - Client IP address
 * @param {string} endpoint - Endpoint path
 * @returns {Promise<{allowed: boolean, remaining: number, resetAt: number, reason?: string}>}
 */
async function rateLimit(userId, apiKey, ipAddress, endpoint) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    // If no database, allow request (graceful degradation)
    return { allowed: true, remaining: RATE_LIMITS.perMinutePerKey, resetAt: Date.now() + 60000 };
  }

  try {
    const now = new Date();
    const nowMs = now.getTime();
    const oneMinuteAgo = new Date(nowMs - 60000);
    const burstWindowStart = new Date(nowMs - RATE_LIMITS.burstWindowMs);

    // Check if IP or key is temporarily blocked
    if (apiKey || ipAddress) {
      const { data: blocked } = await supabase
        .from('api_rate_limits')
        .select('blocked_until')
        .or(`api_key.eq.${apiKey || 'null'},ip_address.eq.${ipAddress || 'null'}`)
        .gt('blocked_until', now.toISOString())
        .limit(1);

      if (blocked && blocked.length > 0) {
        const blockedUntil = new Date(blocked[0].blocked_until);
        return {
          allowed: false,
          remaining: 0,
          resetAt: blockedUntil.getTime(),
          reason: 'Temporarily blocked due to rate limit violation'
        };
      }
    }

    let keyRequestCount = 0;
    let ipRequestCount = 0;
    let burstCount = 0;

    // Check per-key rate limit (1 minute window)
    if (apiKey) {
      const { data: keyRequests } = await supabase
        .from('api_logs')
        .select('created_at')
        .eq('user_id', userId)
        .gte('created_at', oneMinuteAgo.toISOString());

      keyRequestCount = keyRequests?.length || 0;

      if (keyRequestCount >= RATE_LIMITS.perMinutePerKey) {
        // Block for 5 minutes
        const blockedUntil = new Date(nowMs + 300000);
        await supabase
          .from('api_rate_limits')
          .insert({
            api_key: apiKey,
            window_start: now,
            request_count: keyRequestCount,
            blocked_until: blockedUntil
          });

        return {
          allowed: false,
          remaining: 0,
          resetAt: blockedUntil.getTime(),
          reason: 'Per-key rate limit exceeded'
        };
      }
    }

    // Check per-IP rate limit (1 minute window)
    if (ipAddress) {
      const { data: ipRequests } = await supabase
        .from('api_logs')
        .select('created_at')
        .eq('ip_address', ipAddress)
        .gte('created_at', oneMinuteAgo.toISOString());

      ipRequestCount = ipRequests?.length || 0;

      if (ipRequestCount >= RATE_LIMITS.perMinutePerIP) {
        // Block for 5 minutes
        const blockedUntil = new Date(nowMs + 300000);
        await supabase
          .from('api_rate_limits')
          .insert({
            ip_address: ipAddress,
            window_start: now,
            request_count: ipRequestCount,
            blocked_until: blockedUntil
          });

        return {
          allowed: false,
          remaining: 0,
          resetAt: blockedUntil.getTime(),
          reason: 'Per-IP rate limit exceeded'
        };
      }
    }

    // Check burst limit (10 second window)
    if (apiKey || ipAddress) {
      const { data: burstRequests } = await supabase
        .from('api_logs')
        .select('created_at')
        .or(`user_id.eq.${userId},ip_address.eq.${ipAddress || 'null'}`)
        .gte('created_at', burstWindowStart.toISOString());

      burstCount = burstRequests?.length || 0;

      if (burstCount >= RATE_LIMITS.burstLimit) {
        // Block for 1 minute
        const blockedUntil = new Date(nowMs + 60000);
        await supabase
          .from('api_rate_limits')
          .insert({
            api_key: apiKey || null,
            ip_address: ipAddress || null,
            window_start: now,
            request_count: burstCount,
            blocked_until: blockedUntil
          });

        return {
          allowed: false,
          remaining: 0,
          resetAt: blockedUntil.getTime(),
          reason: 'Burst rate limit exceeded'
        };
      }
    }

    // Calculate remaining requests
    const keyRemaining = apiKey ? Math.max(0, RATE_LIMITS.perMinutePerKey - keyRequestCount) : RATE_LIMITS.perMinutePerKey;
    const ipRemaining = ipAddress ? Math.max(0, RATE_LIMITS.perMinutePerIP - ipRequestCount) : RATE_LIMITS.perMinutePerIP;
    const remaining = Math.min(keyRemaining, ipRemaining);

    return {
      allowed: true,
      remaining: remaining,
      resetAt: nowMs + 60000
    };
  } catch (error) {
    // FAIL CLOSED: On error, deny request
    console.error('Rate limit check failed - denying request:', error);
    return { allowed: false, remaining: 0, resetAt: Date.now() + 60000, error: 'Rate limit verification failed' };
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
function sendError(message, code = 'CN-5000', statusCode = 400, details = null) {
  const errorResponse = {
    success: false,
    data: null,
    error: {
      message: message,
      code: code
    }
  };

  if (details) {
    errorResponse.error.details = details;
  }

  return {
    statusCode: statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    },
    body: JSON.stringify(errorResponse)
  };
}

/**
 * Sanitize input to prevent injection attacks
 * @param {string} input - Input string
 * @param {number} maxLength - Maximum length
 * @returns {string} Sanitized string
 */
function sanitizeInput(input, maxLength = 10000) {
  if (typeof input !== 'string') {
    return input;
  }

  // Remove dangerous characters
  let sanitized = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();

  // Enforce maximum length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Log API request (with masked API keys)
 * @param {object} logData - Log data
 * @returns {Promise<void>}
 */
async function logAPIRequest(logData) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    // Mask API key in console logs
    const maskedKey = logData.apiKey ? logData.apiKey.substring(0, 4) + '***' : null;
    console.log('API Request:', { ...logData, apiKey: maskedKey });
    return;
  }

  try {
    // Mask API key before logging
    const maskedKey = logData.apiKey ? logData.apiKey.substring(0, 4) + '***' : null;

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

    // Also log to event_logs for observability
    if (logData.apiKey) {
      await supabase
        .from('api_event_logs')
        .insert({
          api_key: maskedKey, // Store masked key
          event_type: 'api_request',
          endpoint: logData.endpoint,
          status: logData.statusCode < 400 ? 'success' : 'error',
          error_code: logData.errorCode || null,
          latency_ms: logData.responseTime,
          metadata: {
            method: logData.method,
            ip_address: logData.ipAddress
          }
        })
        .catch(err => {
          // Don't fail if event log fails
          console.warn('Failed to log to event_logs:', err);
        });
    }
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
  sanitizeInput,
  parseBody,
  getClientIP,
  getUserAgent,
  RATE_LIMITS
};

