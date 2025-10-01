exports.handler = async (event, context) => {
  try {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        message: 'Netlify functions are working!',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production',
        context: process.env.CONTEXT || 'unknown',
        region: context.awsRegion || 'unknown'
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};
