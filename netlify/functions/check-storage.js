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

    // List all storage buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

    if (bucketsError) {
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Failed to list storage buckets',
          details: bucketsError.message
        })
      };
    }

    const results = {
      buckets: buckets || [],
      bucketContents: {}
    };

    // Check each bucket for files
    for (const bucket of buckets || []) {
      try {
        const { data: files, error: filesError } = await supabase.storage
          .from(bucket.name)
          .list('', { limit: 1000 });

        if (filesError) {
          results.bucketContents[bucket.name] = { error: filesError.message };
        } else {
          results.bucketContents[bucket.name] = {
            files: files || [],
            fileCount: (files || []).length,
            pdfFiles: (files || []).filter(f => f.name.endsWith('.pdf')).length
          };
        }
      } catch (error) {
        results.bucketContents[bucket.name] = { error: error.message };
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
        message: 'Storage inspection complete',
        results: results,
        summary: {
          totalBuckets: (buckets || []).length,
          bucketNames: (buckets || []).map(b => b.name),
          totalPdfFiles: Object.values(results.bucketContents)
            .filter(content => content.pdfFiles)
            .reduce((sum, content) => sum + content.pdfFiles, 0)
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
