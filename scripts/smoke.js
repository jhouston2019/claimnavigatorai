#!/usr/bin/env node

/**
 * Smoke tests for Claim Navigator infrastructure
 * Tests basic functionality of Netlify functions and infrastructure
 */

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.NETLIFY_URL || 'http://localhost:8888';
const TIMEOUT = 10000; // 10 seconds

// Test results
const results = {
  passed: 0,
  failed: 0,
  errors: []
};

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    const requestOptions = {
      timeout: TIMEOUT,
      ...options
    };

    const req = client.request(url, requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Request timeout')));
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Test function wrapper
async function test(name, testFn) {
  try {
    console.log(`🧪 Testing: ${name}`);
    await testFn();
    console.log(`✅ PASSED: ${name}`);
    results.passed++;
  } catch (error) {
    console.log(`❌ FAILED: ${name} - ${error.message}`);
    results.failed++;
    results.errors.push({ test: name, error: error.message });
  }
}

// Individual tests
async function testEnvironmentVariables() {
  const required = [
    'OPENAI_API_KEY',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'STRIPE_SECRET_KEY'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
}

async function testNetlifyFunctions() {
  const functions = [
    'generate-document',
    'getAdvisory',
    'save-playbook-progress',
    'tactics-logging',
    'policyAnalyzer',
    'stateRights',
    'settlementCompare',
    'generateNegotiation',
    'generateEscalation',
    'financialImpact'
  ];

  for (const func of functions) {
    const url = `${BASE_URL}/.netlify/functions/${func}`;
    
    try {
      const response = await makeRequest(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ test: true })
      });
      
      // Accept 200, 400, 401, 402 (but not 500)
      if (response.statusCode >= 500) {
        throw new Error(`Function returned ${response.statusCode}`);
      }
      
      // Check if response is valid JSON
      try {
        JSON.parse(response.body);
      } catch {
        throw new Error('Response is not valid JSON');
      }
      
    } catch (error) {
      if (error.message.includes('ECONNREFUSED')) {
        throw new Error('Netlify dev server not running. Start with: npm run dev');
      }
      throw error;
    }
  }
}

async function testSupabaseConnection() {
  // Test if we can import and initialize Supabase client
  try {
    // This would normally be done in a function, but we can test the import
    const { createClient } = require('@supabase/supabase-js');
    
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      throw new Error('Supabase environment variables not set');
    }
    
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    
    // Test basic connection (this will fail if URL/key are invalid)
    const { data, error } = await supabase.from('documents').select('count').limit(1);
    
    if (error && !error.message.includes('relation "documents" does not exist')) {
      throw new Error(`Supabase connection failed: ${error.message}`);
    }
    
  } catch (error) {
    throw new Error(`Supabase setup error: ${error.message}`);
  }
}

async function testStripeConnection() {
  try {
    const Stripe = require('stripe');
    
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('Stripe secret key not set');
    }
    
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    
    // Test basic API call
    await stripe.customers.list({ limit: 1 });
    
  } catch (error) {
    if (error.message.includes('Invalid API Key')) {
      throw new Error('Invalid Stripe API key');
    }
    throw new Error(`Stripe connection error: ${error.message}`);
  }
}

async function testOpenAIConnection() {
  try {
    const OpenAI = require('openai');
    
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not set');
    }
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    // Test basic API call
    await openai.models.list();
    
  } catch (error) {
    if (error.message.includes('Incorrect API key')) {
      throw new Error('Invalid OpenAI API key');
    }
    throw new Error(`OpenAI connection error: ${error.message}`);
  }
}

async function testFileStructure() {
  const fs = require('fs');
  const path = require('path');
  
  const requiredFiles = [
    'lib/env.ts',
    'lib/supabase/server.ts',
    'lib/supabase/client.ts',
    'lib/auth/getUser.ts',
    'lib/stripe/subscription.ts',
    'lib/usage/quota.ts',
    'lib/http/withGuard.ts',
    'lib/http/response.ts',
    'lib/errors/messages.ts',
    'locales/en.json',
    'locales/es.json',
    'components/ui/Button.tsx',
    'components/ui/Card.tsx',
    'components/ui/Toast.tsx',
    'components/LanguageToggle.tsx',
    'supabase/migrations/20250929_claim_nav_infra.sql'
  ];
  
  const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
  
  if (missingFiles.length > 0) {
    throw new Error(`Missing required files: ${missingFiles.join(', ')}`);
  }
}

async function testTypeScriptCompilation() {
  const { execSync } = require('child_process');
  
  try {
    execSync('npx tsc --noEmit', { stdio: 'pipe' });
  } catch (error) {
    throw new Error(`TypeScript compilation failed: ${error.message}`);
  }
}

// Main test runner
async function runSmokeTests() {
  console.log('🚀 Starting Claim Navigator Smoke Tests\n');
  
  await test('Environment Variables', testEnvironmentVariables);
  await test('File Structure', testFileStructure);
  await test('TypeScript Compilation', testTypeScriptCompilation);
  await test('Supabase Connection', testSupabaseConnection);
  await test('Stripe Connection', testStripeConnection);
  await test('OpenAI Connection', testOpenAIConnection);
  await test('Netlify Functions', testNetlifyFunctions);
  
  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  
  if (results.failed > 0) {
    console.log('\n🔍 Failed Tests:');
    results.errors.forEach(({ test, error }) => {
      console.log(`  • ${test}: ${error}`);
    });
    
    console.log('\n💡 Troubleshooting:');
    console.log('  1. Ensure all environment variables are set');
    console.log('  2. Run "npm run dev" to start Netlify dev server');
    console.log('  3. Check that all required files exist');
    console.log('  4. Verify API keys are valid');
    
    process.exit(1);
  } else {
    console.log('\n🎉 All smoke tests passed!');
    console.log('✅ Infrastructure is ready for deployment');
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runSmokeTests().catch(error => {
    console.error('💥 Smoke test runner failed:', error);
    process.exit(1);
  });
}

module.exports = { runSmokeTests, test, makeRequest };
