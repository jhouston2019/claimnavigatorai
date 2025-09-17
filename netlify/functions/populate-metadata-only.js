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

    // First, check what files are already in storage
    const { data: storageFiles, error: storageError } = await supabase.storage
      .from('claimnavigatorai-docs')
      .list('', { limit: 1000 });

    if (storageError) {
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Failed to list storage files',
          details: storageError.message
        })
      };
    }

    // Clear existing documents table
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (deleteError) {
      console.error('Error clearing documents:', deleteError);
    }

    // Create metadata entries for each file in storage
    const documents = [];
    
    for (const file of storageFiles) {
      if (file.name.endsWith('.pdf')) {
        // Determine language from folder structure
        const isEnglish = file.name.startsWith('en/');
        const isSpanish = file.name.startsWith('es/');
        
        if (isEnglish || isSpanish) {
          const language = isEnglish ? 'en' : 'es';
          const fileName = file.name.replace(/^(en|es)\//, ''); // Remove folder prefix
          const documentName = fileName.replace('.pdf', '');
          
          // Create readable label
          const label = documentName
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          
          documents.push({
            slug: documentName,
            label: label,
            language: language,
            template_path: file.name,
            sample_path: null
          });
        }
      }
    }

    console.log(`Creating ${documents.length} document metadata entries...`);

    // Insert documents in batches
    const batchSize = 50;
    let insertedCount = 0;

    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('documents')
        .insert(batch);

      if (error) {
        console.error(`Error inserting batch ${Math.floor(i/batchSize) + 1}:`, error);
        return {
          statusCode: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            error: `Failed to insert batch ${Math.floor(i/batchSize) + 1}`, 
            details: error.message 
          })
        };
      }

      insertedCount += batch.length;
      console.log(`Inserted batch ${Math.floor(i/batchSize) + 1}: ${insertedCount}/${documents.length} documents`);
    }

    // Count by language
    const englishCount = documents.filter(doc => doc.language === 'en').length;
    const spanishCount = documents.filter(doc => doc.language === 'es').length;

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        message: `Successfully created metadata for ${insertedCount} documents from existing storage files`,
        details: {
          totalDocuments: insertedCount,
          englishDocuments: englishCount,
          spanishDocuments: spanishCount,
          storageFilesFound: storageFiles.length,
          batchSize: batchSize,
          batchesProcessed: Math.ceil(documents.length / batchSize)
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
