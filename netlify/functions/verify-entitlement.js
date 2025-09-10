const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  try {
    const { session_id, order_id, email } = JSON.parse(event.body);

    if (!session_id && !email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing session_id or email' })
      };
    }

    let userEmail = email;

    // 1. Lookup email by session_id if not provided
    if (!userEmail && session_id) {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('email')
        .eq('session_id', session_id)
        .single();

      if (orderError || !orderData) {
        console.error('Order lookup error:', orderError);
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Order not found' })
        };
      }

      userEmail = orderData.email;
    }

    // 2. Get entitlement info
    const { data: entitlementData, error: entitlementError } = await supabase
      .from('entitlements')
      .select('credits')
      .eq('email', userEmail)
      .single();

    if (entitlementError || !entitlementData) {
      console.error('Entitlement lookup error:', entitlementError);
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'No entitlements found for user' })
      };
    }

    // 3. Get most recent order
    const { data: latestOrder, error: latestOrderError } = await supabase
      .from('orders')
      .select('id, session_id, product, amount, currency, created_at')
      .eq('email', userEmail)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (latestOrderError) {
      console.error('Order fetch error:', latestOrderError);
    }

    // 4. Return combined info
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        email: userEmail,
        credits_remaining: entitlementData.credits,
        order_id: latestOrder?.id || order_id || null,
        purchase_date: latestOrder?.created_at || null,
        product: latestOrder?.product || 'AI Claim Toolkit',
        amount: latestOrder?.amount || 499,
        currency: latestOrder?.currency || 'USD'
      })
    };
  } catch (err) {
    console.error('verify-entitlement error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
