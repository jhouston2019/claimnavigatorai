/**
 * Test Deployment Endpoint
 * Simple endpoint to verify Netlify functions are deployed correctly
 */

exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      success: true,
      message: 'Netlify functions deployment test successful',
      timestamp: new Date().toISOString(),
      function_path: event.path,
      function_name: context.functionName || 'test-deploy'
    })
  };
};

