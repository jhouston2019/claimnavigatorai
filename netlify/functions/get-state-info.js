const fs = require('fs');
const path = require('path');

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const state = event.queryStringParameters?.state;

    if (!state) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'state query parameter is required' })
      };
    }

    // Read states.json file
    const statesPath = path.join(__dirname, '../../data/states.json');
    const statesData = fs.readFileSync(statesPath, 'utf8');
    const states = JSON.parse(statesData);

    // Find matching state (case-insensitive, by name or abbreviation)
    const stateData = states.find(s => 
      s.state.toLowerCase() === state.toLowerCase() || 
      s.abbr.toLowerCase() === state.toLowerCase()
    );

    if (!stateData) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'State not found' })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'success',
        data: stateData
      })
    };

  } catch (error) {
    console.error('Error getting state info:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        status: 'error',
        error: error.message
      })
    };
  }
};


