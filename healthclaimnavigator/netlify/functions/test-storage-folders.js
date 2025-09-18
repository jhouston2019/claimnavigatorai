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
          error: 'Missing Supabase environment variables',
          details: {
            hasUrl: !!supabaseUrl,
            hasAnonKey: !!process.env.SUPABASE_ANON_KEY,
            hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
          }
        })
      };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const results = {
      connection: {
        url: supabaseUrl,
        keyType: process.env.SUPABASE_ANON_KEY ? 'anon' : 'service_role',
        keyLength: supabaseKey.length
      },
      buckets: {},
      folderTests: {}
    };

    // Test different bucket names
    const bucketNames = ['claimnavigatorai-docs', 'claimnavigatorai_docs', 'documents', 'docs'];
    
    for (const bucketName of bucketNames) {
      try {
        // Test if bucket exists and list root files
        const { data: rootFiles, error: rootError } = await supabase.storage
          .from(bucketName)
          .list('', { limit: 10 });

        results.buckets[bucketName] = {
          exists: !rootError,
          rootError: rootError?.message,
          rootFileCount: rootFiles?.length || 0,
          rootFiles: rootFiles?.slice(0, 5) || []
        };

        // Test en/ folder
        const { data: enFiles, error: enError } = await supabase.storage
          .from(bucketName)
          .list('en', { limit: 10 });

        results.folderTests[`${bucketName}/en`] = {
          exists: !enError,
          error: enError?.message,
          fileCount: enFiles?.length || 0,
          sampleFiles: enFiles?.slice(0, 3) || []
        };

        // Test es/ folder
        const { data: esFiles, error: esError } = await supabase.storage
          .from(bucketName)
          .list('es', { limit: 10 });

        results.folderTests[`${bucketName}/es`] = {
          exists: !esError,
          error: esError?.message,
          fileCount: esFiles?.length || 0,
          sampleFiles: esFiles?.slice(0, 3) || []
        };

      } catch (error) {
        results.buckets[bucketName] = {
          exists: false,
          error: error.message
        };
      }
    }

    // Summary
    const summary = {
      totalBuckets: bucketNames.length,
      bucketsWithFiles: 0,
      totalFilesFound: 0,
      recommendations: []
    };

    for (const bucketName of bucketNames) {
      const bucket = results.buckets[bucketName];
      const enFolder = results.folderTests[`${bucketName}/en`];
      const esFolder = results.folderTests[`${bucketName}/es`];
      
      if (bucket.exists && (enFolder.fileCount > 0 || esFolder.fileCount > 0)) {
        summary.bucketsWithFiles++;
        summary.totalFilesFound += (enFolder.fileCount || 0) + (esFolder.fileCount || 0);
      }
    }

    if (summary.totalFilesFound === 0) {
      summary.recommendations.push("No files found in any bucket. Documents may be in a different Supabase project.");
      summary.recommendations.push("Check if the API key has storage read permissions.");
      summary.recommendations.push("Verify the exact bucket and folder structure in your Supabase dashboard.");
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        message: 'Storage folder test complete',
        results,
        summary
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
