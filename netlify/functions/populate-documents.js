const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

exports.handler = async (event, context) => {
  // Only allow this function to run in development or with admin access
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Supabase configuration missing' })
      };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Load English documents
    const englishDocsPath = path.join(__dirname, '../../assets/data/documents.json');
    const englishDocs = JSON.parse(fs.readFileSync(englishDocsPath, 'utf8'));

    // Load Spanish documents
    const spanishDocsPath = path.join(__dirname, '../../assets/docs/es/documents.json');
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
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Failed to clear existing documents', details: deleteError.message })
      };
    }

    // Insert English documents
    console.log('Inserting English documents...');
    const { data: englishData, error: englishError } = await supabase
      .from('documents')
      .insert(englishDocuments);

    if (englishError) {
      console.error('Error inserting English documents:', englishError);
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Failed to insert English documents', details: englishError.message })
      };
    }

    // Insert Spanish documents
    console.log('Inserting Spanish documents...');
    const { data: spanishData, error: spanishError } = await supabase
      .from('documents')
      .insert(spanishDocuments);

    if (spanishError) {
      console.error('Error inserting Spanish documents:', spanishError);
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Failed to insert Spanish documents', details: spanishError.message })
      };
    }

    // Verify the insertion
    const { data: allDocs, error: verifyError } = await supabase
      .from('documents')
      .select('language')
      .order('language');

    if (verifyError) {
      console.error('Error verifying documents:', verifyError);
    }

    const englishCount = allDocs ? allDocs.filter(doc => doc.language === 'en').length : 0;
    const spanishCount = allDocs ? allDocs.filter(doc => doc.language === 'es').length : 0;

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        message: 'Documents populated successfully',
        counts: {
          english: englishCount,
          spanish: spanishCount,
          total: englishCount + spanishCount
        }
      })
    };

  } catch (error) {
    console.error('Error populating documents:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Internal server error', details: error.message })
    };
  }
};
