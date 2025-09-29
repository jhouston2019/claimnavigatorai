import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface EscalationData {
  type: string;
  data: any;
  timestamp: string;
}

export const handler: Handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { type, data, timestamp }: EscalationData = JSON.parse(event.body || '{}');

    if (!type || !data) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Prepare data for insertion
    const escalationRecord = {
      type,
      content: JSON.stringify(data),
      created_at: timestamp || new Date().toISOString(),
      status: 'active',
      user_id: null, // Will be set by RLS if user is authenticated
      metadata: {
        generated_at: new Date().toISOString(),
        version: '1.0'
      }
    };

    // Insert into escalations table
    const { data: insertedData, error } = await supabase
      .from('escalations')
      .insert([escalationRecord])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Failed to save escalation record',
          details: error.message
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: insertedData,
        message: 'Escalation record saved successfully'
      })
    };

  } catch (error) {
    console.error('Error saving escalation:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Failed to save escalation record',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};
