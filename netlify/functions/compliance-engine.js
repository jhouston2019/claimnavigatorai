/**
 * Compliance Engine
 * Comprehensive compliance and bad faith risk analysis
 */

const { runToolAIJSON, loadRuleset } = require('./lib/advanced-tools-ai-helper');
const { createClient } = require('@supabase/supabase-js');

// Get Supabase client
function getSupabaseClient() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const {
      state,
      carrier,
      claimType,
      claimReference,
      timelineSummaryText,
      includeBadFaith,
      includeDeadlines,
      includeDocsCheck,
      generateEscalation
    } = body;

    // Validate required fields
    if (!state || !carrier || !claimType) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields: state, carrier, claimType' })
      };
    }

    // Optional: Get user ID from auth (if available)
    const authHeader = event.headers.authorization || event.headers.Authorization;
    let userId = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const token = authHeader.split(' ')[1];
          const { data: { user } } = await supabase.auth.getUser(token);
          if (user) userId = user.id;
        } catch (err) {
          console.warn('Auth check failed, continuing without user ID:', err.message);
        }
      }
    }

    // Optional: Aggregate existing data from Supabase
    const supabase = getSupabaseClient();
    let aggregatedData = {
      badFaithEvents: [],
      deadlineEvents: [],
      complianceFlags: [],
      carrierProfile: null
    };

    if (supabase && userId) {
      try {
        // Get bad faith events if includeBadFaith is true
        if (includeBadFaith) {
          const { data: badFaithData } = await supabase
            .from('badfaith_events')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false })
            .limit(20);
          
          if (badFaithData) {
            aggregatedData.badFaithEvents = badFaithData;
          }
        }

        // Get deadline tracker data if includeDeadlines is true
        if (includeDeadlines) {
          const { data: deadlineData } = await supabase
            .from('deadline_tracker_pro')
            .select('*')
            .eq('user_id', userId)
            .eq('state', state)
            .order('created_at', { ascending: false })
            .limit(5);
          
          if (deadlineData) {
            aggregatedData.deadlineEvents = deadlineData;
          }
        }

        // Get carrier profile
        const { data: carrierData } = await supabase
          .from('carrier_profiles')
          .select('*')
          .eq('carrier_name', carrier)
          .eq('state', state)
          .single();
        
        if (carrierData) {
          aggregatedData.carrierProfile = carrierData;
        }
      } catch (err) {
        console.warn('Error aggregating data from Supabase:', err.message);
        // Continue without aggregated data
      }
    }

    // Load relevant rulesets
    const rulesets = {};
    if (includeBadFaith) {
      const badFaithRules = await loadRuleset('bad-faith-rules');
      if (badFaithRules) rulesets.badFaith = badFaithRules;
    }
    
    const complianceRules = await loadRuleset('compliance-rules');
    if (complianceRules) rulesets.compliance = complianceRules;
    
    if (includeDeadlines) {
      const deadlineRules = await loadRuleset('deadline-rules');
      if (deadlineRules) rulesets.deadline = deadlineRules;
    }
    
    const fraudRules = await loadRuleset('fraud-patterns');
    if (fraudRules) rulesets.fraud = fraudRules;

    // Build comprehensive user prompt
    let userPrompt = `Analyze the following claim for compliance concerns, potential bad faith patterns, and recommended next steps.\n\n`;
    
    userPrompt += `Claim Context:\n`;
    userPrompt += `- State: ${state}\n`;
    userPrompt += `- Carrier: ${carrier}\n`;
    userPrompt += `- Claim Type: ${claimType}\n`;
    if (claimReference) {
      userPrompt += `- Claim Reference: ${claimReference}\n`;
    }
    userPrompt += `\n`;

    if (timelineSummaryText) {
      userPrompt += `Timeline Summary:\n${timelineSummaryText}\n\n`;
    }

    if (aggregatedData.badFaithEvents.length > 0) {
      userPrompt += `Previous Bad Faith Events:\n${JSON.stringify(aggregatedData.badFaithEvents, null, 2)}\n\n`;
    }

    if (aggregatedData.deadlineEvents.length > 0) {
      userPrompt += `Deadline Events:\n${JSON.stringify(aggregatedData.deadlineEvents, null, 2)}\n\n`;
    }

    if (aggregatedData.carrierProfile) {
      userPrompt += `Carrier Profile:\n${JSON.stringify(aggregatedData.carrierProfile, null, 2)}\n\n`;
    }

    userPrompt += `Analysis Requirements:\n`;
    userPrompt += `- Include Bad Faith Analysis: ${includeBadFaith ? 'Yes' : 'No'}\n`;
    userPrompt += `- Include Deadline Analysis: ${includeDeadlines ? 'Yes' : 'No'}\n`;
    userPrompt += `- Include Documentation Gap Check: ${includeDocsCheck ? 'Yes' : 'No'}\n`;
    userPrompt += `- Generate Escalation Recommendations: ${generateEscalation ? 'Yes' : 'No'}\n\n`;

    if (Object.keys(rulesets).length > 0) {
      userPrompt += `Relevant Rulesets:\n${JSON.stringify(rulesets, null, 2)}\n\n`;
    }

    userPrompt += `Please provide a comprehensive analysis covering all requested areas. Be conservative in your assessments and always recommend professional review for serious concerns.`;

    // Call AI helper with compliance-engine tool slug
    // Use the most relevant ruleset (compliance-rules) as primary
    const aiResult = await runToolAIJSON(
      'compliance-engine',
      userPrompt,
      {
        model: 'gpt-4o',
        temperature: 0.7,
        max_tokens: 3000
      },
      'compliance-rules' // Primary ruleset
    );

    // Validate and build response
    const responseBody = {
      overallSummary: aiResult.overallSummary || '',
      timelineFindings: aiResult.timelineFindings || '',
      deadlineAnalysis: aiResult.deadlineAnalysis || '',
      badFaithConcernSummary: aiResult.badFaithConcernSummary || '',
      complianceFindings: aiResult.complianceFindings || '',
      carrierBehaviorPatterns: aiResult.carrierBehaviorPatterns || '',
      documentationGaps: aiResult.documentationGaps || '',
      recommendedActions: aiResult.recommendedActions || ''
    };

    // Optional: Log to Supabase audit table
    if (supabase) {
      try {
        await supabase
          .from('compliance_engine_audits')
          .insert({
            user_id: userId,
            claim_reference: claimReference || null,
            state: state,
            carrier: carrier,
            claim_type: claimType,
            input_summary: timelineSummaryText ? timelineSummaryText.substring(0, 500) : null,
            result_summary: responseBody.overallSummary ? responseBody.overallSummary.substring(0, 500) : null
          });
      } catch (err) {
        console.warn('Failed to log audit:', err.message);
        // Continue without logging
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(responseBody)
    };

  } catch (error) {
    console.error('Compliance engine error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Compliance analysis failed. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    };
  }
};


