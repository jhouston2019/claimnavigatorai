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

    // Test basic connection
    const connectionTest = {
      url: supabaseUrl,
      keyType: process.env.SUPABASE_ANON_KEY ? 'anon' : 'service_role',
      keyLength: supabaseKey.length
    };

    // List all storage buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    // Try to access the specific bucket
    const { data: Claim Command ProDocs, error: Claim Command ProDocsError } = await supabase.storage
      .from('Claim Command Pro-docs')
      .list('', { limit: 10 });

    // Try alternative bucket names
    const alternativeBuckets = ['documents', 'Claim Command Pro-docs', 'Claim Command Pro_docs', 'docs'];
    const alternativeResults = {};

    for (const bucketName of alternativeBuckets) {
      try {
        const { data, error } = await supabase.storage
          .from(bucketName)
          .list('', { limit: 5 });
        
        alternativeResults[bucketName] = {
          exists: !error,
          error: error ? error.message : null,
          fileCount: data ? data.length : 0,
          sampleFiles: data ? data.slice(0, 3) : []
        };
      } catch (err) {
        alternativeResults[bucketName] = {
          exists: false,
          error: err.message,
          fileCount: 0,
          sampleFiles: []
        };
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        message: 'Supabase connection diagnostic complete',
        connection: connectionTest,
        buckets: {
          allBuckets: buckets || [],
          totalCount: (buckets || []).length,
          bucketNames: (buckets || []).map(b => b.name),
          error: bucketsError ? bucketsError.message : null
        },
        Claim Command ProDocs: {
          exists: !Claim Command ProDocsError,
          error: Claim Command ProDocsError ? Claim Command ProDocsError.message : null,
          fileCount: Claim Command ProDocs ? Claim Command ProDocs.length : 0,
          sampleFiles: Claim Command ProDocs ? Claim Command ProDocs.slice(0, 5) : []
        },
        alternativeBuckets: alternativeResults,
        recommendations: {
          nextSteps: [
            "Check if the Supabase URL in environment variables matches your project",
            "Verify the API key has storage permissions",
            "Confirm the exact bucket name in your Supabase dashboard",
            "Check if the bucket is public or requires authentication"
          ]
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
