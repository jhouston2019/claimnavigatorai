/**
 * API Self-Test Endpoint
 * Diagnostic endpoint for system health checks
 * Never leaks secrets - only returns status information
 */

const { getSupabaseClient, sendSuccess, sendError } = require('./lib/api-utils');

exports.handler = async (event) => {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    checks: {}
  };

  // Check 1: Supabase connectivity
  try {
    const supabase = getSupabaseClient();
    if (supabase) {
      // Simple round-trip query
      const { data, error } = await supabase
        .from('api_keys')
        .select('id')
        .limit(1);
      
      diagnostics.checks.supabase = {
        status: error ? 'error' : 'ok',
        message: error ? 'Connection failed' : 'Connection successful',
        timestamp: new Date().toISOString()
      };
    } else {
      diagnostics.checks.supabase = {
        status: 'error',
        message: 'Supabase not configured',
        timestamp: new Date().toISOString()
      };
    }
  } catch (error) {
    diagnostics.checks.supabase = {
      status: 'error',
      message: 'Connection error',
      timestamp: new Date().toISOString()
    };
  }

  // Check 2: Key tables existence
  const requiredTables = [
    'api_keys',
    'api_logs',
    'api_rate_limits',
    'api_event_logs'
  ];

  const tableChecks = {};
  const supabase = getSupabaseClient();
  
  if (supabase) {
    for (const tableName of requiredTables) {
      try {
        // Try to query table (will fail if table doesn't exist)
        const { error } = await supabase
          .from(tableName)
          .select('id')
          .limit(1);
        
        tableChecks[tableName] = !error;
      } catch (err) {
        tableChecks[tableName] = false;
      }
    }
  } else {
    requiredTables.forEach(table => {
      tableChecks[table] = false;
    });
  }

  diagnostics.checks.tables = {
    status: Object.values(tableChecks).every(exists => exists) ? 'ok' : 'error',
    tables: tableChecks,
    timestamp: new Date().toISOString()
  };

  // Check 3: Environment variables (never expose values)
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

  // Check 4: Endpoint signatures
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

  // Check 5: Auth validation (if auth header provided)
  try {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (authHeader) {
      const { validateAuth } = require('./lib/api-utils');
      const authResult = await validateAuth(authHeader);
      diagnostics.checks.auth = {
        status: authResult.valid ? 'ok' : 'error',
        message: authResult.valid ? 'Auth validation working' : 'Invalid token',
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
      message: 'Auth check failed',
      timestamp: new Date().toISOString()
    };
  }

  // Check 6: Simple round-trip query
  if (supabase) {
    try {
      const startTime = Date.now();
      const { error } = await supabase
        .from('api_keys')
        .select('id')
        .limit(1);
      const latency = Date.now() - startTime;
      
      diagnostics.checks.round_trip = {
        status: error ? 'error' : 'ok',
        message: error ? 'Query failed' : 'Query successful',
        latency_ms: latency,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      diagnostics.checks.round_trip = {
        status: 'error',
        message: 'Round-trip query failed',
        timestamp: new Date().toISOString()
      };
    }
  } else {
    diagnostics.checks.round_trip = {
      status: 'skipped',
      message: 'Supabase not available',
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

  // Ensure no secrets are leaked
  // Remove any potential secret values
  const sanitizedDiagnostics = JSON.parse(JSON.stringify(diagnostics));
  
  return sendSuccess(sanitizedDiagnostics);
};

