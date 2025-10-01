import Stripe from 'stripe';
import { env } from '../env';

const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

export async function hasActiveSubscription(email?: string, customerId?: string): Promise<boolean> {
  try {
    let cid = customerId;
    
    // If no customer ID provided, try to find by email
    if (!cid && email) {
      const customers = await stripe.customers.list({ email, limit: 1 });
      cid = customers.data[0]?.id;
    }
    
    if (!cid) return false;
    
    // Check for active subscriptions
    const subscriptions = await stripe.subscriptions.list({ 
      customer: cid, 
      status: 'all', 
      limit: 10 
    });
    
    return subscriptions.data.some(sub => 
      ['active', 'trialing', 'past_due'].includes(sub.status)
    );
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return false;
  }
}

export async function getCustomerByEmail(email: string): Promise<Stripe.Customer | null> {
  try {
    const customers = await stripe.customers.list({ email, limit: 1 });
    return customers.data[0] || null;
  } catch (error) {
    console.error('Error fetching customer by email:', error);
    return null;
  }
}

export async function getCustomerSubscriptions(customerId: string): Promise<Stripe.Subscription[]> {
  try {
    const subscriptions = await stripe.subscriptions.list({ 
      customer: customerId, 
      status: 'all',
      limit: 10 
    });
    return subscriptions.data;
  } catch (error) {
    console.error('Error fetching customer subscriptions:', error);
    return [];
  }
}

export async function createCheckoutSession(
  customerEmail: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string,
  metadata?: Record<string, string>
): Promise<Stripe.Checkout.Session> {
  try {
    const session = await stripe.checkout.sessions.create({
      customer_email: customerEmail,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: metadata || {},
      allow_promotion_codes: true,
    });
    
    return session;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

export async function getSubscriptionDetails(subscriptionId: string): Promise<Stripe.Subscription | null> {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return subscription;
  } catch (error) {
    console.error('Error fetching subscription details:', error);
    return null;
  }
}
