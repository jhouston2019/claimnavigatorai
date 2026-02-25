#!/usr/bin/env node

/**
 * Appeal Builder Setup Script
 * 
 * This script helps set up the Appeal Builder system by:
 * 1. Testing the current configuration
 * 2. Providing setup instructions
 * 3. Validating the system is ready
 */

const https = require('https');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testAppealBuilderSystem() {
  log('\n🔍 Testing Appeal Builder System...', 'cyan');
  
  try {
    // Test the system
    const result = await makeRequest('https://Claim Command Pro.com/.netlify/functions/test-appeal-builder', {
      method: 'GET'
    });
    
    if (result.status === 'success') {
      log('✅ System test completed successfully!', 'green');
      
      // Display test results
      log('\n📊 Test Results:', 'bright');
      Object.entries(result.tests).forEach(([test, passed]) => {
        const status = passed ? '✅' : '❌';
        const color = passed ? 'green' : 'red';
        log(`  ${status} ${test.replace(/_/g, ' ').toUpperCase()}: ${passed ? 'PASS' : 'FAIL'}`, color);
      });
      
      // Display summary
      log(`\n📈 Summary: ${result.summary.passed}/${result.summary.total_tests} tests passed`, 
          result.summary.passed === result.summary.total_tests ? 'green' : 'yellow');
      
      // Display recommendations
      if (result.recommendations && result.recommendations.length > 0) {
        log('\n💡 Recommendations:', 'yellow');
        result.recommendations.forEach(rec => {
          log(`  • ${rec}`, 'yellow');
        });
      }
      
      return result.summary.passed === result.summary.total_tests;
      
    } else {
      log('❌ System test failed!', 'red');
      log(`Error: ${result.error}`, 'red');
      return false;
    }
    
  } catch (error) {
    log('❌ Failed to test system:', 'red');
    log(`Error: ${error.message}`, 'red');
    return false;
  }
}

function displaySetupInstructions() {
  log('\n📋 Appeal Builder Setup Instructions', 'bright');
  log('=====================================', 'bright');
  
  log('\n1. 🗄️  Database Setup:', 'cyan');
  log('   Run this SQL in your Supabase SQL Editor:');
  log('   📁 supabase/complete_appeal_builder_setup.sql', 'yellow');
  
  log('\n2. 💳 Stripe Configuration:', 'cyan');
  log('   a) Create product: "Appeal Builder - Premium Access"');
  log('   b) Set price: $249.00 USD (one-time)');
  log('   c) Ensure webhook endpoint is configured');
  log('   d) Enable checkout.session.completed event');
  
  log('\n3. 🔧 Environment Variables:', 'cyan');
  log('   Ensure these are set in Netlify:');
  log('   • STRIPE_SECRET_KEY', 'yellow');
  log('   • STRIPE_WEBHOOK_SECRET', 'yellow');
  log('   • OPENAI_API_KEY', 'yellow');
  log('   • SUPABASE_URL', 'yellow');
  log('   • SUPABASE_SERVICE_ROLE_KEY', 'yellow');
  
  log('\n4. 🧪 Testing:', 'cyan');
  log('   a) Visit: /app/response-center.html');
  log('   b) Click "Appeal Builder" tab');
  log('   c) Test the complete purchase flow');
  log('   d) Verify letter generation works');
  
  log('\n5. 📚 Documentation:', 'cyan');
  log('   • APPEAL_BUILDER_IMPLEMENTATION.md - Complete system docs');
  log('   • APPEAL_BUILDER_DEPLOYMENT_CHECKLIST.md - Deployment guide');
}

async function main() {
  log('🚀 Appeal Builder Setup Assistant', 'bright');
  log('==================================', 'bright');
  
  const isSystemReady = await testAppealBuilderSystem();
  
  if (isSystemReady) {
    log('\n🎉 Appeal Builder system is ready!', 'green');
    log('You can now test the complete flow:', 'green');
    log('1. Go to /app/response-center.html', 'green');
    log('2. Click "Appeal Builder" tab', 'green');
    log('3. Test the purchase and generation flow', 'green');
  } else {
    log('\n⚠️  System needs setup before use', 'yellow');
    displaySetupInstructions();
  }
  
  log('\n📞 Need help?', 'cyan');
  log('Check the documentation files for detailed instructions.', 'cyan');
  
  rl.close();
}

// Handle command line arguments
if (process.argv.includes('--test-only')) {
  testAppealBuilderSystem().then(success => {
    process.exit(success ? 0 : 1);
  });
} else if (process.argv.includes('--instructions-only')) {
  displaySetupInstructions();
  rl.close();
} else {
  main();
}


