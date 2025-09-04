const { getStore } = require('@netlify/blobs');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST' && event.httpMethod !== 'DELETE') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  // Require Netlify Identity auth
  const user = context.clientContext && context.clientContext.user;
  if (!user) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  try {
    const userEmail = user.email || user['email'] || user['preferred_username'] || user.sub || 'unknown';

    // Delete user-specific data from stores
    const entitlementsStore = getStore('entitlements');
    const responsesStore = getStore('responses');

    // Best-effort deletes; ignore if not present
    try { await entitlementsStore.delete(userEmail); } catch (_) {}
    try { await responsesStore.delete(userEmail); } catch (_) {}

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};

