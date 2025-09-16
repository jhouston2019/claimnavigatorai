const { getStore } = require("@netlify/blobs");

exports.handler = async (event, context) => {
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  // Check authentication
  const user = context.clientContext?.user;
  if (!user) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ 
        error: 'Unauthorized - Please login',
        credits: 0 
      })
    };
  }

  try {
    const userEmail = user.email;
    
    // Get user data from store
    const userStore = getStore("users");
    const userData = await userStore.getJSON(userEmail);
    
    if (!userData) {
      // No purchase history found
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          email: userEmail,
          credits: 0,
          totalCredits: 0,
          creditsUsed: 0,
          purchases: [],
          message: 'No purchases found. Please complete your purchase first.'
        })
      };
    }
    
    // Calculate available credits
    // Get all purchases for this user
    const purchaseStore = getStore("purchases");
    let totalCredits = 0;
    let creditsUsed = 0;
    const purchaseDetails = [];
    
    for (const sessionId of userData.purchases || []) {
      const purchase = await purchaseStore.getJSON(sessionId);
      if (purchase) {
        totalCredits += purchase.aiCredits || 0;
        creditsUsed += purchase.creditsUsed || 0;
        purchaseDetails.push({
          sessionId: purchase.sessionId,
          date: purchase.purchasedAt,
          credits: purchase.aiCredits,
          used: purchase.creditsUsed || 0
        });
      }
    }
    
    const availableCredits = totalCredits - creditsUsed;
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        email: userEmail,
        credits: availableCredits,
        totalCredits: totalCredits,
        creditsUsed: creditsUsed,
        purchases: purchaseDetails,
        lastPurchase: userData.lastPurchase
      })
    };
    
  } catch (error) {
    console.error('Error fetching user credits:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to fetch user credits',
        message: error.message
      })
    };
  }
};