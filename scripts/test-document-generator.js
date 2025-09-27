/**
 * Test script for Document Generator functionality
 * Run with: node scripts/test-document-generator.js
 */

const { validateDocumentInput } = require('../lib/validation/schemas');
const { generateDocument } = require('../lib/ai/generate');
const { htmlToPDFBuffer } = require('../lib/files/pdf');
const { htmlToDocxBuffer, parseHtmlToSections } = require('../lib/files/docx');

// Test data for Proof of Loss
const testProofOfLossData = {
  policyholderName: "John Doe",
  address: "123 Main St, Anytown, ST 12345",
  email: "john.doe@email.com",
  phone: "555-123-4567",
  policyNumber: "POL-123456",
  claimNumber: "CLM-789012",
  dateOfLoss: "2024-01-15",
  lossType: "fire",
  damageDescription: "Kitchen fire caused by electrical malfunction. Extensive smoke damage throughout first floor.",
  estimatedValueStructure: 50000,
  estimatedValueContents: 25000,
  deductible: 1000,
  attachmentsSummary: "Photos of damage, fire department report, electrical inspection report"
};

// Test data for Appeal Letter
const testAppealLetterData = {
  policyholderName: "Jane Smith",
  address: "456 Oak Ave, Somewhere, ST 67890",
  email: "jane.smith@email.com",
  phone: "555-987-6543",
  policyNumber: "POL-789012",
  claimNumber: "CLM-345678",
  dateOfLoss: "2024-02-01",
  lossType: "water",
  denialDate: "2024-02-15",
  denialReason: "Claim denied due to pre-existing damage",
  facts: "Damage occurred due to burst pipe during freeze. No pre-existing damage documented.",
  evidenceList: "Plumber report, weather service records, before/after photos",
  requestedAction: "Request full claim review and approval of $15,000 in damages"
};

async function testValidation() {
  console.log('🧪 Testing validation schemas...');
  
  try {
    // Test Proof of Loss validation
    const proofOfLossResult = validateDocumentInput('proof-of-loss', testProofOfLossData);
    console.log('✅ Proof of Loss validation passed');
    
    // Test Appeal Letter validation
    const appealLetterResult = validateDocumentInput('appeal-letter', testAppealLetterData);
    console.log('✅ Appeal Letter validation passed');
    
    // Test invalid data
    try {
      const invalidData = { policyholderName: "J" }; // Too short
      validateDocumentInput('proof-of-loss', invalidData);
      console.log('❌ Validation should have failed for invalid data');
    } catch (error) {
      console.log('✅ Validation correctly rejected invalid data');
    }
    
  } catch (error) {
    console.error('❌ Validation test failed:', error.message);
  }
}

async function testAIGeneration() {
  console.log('🤖 Testing AI document generation...');
  
  try {
    // Test Proof of Loss generation
    const proofOfLossResult = await generateDocument({
      docType: 'proof-of-loss',
      lang: 'en',
      input: testProofOfLossData
    });
    
    if (proofOfLossResult.content && proofOfLossResult.content.length > 100) {
      console.log('✅ Proof of Loss generation successful');
      console.log(`📄 Generated ${proofOfLossResult.content.length} characters`);
    } else {
      console.log('❌ Proof of Loss generation failed - content too short');
    }
    
    // Test Spanish generation
    const spanishResult = await generateDocument({
      docType: 'proof-of-loss',
      lang: 'es',
      input: testProofOfLossData
    });
    
    if (spanishResult.content && spanishResult.content.length > 100) {
      console.log('✅ Spanish generation successful');
    } else {
      console.log('❌ Spanish generation failed');
    }
    
  } catch (error) {
    console.error('❌ AI generation test failed:', error.message);
  }
}

async function testFileGeneration() {
  console.log('📄 Testing file generation...');
  
  try {
    const sampleHtml = `
      <h1>Proof of Loss</h1>
      <p><strong>Policyholder:</strong> John Doe</p>
      <p><strong>Date of Loss:</strong> January 15, 2024</p>
      <p><strong>Damage Description:</strong> Kitchen fire caused by electrical malfunction.</p>
      <h2>Estimated Values</h2>
      <ul>
        <li>Structure: $50,000</li>
        <li>Contents: $25,000</li>
      </ul>
    `;
    
    // Test PDF generation
    const pdfBuffer = await htmlToPDFBuffer(sampleHtml, {
      policyholderName: "John Doe",
      docType: "proof-of-loss"
    });
    
    if (pdfBuffer && pdfBuffer.length > 1000) {
      console.log('✅ PDF generation successful');
      console.log(`📄 Generated PDF: ${pdfBuffer.length} bytes`);
    } else {
      console.log('❌ PDF generation failed - buffer too small');
    }
    
    // Test DOCX generation
    const sections = parseHtmlToSections(sampleHtml);
    const docxBuffer = await htmlToDocxBuffer({
      title: "Proof of Loss",
      sections: sections,
      policyholderName: "John Doe",
      docType: "proof-of-loss"
    });
    
    if (docxBuffer && docxBuffer.length > 1000) {
      console.log('✅ DOCX generation successful');
      console.log(`📄 Generated DOCX: ${docxBuffer.length} bytes`);
    } else {
      console.log('❌ DOCX generation failed - buffer too small');
    }
    
  } catch (error) {
    console.error('❌ File generation test failed:', error.message);
  }
}

