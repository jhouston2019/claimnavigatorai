/**
 * Compliance Engine - Analyze Endpoint
 * Comprehensive compliance and bad faith risk analysis
 */

const { runToolAIJSON, loadRuleset } = require('../../lib/advanced-tools-ai-helper');
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
      events = [],
      letterFiles = [],
      policyFiles = []
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

    // Aggregate existing data from Supabase
    const supabase = getSupabaseClient();
    let aggregatedData = {
      badFaithEvents: [],
      deadlineEvents: [],
      carrierProfile: null
    };

    if (supabase && userId) {
      try {
        // Get bad faith events
        const { data: badFaithData } = await supabase
          .from('badfaith_events')
          .select('*')
          .eq('user_id', userId)
          .order('date', { ascending: false })
          .limit(20);
        
        if (badFaithData) {
          aggregatedData.badFaithEvents = badFaithData;
        }

        // Get deadline tracker data
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
    const badFaithRules = await loadRuleset('bad-faith-rules');
    if (badFaithRules) rulesets.badFaith = badFaithRules;
    
    const complianceRules = await loadRuleset('compliance-rules');
    if (complianceRules) rulesets.compliance = complianceRules;
    
    const deadlineRules = await loadRuleset('deadline-rules');
    if (deadlineRules) rulesets.deadline = deadlineRules;
    
    const fraudRules = await loadRuleset('fraud-patterns');
    if (fraudRules) rulesets.fraud = fraudRules;

    // Build comprehensive user prompt
    let userPrompt = `Analyze the following claim for compliance concerns, statutory deadlines, carrier behavior patterns, required documents, potential violations, and recommended actions.\n\n`;
    
    userPrompt += `Claim Context:\n`;
    userPrompt += `- State: ${state}\n`;
    userPrompt += `- Carrier: ${carrier}\n`;
    userPrompt += `- Claim Type: ${claimType}\n`;
    userPrompt += `\n`;

    if (events.length > 0) {
      userPrompt += `Events Timeline:\n${JSON.stringify(events, null, 2)}\n\n`;
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

    if (letterFiles.length > 0) {
      userPrompt += `Insurer Letters Uploaded: ${letterFiles.length} file(s)\n`;
    }

    if (policyFiles.length > 0) {
      userPrompt += `Policy Documents Uploaded: ${policyFiles.length} file(s)\n`;
    }

    userPrompt += `\nPlease provide a comprehensive analysis covering:\n`;
    userPrompt += `1. Statutory Deadlines: acknowledgment deadlines, response deadlines, payment deadlines, inspection deadlines, mediation rights, appraisal rights, complaint timelines\n`;
    userPrompt += `2. Carrier Overlay Rules: known carrier delays, behavior patterns, communication intervals\n`;
    userPrompt += `3. Required Documents: statutory requirements, policy-specific requirements\n`;
    userPrompt += `4. Violations Likelihood: possible violations, severity scoring, red flags\n`;
    userPrompt += `5. Recommended Actions: steps to take, escalation paths, notes to add to journal\n\n`;

    if (Object.keys(rulesets).length > 0) {
      userPrompt += `Relevant Rulesets:\n${JSON.stringify(rulesets, null, 2)}\n\n`;
    }

    userPrompt += `Be conservative in your assessments and always recommend professional review for serious concerns.`;

    // Call AI helper
    const aiResult = await runToolAIJSON(
      'compliance-engine',
      userPrompt,
      {
        model: 'gpt-4o',
        temperature: 0.7,
        max_tokens: 4000
      },
      'compliance-rules' // Primary ruleset
    );

    // Parse and structure the response
    // The AI should return structured data, but we'll also parse text responses
    let responseBody = {
      statutoryDeadlines: '',
      carrierOverlayRules: '',
      requiredDocuments: '',
      violationsLikelihood: {
        possibleViolations: '',
        severityScoring: '',
        redFlags: ''
      },
      recommendedActions: {
        steps: '',
        escalationPaths: '',
        journalNotes: ''
      }
    };

    // If AI returns structured data, use it
    if (aiResult.statutoryDeadlines) {
      responseBody.statutoryDeadlines = aiResult.statutoryDeadlines;
    } else if (aiResult.overallSummary) {
      // Fallback: parse from overall summary or other fields
      responseBody.statutoryDeadlines = aiResult.deadlineAnalysis || aiResult.overallSummary || '';
    }

    if (aiResult.carrierOverlayRules || aiResult.carrierBehaviorPatterns) {
      responseBody.carrierOverlayRules = aiResult.carrierOverlayRules || aiResult.carrierBehaviorPatterns || '';
    }

    if (aiResult.requiredDocuments || aiResult.documentationGaps) {
      responseBody.requiredDocuments = aiResult.requiredDocuments || aiResult.documentationGaps || '';
    }

    if (aiResult.violationsLikelihood) {
      responseBody.violationsLikelihood = aiResult.violationsLikelihood;
    } else if (aiResult.complianceFindings || aiResult.badFaithConcernSummary) {
      responseBody.violationsLikelihood.possibleViolations = aiResult.complianceFindings || aiResult.badFaithConcernSummary || '';
    }

    if (aiResult.recommendedActions) {
      if (typeof aiResult.recommendedActions === 'object') {
        responseBody.recommendedActions = aiResult.recommendedActions;
      } else {
        responseBody.recommendedActions.steps = aiResult.recommendedActions;
      }
    } else if (aiResult.recommendedActions) {
      responseBody.recommendedActions.steps = aiResult.recommendedActions;
    }

    // Optional: Log to Supabase audit table
    if (supabase) {
      try {
        await supabase
          .from('compliance_engine_audits')
          .insert({
            user_id: userId,
            state: state,
            carrier: carrier,
            claim_type: claimType,
            input_summary: events.length > 0 ? JSON.stringify(events).substring(0, 500) : null,
            result_summary: responseBody.statutoryDeadlines ? responseBody.statutoryDeadlines.substring(0, 500) : null
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
    console.error('Compliance engine analyze error:', error);
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


