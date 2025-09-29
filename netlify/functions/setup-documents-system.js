const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
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

    // Step 1: Check if documents table exists and has correct schema
    console.log('Checking documents table schema...');
    
    // Try to query the table to see what columns exist
    const { data: existingDocs, error: queryError } = await supabase
      .from('documents')
      .select('*')
      .limit(1);

    if (queryError) {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'Documents table schema issue',
          details: queryError.message,
          code: queryError.code,
          hint: queryError.hint,
          solution: 'Run the SQL schema update in Supabase dashboard'
        })
      };
    }

    // Step 2: Test inserting a document with full schema
    console.log('Testing document insertion...');
    
    const testDocument = {
      slug: 'test-document-setup',
      label: 'Test Document Setup',
      language: 'en',
      template_path: 'test-template.pdf',
      sample_path: 'test-sample.pdf'
    };

    const { data: insertData, error: insertError } = await supabase
      .from('documents')
      .insert(testDocument)
      .select();

    if (insertError) {
      // Clean up and return error
      await supabase.from('documents').delete().eq('slug', 'test-document-setup');
      
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'Document insertion failed',
          details: insertError.message,
          code: insertError.code,
          hint: insertError.hint,
          solution: 'The documents table needs the following columns: slug, label, language, template_path, sample_path'
        })
      };
    }

    // Step 3: Clean up test document
    await supabase.from('documents').delete().eq('slug', 'test-document-setup');

    // Step 4: Check Supabase Storage for documents
    console.log('Checking Supabase Storage...');
    
    const { data: storageData, error: storageError } = await supabase.storage
      .from('documents')
      .list('', { limit: 1 });

    if (storageError) {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: true,
          message: 'Documents table schema is correct',
          tableStatus: 'Ready',
          storageStatus: 'Missing or inaccessible',
          storageError: storageError.message,
          nextSteps: [
            '1. Create a "documents" bucket in Supabase Storage',
            '2. Upload PDF files to the bucket',
            '3. Run the populate-documents function'
          ]
        })
      };
    }

    // Step 5: Count existing documents
    const { data: allDocs, error: countError } = await supabase
      .from('documents')
      .select('id')
      .order('id');

    const documentCount = allDocs ? allDocs.length : 0;

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        message: 'Document system status check complete',
        tableStatus: 'Ready',
        storageStatus: 'Accessible',
        documentCount: documentCount,
        nextSteps: documentCount === 0 ? [
          '1. Upload PDF files to Supabase Storage documents bucket',
          '2. Run populate-documents function to add metadata',
          '3. Test document access in Claim Resource & AI Response Center'
        ] : [
          '1. Test document access in Claim Resource & AI Response Center',
          '2. Verify all documents are accessible'
        ]
      })
    };

  } catch (error) {
    console.error('Error in setup-documents-system:', error);
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
