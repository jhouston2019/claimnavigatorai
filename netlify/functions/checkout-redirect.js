exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    // Instead of creating a session, redirect to a simple Stripe payment link
    // This bypasses all the complex session creation that's causing issues
    
    const stripePaymentLink = 'https://buy.stripe.com/test_00g3eU8wB0JZ8wB000'; // Replace with your actual Stripe payment link
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        url: stripePaymentLink,
        method: 'redirect'
      })
    };

  } catch (error) {
    console.error('Checkout redirect error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Checkout redirect failed',
        code: 'REDIRECT_ERROR',
        details: error.message
      })
    };
  }
};
