import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { issueSlug } = await request.json()

    if (!issueSlug) {
      return NextResponse.json(
        { error: 'Issue slug required' },
        { status: 400 }
      )
    }

    // Track analytics event
    await supabaseAdmin.from('analytics_events').insert({
      event_type: 'issue_page_cta_clicked',
      metadata: { issue_slug: issueSlug },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Track click error:', error)
    return NextResponse.json(
      { error: 'Failed to track click' },
      { status: 500 }
    )
  }
}
