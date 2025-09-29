import { Handler } from '@netlify/functions';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface NegotiationRequest {
  scenario: string;
  details: string;
  language: string;
}

interface NegotiationResponse {
  phoneScript: string;
  emailDraft: string;
  keyPoints: string;
  confidence: number;
}

const scenarioPrompts = {
  'delay-followup': {
    en: 'Generate a professional phone script and email draft for following up on a delayed insurance claim response. Focus on being firm but respectful, emphasizing timelines and policy requirements.',
    es: 'Genera un guión telefónico profesional y un borrador de correo electrónico para hacer seguimiento a una respuesta retrasada de reclamo de seguro. Enfócate en ser firme pero respetuoso, enfatizando cronogramas y requisitos de póliza.'
  },
  'lowball-counter': {
    en: 'Create a negotiation script for countering a low settlement offer. Include specific tactics for presenting evidence, calculating fair value, and maintaining professional tone while being assertive.',
    es: 'Crea un guión de negociación para contrarrestar una oferta de liquidación baja. Incluye tácticas específicas para presentar evidencia, calcular valor justo y mantener un tono profesional mientras eres asertivo.'
  },
  'denial-challenge': {
    en: 'Develop a script for challenging an insurance claim denial. Focus on policy language, coverage analysis, and legal precedents while maintaining a professional approach.',
    es: 'Desarrolla un guión para desafiar la negación de un reclamo de seguro. Enfócate en el lenguaje de la póliza, análisis de cobertura y precedentes legales mientras mantienes un enfoque profesional.'
  },
  'payment-demand': {
    en: 'Create a formal payment demand script and email. Include specific amounts, deadlines, and consequences for non-payment while maintaining professional communication.',
    es: 'Crea un guión de demanda de pago formal y correo electrónico. Incluye montos específicos, plazos y consecuencias por falta de pago mientras mantienes comunicación profesional.'
  }
};

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
    const { scenario, details, language = 'en' }: NegotiationRequest = JSON.parse(event.body || '{}');

    if (!scenario || !scenarioPrompts[scenario as keyof typeof scenarioPrompts]) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid scenario type' })
      };
    }

    const scenarioPrompt = scenarioPrompts[scenario as keyof typeof scenarioPrompts][language as 'en' | 'es'] || 
                          scenarioPrompts[scenario as keyof typeof scenarioPrompts].en;

    const systemPrompt = language === 'es' 
      ? `Eres un experto en negociación de reclamos de seguros. Genera contenido profesional en español para ayudar a los asegurados a negociar efectivamente con sus compañías de seguros.`
      : `You are an expert insurance claim negotiation specialist. Generate professional content to help policyholders negotiate effectively with their insurance companies.`;

    const userPrompt = `${scenarioPrompt}

Claim Details: ${details}

Please provide:
1. A professional phone script (3-5 minutes conversation)
2. A formal email draft
3. Key negotiation points and tactics
4. Confidence level (1-10) for the approach

Format the response as JSON with the following structure:
{
  "phoneScript": "detailed phone conversation script",
  "emailDraft": "professional email content",
  "keyPoints": "bullet points of key negotiation tactics",
  "confidence": 8
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    let parsedResponse: NegotiationResponse;
    try {
      // Try to parse JSON response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      // Fallback: create structured response from text
      const lines = response.split('\n').filter(line => line.trim());
      parsedResponse = {
        phoneScript: lines.find(line => line.toLowerCase().includes('phone') || line.toLowerCase().includes('call')) || 
                    lines.slice(0, Math.ceil(lines.length / 3)).join('\n'),
        emailDraft: lines.find(line => line.toLowerCase().includes('email') || line.toLowerCase().includes('message')) || 
                   lines.slice(Math.ceil(lines.length / 3), Math.ceil(2 * lines.length / 3)).join('\n'),
        keyPoints: lines.find(line => line.toLowerCase().includes('key') || line.toLowerCase().includes('point')) || 
                  lines.slice(Math.ceil(2 * lines.length / 3)).join('\n'),
        confidence: 7
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: parsedResponse,
        metadata: {
          scenario,
          language,
          timestamp: new Date().toISOString(),
          model: 'gpt-4'
        }
      })
    };

  } catch (error) {
    console.error('Error generating negotiation script:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Failed to generate negotiation script',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};
