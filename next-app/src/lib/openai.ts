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

export async function runLimitedEstimateAnalysis(estimateText: string) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: `You are an insurance estimate analyzer. Provide a LIMITED diagnostic scan that identifies potential issues but withholds detailed analysis to encourage upgrade.`
      },
      {
        role: 'user',
        content: `Analyze this insurance estimate and provide a LIMITED diagnostic scan:

Estimate:
${estimateText}

Provide:
1. Carrier estimate total value (extract from document)
2. Estimated true scope range (low and high estimates)
3. Potential gap range (low and high)
4. Top 3-5 detected issues (show only the most obvious ones)
5. Carrier tactics detected (phrases like "wear and tear", "pre-existing", etc.)
6. Claim severity score (0-100, where higher = more likely underpaid)
7. Timeline risk assessment (estimate days in claim, risk level)

Return as JSON with keys: 
- carrierEstimateValue (number)
- estimatedScopeRange (object: {low: number, high: number})
- potentialGapLow (number)
- potentialGapHigh (number)
- detectedIssues (array of 3-5 strings - only show most obvious)
- detectedCarrierTactics (array of objects: {tactic: string, explanation: string})
- claimSeverityScore (number 0-100)
- timelineRisk (object: {daysInClaim: number, riskLevel: string, message: string})`
      }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.4,
  })

  return JSON.parse(completion.choices[0].message.content || '{}')
}

export async function detectUnderpayment(data: {
  carrierText: string
  contractorText?: string
  policyText?: string
  hasPhotos: boolean
}) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: `You are an insurance claim underpayment detection expert. Analyze all provided documents to calculate potential underpayment and identify documentation gaps.`
      },
      {
        role: 'user',
        content: `Analyze this insurance claim for potential underpayment:

Carrier Estimate:
${data.carrierText}

${data.contractorText ? `Contractor Estimate:\n${data.contractorText}` : ''}

${data.policyText ? `Policy Information:\n${data.policyText}` : ''}

${data.hasPhotos ? 'Damage photos provided: Yes' : 'Damage photos provided: No'}

Provide comprehensive analysis including:
1. Carrier estimate amount
2. Estimated true scope amount
3. Underpayment range (low and high estimates)
4. Confidence level (High/Medium/Low)
5. Missing scope items
6. Labor rate issues
7. Documentation gaps
8. Coverage issues
9. Recommended actions (prioritized list)

Return as JSON with keys: carrierEstimate (number), estimatedTrueScope (number), underpaymentRange (object with low and high), confidence (string), missingItems (array), laborRateIssues (array), documentationGaps (array), coverageIssues (array), recommendedActions (array)`
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
