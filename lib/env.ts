export const env = (() => {
  const required = [
    'OPENAI_API_KEY',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'STRIPE_SECRET_KEY',
    'SITE_URL'
  ] as const;
  
  const missing = required.filter(k => !process.env[k]);
  if (missing.length) {
    throw new Error(`Missing env: ${missing.join(', ')}`);
  }
  
  return {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
    SUPABASE_URL: process.env.SUPABASE_URL!,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY!,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY!,
    SITE_URL: process.env.SITE_URL || process.env.URL || 'http://localhost:8888',
    // Optional environment variables
    STRIPE_PUBLIC_KEY: process.env.STRIPE_PUBLIC_KEY || process.env.STRIPE_PUBLISHABLE_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    JWT_SECRET: process.env.JWT_SECRET,
    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
    FROM_EMAIL: process.env.FROM_EMAIL,
    SUPPORT_EMAIL: process.env.SUPPORT_EMAIL,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    GA4_ID: process.env.GA4_ID,
    SENTRY_DSN: process.env.SENTRY_DSN,
    AFFILIATE_ID: process.env.AFFILIATE_ID,
    ADSENSE_ID: process.env.ADSENSE_ID,
    AD_PROVIDER_KEY: process.env.AD_PROVIDER_KEY,
    EMAIL_REPLY_TO: process.env.EMAIL_REPLY_TO,
    CACHE_TTL: process.env.CACHE_TTL ? parseInt(process.env.CACHE_TTL) : 3600,
    // Stripe pricing IDs
    STRIPE_PRICE_CLAIM_NAVIGATOR_DIY_TOOLKIT: process.env.STRIPE_PRICE_CLAIM_NAVIGATOR_DIY_TOOLKIT,
    STRIPE_PRICE_CLAIM_NAVIGATOR_APPEAL_BUILDER: process.env.STRIPE_PRICE_CLAIM_NAVIGATOR_APPEAL_BUILDER,
    STRIPE_CHECKOUT_SUCCESS_URL: process.env.STRIPE_CHECKOUT_SUCCESS_URL,
    STRIPE_CHECKOUT_CANCEL_URL: process.env.STRIPE_CHECKOUT_CANCEL_URL,
    // Appeal Builder specific
    APPEAL_PRICE: process.env.APPEAL_PRICE ? parseInt(process.env.APPEAL_PRICE) : 24900,
    APPEAL_CURRENCY: process.env.APPEAL_CURRENCY || 'usd',
    APPEAL_PRODUCT_NAME: process.env.APPEAL_PRODUCT_NAME || 'Appeal Builder - Premium Access'
  };
})();
