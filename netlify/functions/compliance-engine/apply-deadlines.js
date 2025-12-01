/**
 * Compliance Engine - Apply Deadlines Endpoint
 * Apply statutory and carrier deadlines to timeline
 */

const { runToolAIJSON, loadRuleset } = require('../../lib/advanced-tools-ai-helper');
const { createClient } = require('@supabase/supabase-js');

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
    const body = JSON.parse(event.body || '{}');
    const { state, carrier, claimType, events = [] } = body;

    if (!state || !carrier || !claimType) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields: state, carrier, claimType' })
      };
    }

    // Load deadline ruleset
    const deadlineRules = await loadRuleset('deadline-rules');
    
    // Build prompt for deadline extraction
    let prompt = `Extract and return all statutory deadlines, carrier-specific deadlines, and policy-based deadlines for:\n`;
    prompt += `State: ${state}\n`;
    prompt += `Carrier: ${carrier}\n`;
    prompt += `Claim Type: ${claimType}\n\n`;
    
    if (events.length > 0) {
      prompt += `Events Timeline:\n${JSON.stringify(events, null, 2)}\n\n`;
    }
    
    prompt += `Return a JSON array of deadlines with: label, date (calculated from events), type (statutory/carrier/policy), priority (high/medium/low)\n`;
    prompt += `Include: acknowledgment deadlines, response deadlines, payment deadlines, inspection deadlines, mediation deadlines, appraisal windows\n`;

    // Call AI to extract deadlines
    const aiResult = await runToolAIJSON(
      'compliance-engine',
      prompt,
      {
        model: 'gpt-4o-mini',
        temperature: 0.3,
        max_tokens: 2000
      },
      'deadline-rules'
    );

    // Parse deadlines from AI response
    let deadlines = [];
    if (Array.isArray(aiResult)) {
      deadlines = aiResult;
    } else if (aiResult.deadlines && Array.isArray(aiResult.deadlines)) {
      deadlines = aiResult.deadlines;
    } else if (aiResult.deadlineAnalysis) {
      // Try to parse from text
      const text = aiResult.deadlineAnalysis;
      // Extract deadline patterns (simplified parsing)
      const deadlinePatterns = text.match(/(\d+)\s*(day|days|hour|hours)\s*(?:for|to|until)\s*([^\.]+)/gi);
      if (deadlinePatterns) {
        deadlines = deadlinePatterns.map((pattern, idx) => ({
          label: pattern,
          date: new Date(Date.now() + (idx + 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          type: 'statutory',
          priority: 'medium'
        }));
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ deadlines })
    };

  } catch (error) {
    console.error('Apply deadlines error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to apply deadlines',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    };
  }
};


