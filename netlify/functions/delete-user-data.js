const { getStore } = require('@netlify/blobs');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST' && event.httpMethod !== 'DELETE') {
    return { statusCode: 405, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  const user = context.clientContext && context.clientContext.user;
  if (!user) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  try {
    const email = user.email;

    // Stores expected by requirements
    const entitlements = getStore('entitlements');
    const responses = getStore('responses');

    // Best-effort deletions
    try { await entitlements.delete(email); } catch (_) {}
    try { await responses.delete(email); } catch (_) {}

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, message: 'User data deleted from entitlements and responses.' })
    };
  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to delete user data', message: error.message }) };
  }
};

