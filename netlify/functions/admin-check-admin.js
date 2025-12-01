/**
 * Admin Check Endpoint
 * Simple endpoint to verify admin access
 */

exports.handler = async () => ({
  statusCode: 200,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  },
  body: JSON.stringify({
    success: true,
    data: { admin: true },
    error: null
  })
});


