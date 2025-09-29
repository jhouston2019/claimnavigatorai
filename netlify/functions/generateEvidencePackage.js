const { createClient } = require('@supabase/supabase-js');
const JSZip = require('jszip');

exports.handler = async (event, context) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authorization header
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify user token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Invalid token' })
      };
    }

    // Parse request body
    const { evidenceItems } = JSON.parse(event.body || '{}');
    if (!evidenceItems || evidenceItems.length === 0) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'No evidence items provided' })
      };
    }

    // Create ZIP archive
    const zip = new JSZip();
    
    // Create category folders
    const categories = {
      'Structure': '01-Structure-Damage',
      'Contents': '02-Contents-Personal-Property', 
      'ALE': '03-Additional-Living-Expenses',
      'Medical': '04-Medical-Injury'
    };

    // Add files to appropriate category folders
    for (const item of evidenceItems) {
      try {
        // Download file from storage
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('evidence-uploads')
          .download(item.file_path);

        if (downloadError) {
          console.error('Download error for item:', item.id, downloadError);
          continue;
        }

        // Convert blob to buffer
        const arrayBuffer = await fileData.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Determine folder based on category
        const folderName = categories[item.category] || '05-Other';
        const fileName = item.filename || `evidence-${item.id}`;
        
        // Add file to ZIP
        zip.file(`${folderName}/${fileName}`, buffer);

        // Add metadata file for this item
        const metadata = {
          filename: item.filename,
          category: item.category,
          ai_summary: item.ai_summary,
          created_at: item.created_at
        };
        
        zip.file(`${folderName}/${fileName}.metadata.json`, JSON.stringify(metadata, null, 2));

      } catch (fileError) {
        console.error('Error processing file:', item.id, fileError);
        continue;
      }
    }

    // Add summary document
    const summaryContent = generateSummaryDocument(evidenceItems);
    zip.file('00-Evidence-Summary.txt', summaryContent);

    // Generate ZIP file
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="evidence-package.zip"',
        'Content-Length': zipBuffer.length
      },
      body: zipBuffer.toString('base64'),
      isBase64Encoded: true
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

// Generate summary document
function generateSummaryDocument(evidenceItems) {
  const categories = {
    'Structure': 'Structure Damage',
    'Contents': 'Contents/Personal Property',
    'ALE': 'Additional Living Expenses',
    'Medical': 'Medical/Injury'
  };

  let summary = 'EVIDENCE PACKAGE SUMMARY\n';
  summary += '========================\n\n';
  summary += `Generated: ${new Date().toISOString()}\n`;
  summary += `Total Files: ${evidenceItems.length}\n\n`;

  // Group by category
  const groupedItems = evidenceItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  // Add category summaries
  Object.entries(groupedItems).forEach(([category, items]) => {
    summary += `${categories[category] || category} (${items.length} files)\n`;
    summary += '-'.repeat(50) + '\n';
    
    items.forEach(item => {
      summary += `• ${item.filename || 'Unknown file'}\n`;
      if (item.ai_summary) {
        summary += `  Summary: ${item.ai_summary}\n`;
      }
      summary += `  Uploaded: ${new Date(item.created_at).toLocaleDateString()}\n\n`;
    });
  });

  summary += '\nThis package contains all your uploaded evidence files organized by category.\n';
  summary += 'Each file includes metadata with AI analysis and categorization.\n';

  return summary;
}
