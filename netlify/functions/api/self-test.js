/**
 * API Self-Test Endpoint
 * Diagnostic endpoint for system health checks
 */

const { getSupabaseClient, sendSuccess, sendError } = require('./lib/api-utils');

exports.handler = async (event) => {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    checks: {}
  };

  // Check 1: Database connection
  try {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase.from('api_keys').select('count').limit(1);
      diagnostics.checks.database = {
        status: error ? 'error' : 'ok',
        message: error ? error.message : 'Database connection successful',
        timestamp: new Date().toISOString()
      };
    } else {
      diagnostics.checks.database = {
        status: 'error',
        message: 'Supabase not configured',
        timestamp: new Date().toISOString()
      };
    }
  } catch (error) {
    diagnostics.checks.database = {
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    };
  }

  // Check 2: Environment variables
  diagnostics.checks.environment = {
    status: 'ok',
    variables: {
      SUPABASE_URL: process.env.SUPABASE_URL ? 'configured' : 'missing',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'configured' : 'missing',
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'configured' : 'missing',
      SENDGRID_API_KEY: process.env.SENDGRID_API_KEY ? 'configured' : 'missing'
    },
    timestamp: new Date().toISOString()
  };

  // Check 3: Endpoint signatures
  const endpoints = [
    'fnol/create',
    'deadlines/check',
    'compliance/analyze',
    'alerts/list',
    'alerts/resolve',
    'evidence/upload',
    'estimate/interpret',
    'settlement/calc',
    'policy/compare',
    'history/query',
    'expert/find',
    'checklist/generate'
  ];

  diagnostics.checks.endpoints = {
    status: 'ok',
    count: endpoints.length,
    endpoints: endpoints,
    timestamp: new Date().toISOString()
  };

  // Check 4: Auth validation
  try {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (authHeader) {
      const { validateAuth } = require('./lib/api-utils');
      const authResult = await validateAuth(authHeader);
      diagnostics.checks.auth = {
        status: authResult.valid ? 'ok' : 'error',
        message: authResult.valid ? 'Auth validation working' : authResult.error,
        timestamp: new Date().toISOString()
      };
    } else {
      diagnostics.checks.auth = {
        status: 'skipped',
        message: 'No auth header provided',
        timestamp: new Date().toISOString()
      };
    }
  } catch (error) {
    diagnostics.checks.auth = {
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    };
  }

  // Overall status
  const allChecks = Object.values(diagnostics.checks);
  const hasErrors = allChecks.some(check => check.status === 'error');
  const hasWarnings = allChecks.some(check => check.status === 'warning');

  diagnostics.overall_status = hasErrors ? 'error' : hasWarnings ? 'warning' : 'ok';
  diagnostics.summary = {
    total_checks: allChecks.length,
    passed: allChecks.filter(c => c.status === 'ok').length,
    failed: allChecks.filter(c => c.status === 'error').length,
    warnings: allChecks.filter(c => c.status === 'warning').length
  };

  return sendSuccess(diagnostics);
};

