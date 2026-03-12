import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { tacticName } = await request.json()

    if (!tacticName) {
      return NextResponse.json(
        { error: 'Tactic name is required' },
        { status: 400 }
      )
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are an expert insurance claims consultant who helps homeowners understand insurance denial tactics. Generate professional, authoritative, and informational content that explains insurance denial language.`,
        },
        {
          role: 'user',
          content: `Generate content for this insurance denial tactic: "${tacticName}"

Provide:
1. Short description (1-2 sentences explaining what this denial phrase means)
2. What it means (2-3 paragraphs explaining the insurer's argument in detail)
3. Why insurers use it (2-3 paragraphs explaining the adjuster's logic and motivation)
4. How to challenge it (2-3 paragraphs with specific documentation and evidence needed)
5. Common claim types (array of 3-5 claim types where this tactic appears, e.g., ["Roof Claims", "Water Damage", "Hail Damage"])
6. SEO meta description (150-160 characters)

Use professional, authoritative tone. Be informational, not promotional.

Return as JSON with keys: short_description, what_it_means, why_insurers_use_it, how_to_challenge, common_claim_types, seo_description`,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    })

    const content = JSON.parse(completion.choices[0].message.content || '{}')

    // Ensure all required fields are present
    const response = {
      short_description: content.short_description || '',
      what_it_means: content.what_it_means || '',
      why_insurers_use_it: content.why_insurers_use_it || '',
      how_to_challenge: content.how_to_challenge || '',
      common_claim_types: content.common_claim_types || [],
      seo_description: content.seo_description || '',
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Generate tactic content error:', error)
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    )
  }
}
