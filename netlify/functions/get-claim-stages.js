const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Get authorization header for user authentication
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ 
          status: 'error',
          error: 'Authorization header required' 
        })
      };
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ 
          status: 'error',
          error: 'Invalid or expired token' 
        })
      };
    }

    const claim_id = event.queryStringParameters?.claim_id;

    if (!claim_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          status: 'error',
          error: 'claim_id query parameter is required' 
        })
      };
    }

    // Verify user owns this claim
    const { data: claim, error: claimError } = await supabase
      .from('claims')
      .select('id, user_id')
      .eq('id', claim_id)
      .eq('user_id', user.id)
      .single();

    if (claimError || !claim) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ 
          status: 'error',
          error: 'Claim not found or access denied' 
        })
      };
    }

    // Get claim stages
    const { data, error } = await supabase
      .from('claim_stages')
      .select('*')
      .eq('claim_id', claim_id)
      .order('order_index', { ascending: true });

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    // Stage guidance and resources mapping
    const stageGuidance = {
      'Notice of Loss': {
        next_steps: [
          'Document the date and time of loss',
          'Contact your insurance company immediately',
          'Take photos/videos of all damage',
          'File your claim within policy timeframes',
          'Keep all receipts and documentation'
        ],
        resources: [
          { name: 'Document Generator', url: '/app/resource-center/document-generator.html', type: 'tool' },
          { name: 'Claim Journal', url: '/app/claim-journal.html', type: 'tool' },
          { name: 'Deadlines Tracker', url: '/app/deadlines.html', type: 'tool' }
        ],
        typical_duration: '1-3 days',
        tips: 'File as soon as possible. Most policies require immediate notification of loss.'
      },
      'Inspection Scheduled': {
        next_steps: [
          'Prepare a detailed list of all damages',
          'Gather all receipts and documentation',
          'Be present during inspection if possible',
          'Take your own photos before inspector arrives',
          'Document any conversations with inspector'
        ],
        resources: [
          { name: 'Evidence Organizer', url: '/app/evidence-organizer.html', type: 'tool' },
          { name: 'Claim Journal', url: '/app/claim-journal.html', type: 'tool' }
        ],
        typical_duration: '7-14 days from notice',
        tips: 'Inspections typically occur within 2 weeks of filing. Be prepared with documentation.'
      },
      'Estimate Received': {
        next_steps: [
          'Review estimate carefully for accuracy',
          'Compare with your own estimates',
          'Check for missing items or damage',
          'Consider getting independent estimates',
          'Document any discrepancies'
        ],
        resources: [
          { name: 'ROM Estimator', url: '/app/rom-tool.html', type: 'tool' },
          { name: 'AI Response Agent', url: '/app/resource-center/ai-response-agent.html', type: 'tool' },
          { name: 'Negotiation Tools', url: '/app/negotiation-tools.html', type: 'tool' }
        ],
        typical_duration: '14-30 days from inspection',
        tips: 'Insurance estimates are often low. Get independent estimates to compare.'
      },
      'Negotiation': {
        next_steps: [
          'Prepare a detailed counter-offer',
          'Gather supporting documentation',
          'Use professional estimates as leverage',
          'Document all communications',
          'Consider professional representation if needed'
        ],
        resources: [
          { name: 'Negotiation Tools', url: '/app/negotiation-tools.html', type: 'tool' },
          { name: 'AI Response Agent', url: '/app/resource-center/ai-response-agent.html', type: 'tool' },
          { name: 'Statement of Loss', url: '/app/statement-of-loss.html', type: 'tool' }
        ],
        typical_duration: '30-90 days',
        tips: 'Negotiation can take time. Be persistent and document everything.'
      },
      'Payment': {
        next_steps: [
          'Verify payment amount matches agreement',
          'Check for any deductions or holdbacks',
          'Review payment terms and conditions',
          'Confirm receipt with insurance company',
          'Update your financial records'
        ],
        resources: [
          { name: 'Statement of Loss', url: '/app/statement-of-loss.html', type: 'tool' },
          { name: 'Claim Journal', url: '/app/claim-journal.html', type: 'tool' }
        ],
        typical_duration: '7-14 days from agreement',
        tips: 'Payments may be split into multiple installments. Track all payments carefully.'
      },
      'Closed': {
        next_steps: [
          'Verify all work is completed',
          'Ensure all payments received',
          'File final documentation',
          'Review entire claim process for lessons',
          'Keep all records for tax purposes'
        ],
        resources: [
          { name: 'Claim Journal', url: '/app/claim-journal.html', type: 'tool' },
          { name: 'Document Library', url: '/app/document-library/', type: 'tool' }
        ],
        typical_duration: 'Final stage',
        tips: 'Keep all documentation for at least 7 years for tax and legal purposes.'
      }
    };

    // If no stages exist, create default stages for this claim
    if (!data || data.length === 0) {
      const defaultStages = [
        { stage_name: 'Notice of Loss', description: 'Initial claim notification submitted', order_index: 1, status: 'pending' },
        { stage_name: 'Inspection Scheduled', description: 'Property inspection has been scheduled', order_index: 2, status: 'pending' },
        { stage_name: 'Estimate Received', description: 'Insurance adjuster estimate received', order_index: 3, status: 'pending' },
        { stage_name: 'Negotiation', description: 'Negotiating settlement amount', order_index: 4, status: 'pending' },
        { stage_name: 'Payment', description: 'Settlement payment processed', order_index: 5, status: 'pending' },
        { stage_name: 'Closed', description: 'Claim finalized and closed', order_index: 6, status: 'pending' }
      ];

      const stagesToInsert = defaultStages.map(stage => ({
        claim_id,
        ...stage
      }));

      const { data: insertedData, error: insertError } = await supabase
        .from('claim_stages')
        .insert(stagesToInsert)
        .select();

      if (insertError) {
        console.warn('Could not insert default stages:', insertError);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ stages: [] })
        };
      }

      // Enrich with guidance
      const enrichedStages = (insertedData || []).map(stage => ({
        ...stage,
        guidance: stageGuidance[stage.stage_name] || null
      }));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ stages: enrichedStages })
      };
    }

    // Create a new client with the user's token for RLS
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    const userSupabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    // Enrich existing stages with guidance
    const enrichedStages = (data || []).map(stage => ({
      ...stage,
      guidance: stageGuidance[stage.stage_name] || null
    }));

    // Get related deadlines and journal entries for context
    let relatedDeadlines = [];
    let relatedJournalEntries = [];

    try {
      // Get deadlines for this claim
      const { data: deadlinesData } = await userSupabase
        .from('claim_dates')
        .select('*')
        .eq('claim_id', claim_id)
        .order('date_value', { ascending: true })
        .limit(10);
      
      relatedDeadlines = deadlinesData || [];
    } catch (e) {
      console.warn('Could not fetch deadlines:', e);
    }

    try {
      // Get recent journal entries
      const { data: journalData } = await userSupabase
        .from('claim_journal')
        .select('*')
        .eq('claim_id', claim_id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      relatedJournalEntries = journalData || [];
    } catch (e) {
      console.warn('Could not fetch journal entries:', e);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        stages: enrichedStages,
        related_deadlines: relatedDeadlines,
        related_journal_entries: relatedJournalEntries
      })
    };

  } catch (error) {
    console.error('Error getting claim stages:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        status: 'error',
        error: error.message
      })
    };
  }
};

