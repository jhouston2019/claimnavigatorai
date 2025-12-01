/**
 * Test Monitoring Function
 * Verifies monitoring redirect + function mapping is working
 */

exports.handler = async () => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      success: true,
      message: "Monitoring redirect + function mapping is working.",
      timestamp: new Date().toISOString()
    })
  };
};


