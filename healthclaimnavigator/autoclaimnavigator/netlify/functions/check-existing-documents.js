const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Missing Supabase environment variables',
          details: {
            hasUrl: !!supabaseUrl,
            hasAnonKey: !!process.env.SUPABASE_ANON_KEY,
            hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
            hasAnyKey: !!(process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)
          }
        })
      };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check existing documents in the database
    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select('*');

    if (docsError) {
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Failed to query documents table',
          details: docsError.message
        })
      };
    }

    // Check storage bucket
    const { data: storageFiles, error: storageError } = await supabase.storage
      .from('documents')
      .list('', { limit: 1000 });

    if (storageError) {
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Failed to query storage bucket',
          details: storageError.message
        })
      };
    }

    // Count documents by language
    const englishDocs = documents ? documents.filter(doc => doc.language === 'en').length : 0;
    const spanishDocs = documents ? documents.filter(doc => doc.language === 'es').length : 0;
    const totalDocs = documents ? documents.length : 0;

    // Count storage files
    const englishFiles = storageFiles ? storageFiles.filter(file => file.name.startsWith('en/')).length : 0;
    const spanishFiles = storageFiles ? storageFiles.filter(file => file.name.startsWith('es/')).length : 0;
    const totalFiles = storageFiles ? storageFiles.length : 0;

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        message: 'Successfully checked existing documents',
        database: {
          totalDocuments: totalDocs,
          englishDocuments: englishDocs,
          spanishDocuments: spanishDocs,
          sampleDocuments: documents ? documents.slice(0, 5) : []
        },
        storage: {
          totalFiles: totalFiles,
          englishFiles: englishFiles,
          spanishFiles: spanishFiles,
          sampleFiles: storageFiles ? storageFiles.slice(0, 10) : []
        },
        environment: {
          hasUrl: !!supabaseUrl,
          hasAnonKey: !!process.env.SUPABASE_ANON_KEY,
          hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          hasAnyKey: !!(process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)
        }
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: 'Unexpected error occurred', 
        details: error.message 
      })
    };
  }
};
