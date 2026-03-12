import OpenAI from 'openai'

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function analyzePolicyDocument(policyText: string) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: `You are an insurance policy analysis expert. Extract key information from insurance policies and return structured JSON.`
      },
      {
        role: 'user',
        content: `Analyze this insurance policy and extract:
1. Coverage triggers (what events are covered)
2. Documentation requirements (what proof is needed)
3. Proof of loss obligations (what the policyholder must provide)
4. Policy exclusions (what is NOT covered)
5. Common dispute risks (areas where claims are often challenged)

Policy text:
${policyText}

Return as JSON with keys: coverageTriggers (array), documentationRequirements (array), proofOfLossObligations (array), policyExclusions (array), disputeRisks (array)`
      }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  })

  return JSON.parse(completion.choices[0].message.content || '{}')
}

export async function analyzeEstimates(carrierEstimate: string, contractorEstimate?: string) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: `You are an insurance claim estimate analysis expert. Compare estimates and identify gaps, missing items, and pricing discrepancies.`
      },
      {
        role: 'user',
        content: `Analyze these estimates and identify:
1. Missing scope items in carrier estimate
2. Pricing discrepancies
3. Coverage trigger issues
4. Estimated gap amount

Carrier Estimate:
${carrierEstimate}

${contractorEstimate ? `Contractor Estimate:\n${contractorEstimate}` : ''}

Return as JSON with keys: carrierAmount (number), estimatedTrueScope (number), gapAmount (number), missingItems (array of strings), pricingIssues (array of strings), coverageIssues (array of strings)`
      }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  })

  return JSON.parse(completion.choices[0].message.content || '{}')
}

export async function generateClaimStrategy(claimData: any) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: `You are an insurance claim strategy advisor. Provide actionable recommendations for strengthening insurance claims.`
      },
      {
        role: 'user',
        content: `Based on this claim information, provide strategic recommendations:

Claim Type: ${claimData.claimType}
Carrier Position: ${claimData.carrierPosition || 'Unknown'}
Current Issues: ${JSON.stringify(claimData.issues || [])}

Provide:
1. Recommended evidence to gather
2. Documentation strategy
3. Response tactics
4. Timeline considerations

Return as JSON with keys: recommendedEvidence (array), documentationStrategy (string), responseTactics (array), timelineNotes (string)`
      }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.5,
  })

  return JSON.parse(completion.choices[0].message.content || '{}')
}
