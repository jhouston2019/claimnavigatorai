const { getStore, list } = require("@netlify/blobs");

exports.handler = async (event, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  const user = context.clientContext && context.clientContext.user;
  if (!user) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: "Unauthorized" }) };
  }

  try {
    const { confirmation } = JSON.parse(event.body || "{}");
    if (confirmation !== "DELETE MY DATA") {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid confirmation phrase" }) };
    }

    const email = user.email;

    // Stores we may touch
    const userStore = getStore("users");
    const purchaseStore = getStore("purchases");
    const responsesStore = getStore("responses");
    const entitlementsStore = getStore("entitlements");

    // Load user profile to find purchases
    const userProfile = await userStore.getJSON(email);

    // Delete responses for this user (prefix by email/ or contain email)
    // Attempt two strategies: prefix listing and metadata match
    await deleteAllKeysWithPrefix("responses", `${email}/`);
    await deleteAllKeysContaining("responses", email);

    // Delete entitlements for this user
    await deleteAllKeysWithPrefix("entitlements", `${email}/`);
    await deleteAllKeysContaining("entitlements", email);

    // Zero out credits from purchases and optionally remove purchase records
    if (userProfile && Array.isArray(userProfile.purchases)) {
      for (const sessionId of userProfile.purchases) {
        const purchase = await purchaseStore.getJSON(sessionId);
        if (purchase) {
          purchase.aiCredits = 0;
          purchase.creditsUsed = 0;
          purchase.deletedAt = new Date().toISOString();
          await purchaseStore.setJSON(sessionId, purchase);
        }
      }
    }

    // Finally delete user profile
    await userStore.delete(email);

    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Failed to delete user data", message: err.message }) };
  }
};

async function deleteAllKeysWithPrefix(storeName, prefix) {
  try {
    const keys = await list({ prefix, store: storeName });
    if (Array.isArray(keys.blobs)) {
      for (const item of keys.blobs) {
        await getStore(storeName).delete(item.key);
      }
    }
  } catch (_) {}
}

async function deleteAllKeysContaining(storeName, needle) {
  try {
    const keys = await list({ store: storeName });
    if (Array.isArray(keys.blobs)) {
      for (const item of keys.blobs) {
        if (item.key.includes(needle)) {
          await getStore(storeName).delete(item.key);
        }
      }
    }
  } catch (_) {}
}

