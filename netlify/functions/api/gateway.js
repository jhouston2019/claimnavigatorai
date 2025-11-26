/**
 * API Gateway
 * Central router for all API endpoints
 */

const { 
  validateAuth, 
  validateSchema, 
  rateLimit, 
  sendSuccess, 
  sendError, 
  logAPIRequest,
  parseBody,
  getClientIP,
  getUserAgent
} = require('./lib/api-utils');

// Route handlers
const handlers = {
  'fnol/create': require('./fnol-create'),
  'deadlines/check': require('./deadlines-check'),
  'compliance/analyze': require('./compliance-analyze'),
  'alerts/list': require('./alerts-list'),
  'alerts/resolve': require('./alerts-resolve'),
  'evidence/upload': require('./evidence-upload'),
  'estimate/interpret': require('./estimate-interpret'),
  'settlement/calc': require('./settlement-calc'),
  'policy/compare': require('./policy-compare'),
  'history/query': require('./history-query'),
  'expert/find': require('./expert-find'),
  'checklist/generate': require('./checklist-generate')
};

/**
 * Main gateway handler
 */
exports.handler = async (event, context) => {
  const startTime = Date.now();
  const method = event.httpMethod;
  const path = event.path.replace('/.netlify/functions/api/', '');

  // Handle OPTIONS (CORS preflight)
  if (method === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      },
      body: ''
    };
  }

  // Parse request
  const body = parseBody(event.body);
  const authHeader = event.headers.authorization || event.headers.Authorization;
  const ipAddress = getClientIP(event);
  const userAgent = getUserAgent(event);

  // Find handler
  const handler = handlers[path];
  if (!handler) {
    return sendError(`Endpoint not found: ${path}`, 'CN-7000', 404, { endpoint: path });
  }

  // Validate authentication
  const authResult = await validateAuth(authHeader);
  if (!authResult.valid) {
    await logAPIRequest({
      userId: null,
      endpoint: path,
      method: method,
      statusCode: 401,
      responseTime: Date.now() - startTime,
      ipAddress: ipAddress,
      userAgent: userAgent,
      errorCode: 'CN-6000',
      errorMessage: authResult.error
    });
    return sendError(authResult.error, 'CN-6000', 401);
  }

  const userId = authResult.user.id;
  const apiKey = authResult.apiKey?.key || null;

  // Check advanced rate limiting (per-key, per-IP, burst)
  const rateLimitResult = await rateLimit(userId, apiKey, ipAddress, path);
  if (!rateLimitResult.allowed) {
    await logAPIRequest({
      userId: userId,
      apiKey: apiKey,
      endpoint: path,
      method: method,
      statusCode: 429,
      responseTime: Date.now() - startTime,
      ipAddress: ipAddress,
      userAgent: userAgent,
      errorCode: 'CN-4000',
      errorMessage: rateLimitResult.reason || 'Rate limit exceeded'
    });
    return sendError(
      rateLimitResult.reason || 'Rate limit exceeded. Please try again later.',
      'CN-4000',
      429,
      {
        resetAt: new Date(rateLimitResult.resetAt).toISOString(),
        remaining: rateLimitResult.remaining
      }
    );
  }

  // Record API request event
  const { recordEvent } = require('../lib/monitoring-event-helper');
  await recordEvent('api.request', 'api-gateway', {
    endpoint: path,
    method: method,
    api_key_id: authResult.apiKey?.id || null
  });

  // Call handler
  try {
    const result = await handler.handler({
      ...event,
      body: body,
      userId: userId,
      user: authResult.user,
      apiKey: authResult.apiKey
    }, context);

    const responseTime = Date.now() - startTime;

    // Log successful request
    await logAPIRequest({
      userId: userId,
      apiKey: apiKey,
      endpoint: path,
      method: method,
      statusCode: result.statusCode || 200,
      responseTime: responseTime,
      ipAddress: ipAddress,
      userAgent: userAgent,
      requestBody: method !== 'GET' ? body : null
    });

    return result;
  } catch (error) {
    const responseTime = Date.now() - startTime;

    // Log error to system_errors
    const { logError } = require('../lib/error-logger');
    await logError(error, 'api-gateway', 'CN-5000', {
      endpoint: path,
      method: method,
      userId: userId || null
    });

    // Record error event
    const { recordEvent } = require('../lib/monitoring-event-helper');
    await recordEvent('api.error', 'api-gateway', {
      endpoint: path,
      error_code: 'CN-5000'
    });

    // Log error
    await logAPIRequest({
      userId: userId,
      apiKey: apiKey,
      endpoint: path,
      method: method,
      statusCode: 500,
      responseTime: responseTime,
      ipAddress: ipAddress,
      userAgent: userAgent,
      errorCode: 'CN-5000',
      requestBody: method !== 'GET' ? body : null,
      errorMessage: error.message
    });

    console.error('API Gateway Error:', error);
    return sendError(
      'Internal server error',
      'CN-5000',
      500,
      { errorType: error.name, endpoint: path }
    );
  }
};

