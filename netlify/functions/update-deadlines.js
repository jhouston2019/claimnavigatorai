const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

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
    const requestData = JSON.parse(event.body || '{}');
    const { claim_id, document_text, event, date, priority, source } = requestData;

    if (!claim_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'claim_id is required' })
      };
    }

    let extracted = [];
    let addedCount = 0;
    let updatedCount = 0;

    // If document_text is provided, use AI to extract deadlines
    if (document_text) {
      const prompt = `Extract any deadlines, due dates, response dates, or important time-sensitive events mentioned in this insurance claim document.

Document text:
${document_text}

Return a JSON array of objects with this structure:
[
  {
    "event": "Description of the deadline (e.g. 'Proof of Loss Due', 'Appraisal Deadline', 'Response Required')",
    "date": "YYYY-MM-DD format",
    "priority": "High, Medium, or Low"
  }
]

Only extract actual deadlines with specific dates. If no clear deadlines are found, return an empty array [].`;

      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an expert at extracting deadlines and important dates from insurance claim documents. Return structured JSON data only.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1000,
          response_format: { type: 'json_object' }
        });

        const responseText = completion.choices[0]?.message?.content || '{}';
        const parsed = JSON.parse(responseText);
        
        // Handle both array and object with array property
        if (Array.isArray(parsed)) {
          extracted = parsed;
        } else if (parsed.deadlines && Array.isArray(parsed.deadlines)) {
          extracted = parsed.deadlines;
        } else if (parsed.deadline && Array.isArray(parsed.deadline)) {
          extracted = parsed.deadline;
        }

        // Upsert each extracted deadline
        for (const item of extracted) {
          if (!item.event || !item.date) continue;

          const deadlineData = {
            claim_id: claim_id,
            event: item.event,
            date: item.date,
            source: source || 'AI Parser',
            priority: item.priority || 'High',
            notified: false
          };

          // Check if deadline already exists (same event and date)
          const { data: existing } = await supabase
            .from('claim_dates')
            .select('id')
            .eq('claim_id', claim_id)
            .eq('event', item.event)
            .eq('date', item.date)
            .limit(1)
            .single();

          if (existing) {
            // Update existing
            const { error: updateError } = await supabase
              .from('claim_dates')
              .update(deadlineData)
              .eq('id', existing.id);

            if (!updateError) {
              updatedCount++;
            }
          } else {
            // Insert new
            const { error: insertError } = await supabase
              .from('claim_dates')
              .insert(deadlineData);

            if (!insertError) {
              addedCount++;
            }
          }
        }
      } catch (aiError) {
        console.error('AI extraction error:', aiError);
        // Continue with manual entry if provided
      }
    }

    // If manual entry fields are provided, add/update that deadline
    if (event && date) {
      const deadlineData = {
        claim_id: claim_id,
        event: event,
        date: date,
        source: source || 'Manual Entry',
        priority: priority || 'Medium',
        notified: false
      };

      // Check if deadline already exists
      const { data: existing } = await supabase
        .from('claim_dates')
        .select('id')
        .eq('claim_id', claim_id)
        .eq('event', event)
        .eq('date', date)
        .limit(1)
        .single();

      if (existing) {
        const { error: updateError } = await supabase
          .from('claim_dates')
          .update(deadlineData)
          .eq('id', existing.id);

        if (!updateError) {
          updatedCount++;
        }
      } else {
        const { error: insertError } = await supabase
          .from('claim_dates')
          .insert(deadlineData);

        if (!insertError) {
          addedCount++;
        }
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'success',
        added: addedCount,
        updated: updatedCount,
        extracted: extracted.length,
        total_processed: addedCount + updatedCount
      })
    };

  } catch (error) {
    console.error('Error updating deadlines:', error);
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


