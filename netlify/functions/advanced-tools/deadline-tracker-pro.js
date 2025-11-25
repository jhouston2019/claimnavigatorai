/**
 * Deadline Tracker Pro
 * Track and analyze deadlines for insurance claims
 */

const { runToolAI, runToolAIJSON } = require('../lib/advanced-tools-ai-helper');
const { createClient } = require('@supabase/supabase-js');
const pdfParse = require('pdf-parse');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
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
    const { carrier, state, events, policyUrl } = body;

    if (!carrier || !state) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    const supabase = process.env.SUPABASE_URL ? createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    ) : null;

    // Get statutory deadlines from database
    let statutoryDeadlines = [];
    if (supabase) {
      const { data: deadlines, error } = await supabase
        .from('state_deadlines')
        .select('*')
        .eq('state', state);

      if (!error && deadlines) {
        statutoryDeadlines = deadlines.map(d => ({
          title: d.deadline_type || 'Statutory Deadline',
          description: d.description || '',
          dueDate: d.days_from_event ? calculateDueDate(events, d.days_from_event) : 'N/A'
        }));
      }
    }

    // Extract policy deadlines if policy URL provided
    let policyDeadlines = [];
    if (policyUrl && process.env.OPENAI_API_KEY) {
      // Note: In production, fetch and parse the policy PDF
      // For now, use AI to generate policy-based deadlines
      try {
        const userPrompt = `Based on a ${state} insurance policy for ${carrier}, identify key policy deadlines and timeframes that policyholders should be aware of. Return as a JSON array of deadline objects with title, description, and typical timeframe.`;

        const aiResponseObj = await runToolAIJSON('deadline-tracker-pro', userPrompt, {}, 'deadline-rules');
        try {
          // Handle both object and string responses
          if (Array.isArray(aiResponseObj)) {
            policyDeadlines = aiResponseObj;
          } else if (typeof aiResponseObj === 'object' && aiResponseObj !== null) {
            policyDeadlines = [aiResponseObj];
          } else {
            policyDeadlines = JSON.parse(String(aiResponseObj));
          }
        } catch (e) {
          // If not JSON, create a simple deadline entry
          const aiResponseStr = typeof aiResponseObj === 'string' ? aiResponseObj : JSON.stringify(aiResponseObj);
          policyDeadlines = [{
            title: 'Policy Review Required',
            description: aiResponseStr.substring(0, 200),
            dueDate: 'Review policy document'
          }];
        }
      } catch (aiError) {
        console.error('AI policy analysis error:', aiError);
      }
    }

    // Analyze carrier patterns using AI
    let carrierPatterns = '';
    if (process.env.OPENAI_API_KEY) {
      try {
        const userPrompt = `For ${carrier} in ${state}, based on the following events:
${JSON.stringify(events || [], null, 2)}

Provide insights on:
1. Typical response timeframes for this carrier
2. Common deadline patterns
3. What to expect in terms of communication timing
4. Any red flags to watch for

Keep response concise (2-3 paragraphs).`;

        carrierPatterns = await runToolAI('deadline-tracker-pro', userPrompt, {}, 'deadline-rules');
      } catch (aiError) {
        console.error('AI carrier analysis error:', aiError);
      }
    }

    // Identify red flags
    const redFlags = [];
    if (events && events.length > 0) {
      const recentEvents = events.filter(e => {
        const eventDate = new Date(e.date);
        const daysAgo = (Date.now() - eventDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysAgo <= 30;
      });

      if (recentEvents.length === 0 && events.length > 0) {
        redFlags.push({
          title: 'No Recent Events',
          description: 'No events logged in the past 30 days. Ensure you are tracking all communications and deadlines.'
        });
      }
    }

    // Store analysis if user is authenticated
    if (supabase && body.userId) {
      try {
        await supabase.from('deadline_tracker_pro').insert({
          user_id: body.userId,
          carrier: carrier,
          state: state,
          events: events || [],
          analysis: {
            statutoryDeadlines,
            policyDeadlines,
            carrierPatterns,
            redFlags
          }
        });
      } catch (dbError) {
        console.error('Database storage error:', dbError);
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        statutoryDeadlines,
        policyDeadlines,
        carrierPatterns,
        redFlags
      })
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

function calculateDueDate(events, daysFromEvent) {
  if (!events || events.length === 0) {
    return 'N/A';
  }

  // Use the most recent event
  const sortedEvents = events.sort((a, b) => new Date(b.date) - new Date(a.date));
  const mostRecentEvent = new Date(sortedEvents[0].date);
  const dueDate = new Date(mostRecentEvent);
  dueDate.setDate(dueDate.getDate() + daysFromEvent);

  return dueDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

