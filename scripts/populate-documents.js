// Script to populate the documents table in Supabase with all document metadata
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://bnxvfxtpsxgfpltflyrr.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key'; // You'll need to replace this with your service role key

const supabase = createClient(supabaseUrl, supabaseKey);

async function populateDocuments() {
  try {
    console.log('Starting document population...');

    // Load English documents
    const englishDocsPath = path.join(__dirname, '../assets/data/documents.json');
    const englishDocs = JSON.parse(fs.readFileSync(englishDocsPath, 'utf8'));

    // Load Spanish documents
    const spanishDocsPath = path.join(__dirname, '../assets/docs/es/documents.json');
    const spanishDocs = JSON.parse(fs.readFileSync(spanishDocsPath, 'utf8'));

    console.log(`Found ${Object.keys(englishDocs).length} English documents`);
    console.log(`Found ${Object.keys(spanishDocs).length} Spanish documents`);

    // Prepare English documents for insertion
    const englishDocuments = Object.values(englishDocs).map(doc => ({
      slug: doc.slug,
      label: doc.label,
      description: doc.description || 'Insurance claim document',
      language: 'en',
      template_path: doc.templatePath,
      sample_path: doc.samplePath
    }));

    // Prepare Spanish documents for insertion
    const spanishDocuments = Object.values(spanishDocs).map(doc => ({
      slug: doc.slug,
      label: doc.label,
      description: doc.description || 'Documento de reclamo de seguro',
      language: 'es',
      template_path: doc.templatePath,
      sample_path: doc.samplePath
    }));

    // Clear existing documents
    console.log('Clearing existing documents...');
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

    if (deleteError) {
      console.error('Error clearing documents:', deleteError);
    } else {
      console.log('Existing documents cleared');
    }

    // Insert English documents
    console.log('Inserting English documents...');
    const { data: englishData, error: englishError } = await supabase
      .from('documents')
      .insert(englishDocuments);

    if (englishError) {
      console.error('Error inserting English documents:', englishError);
    } else {
      console.log(`Successfully inserted ${englishDocuments.length} English documents`);
    }

    // Insert Spanish documents
    console.log('Inserting Spanish documents...');
    const { data: spanishData, error: spanishError } = await supabase
      .from('documents')
      .insert(spanishDocuments);

    if (spanishError) {
      console.error('Error inserting Spanish documents:', spanishError);
    } else {
      console.log(`Successfully inserted ${spanishDocuments.length} Spanish documents`);
    }

    // Verify the insertion
    const { data: allDocs, error: verifyError } = await supabase
      .from('documents')
      .select('language')
      .order('language');

    if (verifyError) {
      console.error('Error verifying documents:', verifyError);
    } else {
      const englishCount = allDocs.filter(doc => doc.language === 'en').length;
      const spanishCount = allDocs.filter(doc => doc.language === 'es').length;
      console.log(`\nVerification complete:`);
      console.log(`- English documents: ${englishCount}`);
      console.log(`- Spanish documents: ${spanishCount}`);
      console.log(`- Total documents: ${allDocs.length}`);
    }

    console.log('\nDocument population completed successfully!');

  } catch (error) {
    console.error('Error populating documents:', error);
    process.exit(1);
  }
}

// Run the script
populateDocuments();
