/**
 * Navigation Regression Test
 * Tests that all resource center navigation links work correctly
 */

const fs = require('fs');
const path = require('path');

// Resource center pages to test
const resourceCenterPages = [
  'app/resource-center/index.html',
  'app/resource-center/quick-start.html',
  'app/resource-center/evidence-organizer.html',
  'app/resource-center/document-generator.html',
  'app/resource-center/financial-calculator.html',
  'app/resource-center/negotiation-tools.html',
  'app/resource-center/claim-timeline.html',
  'app/resource-center/professional-network.html',
  'app/resource-center/situational-advisory.html',
  'app/resource-center/maximize-claim.html',
  'app/resource-center/insurance-tactics.html',
  'app/resource-center/advanced-tools.html'
];

// Test function to check if files exist
function testFileExists(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);
  return fs.existsSync(fullPath);
}

// Test function to check for broken links in HTML content
function testBrokenLinks(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    return { error: `File not found: ${filePath}` };
  }
  
  const content = fs.readFileSync(fullPath, 'utf8');
  const linkRegex = /href=["']([^"']+)["']/g;
  const links = [];
  let match;
  
  while ((match = linkRegex.exec(content)) !== null) {
    links.push(match[1]);
  }
  
  const brokenLinks = [];
  
  links.forEach(link => {
    // Skip external links and anchors
    if (link.startsWith('http') || link.startsWith('mailto:') || link.startsWith('#')) {
      return;
    }
    
    // Check if internal link exists
    if (link.startsWith('/')) {
      const targetPath = path.join(__dirname, '..', link);
      if (!fs.existsSync(targetPath)) {
        brokenLinks.push(link);
      }
    } else {
      // Relative link
      const targetPath = path.join(path.dirname(fullPath), link);
      if (!fs.existsSync(targetPath)) {
        brokenLinks.push(link);
      }
    }
  });
  
  return { brokenLinks };
}

// Run tests
function runNavigationTests() {
  console.log('🧪 Running Navigation Regression Tests...\n');
  
  let passedTests = 0;
  let totalTests = 0;
  let errors = [];
  
  // Test 1: Check all resource center pages exist
  console.log('📁 Testing file existence...');
  resourceCenterPages.forEach(page => {
    totalTests++;
    if (testFileExists(page)) {
      console.log(`✅ ${page} exists`);
      passedTests++;
    } else {
      console.log(`❌ ${page} missing`);
      errors.push(`Missing file: ${page}`);
    }
  });
  
  console.log('\n🔗 Testing for broken links...');
  
  // Test 2: Check for broken links in each page
  resourceCenterPages.forEach(page => {
    if (testFileExists(page)) {
      totalTests++;
      const result = testBrokenLinks(page);
      
      if (result.error) {
        console.log(`❌ ${page}: ${result.error}`);
        errors.push(`${page}: ${result.error}`);
      } else if (result.brokenLinks.length === 0) {
        console.log(`✅ ${page}: No broken links`);
        passedTests++;
      } else {
        console.log(`❌ ${page}: Broken links found:`, result.brokenLinks);
        errors.push(`${page}: Broken links - ${result.brokenLinks.join(', ')}`);
      }
    }
  });
  
  // Test 3: Check Navigation.tsx has correct paths
  console.log('\n🧭 Testing Navigation.tsx paths...');
  totalTests++;
  
  const navPath = path.join(__dirname, '..', 'components/Navigation.tsx');
  if (fs.existsSync(navPath)) {
    const navContent = fs.readFileSync(navPath, 'utf8');
    const resourceCenterPaths = navContent.match(/\/app\/resource-center\/[^"']+/g) || [];
    
    if (resourceCenterPaths.length >= 5) {
      console.log(`✅ Navigation.tsx has ${resourceCenterPaths.length} resource center paths`);
      passedTests++;
    } else {
      console.log(`❌ Navigation.tsx has insufficient resource center paths: ${resourceCenterPaths.length}`);
      errors.push('Navigation.tsx missing resource center paths');
    }
  } else {
    console.log('❌ Navigation.tsx not found');
    errors.push('Navigation.tsx file missing');
  }
  
  // Test 4: Check sitemap.xml includes resource center pages
  console.log('\n🗺️ Testing sitemap.xml...');
  totalTests++;
  
  const sitemapPath = path.join(__dirname, '..', 'sitemap.xml');
  if (fs.existsSync(sitemapPath)) {
    const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
    const resourceCenterUrls = sitemapContent.match(/app\/resource-center\/[^<]+/g) || [];
    
    if (resourceCenterUrls.length >= 10) {
      console.log(`✅ sitemap.xml includes ${resourceCenterUrls.length} resource center URLs`);
      passedTests++;
    } else {
      console.log(`❌ sitemap.xml has insufficient resource center URLs: ${resourceCenterUrls.length}`);
      errors.push('sitemap.xml missing resource center URLs');
    }
  } else {
    console.log('❌ sitemap.xml not found');
    errors.push('sitemap.xml file missing');
  }
  
  // Summary
  console.log('\n📊 Test Summary:');
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
  
  if (errors.length > 0) {
    console.log('\n🚨 Errors found:');
    errors.forEach(error => console.log(`  - ${error}`));
    process.exit(1);
  } else {
    console.log('\n🎉 All navigation tests passed!');
    process.exit(0);
  }
}

// Run the tests
if (require.main === module) {
  runNavigationTests();
}

module.exports = { runNavigationTests, testFileExists, testBrokenLinks };
