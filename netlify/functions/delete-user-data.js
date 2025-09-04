const { getStore } = require("@netlify/blobs");

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const user = context.clientContext && context.clientContext.user;
  if (!user) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  let confirm = false;
  try {
    const body = JSON.parse(event.body || '{}');
    confirm = Boolean(body && body.confirm === true);
  } catch (_) {}

  if (!confirm) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Confirmation required' }) };
  }

  const email = user.email;

  try {
    // Delete generated responses and documents for this user
    await deleteByPrefix('responses', `${email}/`);
    await deleteByPrefix('documents', `${email}/`);

    // Remove user record and related purchases
    const userStore = getStore('users');
    const purchaseStore = getStore('purchases');
    const userData = await userStore.getJSON(email);

    if (userData) {
      const purchases = Array.isArray(userData.purchases) ? userData.purchases : [];
      for (const sessionId of purchases) {
        await purchaseStore.delete(sessionId);
      }
      await userStore.delete(email);
    }

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (error) {
    console.error('delete-user-data error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to delete user data', message: error.message }) };
  }
};

async function deleteByPrefix(storeName, prefix) {
  const store = getStore(storeName);
  let cursor = undefined;
  do {
    const result = await store.list({ prefix, cursor, limit: 1000 });
    for (const blob of result.blobs || []) {
      await store.delete(blob.key);
    }
    cursor = result.cursor;
  } while (cursor);
}

