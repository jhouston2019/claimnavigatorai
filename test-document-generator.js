#!/usr/bin/env node

/**
 * Test script for Claim Navigator Document Generator
 * Tests the generate-document function with sample data
 */

const testDocumentGeneration = async () => {
    console.log('🧪 Testing Claim Navigator Document Generator...\n');
    
    // Test data
    const testData = {
        documentId: 'demand-letter',
        title: 'Payment Demand Letter',
        fields: {
            claimantName: 'John Smith',
            claimantAddress: '123 Main St, Anytown, ST 12345',
            insurerName: 'Test Insurance Company',
            policyNumber: 'POL-123456789',
            claimNumber: 'CLM-987654321',
            dateOfLoss: '2024-01-15',
            phoneNumber: '(555) 123-4567',
            email: 'john.smith@email.com',
            situationDetails: 'My property was damaged by a severe storm on January 15, 2024. I have submitted all required documentation but have not received any response from your claims department. I am requesting immediate processing of my claim and payment of the covered damages.'
        }
    };
    
    try {
        console.log('📋 Test Data:');
        console.log(`   Document Type: ${testData.title}`);
        console.log(`   Claimant: ${testData.fields.claimantName}`);
        console.log(`   Policy: ${testData.fields.policyNumber}`);
        console.log(`   Claim: ${testData.fields.claimNumber}`);
        console.log(`   Date of Loss: ${testData.fields.dateOfLoss}\n`);
        
        // Test the generate-document function
        const response = await fetch('http://localhost:8888/.netlify/functions/generate-document', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testData)
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Document Generation Successful!');
            console.log(`   Document Type: ${result.documentType}`);
            console.log(`   Generated At: ${result.generatedAt}`);
            console.log(`   Content Length: ${result.html.length} characters`);
            console.log('\n📄 Generated Document Preview:');
            console.log('─'.repeat(50));
            console.log(result.html.substring(0, 500) + '...');
            console.log('─'.repeat(50));
        } else {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.log('❌ Document Generation Failed:');
            console.log(`   Status: ${response.status}`);
            console.log(`   Error: ${errorData.error || 'Unknown error'}`);
        }
        
    } catch (error) {
        console.log('❌ Test Failed:');
        console.log(`   Error: ${error.message}`);
        console.log('\n💡 Make sure the development server is running:');
        console.log('   npm run dev');
    }
};

// Test different document types
const testMultipleDocumentTypes = async () => {
    const documentTypes = [
        'demand-letter',
        'appeal-letter', 
        'claim-form',
        'damage-assessment',
        'business-interruption-claim'
    ];
    
    console.log('🧪 Testing Multiple Document Types...\n');
    
    for (const docType of documentTypes) {
        try {
            const testData = {
                documentId: docType,
                title: `${docType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
                fields: {
                    claimantName: 'Test User',
                    claimantAddress: '123 Test St, Test City, TC 12345',
                    insurerName: 'Test Insurance Co',
                    policyNumber: 'TEST-123456',
                    claimNumber: 'CLM-123456',
                    dateOfLoss: '2024-01-15',
                    situationDetails: 'This is a test claim for document generation testing purposes.'
                }
            };
            
            const response = await fetch('http://localhost:8888/.netlify/functions/generate-document', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(testData)
            });
            
            if (response.ok) {
                console.log(`✅ ${docType}: Success`);
            } else {
                console.log(`❌ ${docType}: Failed (${response.status})`);
            }
        } catch (error) {
            console.log(`❌ ${docType}: Error - ${error.message}`);
        }
    }
};

// Run tests
const runTests = async () => {
    await testDocumentGeneration();
    console.log('\n' + '='.repeat(60) + '\n');
    await testMultipleDocumentTypes();
    
    console.log('\n🎉 Testing Complete!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Start the development server: npm run dev');
    console.log('   2. Open http://localhost:8888/app/resource-center/document-generator.html');
    console.log('   3. Test the document generator interface');
    console.log('   4. Verify PDF download functionality');
};

// Check if running directly
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { testDocumentGeneration, testMultipleDocumentTypes };
