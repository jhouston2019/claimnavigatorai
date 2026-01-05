#!/usr/bin/env node

/**
 * Environment variable validation script
 * Ensures all required environment variables are set and valid
 */

const required = [
  'OPENAI_API_KEY',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_SECRET_KEY',
  'SITE_URL'
];

const optional = [
  'STRIPE_PUBLIC_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'JWT_SECRET',
  'SENDGRID_API_KEY',
  'FROM_EMAIL',
  'SUPPORT_EMAIL',
  'ADMIN_EMAIL',
  'GA4_ID',
  'SENTRY_DSN',
  'AFFILIATE_ID',
  'ADSENSE_ID',
  'AD_PROVIDER_KEY',
  'EMAIL_REPLY_TO',
  'CACHE_TTL'
];

function validateEnvironment() {
  console.log('🔍 Validating environment variables...\n');
  
  const missing = [];
  const invalid = [];
  
  // Check required variables
  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }
  
  // Validate specific formats
  if (process.env.SUPABASE_URL && !process.env.SUPABASE_URL.startsWith('https://')) {
    invalid.push('SUPABASE_URL should start with https://');
  }
  
  if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
    invalid.push('STRIPE_SECRET_KEY should start with sk_');
  }
  
  if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.startsWith('sk-')) {
    invalid.push('OPENAI_API_KEY should start with sk-');
  }
  
  if (process.env.SITE_URL && !process.env.SITE_URL.startsWith('http')) {
    invalid.push('SITE_URL should start with http:// or https://');
  }
  
  // Report results
  if (missing.length > 0) {
    console.log('❌ Missing required environment variables:');
    missing.forEach(key => console.log(`   • ${key}`));
    console.log('');
  }
  
  if (invalid.length > 0) {
    console.log('❌ Invalid environment variable formats:');
    invalid.forEach(msg => console.log(`   • ${msg}`));
    console.log('');
  }
  
  if (missing.length === 0 && invalid.length === 0) {
    console.log('✅ All required environment variables are set and valid');
    
    // Check optional variables
    const missingOptional = optional.filter(key => !process.env[key]);
    if (missingOptional.length > 0) {
      console.log('\n⚠️  Optional environment variables not set:');
      missingOptional.forEach(key => console.log(`   • ${key}`));
    }
    
    return true;
  }
  
  return false;
}

function printEnvironmentSetup() {
  console.log('\n📋 Environment Setup Guide:');
  console.log('');
  console.log('Required Variables:');
  required.forEach(key => {
    console.log(`   • ${key} - ${getVariableDescription(key)}`);
  });
  
  console.log('\nOptional Variables:');
  optional.forEach(key => {
    console.log(`   • ${key} - ${getVariableDescription(key)}`);
  });
  
  console.log('\n🔧 Setup Instructions:');
  console.log('1. Copy env.example to .env');
  console.log('2. Fill in your actual values');
  console.log('3. For production, set these in Netlify Dashboard → Site Settings → Environment Variables');
  console.log('');
}

function getVariableDescription(key) {
  const descriptions = {
    'OPENAI_API_KEY': 'OpenAI API key for AI features',
    'SUPABASE_URL': 'Supabase project URL',
    'SUPABASE_ANON_KEY': 'Supabase anonymous key',
    'SUPABASE_SERVICE_ROLE_KEY': 'Supabase service role key (admin)',
    'STRIPE_SECRET_KEY': 'Stripe secret key for payments',
    'SITE_URL': 'Your site URL (e.g., https://Claim Navigator.com)',
    'STRIPE_PUBLIC_KEY': 'Stripe publishable key for frontend',
    'STRIPE_WEBHOOK_SECRET': 'Stripe webhook secret for payment events',
    'JWT_SECRET': 'Secret for JWT token signing',
    'SENDGRID_API_KEY': 'SendGrid API key for email',
    'FROM_EMAIL': 'Default from email address',
    'SUPPORT_EMAIL': 'Support contact email',
    'ADMIN_EMAIL': 'Admin contact email',
    'GA4_ID': 'Google Analytics 4 tracking ID',
    'SENTRY_DSN': 'Sentry DSN for error tracking',
    'AFFILIATE_ID': 'Affiliate tracking ID',
    'ADSENSE_ID': 'Google AdSense ID',
    'AD_PROVIDER_KEY': 'Ad provider API key',
    'EMAIL_REPLY_TO': 'Email reply-to address',
    'CACHE_TTL': 'Cache TTL in seconds (default: 3600)'
  };
  
  return descriptions[key] || 'Configuration variable';
}

// Main execution
if (require.main === module) {
  const isValid = validateEnvironment();
  
  if (!isValid) {
    printEnvironmentSetup();
    process.exit(1);
  } else {
    console.log('\n🎉 Environment validation passed!');
    console.log('✅ Ready for development and deployment');
  }
}

module.exports = { validateEnvironment, required, optional };
