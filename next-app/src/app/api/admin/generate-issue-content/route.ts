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
2. What this means (2-3 paragraphs explaining the issue clearly)
3. Why it happens (2-3 paragraphs explaining why adjusters miss this)
4. Financial impact (explain financial impact with typical range like "$3,000 - $12,000")
5. Detection method (how homeowners can spot this in their estimate)
6. Repair example (typical cost range for this repair)
7. SEO meta description (150-160 characters)

Return as JSON with keys: short_description, what_this_means, why_it_happens, financial_impact, detection_method, repair_example, seo_description`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    })

    const content = JSON.parse(completion.choices[0].message.content || '{}')

    // Ensure all fields are present
    const response = {
      short_description: content.short_description || '',
      what_this_means: content.what_this_means || '',
      why_it_happens: content.why_it_happens || '',
      financial_impact: content.financial_impact || '',
      detection_method: content.detection_method || '',
      repair_example: content.repair_example || '',
      seo_description: content.seo_description || '',
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Content generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    )
  }
}
