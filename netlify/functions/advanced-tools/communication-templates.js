/**
 * Communication Templates Module
 * Load and manage communication templates
 */

const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Handle GET request for individual template
  if (event.httpMethod === 'GET') {
    try {
      const templateId = event.queryStringParameters?.id;
      
      if (!templateId || !process.env.SUPABASE_URL) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing template ID or database not configured' })
        };
      }

      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      const { data: template, error } = await supabase
        .from('communication_templates_index')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error || !template) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Template not found' })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(template)
      };
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: error.message })
      };
    }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { category } = body;

    if (!process.env.SUPABASE_URL) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Database not configured' })
      };
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Build query
    let query = supabase.from('communication_templates_index').select('*');

    if (category) {
      query = query.eq('category', category);
    }

    const { data: templates, error } = await query.order('template_name');

    if (error) {
      throw error;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ templates: templates || [] })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};


