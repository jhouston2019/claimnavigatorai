const { getStore } = require('@netlify/blobs');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const user = context.clientContext?.user;
  if (!user) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized - Please login' }) };
  }

  const email = user.email;

  try {
    // Delete from entitlements (if exists)
    const entitlements = getStore('entitlements');
    await safeDeleteByEmail(entitlements, email);

    // Delete from responses store
    const responses = getStore('responses');
    await safeDeleteByEmail(responses, email);

    // Also remove from users store
    const users = getStore('users');
    await users.delete(email).catch(() => {});

    // Remove purchases associated with this user
    const purchases = getStore('purchases');
    try {
      for await (const entry of purchases.list()) {
        try {
          const data = await purchases.getJSON(entry.key);
          if (data && (data.customerEmail === email)) {
            await purchases.delete(entry.key);
          }
        } catch (_) {}
      }
    } catch (_) {}

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, message: 'All user data deleted for ' + email })
    };

  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to delete user data', message: error.message }) };
  }
};

async function safeDeleteByEmail(store, email) {
  if (!store || !store.list) return;
  try {
    for await (const entry of store.list()) {
      if (entry && entry.key) {
        // Try key match first
        if (entry.key === email || entry.key.startsWith(email)) {
          await store.delete(entry.key).catch(() => {});
          continue;
        }
        // Try value JSON match
        try {
          const data = await store.getJSON(entry.key);
          if (data && (data.email === email || data.userEmail === email)) {
            await store.delete(entry.key).catch(() => {});
          }
        } catch (_) {}
      }
    }
  } catch (_) {}
}

