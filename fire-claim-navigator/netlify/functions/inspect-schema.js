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

    // Try to insert a test record to see what columns exist
    const testRecord = {
      slug: 'test-document',
      label: 'Test Document',
      language: 'en',
      template_path: 'test.pdf',
      sample_path: 'test-sample.pdf'
    };

    const { data, error } = await supabase
      .from('documents')
      .insert(testRecord)
      .select();

    if (error) {
      // If insert fails, try with minimal fields
      const minimalRecord = { slug: 'test-document' };
      const { data: minimalData, error: minimalError } = await supabase
        .from('documents')
        .insert(minimalRecord)
        .select();

      if (minimalError) {
        return {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            error: 'Schema inspection failed',
            details: minimalError.message,
            code: minimalError.code,
            hint: minimalError.hint,
            suggestion: 'The documents table may need to be recreated with proper schema'
          })
        };
      }

      // Clean up test record
      await supabase.from('documents').delete().eq('slug', 'test-document');

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: true,
          message: 'Documents table exists with minimal schema',
          workingFields: ['slug'],
          testRecord: minimalData
        })
      };
    }

    // Clean up test record
    await supabase.from('documents').delete().eq('slug', 'test-document');

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        message: 'Documents table has full schema',
        workingFields: ['slug', 'label', 'language', 'template_path', 'sample_path'],
        testRecord: data
      })
    };

  } catch (error) {
    console.error('Error inspecting schema:', error);
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
