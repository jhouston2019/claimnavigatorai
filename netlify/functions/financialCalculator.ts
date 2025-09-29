import { Handler } from '@netlify/functions';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Validation schema for financial calculator inputs
const FinancialCalculatorSchema = z.object({
  estimatedClaimValue: z.number().positive('Claim value must be positive'),
  insurerOffer: z.number().min(0, 'Insurer offer cannot be negative'),
  publicAdjusterFee: z.number().min(0).max(50, 'Public adjuster fee must be between 0-50%').default(10),
  attorneyFee: z.number().min(0).max(50, 'Attorney fee must be between 0-50%').default(33),
  outOfPocketExpenses: z.number().min(0, 'Out-of-pocket expenses cannot be negative').default(0),
});

interface CalculationResult {
  diy: {
    netRecovery: number;
    description: string;
  };
  withPublicAdjuster: {
    netRecovery: number;
    description: string;
    feeAmount: number;
    projectedIncrease: number;
  };
  withAttorney: {
    netRecovery: number;
    description: string;
    feeAmount: number;
    projectedIncrease: number;
  };
  recommendation: string;
  aiAnalysis: string;
}

export const handler: Handler = async (event) => {
  const startTime = Date.now();
  
  try {
    // Validate environment variables
    if (!process.env.OPENAI_API_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'OpenAI API key not configured' })
      };
    }

    if (!supabaseUrl || !supabaseKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Supabase configuration missing' })
      };
    }

    // Parse and validate request body
    let requestData;
    try {
      requestData = JSON.parse(event.body || '{}');
    } catch (parseError) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid JSON in request body' })
      };
    }

    const validationResult = FinancialCalculatorSchema.safeParse(requestData);
    if (!validationResult.success) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Invalid input data',
          details: validationResult.error.errors
        })
      };
    }

    const { 
      estimatedClaimValue, 
      insurerOffer, 
      publicAdjusterFee, 
      attorneyFee, 
      outOfPocketExpenses 
    } = validationResult.data;

    // Get user ID from headers or use default for development
    const userId = event.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';

    // Calculate the three scenarios
    const calculations = calculateScenarios(
      estimatedClaimValue,
      insurerOffer,
      publicAdjusterFee,
      attorneyFee,
      outOfPocketExpenses
    );

    // Generate AI analysis and recommendation
    const aiAnalysis = await generateAIAnalysis(calculations, {
      estimatedClaimValue,
      insurerOffer,
      publicAdjusterFee,
      attorneyFee,
      outOfPocketExpenses
    });

    // Save calculation to database
    const { error: insertError } = await supabase
      .from('financial_calcs')
      .insert({
        user_id: userId,
        inputs: {
          estimatedClaimValue,
          insurerOffer,
          publicAdjusterFee,
          attorneyFee,
          outOfPocketExpenses
        },
        result: {
          calculations,
          aiAnalysis,
          recommendation: calculations.recommendation
        }
      });

    if (insertError) {
      console.error('Error saving financial calculation:', insertError);
      // Don't fail the request, but log the error
    }

    const processingTime = Date.now() - startTime;

    // Generate structured response
    const response = {
      success: true,
      calculations,
      aiAnalysis,
      recommendation: calculations.recommendation,
      processingTimeMs: processingTime,
      timestamp: new Date().toISOString()
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error('Financial Calculator Error:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error'
      })
    };
  }
};

