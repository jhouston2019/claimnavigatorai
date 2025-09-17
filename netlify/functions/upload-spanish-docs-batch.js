const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

exports.handler = async (event, context) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    
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
    const bucketName = 'claimnavigatorai-docs';
    
    // Get batch parameters from query string
    const { batchSize = 10, startIndex = 0 } = event.queryStringParameters || {};
    const batchSizeNum = parseInt(batchSize);
    const startIndexNum = parseInt(startIndex);

    const spanishDir = path.join(__dirname, '../../Document Library - Final Spanish');
    
    if (!fs.existsSync(spanishDir)) {
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Spanish documents directory not found'
        })
      };
    }

    const files = fs.readdirSync(spanishDir).filter(file => file.endsWith('.pdf'));
    const totalFiles = files.length;
    
    // Calculate batch range
    const endIndex = Math.min(startIndexNum + batchSizeNum, totalFiles);
    const batchFiles = files.slice(startIndexNum, endIndex);
    
    const results = {
      batch: {
        startIndex: startIndexNum,
        endIndex: endIndex - 1,
        batchSize: batchFiles.length,
        totalFiles: totalFiles
      },
      uploaded: 0,
      failed: 0,
      errors: [],
      uploadedFiles: []
    };

    console.log(`Processing batch ${startIndexNum}-${endIndex-1} of ${totalFiles} Spanish files`);

    // Upload files in this batch
    for (const file of batchFiles) {
      try {
        const filePath = path.join(spanishDir, file);
        const fileBuffer = fs.readFileSync(filePath);
        
        console.log(`Uploading: ${file}`);
        
        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(`es/${file}`, fileBuffer, {
            contentType: 'application/pdf',
            upsert: true // Overwrite if exists
          });

        if (error) {
          results.failed++;
          results.errors.push({ file, error: error.message });
          console.error(`Failed to upload ${file}:`, error.message);
        } else {
          results.uploaded++;
          results.uploadedFiles.push(file);
          console.log(`Successfully uploaded: ${file}`);
        }
        
        // Small delay to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (fileError) {
        results.failed++;
        results.errors.push({ file, error: fileError.message });
        console.error(`Error processing ${file}:`, fileError.message);
      }
    }

    const hasMore = endIndex < totalFiles;
    const nextBatch = hasMore ? {
      batchSize: batchSizeNum,
      startIndex: endIndex
    } : null;

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        message: `Batch ${startIndexNum}-${endIndex-1} complete`,
        results,
        hasMore,
        nextBatch,
        progress: {
          completed: endIndex,
          total: totalFiles,
          percentage: Math.round((endIndex / totalFiles) * 100)
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
