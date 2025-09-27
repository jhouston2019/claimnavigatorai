const { createClient } = require('@supabase/supabase-js');
const { z } = require('zod');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Input validation schema
const AdvisoryInputSchema = z.object({
  claimStage: z.enum(['Filed', 'Under Review', 'Denied', 'Offer Made', 'Delayed', 'Disputed', 'Settlement Pending']),
  insurerBehavior: z.array(z.enum(['Delayed response', 'Denied', 'Lowball offer', 'Misapplied exclusion', 'Requested excessive docs', 'Offered quick payout'])).min(1),
  claimType: z.enum(['Property', 'Auto', 'Health', 'Business Interruption', 'Other']),
  userConcern: z.string().min(10).max(1000),
  state: z.string().optional(),
  lang: z.enum(['en', 'es'])
});

exports.handler = async (event, context) => {
  try {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }

    // Extract authorization header
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing Authorization header' })
      };
    }

    // Extract token from Bearer format
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token || token.length === 0) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid token format' })
      };
    }

    // Verify token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Authentication failed' })
      };
    }

    // Parse and validate request body
    let requestData;
    try {
      requestData = JSON.parse(event.body);
    } catch (parseError) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid JSON in request body' })
      };
    }

    // Validate input with Zod
    const validationResult = AdvisoryInputSchema.safeParse(requestData);
    if (!validationResult.success) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Invalid input data',
          details: validationResult.error.errors
        })
      };
    }

    const inputData = validationResult.data;

    // Check Stripe limits (2 free per month for non-subscribers)
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('subscription_status')
      .eq('id', user.id)
      .single();

    const isSubscriber = userProfile?.subscription_status === 'active';

    if (!isSubscriber) {
      // Check monthly usage for free users
      const { data: monthlyUsage } = await supabase
        .from('advisories')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', `${currentMonth}-01T00:00:00Z`)
        .lt('created_at', `${currentMonth}-31T23:59:59Z`);

      if (monthlyUsage && monthlyUsage.length >= 2) {
        return {
          statusCode: 429,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            error: 'Monthly limit reached',
            message: 'Free users are limited to 2 advisories per month. Please upgrade for unlimited access.'
          })
        };
      }
    }

    // Build AI prompt based on language
    const systemPrompt = inputData.lang === 'es' 
      ? `Eres un asesor de reclamos de seguros. Dada esta situación, proporciona:
1. Próximos Pasos (1-2 acciones inmediatas que el asegurado debe tomar).
2. Razonamiento (por qué estos pasos importan).
3. Herramienta Recomendada del Navegador (una de: Proof of Loss, Appeal Letter, Demand Letter, Notice of Delay, ROM Estimator, Policy Analyzer).
La salida debe ser en lenguaje claro, estructurada en Markdown con encabezados.
Termina con el descargo de responsabilidad: "Este consejo fue generado por IA y no constituye asesoría legal."`
      : `You are an insurance claims advisor. Given this situation, provide:
1. Next Steps (1-2 immediate actions the policyholder should take).
2. Reasoning (why these steps matter).
3. Recommended Navigator Tool (one of: Proof of Loss, Appeal Letter, Demand Letter, Notice of Delay, ROM Estimator, Policy Analyzer).
Output must be plain-language, structured in Markdown with headings.
End with disclaimer: "This advisory is AI-generated and not legal advice."`;

    const userPrompt = inputData.lang === 'es'
      ? `Situación del Reclamo:
- Etapa: ${inputData.claimStage}
- Comportamiento del Asegurador: ${inputData.insurerBehavior.join(', ')}
- Tipo de Reclamo: ${inputData.claimType}
- Preocupación del Usuario: ${inputData.userConcern}
${inputData.state ? `- Estado: ${inputData.state}` : ''}`
      : `Claim Situation:
- Stage: ${inputData.claimStage}
- Insurer Behavior: ${inputData.insurerBehavior.join(', ')}
- Claim Type: ${inputData.claimType}
- User Concern: ${inputData.userConcern}
${inputData.state ? `- State: ${inputData.state}` : ''}`;

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.4,
        max_tokens: 800
      })
    });

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const openaiData = await openaiResponse.json();
    const adviceText = openaiData.choices[0].message.content;

    // Convert markdown to HTML for display
    const adviceHtml = adviceText
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');

    // Extract recommended tool from the advice text
    const toolMatch = adviceText.match(/Recommended Navigator Tool[:\s]*(.*?)(?:\n|$)/i) || 
                     adviceText.match(/Herramienta Recomendada[:\s]*(.*?)(?:\n|$)/i);
    const recommendedTool = toolMatch ? toolMatch[1].trim() : 'Document Generator';

    // Store result in Supabase
    const { error: insertError } = await supabase
      .from('advisories')
      .insert({
        user_id: user.id,
        input_json: inputData,
        output_json: {
          adviceText,
          adviceHtml,
          recommendedTool
        },
        lang: inputData.lang
      });

    if (insertError) {
      console.error('Error storing advisory:', insertError);
      // Continue execution even if storage fails
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        adviceHtml,
        recommendedTool
      })
    };

  } catch (error) {
    console.error('Error in getAdvisory:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    };
  }
};
