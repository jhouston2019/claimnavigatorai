const Stripe = require('stripe');

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Get user subscription status
 * @param {Object} params - Parameters
 * @param {string} params.userId - User ID
 * @param {string} params.email - User email
 * @returns {Promise<'active'|'none'>} Subscription status
 */
async function getUserSubscriptionStatus({ userId, email }) {
  try {
    // First, try to find customer by user ID in metadata
    let customer = null;
    
    // Search for customer by user ID in metadata
    const customersByUserId = await stripe.customers.list({
      limit: 1,
      expand: ['data.subscriptions']
    });
    
    customer = customersByUserId.data.find(c => 
      c.metadata && c.metadata.user_id === userId
    );

    // If not found by user ID, search by email
    if (!customer) {
      const customersByEmail = await stripe.customers.list({
        email: email,
        limit: 1,
        expand: ['data.subscriptions']
      });
      
      customer = customersByEmail.data[0];
    }

    if (!customer) {
      console.log(`No Stripe customer found for user ${userId} or email ${email}`);
      return 'none';
    }

    // Check if customer has any active subscriptions
    const subscriptions = customer.subscriptions?.data || [];
    
    for (const subscription of subscriptions) {
      if (subscription.status === 'active' || subscription.status === 'trialing') {
        console.log(`Active subscription found for customer ${customer.id}: ${subscription.status}`);
        return 'active';
      }
    }

    console.log(`No active subscriptions found for customer ${customer.id}`);
    return 'none';
  } catch (error) {
    console.error('Error checking subscription status:', error);
    // Return 'none' on error to be conservative
    return 'none';
  }
}

/**
 * Check if user has reached monthly document limit
 * @param {Object} params - Parameters
 * @param {string} params.userId - User ID
 * @param {string} params.email - User email
 * @param {Object} params.supabase - Supabase client
 * @returns {Promise<{canGenerate: boolean, count: number, limit: number}>}
 */
async function checkDocumentLimit({ userId, email, supabase }) {
  try {
    // Get current month start date (UTC)
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Count documents generated this month
    const { count, error } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', monthStart.toISOString());

    if (error) {
      console.error('Error counting documents:', error);
      throw new Error('Failed to check document limit');
    }

    const documentCount = count || 0;
    
    // Check subscription status
    const subscriptionStatus = await getUserSubscriptionStatus({ userId, email });
    
    // Free users: 2 documents per month
    // Subscribers: unlimited
    const limit = subscriptionStatus === 'active' ? Infinity : 2;
    const canGenerate = documentCount < limit;

    return {
      canGenerate,
      count: documentCount,
      limit: limit === Infinity ? 'unlimited' : limit,
      subscriptionStatus
    };
  } catch (error) {
    console.error('Error checking document limit:', error);
    throw error;
  }
}

/**
 * Get user's Stripe customer ID
 * @param {Object} params - Parameters
 * @param {string} params.userId - User ID
 * @param {string} params.email - User email
 * @returns {Promise<string|null>} Customer ID or null
 */
async function getCustomerId({ userId, email }) {
  try {
    // Search for customer by user ID in metadata
    const customersByUserId = await stripe.customers.list({
      limit: 1
    });
    
    let customer = customersByUserId.data.find(c => 
      c.metadata && c.metadata.user_id === userId
    );

    // If not found by user ID, search by email
    if (!customer) {
      const customersByEmail = await stripe.customers.list({
        email: email,
        limit: 1
      });
      
      customer = customersByEmail.data[0];
    }

    return customer ? customer.id : null;
  } catch (error) {
    console.error('Error getting customer ID:', error);
    return null;
  }
}

/**
 * Create or get Stripe customer
 * @param {Object} params - Parameters
 * @param {string} params.userId - User ID
 * @param {string} params.email - User email
 * @param {string} params.name - User name
 * @returns {Promise<string>} Customer ID
 */
async function createOrGetCustomer({ userId, email, name }) {
  try {
    // First try to find existing customer
    const existingCustomerId = await getCustomerId({ userId, email });
    if (existingCustomerId) {
      return existingCustomerId;
    }

    // Create new customer
    const customer = await stripe.customers.create({
      email: email,
      name: name,
      metadata: {
        user_id: userId
      }
    });

    return customer.id;
  } catch (error) {
    console.error('Error creating customer:', error);
    throw error;
  }
}

module.exports = {
  getUserSubscriptionStatus,
  checkDocumentLimit,
  getCustomerId,
  createOrGetCustomer
};
