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
      bucketDetails: {},
      recommendations: []
    };

    // Check the specific bucket and folders
    const bucketName = 'claimnavigatorai-docs';
    
    try {
      // Check if bucket exists
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        results.bucketDetails.error = bucketsError.message;
        results.recommendations.push('Error listing buckets: ' + bucketsError.message);
      } else {
        const bucket = buckets.find(b => b.name === bucketName);
        results.bucketDetails.bucketExists = !!bucket;
        results.bucketDetails.bucketInfo = bucket;
      }

      // Check en/ folder (English documents)
      const { data: enFiles, error: enError } = await supabase.storage
        .from(bucketName)
        .list('en', { limit: 100 });

      results.bucketDetails.enFolder = {
        exists: !enError,
        error: enError?.message,
        fileCount: enFiles?.length || 0,
        sampleFiles: enFiles?.slice(0, 10) || []
      };

      // Check es/ folder (Spanish documents)
      const { data: esFiles, error: esError } = await supabase.storage
        .from(bucketName)
        .list('es', { limit: 100 });

      results.bucketDetails.esFolder = {
        exists: !esError,
        error: esError?.message,
        fileCount: esFiles?.length || 0,
        sampleFiles: esFiles?.slice(0, 10) || []
      };

      // Check root folder
      const { data: rootFiles, error: rootError } = await supabase.storage
        .from(bucketName)
        .list('', { limit: 100 });

      results.bucketDetails.rootFolder = {
        exists: !rootError,
        error: rootError?.message,
        fileCount: rootFiles?.length || 0,
        sampleFiles: rootFiles?.slice(0, 10) || []
      };

      // Generate recommendations
      if (enError || esError) {
        results.recommendations.push('Storage access error - check API key permissions');
      }
      
      if (results.bucketDetails.enFolder.fileCount === 0 && results.bucketDetails.esFolder.fileCount === 0) {
        results.recommendations.push('No documents found in either folder - documents may need to be uploaded');
      }
      
      if (results.bucketDetails.enFolder.fileCount > 0 || results.bucketDetails.esFolder.fileCount > 0) {
        results.recommendations.push('Documents found - ready to populate database metadata');
      }

    } catch (error) {
      results.bucketDetails.error = error.message;
      results.recommendations.push('Unexpected error: ' + error.message);
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        message: 'Detailed storage check complete',
        results,
        summary: {
          totalFiles: (results.bucketDetails.enFolder?.fileCount || 0) + (results.bucketDetails.esFolder?.fileCount || 0),
          englishFiles: results.bucketDetails.enFolder?.fileCount || 0,
          spanishFiles: results.bucketDetails.esFolder?.fileCount || 0,
          bucketExists: results.bucketDetails.bucketExists
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
