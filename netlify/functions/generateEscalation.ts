import { Handler } from '@netlify/functions';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface EscalationRequest {
  type: string;
  claimInfo: string;
  language: string;
}

interface EscalationResponse {
  formalLetter: string;
  legalConsiderations: string;
  nextSteps: string;
  urgency: number;
}

const escalationPrompts = {
  'appraisal-demand': {
    en: 'Generate a formal appraisal demand letter for an insurance claim dispute. Include legal citations, policy language references, and specific demands for independent appraisal process.',
    es: 'Genera una carta formal de demanda de tasación para una disputa de reclamo de seguro. Incluye citas legales, referencias del lenguaje de la póliza y demandas específicas para el proceso de tasación independiente.'
  },
  'doi-complaint': {
    en: 'Create a Department of Insurance complaint letter. Include specific violations, regulatory citations, and formal complaint language while maintaining professional tone.',
    es: 'Crea una carta de queja al Departamento de Seguros. Incluye violaciones específicas, citas regulatorias y lenguaje de queja formal mientras mantienes un tono profesional.'
  },
  'bad-faith-notice': {
    en: 'Develop a bad faith insurance notice letter. Include specific examples of bad faith conduct, legal precedents, and formal notice requirements with potential legal consequences.',
    es: 'Desarrolla una carta de notificación de mala fe del seguro. Incluye ejemplos específicos de conducta de mala fe, precedentes legales y requisitos de notificación formal con consecuencias legales potenciales.'
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
    const { type, claimInfo, language = 'en' }: EscalationRequest = JSON.parse(event.body || '{}');

    if (!type || !escalationPrompts[type as keyof typeof escalationPrompts]) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid escalation type' })
      };
    }

    const escalationPrompt = escalationPrompts[type as keyof typeof escalationPrompts][language as 'en' | 'es'] || 
                            escalationPrompts[type as keyof typeof escalationPrompts].en;

    const systemPrompt = language === 'es' 
      ? `Eres un abogado especializado en seguros con experiencia en escalación de reclamos. Genera documentos legales profesionales en español para ayudar a los asegurados a escalar disputas de manera efectiva.`
      : `You are an insurance law attorney with expertise in claim escalation. Generate professional legal documents to help policyholders escalate disputes effectively.`;

    const userPrompt = `${escalationPrompt}

Claim Information: ${claimInfo}

Please provide:
1. A formal escalation letter (professional legal format)
2. Legal considerations and potential consequences
3. Recommended next steps and timeline
4. Urgency level (1-10) for the escalation

Format the response as JSON with the following structure:
{
  "formalLetter": "complete formal letter content",
  "legalConsiderations": "legal implications and considerations",
  "nextSteps": "recommended actions and timeline",
  "urgency": 8
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.6,
      max_tokens: 2500
    });

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    let parsedResponse: EscalationResponse;
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
        formalLetter: lines.find(line => line.toLowerCase().includes('letter') || line.toLowerCase().includes('formal')) || 
                     lines.slice(0, Math.ceil(lines.length / 3)).join('\n'),
        legalConsiderations: lines.find(line => line.toLowerCase().includes('legal') || line.toLowerCase().includes('consideration')) || 
                           lines.slice(Math.ceil(lines.length / 3), Math.ceil(2 * lines.length / 3)).join('\n'),
        nextSteps: lines.find(line => line.toLowerCase().includes('step') || line.toLowerCase().includes('next')) || 
                  lines.slice(Math.ceil(2 * lines.length / 3)).join('\n'),
        urgency: 7
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: parsedResponse,
        metadata: {
          type,
          language,
          timestamp: new Date().toISOString(),
          model: 'gpt-4'
        }
      })
    };

  } catch (error) {
    console.error('Error generating escalation notice:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Failed to generate escalation notice',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};
