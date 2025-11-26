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
    return sendError(`Endpoint not found: ${path}`, 'ENDPOINT_NOT_FOUND', 404);
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
      errorMessage: authResult.error
    });
    return sendError(authResult.error, 'UNAUTHORIZED', 401);
  }

  const userId = authResult.user.id;

  // Check rate limit
  const rateLimitResult = await rateLimit(userId, path, 100, 60000); // 100 requests per minute
  if (!rateLimitResult.allowed) {
    await logAPIRequest({
      userId: userId,
      endpoint: path,
      method: method,
      statusCode: 429,
      responseTime: Date.now() - startTime,
      ipAddress: ipAddress,
      userAgent: userAgent,
      errorMessage: 'Rate limit exceeded'
    });
    return sendError(
      'Rate limit exceeded. Please try again later.',
      'RATE_LIMIT_EXCEEDED',
      429
    );
  }

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

    // Log error
    await logAPIRequest({
      userId: userId,
      endpoint: path,
      method: method,
      statusCode: 500,
      responseTime: responseTime,
      ipAddress: ipAddress,
      userAgent: userAgent,
      requestBody: method !== 'GET' ? body : null,
      errorMessage: error.message
    });

    console.error('API Gateway Error:', error);
    return sendError(
      'Internal server error',
      'INTERNAL_ERROR',
      500
    );
  }
};

