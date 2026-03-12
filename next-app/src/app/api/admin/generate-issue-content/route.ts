import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const { issueName } = await request.json()

    if (!issueName) {
      return NextResponse.json(
        { error: 'Issue name required' },
        { status: 400 }
      )
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are an insurance claim expert writing educational content about common estimate issues. Write in a professional, authoritative tone that helps homeowners understand why their estimates may be too low.`
        },
        {
          role: 'user',
          content: `Generate content for this insurance estimate issue: "${issueName}"

Provide:
1. Short description (1-2 sentences for preview)
2. Why it happens (2-3 paragraphs explaining why adjusters miss this)
3. Cost impact (explain financial impact with typical range)
4. Detection method (how homeowners can spot this in their estimate)
5. Repair example (typical cost range for this repair)
6. SEO meta description (150-160 characters)

Return as JSON with keys: short_description, why_it_happens, cost_impact, detection_method, repair_example, seo_description`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    })

    const content = JSON.parse(completion.choices[0].message.content || '{}')

    return NextResponse.json(content)
  } catch (error) {
    console.error('Content generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    )
  }
}
