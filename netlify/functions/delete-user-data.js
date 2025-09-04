const { getStore } = require('@netlify/blobs');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const user = context.clientContext && context.clientContext.user;
  if (!user) {
    return { statusCode: 401, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  try {
    const { confirm } = JSON.parse(event.body || '{}');
    if (confirm !== true) {
      return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Confirmation required' }) };
    }

    const email = user.email;

    const userStore = getStore('users');
    const purchaseStore = getStore('purchases');
    const responsesStore = getStore('responses');
    const entitlementsStore = getStore('entitlements');

    const userData = await userStore.getJSON(email);

    // Delete response blobs linked to this user
    if (responsesStore && responsesStore.list) {
      const list = await responsesStore.list({ prefix: `${email}/` }).catch(() => null);
      if (list && list.blobs) {
        for (const b of list.blobs) {
          await responsesStore.delete(b.key).catch(() => {});
        }
      }
    }

    // Delete entitlements for user
    if (entitlementsStore && entitlementsStore.list) {
      const list = await entitlementsStore.list({ prefix: `${email}/` }).catch(() => null);
      if (list && list.blobs) {
        for (const b of list.blobs) {
          await entitlementsStore.delete(b.key).catch(() => {});
        }
      }
    }

    // If we have purchase IDs, clear their records
    if (userData && Array.isArray(userData.purchases)) {
      for (const sessionId of userData.purchases) {
        await purchaseStore.delete(sessionId).catch(() => {});
      }
    }

    // Delete user record
    await userStore.delete(email).catch(() => {});

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'User data deleted' })
    };
  } catch (error) {
    console.error('delete-user-data error:', error);
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Failed to delete user data', message: error.message }) };
  }
};