async function testDocumentTypes() {
  console.log('📋 Testing all document types...');
  
  const documentTypes = [
    'proof-of-loss',
    'appeal-letter',
    'demand-letter',
    'damage-inventory',
    'claim-timeline',
    'repair-cost-worksheet',
    'out-of-pocket-expenses',
    'appraisal-demand',
    'delay-complaint',
    'coverage-clarification'
  ];
  
  for (const docType of documentTypes) {
    try {
      // Test validation for each type
      const testData = getTestDataForType(docType);
      validateDocumentInput(docType, testData);
      console.log(`✅ ${docType} validation passed`);
    } catch (error) {
      console.log(`❌ ${docType} validation failed:`, error.message);
    }
  }
}

function getTestDataForType(docType) {
  const baseData = {
    policyholderName: "Test User",
    address: "123 Test St",
    email: "test@example.com",
    phone: "555-123-4567",
    policyNumber: "POL-123",
    claimNumber: "CLM-456",
    dateOfLoss: "2024-01-01",
    lossType: "fire"
  };
  
  switch (docType) {
    case 'proof-of-loss':
      return { ...baseData, ...testProofOfLossData };
    case 'appeal-letter':
      return { ...baseData, ...testAppealLetterData };
    case 'demand-letter':
      return {
        ...baseData,
        offerAmount: 10000,
        independentEstimateAmount: 15000,
        supportingDocs: "Independent estimate, photos",
        deadlineDays: 30
      };
    case 'damage-inventory':
      return {
        ...baseData,
        items: [{
          item: "Sofa",
          description: "3-seat leather sofa",
          quantity: 1,
          condition: "good",
          unitCost: 2000,
          total: 2000
        }]
      };
    case 'claim-timeline':
      return {
        ...baseData,
        entries: [{
          date: "2024-01-01",
          actor: "policyholder",
          event: "Loss occurred",
          notes: "Fire started in kitchen",
          attachmentRef: "Fire report"
        }]
      };
    case 'repair-cost-worksheet':
      return {
        ...baseData,
        rooms: [{
          area: "Kitchen",
          scope: "Complete rebuild",
          laborRate: 75,
          hours: 40,
          materials: 5000,
          subtotal: 8000
        }]
      };
    case 'out-of-pocket-expenses':
      return {
        ...baseData,
        expenses: [{
          date: "2024-01-02",
          category: "ale",
          vendor: "Hotel ABC",
          amount: 150,
          receiptRef: "Receipt #123",
          notes: "Temporary accommodation"
        }]
      };
    case 'appraisal-demand':
      return {
        ...baseData,
        policyAppraisalClauseRef: "Section 12.3",
        nominatedUmpire: "John Appraiser",
        basisOfDispute: "Disagreement on damage valuation"
      };
    case 'delay-complaint':
      return {
        ...baseData,
        submittedDate: "2024-01-01",
        statutoryDeadlineDays: 30,
        missedByDays: 15,
        priorFollowUps: "Called 3 times, sent 2 emails"
      };
    case 'coverage-clarification':
      return {
        ...baseData,
        provisionInQuestion: "Section 8.2 - Water damage coverage",
        factualContext: "Pipe burst during freeze",
        specificQuestions: ["Is freeze damage covered?", "What is the coverage limit?"]
      };
    default:
      return baseData;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Document Generator Tests\n');
  
  try {
    await testValidation();
    console.log('');
    
    await testDocumentTypes();
    console.log('');
    
    // Only run AI and file generation tests if OpenAI API key is available
    if (process.env.OPENAI_API_KEY) {
      await testAIGeneration();
      console.log('');
      
      await testFileGeneration();
      console.log('');
    } else {
      console.log('⚠️  Skipping AI and file generation tests (no OpenAI API key)');
    }
    
    console.log('✅ All tests completed!');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testValidation,
  testAIGeneration,
  testFileGeneration,
  testDocumentTypes,
  runAllTests
};
