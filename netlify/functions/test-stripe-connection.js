const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    // Test 1: Check if Stripe key is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'STRIPE_SECRET_KEY not configured',
          code: 'CONFIG_ERROR'
        })
      };
    }

    // Test 2: Check key format
    const keyFormat = process.env.STRIPE_SECRET_KEY.startsWith('sk_test_') ? 'test' : 
                     process.env.STRIPE_SECRET_KEY.startsWith('sk_live_') ? 'live' : 'unknown';

    // Test 3: Try to retrieve account info
    let accountInfo = null;
    let accountError = null;
    
    try {
      accountInfo = await stripe.accounts.retrieve();
    } catch (error) {
      accountError = {
        message: error.message,
        type: error.type,
        code: error.code
      };
    }

    // Test 4: Try to create a simple product
    let productTest = null;
    let productError = null;
    
    try {
      productTest = await stripe.products.create({
        name: 'Test Product',
        type: 'service'
      });
    } catch (error) {
      productError = {
        message: error.message,
        type: error.type,
        code: error.code
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true,
        keyFormat: keyFormat,
        keyLength: process.env.STRIPE_SECRET_KEY.length,
        accountInfo: accountInfo ? {
          id: accountInfo.id,
          chargesEnabled: accountInfo.charges_enabled,
          payoutsEnabled: accountInfo.payouts_enabled,
          detailsSubmitted: accountInfo.details_submitted
        } : null,
        accountError: accountError,
        productTest: productTest ? { id: productTest.id } : null,
        productError: productError
      })
    };

  } catch (error) {
    console.error('Stripe test error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message,
        code: error.type || 'STRIPE_ERROR',
        details: error.message
      })
    };
  }
};
