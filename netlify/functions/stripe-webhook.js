const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { getStore } = require("@netlify/blobs");

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const sig = event.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!endpointSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    if (process.env.NODE_ENV === 'production') {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Webhook not configured' })
      };
    }
  }

  let stripeEvent;

  try {
    if (endpointSecret) {
      stripeEvent = stripe.webhooks.constructEvent(
        event.body,
        sig,
        endpointSecret
      );
    } else {
      stripeEvent = JSON.parse(event.body);
    }
  } catch (err) {
    console.error(`Webhook signature verification failed:`, err.message);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: `Webhook Error: ${err.message}` })
    };
  }

  try {
    switch (stripeEvent.type) {
      case 'checkout.session.completed':
        await handleSuccessfulPayment(stripeEvent.data.object);
        break;
        
      case 'payment_intent.succeeded':
        console.log('Payment succeeded:', stripeEvent.data.object.id);
        break;
        
      case 'payment_intent.payment_failed':
        console.log('Payment failed:', stripeEvent.data.object.id);
        await handleFailedPayment(stripeEvent.data.object);
        break;
        
      default:
        console.log(`Unhandled event type: ${stripeEvent.type}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true })
    };
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Webhook processing failed' })
    };
  }
};

async function handleSuccessfulPayment(session) {
  console.log('Processing successful payment for session:', session.id);
  
  const customerEmail = session.customer_email || session.customer_details?.email;
  const customerName = session.customer_details?.name;
  const customerPhone = session.customer_details?.phone;
  const amountPaid = session.amount_total;
  
  const aiResponses = parseInt(session.metadata?.ai_responses || '20');
  const product = session.metadata?.product || 'claim_toolkit';
  
  try {
    const store = getStore("purchases");
    
    const purchaseRecord = {
      sessionId: session.id,
      customerId: session.customer,
      customerEmail: customerEmail,
      customerName: customerName,
      customerPhone: customerPhone,
      product: product,
      aiCredits: aiResponses,
      amountPaid: amountPaid,
      currency: session.currency,
      paymentStatus: session.payment_status,
      purchasedAt: new Date().toISOString(),
      metadata: session.metadata,
      creditsUsed: 0,
      lastUsed: null
    };
    
    await store.setJSON(session.id, purchaseRecord);
    
    if (customerEmail) {
      const userStore = getStore("users");
      
      let userData = await userStore.getJSON(customerEmail) || {
        email: customerEmail,
        name: customerName,
        purchases: [],
        totalCredits: 0
      };
      
      userData.purchases.push(session.id);
      userData.totalCredits += aiResponses;
      userData.lastPurchase = new Date().toISOString();
      
      await userStore.setJSON(customerEmail, userData);
      
      // SEND CONFIRMATION EMAIL
      await sendPurchaseConfirmation(customerEmail, session.id, amountPaid);
      
      // SEND ADMIN NOTIFICATION
      await sendAdminNotification(customerEmail, customerName, amountPaid, session.id);
    }
    
    console.log(`Purchase recorded: ${session.id} for ${customerEmail}`);
    
  } catch (error) {
    console.error('Failed to store purchase record:', error);
    throw error;
  }
}

async function handleFailedPayment(paymentIntent) {
  // Log failed payment for follow-up
  console.error('Payment failed:', {
    id: paymentIntent.id,
    amount: paymentIntent.amount,
    error: paymentIntent.last_payment_error,
    timestamp: new Date().toISOString()
  });
}

async function sendPurchaseConfirmation(email, sessionId, amount) {
  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1e40af; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { padding: 30px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px; }
    .button { background: #1e40af; color: white !important; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; font-weight: 600; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
    .info-box { background: #f9fafb; padding: 15px; border-radius: 6px; margin: 15px 0; }
    h3 { color: #1e3a8a; }
    ul { padding-left: 20px; }
    li { margin: 8px 0; }
  </style>
</head>
<body style="background: #f3f4f6;">
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 28px;">Welcome to ClaimNavigatorAI!</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.95;">Your AI-Powered Claim Toolkit is Ready</p>
    </div>
    <div class="content">
      <h2 style="color: #111827;">Thank you for your purchase!</h2>
      <p>Your payment of <strong>$${(amount/100).toFixed(2)}</strong> has been successfully processed.</p>
      
      <div class="info-box">
        <strong>Order ID:</strong> ${sessionId}<br>
        <strong>Date:</strong> ${new Date().toLocaleDateString()}<br>
        <strong>Amount:</strong> $${(amount/100).toFixed(2)} USD
      </div>
      
      <h3>✨ What's Included:</h3>
      <ul>
        <li><strong>Complete AI Documentation Toolkit</strong> - All forms and templates</li>
        <li><strong>20 AI Response Credits</strong> - Generate professional responses instantly</li>
        <li><strong>Bilingual Support</strong> - Full English and Spanish capabilities</li>
        <li><strong>PDF & Word Downloads</strong> - Professional formats ready to send</li>
        <li><strong>30-Day Action Plan</strong> - Step-by-step claim guidance</li>
      </ul>
      
      <h3>🚀 Get Started Now:</h3>
      <p>Click the button below to access your AI Response Center:</p>
      
      <div style="text-align: center;">
        <a href="https://claimnavigatorai.netlify.app/success.html?session_id=${sessionId}" class="button">
          Access Your Account →
        </a>
      </div>
      
      <h3>📝 Next Steps:</h3>
      <ol>
        <li><strong>Create your account</strong> using this email address (${email})</li>
        <li><strong>Upload</strong> your insurer's letter or correspondence</li>
        <li><strong>Generate</strong> a professional AI response in seconds</li>
        <li><strong>Download</strong> as PDF or Word document</li>
        <li><strong>Send</strong> to your insurance company</li>
      </ol>
      
      <div class="info-box" style="background: #fef3c7; border: 1px solid #f59e0b;">
        <strong>💡 Pro Tip:</strong> Save all generated responses for your records. Each response uses one credit from your 20 included credits.
      </div>
      
      <h3>Need Help?</h3>
      <p>Our support team is here to help you succeed with your claim:</p>
      <ul>
        <li>Email: <a href="mailto:support@claimnavigatorai.com">support@claimnavigatorai.com</a></li>
        <li>Response time: Within 24 hours</li>
      </ul>
      
      <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
        <strong>Important:</strong> This toolkit provides documentation assistance only. We are not a law firm or insurance adjuster. 
        Always review generated content before sending to insurers.
      </p>
    </div>
    <div class="footer">
      <p>© 2025 ClaimNavigatorAI - AI-Powered Claim Documentation Tools</p>
      <p>This email serves as your receipt. Please keep it for your records.</p>
      <p style="margin-top: 10px;">
        <a href="https://claimnavigatorai.netlify.app/terms.html" style="color: #6b7280;">Terms</a> | 
        <a href="https://claimnavigatorai.netlify.app/privacy.html" style="color: #6b7280;">Privacy</a> | 
        <a href="https://claimnavigatorai.netlify.app/disclaimer.html" style="color: #6b7280;">Disclaimer</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;

  try {
    const response = await fetch(`${process.env.URL || 'https://claimnavigatorai.netlify.app'}/.netlify/functions/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: email,
        subject: 'Welcome to ClaimNavigatorAI - Purchase Confirmation',
        html: emailHtml,
        type: 'purchase_confirmation'
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to send email');
    }
    
    console.log(`Confirmation email sent to ${email}`);
  } catch (error) {
    console.error('Failed to send confirmation email:', error);
    // Don't fail the webhook if email fails
  }
}

async function sendAdminNotification(customerEmail, customerName, amount, sessionId) {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@claimnavigatorai.com';
  
  const emailText = `
New Purchase Alert!

Customer: ${customerName || 'Not provided'}
Email: ${customerEmail}
Amount: $${(amount/100).toFixed(2)}
Session ID: ${sessionId}
Time: ${new Date().toISOString()}

View in Stripe Dashboard:
https://dashboard.stripe.com/payments/${sessionId}
  `;

  try {
    await fetch(`${process.env.URL || 'https://claimnavigatorai.netlify.app'}/.netlify/functions/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: adminEmail,
        subject: `💰 New Sale: $${(amount/100).toFixed(2)} from ${customerEmail}`,
        text: emailText,
        type: 'admin_notification'
      })
    });
  } catch (error) {
    console.error('Failed to send admin notification:', error);
  }
}