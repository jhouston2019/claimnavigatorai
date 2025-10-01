const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  try {
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
          error: 'Missing Supabase environment variables'
        })
      };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const results = {
      connection: {
        url: supabaseUrl,
        keyType: process.env.SUPABASE_ANON_KEY ? 'anon' : 'service_role'
      },
      tests: {}
    };

    // Test 1: List all buckets
    try {
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      results.tests.listBuckets = {
        success: !bucketsError,
        error: bucketsError?.message,
        buckets: buckets?.map(b => ({ name: b.name, public: b.public })) || []
      };
    } catch (error) {
      results.tests.listBuckets = {
        success: false,
        error: error.message
      };
    }

    // Test 2: Try to access the specific bucket
    const bucketName = 'claimnavigatorai-docs';
    try {
      const { data: files, error: filesError } = await supabase.storage
        .from(bucketName)
        .list('', { limit: 10 });
      
      results.tests.bucketAccess = {
        success: !filesError,
        error: filesError?.message,
        fileCount: files?.length || 0,
        files: files || []
      };
    } catch (error) {
      results.tests.bucketAccess = {
        success: false,
        error: error.message
      };
    }

    // Test 3: Try to access en/ folder
    try {
      const { data: enFiles, error: enError } = await supabase.storage
        .from(bucketName)
        .list('en', { limit: 10 });
      
      results.tests.enFolder = {
        success: !enError,
        error: enError?.message,
        fileCount: enFiles?.length || 0,
        files: enFiles || []
      };
    } catch (error) {
      results.tests.enFolder = {
        success: false,
        error: error.message
      };
    }

    // Test 4: Try to access es/ folder
    try {
      const { data: esFiles, error: esError } = await supabase.storage
        .from(bucketName)
        .list('es', { limit: 10 });
      
      results.tests.esFolder = {
        success: !esError,
        error: esError?.message,
        fileCount: esFiles?.length || 0,
        files: esFiles || []
      };
    } catch (error) {
      results.tests.esFolder = {
        success: false,
        error: error.message
      };
    }

    // Test 5: Try to get a signed URL for a test file
    try {
      const { data: urlData, error: urlError } = await supabase.storage
        .from(bucketName)
        .createSignedUrl('en/test.pdf', 60);
      
      results.tests.signedUrl = {
        success: !urlError,
        error: urlError?.message,
        url: urlData?.signedUrl ? 'Generated successfully' : 'No URL generated'
      };
    } catch (error) {
      results.tests.signedUrl = {
        success: false,
        error: error.message
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        message: 'Direct access test complete',
        results,
        summary: {
          canListBuckets: results.tests.listBuckets?.success,
          canAccessBucket: results.tests.bucketAccess?.success,
          canAccessEnFolder: results.tests.enFolder?.success,
          canAccessEsFolder: results.tests.esFolder?.success,
          canGenerateUrls: results.tests.signedUrl?.success,
          totalFilesFound: (results.tests.enFolder?.fileCount || 0) + (results.tests.esFolder?.fileCount || 0)
        }
      })
    };

  } catch (error) {
    console.error('Unexpected error:', error);
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
