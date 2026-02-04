/**
 * WORKFLOW TOOL AI ENDPOINT
 * Handles AI requests for all workflow tools
 * January 2026
 */

const OpenAI = require('openai');

exports.handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse request body
    const { toolId, userMessage, systemPrompt, claimContext } = JSON.parse(event.body || '{}');

    // Validate inputs
    if (!toolId || !userMessage || !systemPrompt) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // Build enhanced system prompt with claim context
    let enhancedSystemPrompt = systemPrompt;
    
    if (claimContext) {
      enhancedSystemPrompt += `\n\nCLAIM CONTEXT:\n`;
      enhancedSystemPrompt += `- Claim Number: ${claimContext.claimNumber}\n`;
      enhancedSystemPrompt += `- Loss Date: ${claimContext.lossDate}\n`;
      enhancedSystemPrompt += `- Loss Type: ${claimContext.lossType}\n`;
      enhancedSystemPrompt += `- Carrier: ${claimContext.carrier}\n`;
      enhancedSystemPrompt += `- Policy Number: ${claimContext.policyNumber}\n`;
      
      if (claimContext.completedSteps && claimContext.completedSteps.length > 0) {
        enhancedSystemPrompt += `- Completed Steps: ${claimContext.completedSteps.join(', ')}\n`;
      }
    }

    enhancedSystemPrompt += `\n\nIMPORTANT GUIDELINES:
- Provide specific, actionable guidance
- Reference insurance policy terms and requirements
- Cite state laws or regulations when relevant
- Identify potential issues or red flags
- Suggest concrete next steps
- Use clear, professional language
- Focus on protecting the policyholder's rights
- Do not provide legal advice (suggest consulting an attorney when appropriate)
- Be concise but thorough`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: enhancedSystemPrompt
        },
        {
          role: 'user',
          content: userMessage
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const aiResponse = completion.choices[0].message.content;

    // Log usage (optional - for monitoring)
    console.log('Workflow Tool AI Request:', {
      toolId,
      userMessageLength: userMessage.length,
      responseLength: aiResponse.length,
      tokensUsed: completion.usage?.total_tokens || 0
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        response: aiResponse,
        toolId: toolId
      })
    };

  } catch (error) {
    console.error('Workflow Tool AI Error:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Failed to generate AI response',
        message: error.message
      })
    };
  }
};



