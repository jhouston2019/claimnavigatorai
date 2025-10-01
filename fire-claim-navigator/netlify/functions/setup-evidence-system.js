const { createClient } = require('@supabase/supabase-js');

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
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const results = [];

    // 1. Create evidence-uploads bucket
    try {
      const { data: bucketData, error: bucketError } = await supabase.storage
        .createBucket('evidence-uploads', {
          public: false,
          fileSizeLimit: 50 * 1024 * 1024, // 50MB limit
          allowedMimeTypes: [
            'image/jpeg',
            'image/png', 
            'image/gif',
            'image/webp',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain'
          ]
        });

      if (bucketError && !bucketError.message.includes('already exists')) {
        throw bucketError;
      }

      results.push({
        step: 'Create evidence-uploads bucket',
        status: bucketError && bucketError.message.includes('already exists') ? 'already exists' : 'created',
        error: bucketError ? bucketError.message : null
      });
    } catch (error) {
      results.push({
        step: 'Create evidence-uploads bucket',
        status: 'error',
        error: error.message
      });
    }

    // 2. Create evidence_items table
    try {
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS evidence_items (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          file_path TEXT NOT NULL,
          filename TEXT,
          category TEXT NOT NULL CHECK (category IN ('Structure', 'Contents', 'ALE', 'Medical')),
          ai_summary TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `;

      const { error: tableError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
      
      if (tableError && !tableError.message.includes('already exists')) {
        throw tableError;
      }

      results.push({
        step: 'Create evidence_items table',
        status: tableError && tableError.message.includes('already exists') ? 'already exists' : 'created',
        error: tableError ? tableError.message : null
      });
    } catch (error) {
      results.push({
        step: 'Create evidence_items table',
        status: 'error',
        error: error.message
      });
    }

    // 3. Create indexes
    try {
      const indexes = [
        'CREATE INDEX IF NOT EXISTS idx_evidence_items_user_id ON evidence_items(user_id);',
        'CREATE INDEX IF NOT EXISTS idx_evidence_items_category ON evidence_items(category);',
        'CREATE INDEX IF NOT EXISTS idx_evidence_items_created_at ON evidence_items(created_at);'
      ];

      for (const indexSQL of indexes) {
        const { error: indexError } = await supabase.rpc('exec_sql', { sql: indexSQL });
        if (indexError) {
          console.error('Index creation error:', indexError);
        }
      }

      results.push({
        step: 'Create indexes',
        status: 'completed',
        error: null
      });
    } catch (error) {
      results.push({
        step: 'Create indexes',
        status: 'error',
        error: error.message
      });
    }

    // 4. Enable RLS and create policies
    try {
      const policies = [
        'ALTER TABLE evidence_items ENABLE ROW LEVEL SECURITY;',
        `CREATE POLICY "Users can view their own evidence items" ON evidence_items
          FOR SELECT USING (auth.uid() = user_id);`,
        `CREATE POLICY "Users can insert their own evidence items" ON evidence_items
          FOR INSERT WITH CHECK (auth.uid() = user_id);`,
        `CREATE POLICY "Users can update their own evidence items" ON evidence_items
          FOR UPDATE USING (auth.uid() = user_id);`,
        `CREATE POLICY "Users can delete their own evidence items" ON evidence_items
          FOR DELETE USING (auth.uid() = user_id);`
      ];

      for (const policySQL of policies) {
        const { error: policyError } = await supabase.rpc('exec_sql', { sql: policySQL });
        if (policyError && !policyError.message.includes('already exists')) {
          console.error('Policy creation error:', policyError);
        }
      }

      results.push({
        step: 'Enable RLS and create policies',
        status: 'completed',
        error: null
      });
    } catch (error) {
      results.push({
        step: 'Enable RLS and create policies',
        status: 'error',
        error: error.message
      });
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        results,
        message: 'Evidence system setup completed'
      })
    };

  } catch (error) {
    console.error('Setup error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      })
    };
  }
};