function calculateScenarios(
  estimatedClaimValue: number,
  insurerOffer: number,
  publicAdjusterFee: number,
  attorneyFee: number,
  outOfPocketExpenses: number
): CalculationResult {
  // DIY Scenario - Accept insurer offer
  const diyNetRecovery = insurerOffer - outOfPocketExpenses;

  // Public Adjuster Scenario - Increase payout by 20-30%, minus fee
  const publicAdjusterIncrease = estimatedClaimValue * 0.25; // 25% average increase
  const publicAdjusterPayout = insurerOffer + publicAdjusterIncrease;
  const publicAdjusterFeeAmount = publicAdjusterPayout * (publicAdjusterFee / 100);
  const withPublicAdjusterNetRecovery = publicAdjusterPayout - publicAdjusterFeeAmount - outOfPocketExpenses;

  // Attorney Scenario - Increase payout by 40-60%, minus fee
  const attorneyIncrease = estimatedClaimValue * 0.5; // 50% average increase
  const attorneyPayout = insurerOffer + attorneyIncrease;
  const attorneyFeeAmount = attorneyPayout * (attorneyFee / 100);
  const withAttorneyNetRecovery = attorneyPayout - attorneyFeeAmount - outOfPocketExpenses;

  // Determine best option
  const scenarios = [
    { name: 'DIY', netRecovery: diyNetRecovery },
    { name: 'Public Adjuster', netRecovery: withPublicAdjusterNetRecovery },
    { name: 'Attorney', netRecovery: withAttorneyNetRecovery }
  ];

  const bestOption = scenarios.reduce((best, current) => 
    current.netRecovery > best.netRecovery ? current : best
  );

  let recommendation = '';
  if (bestOption.name === 'DIY') {
    recommendation = 'Based on your inputs, accepting the insurer offer (DIY) provides the best net recovery.';
  } else if (bestOption.name === 'Public Adjuster') {
    recommendation = 'Based on your inputs, hiring a public adjuster provides the best ROI with a projected net recovery increase.';
  } else {
    recommendation = 'Based on your inputs, hiring an attorney provides the best ROI with a projected net recovery increase.';
  }

  return {
    diy: {
      netRecovery: diyNetRecovery,
      description: 'Accept insurer offer without professional help'
    },
    withPublicAdjuster: {
      netRecovery: withPublicAdjusterNetRecovery,
      description: 'Hire public adjuster to negotiate higher settlement',
      feeAmount: publicAdjusterFeeAmount,
      projectedIncrease: publicAdjusterIncrease
    },
    withAttorney: {
      netRecovery: withAttorneyNetRecovery,
      description: 'Hire attorney for legal representation and negotiation',
      feeAmount: attorneyFeeAmount,
      projectedIncrease: attorneyIncrease
    },
    recommendation,
    aiAnalysis: '' // Will be filled by AI analysis
  };
}

async function generateAIAnalysis(
  calculations: CalculationResult,
  inputs: {
    estimatedClaimValue: number;
    insurerOffer: number;
    publicAdjusterFee: number;
    attorneyFee: number;
    outOfPocketExpenses: number;
  }
): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a financial advisor specializing in insurance claims. Analyze the financial scenarios and provide a comprehensive recommendation.

CRITICAL REQUIREMENTS:
- Compare the three scenarios (DIY, Public Adjuster, Attorney)
- Explain the financial implications of each option
- Provide specific dollar amounts and ROI calculations
- Consider risk factors and potential outcomes
- Give clear, actionable recommendations
- Include disclaimer that this is AI-estimated analysis, not financial advice

ANALYSIS STRUCTURE:
1. Financial Summary
2. Scenario Comparison
3. Risk Assessment
4. Recommendation
5. Next Steps

QUALITY STANDARDS:
- Be specific with dollar amounts
- Explain the value proposition of each option
- Consider the user's specific situation
- Maintain professional, objective tone`
        },
        {
          role: 'user',
          content: `Analyze these insurance claim financial scenarios:

INPUTS:
- Estimated Claim Value: $${inputs.estimatedClaimValue.toLocaleString()}
- Insurer Offer: $${inputs.insurerOffer.toLocaleString()}
- Public Adjuster Fee: ${inputs.publicAdjusterFee}%
- Attorney Fee: ${inputs.attorneyFee}%
- Out-of-Pocket Expenses: $${inputs.outOfPocketExpenses.toLocaleString()}

CALCULATED SCENARIOS:
- DIY Net Recovery: $${calculations.diy.netRecovery.toLocaleString()}
- Public Adjuster Net Recovery: $${calculations.withPublicAdjuster.netRecovery.toLocaleString()}
- Attorney Net Recovery: $${calculations.withAttorney.netRecovery.toLocaleString()}

Provide a comprehensive financial analysis and recommendation.`
        }
      ],
      max_tokens: 2000,
      temperature: 0.3
    });

    return completion.choices[0]?.message?.content || 'AI analysis unavailable';
  } catch (error) {
    console.error('OpenAI API error:', error);
    return 'AI analysis temporarily unavailable. Please consult with a financial advisor for personalized guidance.';
  }
}
