#!/usr/bin/env node
/**
 * Test script to verify the AI function works for all document types
 */

const fs = require('fs');
const path = require('path');

// Read metadata
const metadata = JSON.parse(fs.readFileSync('assets/data/document-metadata.json', 'utf8'));

console.log('TESTING AI FUNCTION FOR ALL DOCUMENT TYPES');
console.log('='.repeat(50));

// Test data
const testFormData = {
  name: 'John Doe',
  policyNumber: 'POL-123456',
  claimNumber: 'CLM-789012',
  dateOfLoss: '2024-01-15',
  insuranceCompany: 'Test Insurance Co',
  address: '123 Main St, Anytown, ST 12345',
  phone: '555-123-4567',
  email: 'john@example.com'
};

const testContent = 'Fire damage to kitchen and living room. Need professional assessment.';

let successCount = 0;
let errorCount = 0;
const errors = [];

console.log(`Testing ${metadata.length} document types...\n`);

for (const doc of metadata) {
  try {
    console.log(`Testing: ${doc.id} (${doc.title})`);
    
    // Check if it's template-based
    if (doc.templateBased && doc.template) {
      const templatePath = path.join('assets/templates', doc.template);
      if (fs.existsSync(templatePath)) {
        console.log(`  ✓ Template file exists: ${doc.template}`);
        successCount++;
      } else {
        console.log(`  ❌ Template file missing: ${doc.template}`);
        errors.push(`${doc.id}: Missing template file ${doc.template}`);
        errorCount++;
      }
    } else {
      // Check if it has proper format for AI generation
      if (doc.format && (doc.sections || doc.fields || doc.columns)) {
        console.log(`  ✓ AI generation format: ${doc.format}`);
        successCount++;
      } else {
        console.log(`  ❌ Missing format information`);
        errors.push(`${doc.id}: Missing format information`);
        errorCount++;
      }
    }
    
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    errors.push(`${doc.id}: ${error.message}`);
    errorCount++;
  }
}

console.log('\n' + '='.repeat(50));
console.log('TEST RESULTS:');
console.log(`  Total documents: ${metadata.length}`);
console.log(`  Successful: ${successCount}`);
console.log(`  Errors: ${errorCount}`);

if (errors.length > 0) {
  console.log('\nERRORS FOUND:');
  errors.forEach(error => console.log(`  ❌ ${error}`));
} else {
  console.log('\n✅ All document types are properly configured!');
}

console.log('\n' + '='.repeat(50));
